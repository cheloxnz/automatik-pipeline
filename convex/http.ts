import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ── Verificación del webhook ───────────────────────────────────────────────
http.route({
  path: "/webhook",
  method: "GET",
  handler: httpAction(async (_, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = process.env.WA_VERIFY_TOKEN ?? "automatik2026";

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }),
});

// ── Mensajes entrantes ────────────────────────────────────────────────────
http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json() as Record<string, unknown>;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (body as any).entry?.[0]?.changes?.[0]?.value;

      // Solo procesar mensajes entrantes (ignorar status updates)
      if (!value?.messages?.length) {
        return new Response("ok", { status: 200 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = value.messages[0] as any;
      const from: string = (msg.from ?? "").replace(/\D/g, "");
      const mensajeId: string = msg.id ?? "";
      const texto: string = msg.text?.body ?? msg.type ?? "";

      if (!from) return new Response("ok", { status: 200 });

      // Delegar al bot conversacional
      await ctx.runAction(api.bot.procesarMensaje, {
        telefono: from,
        texto,
        mensajeId,
      });
    } catch {
      // No fallar el webhook aunque haya error interno
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
