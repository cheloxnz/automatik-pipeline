import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const WA_API = "https://graph.facebook.com/v19.0";

// ── Sistema de prompt por categoría de nicho ──────────────────────────────────
// Agrupa los nichos en categorías con dolores y contexto específicos
const NICHO_CONTEXTO: Record<string, { categoria: string; dolor: string; ejemplo: string }> = {
  // Estética / Bienestar
  spa:          { categoria: "estética y bienestar", dolor: "turnos que se pierden y clientes que consultan precios a cualquier hora", ejemplo: "clientes que preguntan disponibilidad a las 11pm y si no responden se van a otro lado" },
  peluquería:   { categoria: "estética y bienestar", dolor: "turnos que se pierden y clientes que consultan precios a cualquier hora", ejemplo: "clientes que preguntan disponibilidad a las 11pm y si no responden se van a otro lado" },
  estética:     { categoria: "estética y bienestar", dolor: "turnos que se pierden y clientes que consultan precios a cualquier hora", ejemplo: "clientes que preguntan disponibilidad a las 11pm y si no responden se van a otro lado" },
  barbería:     { categoria: "estética y bienestar", dolor: "turnos que se pierden y clientes que consultan precios a cualquier hora", ejemplo: "clientes que preguntan disponibilidad a las 11pm y si no responden se van a otro lado" },
  masajes:      { categoria: "estética y bienestar", dolor: "turnos que se pierden y clientes que consultan precios a cualquier hora", ejemplo: "clientes que preguntan disponibilidad a las 11pm y si no responden se van a otro lado" },
  // Salud
  dental:       { categoria: "salud", dolor: "pacientes que preguntan por turnos y precios fuera del horario de la recepción", ejemplo: "pacientes que escriben el fin de semana y si no hay respuesta buscan otro profesional" },
  psicología:   { categoria: "salud", dolor: "pacientes que preguntan por turnos y precios fuera del horario de la recepción", ejemplo: "pacientes que escriben el fin de semana y si no hay respuesta buscan otro profesional" },
  médico:       { categoria: "salud", dolor: "pacientes que preguntan por turnos y precios fuera del horario de la recepción", ejemplo: "pacientes que escriben el fin de semana y si no hay respuesta buscan otro profesional" },
  clínica:      { categoria: "salud", dolor: "pacientes que preguntan por turnos y precios fuera del horario de la recepción", ejemplo: "pacientes que escriben el fin de semana y si no hay respuesta buscan otro profesional" },
  veterinaria:  { categoria: "salud", dolor: "dueños que consultan urgencias y precios fuera de horario", ejemplo: "consultas de emergencia que no reciben respuesta y terminan yendo a otra clínica" },
  // Fitness
  gym:          { categoria: "fitness", dolor: "personas interesadas que preguntan precios, planes y horarios y no reciben respuesta rápida", ejemplo: "alguien interesado que escribe a las 10pm preguntando por el abono y si no le responden se olvidan" },
  gimnasio:     { categoria: "fitness", dolor: "personas interesadas que preguntan precios, planes y horarios y no reciben respuesta rápida", ejemplo: "alguien interesado que escribe a las 10pm preguntando por el abono y si no le responden se olvidan" },
  pilates:      { categoria: "fitness", dolor: "personas interesadas que preguntan precios, planes y horarios y no reciben respuesta rápida", ejemplo: "alguien interesado que escribe a las 10pm preguntando por el abono y si no le responden se olvidan" },
  crossfit:     { categoria: "fitness", dolor: "personas interesadas que preguntan precios, planes y horarios y no reciben respuesta rápida", ejemplo: "alguien interesado que escribe a las 10pm preguntando por el abono y si no le responden se olvidan" },
  // Gastronomía
  restaurante:  { categoria: "gastronomía", dolor: "reservas y consultas de menú que llegan mientras están ocupados atendiendo mesas", ejemplo: "clientes que quieren reservar para el finde y no reciben respuesta hasta que ya reservaron en otro lugar" },
  cafetería:    { categoria: "gastronomía", dolor: "reservas y consultas de menú que llegan mientras están ocupados atendiendo mesas", ejemplo: "clientes que quieren reservar para el finde y no reciben respuesta hasta que ya reservaron en otro lugar" },
  catering:     { categoria: "gastronomía", dolor: "consultas de cotización para eventos que no reciben respuesta rápida", ejemplo: "alguien organizando un evento que cotiza en 3 lugares y cierra con el que responde primero" },
  // Inmobiliaria / Construcción
  inmobiliaria: { categoria: "inmobiliaria", dolor: "consultas de propiedades que llegan fuera del horario de la oficina", ejemplo: "interesados que preguntan por una propiedad a la noche y si no responden consultan con otra inmobiliaria" },
  arquitectura: { categoria: "construcción", dolor: "consultas de proyectos y cotizaciones que llegan en cualquier momento", ejemplo: "potenciales clientes que buscan presupuesto y cierran con quien les responde primero" },
  // Retail / Tiendas
  tienda:       { categoria: "retail", dolor: "consultas de stock, precios y envíos que se acumulan sin respuesta", ejemplo: "clientes que preguntan si hay stock a las 9pm y si no responden compran en otra tienda o en MercadoLibre" },
  ropa:         { categoria: "retail", dolor: "consultas de stock, precios y envíos que se acumulan sin respuesta", ejemplo: "clientes que preguntan si hay talle a las 9pm y si no responden compran en otra tienda" },
  indumentaria: { categoria: "retail", dolor: "consultas de stock, precios y envíos que se acumulan sin respuesta", ejemplo: "clientes que preguntan si hay talle a las 9pm y si no responden compran en otra tienda" },
  calzado:      { categoria: "retail", dolor: "consultas de stock, precios y envíos que se acumulan sin respuesta", ejemplo: "clientes que preguntan si hay número a las 9pm y si no responden compran en otro lado" },
  // Fotografía / Eventos
  fotografía:   { categoria: "fotografía y eventos", dolor: "consultas de disponibilidad y cotizaciones para fechas específicas que no reciben respuesta a tiempo", ejemplo: "parejas que están eligiendo fotógrafo para su boda y cierran con quien les responde ese mismo día" },
  // Educación
  academia:     { categoria: "educación", dolor: "consultas de cursos, horarios y precios que llegan fuera del horario de atención", ejemplo: "interesados en inscribirse que si no reciben info rápido se inscriben en otra academia" },
  // Mecánica / Servicios
  mecánica:     { categoria: "servicios automotrices", dolor: "consultas de presupuesto y turnos que llegan mientras están en el taller trabajando", ejemplo: "clientes que necesitan presupuesto y llaman a 3 talleres, cerrando con el primero que responde" },
  ferretería:   { categoria: "retail especializado", dolor: "consultas de stock y precios que llegan fuera del horario del local", ejemplo: "clientes que necesitan un producto urgente y si no responden van a otra ferretería" },
  lavandería:   { categoria: "servicios", dolor: "consultas de precios y disponibilidad que llegan en cualquier momento", ejemplo: "clientes que preguntan precios a la noche y si no responden buscan otra lavandería" },
};

function getNichoContexto(nicho: string) {
  const n = nicho.toLowerCase();
  for (const [key, val] of Object.entries(NICHO_CONTEXTO)) {
    if (n.includes(key)) return val;
  }
  return {
    categoria: "negocios",
    dolor: "consultas que llegan fuera del horario de atención sin respuesta",
    ejemplo: "clientes que escriben a las 11pm y si no reciben respuesta ya compraron en otro lado",
  };
}

const SYSTEM_PROMPT_BASE = `Sos Nico, setter de Automatik Media — empresa argentina que instala bots de WhatsApp para negocios.

## TU ÚNICO OBJETIVO
Que el prospecto agende una llamada de 20 minutos con Marcelo (el fundador). Nada más.

## EL PRODUCTO
Automatik Media instala bots de WhatsApp que responden, asesoran y venden solos — 24/7, sin menú de opciones, como un humano. Setup ~15 días.

## CONTEXTO DEL NEGOCIO
Estás hablando con {{NEGOCIO}}, un negocio de {{CATEGORIA}} en {{CIUDAD}}.
Su dolor más común: {{DOLOR}}.
Ejemplo concreto: "{{EJEMPLO}}".

## ⚡ FAST TRACK — PRIORIDAD MÁXIMA
Si el prospecto dice algo como "podemos coordinar", "cuando quieras", "la semana que viene", "me interesa", "dale", "cuándo podemos hablar" → IGNORÁ el flujo normal.
Respondé con entusiasmo breve y en el MISMO mensaje pedí los tres datos en una sola pregunta:
"¿Me pasás tu nombre, qué día te queda mejor y en qué horario?"
Una vez que te den esos datos → confirmá la cita y marcá [CITA_AGENDADA].
NO hagas preguntas de dolor ni pitch — ya mostraron interés, no los frenes.

## FLUJO ESTRICTO — MÁXIMO 4 MENSAJES SALIENTES

Vas en el mensaje saliente número {{MSG_NUM}} de la conversación.

**MENSAJE 1 — Presentación + quién sos**
Saludá, decí que sos Nico de Automatik Media y preguntá con quién hablás y qué rol tiene en el negocio.

**MENSAJE 2 — Identificar el dolor**
Una sola pregunta concreta sobre su rubro. Específica de {{CATEGORIA}}, no genérica.

**MENSAJE 3 — Generar interés + proponer llamada**
Validá su dolor en 1-2 líneas y proponé: "¿20 minutos con Marcelo para que les muestre cómo funciona?"

**MENSAJE 4 en adelante — SOLO CERRAR**
Link: https://cal.com/marcelo-del-valle-bcgavl/30min
Si el mensaje saliente es 5 o más: mandá el link directamente sin más preguntas.

## MANEJO DE OBJECIONES (siempre volvés al cierre en el mismo mensaje)
- Precio: "El precio depende del negocio, por eso Marcelo lo muestra en vivo — ¿20 min te parece?"
- "Lo pienso": "Claro, ¿cuándo sería buen momento? Te coordino con Marcelo"
- "Ya tenemos algo": "¿Cómo les va con eso? A veces con ver lo nuestro surge algo. ¿20 min?"
- "No hay presupuesto": "¿Cuánto pierden por mes en consultas sin responder? El bot suele pagarse solo. ¿20 min con Marcelo?"

## REGLAS ABSOLUTAS
- Mensajes cortos: máximo 3 líneas. Nunca párrafos
- UNA sola pregunta por mensaje — excepto en Fast Track donde pedís nombre+día+horario juntos
- No sos un bot. Si preguntan, sos Nico del equipo de ventas
- Máximo 1 emoji por mensaje
- Si ya mandaste el link → no mandés más preguntas, esperá respuesta

## MARCADORES DEL SISTEMA (al final del mensaje, invisibles para el usuario)
- Prospecto acepta hablar con Marcelo → [LEAD_CALIFICADO]
- Confirma nombre + día + horario, o dice "dale agendo" → [CITA_AGENDADA]
- Mandás el link de Cal.com → [LINK_ENVIADO]
- Muestra dudas u objeciones → [OBJECION]
- Rechaza claramente → [RECHAZO]`;

function buildSystemPrompt(nombre: string, ciudad: string, nicho: string, msgNum: number): string {
  const ctx = getNichoContexto(nicho);
  return SYSTEM_PROMPT_BASE
    .replace("{{NEGOCIO}}", nombre)
    .replace("{{CIUDAD}}", ciudad)
    .replace("{{CATEGORIA}}", ctx.categoria)
    .replace(/\{\{CATEGORIA\}\}/g, ctx.categoria)
    .replace("{{DOLOR}}", ctx.dolor)
    .replace("{{EJEMPLO}}", ctx.ejemplo)
    .replace("{{MSG_NUM}}", String(msgNum));
}

// ── Horario Argentina ─────────────────────────────────────────────────────────
function esHorarioNocturnoAR(): boolean {
  const hora = parseInt(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "numeric",
      hour12: false,
    }),
    10,
  );
  return hora >= 0 && hora < 8; // 0am a 7:59am = no responder
}

// ── WhatsApp helpers ──────────────────────────────────────────────────────────
async function enviarTexto(telefono: string, texto: string, phoneId: string, token: string): Promise<boolean> {
  const tel = telefono.replace(/\D/g, "");
  const res = await fetch(`${WA_API}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: tel,
      type: "text",
      text: { body: texto },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[enviarTexto] Error enviando a ${tel}:`, JSON.stringify(err));
    return false;
  }
  return true;
}

async function enviarImagen(telefono: string, url: string, caption: string, phoneId: string, token: string): Promise<void> {
  const tel = telefono.replace(/\D/g, "");
  await fetch(`${WA_API}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: tel,
      type: "image",
      image: { link: url, caption },
    }),
  });
}

async function enviarDocumento(telefono: string, url: string, nombre: string, phoneId: string, token: string): Promise<void> {
  const tel = telefono.replace(/\D/g, "");
  await fetch(`${WA_API}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: tel,
      type: "document",
      document: { link: url, filename: nombre },
    }),
  });
}

async function procesarMedia(texto: string, telefono: string, phoneId: string, token: string): Promise<string> {
  const imageRegex = /\[SEND_IMAGE:([^:\]]+):([^\]]*)\]/g;
  const docRegex = /\[SEND_DOC:([^:\]]+):([^\]]*)\]/g;
  let match;
  while ((match = imageRegex.exec(texto)) !== null) {
    await enviarImagen(telefono, match[1], match[2], phoneId, token);
  }
  while ((match = docRegex.exec(texto)) !== null) {
    await enviarDocumento(telefono, match[1], match[2], phoneId, token);
  }
  return texto.replace(imageRegex, "").replace(docRegex, "").trim();
}

async function llamarClaude(
  historial: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: historial,
    }),
  });
  const data = await res.json() as { content?: { text: string }[]; error?: { message: string } };
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  return data.content?.[0]?.text ?? "";
}

// ── Detección de autoresponders y bots ───────────────────────────────────────
// Detecta si un mensaje entrante es de un sistema automático (otro bot, autoresponder, etc.)
// Si es así, cerramos la conversación para no entrar en loop.
const AUTORESPONDER_PATTERNS = [
  /gracias por (tu |su |comunicarte|contactar|escribir|elegirnos)/i,
  /en este momento no (podemos|estamos|estoy|puedo)/i,
  /fuera del horario/i,
  /horario de atenci[oó]n/i,
  /te (responderemos|contactaremos|respondo) a la brevedad/i,
  /en breve (te |nos |contestaremos|responderemos)/i,
  /mensaje autom[aá]tico/i,
  /respuesta autom[aá]tica/i,
  /este es un mensaje autom/i,
  /bot (de|del|oficial)/i,
  /asistente virtual/i,
  /soy (un bot|una ia|un asistente)/i,
  /\bIAN\b.*\b(odontolog|dental|cl[ií]nica)/i,
  /\b(odontolog|dental)\b.*\bIAN\b/i,
];

function esAutoresponder(texto: string): boolean {
  return AUTORESPONDER_PATTERNS.some((re) => re.test(texto));
}

// ── Detección de rechazo directo ──────────────────────────────────────────────
const RECHAZO_PATTERNS = [
  /no (estamos?|estoy) interesad[ao]/i,
  /no (me |nos )interesa/i,
  /no (lo |les? )necesitamos?/i,
  /no gracias/i,
  /gracias,? (pero )?no/i,
  /no (queremos?|quiero)/i,
  /no (por ahora|por el momento|en este momento)/i,
  /por (el |ahora el )?momento no/i,
  /no (estamos? buscando|buscamos)/i,
  /ya (tenemos?|contamos? con|lo tenemos?)/i,
  /no (nos |me )interesa/i,
  /prefiero? no/i,
  /no necesito/i,
  /no necesitamos/i,
  /no (estamos? en|estoy en) condiciones/i,
  /no (tenemos?|hay) presupuesto/i,
  /no (aplica|corresponde)/i,
  /d[eé]jenme en paz/i,
  /sac[aá]me de la lista/i,
  /no me (molest|contac)/i,
  /stop/i,
  /cancelar/i,
  /baja/i,
];

function esRechazoDirecto(texto: string): boolean {
  return RECHAZO_PATTERNS.some((re) => re.test(texto));
}

// ── Obtener o crear conversación por teléfono ──────────────────────────────
export const getConversacion = query({
  args: { telefono: v.string() },
  handler: async (ctx, { telefono }) => {
    return await ctx.db
      .query("conversaciones")
      .withIndex("by_telefono", (q) => q.eq("telefono", telefono))
      .first();
  },
});

// Atomically marca que ya se envió el mensaje de autoresponder — retorna true solo la primera vez
export const marcarAutoresponderEnviado = mutation({
  args: { telefono: v.string(), prospectId: v.optional(v.id("prospects")) },
  handler: async (ctx, { telefono, prospectId }) => {
    const existing = await ctx.db
      .query("conversaciones")
      .withIndex("by_telefono", (q) => q.eq("telefono", telefono))
      .first();
    if (existing) {
      if (existing.autoresponderEnviado) return false; // ya enviado
      await ctx.db.patch(existing._id, { autoresponderEnviado: true });
      return true;
    }
    // Crear conversación nueva con flag
    await ctx.db.insert("conversaciones", {
      telefono, prospectId, step: 1, createdAt: Date.now(), autoresponderEnviado: true,
    });
    return true;
  },
});

export const reabrirConversacion = mutation({
  args: { telefono: v.string() },
  handler: async (ctx, { telefono }) => {
    const existing = await ctx.db
      .query("conversaciones")
      .withIndex("by_telefono", (q) => q.eq("telefono", telefono))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { step: 1 });
    }
  },
});

export const upsertConversacion = mutation({
  args: {
    telefono: v.string(),
    prospectId: v.optional(v.id("prospects")),
    step: v.number(),
    nombre: v.optional(v.string()),
    dolor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversaciones")
      .withIndex("by_telefono", (q) => q.eq("telefono", args.telefono))
      .first();
    if (existing) {
      // No downgradeamos si ya está cerrada (step >= 3)
      if (existing.step >= 3 && args.step < 3) return;
      await ctx.db.patch(existing._id, {
        step: args.step,
        ...(args.nombre !== undefined ? { nombre: args.nombre } : {}),
        ...(args.dolor !== undefined ? { dolor: args.dolor } : {}),
        ...(args.prospectId !== undefined ? { prospectId: args.prospectId } : {}),
      });
    } else {
      await ctx.db.insert("conversaciones", {
        telefono: args.telefono,
        prospectId: args.prospectId,
        step: args.step,
        nombre: args.nombre,
        dolor: args.dolor,
        createdAt: Date.now(),
      });
    }
  },
});

// ── Procesar mensaje entrante — bot con IA ────────────────────────────────
export const procesarMensaje = action({
  args: {
    telefono: v.string(),
    texto: v.string(),
    mensajeId: v.string(),
  },
  handler: async (ctx, { telefono, texto, mensajeId }): Promise<void> => {
    const token = process.env.WA_TOKEN;
    const phoneId = process.env.WA_PHONE_ID ?? "1236307326213120";
    const adminPhone = process.env.ADMIN_PHONE;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!token || !anthropicKey) return;

    const telNorm = telefono.replace(/\D/g, "");
    const prospect = await ctx.runQuery(api.prospects.getByTelefono, { telefono });
    const conv = await ctx.runQuery(api.bot.getConversacion, { telefono });
    const step = conv?.step ?? 0;
    const pid = prospect?._id;

    // Prospecto marcado como no_interesado o cerrado — ignorar cualquier mensaje
    if (prospect && (prospect.estado === "no_interesado" || prospect.estado === "cerrado")) {
      console.log(`[IGNORADO] +${telNorm} está en estado ${prospect.estado} — no se responde.`);
      await ctx.runMutation(api.prospects.guardarMensaje, {
        telefono, prospectId: pid, texto, tipo: "entrante", mensajeId,
      });
      return;
    }

    // Conversación cerrada — sólo ignorar si sigue siendo un bot automático
    if (step >= 3) {
      if (esAutoresponder(texto)) return;
      // Un humano respondió después del cierre → reabrir
      console.log(`[REACTIVADO] +${telNorm} respondió después del cierre — reabriendo conversación.`);
      await ctx.runMutation(api.bot.reabrirConversacion, { telefono });
      if (prospect) {
        await ctx.runMutation(api.prospects.updateEstado, { id: prospect._id, estado: "respondio", mensajeId });
      }
    }

    const guardar = async (t: string, tipo: "entrante" | "saliente", mid?: string) => {
      return await ctx.runMutation(api.prospects.guardarMensaje, {
        telefono, prospectId: pid, texto: t, tipo, mensajeId: mid,
      });
    };

    const esNuevo = await guardar(texto, "entrante", mensajeId);
    if (esNuevo === false) return; // webhook duplicado — ya procesado

    // ── Detección de autoresponder ────────────────────────────────────────────
    if (esAutoresponder(texto)) {
      console.log(`[AUTORESPONDER] Detectado en +${telNorm} — marcando respondio.`);
      if (prospect && prospect.estado === "enviado") {
        await ctx.runMutation(api.prospects.updateEstado, { id: prospect._id, estado: "respondio", mensajeId });
      }
      // Responder solo si no hubo respuesta saliente previa — chequeo atómico en mutation
      const fueElPrimero = await ctx.runMutation(api.bot.marcarAutoresponderEnviado, { telefono, prospectId: pid });
      if (fueElPrimero) {
        const respAuto = "Hola! Vi que tienen un mensaje automático activo. ¿Hay alguien del equipo disponible para charlar un momento? 👋";
        await enviarTexto(telefono, respAuto, phoneId, token);
        await guardar(respAuto, "saliente");
      }
      return;
    }

    // Si recibimos el mismo mensaje 3 veces → bot en loop, cerrar sin molestar más
    const recientes = await ctx.runQuery(api.bot.mensajesRecientes, { telefono, limite: 20 });
    const repeticiones = recientes.filter((m) => m.tipo === "entrante" && m.texto === texto).length;
    if (repeticiones >= 3) {
      console.log(`[LOOP-DETECTADO] +${telNorm} repitió el mismo mensaje ${repeticiones} veces — ignorando.`);
      return;
    }

    // ── Rechazo directo — marcar no_interesado y no responder más ────────────
    if (esRechazoDirecto(texto)) {
      console.log(`[RECHAZO-DIRECTO] +${telNorm} — marcando no_interesado.`);
      if (prospect) {
        await ctx.runMutation(api.prospects.updateEstado, { id: prospect._id, estado: "no_interesado", mensajeId });
      }
      await ctx.runMutation(api.bot.upsertConversacion, { telefono, prospectId: pid, step: 3 });
      return;
    }

    // Marcar como respondio si venía de enviado
    if (prospect && prospect.estado === "enviado") {
      await ctx.runMutation(api.prospects.updateEstado, { id: prospect._id, estado: "respondio", mensajeId });
    }

    // ── Horario nocturno — guardar mensaje pero no responder ──────────────────
    if (esHorarioNocturnoAR()) {
      console.log(`[NOCTURNO] Mensaje de +${telNorm} recibido fuera de horario — se responderá a partir de las 8am AR`);
      return;
    }

    // Armar historial para Claude
    const historialDB = await ctx.runQuery(api.prospects.getMensajes, { telefono });
    const mensajesParaClaude: { role: "user" | "assistant"; content: string }[] = historialDB.map((m) => ({
      role: m.tipo === "entrante" ? "user" : "assistant",
      content: m.texto,
    }));

    // Contar mensajes salientes para saber en qué punto del flujo estamos
    const msgNum = historialDB.filter((m) => m.tipo === "saliente").length + 1;

    const systemPrompt = buildSystemPrompt(
      prospect?.nombre ?? "este negocio",
      prospect?.ciudad ?? "Buenos Aires",
      prospect?.nicho ?? "",
      msgNum,
    );

    // Llamar a Claude
    let respuesta: string;
    try {
      respuesta = await llamarClaude(mensajesParaClaude, systemPrompt, anthropicKey);
    } catch {
      return;
    }

    // Detectar marcadores
    const esLeadCalificado = respuesta.includes("[LEAD_CALIFICADO]");
    const esCitaAgendada = respuesta.includes("[CITA_AGENDADA]");
    const esLinkEnviado = respuesta.includes("[LINK_ENVIADO]");
    const esObjecion = respuesta.includes("[OBJECION]");
    const esRechazo = respuesta.includes("[RECHAZO]");

    // Limpiar CUALQUIER marcador [EN_MAYUSCULAS] o [TEXTO] que Claude haya generado
    let respuestaLimpia = respuesta
      .replace(/\[[A-Z_\d]+\]/g, "")
      .trim();

    respuestaLimpia = await procesarMedia(respuestaLimpia, telefono, phoneId, token);

    // ── Delay humano — 15 a 45 segundos aleatorios ───────────────────────────
    const delayMs = 15000 + Math.floor(Math.random() * 30000);
    await new Promise((r) => setTimeout(r, delayMs));

    // Anti-duplicado: si ya se envió una respuesta saliente en los últimos 90s,
    // otro action paralelo ya respondió — saltear para no duplicar.
    const msgsPost = await ctx.runQuery(api.bot.mensajesRecientes, { telefono, limite: 5 });
    const ultimoSaliente = msgsPost.find((m) => m.tipo === "saliente");
    if (ultimoSaliente && Date.now() - ultimoSaliente.createdAt < 90_000) {
      console.log(`[ANTI-DUP] +${telNorm} — ya se respondió hace ${Math.round((Date.now() - ultimoSaliente.createdAt) / 1000)}s, saltando.`);
      return;
    }

    if (respuestaLimpia) {
      await enviarTexto(telefono, respuestaLimpia, phoneId, token);
    }
    await guardar(respuestaLimpia, "saliente");

    // Notificaciones al admin
    if (esLinkEnviado && adminPhone) {
      const negocio = prospect?.nombre ?? "Desconocido";
      const msg = `📅 *Bot envió el link de agenda*\n\n🏢 *Negocio:* ${negocio}${prospect?.ciudad ? ` (${prospect.ciudad})` : ""}\n📱 *Tel:* +${telNorm}\n\n_Podés escribirles vos para ver si pudieron agendar._`;
      console.log(`[LINK_ENVIADO] ${negocio} | +${telNorm}`);
      await enviarTexto(adminPhone, msg, phoneId, token);
    }

    if (esObjecion) {
      const negocio = prospect?.nombre ?? "Desconocido";
      await ctx.runMutation(api.alertas.crear, {
        tipo: "objecion", prospectNombre: negocio, prospectTelefono: telNorm,
        prospectId: pid, detalle: `Objeción detectada`,
      });
      if (adminPhone) {
        const msg = `⚠️ *Objeción detectada*\n\n🏢 *Negocio:* ${negocio}${prospect?.ciudad ? ` (${prospect.ciudad})` : ""}\n📱 *Tel:* +${telNorm}\n\n_El prospecto frenó. Buen momento para intervenir._`;
        await enviarTexto(adminPhone, msg, phoneId, token);
      }
    }

    if (esRechazo) {
      await ctx.runMutation(api.bot.upsertConversacion, { telefono, prospectId: pid, step: 3 });
      if (prospect) {
        await ctx.runMutation(api.prospects.updateEstado, { id: prospect._id, estado: "no_interesado", mensajeId });
      }
      return;
    }

    if (esCitaAgendada || esLeadCalificado) {
      await ctx.runMutation(api.bot.upsertConversacion, { telefono, prospectId: pid, step: 3, nombre: conv?.nombre, dolor: conv?.dolor });
      if (prospect) {
        await ctx.runMutation(api.prospects.update, { id: prospect._id, notas: `[Bot IA] Lead calificado`, estado: "respondio" });
      }
      if (esCitaAgendada) {
        // Intentar extraer fecha/hora de la conversación
        let fechaCita: number | undefined;
        if (anthropicKey) {
          try {
            const ultimosMsgs = historialDB.slice(-8)
              .map((m) => `${m.tipo === "entrante" ? "PROSPECTO" : "NICO"}: ${m.texto}`)
              .join("\n");
            const fechaRaw = await llamarClaude(
              [{ role: "user", content: ultimosMsgs }],
              `Extraé la fecha y hora de la reunión mencionada en estos mensajes. Respondé SOLO con un string ISO 8601 (ej: "2026-07-21T10:30:00") en zona horaria Argentina (UTC-3). Si no hay fecha/hora clara, respondé exactamente "null". Nada más.`,
              anthropicKey,
            );
            const clean = fechaRaw.trim().replace(/"/g, "");
            if (clean && clean !== "null") {
              const parsed = new Date(clean);
              if (!isNaN(parsed.getTime())) fechaCita = parsed.getTime();
            }
          } catch { /* best effort */ }
        }
        const nombreCita = prospect?.nombre && prospect.nombre !== "Desconocido"
          ? prospect.nombre
          : conv?.nombre ?? prospect?.nombre ?? "Desconocido";
        await ctx.runMutation(api.citas.crear, {
          prospectId: pid ?? undefined,
          prospectNombre: nombreCita,
          prospectTelefono: telNorm,
          prospectCiudad: prospect?.ciudad,
          prospectNicho: prospect?.nicho,
          fechaCita,
        });
      }
      const tipoAlerta = esCitaAgendada ? "cita_agendada" : "lead_calificado";
      await ctx.runMutation(api.alertas.crear, {
        tipo: tipoAlerta,
        prospectNombre: prospect?.nombre ?? "Desconocido",
        prospectTelefono: telNorm,
        prospectId: pid,
        detalle: esCitaAgendada ? "Confirmó agenda" : "Aceptó hablar con Marcelo",
      });
      const alertaLead = esCitaAgendada
        ? `🗓️ *¡Cita agendada!*\n\n🏢 *Negocio:* ${prospect?.nombre ?? "Desconocido"} (${prospect?.ciudad ?? ""})\n📱 *Tel:* +${telNorm}\n\n_Revisá tu Cal.com._`
        : `🔔 *Nuevo lead calificado!*\n\n🏢 *Negocio:* ${prospect?.nombre ?? "Desconocido"} (${prospect?.ciudad ?? ""})\n📱 *Tel:* +${telNorm}`;
      console.log(`[${tipoAlerta.toUpperCase()}] ${prospect?.nombre ?? telNorm} | +${telNorm}`);
      if (adminPhone) {
        const ok = await enviarTexto(adminPhone, alertaLead, phoneId, token);
        if (!ok) console.error(`[ALERTA] Ventana 24hs cerrada — notificación guardada en dashboard`);
      }
    } else {
      const nuevoStep = Math.min(step + 1, 2);
      await ctx.runMutation(api.bot.upsertConversacion, { telefono, prospectId: pid, step: nuevoStep });

      // Escalación: avisar al admin si la conv tiene 8+ mensajes sin cerrar
      const totalMsgs = historialDB.length;
      const UMBRAL = 8;
      if (totalMsgs >= UMBRAL && totalMsgs % 4 === 0) {
        const negocio = prospect?.nombre ?? "Desconocido";
        await ctx.runMutation(api.alertas.crear, {
          tipo: "conv_larga",
          prospectNombre: negocio,
          prospectTelefono: telNorm,
          prospectId: pid,
          detalle: `${totalMsgs} mensajes sin cerrar`,
        });
        if (adminPhone) {
          const msg = `🔄 *Conversación larga — intervení*\n\n🏢 *Negocio:* ${negocio}${prospect?.ciudad ? ` (${prospect.ciudad})` : ""}\n📱 *Tel:* +${telNorm}\n💬 *Mensajes:* ${totalMsgs}`;
          await enviarTexto(adminPhone, msg, phoneId, token);
        }
      }
    }
  },
});

// ── Transcribir audio y procesar como texto ───────────────────────────────
export const procesarAudio = action({
  args: {
    telefono: v.string(),
    mensajeId: v.string(),
    mediaId: v.string(),
  },
  handler: async (ctx, { telefono, mensajeId, mediaId }): Promise<void> => {
    const token = process.env.WA_TOKEN;
    const groqKey = process.env.GROQ_API_KEY;
    if (!token || !groqKey) return;

    const metaRes = await fetch(`${WA_API}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const metaData = await metaRes.json() as { url?: string };
    if (!metaData.url) return;

    const audioRes = await fetch(metaData.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!audioRes.ok) return;
    const audioBuffer = await audioRes.arrayBuffer();

    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/ogg" }), "audio.ogg");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "es");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: formData,
    });
    const groqData = await groqRes.json() as { text?: string };
    const transcripcion = groqData.text?.trim();
    if (!transcripcion) return;

    await ctx.runAction(api.bot.procesarMensaje, {
      telefono,
      texto: `🎤 ${transcripcion}`,
      mensajeId,
    });
  },
});

// ── Seguimiento automático multi-touchpoint (24h, 48h, 72h) ──────────────────
// Corre cada hora. Por cada conversación pendiente chequea en qué ventana está
// el último mensaje saliente y manda el follow-up correspondiente.
// 24h: recordatorio con el dolor del prospecto
// 48h: última consulta, tono más directo
// 72h: cierre definitivo, ofrecé valor concreto antes de cerrar
export const seguimientoAutomatico = action({
  args: {},
  handler: async (ctx): Promise<{ enviados: number; skip: boolean }> => {
    // Solo correr entre 13:00 y 23:00 UTC (10am-8pm Argentina UTC-3)
    const hora = new Date().getUTCHours();
    if (hora < 13 || hora >= 23) return { enviados: 0, skip: true };

    const token = process.env.WA_TOKEN;
    const phoneId = process.env.WA_PHONE_ID;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!token || !phoneId) return { enviados: 0, skip: true };

    const HS = 60 * 60 * 1000;
    const ahora = Date.now();

    // Ventanas: cada una cubre 1 hora (el cron corre cada hora)
    const ventanas = [
      { horas: 24, label: "24h" },
      { horas: 48, label: "48h" },
      { horas: 72, label: "72h" },
    ];

    const convs = await ctx.runQuery(api.bot.conversacionesPendientes, { stepMax: 2 });

    let enviados = 0;
    for (const conv of convs) {
      const mensajes = await ctx.runQuery(api.bot.mensajesRecientes, { telefono: conv.telefono, limite: 1 });
      if (!mensajes.length) continue;

      const ultimo = mensajes[0];
      if (ultimo.tipo !== "saliente") continue;

      const antigüedad = ahora - ultimo.createdAt;

      // Detectar en qué ventana cae
      const ventana = ventanas.find(({ horas }) => {
        const min = horas * HS;
        const max = horas * HS + HS; // margen de 1 hora
        return antigüedad >= min && antigüedad < max;
      });
      if (!ventana) continue;

      // Traer datos del prospecto para personalizar por nicho
      const prospectData = conv.prospectId
        ? await ctx.runQuery(api.prospects.getById, { id: conv.prospectId })
        : null;

      // No seguir a prospectos que ya rechazaron o fueron cerrados manualmente
      if (prospectData && (prospectData.estado === "no_interesado" || prospectData.estado === "cerrado")) {
        console.log(`[SEGUIMIENTO-SKIP] +${conv.telefono} está en estado ${prospectData.estado} — no se envía follow-up.`);
        continue;
      }
      const nichoCtx = getNichoContexto(prospectData?.nicho ?? conv.nombre ?? "");
      const nombreNegocio = prospectData?.nombre ?? conv.nombre ?? "el negocio";
      const ciudadNegocio = prospectData?.ciudad ?? "";
      const nichoLabel = prospectData?.nicho ?? nichoCtx.categoria;

      // Últimos mensajes para dar contexto al prompt
      const historialReciente = await ctx.runQuery(api.bot.mensajesRecientes, { telefono: conv.telefono, limite: 6 });
      const resumenHilo = historialReciente
        .map((m) => `${m.tipo === "entrante" ? "ELLOS" : "NICO"}: ${m.texto?.slice(0, 100)}`)
        .join("\n");

      let mensaje: string;

      if (ventana.label === "24h") {
        if (anthropicKey) {
          try {
            const dolorExtra = conv.dolor ? `El dolor específico que mencionaron: "${conv.dolor}".` : "";
            const prompt = `Sos Nico de Automatik Media (setter de ventas, argentino, informal).
Escribiste ayer a ${nombreNegocio}, un negocio de ${nichoLabel}${ciudadNegocio ? ` en ${ciudadNegocio}` : ""}, y no respondieron.

Su dolor típico: ${nichoCtx.dolor}.
${dolorExtra}

Últimos mensajes del hilo:
${resumenHilo}

Escribí UN solo mensaje de seguimiento de máximo 2 líneas. Tiene que:
- Mencionar algo específico de su rubro (${nichoCtx.categoria}), no algo genérico
- Sonar como un humano que retoma la charla, no como un bot
- NO decir "te escribía por lo que te comenté" ni frases genéricas
- Ser casual, directo, sin emojis recargados
Solo el mensaje, nada más.`;
            mensaje = (await llamarClaude(
              [{ role: "user", content: "Dame el mensaje" }],
              prompt,
              anthropicKey,
            )).trim();
          } catch {
            mensaje = `Hola! ¿Tuvieron tiempo de pensar en lo que hablamos? Muchos negocios de ${nichoCtx.categoria} que usaron el bot dejaron de perder consultas que llegaban fuera de horario.`;
          }
        } else {
          mensaje = `Hola! ¿Tuvieron tiempo de pensar en lo que hablamos? Muchos negocios de ${nichoCtx.categoria} que usaron el bot dejaron de perder consultas que llegaban fuera de horario.`;
        }
      } else if (ventana.label === "48h") {
        if (anthropicKey) {
          try {
            const dolorExtra = conv.dolor ? `El dolor que mencionaron: "${conv.dolor}".` : "";
            const prompt = `Sos Nico de Automatik Media. Ya mandaste dos mensajes a ${nombreNegocio} (${nichoLabel}) y no respondieron.
${dolorExtra}
Últimos mensajes:
${resumenHilo}

Escribí UN mensaje corto (máximo 2 líneas). Más directo: ofrecé una llamada de 20 min con Marcelo sin compromiso.
Mencioná algo concreto de su rubro (${nichoCtx.categoria}) para que no suene genérico.
Tono: honesto, sin presión. Argentino. Sin emojis exagerados.
Solo el mensaje, nada más.`;
            mensaje = (await llamarClaude(
              [{ role: "user", content: "Dame el mensaje" }],
              prompt,
              anthropicKey,
            )).trim();
          } catch {
            mensaje = `Hola! Última consulta: ¿tendrían 20 min para hablar con Marcelo (el founder)? Les muestra en vivo cómo funciona el bot para un ${nichoCtx.categoria} como el de ustedes. Sin compromiso.`;
          }
        } else {
          mensaje = `Hola! Última consulta: ¿tendrían 20 min para hablar con Marcelo (el founder)? Les muestra en vivo cómo funciona el bot para un ${nichoCtx.categoria} como el de ustedes. Sin compromiso.`;
        }
      } else {
        // 72h — último intento
        if (anthropicKey) {
          try {
            const dolorExtra = conv.dolor ? `El dolor del negocio: "${conv.dolor}".` : "";
            const prompt = `Sos Nico de Automatik Media. Es el tercer y último mensaje a ${nombreNegocio} (${nichoLabel}). No vas a escribir más.
${dolorExtra}

Escribí UN mensaje de despedida corto (máximo 2 líneas). Dejá la puerta abierta sin resentimiento.
Referenciá su rubro (${nichoCtx.categoria}) para que no suene copiado y pegado.
Cálido, humano, sin presión. Solo el mensaje, nada más.`;
            mensaje = (await llamarClaude(
              [{ role: "user", content: "Dame el mensaje" }],
              prompt,
              anthropicKey,
            )).trim();
          } catch {
            mensaje = `Hola! Último mensaje de mi parte. Si en algún momento necesitan que el ${nichoCtx.categoria} atienda solo por WhatsApp, acá estamos. Éxitos!`;
          }
        } else {
          mensaje = `Hola! Último mensaje de mi parte. Si en algún momento necesitan que el ${nichoCtx.categoria} atienda solo por WhatsApp, acá estamos. Éxitos!`;
        }
      }

      await enviarTexto(conv.telefono, mensaje, phoneId, token);
      await ctx.runMutation(api.prospects.guardarMensaje, {
        telefono: conv.telefono,
        prospectId: conv.prospectId,
        texto: mensaje,
        tipo: "saliente",
      });

      // Al llegar al 72h cerramos la conversación para no seguir molestando
      if (ventana.label === "72h") {
        await ctx.runMutation(api.bot.upsertConversacion, {
          telefono: conv.telefono,
          prospectId: conv.prospectId,
          step: 3,
        });
      }

      console.log(`[SEGUIMIENTO-${ventana.label}] +${conv.telefono}`);
      enviados++;
      await new Promise((r) => setTimeout(r, 2000));
    }

    return { enviados, skip: false };
  },
});

// ── Envío manual de mensaje (uso desde scripts) ───────────────────────────────
export const enviarMensajeManual = action({
  args: { telefono: v.string(), texto: v.string() },
  handler: async (ctx, { telefono, texto }): Promise<boolean> => {
    const token = process.env.WA_TOKEN;
    const phoneId = process.env.WA_PHONE_ID ?? "1236307326213120";
    if (!token) return false;
    const ok = await enviarTexto(telefono, texto, phoneId, token);
    if (ok) {
      await ctx.runMutation(api.prospects.guardarMensaje, {
        telefono, texto, tipo: "saliente",
      });
    }
    return ok;
  },
});

// ── Queries auxiliares ────────────────────────────────────────────────────────
export const conversacionesPendientes = query({
  args: { stepMax: v.number() },
  handler: async (ctx, { stepMax }) => {
    return await ctx.db
      .query("conversaciones")
      .filter((q) => q.lte(q.field("step"), stepMax))
      .collect();
  },
});

export const mensajesRecientes = query({
  args: { telefono: v.string(), limite: v.number() },
  handler: async (ctx, { telefono, limite }) => {
    return await ctx.db
      .query("mensajes")
      .withIndex("by_telefono", (q) => q.eq("telefono", telefono))
      .order("desc")
      .take(limite);
  },
});
