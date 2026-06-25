import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ── Verificación del webhook (Meta lo llama la primera vez) ───────────────
http.route({
  path: "/webhook",
  method: "GET",
  handler: httpAction(async (_, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = process.env.WA_VERIFY_TOKEN ?? "automatik2024";

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }),
});

// ── Recibir mensajes entrantes de WhatsApp ────────────────────────────────
http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json() as Record<string, unknown>;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = (body as any).entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Ignorar status updates (solo nos interesan mensajes)
      if (!value?.messages?.length) {
        return new Response("ok", { status: 200 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = value.messages[0] as any;
      const fromRaw: string = msg.from ?? "";
      const mensajeId: string = msg.id ?? "";
      const texto: string = msg.text?.body ?? msg.type ?? "";

      // Normalizar: puede venir con o sin código país
      const from = fromRaw.replace(/\D/g, "");

      // Guardar el mensaje entrante en Convex
      await ctx.runMutation(api.prospects.registrarRespuesta, {
        telefono: from,
        mensajeId,
        texto,
      });
    } catch {
      // No fallar el webhook aunque haya error interno
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
