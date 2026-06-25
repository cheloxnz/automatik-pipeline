"use client";
import { useState, useRef } from "react";
import { useQuery, useMutation, useAction, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Upload, Search, Trash2, Edit2, X, Check, AlertTriangle, MapPin, Loader2 } from "lucide-react";

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
            <h2 className="font-medium text-[#e6edf3] text-sm">Buscar negocios en Google Maps</h2>
          </div>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3]"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-[#8b949e] mb-1 uppercase tracking-wide">Nicho / Rubro</label>
            <input
              value={nicho} onChange={(e) => setNicho(e.target.value)}
              placeholder="Ej: Spa, Peluquería, Veterinaria..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {NICHOS_SUGERIDOS.slice(0, 8).map((n) => (
                <button key={n} onClick={() => setNicho(n)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${nicho === n ? "border-[#00ff9d]/50 text-[#00ff9d] bg-[#00ff9d]/10" : "border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]/50 hover:text-[#e6edf3]"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#8b949e] mb-1 uppercase tracking-wide">Ciudad</label>
              <input value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                placeholder="Buenos Aires"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]" />
            </div>
            <div>
              <label className="block text-[10px] text-[#8b949e] mb-1 uppercase tracking-wide">País</label>
              <input value={pais} onChange={(e) => setPais(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[10px] text-[#8b949e] mb-1 uppercase tracking-wide">Cantidad de resultados</label>
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
              <span className="text-[11px] text-[#8b949e]">Solo sin web</span>
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
                ✓ {result.insertados} negocios agregados a Prospectos
                {soloSinWeb && ` (de ${result.encontrados} encontrados, ${result.encontrados - result.filtrados} tenían web)`}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            {result ? "Cerrar" : "Cancelar"}
          </button>
          <button onClick={handleSearch} disabled={loading || !nicho || !ciudad}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? <><Loader2 size={13} className="animate-spin" /> Buscando...</> : <><Search size={13} /> Buscar</>}
          </button>
        </div>

        {loading && (
          <p className="text-[10px] text-[#8b949e] text-center mt-3">
            Buscando en Google Maps... puede tardar 1-2 minutos
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
          <h2 className="font-medium text-[#e6edf3]">{title}</h2>
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
      <label className="block text-[11px] text-[#8b949e] mb-1 uppercase tracking-wide">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
      />
    </div>
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
  const removeAllMutation = useMutation(api.prospects.removeAll);
  const removeSinContactoMutation = useMutation(api.prospects.removeSinContacto);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editId, setEditId] = useState<Id<"prospects"> | null>(null);
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

  return (
    <div className="p-6">
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      <div className="flex items-center justify-between mb-5 border-b border-[#30363d] pb-4">
        <h1 className="text-[11px] text-[#8b949e] uppercase tracking-[3px]">
          Prospectos <span className="text-[#e6edf3] ml-2">{totalStats?.total ?? "..."}</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const n = await removeSinContactoMutation({});
              alert(`${n} prospectos sin contacto eliminados`);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#d29922]/30 rounded-lg text-[#d29922] hover:bg-[#1f1a0a] transition-colors"
          >
            <AlertTriangle size={13} /> Sin contacto
          </button>
          <button
            onClick={async () => {
              if (confirm(`¿Borrar los ${prospects.length} prospectos? Esta acción no se puede deshacer.`)) {
                await removeAllMutation({});
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#f85149]/30 rounded-lg text-[#f85149] hover:bg-[#2d1313] transition-colors"
          >
            <AlertTriangle size={13} /> Limpiar todo
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
          >
            <Upload size={13} /> Importar CSV
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors"
          >
            <MapPin size={13} /> Buscar en Maps
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button
            onClick={() => { setShowAdd(true); setForm(EMPTY); }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors"
          >
            <Plus size={13} /> Agregar
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, nicho, país..."
            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
          />
        </div>
        <select
          value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#30363d]">
              {["Nombre", "Nicho", "País", "Ciudad", "Teléfono", "Email", "Estado", ""].map((h) => (
                <th key={h} className="text-left text-[#8b949e] px-4 py-3 font-normal uppercase text-[10px] tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-[#8b949e] py-12">
                {prospects.length === 0 ? "Sin prospectos — importá tu CSV o agregá uno manualmente" : "Sin resultados para ese filtro"}
              </td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p._id} className="border-b border-[#1c2128] hover:bg-[#21262d]/40 transition-colors">
                  <td className="px-4 py-2.5 text-[#e6edf3] max-w-[160px] truncate">{p.nombre}</td>
                  <td className="px-4 py-2.5 text-[#8b949e] max-w-[120px] truncate">{p.nicho}</td>
                  <td className="px-4 py-2.5 text-[#8b949e]">{p.pais}</td>
                  <td className="px-4 py-2.5 text-[#8b949e] max-w-[100px] truncate">{p.ciudad}</td>
                  <td className="px-4 py-2.5 text-[#8b949e]">{p.telefono ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[#8b949e] max-w-[140px] truncate">{p.email ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={p.estado}
                      onChange={(e) => updateEstadoMutation({ id: p._id, estado: e.target.value })}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer focus:outline-none ${BADGE[p.estado] ?? BADGE.pendiente}`}
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

      {status === "CanLoadMore" && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => loadMore(100)}
            className="px-4 py-2 text-xs border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
          >
            Cargar más ({prospects.length} de {totalStats?.total ?? "..."})
          </button>
        </div>
      )}

      {(showAdd || editId) && (
        <Modal title={editId ? "Editar prospecto" : "Agregar prospecto"} onClose={() => { setShowAdd(false); setEditId(null); setForm(EMPTY); }}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FormField label="Nombre" value={form.nombre} onChange={field("nombre")} placeholder="Spa Relax" />
            <FormField label="Nicho" value={form.nicho} onChange={field("nicho")} placeholder="Spa / Masajes" />
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
              className="px-4 py-2 text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave}
              className="px-4 py-2 text-sm bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] rounded-lg hover:bg-[#00ff9d]/20 transition-colors flex items-center gap-2">
              <Check size={14} /> Guardar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
