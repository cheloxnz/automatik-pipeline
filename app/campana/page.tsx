"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Send, Settings2, PlayCircle, CheckCircle2,
  AlertTriangle, Copy, Check, MessageSquare, Clock, Zap,
  Calendar, ToggleLeft, ToggleRight, Filter,
} from "lucide-react";

const TEMPLATE_DEFAULT = "automatik_prospecto_v2";
const PHONE_ID_DEFAULT = "1185795881287585";

const TEMPLATE_PREVIEW = `Hola {{1}} 👋

Vi que tienen su negocio en {{2}}. Les escribo porque ayudamos a negocios como el suyo a automatizar tareas con IA — atención por WhatsApp, agendamiento, seguimiento de clientes.

¿Es algo que les interesaría explorar? Si quieren, coordinamos 30 minutos para ver qué tiene sentido en su caso.

Saludos, Marcelo - Automatik Media

[ Agendar 30 minutos → ]`;

const NICHOS_DISPONIBLES = [
  "Spa", "Peluquería", "Estética", "Veterinaria", "Fotografía",
  "Inmobiliaria", "Restaurante", "Gym", "Dental", "Psicología",
  "Arquitectura", "Ferretería", "Lavandería", "Panadería", "Mecánica",
];

const PAISES_DISPONIBLES = [
  "Argentina", "Uruguay", "Chile", "Paraguay", "Bolivia",
  "Peru", "Ecuador", "Colombia", "Mexico",
];

function Toggle({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 group">
      {active
        ? <ToggleRight size={22} className="text-[#00ff9d]" />
        : <ToggleLeft size={22} className="text-[#484f58]" />}
      <span className={`text-[11px] font-semibold ${active ? "text-[#00ff9d]" : "text-[#484f58]"}`}>{label}</span>
    </button>
  );
}

function FilterChips({
  options, selected, onToggle, color = "#58a6ff",
}: {
  options: string[]; selected: string[]; onToggle: (v: string) => void; color?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className="text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium"
            style={on
              ? { borderColor: color, color, backgroundColor: color + "18" }
              : { borderColor: "#30363d", color: "#484f58", backgroundColor: "transparent" }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function Campana() {
  const stats = useQuery(api.prospects.stats);
  const config = useQuery(api.whatsapp.getConfig);
  const saveConfigMutation = useMutation(api.whatsapp.saveConfig);
  const lanzarCampanaAction = useAction(api.whatsapp.lanzarCampana);

  const [templateName, setTemplateName] = useState(TEMPLATE_DEFAULT);
  const [phoneId, setPhoneId] = useState(PHONE_ID_DEFAULT);
  const [limiteDiario, setLimiteDiario] = useState(50);
  const [delayMs, setDelayMs] = useState(3000);
  const [cronActivo, setCronActivo] = useState(false);
  const [nichosFilter, setNichosFilter] = useState<string[]>([]);
  const [paisesFilter, setPaisesFilter] = useState<string[]>([]);

  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<{ enviados: number; errores: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setTemplateName(config.templateName);
      setPhoneId(config.phoneId);
      setLimiteDiario(config.limiteDiario);
      setDelayMs(config.delayMs);
      setCronActivo(config.cronActivo ?? false);
      setNichosFilter(config.nichosFilter ?? []);
      setPaisesFilter(config.paisesFilter ?? []);
    }
  }, [config]);

  function toggleNicho(n: string) {
    setNichosFilter((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);
  }
  function togglePais(p: string) {
    setPaisesFilter((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function handleSaveConfig() {
    await saveConfigMutation({ templateName, phoneId, limiteDiario, delayMs, cronActivo, nichosFilter, paisesFilter });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  }

  async function handleLanzar() {
    if (!templateName || !phoneId) return;
    setLaunching(true);
    setError("");
    setResult(null);
    try {
      const res = await lanzarCampanaAction({
        limite: limiteDiario,
        templateName,
        phoneId,
        delayMs,
        nichosFilter: nichosFilter.length > 0 ? nichosFilter : undefined,
        paisesFilter: paisesFilter.length > 0 ? paisesFilter : undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLaunching(false);
    }
  }

  function copyTemplate() {
    navigator.clipboard.writeText(TEMPLATE_PREVIEW);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pendientes = stats?.pendientes ?? 0;
  const enviados = stats?.enviados ?? 0;
  const respondieron = stats?.respondieron ?? 0;
  const porSlot = Math.max(1, Math.ceil(limiteDiario / 20));
  const estimadoDias = limiteDiario > 0 ? Math.ceil(pendientes / limiteDiario) : "—";

  // Próximos horarios de envío (10am-8pm Argentina = 13-23 UTC)
  const slots = Array.from({ length: 20 }, (_, i) => {
    const minutosDesde10am = i * 30;
    const h = 10 + Math.floor(minutosDesde10am / 60);
    const m = minutosDesde10am % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#30363d] pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#e6edf3] tracking-tight">Campaña WhatsApp</h1>
          <p className="text-[11px] text-[#8b949e] mt-0.5">
            {cronActivo
              ? `Envío automático activo · ${porSlot} msgs cada 30 min · 10:00–20:00 ARG`
              : `Envío manual · máx ${limiteDiario}/día`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cronActivo && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
              <span className="text-[10px] text-[#00ff9d] tracking-widest uppercase font-medium">Auto-send ON</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest font-semibold mb-1">Pendientes</p>
          <p className="text-3xl font-bold text-[#e6edf3]">{pendientes.toLocaleString()}</p>
          <p className="text-[10px] text-[#484f58] mt-1">~{estimadoDias} días al ritmo actual</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest font-semibold mb-1">Enviados</p>
          <p className="text-3xl font-bold text-[#3fb950]">{enviados.toLocaleString()}</p>
          <p className="text-[10px] text-[#484f58] mt-1">mensajes enviados total</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest font-semibold mb-1">Respondieron</p>
          <p className="text-3xl font-bold text-[#58a6ff]">{respondieron.toLocaleString()}</p>
          <p className="text-[10px] text-[#484f58] mt-1">
            {enviados > 0 ? Math.round((respondieron / enviados) * 100) : 0}% tasa de respuesta
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Panel izquierdo */}
        <div className="space-y-4">

          {/* Config */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={14} className="text-[#58a6ff]" />
              <h2 className="text-sm font-bold text-[#e6edf3]">Configuración</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">Template (Meta)</label>
                <input
                  value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">Phone Number ID</label>
                <input
                  value={phoneId} onChange={(e) => setPhoneId(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">Límite diario</label>
                  <select
                    value={limiteDiario} onChange={(e) => setLimiteDiario(Number(e.target.value))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none"
                  >
                    {[10, 25, 50, 75, 100].map((n) => (
                      <option key={n} value={n}>{n} mensajes</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">Delay</label>
                  <select
                    value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none"
                  >
                    <option value={1000}>1 seg</option>
                    <option value={2000}>2 seg</option>
                    <option value={3000}>3 seg</option>
                    <option value={5000}>5 seg</option>
                    <option value={10000}>10 seg</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={handleSaveConfig}
              className="w-full mt-4 px-4 py-2 text-[12px] font-semibold border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors flex items-center justify-center gap-2">
              {configSaved ? <><Check size={13} className="text-[#3fb950]" /> Guardado</> : <><Settings2 size={13} /> Guardar configuración</>}
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={14} className="text-[#d29922]" />
              <h2 className="text-sm font-bold text-[#e6edf3]">Filtros de campaña</h2>
              {(nichosFilter.length > 0 || paisesFilter.length > 0) && (
                <span className="ml-auto text-[10px] text-[#d29922] bg-[#d29922]/10 px-2 py-0.5 rounded-full font-bold">
                  ACTIVO
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[#8b949e] uppercase tracking-widest font-semibold mb-2">
                  Nichos {nichosFilter.length > 0 && <span className="text-[#58a6ff]">· {nichosFilter.length} seleccionados</span>}
                </p>
                <FilterChips options={NICHOS_DISPONIBLES} selected={nichosFilter} onToggle={toggleNicho} color="#58a6ff" />
                {nichosFilter.length > 0 && (
                  <button onClick={() => setNichosFilter([])} className="text-[10px] text-[#484f58] hover:text-[#8b949e] mt-2">
                    Limpiar
                  </button>
                )}
              </div>
              <div>
                <p className="text-[10px] text-[#8b949e] uppercase tracking-widest font-semibold mb-2">
                  Países {paisesFilter.length > 0 && <span className="text-[#3fb950]">· {paisesFilter.length} seleccionados</span>}
                </p>
                <FilterChips options={PAISES_DISPONIBLES} selected={paisesFilter} onToggle={togglePais} color="#3fb950" />
                {paisesFilter.length > 0 && (
                  <button onClick={() => setPaisesFilter([])} className="text-[10px] text-[#484f58] hover:text-[#8b949e] mt-2">
                    Limpiar
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#484f58]">
                {nichosFilter.length === 0 && paisesFilter.length === 0
                  ? "Sin filtros → se envía a todos los pendientes"
                  : "Solo se envía a prospectos que coincidan con los filtros"}
              </p>
            </div>
          </div>

          {/* Auto-schedule */}
          <div className={`bg-[#161b22] border rounded-xl p-5 transition-colors ${cronActivo ? "border-[#00ff9d]/30" : "border-[#30363d]"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className={cronActivo ? "text-[#00ff9d]" : "text-[#484f58]"} />
                <h2 className="text-sm font-bold text-[#e6edf3]">Envío automático</h2>
              </div>
              <Toggle active={cronActivo} onToggle={() => setCronActivo((v) => !v)} label={cronActivo ? "Activado" : "Desactivado"} />
            </div>

            {cronActivo ? (
              <div className="space-y-3">
                <div className="bg-[#0d1117] rounded-lg p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Horario</span>
                    <span className="text-[#00ff9d] font-bold">10:00 – 20:00 ARG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Frecuencia</span>
                    <span className="text-[#e6edf3] font-bold">cada 30 minutos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Por slot</span>
                    <span className="text-[#e6edf3] font-bold">{porSlot} mensajes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Total diario</span>
                    <span className="text-[#e6edf3] font-bold">{limiteDiario} mensajes</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#484f58] uppercase tracking-widest mb-2">Próximos envíos (hora ARG)</p>
                  <div className="flex flex-wrap gap-1">
                    {slots.map((s) => (
                      <span key={s} className="text-[10px] font-mono text-[#484f58] bg-[#0d1117] px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-[#8b949e]">
                  ⚠️ Guardá la config para activar el scheduler
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-[#484f58]">
                Activá para que el sistema envíe automáticamente {limiteDiario} mensajes por día, distribuidos cada 30 minutos entre las 10:00 y 20:00 (hora Argentina).
              </p>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {/* Template */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-[#58a6ff]" />
                <h2 className="text-sm font-bold text-[#e6edf3]">Template del mensaje</h2>
              </div>
              <button onClick={copyTemplate}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8b949e] hover:text-[#e6edf3] transition-colors">
                {copied ? <><Check size={11} className="text-[#3fb950]" /> Copiado</> : <><Copy size={11} /> Copiar</>}
              </button>
            </div>
            <div className="bg-[#0d1117] rounded-xl p-4 text-[12px] text-[#e6edf3] leading-relaxed font-mono whitespace-pre-line border border-[#21262d]">
              {TEMPLATE_PREVIEW}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="text-[10px] bg-[#0c2040] text-[#58a6ff] px-2 py-0.5 rounded font-mono">{"{{1}}"} = Nombre</span>
              <span className="text-[10px] bg-[#0c2040] text-[#58a6ff] px-2 py-0.5 rounded font-mono">{"{{2}}"} = Ciudad</span>
            </div>
          </div>

          {/* Lanzar manual */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#00ff9d]" />
              <h2 className="text-sm font-bold text-[#e6edf3]">Lanzar ahora</h2>
              <span className="text-[10px] text-[#484f58] ml-1">manual</span>
            </div>

            <div className="bg-[#0d1117] rounded-lg p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">Mensajes a enviar</span>
                <span className="font-bold text-[#e6edf3]">{Math.min(limiteDiario, pendientes)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">Tiempo estimado</span>
                <span className="font-bold text-[#e6edf3]">
                  ~{Math.ceil((Math.min(limiteDiario, pendientes) * delayMs) / 60000)} min
                </span>
              </div>
              {(nichosFilter.length > 0 || paisesFilter.length > 0) && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#8b949e]">Filtros activos</span>
                  <span className="text-[#d29922] font-bold text-[10px]">
                    {[nichosFilter.length > 0 && `${nichosFilter.length} nichos`, paisesFilter.length > 0 && `${paisesFilter.length} países`].filter(Boolean).join(" · ")}
                  </span>
                </div>
              )}
            </div>

            {pendientes === 0 && (
              <div className="bg-[#1f1a0a] border border-[#d29922]/30 rounded-lg p-3 mb-3">
                <p className="text-[11px] text-[#d29922] flex items-center gap-2">
                  <AlertTriangle size={12} /> No hay prospectos pendientes
                </p>
              </div>
            )}
            {error && (
              <div className="bg-[#2d1313] border border-[#f85149]/30 rounded-lg p-3 mb-3">
                <p className="text-[11px] text-[#f85149]">{error}</p>
              </div>
            )}
            {result && (
              <div className="bg-[#0d2b1f] border border-[#3fb950]/30 rounded-lg p-3 mb-3 space-y-1">
                <p className="text-[11px] font-semibold text-[#3fb950] flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Campaña completada
                </p>
                <p className="text-[11px] text-[#8b949e]">
                  <span className="text-[#3fb950] font-bold">{result.enviados}</span> enviados
                  {result.errores > 0 && <> · <span className="text-[#f85149] font-bold">{result.errores}</span> errores</>}
                </p>
              </div>
            )}

            <button
              onClick={handleLanzar}
              disabled={launching || pendientes === 0 || !templateName}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {launching
                ? <><Clock size={14} className="animate-spin" /> Enviando...</>
                : <><PlayCircle size={14} /> Lanzar {Math.min(limiteDiario, pendientes)} mensajes</>}
            </button>
            {launching && (
              <p className="text-[10px] text-[#484f58] text-center mt-2">No cierres esta ventana mientras envía</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
