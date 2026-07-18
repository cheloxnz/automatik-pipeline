import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Cada 30 minutos — la action misma chequea si está en horario (13-23 UTC = 10am-8pm Argentina)
crons.interval("envio-automatico", { minutes: 30 }, api.whatsapp.enviarLoteCron);

// Recalcular stats cache cada 30 minutos (desfasado 5 min del envío)
crons.interval("stats-cache", { minutes: 30 }, api.prospects.recalcularStatsCache);

// Seguimiento automático a leads que no respondieron en 24hs — corre cada hora
crons.interval("seguimiento-24h", { hours: 1 }, api.bot.seguimientoAutomatico);

// Recordatorios — chequea cada hora si hay avisos que mandar
crons.interval("recordatorios", { hours: 1 }, api.recordatorios.chequearRecordatorios);

export default crons;
