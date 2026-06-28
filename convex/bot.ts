import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const WA_API = "https://graph.facebook.com/v19.0";

const MSG_PREGUNTA_NOMBRE =
  "Qué bueno! 😊 Para poder contarte mejor, ¿con quién tengo el gusto? (nombre y rol en el negocio)";

const MSG_PREGUNTA_DOLOR =
  "Perfecto {{nombre}}! Una última pregunta: ¿cuál es el mayor desafío que tienen hoy para conseguir clientes nuevos?";

const MSG_CIERRE =
  "Entendido! Marcelo te contacta en breve para contarte cómo podemos ayudarlos 🙌";

const MSG_PITCH =
  `Mientras tanto, te cuento un poco lo que hacemos en Automatik Media 👇

Ayudamos a negocios como el tuyo a crecer digitalmente con soluciones a medida:

🌐 Web profesional que realmente convierte visitas en clientes
📱 App web propia para gestionar turnos, pedidos o clientes
🤖 Automatizaciones que te ahorran horas de trabajo manual
📅 Sistema de agenda online integrado
📊 CRM simple para no perder ningún contacto
💬 Bots de WhatsApp como este para atender 24/7

Todo integrado, todo a medida, sin complicaciones técnicas.

Muchos negocios en tu zona ya están aprovechando esto para diferenciarse. ¿Te gustaría ser uno de ellos? 🚀`;

async function enviarTexto(telefono: string, texto: string, phoneId: string, token: string): Promise<void> {
  const tel = telefono.replace(/\D/g, "");
  await fetch(`${WA_API}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: tel,
      type: "text",
      text: { body: texto },
    }),
  });
}

// ── Obtener o crear conversación por teléfono ──────────────────────────────
export const getConversacion = query({
  args: { telefono: v.string() },
  handler: async (ctx, { telefono }) => {
    return await ctx.db
      .query("conversaciones")
      .withIndex("by_telefono", (q) => q.eq("telefono", telefono))
      .first();
  },
});

export const upsertConversacion = mutation({
  args: {
    telefono: v.string(),
    prospectId: v.optional(v.id("prospects")),
    step: v.number(),
    nombre: v.optional(v.string()),
    dolor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversaciones")
      .withIndex("by_telefono", (q) => q.eq("telefono", args.telefono))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        step: args.step,
        ...(args.nombre !== undefined ? { nombre: args.nombre } : {}),
        ...(args.dolor !== undefined ? { dolor: args.dolor } : {}),
        ...(args.prospectId !== undefined ? { prospectId: args.prospectId } : {}),
      });
    } else {
      await ctx.db.insert("conversaciones", {
        telefono: args.telefono,
        prospectId: args.prospectId,
        step: args.step,
        nombre: args.nombre,
        dolor: args.dolor,
        createdAt: Date.now(),
      });
    }
  },
});

// ── Procesar mensaje entrante — máquina de estados ─────────────────────────
export const procesarMensaje = action({
  args: {
    telefono: v.string(),
    texto: v.string(),
    mensajeId: v.string(),
  },
  handler: async (ctx, { telefono, texto, mensajeId }): Promise<void> => {
    const token = process.env.WA_TOKEN;
    const phoneId = process.env.WA_PHONE_ID ?? "1236307326213120";
    const adminPhone = process.env.ADMIN_PHONE; // tu número personal

    if (!token) return;

    // Buscar prospecto por teléfono
    const prospects = await ctx.runQuery(api.prospects.listByEstado, { estado: "enviado", limite: 500 });
    const telNorm = telefono.replace(/\D/g, "");
    const prospect = prospects.find((p) => {
      const t = (p.telefono ?? "").replace(/\D/g, "");
      return t === telNorm || t.endsWith(telNorm.slice(-8)) || telNorm.endsWith(t.slice(-8));
    });

    // Obtener conversación actual
    const conv = await ctx.runQuery(api.bot.getConversacion, { telefono });
    const step = conv?.step ?? 0;

    const pid = prospect?._id;

    // Helper: guardar mensaje en historial
    const guardar = async (t: string, tipo: "entrante" | "saliente") => {
      await ctx.runMutation(api.prospects.guardarMensaje, {
        telefono, prospectId: pid, texto: t, tipo,
      });
    };

    if (step === 0) {
      await guardar(texto, "entrante");
      await enviarTexto(telefono, MSG_PREGUNTA_NOMBRE, phoneId, token);
      await guardar(MSG_PREGUNTA_NOMBRE, "saliente");
      await ctx.runMutation(api.bot.upsertConversacion, { telefono, prospectId: pid, step: 1 });
      if (prospect) {
        await ctx.runMutation(api.prospects.updateEstado, { id: prospect._id, estado: "respondio", mensajeId });
      }

    } else if (step === 1) {
      const nombre = texto.trim().split("\n")[0].slice(0, 60);
      const msgDolor = MSG_PREGUNTA_DOLOR.replace("{{nombre}}", nombre.split(" ")[0]);
      await guardar(texto, "entrante");
      await enviarTexto(telefono, msgDolor, phoneId, token);
      await guardar(msgDolor, "saliente");
      await ctx.runMutation(api.bot.upsertConversacion, { telefono, step: 2, nombre });

    } else if (step === 2) {
      const dolor = texto.trim().slice(0, 200);
      const nombre = conv?.nombre ?? "";
      await guardar(texto, "entrante");

      await enviarTexto(telefono, MSG_CIERRE, phoneId, token);
      await guardar(MSG_CIERRE, "saliente");
      await new Promise((r) => setTimeout(r, 2500));
      await enviarTexto(telefono, MSG_PITCH, phoneId, token);
      await guardar(MSG_PITCH, "saliente");

      await ctx.runMutation(api.bot.upsertConversacion, { telefono, step: 3, dolor });

      if (prospect) {
        await ctx.runMutation(api.prospects.update, {
          id: prospect._id,
          notas: `[Bot] Contacto: ${nombre} | Dolor: ${dolor}`,
          estado: "respondio",
        });
      }

      if (adminPhone) {
        const alerta =
          `🔔 *Nuevo lead calificado!*\n\n` +
          `🏢 *Negocio:* ${prospect?.nombre ?? "Desconocido"} (${prospect?.ciudad ?? ""})\n` +
          `👤 *Contacto:* ${nombre}\n` +
          `💬 *Su dolor:* "${dolor}"\n` +
          `📱 *Tel:* +${telNorm}`;
        await enviarTexto(adminPhone, alerta, phoneId, token);
      }
    }
    // step 3 = completado, no responder más
  },
});
