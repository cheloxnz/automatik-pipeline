"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CalendarDays, Phone, Check, X, Clock, ExternalLink,
  Bell, Trash2, Pencil, Plus, LayoutList, Calendar,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(ms: number) {
  return new Date(ms).toLocaleString("es-AR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function toDatetimeLocal(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Input helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-[#484f58] mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-[11px] text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#58a6ff]/40 placeholder-[#484f58]";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type Recordatorio = {
  _id: Id<"recordatorios">;
  prospectNombre: string;
  prospectTelefono?: string;
  nota?: string;
  fechaMs: number;
  estado: "pendiente" | "activo" | "cerrado";
  createdAt: number;
};

// ── Cita card ─────────────────────────────────────────────────────────────────

const CITA_BORDER: Record<string, string> = {
  pendiente: "#3d2a00", realizada: "#0f3d28", cancelada: "#4a1a1a",
};
const CITA_BADGE: Record<string, string> = {
  pendiente: "bg-[#251a00] text-[#f59e0b] border border-[#3d2a00]",
  realizada:  "bg-[#0a2218] text-[#34d399] border border-[#0f3d28]",
  cancelada:  "bg-[#2a0e0e] text-[#f87171] border border-[#4a1a1a]",
};

function CitaCard({ cita }: { cita: Cita }) {
  const actualizar = useMutation(api.citas.actualizar);
  const actualizarEstado = useMutation(api.citas.actualizarEstado);
  const eliminar = useMutation(api.citas.eliminar);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  // edit state
  const [nombre, setNombre] = useState(cita.prospectNombre);
  const [telefono, setTelefono] = useState(cita.prospectTelefono);
  const [ciudad, setCiudad] = useState(cita.prospectCiudad ?? "");
  const [nicho, setNicho] = useState(cita.prospectNicho ?? "");
  const [notas, setNotas] = useState(cita.notas ?? "");
  const [fechaInput, setFechaInput] = useState(cita.fechaCita ? toDatetimeLocal(cita.fechaCita) : "");

  function resetEdit() {
    setNombre(cita.prospectNombre);
    setTelefono(cita.prospectTelefono);
    setCiudad(cita.prospectCiudad ?? "");
    setNicho(cita.prospectNicho ?? "");
    setNotas(cita.notas ?? "");
    setFechaInput(cita.fechaCita ? toDatetimeLocal(cita.fechaCita) : "");
    setEditing(false);
  }

  async function guardar() {
    setSaving(true);
    try {
      await actualizar({
        id: cita._id,
        prospectNombre: nombre.trim() || undefined,
        prospectTelefono: telefono.trim() || undefined,
        prospectCiudad: ciudad.trim() || undefined,
        prospectNicho: nicho.trim() || undefined,
        notas: notas.trim() || undefined,
        fechaCita: fechaInput ? new Date(fechaInput).getTime() : undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="bg-[#161b22] border border-[#58a6ff]/30 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={10} className="text-[#00ff9d]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#00ff9d]">Editando cita</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Nombre">
            <input value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Teléfono">
            <input value={telefono} onChange={e => setTelefono(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ciudad">
            <input value={ciudad} onChange={e => setCiudad(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Rubro / Nicho">
            <input value={nicho} onChange={e => setNicho(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Fecha de la cita">
            <input type="datetime-local" value={fechaInput} onChange={e => setFechaInput(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Notas">
            <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas..." className={inputCls} />
          </Field>
        </div>

        <div className="flex gap-2 pt-1 border-t border-[#21262d]">
          <button onClick={guardar} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-[#0a2218] border border-[#0f3d28] rounded-lg text-[#34d399] hover:bg-[#0f3d28]/40 disabled:opacity-40 transition-colors">
            <Check size={11} /> {saving ? "Guardando..." : "Guardar"}
          </button>
          <button onClick={resetEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">
            <X size={11} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#161b22] border rounded-xl p-4 flex flex-col gap-3 transition-opacity ${cita.estado === "cancelada" ? "opacity-50" : ""}`}
      style={{ borderColor: CITA_BORDER[cita.estado] }}>

      <div className="flex items-center gap-1.5">
        <CalendarDays size={10} className="text-[#00ff9d]" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#00ff9d]">Cita agendada</span>
        <div className="flex-1" />
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-[10px] text-[#484f58] hover:text-[#8b949e] mr-2 transition-colors">
          <Pencil size={10} /> Editar
        </button>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CITA_BADGE[cita.estado]}`}>
          {cita.estado === "pendiente" ? "Pendiente" : cita.estado === "realizada" ? "Realizada" : "Cancelada"}
        </span>
      </div>

      <div>
        <p className="font-semibold text-[#e6edf3] text-[14px] leading-tight">{cita.prospectNombre}</p>
        <p className="text-[10px] text-[#484f58] mt-0.5">
          {[cita.prospectNicho, cita.prospectCiudad].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4 text-[11px] text-[#8b949e]">
          <span className="flex items-center gap-1.5 font-mono">
            <Phone size={10} className="text-[#60a5fa]" />
            +{cita.prospectTelefono}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#484f58]">
            <Clock size={9} /> guardado {formatFecha(cita.createdAt)}
          </span>
        </div>
        {cita.fechaCita ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#f59e0b]">
            <CalendarDays size={10} /> {formatFecha(cita.fechaCita)}
          </span>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-[11px] text-[#484f58] italic hover:text-[#8b949e] transition-colors text-left">
            <CalendarDays size={10} /> Agregar fecha de la cita...
          </button>
        )}
        {cita.notas && (
          <p className="text-[11px] text-[#8b949e] mt-0.5">{cita.notas}</p>
        )}
      </div>

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
            <button onClick={() => eliminar({ id: cita._id })}
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

function RecordatorioCard({ rec }: { rec: Recordatorio }) {
  const cerrar = useMutation(api.recordatorios.cerrar);
  const actualizar = useMutation(api.recordatorios.actualizar);
  const eliminar = useMutation(api.recordatorios.eliminar);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState(rec.prospectNombre);
  const [telefono, setTelefono] = useState(rec.prospectTelefono ?? "");
  const [nota, setNota] = useState(rec.nota ?? "");
  const [fechaInput, setFechaInput] = useState(toDatetimeLocal(rec.fechaMs));

  function resetEdit() {
    setNombre(rec.prospectNombre);
    setTelefono(rec.prospectTelefono ?? "");
    setNota(rec.nota ?? "");
    setFechaInput(toDatetimeLocal(rec.fechaMs));
    setEditing(false);
  }

  async function guardar() {
    setSaving(true);
    try {
      await actualizar({
        id: rec._id,
        prospectNombre: nombre.trim() || undefined,
        prospectTelefono: telefono.trim() || undefined,
        nota: nota.trim() || undefined,
        fechaMs: fechaInput ? new Date(fechaInput).getTime() : undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const vencido = rec.fechaMs < Date.now();

  const borderColor = rec.estado === "activo" ? "#1e3a5f"
    : rec.estado === "cerrado" ? "#2d3139"
    : vencido ? "#4a1a1a" : "#1e3a5f";

  const badge = rec.estado === "cerrado"
    ? "bg-[#1a1d23] text-[#6b7280] border border-[#2d3139]"
    : rec.estado === "activo" ? "bg-[#1c2f4a] text-[#60a5fa] border border-[#1e3a5f]"
    : vencido ? "bg-[#2a0e0e] text-[#f87171] border border-[#4a1a1a]"
    : "bg-[#0e1c35] text-[#60a5fa] border border-[#1e3a5f]";

  const badgeLabel = rec.estado === "cerrado" ? "Cerrado"
    : rec.estado === "activo" ? "Hoy"
    : vencido ? "Vencido" : "Pendiente";

  if (editing) {
    return (
      <div className="bg-[#161b22] border border-[#58a6ff]/30 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <Bell size={10} className="text-[#60a5fa]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#60a5fa]">Editando recordatorio</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Nombre">
            <input value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Teléfono">
            <input value={telefono} onChange={e => setTelefono(e.target.value)} className={inputCls} />
          </Field>
          <div className="col-span-2">
            <Field label="Fecha y hora">
              <input type="datetime-local" value={fechaInput} onChange={e => setFechaInput(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Nota">
              <input value={nota} onChange={e => setNota(e.target.value)} placeholder="Ej: llamar para seguimiento" className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="flex gap-2 pt-1 border-t border-[#21262d]">
          <button onClick={guardar} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-[#0a2218] border border-[#0f3d28] rounded-lg text-[#34d399] hover:bg-[#0f3d28]/40 disabled:opacity-40 transition-colors">
            <Check size={11} /> {saving ? "Guardando..." : "Guardar"}
          </button>
          <button onClick={resetEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">
            <X size={11} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#161b22] border rounded-xl p-4 flex flex-col gap-3 transition-opacity ${rec.estado === "cerrado" ? "opacity-40" : ""}`}
      style={{ borderColor }}>

      <div className="flex items-center gap-1.5">
        <Bell size={10} className="text-[#60a5fa]" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#60a5fa]">Recordatorio</span>
        <div className="flex-1" />
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-[10px] text-[#484f58] hover:text-[#8b949e] mr-2 transition-colors">
          <Pencil size={10} /> Editar
        </button>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>{badgeLabel}</span>
      </div>

      <div>
        <p className="font-semibold text-[#e6edf3] text-[14px] leading-tight">{rec.prospectNombre}</p>
        {rec.nota && <p className="text-[11px] text-[#8b949e] mt-1">{rec.nota}</p>}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-[#8b949e]">
        {rec.prospectTelefono && (
          <span className="flex items-center gap-1.5 font-mono">
            <Phone size={10} className="text-[#60a5fa]" />
            +{rec.prospectTelefono.replace(/\D/g, "")}
          </span>
        )}
        <span className={`flex items-center gap-1.5 ${vencido && rec.estado !== "cerrado" ? "text-[#f87171]" : ""}`}>
          <Clock size={10} /> {formatFecha(rec.fechaMs)}
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-[#21262d]">
        {rec.estado !== "cerrado" && (
          <button onClick={() => cerrar({ id: rec._id })}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-[#0a2218] border border-[#0f3d28] rounded-lg text-[#34d399] hover:bg-[#0f3d28]/40 transition-colors">
            <Check size={11} /> Listo, ya lo contacté
          </button>
        )}
        {confirmDelete ? (
          <div className="flex gap-2">
            <button onClick={() => eliminar({ id: rec._id })}
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
            <Trash2 size={10} /> Eliminar recordatorio
          </button>
        )}
      </div>
    </div>
  );
}

// ── Form nuevo recordatorio ───────────────────────────────────────────────────

function NuevoRecordatorioForm({ onClose }: { onClose: () => void }) {
  const crear = useMutation(api.recordatorios.crear);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!nombre.trim() || !fecha) return;
    setLoading(true);
    try {
      await crear({
        prospectNombre: nombre.trim(),
        prospectTelefono: telefono.trim() || undefined,
        nota: nota.trim() || undefined,
        fechaMs: new Date(fecha).getTime(),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#161b22] border border-[#1e3a5f] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Bell size={12} className="text-[#60a5fa]" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#60a5fa]">Nuevo recordatorio</span>
        <div className="flex-1" />
        <button onClick={onClose} className="text-[#484f58] hover:text-[#8b949e]"><X size={14} /></button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Field label="Nombre *">
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del contacto" className={inputCls} />
          </Field>
        </div>
        <Field label="Teléfono">
          <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="549..." className={inputCls} />
        </Field>
        <Field label="Fecha y hora *">
          <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
        </Field>
        <div className="col-span-2">
          <Field label="Nota">
            <input value={nota} onChange={e => setNota(e.target.value)} placeholder="Ej: llamar para hacer seguimiento" className={inputCls} />
          </Field>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading || !nombre.trim() || !fecha}
        className="w-full py-2 text-[11px] font-semibold bg-[#1c2f4a] border border-[#1e3a5f] rounded-lg text-[#60a5fa] hover:bg-[#1e3a5f]/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        {loading ? "Guardando..." : "Crear recordatorio"}
      </button>
    </div>
  );
}

// ── Vista semana ──────────────────────────────────────────────────────────────

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function VistaSemana({ citas, recordatorios }: { citas: Cita[]; recordatorios: Recordatorio[] }) {
  const [semanaOffset, setSemanaOffset] = useState(0);
  const hoy = new Date();
  const lunes = startOfWeek(hoy);
  lunes.setDate(lunes.getDate() + semanaOffset * 7);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });

  const esMismoDia = (ms: number, day: Date) => {
    const d = new Date(ms);
    return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
  };

  const esHoy = (day: Date) => {
    const h = new Date();
    return day.getDate() === h.getDate() && day.getMonth() === h.getMonth() && day.getFullYear() === h.getFullYear();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setSemanaOffset(o => o - 1)}
          className="px-3 py-1.5 text-[11px] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">
          ← Anterior
        </button>
        <span className="text-[11px] text-[#8b949e]">
          {dias[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" })} — {dias[6].toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <button onClick={() => setSemanaOffset(o => o + 1)}
          className="px-3 py-1.5 text-[11px] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">
          Siguiente →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((day, i) => {
          const citasDelDia = citas.filter(c => c.fechaCita && esMismoDia(c.fechaCita, day) && c.estado === "pendiente");
          const recsDelDia = recordatorios.filter(r => esMismoDia(r.fechaMs, day) && r.estado !== "cerrado");
          const total = citasDelDia.length + recsDelDia.length;
          const hoyDia = esHoy(day);

          return (
            <div key={i} className={`min-h-[120px] rounded-xl border p-2 flex flex-col gap-1.5 ${
              hoyDia ? "border-[#00ff9d]/30 bg-[#00ff9d]/5" : "border-[#21262d] bg-[#0d1117]"
            }`}>
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#484f58]">{DIAS[i]}</p>
                <p className={`text-[16px] font-bold leading-tight ${hoyDia ? "text-[#00ff9d]" : "text-[#e6edf3]"}`}>{day.getDate()}</p>
                {total > 0 && <span className="text-[9px] text-[#484f58]">{total} evento{total > 1 ? "s" : ""}</span>}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                {citasDelDia.map(c => (
                  <div key={c._id} className="flex items-start gap-1 bg-[#251a00] border border-[#3d2a00] rounded-lg px-1.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-[#f59e0b] truncate leading-tight">{c.prospectNombre}</p>
                      {c.fechaCita && <p className="text-[8px] text-[#8b949e]">{new Date(c.fechaCita).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}</p>}
                    </div>
                  </div>
                ))}
                {recsDelDia.map(r => (
                  <div key={r._id} className="flex items-start gap-1 bg-[#0e1c35] border border-[#1e3a5f] rounded-lg px-1.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-[#60a5fa] truncate leading-tight">{r.prospectNombre}</p>
                      <p className="text-[8px] text-[#8b949e]">{new Date(r.fechaMs).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 justify-end">
        <span className="flex items-center gap-1.5 text-[10px] text-[#484f58]">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Cita agendada
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#484f58]">
          <span className="w-2 h-2 rounded-full bg-[#60a5fa]" /> Recordatorio
        </span>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

type Seccion = "todo" | "citas" | "recordatorios";
type Vista = "lista" | "semana";

export default function Calendario() {
  const citas = useQuery(api.citas.list);
  const recordatorios = useQuery(api.recordatorios.listPendientes);
  const [seccion, setSeccion] = useState<Seccion>("todo");
  const [vista, setVista] = useState<Vista>("lista");
  const [mostrarFormRec, setMostrarFormRec] = useState(false);

  const citasList = (citas ?? []) as Cita[];
  const recsList = (recordatorios ?? []) as Recordatorio[];

  const citasVis = seccion === "recordatorios" ? [] : citasList;
  const recsVis = seccion === "citas" ? [] : recsList;

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
    citasList.filter(c => c.estado === "pendiente").length +
    recsList.filter(r => r.estado !== "cerrado").length;

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
        <div className="flex items-center gap-2">
          <button onClick={() => setMostrarFormRec(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-[#1c2f4a]/60 border border-[#1e3a5f] rounded-lg text-[#60a5fa] hover:bg-[#1e3a5f]/60 transition-colors">
            <Plus size={11} /> Recordatorio
          </button>
          <a href="https://cal.com/marcelo-del-valle-bcgavl/30min" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors">
            <ExternalLink size={11} /> Cal.com
          </a>
        </div>
      </div>

      {mostrarFormRec && (
        <div className="mb-5">
          <NuevoRecordatorioForm onClose={() => setMostrarFormRec(false)} />
        </div>
      )}

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

      {/* Tabs + toggle */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
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
        <div className="flex gap-1 bg-[#0d1117] border border-[#21262d] rounded-lg p-0.5">
          <button onClick={() => setVista("lista")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${vista === "lista" ? "bg-[#21262d] text-[#e6edf3]" : "text-[#484f58] hover:text-[#8b949e]"}`}>
            <LayoutList size={11} /> Lista
          </button>
          <button onClick={() => setVista("semana")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${vista === "semana" ? "bg-[#21262d] text-[#e6edf3]" : "text-[#484f58] hover:text-[#8b949e]"}`}>
            <Calendar size={11} /> Semana
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="text-center text-[#484f58] py-16 text-sm">Cargando...</div>
      ) : vista === "semana" ? (
        <VistaSemana citas={citasVis} recordatorios={recsVis} />
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays size={32} className="text-[#30363d] mx-auto mb-3" />
          <p className="text-[#484f58] text-sm">
            {seccion === "citas" ? "Cuando el bot cierre una reunión, aparecerá acá."
              : seccion === "recordatorios" ? "No hay recordatorios activos."
              : "No hay citas ni recordatorios por ahora."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item =>
            item.tipo === "cita"
              ? <CitaCard key={`cita-${item.data._id}`} cita={item.data} />
              : <RecordatorioCard key={`rec-${item.data._id}`} rec={item.data} />
          )}
        </div>
      )}
    </div>
  );
}
