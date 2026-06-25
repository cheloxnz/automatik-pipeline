import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prospects: defineTable({
    nombre: v.string(),
    nicho: v.string(),
    pais: v.string(),
    ciudad: v.string(),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    urlPerfil: v.optional(v.string()),
    notas: v.optional(v.string()),
    estado: v.string(),
    fechaEnvio: v.optional(v.string()),
    mensajeId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_estado", ["estado"])
    .index("by_nicho", ["nicho"])
    .index("by_pais", ["pais"])
    .index("by_createdAt", ["createdAt"]),
});
