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

export const bulkProspectAgenciasInmo = action({
  args: {},
  handler: async (ctx) => {
    const TARGETS = [
      { ciudad: "Buenos Aires", pais: "Argentina" },
      { ciudad: "Córdoba", pais: "Argentina" },
      { ciudad: "Santiago", pais: "Chile" },
      { ciudad: "Bogotá", pais: "Colombia" },
      { ciudad: "Medellín", pais: "Colombia" },
      { ciudad: "Ciudad de México", pais: "Mexico" },
      { ciudad: "Lima", pais: "Peru" },
      { ciudad: "Montevideo", pais: "Uruguay" },
      { ciudad: "Madrid", pais: "España" },
      { ciudad: "Barcelona", pais: "España" },
    ];
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const log: { ciudad: string; pais: string; insertados: number }[] = [];
    let totalInsertados = 0;

    for (const { ciudad, pais } of TARGETS) {
      const result = await ctx.runAction(api.actions.searchBusinesses, {
        nicho: "Agencia de marketing inmobiliario",
        ciudad,
        pais,
        cantidad: 10,
        soloSinWeb: false,
      });
      log.push({ ciudad, pais, insertados: result.insertados });
      totalInsertados += result.insertados;
      await delay(600);
    }

    return { totalInsertados, log };
  },
});

export const bulkProspect = action({
  args: {},
  handler: async (ctx) => {
    const NICHOS = [
      "Spa", "Peluquería", "Estética", "Veterinaria",
      "Fotografía", "Gym", "Dental", "Psicología",
      "Lavandería", "Panadería",
    ];
    const TARGETS = [
      { ciudad: "Montevideo",       pais: "Uruguay" },
      { ciudad: "Punta del Este",   pais: "Uruguay" },
      { ciudad: "Santiago",         pais: "Chile" },
      { ciudad: "Valparaíso",       pais: "Chile" },
      { ciudad: "Asunción",         pais: "Paraguay" },
      { ciudad: "Bogotá",           pais: "Colombia" },
      { ciudad: "Medellín",         pais: "Colombia" },
      { ciudad: "Ciudad de México", pais: "Mexico" },
      { ciudad: "Guadalajara",      pais: "Mexico" },
      { ciudad: "Monterrey",        pais: "Mexico" },
      { ciudad: "Lima",             pais: "Peru" },
      { ciudad: "Quito",            pais: "Ecuador" },
      { ciudad: "Santa Cruz",       pais: "Bolivia" },
      { ciudad: "Córdoba",          pais: "Argentina" },
      { ciudad: "Rosario",          pais: "Argentina" },
      { ciudad: "Mendoza",          pais: "Argentina" },
      { ciudad: "Mar del Plata",    pais: "Argentina" },
    ];

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const log: { ciudad: string; pais: string; nicho: string; insertados: number; error?: string }[] = [];
    let totalInsertados = 0;

    for (const { ciudad, pais } of TARGETS) {
      for (const nicho of NICHOS) {
        try {
          const result = await ctx.runAction(api.actions.searchBusinesses, {
            nicho, ciudad, pais, cantidad: 20, soloSinWeb: true,
          });
          log.push({ ciudad, pais, nicho, insertados: result.insertados });
          totalInsertados += result.insertados;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          log.push({ ciudad, pais, nicho, insertados: 0, error: msg });
        }
        await delay(800);
      }
    }

    return { totalInsertados, combinaciones: log.length, log };
  },
});

const ESPANA_NICHOS = [
  "Spa", "Peluquería", "Estética", "Veterinaria",
  "Fotografía", "Gym", "Dental", "Psicología",
  "Lavandería", "Panadería",
];

const ESPANA_LOTES: { ciudad: string; pais: string }[][] = [
  [ // Lote 1
    { ciudad: "Madrid",                     pais: "España" },
    { ciudad: "Barcelona",                  pais: "España" },
    { ciudad: "Valencia",                   pais: "España" },
    { ciudad: "Sevilla",                    pais: "España" },
    { ciudad: "Zaragoza",                   pais: "España" },
    { ciudad: "Málaga",                     pais: "España" },
    { ciudad: "Murcia",                     pais: "España" },
    { ciudad: "Palma",                      pais: "España" },
    { ciudad: "Las Palmas de Gran Canaria", pais: "España" },
    { ciudad: "Bilbao",                     pais: "España" },
  ],
  [ // Lote 2
    { ciudad: "Alicante",                   pais: "España" },
    { ciudad: "Córdoba",                    pais: "España" },
    { ciudad: "Valladolid",                 pais: "España" },
    { ciudad: "Vigo",                       pais: "España" },
    { ciudad: "Gijón",                      pais: "España" },
    { ciudad: "A Coruña",                   pais: "España" },
    { ciudad: "Vitoria",                    pais: "España" },
    { ciudad: "Granada",                    pais: "España" },
    { ciudad: "Elche",                      pais: "España" },
    { ciudad: "Oviedo",                     pais: "España" },
  ],
  [ // Lote 3
    { ciudad: "Santa Cruz de Tenerife",     pais: "España" },
    { ciudad: "Pamplona",                   pais: "España" },
    { ciudad: "Almería",                    pais: "España" },
    { ciudad: "San Sebastián",              pais: "España" },
    { ciudad: "Burgos",                     pais: "España" },
    { ciudad: "Santander",                  pais: "España" },
    { ciudad: "Castellón",                  pais: "España" },
    { ciudad: "Albacete",                   pais: "España" },
    { ciudad: "Alcalá de Henares",          pais: "España" },
    { ciudad: "Getafe",                     pais: "España" },
  ],
  [ // Lote 4
    { ciudad: "Logroño",                    pais: "España" },
    { ciudad: "Badajoz",                    pais: "España" },
    { ciudad: "Salamanca",                  pais: "España" },
    { ciudad: "Huelva",                     pais: "España" },
    { ciudad: "Tarragona",                  pais: "España" },
    { ciudad: "León",                       pais: "España" },
    { ciudad: "Lleida",                     pais: "España" },
    { ciudad: "Cádiz",                      pais: "España" },
    { ciudad: "Marbella",                   pais: "España" },
    { ciudad: "Jerez de la Frontera",       pais: "España" },
  ],
  [ // Lote 5
    { ciudad: "Cartagena",                  pais: "España" },
    { ciudad: "Terrassa",                   pais: "España" },
    { ciudad: "Sabadell",                   pais: "España" },
    { ciudad: "Móstoles",                   pais: "España" },
    { ciudad: "Fuenlabrada",                pais: "España" },
    { ciudad: "Torrevieja",                 pais: "España" },
    { ciudad: "Dos Hermanas",               pais: "España" },
    { ciudad: "Alcorcón",                   pais: "España" },
    { ciudad: "Toledo",                     pais: "España" },
    { ciudad: "Guadalajara",                pais: "España" },
  ],
];

export const bulkProspectEspana = action({
  args: { lote: v.number() },
  handler: async (ctx, { lote }) => {
    const targets = ESPANA_LOTES[lote];
    if (!targets) throw new Error(`Lote ${lote} no existe (0-4)`);

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const log: { ciudad: string; pais: string; nicho: string; insertados: number; error?: string }[] = [];
    let totalInsertados = 0;

    for (const { ciudad, pais } of targets) {
      for (const nicho of ESPANA_NICHOS) {
        try {
          const result = await ctx.runAction(api.actions.searchBusinesses, {
            nicho, ciudad, pais, cantidad: 20, soloSinWeb: true,
          });
          log.push({ ciudad, pais, nicho, insertados: result.insertados });
          totalInsertados += result.insertados;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          log.push({ ciudad, pais, nicho, insertados: 0, error: msg });
        }
        await delay(600);
      }
    }

    return { lote, totalInsertados, combinaciones: log.length, log };
  },
});

export const bulkProspectSpaJoyeria = action({
  args: {},
  handler: async (ctx) => {
    const NICHOS = ["Spa", "Joyería"];
    const TARGETS = [
      // Argentina
      { ciudad: "Buenos Aires",     pais: "Argentina" },
      { ciudad: "Córdoba",          pais: "Argentina" },
      { ciudad: "Rosario",          pais: "Argentina" },
      { ciudad: "Mendoza",          pais: "Argentina" },
      { ciudad: "Mar del Plata",    pais: "Argentina" },
      { ciudad: "Tucumán",          pais: "Argentina" },
      { ciudad: "Salta",            pais: "Argentina" },
      { ciudad: "Santa Fe",         pais: "Argentina" },
      { ciudad: "San Juan",         pais: "Argentina" },
      { ciudad: "La Plata",         pais: "Argentina" },
      { ciudad: "Neuquén",          pais: "Argentina" },
      { ciudad: "Resistencia",      pais: "Argentina" },
      { ciudad: "Corrientes",       pais: "Argentina" },
      { ciudad: "Posadas",          pais: "Argentina" },
      { ciudad: "Bahía Blanca",     pais: "Argentina" },
      { ciudad: "Paraná",           pais: "Argentina" },
      { ciudad: "Formosa",          pais: "Argentina" },
      { ciudad: "San Luis",         pais: "Argentina" },
      { ciudad: "Catamarca",        pais: "Argentina" },
      { ciudad: "La Rioja",         pais: "Argentina" },
      // Uruguay
      { ciudad: "Montevideo",       pais: "Uruguay" },
      { ciudad: "Punta del Este",   pais: "Uruguay" },
      { ciudad: "Salto",            pais: "Uruguay" },
      { ciudad: "Paysandú",         pais: "Uruguay" },
      { ciudad: "Maldonado",        pais: "Uruguay" },
      // Chile
      { ciudad: "Santiago",         pais: "Chile" },
      { ciudad: "Valparaíso",       pais: "Chile" },
      { ciudad: "Concepción",       pais: "Chile" },
      { ciudad: "Antofagasta",      pais: "Chile" },
      { ciudad: "Viña del Mar",     pais: "Chile" },
      { ciudad: "Temuco",           pais: "Chile" },
      { ciudad: "Rancagua",         pais: "Chile" },
      { ciudad: "Iquique",          pais: "Chile" },
      { ciudad: "Talca",            pais: "Chile" },
      { ciudad: "Arica",            pais: "Chile" },
      // Paraguay
      { ciudad: "Asunción",         pais: "Paraguay" },
      { ciudad: "Ciudad del Este",  pais: "Paraguay" },
      { ciudad: "Encarnación",      pais: "Paraguay" },
      { ciudad: "San Lorenzo",      pais: "Paraguay" },
      // Bolivia
      { ciudad: "Santa Cruz",       pais: "Bolivia" },
      { ciudad: "La Paz",           pais: "Bolivia" },
      { ciudad: "Cochabamba",       pais: "Bolivia" },
      { ciudad: "Oruro",            pais: "Bolivia" },
      { ciudad: "Sucre",            pais: "Bolivia" },
      // Peru
      { ciudad: "Lima",             pais: "Peru" },
      { ciudad: "Arequipa",         pais: "Peru" },
      { ciudad: "Trujillo",         pais: "Peru" },
      { ciudad: "Chiclayo",         pais: "Peru" },
      { ciudad: "Piura",            pais: "Peru" },
      { ciudad: "Cusco",            pais: "Peru" },
      { ciudad: "Iquitos",          pais: "Peru" },
      // Ecuador
      { ciudad: "Quito",            pais: "Ecuador" },
      { ciudad: "Guayaquil",        pais: "Ecuador" },
      { ciudad: "Cuenca",           pais: "Ecuador" },
      { ciudad: "Ambato",           pais: "Ecuador" },
      { ciudad: "Manta",            pais: "Ecuador" },
      // Colombia
      { ciudad: "Bogotá",           pais: "Colombia" },
      { ciudad: "Medellín",         pais: "Colombia" },
      { ciudad: "Cali",             pais: "Colombia" },
      { ciudad: "Barranquilla",     pais: "Colombia" },
      { ciudad: "Cartagena",        pais: "Colombia" },
      { ciudad: "Bucaramanga",      pais: "Colombia" },
      { ciudad: "Pereira",          pais: "Colombia" },
      { ciudad: "Manizales",        pais: "Colombia" },
      { ciudad: "Santa Marta",      pais: "Colombia" },
      { ciudad: "Cúcuta",           pais: "Colombia" },
      // Mexico
      { ciudad: "Ciudad de México", pais: "Mexico" },
      { ciudad: "Guadalajara",      pais: "Mexico" },
      { ciudad: "Monterrey",        pais: "Mexico" },
      { ciudad: "Puebla",           pais: "Mexico" },
      { ciudad: "Tijuana",          pais: "Mexico" },
      { ciudad: "León",             pais: "Mexico" },
      { ciudad: "Juárez",           pais: "Mexico" },
      { ciudad: "Mérida",           pais: "Mexico" },
      { ciudad: "Cancún",           pais: "Mexico" },
      { ciudad: "Querétaro",        pais: "Mexico" },
      { ciudad: "Hermosillo",       pais: "Mexico" },
      { ciudad: "Chihuahua",        pais: "Mexico" },
      { ciudad: "San Luis Potosí",  pais: "Mexico" },
      { ciudad: "Aguascalientes",   pais: "Mexico" },
      { ciudad: "Culiacán",         pais: "Mexico" },
      { ciudad: "Morelia",          pais: "Mexico" },
      { ciudad: "Veracruz",         pais: "Mexico" },
      { ciudad: "Oaxaca",           pais: "Mexico" },
      { ciudad: "Acapulco",         pais: "Mexico" },
      { ciudad: "Toluca",           pais: "Mexico" },
      // Venezuela
      { ciudad: "Caracas",          pais: "Venezuela" },
      { ciudad: "Maracaibo",        pais: "Venezuela" },
      { ciudad: "Valencia",         pais: "Venezuela" },
      { ciudad: "Barquisimeto",     pais: "Venezuela" },
      // Panama
      { ciudad: "Ciudad de Panamá", pais: "Panama" },
      // Costa Rica
      { ciudad: "San José",         pais: "Costa Rica" },
      // Guatemala
      { ciudad: "Guatemala",        pais: "Guatemala" },
      // República Dominicana
      { ciudad: "Santo Domingo",    pais: "República Dominicana" },
      { ciudad: "Santiago",         pais: "República Dominicana" },
    ];

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const log: { ciudad: string; pais: string; nicho: string; insertados: number; error?: string }[] = [];
    let totalInsertados = 0;

    for (const { ciudad, pais } of TARGETS) {
      for (const nicho of NICHOS) {
        try {
          const result = await ctx.runAction(api.actions.searchBusinesses, {
            nicho, ciudad, pais, cantidad: 20, soloSinWeb: true,
          });
          log.push({ ciudad, pais, nicho, insertados: result.insertados });
          totalInsertados += result.insertados;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          log.push({ ciudad, pais, nicho, insertados: 0, error: msg });
        }
        await delay(800);
      }
    }

    return { totalInsertados, combinaciones: log.length, log };
  },
});
