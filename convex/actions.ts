import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const ACTOR_ID = "compass~crawler-google-places";

export const searchBusinesses = action({
  args: {
    nicho: v.string(),
    ciudad: v.string(),
    pais: v.string(),
    cantidad: v.number(),
    soloSinWeb: v.boolean(),
  },
  handler: async (ctx, { nicho, ciudad, pais, cantidad, soloSinWeb }) => {
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) throw new Error("APIFY_API_KEY no configurada");

    const query = `${nicho} en ${ciudad} ${pais}`;

    // Iniciar run y esperar hasta 3 minutos
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?waitForFinish=180`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          searchStringsArray: [query],
          maxCrawledPlacesPerSearch: cantidad,
          language: "es",
          countryCode: pais.toLowerCase().slice(0, 2),
        }),
      }
    );

    if (!runRes.ok) {
      const err = await runRes.text();
      throw new Error(`Apify error: ${runRes.status} — ${err}`);
    }

    const run = await runRes.json();
    const datasetId = run.data?.defaultDatasetId;
    if (!datasetId) throw new Error("Apify no devolvió dataset");

    // Obtener resultados
    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?limit=${cantidad}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = await dataRes.json();

    // Filtrar y mapear
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = items.filter((item: any) => {
      if (soloSinWeb) return !item.website;
      return true;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prospects = filtered.map((item: any) => ({
      nombre: (item.title || item.name || "Sin nombre").slice(0, 200),
      nicho,
      pais,
      ciudad,
      telefono: item.phone || item.phoneUnformatted || undefined,
      email: item.email || undefined,
      urlPerfil: item.url || item.googlemapsUrl || undefined,
      notas: [
        item.address ? `Dirección: ${item.address}` : "",
        item.totalScore ? `Rating: ${item.totalScore}★` : "",
        item.reviewsCount ? `${item.reviewsCount} reseñas` : "",
      ].filter(Boolean).join(" · ") || undefined,
    }));

    if (prospects.length === 0) {
      return { insertados: 0, encontrados: items.length, filtrados: filtered.length };
    }

    await ctx.runMutation(api.prospects.bulkImport, { prospects });

    return {
      insertados: prospects.length,
      encontrados: items.length,
      filtrados: filtered.length,
    };
  },
});
