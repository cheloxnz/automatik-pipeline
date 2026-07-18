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

  const components: object[] = [
    {
      type: "body",
      parameters: [
        { type: "text", text: nombre },
        { type: "text", text: ciudad },
      ],
    },
  ];

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
        language: { code: "es" },
        components,
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

    if (result.ok) {
      await ctx.runMutation(api.prospects.guardarMensaje, {
        telefono: prospect.telefono!,
        prospectId: args.prospectId,
        texto: `[Template: ${args.templateName}] Hola ${prospect.nombre}! Vi el negocio que tienen en ${prospect.ciudad}...`,
        tipo: "saliente",
      });
    }

    return result;
  },
});

// ── Helper: enviar un lote de prospectos ──────────────────────────────────
async function enviarLoteInterno(
  ctx: { runQuery: Function; runMutation: Function },
  limite: number,
  templateName: string,
  phoneId: string,
  token: string,
  delayMs: number,
  nichosFilter?: string[],
  paisesFilter?: string[],
): Promise<{ enviados: number; errores: number; total: number }> {
  const pendientes = await ctx.runQuery(api.prospects.listByEstadoFiltrado, {
    estado: "pendiente",
    limite,
    nichos: nichosFilter ?? [],
    paises: paisesFilter ?? [],
  });

  if (pendientes.length === 0) return { enviados: 0, errores: 0, total: 0 };

  let enviados = 0;
  let errores = 0;

  for (const p of pendientes) {
    if (!p.telefono) { errores++; continue; }

    // Saltar números fijos argentinos — AR celular = 54 + 9 + área + número = 13 dígitos
    // Para otros países no aplicar este filtro (cada país tiene longitud distinta)
    const digits = p.telefono.replace(/\D/g, "");
    const isArgentina = digits.startsWith("54");
    if (isArgentina && digits.length < 13) {
      await ctx.runMutation(api.prospects.updateEstado, {
        id: p._id,
        estado: "error",
        mensajeId: "numero_fijo_sin_whatsapp",
      });
      errores++;
      continue;
    }
    // Descartar números muy cortos sin importar el país
    if (digits.length < 10) {
      await ctx.runMutation(api.prospects.updateEstado, {
        id: p._id,
        estado: "error",
        mensajeId: "numero_invalido",
      });
      errores++;
      continue;
    }

    const result = await sendTemplate(p.telefono, p.nombre, p.ciudad, templateName, phoneId, token);

    await ctx.runMutation(api.prospects.updateEstado, {
      id: p._id,
      estado: result.ok ? "enviado" : "error",
      fechaEnvio: result.ok ? new Date().toISOString() : undefined,
      mensajeId: result.ok ? result.mensajeId : result.error,
    });

    if (result.ok) {
      enviados++;
      await ctx.runMutation(api.prospects.guardarMensaje, {
        telefono: p.telefono,
        prospectId: p._id,
        texto: `[Template: ${templateName}] Hola ${p.nombre}! Vi el negocio que tienen en ${p.ciudad}...`,
        tipo: "saliente",
      });
    } else {
      errores++;
    }

    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  return { enviados, errores, total: pendientes.length };
}

// ── Lanzar campaña manual ─────────────────────────────────────────────────
export const lanzarCampana = action({
  args: {
    limite: v.number(),
    templateName: v.string(),
    phoneId: v.string(),
    delayMs: v.optional(v.number()),
    nichosFilter: v.optional(v.array(v.string())),
    paisesFilter: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<{ enviados: number; errores: number; total: number }> => {
    const token = process.env.WA_TOKEN;
    if (!token) throw new Error("WA_TOKEN no configurado. Ejecutá: npx convex env set WA_TOKEN 'tu_token'");
    return enviarLoteInterno(ctx, args.limite, args.templateName, args.phoneId, token, args.delayMs ?? 3000, args.nichosFilter, args.paisesFilter);
  },
});

// ── Enviar lote automático (llamado por el cron) ──────────────────────────
export const enviarLoteCron = action({
  args: {},
  handler: async (ctx): Promise<{ skip: boolean; enviados?: number; errores?: number }> => {
    // Solo enviar entre 13:00 y 23:00 UTC (10am-8pm Argentina UTC-3)
    const hora = new Date().getUTCHours();
    if (hora < 13 || hora >= 23) return { skip: true };

    const token = process.env.WA_TOKEN;
    if (!token) return { skip: true };

    const config = await ctx.runQuery(api.whatsapp.getConfig);
    if (!config || !config.cronActivo) return { skip: true };

    // Contar cuántos se enviaron hoy (desde medianoche UTC-3)
    const hoyAR = new Date();
    hoyAR.setUTCHours(hoyAR.getUTCHours() - 3); // ajustar a AR
    const inicioHoy = hoyAR.toISOString().slice(0, 10) + "T00:00:00.000Z";
    const enviadosHoy = await ctx.runQuery(api.prospects.countEnviadosDesde, { desde: inicioHoy });
    const restantes = config.limiteDiario - enviadosHoy;
    if (restantes <= 0) return { skip: true };

    // 20 slots en 10 horas (cada 30 min) → limiteDiario / 20 por slot, sin pasar del restante
    const porSlot = Math.min(restantes, Math.max(1, Math.ceil(config.limiteDiario / 20)));

    const result = await enviarLoteInterno(
      ctx,
      porSlot,
      config.templateName,
      config.phoneId,
      token,
      config.delayMs,
      config.nichosFilter,
      config.paisesFilter,
    );

    return { skip: false, ...result };
  },
});

// ── Config de campaña ─────────────────────────────────────────────────────
export const saveConfig = mutation({
  args: {
    templateName: v.string(),
    phoneId: v.string(),
    limiteDiario: v.number(),
    delayMs: v.number(),
    nichosFilter: v.optional(v.array(v.string())),
    paisesFilter: v.optional(v.array(v.string())),
    cronActivo: v.optional(v.boolean()),
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
