import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const crear = mutation({
  args: {
    tipo: v.string(),
    prospectNombre: v.string(),
    prospectTelefono: v.string(),
    prospectId: v.optional(v.id("prospects")),
    detalle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("alertas", {
      ...args,
      leida: false,
      createdAt: Date.now(),
    });
  },
});

export const marcarLeida = mutation({
  args: { id: v.id("alertas") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { leida: true });
  },
});

export const marcarTodasLeidas = mutation({
  args: {},
  handler: async (ctx) => {
    const noLeidas = await ctx.db.query("alertas").withIndex("by_leida", q => q.eq("leida", false)).collect();
    await Promise.all(noLeidas.map(a => ctx.db.patch(a._id, { leida: true })));
  },
});

export const recientes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alertas").withIndex("by_createdAt").order("desc").take(20);
  },
});

export const noLeidas = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alertas").withIndex("by_leida", q => q.eq("leida", false)).collect();
  },
});
