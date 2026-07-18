import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const WA_API = "https://graph.facebook.com/v19.0";

async function enviarWA(telefono: string, texto: string, phoneId: string, token: string) {
  await fetch(`${WA_API}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: telefono.replace(/\D/g, ""),
      type: "text",
      text: { body: texto },
    }),
  });
}

// ── Queries ───────────────────────────────────────────────────────────────
export const listActivos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("recordatorios")
      .withIndex("by_estado", (q) => q.eq("estado", "activo"))
      .collect();
  },
});

export const listPendientes = query({
  args: {},
  handler: async (ctx) => {
    const activos = await ctx.db
      .query("recordatorios")
      .withIndex("by_estado", (q) => q.eq("estado", "activo"))
      .collect();
    const pendientes = await ctx.db
      .query("recordatorios")
      .withIndex("by_estado", (q) => q.eq("estado", "pendiente"))
      .collect();
    return [...activos, ...pendientes].sort((a, b) => a.fechaMs - b.fechaMs);
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────
export const crear = mutation({
  args: {
    prospectId: v.id("prospects"),
    prospectNombre: v.string(),
    prospectTelefono: v.optional(v.string()),
    nota: v.optional(v.string()),
    fechaMs: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recordatorios", {
      ...args,
      estado: "pendiente",
      avisoPrevioEnviado: false,
      avisoEnviado: false,
      createdAt: Date.now(),
    });
  },
});

export const cerrar = mutation({
  args: { id: v.id("recordatorios") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { estado: "cerrado" });
  },
});

export const marcarAvisoPrevio = mutation({
  args: { id: v.id("recordatorios") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { avisoPrevioEnviado: true });
  },
});

export const activar = mutation({
  args: { id: v.id("recordatorios") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { estado: "activo", avisoEnviado: true });
  },
});

// ── Cron action ───────────────────────────────────────────────────────────
export const chequearRecordatorios = action({
  args: {},
  handler: async (ctx): Promise<void> => {
    const token = process.env.WA_TOKEN;
    const phoneId = process.env.WA_PHONE_ID ?? "1236307326213120";
    const adminPhone = process.env.ADMIN_PHONE;
    if (!token || !adminPhone) return;

    const ahora = Date.now();
    // Argentina UTC-3
    const ahoraAR = ahora - 3 * 60 * 60 * 1000;
    const mananaInicioAR = ahoraAR + 24 * 60 * 60 * 1000;

    const pendientes = await ctx.runQuery(api.recordatorios.listPendientes);

    for (const rec of pendientes) {
      // Aviso previo: si falta menos de 24hs y aún no se envió
      if (
        !rec.avisoPrevioEnviado &&
        rec.fechaMs - ahora < 24 * 60 * 60 * 1000 &&
        rec.fechaMs > ahora
      ) {
        const fecha = new Date(rec.fechaMs).toLocaleDateString("es-AR", {
          weekday: "long", day: "numeric", month: "long",
          timeZone: "America/Argentina/Buenos_Aires",
        });
        const hora = new Date(rec.fechaMs).toLocaleTimeString("es-AR", {
          hour: "2-digit", minute: "2-digit",
          timeZone: "America/Argentina/Buenos_Aires",
        });
        const msg =
          `📅 *Recordatorio para mañana*\n\n` +
          `Contactar a *${rec.prospectNombre}*\n` +
          (rec.prospectTelefono ? `📱 +${rec.prospectTelefono.replace(/\D/g,"")}\n` : "") +
          (rec.nota ? `📝 ${rec.nota}\n` : "") +
          `\n🕐 ${fecha} a las ${hora}`;
        await enviarWA(adminPhone, msg, phoneId, token);
        await ctx.runMutation(api.recordatorios.marcarAvisoPrevio, { id: rec._id });
      }

      // Aviso del día: si ya llegó la hora y aún no se activó
      if (!rec.avisoEnviado && rec.fechaMs <= ahora) {
        const msg =
          `🔔 *¡Hoy toca contactar a ${rec.prospectNombre}!*\n\n` +
          (rec.prospectTelefono ? `📱 +${rec.prospectTelefono.replace(/\D/g,"")}\n` : "") +
          (rec.nota ? `📝 ${rec.nota}\n` : "") +
          `\n_Cerrá el recordatorio desde el dashboard cuando lo hagas._`;
        await enviarWA(adminPhone, msg, phoneId, token);
        await ctx.runMutation(api.recordatorios.activar, { id: rec._id });
      }
    }
  },
});
