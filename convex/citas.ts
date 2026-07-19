import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("citas")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const crear = mutation({
  args: {
    prospectId: v.optional(v.id("prospects")),
    prospectNombre: v.string(),
    prospectTelefono: v.string(),
    prospectCiudad: v.optional(v.string()),
    prospectNicho: v.optional(v.string()),
    notas: v.optional(v.string()),
    fechaCita: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("citas", {
      ...args,
      estado: "pendiente",
      createdAt: Date.now(),
    });
  },
});

export const actualizarEstado = mutation({
  args: {
    id: v.id("citas"),
    estado: v.union(v.literal("pendiente"), v.literal("realizada"), v.literal("cancelada")),
  },
  handler: async (ctx, { id, estado }) => {
    await ctx.db.patch(id, { estado });
  },
});

export const actualizarNotas = mutation({
  args: { id: v.id("citas"), notas: v.string() },
  handler: async (ctx, { id, notas }) => {
    await ctx.db.patch(id, { notas });
  },
});

export const actualizarFecha = mutation({
  args: { id: v.id("citas"), fechaCita: v.optional(v.number()) },
  handler: async (ctx, { id, fechaCita }) => {
    await ctx.db.patch(id, { fechaCita });
  },
});

export const eliminar = mutation({
  args: { id: v.id("citas") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
