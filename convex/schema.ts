import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  statsCache: defineTable({
    pendientes: v.number(),
    enviados: v.number(),
    respondieron: v.number(),
    noInteresados: v.number(),
    cerrados: v.number(),
    errores: v.number(),
    ingresoReal: v.number(),
    updatedAt: v.number(),
    byPais: v.optional(v.string()),
    byNicho: v.optional(v.string()),
  }),
  campanaConfig: defineTable({
    templateName: v.string(),
    phoneId: v.string(),
    limiteDiario: v.number(),
    delayMs: v.number(),
    nichosFilter: v.optional(v.array(v.string())),
    paisesFilter: v.optional(v.array(v.string())),
    cronActivo: v.optional(v.boolean()),
  }),
  conversaciones: defineTable({
    telefono: v.string(),
    prospectId: v.optional(v.id("prospects")),
    step: v.number(),
    nombre: v.optional(v.string()),
    dolor: v.optional(v.string()),
    createdAt: v.number(),
    autoresponderEnviado: v.optional(v.boolean()),
  }).index("by_telefono", ["telefono"]),
  mensajes: defineTable({
    telefono: v.string(),
    prospectId: v.optional(v.id("prospects")),
    texto: v.string(),
    tipo: v.string(), // "entrante" | "saliente"
    createdAt: v.number(),
    mensajeId: v.optional(v.string()),
  }).index("by_telefono", ["telefono"])
    .index("by_mensajeId", ["mensajeId"]),
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
    monto: v.optional(v.number()),
    fechaEnvio: v.optional(v.string()),
    mensajeId: v.optional(v.string()),
    createdAt: v.number(),
    ultimaActividad: v.optional(v.number()),
    mensajesNuevos: v.optional(v.number()),
  })
    .index("by_estado", ["estado"])
    .index("by_nicho", ["nicho"])
    .index("by_pais", ["pais"])
    .index("by_createdAt", ["createdAt"])
    .index("by_telefono", ["telefono"])
    .index("by_estado_actividad", ["estado", "ultimaActividad"])
    .index("by_estado_nicho", ["estado", "nicho"])
    .searchIndex("search_nombre", { searchField: "nombre", filterFields: ["estado"] }),
  citas: defineTable({
    prospectId: v.optional(v.id("prospects")),
    prospectNombre: v.string(),
    prospectTelefono: v.string(),
    prospectCiudad: v.optional(v.string()),
    prospectNicho: v.optional(v.string()),
    estado: v.union(v.literal("pendiente"), v.literal("realizada"), v.literal("cancelada")),
    notas: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_estado", ["estado"])
    .index("by_createdAt", ["createdAt"]),
  recordatorios: defineTable({
    prospectId: v.id("prospects"),
    prospectNombre: v.string(),
    prospectTelefono: v.optional(v.string()),
    nota: v.optional(v.string()),
    fechaMs: v.number(),          // timestamp exacto del recordatorio
    estado: v.union(
      v.literal("pendiente"),     // aún no llegó la fecha
      v.literal("activo"),        // es el día de hoy, mostrar en dashboard
      v.literal("cerrado")        // el usuario lo cerró
    ),
    avisoPrevioEnviado: v.boolean(), // ya se mandó el aviso del día anterior
    avisoEnviado: v.boolean(),       // ya se mandó el WA del día del recordatorio
    createdAt: v.number(),
  }).index("by_estado", ["estado"]),
});
