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
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
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
];

export const statsByPais = query({
  args: {},
  handler: async (ctx) => {
    const result: { pais: string; total: number }[] = [];
    for (const pais of PAISES_CONOCIDOS) {
      const docs = await ctx.db
        .query("prospects")
        .withIndex("by_pais", (q) => q.eq("pais", pais))
        .collect();
      if (docs.length > 0) result.push({ pais, total: docs.length });
    }
    return result.sort((a, b) => b.total - a.total);
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
    const pendientes = await ctx.db.query("prospects").withIndex("by_estado", (q) => q.eq("estado", "pendiente")).collect();
    const enviados = await ctx.db.query("prospects").withIndex("by_estado", (q) => q.eq("estado", "enviado")).collect();
    const respondieron = await ctx.db.query("prospects").withIndex("by_estado", (q) => q.eq("estado", "respondio")).collect();
    const cerrados = await ctx.db.query("prospects").withIndex("by_estado", (q) => q.eq("estado", "cerrado")).collect();
    const errores = await ctx.db.query("prospects").withIndex("by_estado", (q) => q.eq("estado", "error")).collect();

    const nPendientes = pendientes.length;
    const nEnviados = enviados.length;
    const nRespondieron = respondieron.length;
    const nCerrados = cerrados.length;
    const nErrores = errores.length;
    const total = nPendientes + nEnviados + nRespondieron + nCerrados + nErrores;

    return {
      total,
      enviados: nEnviados,
      respondieron: nRespondieron,
      cerrados: nCerrados,
      errores: nErrores,
      pendientes: nPendientes,
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
