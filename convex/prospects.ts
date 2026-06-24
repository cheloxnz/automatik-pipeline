import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prospects").order("desc").collect();
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
    const total = all.length;
    const enviados = all.filter((p) => p.estado === "enviado").length;
    const respondieron = all.filter((p) => p.estado === "respondio").length;
    const cerrados = all.filter((p) => p.estado === "cerrado").length;
    const errores = all.filter((p) => p.estado === "error").length;
    const pendientes = all.filter((p) => p.estado === "pendiente").length;

    const byNicho: Record<string, number> = {};
    const byPais: Record<string, number> = {};
    for (const p of all) {
      const nicho = p.nicho || "Sin nicho";
      const pais = p.pais || "Sin país";
      byNicho[nicho] = (byNicho[nicho] || 0) + 1;
      byPais[pais] = (byPais[pais] || 0) + 1;
    }

    return {
      total,
      enviados,
      respondieron,
      cerrados,
      errores,
      pendientes,
      byNicho,
      byPais,
      tasaRespuesta: enviados > 0 ? Math.round((respondieron / enviados) * 100) : 0,
      tasaConversion: enviados > 0 ? Math.round((cerrados / enviados) * 100) : 0,
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
