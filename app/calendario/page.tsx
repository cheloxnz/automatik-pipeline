"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CalendarDays, Phone, Check, X, Clock, StickyNote, ExternalLink, Bell, Trash2, Pencil } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(ms: number) {
  return new Date(ms).toLocaleString("es-AR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

// ── Cita card ─────────────────────────────────────────────────────────────────

type Cita = {
  _id: Id<"citas">;
  prospectNombre: string;
  prospectTelefono: string;
  prospectCiudad?: string;
  prospectNicho?: string;
  estado: "pendiente" | "realizada" | "cancelada";
  notas?: string;
  fechaCita?: number;
  createdAt: number;
};

const CITA_BORDER: Record<string, string> = {
  pendiente: "#3d2a00",
  realizada: "#0f3d28",
  cancelada: "#4a1a1a",
};

const CITA_BADGE: Record<string, string> = {
  pendiente: "bg-[#251a00] text-[#f59e0b] border border-[#3d2a00]",
  realizada:  "bg-[#0a2218] text-[#34d399] border border-[#0f3d28]",
  cancelada:  "bg-[#2a0e0e] text-[#f87171] border border-[#4a1a1a]",
};

function toDatetimeLocal(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CitaCard({ cita }: { cita: Cita }) {
  const actualizarEstado = useMutation(api.citas.actualizarEstado);
  const actualizarNotas = useMutation(api.citas.actualizarNotas);
  const actualizarFecha = useMutation(api.citas.actualizarFecha);
  const eliminar = useMutation(api.citas.eliminar);
  const [editNota, setEditNota] = useState(false);
  const [nota, setNota] = useState(cita.notas ?? "");
  const [editFecha, setEditFecha] = useState(false);
  const [fechaInput, setFechaInput] = useState(cita.fechaCita ? toDatetimeLocal(cita.fechaCita) : "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`bg-[#161b22] border rounded-xl p-4 flex flex-col gap-3 transition-opacity ${cita.estado === "cancelada" ? "opacity-50" : ""}`}
      style={{ borderColor: CITA_BORDER[cita.estado] }}>

      {/* tipo */}
      <div className="flex items-center gap-1.5">
        <CalendarDays size={10} className="text-[#00ff9d]" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#00ff9d]">Cita agendada</span>
        <div className="flex-1" />
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CITA_BADGE[cita.estado]}`}>
          {cita.estado === "pendiente" ? "Pendiente" : cita.estado === "realizada" ? "Realizada" : "Cancelada"}
        </span>
      </div>

      {/* nombre */}
      <div>
        <p className="font-semibold text-[#e6edf3] text-[14px] leading-tight">{cita.prospectNombre}</p>
        <p className="text-[10px] text-[#484f58] mt-0.5">
          {[cita.prospectNicho, cita.prospectCiudad].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* contacto + fecha */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-4 text-[11px] text-[#8b949e]">
          <span className="flex items-center gap-1.5 font-mono">
            <Phone size={10} className="text-[#60a5fa]" />
            +{cita.prospectTelefono}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#484f58]">
            <Clock size={9} />
            guardado {formatFecha(cita.createdAt)}
          </span>
        </div>
        {/* fecha de la cita acordada */}
        {editFecha ? (
          <div className="flex gap-2 items-center">
            <input type="datetime-local" value={fechaInput} onChange={(e) => setFechaInput(e.target.value)}
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-[11px] text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#00ff9d]/40" />
            <button onClick={async () => {
              const ms = fechaInput ? new Date(fechaInput).getTime() : undefined;
              await actualizarFecha({ id: cita._id, fechaCita: ms });
              setEditFecha(false);
            }} className="p-1.5 bg-[#0a2218] border border-[#0f3d28] rounded-lg text-[#34d399] hover:bg-[#0f3d28]/40"><Check size={12} /></button>
            <button onClick={() => setEditFecha(false)} className="p-1.5 bg-[#2a0e0e] border border-[#4a1a1a] rounded-lg text-[#f87171] hover:bg-[#4a1a1a]/40"><X size={12} /></button>
          </div>
        ) : (
          <button onClick={() => setEditFecha(true)} className="flex items-center gap-1.5 text-left group">
            <CalendarDays size={10} className={cita.fechaCita ? "text-[#f59e0b]" : "text-[#484f58] group-hover:text-[#8b949e]"} />
            <span className={`text-[11px] font-medium ${cita.fechaCita ? "text-[#f59e0b]" : "text-[#484f58] italic group-hover:text-[#8b949e]"} transition-colors`}>
              {cita.fechaCita ? formatFecha(cita.fechaCita) : "Agregar fecha de la cita..."}
            </span>
            <Pencil size={9} className="text-[#484f58] opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
          </button>
        )}
      </div>

      {/* nota */}
      <div>
        {editNota ? (
          <div className="flex gap-2">
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
              placeholder="Agregá una nota..."
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-[11px] text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#58a6ff]/40 resize-none placeholder-[#484f58]"
            />
            <div className="flex flex-col gap-1">
              <button onClick={async () => { await actualizarNotas({ id: cita._id, notas: nota }); setEditNota(false); }}
                className="p-1.5 bg-[#0a2218] border border-[#0f3d28] rounded-lg text-[#34d399] hover:bg-[#0f3d28]/40"><Check size={12} /></button>
              <button onClick={() => { setNota(cita.notas ?? ""); setEditNota(false); }}
                className="p-1.5 bg-[#2a0e0e] border border-[#4a1a1a] rounded-lg text-[#f87171] hover:bg-[#4a1a1a]/40"><X size={12} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditNota(true)} className="flex items-start gap-1.5 text-left w-full group">
            <StickyNote size={10} className="mt-0.5 shrink-0 text-[#484f58] group-hover:text-[#8b949e]" />
            <span className={`text-[11px] ${cita.notas ? "text-[#8b949e]" : "text-[#484f58] italic"} group-hover:text-[#e6edf3] transition-colors`}>
              {cita.notas || "Agregar nota..."}
            </span>
          </button>
        )}
      </div>

      {/* acciones */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#21262d]">
        {cita.estado === "pendiente" ? (
          <div className="flex gap-2">
            <button onClick={() => actualizarEstado({ id: cita._id, estado: "realizada" })}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-[#0a2218] border border-[#0f3d28] rounded-lg text-[#34d399] hover:bg-[#0f3d28]/40 transition-colors">
              <Check size={11} /> Realizada
            </button>
            <button onClick={() => actualizarEstado({ id: cita._id, estado: "cancelada" })}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-[#2a0e0e] border border-[#4a1a1a] rounded-lg text-[#f87171] hover:bg-[#4a1a1a]/40 transition-colors">
              <X size={11} /> Cancelada
            </button>
          </div>
        ) : (
          <button onClick={() => actualizarEstado({ id: cita._id, estado: "pendiente" })}
            className="w-full py-1.5 text-[11px] font-medium text-[#484f58] hover:text-[#8b949e] border border-[#21262d] rounded-lg hover:border-[#30363d] transition-colors">
            Revertir a pendiente
          </button>
        )}
        {confirmDelete ? (
          <div className="flex gap-2">
            <button onClick={async () => { await eliminar({ id: cita._id }); setConfirmDelete(false); }}
              className="flex-1 py-1.5 text-[11px] font-semibold bg-[#3d0a0a] border border-[#7f1d1d] rounded-lg text-[#fca5a5] hover:bg-[#7f1d1d]/40 transition-colors">
              Confirmar eliminación
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-[11px] text-[#484f58] border border-[#21262d] rounded-lg hover:text-[#8b949e] transition-colors">
              Cancelar
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-1.5 py-1 text-[10px] text-[#484f58] hover:text-[#f87171] transition-colors">
            <Trash2 size={10} /> Eliminar cita
          </button>
        )}
      </div>
    </div>
  );
}

// ── Recordatorio card ─────────────────────────────────────────────────────────

type Recordatorio = {
  _id: Id<"recordatorios">;
  prospectNombre: string;
  prospectTelefono?: string;
  nota?: string;
  fechaMs: number;
  estado: "pendiente" | "activo" | "cerrado";
  createdAt: number;
};

function RecordatorioCard({ rec }: { rec: Recordatorio }) {
  const cerrar = useMutation(api.recordatorios.cerrar);
  const vencido = rec.fechaMs < Date.now();

  const borderColor = rec.estado === "activo" ? "#1e3a5f"
    : rec.estado === "cerrado" ? "#2d3139"
    : vencido ? "#4a1a1a" : "#1e3a5f";

  const badge = rec.estado === "cerrado"
    ? "bg-[#1a1d23] text-[#6b7280] border border-[#2d3139]"
    : rec.estado === "activo"
    ? "bg-[#1c2f4a] text-[#60a5fa] border border-[#1e3a5f]"
    : vencido
    ? "bg-[#2a0e0e] text-[#f87171] border border-[#4a1a1a]"
    : "bg-[#0e1c35] text-[#60a5fa] border border-[#1e3a5f]";

  const badgeLabel = rec.estado === "cerrado" ? "Cerrado"
    : rec.estado === "activo" ? "Hoy"
    : vencido ? "Vencido" : "Pendiente";

  return (
    <div className={`bg-[#161b22] border rounded-xl p-4 flex flex-col gap-3 transition-opacity ${rec.estado === "cerrado" ? "opacity-40" : ""}`}
      style={{ borderColor }}>

      {/* tipo */}
      <div className="flex items-center gap-1.5">
        <Bell size={10} className="text-[#60a5fa]" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#60a5fa]">Recordatorio</span>
        <div className="flex-1" />
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>{badgeLabel}</span>
      </div>

      {/* nombre */}
      <div>
        <p className="font-semibold text-[#e6edf3] text-[14px] leading-tight">{rec.prospectNombre}</p>
        {rec.nota && <p className="text-[11px] text-[#8b949e] mt-1">{rec.nota}</p>}
      </div>

      {/* contacto + fecha */}
      <div className="flex items-center gap-4 text-[11px] text-[#8b949e]">
        {rec.prospectTelefono && (
          <span className="flex items-center gap-1.5 font-mono">
            <Phone size={10} className="text-[#60a5fa]" />
            +{rec.prospectTelefono.replace(/\D/g, "")}
          </span>
        )}
        <span className={`flex items-center gap-1.5 ${vencido && rec.estado !== "cerrado" ? "text-[#f87171]" : ""}`}>
          <Clock size={10} />
          {formatFecha(rec.fechaMs)}
        </span>
      </div>

      {/* acción */}
      {rec.estado !== "cerrado" && (
        <div className="pt-1 border-t border-[#21262d]">
          <button onClick={() => cerrar({ id: rec._id })}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-[#0a2218] border border-[#0f3d28] rounded-lg text-[#34d399] hover:bg-[#0f3d28]/40 transition-colors">
            <Check size={11} /> Listo, ya lo contacté
          </button>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

type Seccion = "todo" | "citas" | "recordatorios";

export default function Calendario() {
  const citas = useQuery(api.citas.list);
  const recordatorios = useQuery(api.recordatorios.listPendientes);
  const [seccion, setSeccion] = useState<Seccion>("todo");

  const citasList = (citas ?? []) as Cita[];
  const recsList = (recordatorios ?? []) as Recordatorio[];

  // incluir cerrados solo si el usuario los busca explícitamente en sus propias secciones
  const citasVis = seccion === "recordatorios" ? [] : citasList;
  const recsVis = seccion === "citas" ? [] : recsList;

  // ordenar todo junto por fecha más próxima
  type Item = { tipo: "cita"; data: Cita } | { tipo: "rec"; data: Recordatorio };
  const items: Item[] = [
    ...citasVis.map((c): Item => ({ tipo: "cita", data: c })),
    ...recsVis.map((r): Item => ({ tipo: "rec", data: r })),
  ].sort((a, b) => {
    const aMs = a.tipo === "cita" ? (a.data.fechaCita ?? a.data.createdAt) : a.data.fechaMs;
    const bMs = b.tipo === "cita" ? (b.data.fechaCita ?? b.data.createdAt) : b.data.fechaMs;
    return bMs - aMs;
  });

  const totalPendientes =
    citasList.filter((c) => c.estado === "pendiente").length +
    recsList.filter((r) => r.estado !== "cerrado").length;

  const loading = citas === undefined || recordatorios === undefined;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#30363d] pb-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={20} className="text-[#00ff9d]" />
          <div>
            <h1 className="text-lg font-bold text-[#e6edf3] tracking-tight">Calendario</h1>
            <p className="text-[11px] text-[#8b949e] mt-0.5">
              {totalPendientes > 0
                ? <><span className="text-[#f59e0b] font-semibold">{totalPendientes}</span> pendientes</>
                : "Citas y recordatorios"}
            </p>
          </div>
        </div>
        <a href="https://cal.com/marcelo-del-valle-bcgavl/30min" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors">
          <ExternalLink size={11} /> Cal.com
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#251a00] border border-[#3d2a00] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#f59e0b]">{citasList.filter(c => c.estado === "pendiente").length}</p>
          <p className="text-[10px] text-[#8b949e] mt-0.5 flex items-center justify-center gap-1"><CalendarDays size={9} /> Citas pendientes</p>
        </div>
        <div className="bg-[#0e1c35] border border-[#1e3a5f] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#60a5fa]">{recsList.filter(r => r.estado !== "cerrado").length}</p>
          <p className="text-[10px] text-[#8b949e] mt-0.5 flex items-center justify-center gap-1"><Bell size={9} /> Recordatorios activos</p>
        </div>
        <div className="bg-[#0a2218] border border-[#0f3d28] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#34d399]">{citasList.filter(c => c.estado === "realizada").length}</p>
          <p className="text-[10px] text-[#8b949e] mt-0.5 flex items-center justify-center gap-1"><Check size={9} /> Citas realizadas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: "todo", label: "Todo" },
          { key: "citas", label: "Citas del bot" },
          { key: "recordatorios", label: "Recordatorios" },
        ] as { key: Seccion; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setSeccion(key)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors ${
              seccion === key
                ? "bg-[#00ff9d]/10 border-[#00ff9d]/30 text-[#00ff9d]"
                : "border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58]"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-[#484f58] py-16 text-sm">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays size={32} className="text-[#30363d] mx-auto mb-3" />
          <p className="text-[#484f58] text-sm">
            {seccion === "citas"
              ? "Cuando el bot cierre una reunión, aparecerá acá."
              : seccion === "recordatorios"
              ? "No hay recordatorios activos."
              : "No hay citas ni recordatorios por ahora."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) =>
            item.tipo === "cita"
              ? <CitaCard key={`cita-${item.data._id}`} cita={item.data} />
              : <RecordatorioCard key={`rec-${item.data._id}`} rec={item.data} />
          )}
        </div>
      )}
    </div>
  );
}
