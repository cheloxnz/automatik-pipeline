"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Send, Settings2, PlayCircle, CheckCircle2, XCircle,
  AlertTriangle, Copy, Check, MessageSquare, Clock, Zap,
} from "lucide-react";

const TEMPLATE_DEFAULT = "automatik_prospecto";
const PHONE_ID_DEFAULT = "1185795881287585";

const TEMPLATE_PREVIEW = `Hola {{1}}! 👋

Vi el negocio que tienen en {{2}} y me quedé con ganas de consultarles algo.

¿Están aprovechando bien las redes sociales para atraer clientes nuevos? Trabajo con negocios de varios rubros y tengo una propuesta que creo puede interesarles.

Si tienen 5 minutitos, con gusto les cuento.

Saludos, Marcelo`;

export default function Campana() {
  const stats = useQuery(api.prospects.stats);
  const config = useQuery(api.whatsapp.getConfig);
  const saveConfigMutation = useMutation(api.whatsapp.saveConfig);
  const lanzarCampanaAction = useAction(api.whatsapp.lanzarCampana);

  const [templateName, setTemplateName] = useState(TEMPLATE_DEFAULT);
  const [phoneId, setPhoneId] = useState(PHONE_ID_DEFAULT);
  const [limiteDiario, setLimiteDiario] = useState(50);
  const [delayMs, setDelayMs] = useState(3000);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<{ enviados: number; errores: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Cargar config guardada
  useEffect(() => {
    if (config) {
      setTemplateName(config.templateName);
      setPhoneId(config.phoneId);
      setLimiteDiario(config.limiteDiario);
      setDelayMs(config.delayMs);
    }
  }, [config]);

  async function handleSaveConfig() {
    await saveConfigMutation({ templateName, phoneId, limiteDiario, delayMs });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  }

  async function handleLanzar() {
    if (!templateName || !phoneId) return;
    setLaunching(true);
    setError("");
    setResult(null);
    try {
      const res = await lanzarCampanaAction({ limite: limiteDiario, templateName, phoneId, delayMs });
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
  const estimadoDias = limiteDiario > 0 ? Math.ceil(pendientes / limiteDiario) : "—";

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#30363d] pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#e6edf3] tracking-tight">Campaña WhatsApp</h1>
          <p className="text-[11px] text-[#8b949e] mt-0.5">Envío masivo controlado · máx {limiteDiario}/día</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
          <span className="text-[10px] text-[#00ff9d] tracking-widest uppercase font-medium">Bot activo</span>
        </div>
      </div>

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
        {/* Panel izquierdo: Config */}
        <div className="space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={14} className="text-[#58a6ff]" />
              <h2 className="text-sm font-bold text-[#e6edf3]">Configuración</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">
                  Nombre del template (Meta)
                </label>
                <input
                  value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="automatik_prospecto"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
                />
                <p className="text-[10px] text-[#484f58] mt-1">Debe estar aprobado por Meta</p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">
                  Phone Number ID
                </label>
                <input
                  value={phoneId} onChange={(e) => setPhoneId(e.target.value)}
                  placeholder="1185795881287585"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">
                    Límite diario
                  </label>
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
                  <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">
                    Delay entre envíos
                  </label>
                  <select
                    value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none"
                  >
                    <option value={1000}>1 segundo</option>
                    <option value={2000}>2 segundos</option>
                    <option value={3000}>3 segundos</option>
                    <option value={5000}>5 segundos</option>
                    <option value={10000}>10 segundos</option>
                  </select>
                </div>
              </div>
            </div>

            <button onClick={handleSaveConfig}
              className="w-full mt-4 px-4 py-2 text-[12px] font-semibold border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors flex items-center justify-center gap-2">
              {configSaved ? <><Check size={13} className="text-[#3fb950]" /> Guardado</> : <><Settings2 size={13} /> Guardar configuración</>}
            </button>
          </div>

          {/* Botón lanzar */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#00ff9d]" />
              <h2 className="text-sm font-bold text-[#e6edf3]">Lanzar campaña</h2>
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
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">Template</span>
                <span className="font-mono text-[#58a6ff] text-[10px]">{templateName}</span>
              </div>
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
                  <span className="text-[#3fb950] font-bold">{result.enviados}</span> enviados ·{" "}
                  {result.errores > 0 && <><span className="text-[#f85149] font-bold">{result.errores}</span> errores</>}
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
              <p className="text-[10px] text-[#484f58] text-center mt-2">
                No cierres esta ventana mientras envía
              </p>
            )}
          </div>
        </div>

        {/* Panel derecho: Template */}
        <div className="space-y-4">
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

            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">Variables</p>
              <div className="flex gap-2">
                <span className="text-[10px] bg-[#0c2040] text-[#58a6ff] px-2 py-0.5 rounded font-mono">{"{{1}}"} = Nombre del negocio</span>
                <span className="text-[10px] bg-[#0c2040] text-[#58a6ff] px-2 py-0.5 rounded font-mono">{"{{2}}"} = Ciudad</span>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-[#d29922]" />
              <h2 className="text-sm font-bold text-[#e6edf3]">Pasos antes de lanzar</h2>
            </div>
            <ol className="space-y-2.5 text-[11px] text-[#8b949e]">
              <li className="flex gap-2.5">
                <span className="text-[#00ff9d] font-bold shrink-0">1.</span>
                <span>Configurar <code className="text-[#58a6ff] bg-[#0c2040] px-1 rounded">WA_TOKEN</code> en Convex:
                  <br /><code className="text-[10px] text-[#484f58]">npx convex env set WA_TOKEN "tu_token" --prod</code>
                  <br /><code className="text-[10px] text-[#484f58]">npx convex env set WA_VERIFY_TOKEN "automatik2024" --prod</code>
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-[#00ff9d] font-bold shrink-0">2.</span>
                <span>Crear el template en <strong className="text-[#e6edf3]">Meta Business Manager</strong> → WhatsApp → Templates de mensajes con el texto de arriba</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-[#00ff9d] font-bold shrink-0">3.</span>
                <span>Configurar el <strong className="text-[#e6edf3]">Webhook URL</strong> en Meta:
                  <br /><code className="text-[10px] text-[#484f58]">https://pastel-ermine-959.convex.cloud/webhook</code>
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-[#00ff9d] font-bold shrink-0">4.</span>
                <span>Esperar que el número y el template sean <strong className="text-[#e6edf3]">aprobados</strong> por Meta</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-[#00ff9d] font-bold shrink-0">5.</span>
                <span>¡Lanzar! 🚀 Cuando lleguen respuestas, el estado cambia a <strong className="text-[#58a6ff]">respondió</strong> automáticamente y continuás desde tu WhatsApp</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
