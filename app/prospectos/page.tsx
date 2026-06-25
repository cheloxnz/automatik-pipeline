"use client";
import { useState, useRef } from "react";
import { useQuery, useMutation, useAction, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Upload, Search, Trash2, Edit2, X, Check, AlertTriangle, MapPin, Loader2, ChevronDown, MessageCircle, ExternalLink, Phone } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#00ff9d]" />
            <h2 className="font-semibold text-[#e6edf3] text-sm tracking-wide">Buscar en Google Maps</h2>
          </div>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3]"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">Nicho / Rubro</label>
            <input
              value={nicho} onChange={(e) => setNicho(e.target.value)}
              placeholder="Ej: Spa, Peluquería, Veterinaria..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
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
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 uppercase tracking-widest">País</label>
              <input value={pais} onChange={(e) => setPais(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]" />
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

const ESTADOS = ["pendiente", "enviado", "respondio", "cerrado", "error"];

const BADGE: Record<string, string> = {
  pendiente: "bg-[#21262d] text-[#8b949e]",
  enviado: "bg-[#0d2b1f] text-[#3fb950]",
  respondio: "bg-[#0c2040] text-[#58a6ff]",
  cerrado: "bg-[#1f1a0a] text-[#d29922]",
  error: "bg-[#2d1313] text-[#f85149]",
};

type ProspectForm = {
  nombre: string; nicho: string; pais: string; ciudad: string;
  telefono: string; email: string; urlPerfil: string; notas: string;
};

const EMPTY: ProspectForm = { nombre: "", nicho: "", pais: "", ciudad: "", telefono: "", email: "", urlPerfil: "", notas: "" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[#e6edf3] text-base">{title}</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3]"><X size={18} /></button>
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
        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
      />
    </div>
  );
}

const BADGE_PANEL: Record<string, string> = {
  pendiente: "bg-[#21262d] text-[#8b949e]",
  enviado: "bg-[#0d2b1f] text-[#3fb950]",
  respondio: "bg-[#0c2040] text-[#58a6ff]",
  cerrado: "bg-[#1f1a0a] text-[#d29922]",
  error: "bg-[#2d1313] text-[#f85149]",
};

function ConversacionPanel({ prospect, onClose }: { prospect: { _id: Id<"prospects">; nombre: string; nicho: string; ciudad: string; pais: string; telefono?: string; email?: string; urlPerfil?: string; notas?: string; estado: string; monto?: number; fechaEnvio?: string; createdAt: number }; onClose: () => void }) {
  const mensajes = useQuery(api.prospects.getMensajes, { telefono: prospect.telefono ?? "" });

  function formatHora(ts: number) {
    return new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }
  function formatFecha(ts: number) {
    return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-[#161b22] border-l border-[#30363d] z-50 flex flex-col shadow-2xl">

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
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3] transition-colors">
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
                      <span className="text-[9px] text-[#484f58] bg-[#0d1117] px-2 py-0.5 rounded-full">{fecha}</span>
                    </div>
                  )}
                  <div className={`flex ${saliente ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                      saliente
                        ? "bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-tr-sm"
                        : "bg-[#21262d] border border-[#30363d] rounded-tl-sm"
                    }`}>
                      <p className="text-[12px] text-[#e6edf3] leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                      <p className={`text-[9px] mt-1 text-right ${saliente ? "text-[#00ff9d]/50" : "text-[#484f58]"}`}>
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
        <div className="px-5 py-3 border-t border-[#30363d] shrink-0">
          <p className="text-[10px] text-[#484f58] text-center">
            Respondé desde tu WhatsApp personal · El bot maneja el flujo automáticamente
          </p>
        </div>
      </div>
    </>
  );
}

export default function Prospectos() {
  const { results: prospects, status, loadMore } = usePaginatedQuery(
    api.prospects.listPaginated,
    {},
    { initialNumItems: 100 }
  );
  const totalStats = useQuery(api.prospects.stats);
  const createMutation = useMutation(api.prospects.create);
  const updateMutation = useMutation(api.prospects.update);
  const removeMutation = useMutation(api.prospects.remove);
  const bulkImportMutation = useMutation(api.prospects.bulkImport);
  const updateEstadoMutation = useMutation(api.prospects.updateEstado);
  const cerrarTratoMutation = useMutation(api.prospects.cerrarTrato);
  const removeAllMutation = useMutation(api.prospects.removeAll);
  const removeSinContactoMutation = useMutation(api.prospects.removeSinContacto);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editId, setEditId] = useState<Id<"prospects"> | null>(null);
  const [cerrandoId, setCerrandoId] = useState<Id<"prospects"> | null>(null);
  const [monto, setMonto] = useState("");
  const [panelProspect, setPanelProspect] = useState<typeof prospects[0] | null>(null);
  const [form, setForm] = useState<ProspectForm>(EMPTY);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = prospects.filter((p) => {
    const matchSearch = search === "" || [p.nombre, p.nicho, p.pais, p.ciudad].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchEstado = filterEstado === "todos" || p.estado === filterEstado;
    return matchSearch && matchEstado;
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
            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
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

      {/* Tabla */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#30363d] bg-[#0d1117]/60">
              {[
                { label: "Nombre del negocio", w: "w-[18%]" },
                { label: "Rubro", w: "w-[12%]" },
                { label: "País", w: "w-[8%]" },
                { label: "Ciudad", w: "w-[10%]" },
                { label: "Teléfono", w: "w-[12%]" },
                { label: "Email", w: "w-[14%]" },
                { label: "Estado", w: "w-[10%]" },
                { label: "", w: "w-[6%]" },
              ].map((h) => (
                <th key={h.label} className={`text-left text-[#adbac7] px-4 py-3 font-extrabold uppercase text-[10px] tracking-widest ${h.w}`}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-[#8b949e] py-16">
                {prospects.length === 0
                  ? <span>Sin prospectos — <span className="text-[#58a6ff] cursor-pointer" onClick={() => setShowSearch(true)}>buscá en Maps</span> o importá un CSV</span>
                  : "Sin resultados para ese filtro"}
              </td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p._id} className="border-b border-[#1c2128] hover:bg-[#21262d]/40 transition-colors">
                  <td className="px-4 py-2.5 max-w-[0] truncate">
                    <button onClick={() => setPanelProspect(p)} className="font-semibold text-[#e6edf3] hover:text-[#58a6ff] transition-colors text-left truncate w-full">
                      {p.nombre}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-[#8b949e] max-w-[0] truncate">{p.nicho}</td>
                  <td className="px-4 py-2.5 text-[#8b949e]">{p.pais}</td>
                  <td className="px-4 py-2.5 text-[#8b949e] max-w-[0] truncate">{p.ciudad}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-[#8b949e]">{p.telefono ?? <span className="text-[#484f58]">—</span>}</td>
                  <td className="px-4 py-2.5 text-[#8b949e] max-w-[0] truncate">{p.email ?? <span className="text-[#484f58]">—</span>}</td>
                  <td className="px-4 py-2.5">
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none ${BADGE[p.estado] ?? BADGE.pendiente}`}
                    >
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-[#8b949e] hover:text-[#58a6ff] transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => removeMutation({ id: p._id })} className="text-[#8b949e] hover:text-[#f85149] transition-colors">
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

      {/* Modales */}
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
