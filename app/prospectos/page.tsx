"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useAction, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Upload, Search, Trash2, Edit2, X, Check, AlertTriangle, MapPin, Loader2, ChevronDown, MessageCircle, ExternalLink, Phone } from "lucide-react";
// recordatorios imported via api.recordatorios.*

const NICHOS_SUGERIDOS = [
  "Spa", "Peluquería", "Estética", "Veterinaria", "Fotografía",
  "Inmobiliaria", "Restaurante", "Gym", "Dental", "Psicología",
  "Arquitectura", "Ferretería", "Lavandería", "Panadería", "Mecánica",
];

function SearchModal({ onClose }: { onClose: () => void }) {
  const searchAction = useAction(api.actions.searchBusinesses);
  const [nicho, setNicho] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState("Argentina");
  const [cantidad, setCantidad] = useState(20);
  const [soloSinWeb, setSoloSinWeb] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ insertados: number; encontrados: number; sinWebConTelefono?: number; filtrados?: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!nicho || !ciudad) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await searchAction({ nicho, ciudad, pais, cantidad, soloSinWeb });
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-overlay fixed inset-0 bg-black/70 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Buscar en Google Maps">
      <div className="animate-scale-in bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#00ff9d]" />
            <h2 className="font-semibold text-[#e6edf3] text-sm tracking-wide">Buscar en Google Maps</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-[#8b949e] hover:text-[#e6edf3]"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">Nicho / Rubro</label>
            <input
              value={nicho} onChange={(e) => setNicho(e.target.value)}
              placeholder="Ej: Spa, Peluquería, Veterinaria..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/40 focus:border-[#58a6ff] placeholder-[#484f58]"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {NICHOS_SUGERIDOS.slice(0, 8).map((n) => (
                <button key={n} onClick={() => setNicho(n)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${nicho === n ? "border-[#00ff9d]/50 text-[#00ff9d] bg-[#00ff9d]/10" : "border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]/50 hover:text-[#e6edf3]"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">Ciudad</label>
              <input value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                placeholder="Buenos Aires"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/40 focus:border-[#58a6ff] placeholder-[#484f58]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">País</label>
              <input value={pais} onChange={(e) => setPais(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/40 focus:border-[#58a6ff]" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">Cantidad</label>
              <select value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}
                className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none">
                {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n} negocios</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <div onClick={() => setSoloSinWeb(!soloSinWeb)}
                className={`w-9 h-5 rounded-full transition-colors relative ${soloSinWeb ? "bg-[#00ff9d]/30" : "bg-[#30363d]"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${soloSinWeb ? "left-4 bg-[#00ff9d]" : "left-0.5 bg-[#8b949e]"}`} />
              </div>
              <span className="text-[11px] font-medium text-[#8b949e]">Solo sin web</span>
            </label>
          </div>

          {error && (
            <div className="bg-[#2d1313] border border-[#f85149]/30 rounded-lg p-3">
              <p className="text-[11px] text-[#f85149]">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-[#0d2b1f] border border-[#3fb950]/30 rounded-lg p-3">
              <p className="text-[11px] text-[#3fb950]">
                ✓ <strong>{result.insertados}</strong> negocios agregados a Prospectos
                {soloSinWeb && result.filtrados != null && ` (de ${result.encontrados} encontrados, ${result.encontrados - result.filtrados} tenían web)`}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            {result ? "Cerrar" : "Cancelar"}
          </button>
          <button onClick={handleSearch} disabled={loading || !nicho || !ciudad}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? <><Loader2 size={13} className="animate-spin" /> Buscando...</> : <><Search size={13} /> Buscar</>}
          </button>
        </div>

        {loading && (
          <p className="text-[10px] text-[#8b949e] text-center mt-3">
            Consultando Google Maps... puede tardar 1-2 minutos
          </p>
        )}
      </div>
    </div>
  );
}

const ESTADOS = ["pendiente", "enviado", "respondio", "no_interesado", "cerrado", "error"];

// Semantic state palette — OKLCH-derived, not GitHub Dark defaults
// pendiente: slate  enviado: sapphire  respondio: amber  no_interesado: violet  cerrado: emerald  error: rose
const BADGE: Record<string, string> = {
  pendiente:     "bg-[#1a1d23] text-[#6b7280] border border-[#2d3139]",
  enviado:       "bg-[#0e1c35] text-[#60a5fa] border border-[#1e3a5f]",
  respondio:     "bg-[#251a00] text-[#f59e0b] border border-[#3d2a00]",
  no_interesado: "bg-[#1a1520] text-[#a78bfa] border border-[#2e2040]",
  cerrado:       "bg-[#0a2218] text-[#34d399] border border-[#0f3d28]",
  error:         "bg-[#2a0e0e] text-[#f87171] border border-[#4a1a1a]",
};

type ProspectForm = {
  nombre: string; nicho: string; pais: string; ciudad: string;
  telefono: string; email: string; urlPerfil: string; notas: string;
};

const EMPTY: ProspectForm = { nombre: "", nicho: "", pais: "", ciudad: "", telefono: "", email: "", urlPerfil: "", notas: "" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="animate-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-scale-in bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[#e6edf3] text-base">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-[#8b949e] hover:text-[#e6edf3]"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/40 focus:border-[#58a6ff] placeholder-[#484f58]"
      />
    </div>
  );
}

const BADGE_PANEL: Record<string, string> = {
  pendiente:     "bg-[#1a1d23] text-[#6b7280] border border-[#2d3139]",
  enviado:       "bg-[#0e1c35] text-[#60a5fa] border border-[#1e3a5f]",
  respondio:     "bg-[#251a00] text-[#f59e0b] border border-[#3d2a00]",
  no_interesado: "bg-[#1a1520] text-[#a78bfa] border border-[#2e2040]",
  cerrado:       "bg-[#0a2218] text-[#34d399] border border-[#0f3d28]",
  error:         "bg-[#2a0e0e] text-[#f87171] border border-[#4a1a1a]",
};

function ConversacionPanel({ prospect, onClose }: { prospect: { _id: Id<"prospects">; nombre: string; nicho: string; ciudad: string; pais: string; telefono?: string; email?: string; urlPerfil?: string; notas?: string; estado: string; monto?: number; fechaEnvio?: string; createdAt: number }; onClose: () => void }) {
  const mensajes = useQuery(api.prospects.getMensajes, { telefono: prospect.telefono ?? "" });
  const crearRecordatorio = useMutation(api.recordatorios.crear);
  const [showRecordatorio, setShowRecordatorio] = useState(false);
  const [recFecha, setRecFecha] = useState("");
  const [recHora, setRecHora] = useState("09:00");
  const [recNota, setRecNota] = useState("");
  const [recGuardado, setRecGuardado] = useState(false);

  async function handleGuardarRecordatorio() {
    if (!recFecha) return;
    const fechaMs = new Date(`${recFecha}T${recHora}:00-03:00`).getTime();
    await crearRecordatorio({
      prospectId: prospect._id,
      prospectNombre: prospect.nombre,
      prospectTelefono: prospect.telefono,
      nota: recNota || undefined,
      fechaMs,
    });
    setRecGuardado(true);
    setTimeout(() => { setShowRecordatorio(false); setRecGuardado(false); setRecFecha(""); setRecNota(""); }, 1500);
  }

  function formatHora(ts: number) {
    return new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }
  function formatFecha(ts: number) {
    return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <>
      {/* Overlay */}
      <div className="animate-overlay fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="animate-slide-in-right fixed right-0 top-0 h-full w-full sm:w-[420px] bg-[#161b22] border-l border-[#30363d] z-50 flex flex-col shadow-2xl" role="dialog" aria-modal="true" aria-label={`Conversación con ${prospect.nombre}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/20 flex items-center justify-center text-sm font-bold text-[#00ff9d]">
              {prospect.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-[#e6edf3] text-sm leading-tight">{prospect.nombre}</p>
              <p className="text-[10px] text-[#8b949e]">{prospect.nicho} · {prospect.ciudad}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar conversación" className="text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Info rápida */}
        <div className="px-5 py-3 border-b border-[#30363d] shrink-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${BADGE_PANEL[prospect.estado] ?? BADGE_PANEL.pendiente}`}>
              {prospect.estado}
            </span>
            {prospect.monto != null && prospect.monto > 0 && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#00ff9d]/10 text-[#00ff9d]">
                USD {prospect.monto.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#8b949e]">
            {prospect.telefono && (
              <span className="flex items-center gap-1.5"><Phone size={11} /> {prospect.telefono}</span>
            )}
            {prospect.urlPerfil && (
              <a href={prospect.urlPerfil} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[#58a6ff] transition-colors">
                <ExternalLink size={11} /> Maps
              </a>
            )}
          </div>
          {prospect.notas && (
            <p className="text-[10px] text-[#8b949e] bg-[#0d1117] rounded-lg px-3 py-2 leading-relaxed">
              {prospect.notas}
            </p>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1c2128 1px, transparent 0)", backgroundSize: "24px 24px" }}>

          {mensajes === undefined && (
            <div className="flex justify-center mt-8">
              <Loader2 size={20} className="text-[#484f58] animate-spin" />
            </div>
          )}

          {mensajes?.length === 0 && (
            <div className="flex flex-col items-center mt-12 gap-2">
              <MessageCircle size={32} className="text-[#30363d]" />
              <p className="text-[11px] text-[#484f58]">Sin mensajes aún</p>
            </div>
          )}

          {mensajes && mensajes.length > 0 && (() => {
            let lastDate = "";
            return mensajes.map((m) => {
              const fecha = formatFecha(m.createdAt);
              const showDate = fecha !== lastDate;
              lastDate = fecha;
              const saliente = m.tipo === "saliente";
              return (
                <div key={m._id}>
                  {showDate && (
                    <div className="flex justify-center my-2">
                      <span className="text-[10px] text-[#484f58] bg-[#0d1117] px-2 py-0.5 rounded-full">{fecha}</span>
                    </div>
                  )}
                  <div className={`flex ${saliente ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                      saliente
                        ? "bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-tr-sm"
                        : "bg-[#21262d] border border-[#30363d] rounded-tl-sm"
                    }`}>
                      <p className="text-[12px] text-[#e6edf3] leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                      <p className={`text-[10px] mt-1 text-right ${saliente ? "text-[#00ff9d]/50" : "text-[#484f58]"}`}>
                        {formatHora(m.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#30363d] shrink-0 space-y-3">
          {showRecordatorio ? (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-2">
              <p className="text-[11px] text-[#8b949e] font-medium">Nuevo recordatorio</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={recFecha}
                  onChange={e => setRecFecha(e.target.value)}
                  className="flex-1 bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-xs rounded-lg px-2 py-1.5 outline-none"
                />
                <input
                  type="time"
                  value={recHora}
                  onChange={e => setRecHora(e.target.value)}
                  className="w-24 bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-xs rounded-lg px-2 py-1.5 outline-none"
                />
              </div>
              <input
                placeholder="Nota (opcional)"
                value={recNota}
                onChange={e => setRecNota(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-xs rounded-lg px-2 py-1.5 outline-none placeholder-[#484f58]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleGuardarRecordatorio}
                  disabled={!recFecha}
                  className="flex-1 text-xs bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] rounded-lg py-1.5 hover:bg-[#00ff9d]/20 disabled:opacity-40 transition-colors"
                >
                  {recGuardado ? "✓ Guardado" : "Guardar"}
                </button>
                <button
                  onClick={() => setShowRecordatorio(false)}
                  className="text-xs text-[#484f58] hover:text-[#8b949e] px-3"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRecordatorio(true)}
              className="w-full text-xs text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d] hover:border-[#484f58] rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5"
            >
              📅 Agendar recordatorio
            </button>
          )}
          <p className="text-[10px] text-[#484f58] text-center">
            Respondé desde tu WhatsApp personal · El bot maneja el flujo automáticamente
          </p>
        </div>
      </div>
    </>
  );
}

function RecordatoriosBanner() {
  const activos = useQuery(api.recordatorios.listActivos);
  const cerrar = useMutation(api.recordatorios.cerrar);

  if (!activos?.length) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {activos.map(rec => (
        <div key={rec._id} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <span className="text-lg shrink-0">📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">
              Recordar contactar a {rec.prospectNombre}
            </p>
            {rec.prospectTelefono && (
              <p className="text-xs text-amber-400/70">📱 {rec.prospectTelefono}</p>
            )}
            {rec.nota && (
              <p className="text-xs text-amber-400/70 mt-0.5">{rec.nota}</p>
            )}
          </div>
          <button
            onClick={() => cerrar({ id: rec._id })}
            className="shrink-0 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 transition-colors"
          >
            Listo ✓
          </button>
        </div>
      ))}
    </div>
  );
}

function ProspectosInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  const { results: prospects, status, loadMore } = usePaginatedQuery(
    api.prospects.listPaginated,
    { estado: filterEstado },
    { initialNumItems: 100 }
  );
  const searchResults = useQuery(
    api.prospects.searchProspectos,
    search.length >= 2 ? { q: search, estado: filterEstado } : "skip"
  );
  const totalStats = useQuery(api.prospects.stats);
  const createMutation = useMutation(api.prospects.create);
  const updateMutation = useMutation(api.prospects.update);
  const limpiarBadgeMutation = useMutation(api.prospects.limpiarBadge);
  const removeMutation = useMutation(api.prospects.remove);
  const bulkImportMutation = useMutation(api.prospects.bulkImport);
  const updateEstadoMutation = useMutation(api.prospects.updateEstado);
  const cerrarTratoMutation = useMutation(api.prospects.cerrarTrato);
  const removeAllMutation = useMutation(api.prospects.removeAll);
  const removeSinContactoMutation = useMutation(api.prospects.removeSinContacto);
  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editId, setEditId] = useState<Id<"prospects"> | null>(null);
  const [cerrandoId, setCerrandoId] = useState<Id<"prospects"> | null>(null);
  const [monto, setMonto] = useState("");
  const [panelProspect, setPanelProspect] = useState<typeof prospects[0] | null>(null);

  // Auto-abrir panel si viene ?tel= desde el calendario
  useEffect(() => {
    const tel = searchParams.get("tel");
    if (!tel || !prospects.length || panelProspect) return;
    const found = prospects.find(p => p.telefono?.replace(/\D/g, "") === tel.replace(/\D/g, ""));
    if (found) setPanelProspect(found);
  }, [searchParams, prospects]);

  const [form, setForm] = useState<ProspectForm>(EMPTY);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<Id<"prospects">>>(new Set());
  const [bulkEstado, setBulkEstado] = useState("enviado");
  const [bulkLoading, setBulkLoading] = useState(false);

  const filteredRaw = search.length >= 2
    ? (searchResults ?? [])
    : prospects;

  // Sort: respondio with new messages first, then by ultimaActividad desc, rest unchanged
  const filtered = [...filteredRaw].sort((a, b) => {
    const aIsRes = a.estado === "respondio";
    const bIsRes = b.estado === "respondio";
    if (aIsRes && !bIsRes) return -1;
    if (!aIsRes && bIsRes) return 1;
    if (aIsRes && bIsRes) {
      const aNew = (a as any).mensajesNuevos ?? 0;
      const bNew = (b as any).mensajesNuevos ?? 0;
      if (bNew !== aNew) return bNew - aNew;
      const aAct = (a as any).ultimaActividad ?? a.createdAt;
      const bAct = (b as any).ultimaActividad ?? b.createdAt;
      return bAct - aAct;
    }
    return 0;
  });

  function field(k: keyof ProspectForm) {
    return (v: string) => setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    const data = {
      nombre: form.nombre, nicho: form.nicho, pais: form.pais, ciudad: form.ciudad,
      telefono: form.telefono || undefined, email: form.email || undefined,
      urlPerfil: form.urlPerfil || undefined, notas: form.notas || undefined,
    };
    if (editId) {
      await updateMutation({ id: editId, ...data });
      setEditId(null);
    } else {
      await createMutation(data);
      setShowAdd(false);
    }
    setForm(EMPTY);
  }

  function toggleSelect(id: Id<"prospects">) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p._id)));
    }
  }

  async function handleBulkEstado() {
    setBulkLoading(true);
    for (const id of selected) {
      await updateEstadoMutation({ id, estado: bulkEstado });
    }
    setSelected(new Set());
    setBulkLoading(false);
  }

  async function handleBulkDelete() {
    if (!window.confirm(`¿Eliminar ${selected.size} prospectos? Esta acción no se puede deshacer.`)) return;
    setBulkLoading(true);
    for (const id of selected) {
      await removeMutation({ id });
    }
    setSelected(new Set());
    setBulkLoading(false);
  }

  function openEdit(p: typeof prospects[0]) {
    setEditId(p._id);
    setForm({
      nombre: p.nombre, nicho: p.nicho, pais: p.pais, ciudad: p.ciudad,
      telefono: p.telefono ?? "", email: p.email ?? "",
      urlPerfil: p.urlPerfil ?? "", notas: p.notas ?? "",
    });
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
      const vals = parseCSVLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
      return {
        nombre: obj["Nombre del Negocio"] || obj["Nombre"] || "",
        nicho: obj["Nicho / Categoría"] || obj["Nicho"] || "",
        pais: obj["País"] || obj["Pais"] || "",
        ciudad: obj["Ciudad"] || "",
        telefono: obj["Teléfono"] || obj["Telefono"] || undefined,
        email: obj["Email"] || undefined,
        urlPerfil: obj["URL Perfil / Directorio"] || obj["urlPerfil"] || undefined,
        notas: obj["Notas"] || undefined,
      };
    }).filter((r) => r.nombre);
    if (rows.length > 0) await bulkImportMutation({ prospects: rows });
    e.target.value = "";
  }

  const total = totalStats?.total ?? 0;

  return (
    <div className="p-6">
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}

      <RecordatoriosBanner />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-[#30363d] pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#e6edf3] tracking-tight">Prospectos</h1>
          <p className="text-[11px] text-[#8b949e] mt-0.5">
            {total > 0 ? <><span className="font-semibold text-[#58a6ff]">{total.toLocaleString()}</span> contactos en base</> : "Cargando..."}
            {prospects.length < total && <span className="ml-2 text-[#484f58]">· mostrando {prospects.length}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const n = await removeSinContactoMutation({});
              alert(`${n} prospectos sin contacto eliminados`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-[#d29922]/30 rounded-lg text-[#d29922] hover:bg-[#1f1a0a] transition-colors"
          >
            <AlertTriangle size={12} /> Sin contacto
          </button>
          <button
            onClick={async () => {
              if (confirm(`¿Borrar los ${total} prospectos? Esta acción no se puede deshacer.`)) {
                await removeAllMutation({});
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-[#f85149]/30 rounded-lg text-[#f85149] hover:bg-[#2d1313] transition-colors"
          >
            <Trash2 size={12} /> Limpiar todo
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
          >
            <Upload size={12} /> Importar CSV
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors"
          >
            <MapPin size={12} /> Buscar en Maps
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button
            onClick={() => { setShowAdd(true); setForm(EMPTY); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors"
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, nicho, ciudad..."
            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/40 focus:border-[#58a6ff] placeholder-[#484f58]"
          />
        </div>
        <select
          value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-medium text-[#e6edf3] focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>

      {/* Barra de bulk actions */}
      {selected.size > 0 && (
        <div className="animate-slide-up fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl shadow-black/60">
          <span className="text-[11px] font-bold text-[#e6edf3]">{selected.size} seleccionados</span>
          <div className="w-px h-4 bg-[#30363d]" />
          <select
            value={bulkEstado}
            onChange={(e) => setBulkEstado(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-[11px] text-[#e6edf3] focus:outline-none"
          >
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleBulkEstado}
            disabled={bulkLoading}
            className="px-3 py-1 text-[11px] font-bold bg-[#0e1c35] border border-[#1e3a5f] text-[#60a5fa] rounded-lg hover:bg-[#1e3a5f]/40 transition-colors disabled:opacity-40"
          >
            {bulkLoading ? "Aplicando..." : "Cambiar estado"}
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="px-3 py-1 text-[11px] font-bold bg-[#2a0e0e] border border-[#4a1a1a] text-[#f87171] rounded-lg hover:bg-[#4a1a1a]/40 transition-colors disabled:opacity-40"
          >
            Eliminar
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-[#484f58] hover:text-[#8b949e] transition-colors ml-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#21262d] bg-[#0d1117]">
              <th className="px-4 py-3 w-[40px]">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="accent-[#60a5fa] w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="text-left text-[#484f58] px-3 py-3 font-bold uppercase text-[10px] tracking-[2px] w-[34%]">Negocio</th>
              <th className="text-left text-[#484f58] px-4 py-3 font-bold uppercase text-[10px] tracking-[2px] w-[20%]">Ubicación</th>
              <th className="text-left text-[#484f58] px-4 py-3 font-bold uppercase text-[10px] tracking-[2px] w-[13%]">Contacto</th>
              <th className="text-left text-[#484f58] px-4 py-3 font-bold uppercase text-[10px] tracking-[2px] w-[16%]">Estado</th>
              <th className="w-[13%]" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-[#484f58] py-16 text-[12px]">
                {prospects.length === 0
                  ? <span>Sin prospectos — <span className="text-[#60a5fa] cursor-pointer hover:underline" onClick={() => setShowSearch(true)}>buscá en Maps</span> o importá un CSV</span>
                  : "Sin resultados para ese filtro"}
              </td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p._id} className={`border-b border-[#1c2128] hover:bg-[#1c2128]/60 transition-colors group ${selected.has(p._id) ? "bg-[#0e1c35]/40" : ""}`}>
                  {/* Checkbox */}
                  <td className="px-4 py-3 w-[40px]">
                    <input
                      type="checkbox"
                      checked={selected.has(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      className="accent-[#60a5fa] w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>
                  {/* Negocio: nombre prominente + nicho muted debajo */}
                  <td className="px-3 py-3 max-w-[0]">
                    <button
                      onClick={() => {
                        setPanelProspect(p);
                        if ((p as any).mensajesNuevos > 0) limpiarBadgeMutation({ id: p._id });
                      }}
                      className="font-semibold text-[#e6edf3] hover:text-[#60a5fa] transition-colors text-left truncate w-full block text-[13px] leading-tight"
                    >
                      <span className="flex items-center gap-2">
                        <span className="truncate">{p.nombre}</span>
                        {(p as any).mensajesNuevos > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#f59e0b] text-[#0d1117] text-[9px] font-black">
                            {(p as any).mensajesNuevos}
                          </span>
                        )}
                      </span>
                    </button>
                    <span className="text-[10px] text-[#484f58] truncate block mt-0.5">{p.nicho}</span>
                  </td>
                  {/* Ubicación: ciudad + país en una celda */}
                  <td className="px-4 py-3 max-w-[0]">
                    <span className="text-[#8b949e] truncate block text-[12px]">{p.ciudad}</span>
                    <span className="text-[10px] text-[#484f58]">{p.pais}</span>
                  </td>
                  {/* Contacto: íconos compactos */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.telefono ? (
                        <span title={p.telefono} className="flex items-center gap-1 text-[#60a5fa] font-mono text-[10px]">
                          <Phone size={10} className="shrink-0" />
                          <span className="hidden xl:inline truncate max-w-[80px]">{p.telefono.replace(/\D/g,'').slice(-8)}</span>
                        </span>
                      ) : (
                        <span className="text-[#2d3139]"><Phone size={10} /></span>
                      )}
                      {p.email ? (
                        <span title={p.email} className="text-[#34d399]">
                          <MessageCircle size={10} />
                        </span>
                      ) : (
                        <span className="text-[#2d3139]"><MessageCircle size={10} /></span>
                      )}
                      {p.urlPerfil && (
                        <a href={p.urlPerfil} target="_blank" rel="noopener noreferrer"
                          title="Ver en Maps" className="text-[#484f58] hover:text-[#f59e0b] transition-colors">
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </td>
                  {/* Estado: badge semántico clickeable */}
                  <td className="px-4 py-3">
                    <select
                      value={p.estado}
                      onChange={(e) => {
                        if (e.target.value === "cerrado") {
                          setCerrandoId(p._id);
                          setMonto("");
                        } else {
                          updateEstadoMutation({ id: p._id, estado: e.target.value });
                        }
                      }}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none appearance-none ${BADGE[p.estado] ?? BADGE.pendiente}`}
                    >
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setPanelProspect(p);
                          if ((p as any).mensajesNuevos > 0) limpiarBadgeMutation({ id: p._id });
                        }}
                        aria-label="Ver conversación"
                        className="text-[#484f58] hover:text-[#60a5fa] transition-colors"
                      >
                        <MessageCircle size={13} />
                      </button>
                      <button onClick={() => openEdit(p)} aria-label="Editar prospecto" className="text-[#484f58] hover:text-[#60a5fa] transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar "${p.nombre}"?`)) removeMutation({ id: p._id });
                        }}
                        aria-label="Eliminar prospecto"
                        className="text-[#484f58] hover:text-[#f87171] transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cargar más */}
      {status === "CanLoadMore" && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => loadMore(100)}
            className="flex items-center gap-2 px-5 py-2 text-[12px] font-semibold border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] hover:border-[#58a6ff]/30 transition-all"
          >
            <ChevronDown size={14} />
            Cargar 100 más
            <span className="text-[#484f58] font-normal">({prospects.length} de {total.toLocaleString()})</span>
          </button>
        </div>
      )}

      {status === "Exhausted" && prospects.length > 0 && (
        <p className="text-center text-[10px] text-[#484f58] mt-4">
          Todos los {total.toLocaleString()} prospectos cargados
        </p>
      )}

      {/* Panel lateral conversación */}
      {panelProspect && (
        <ConversacionPanel prospect={panelProspect} onClose={() => setPanelProspect(null)} />
      )}

      {/* Modal cierre de trato */}
      {cerrandoId && (
        <Modal title="💰 Cerrar trato" onClose={() => setCerrandoId(null)}>
          <p className="text-[12px] text-[#8b949e] mb-4">¿Cuánto pagó este cliente? (en USD)</p>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[#8b949e] text-sm font-bold">USD</span>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="500"
              autoFocus
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-lg font-bold text-[#00ff9d] focus:outline-none focus:border-[#00ff9d] placeholder-[#484f58]"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCerrandoId(null)}
              className="px-4 py-2 text-sm font-medium text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              Cancelar
            </button>
            <button
              onClick={async () => {
                const m = parseFloat(monto);
                if (!isNaN(m) && m >= 0) {
                  await cerrarTratoMutation({ id: cerrandoId, monto: m });
                  setCerrandoId(null);
                }
              }}
              disabled={!monto || isNaN(parseFloat(monto))}
              className="px-4 py-2 text-sm font-bold bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] rounded-lg hover:bg-[#00ff9d]/20 transition-colors flex items-center gap-2 disabled:opacity-40">
              <Check size={14} /> Confirmar cierre
            </button>
          </div>
        </Modal>
      )}

      {/* Modal nuevo/editar prospecto */}
      {(showAdd || editId) && (
        <Modal title={editId ? "Editar prospecto" : "Nuevo prospecto"} onClose={() => { setShowAdd(false); setEditId(null); setForm(EMPTY); }}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FormField label="Nombre" value={form.nombre} onChange={field("nombre")} placeholder="Spa Relax" />
            <FormField label="Rubro" value={form.nicho} onChange={field("nicho")} placeholder="Spa / Masajes" />
            <FormField label="País" value={form.pais} onChange={field("pais")} placeholder="Argentina" />
            <FormField label="Ciudad" value={form.ciudad} onChange={field("ciudad")} placeholder="Buenos Aires" />
            <FormField label="Teléfono" value={form.telefono} onChange={field("telefono")} placeholder="5491112345678" />
            <FormField label="Email" value={form.email} onChange={field("email")} placeholder="info@ejemplo.com" type="email" />

            <div className="col-span-2">
              <FormField label="URL Perfil / Directorio" value={form.urlPerfil} onChange={field("urlPerfil")} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <FormField label="Notas" value={form.notas} onChange={field("notas")} placeholder="Sin web; encontrado en Cylex..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowAdd(false); setEditId(null); setForm(EMPTY); }}
              className="px-4 py-2 text-sm font-medium text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] rounded-lg hover:bg-[#00ff9d]/20 transition-colors flex items-center gap-2">
              <Check size={14} /> Guardar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Prospectos() {
  return (
    <Suspense fallback={null}>
      <ProspectosInner />
    </Suspense>
  );
}
