import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const WA_API = "https://graph.facebook.com/v19.0";

type SendResult = { ok: boolean; mensajeId?: string; error?: string };

async function sendTemplate(
  telefono: string,
  nombre: string,
  ciudad: string,
  templateName: string,
  phoneId: string,
  token: string,
): Promise<SendResult> {
  const tel = telefono.replace(/\D/g, "");

  const res = await fetch(`${WA_API}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: tel,
      type: "template",
      template: {
        name: templateName,
        language: { code: "es_AR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: nombre },
              { type: "text", text: ciudad },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json() as {
    messages?: { id: string }[];
    error?: { message: string };
  };

  if (!res.ok || data.error) {
    return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
  }
  return { ok: true, mensajeId: data.messages?.[0]?.id ?? "" };
}

// ── Enviar UN mensaje ─────────────────────────────────────────────────────
export const enviarMensaje = action({
  args: {
    prospectId: v.id("prospects"),
    templateName: v.string(),
    phoneId: v.string(),
  },
  handler: async (ctx, args): Promise<SendResult> => {
    const token = process.env.WA_TOKEN;
    if (!token) throw new Error("WA_TOKEN no configurado en Convex");

    const prospect = await ctx.runQuery(api.prospects.getById, { id: args.prospectId });
    if (!prospect) throw new Error("Prospecto no encontrado");
    if (!prospect.telefono) throw new Error("Prospecto sin teléfono");

    const result = await sendTemplate(
      prospect.telefono,
      prospect.nombre,
      prospect.ciudad,
      args.templateName,
      args.phoneId,
      token,
    );

    await ctx.runMutation(api.prospects.updateEstado, {
      id: args.prospectId,
      estado: result.ok ? "enviado" : "error",
      fechaEnvio: result.ok ? new Date().toISOString() : undefined,
      mensajeId: result.ok ? result.mensajeId : result.error,
    });

    return result;
  },
});

// ── Lanzar campaña ────────────────────────────────────────────────────────
export const lanzarCampana = action({
  args: {
    limite: v.number(),
    templateName: v.string(),
    phoneId: v.string(),
    delayMs: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ enviados: number; errores: number; total: number }> => {
    const token = process.env.WA_TOKEN;
    if (!token) throw new Error("WA_TOKEN no configurado. Ejecutá: npx convex env set WA_TOKEN 'tu_token'");

    const delay = args.delayMs ?? 3000;
    const pendientes = await ctx.runQuery(api.prospects.listByEstado, {
      estado: "pendiente",
      limite: args.limite,
    });

    if (pendientes.length === 0) return { enviados: 0, errores: 0, total: 0 };

    let enviados = 0;
    let errores = 0;

    for (const p of pendientes) {
      if (!p.telefono) { errores++; continue; }

      const result = await sendTemplate(
        p.telefono,
        p.nombre,
        p.ciudad,
        args.templateName,
        args.phoneId,
        token,
      );

      await ctx.runMutation(api.prospects.updateEstado, {
        id: p._id,
        estado: result.ok ? "enviado" : "error",
        fechaEnvio: result.ok ? new Date().toISOString() : undefined,
        mensajeId: result.ok ? result.mensajeId : result.error,
      });

      if (result.ok) enviados++;
      else errores++;

      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    }

    return { enviados, errores, total: pendientes.length };
  },
});

// ── Config de campaña ─────────────────────────────────────────────────────
export const saveConfig = mutation({
  args: {
    templateName: v.string(),
    phoneId: v.string(),
    limiteDiario: v.number(),
    delayMs: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("campanaConfig").first();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert("campanaConfig", args);
  },
});

export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("campanaConfig").first();
  },
});
