import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

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
    return await ctx.db.query("prospects").order("desc").paginate(args.paginationOpts);
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
    const hace15Dias = Date.now() - 15 * 24 * 60 * 60 * 1000;
    const all = await ctx.db.query("prospects").collect();
    const todos = all.filter(
      (p) => p.fechaEnvio &&
        ["enviado", "respondio", "cerrado"].includes(p.estado) &&
        new Date(p.fechaEnvio).getTime() > hace15Dias
    );
    const counts: Record<string, number> = {};
    for (let i = 14; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      counts[key] = 0;
    }
    for (const p of todos) {
      if (!p.fechaEnvio) continue;
      const key = new Date(p.fechaEnvio).toISOString().slice(0, 10);
      if (key in counts) counts[key]++;
    }
    return Object.values(counts);
  },
});

export const statsByNicho = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("prospects").collect();
    const byNicho: Record<string, { total: number; contactados: number }> = {};
    for (const p of all) {
      const k = p.nicho || "Sin nicho";
      if (!byNicho[k]) byNicho[k] = { total: 0, contactados: 0 };
      byNicho[k].total++;
      if (p.estado !== "pendiente") byNicho[k].contactados++;
    }
    return Object.entries(byNicho)
      .map(([nicho, v]) => ({ nicho, ...v }))
      .sort((a, b) => b.total - a.total);
  },
});

export const statsByPais = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("prospects").collect();
    const counts: Record<string, number> = {};
    for (const p of all) {
      if (!p.pais) continue;
      counts[p.pais] = (counts[p.pais] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([pais, total]) => ({ pais, total }))
      .sort((a, b) => b.total - a.total);
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

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("prospects").collect();
    let nPendientes = 0, nEnviados = 0, nRespondieron = 0, nCerrados = 0, nErrores = 0;
    let ingresoReal = 0;
    for (const p of all) {
      if (p.estado === "pendiente") nPendientes++;
      else if (p.estado === "enviado") nEnviados++;
      else if (p.estado === "respondio") nRespondieron++;
      else if (p.estado === "cerrado") { nCerrados++; ingresoReal += p.monto ?? 0; }
      else if (p.estado === "error") nErrores++;
    }
    const total = all.length;
    const ticketPromedio = nCerrados > 0 ? Math.round(ingresoReal / nCerrados) : 0;
    return {
      total,
      enviados: nEnviados,
      respondieron: nRespondieron,
      cerrados: nCerrados,
      errores: nErrores,
      pendientes: nPendientes,
      ingresoReal,
      ticketPromedio,
      tasaRespuesta: nEnviados > 0 ? Math.round((nRespondieron / nEnviados) * 100) : 0,
      tasaConversion: nEnviados > 0 ? Math.round((nCerrados / nEnviados) * 100) : 0,
    };
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

export const updateEstado = mutation({
  args: {
    id: v.id("prospects"),
    estado: v.string(),
    fechaEnvio: v.optional(v.string()),
    mensajeId: v.optional(v.string()),
  },
  handler: async (ctx, { id, estado, fechaEnvio, mensajeId }) => {
    await ctx.db.patch(id, { estado, fechaEnvio, mensajeId });
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

export const getMensajes = query({
  args: { telefono: v.string() },
  handler: async (ctx, { telefono }) => {
    return await ctx.db
      .query("mensajes")
      .withIndex("by_telefono", (q) => q.eq("telefono", telefono))
      .order("asc")
      .collect();
  },
});

export const guardarMensaje = mutation({
  args: {
    telefono: v.string(),
    prospectId: v.optional(v.id("prospects")),
    texto: v.string(),
    tipo: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("mensajes", { ...args, createdAt: Date.now() });
  },
});

export const getById = query({
  args: { id: v.id("prospects") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
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
    let results = await ctx.db
      .query("prospects")
      .withIndex("by_estado", (q) => q.eq("estado", estado))
      .collect();

    if (nichos.length > 0) results = results.filter((p) => nichos.includes(p.nicho));
    if (paises.length > 0) results = results.filter((p) => paises.includes(p.pais));

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
    return ids;
  },
});
