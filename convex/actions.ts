import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELDS = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.types",
].join(",");

export const searchBusinesses = action({
  args: {
    nicho: v.string(),
    ciudad: v.string(),
    pais: v.string(),
    cantidad: v.number(),
    soloSinWeb: v.boolean(),
  },
  handler: async (ctx, { nicho, ciudad, pais, cantidad, soloSinWeb }) => {
    const apiKey = process.env.GOOGLE_PLACES_KEY;
    if (!apiKey) throw new Error("GOOGLE_PLACES_KEY no configurada");

    const query = `${nicho} en ${ciudad} ${pais}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allItems: any[] = [];

    // Google Places devuelve hasta 20 por página, paginamos si se pide más
    let pageToken: string | undefined;
    const pages = Math.ceil(Math.min(cantidad, 60) / 20);

    for (let i = 0; i < pages; i++) {
      const body: Record<string, unknown> = {
        textQuery: query,
        languageCode: "es",
        maxResultCount: 20,
        ...(pageToken ? { pageToken } : {}),
      };

      const res = await fetch(PLACES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELDS,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google Places error ${res.status}: ${err}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      const places = data.places ?? [];
      allItems.push(...places);
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    // Filtrar: sin web, con teléfono, buenas reseñas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = allItems.filter((p: any) => {
      if (soloSinWeb && p.websiteUri) return false;
      if (!p.nationalPhoneNumber && !p.internationalPhoneNumber) return false;
      return true;
    });

    // Ordenar por rating descendente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prospects = filtered.map((p: any) => ({
      nombre: p.displayName?.text ?? "Sin nombre",
      nicho,
      pais,
      ciudad,
      telefono: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? undefined,
      email: undefined,
      urlPerfil: p.googleMapsUri ?? undefined,
      notas: [
        p.formattedAddress ? `Dirección: ${p.formattedAddress}` : "",
        p.rating ? `Rating: ${p.rating}★ (${p.userRatingCount ?? 0} reseñas)` : "",
      ].filter(Boolean).join(" · ") || undefined,
    }));

    if (prospects.length > 0) {
      await ctx.runMutation(api.prospects.bulkImport, { prospects });
    }

    return {
      insertados: prospects.length,
      encontrados: allItems.length,
      sinWebConTelefono: filtered.length,
    };
  },
});
