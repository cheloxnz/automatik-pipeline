import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Cada 30 minutos — la action misma chequea si está en horario (13-23 UTC = 10am-8pm Argentina)
crons.interval("envio-automatico", { minutes: 30 }, api.whatsapp.enviarLoteCron);

export default crons;
