import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const searchProspectos = query({
  args: { q: v.string(), estado: v.optional(v.string()) },
  handler: async (ctx, { q, estado }) => {
    if (!q) return [];
    let query = ctx.db.query("prospects").withSearchIndex("search_nombre", (s) => {
      const base = s.search("nombre", q);
      return estado && estado !== "todos" ? base.eq("estado", estado) : base;
    });
    return await query.take(50);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prospects").order("desc").take(500);
  },
});

export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator, estado: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.estado && args.estado !== "todos") {
      return await ctx.db.query("prospects")
        .withIndex("by_estado", (q) => q.eq("estado", args.estado!))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    // Sin filtro: solo mostrar no-pendientes + primeros pendientes para no leer toda la tabla
    return await ctx.db.query("prospects")
      .withIndex("by_createdAt")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const recent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prospects").order("desc").take(20);
  },
});

const PAISES_CONOCIDOS = [
  "Argentina", "Uruguay", "Chile", "Paraguay", "Bolivia",
  "Peru", "Ecuador", "Colombia", "Mexico", "Venezuela",
  "Brasil", "Panama", "Costa Rica", "Guatemala", "Honduras",
  "España",
];

export const enviosPorDia = query({
  args: {},
  handler: async (ctx) => {
    // Cuenta prospectos contactados por fechaEnvio — solo el mensaje inicial de campaña
    const [env, resp, noint, cerr, err] = await Promise.all([
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "enviado")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "respondio")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "no_interesado")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "cerrado")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "error")).collect(),
    ]);
    const todos = [...env, ...resp, ...noint, ...cerr, ...err].filter(p => p.fechaEnvio);

    const counts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      counts[d.toISOString().slice(0, 10)] = 0;
    }
    for (const p of todos) {
      const key = new Date(p.fechaEnvio!).toISOString().slice(0, 10);
      if (key in counts) counts[key]++;
    }
    const vals = Object.values(counts);
    const hoy = vals[vals.length - 1];
    const ultimos7 = vals.slice(-7).reduce((a, b) => a + b, 0);
    const ultimos30 = vals.reduce((a, b) => a + b, 0);
    return { spark: vals.slice(-15), hoy, ultimos7, ultimos30 };
  },
});

const NICHOS_CONOCIDOS = [
  "Spa", "Peluquería", "Estética", "Veterinaria", "Fotografía",
  "Gym", "Dental", "Psicología", "Lavandería", "Panadería",
  "Inmobiliaria", "Restaurante", "Arquitectura", "Ferretería", "Mecánica",
  "Joyería", "Agencia de marketing inmobiliario",
];

// Lee del cache — 1 doc read
export const statsByNicho = query({
  args: {},
  handler: async (ctx) => {
    const cache = await ctx.db.query("statsCache").first();
    if (cache?.byNicho) return JSON.parse(cache.byNicho) as { nicho: string; total: number; contactados: number }[];
    return [];
  },
});

// Lee del cache — 1 doc read
export const statsByPais = query({
  args: {},
  handler: async (ctx) => {
    const cache = await ctx.db.query("statsCache").first();
    if (cache?.byPais) return JSON.parse(cache.byPais) as { pais: string; total: number }[];
    return [];
  },
});

export const byEstado = query({
  args: { estado: v.string() },
  handler: async (ctx, { estado }) => {
    return await ctx.db
      .query("prospects")
      .withIndex("by_estado", (q) => q.eq("estado", estado))
      .collect();
  },
});

// Lee del cache — 1 doc read en vez de miles
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const cache = await ctx.db.query("statsCache").first();
    if (cache) {
      const nE = cache.enviados;
      const nR = cache.respondieron;
      const nNI = cache.noInteresados;
      const nC = cache.cerrados;
      const total = cache.pendientes + nE + nR + nNI + nC + cache.errores;
      return {
        total, enviados: nE, respondieron: nR + nNI,
        noInteresados: nNI, cerrados: nC, errores: cache.errores, pendientes: cache.pendientes,
        ingresoReal: cache.ingresoReal, ticketPromedio: nC > 0 ? Math.round(cache.ingresoReal / nC) : 0,
        tasaRespuesta: nE > 0 ? Math.round((nR / nE) * 100) : 0,
        tasaConversion: nE > 0 ? Math.round((nC / nE) * 100) : 0,
      };
    }
    // Fallback: calcular desde cero si no hay cache aún
    const [pend, env, resp, noint, cerr, err] = await Promise.all([
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "pendiente")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "enviado")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "respondio")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "no_interesado")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "cerrado")).collect(),
      ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "error")).collect(),
    ]);
    const ingresoReal = cerr.reduce((s, p) => s + (p.monto ?? 0), 0);
    return {
      total: pend.length + env.length + resp.length + noint.length + cerr.length + err.length,
      enviados: env.length, respondieron: resp.length + noint.length,
      noInteresados: noint.length, cerrados: cerr.length, errores: err.length, pendientes: pend.length,
      ingresoReal, ticketPromedio: cerr.length > 0 ? Math.round(ingresoReal / cerr.length) : 0,
      tasaRespuesta: env.length > 0 ? Math.round((resp.length / env.length) * 100) : 0,
      tasaConversion: env.length > 0 ? Math.round((cerr.length / env.length) * 100) : 0,
    };
  },
});

export const countByEstado = query({
  args: { estado: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { estado, paginationOpts }) => {
    return await ctx.db
      .query("prospects")
      .withIndex("by_estado", (q) => q.eq("estado", estado))
      .paginate(paginationOpts);
  },
});

export const pageByEstadoFields = query({
  args: { estado: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { estado, paginationOpts }) => {
    const result = await ctx.db
      .query("prospects")
      .withIndex("by_estado", (q) => q.eq("estado", estado))
      .paginate(paginationOpts);
    // Solo devolver campos livianos para el conteo por nicho/pais
    return {
      ...result,
      page: result.page.map((p) => ({ nicho: p.nicho, pais: p.pais })),
    };
  },
});

// Guarda conteos correctos en el cache (llamado desde script externo)
export const patchStatsCache = mutation({
  args: {
    pendientes: v.number(), enviados: v.number(), respondieron: v.number(),
    noInteresados: v.number(), cerrados: v.number(), errores: v.number(),
  },
  handler: async (ctx, data) => {
    const existing = await ctx.db.query("statsCache").first();
    const patch = { ...data, updatedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, patch);
    else await ctx.db.insert("statsCache", { ...patch, ingresoReal: 0 });
  },
});

export const patchByNicho = mutation({
  args: { byNicho: v.string(), byPais: v.string() },
  handler: async (ctx, { byNicho, byPais }) => {
    const existing = await ctx.db.query("statsCache").first();
    if (existing) await ctx.db.patch(existing._id, { byNicho, byPais, updatedAt: Date.now() });
  },
});

// Recalcula y guarda el cache — llamado por el cron cada 30 min
export const recalcularStatsCache = mutation({
  args: {},
  handler: async (ctx) => {
    // Los no-pendientes son pocos miles — se pueden leer completos
    const env   = await ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "enviado")).collect();
    const resp  = await ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "respondio")).collect();
    const noint = await ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "no_interesado")).collect();
    const cerr  = await ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "cerrado")).collect();
    const err   = await ctx.db.query("prospects").withIndex("by_estado", q => q.eq("estado", "error")).collect();

    const ingresoReal = cerr.reduce((s, p) => s + (p.monto ?? 0), 0);

    const existing = await ctx.db.query("statsCache").first();

    // byNicho: actualizar contactados por nicho, pero preservar los totales del cache
    // (el total real solo lo puede calcular el script externo recalc-stats.mjs)
    const nichoContactados: Record<string, number> = {};
    for (const p of [...env, ...resp, ...noint, ...cerr, ...err]) {
      nichoContactados[p.nicho] = (nichoContactados[p.nicho] ?? 0) + 1;
    }
    let byNicho: { nicho: string; total: number; contactados: number }[] = [];
    if (existing?.byNicho) {
      // Actualizar contactados, preservar totales
      const cached = JSON.parse(existing.byNicho) as { nicho: string; total: number; contactados: number }[];
      byNicho = cached.map(n => ({ ...n, contactados: nichoContactados[n.nicho] ?? 0 }));
      // Agregar nichos nuevos que no estaban en cache
      for (const [nicho, contactados] of Object.entries(nichoContactados)) {
        if (!byNicho.find(n => n.nicho === nicho)) {
          byNicho.push({ nicho, total: contactados, contactados });
        }
      }
    } else {
      // Sin cache previo: total = contactados (incorrecto pero mejor que nada)
      byNicho = Object.entries(nichoContactados)
        .map(([nicho, contactados]) => ({ nicho, total: contactados, contactados }))
        .sort((a, b) => b.total - a.total);
    }
    byNicho.sort((a, b) => b.total - a.total);

    // byPais: igual — preservar totales del cache, actualizar contactados
    const paisContactados: Record<string, number> = {};
    for (const p of [...env, ...resp, ...noint, ...cerr, ...err]) {
      paisContactados[p.pais] = (paisContactados[p.pais] ?? 0) + 1;
    }
    const byPais = Object.entries(paisContactados)
      .map(([pais, total]) => ({ pais, total }))
      .sort((a, b) => b.total - a.total);

    // Pendientes: NO sobreescribir con take() capeado — preservar el valor del cache
    // El valor correcto se mantiene por incremento/decremento en updateEstado y bulkImport
    const pendientes = existing?.pendientes ?? 0;

    const data = {
      pendientes, enviados: env.length, respondieron: resp.length,
      noInteresados: noint.length, cerrados: cerr.length, errores: err.length,
      ingresoReal, updatedAt: Date.now(),
      byPais: JSON.stringify(byPais),
      byNicho: JSON.stringify(byNicho),
    };
    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert("statsCache", data);
  },
});

export const create = mutation({
  args: {
    nombre: v.string(),
    nicho: v.string(),
    pais: v.string(),
    ciudad: v.string(),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    urlPerfil: v.optional(v.string()),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("prospects", {
      ...args,
      estado: "pendiente",
      createdAt: Date.now(),
    });
  },
});

export const cerrarTrato = mutation({
  args: { id: v.id("prospects"), monto: v.number() },
  handler: async (ctx, { id, monto }) => {
    await ctx.db.patch(id, {
      estado: "cerrado",
      monto,
      fechaEnvio: new Date().toISOString(),
    });
  },
});

// Ajusta un contador del statsCache en +delta para un estado dado
async function ajustarCache(ctx: any, estado: string, delta: number) {
  const cache = await ctx.db.query("statsCache").first();
  if (!cache) return;
  const campo: Record<string, string> = {
    pendiente: "pendientes", enviado: "enviados", respondio: "respondieron",
    no_interesado: "noInteresados", cerrado: "cerrados", error: "errores",
  };
  const key = campo[estado];
  if (!key) return;
  await ctx.db.patch(cache._id, { [key]: Math.max(0, (cache[key] ?? 0) + delta) });
}

export const updateEstado = mutation({
  args: {
    id: v.id("prospects"),
    estado: v.string(),
    fechaEnvio: v.optional(v.string()),
    mensajeId: v.optional(v.string()),
  },
  handler: async (ctx, { id, estado, fechaEnvio, mensajeId }) => {
    const prev = await ctx.db.get(id);
    await ctx.db.patch(id, { estado, fechaEnvio, mensajeId });
    // Actualizar cache incremental
    if (prev && prev.estado !== estado) {
      await ajustarCache(ctx, prev.estado, -1);
      await ajustarCache(ctx, estado, +1);
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("prospects"),
    nombre: v.optional(v.string()),
    nicho: v.optional(v.string()),
    pais: v.optional(v.string()),
    ciudad: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    urlPerfil: v.optional(v.string()),
    notas: v.optional(v.string()),
    estado: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("prospects") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const removeSinContacto = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("prospects").collect();
    const sinContacto = all.filter((p) => !p.telefono && !p.email);
    for (const p of sinContacto) await ctx.db.delete(p._id);
    return sinContacto.length;
  },
});

export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("prospects").collect();
    for (const p of all) await ctx.db.delete(p._id);
    return all.length;
  },
});

export const countEnviadosDesde = query({
  args: { desde: v.string() },
  handler: async (ctx, { desde }) => {
    const docs = await ctx.db
      .query("prospects")
      .withIndex("by_estado", (q) => q.eq("estado", "enviado"))
      .collect();
    return docs.filter((p) => p.fechaEnvio && p.fechaEnvio >= desde).length;
  },
});

function normalizePhone(tel: string): string[] {
  const digits = tel.replace(/\D/g, "");
  const variants = new Set<string>([digits]);

  // Ya es formato internacional completo
  if (digits.startsWith("54") && digits.length >= 12) {
    variants.add(digits);
    // Con y sin el 9 de celular
    if (digits.startsWith("549")) variants.add("54" + digits.slice(3));
    else variants.add("549" + digits.slice(2));
  }

  // Argentina local: empieza con 0 → agregar prefijo 54
  if (digits.startsWith("0") && digits.length >= 10) {
    const sinCero = digits.slice(1); // quitar el 0 inicial
    variants.add("54" + sinCero);    // número fijo: 54 + area + número
    variants.add("549" + sinCero);   // celular: 549 + area + número

    // Si tiene "15" de celular local (ej: 0291 15-467-0250)
    // detectar el área (2-4 dígitos) + 15 + número
    for (const areaLen of [2, 3, 4]) {
      const area = sinCero.slice(0, areaLen);
      const resto = sinCero.slice(areaLen);
      if (resto.startsWith("15") && resto.length >= 9) {
        variants.add("549" + area + resto.slice(2)); // sin el 15
      }
    }
  }

  // últimos 8 dígitos como fallback universal
  variants.add(digits.slice(-8));

  return Array.from(variants);
}

export const getMensajes = query({
  args: { telefono: v.string() },
  handler: async (ctx, { telefono }) => {
    const variants = normalizePhone(telefono);
    for (const normalized of variants) {
      const msgs = await ctx.db
        .query("mensajes")
        .withIndex("by_telefono", (q) => q.eq("telefono", normalized))
        .order("asc")
        .collect();
      if (msgs.length > 0) return msgs;
    }
    return [];
  },
});

export const guardarMensaje = mutation({
  args: {
    telefono: v.string(),
    prospectId: v.optional(v.id("prospects")),
    texto: v.string(),
    tipo: v.string(),
    mensajeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Deduplicar por mensajeId para evitar procesar el mismo webhook dos veces
    if (args.mensajeId) {
      const existing = await ctx.db
        .query("mensajes")
        .withIndex("by_mensajeId", (q) => q.eq("mensajeId", args.mensajeId!))
        .first();
      if (existing) return false; // ya procesado
    }
    await ctx.db.insert("mensajes", { ...args, createdAt: Date.now() });
    if (args.tipo === "entrante" && args.prospectId) {
      const p = await ctx.db.get(args.prospectId);
      if (p) {
        await ctx.db.patch(args.prospectId, {
          ultimaActividad: Date.now(),
          mensajesNuevos: (p.mensajesNuevos ?? 0) + 1,
        });
      }
    }
    return true;
  },
});

export const limpiarBadge = mutation({
  args: { id: v.id("prospects") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { mensajesNuevos: 0 });
  },
});

export const getById = query({
  args: { id: v.id("prospects") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Busca un prospecto por teléfono (maneja formato local vs internacional)
export const getByTelefono = query({
  args: { telefono: v.string() },
  handler: async (ctx, { telefono }) => {
    const telNorm = telefono.replace(/\D/g, "");
    const last8 = telNorm.slice(-8);

    // Buscar en enviado y respondio (los dos estados activos)
    for (const estado of ["enviado", "respondio"] as const) {
      const candidates = await ctx.db
        .query("prospects")
        .withIndex("by_estado", (q) => q.eq("estado", estado))
        .filter((q) => q.neq(q.field("telefono"), undefined))
        .take(3000);

      const match = candidates.find((p) => {
        const t = (p.telefono ?? "").replace(/\D/g, "");
        return t.endsWith(last8) || telNorm.endsWith(t.slice(-8));
      });
      if (match) return match;
    }
    return null;
  },
});

export const listByEstado = query({
  args: { estado: v.string(), limite: v.number() },
  handler: async (ctx, { estado, limite }) => {
    return await ctx.db
      .query("prospects")
      .withIndex("by_estado", (q) => q.eq("estado", estado))
      .take(limite);
  },
});

export const listByEstadoFiltrado = query({
  args: {
    estado: v.string(),
    limite: v.number(),
    nichos: v.array(v.string()),
    paises: v.array(v.string()),
  },
  handler: async (ctx, { estado, limite, nichos, paises }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: any[] = [];

    if (nichos.length === 1) {
      results = await ctx.db
        .query("prospects")
        .withIndex("by_estado_nicho", (q) =>
          q.eq("estado", estado).eq("nicho", nichos[0])
        )
        .take(limite * 3);
    } else if (nichos.length > 1) {
      const parts = await Promise.all(
        nichos.map((n) =>
          ctx.db
            .query("prospects")
            .withIndex("by_estado_nicho", (q) =>
              q.eq("estado", estado).eq("nicho", n)
            )
            .take(limite)
        )
      );
      results = parts.flat();
    } else {
      results = await ctx.db
        .query("prospects")
        .withIndex("by_estado", (q) => q.eq("estado", estado))
        .take(Math.min(limite * 5, 2000));
    }

    if (paises.length > 0) results = results.filter((p: any) => paises.includes(p.pais));

    return results.slice(0, limite);
  },
});

export const registrarRespuesta = mutation({
  args: { telefono: v.string(), mensajeId: v.string(), texto: v.string() },
  handler: async (ctx, { telefono, mensajeId, texto }) => {
    // Buscar por teléfono (normalizado)
    const all = await ctx.db.query("prospects").collect();
    const prospect = all.find((p) => {
      const t = (p.telefono ?? "").replace(/\D/g, "");
      return t === telefono || t.endsWith(telefono.slice(-8));
    });
    if (!prospect) return null;
    await ctx.db.patch(prospect._id, {
      estado: "respondio",
      notas: (prospect.notas ? prospect.notas + "\n" : "") + `Respondió: "${texto.slice(0, 120)}"`,
    });
    return prospect._id;
  },
});

// Corrección puntual: marca como respondio los prospectos de conversaciones sin prospectId
export const fixRespondioHoy = mutation({
  args: {},
  handler: async (ctx) => {
    // Traer conversaciones de hoy sin prospectId
    const hoyMs = Date.now() - 24 * 60 * 60 * 1000;
    const convs = await ctx.db.query("conversaciones")
      .filter((q) => q.and(
        q.gte(q.field("createdAt"), hoyMs),
        q.eq(q.field("prospectId"), undefined)
      ))
      .collect();

    let actualizados = 0;
    for (const conv of convs) {
      const telNorm = conv.telefono.replace(/\D/g, "");
      const last8 = telNorm.slice(-8);

      // Buscar en enviados usando el índice
      const candidatos = await ctx.db
        .query("prospects")
        .withIndex("by_estado", (q) => q.eq("estado", "enviado"))
        .filter((q) => q.neq(q.field("telefono"), undefined))
        .take(3000);

      const match = candidatos.find((p) => {
        const t = (p.telefono ?? "").replace(/\D/g, "");
        return t.endsWith(last8) || telNorm.endsWith(t.slice(-8));
      });

      if (match) {
        await ctx.db.patch(match._id, { estado: "respondio" });
        await ctx.db.patch(conv._id, { prospectId: match._id });
        actualizados++;
      }
    }
    return { convsSinMatch: convs.length, actualizados };
  },
});

export const fixNicho = mutation({
  args: { nichoViejo: v.string(), nichoNuevo: v.string() },
  handler: async (ctx, { nichoViejo, nichoNuevo }) => {
    const all = await ctx.db.query("prospects").collect();
    const targets = all.filter((p) => p.nicho === nichoViejo);
    for (const p of targets) {
      await ctx.db.patch(p._id, { nicho: nichoNuevo });
    }
    return targets.length;
  },
});

export const bulkImport = mutation({
  args: {
    prospects: v.array(
      v.object({
        nombre: v.string(),
        nicho: v.string(),
        pais: v.string(),
        ciudad: v.string(),
        telefono: v.optional(v.string()),
        email: v.optional(v.string()),
        urlPerfil: v.optional(v.string()),
        notas: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { prospects }) => {
    const ids = [];
    for (const p of prospects) {
      const id = await ctx.db.insert("prospects", {
        ...p,
        estado: "pendiente",
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    // Actualizar cache incremental
    const cache = await ctx.db.query("statsCache").first();
    if (cache) await ctx.db.patch(cache._id, { pendientes: (cache.pendientes ?? 0) + ids.length });
    return ids;
  },
});

export const deleteProspect = mutation({
  args: { id: v.id("prospects") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const resetErrores = mutation({
  args: {
    nicho: v.string(),
    mensajeIdFiltro: v.optional(v.string()),
  },
  handler: async (ctx, { nicho, mensajeIdFiltro }) => {
    const all = await ctx.db
      .query("prospects")
      .withIndex("by_estado_nicho", (q) => q.eq("estado", "error").eq("nicho", nicho))
      .collect();
    let count = 0;
    for (const p of all) {
      if (mensajeIdFiltro && p.mensajeId !== mensajeIdFiltro) continue;
      await ctx.db.patch(p._id, { estado: "pendiente", mensajeId: undefined, fechaEnvio: undefined });
      count++;
    }
    return count;
  },
});
