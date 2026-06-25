import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  campanaConfig: defineTable({
    templateName: v.string(),
    phoneId: v.string(),
    limiteDiario: v.number(),
    delayMs: v.number(),
  }),
  conversaciones: defineTable({
    telefono: v.string(),
    prospectId: v.optional(v.id("prospects")),
    // 1=preguntando nombre, 2=preguntando dolor, 3=completado
    step: v.number(),
    nombre: v.optional(v.string()),
    dolor: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_telefono", ["telefono"]),
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
