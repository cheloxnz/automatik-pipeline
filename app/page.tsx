"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Component, ReactNode, useState } from "react";
import {
  MessageSquare, Users, CheckCircle2, TrendingUp,
  DollarSign, Zap, Activity, Phone,
} from "lucide-react";

/* ── Error Boundary ─────────────────────────────────── */
class ErrorBoundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null };
  static getDerivedStateFromError(e: Error) { return { err: e.message }; }
  render() {
    if (this.state.err) return (
      <div className="p-6">
        <div className="bg-[#2d1313] border border-[#f85149]/30 rounded-xl p-5">
          <p className="text-[#f85149] text-sm font-medium mb-2">Error al cargar</p>
          <p className="text-[11px] text-[#8b949e] font-mono">{this.state.err}</p>
          <p className="text-[11px] text-[#8b949e] mt-2">
            Andá a <b className="text-[#e6edf3]">Prospectos → Limpiar todo</b> y reimportá el CSV.
          </p>
        </div>
      </div>
    );
    return this.props.children;
  }
}

/* ── Clock ──────────────────────────────────────────── */
function LiveClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("es-AR", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{t}</span>;
}

/* ── Sparkline ──────────────────────────────────────── */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const w = 120, h = 24;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <polyline fill="none" stroke="#00ff9d" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

/* ── Fake sparkline data (activity simulation) ──────── */
const SPARK = [3, 7, 5, 12, 8, 15, 11, 9, 14, 18, 13, 20, 16, 22, 17];

/* ── WhatsApp Bot Card ──────────────────────────────── */
function BotCard({ phoneId, label, enviados, pendientes }: {
  phoneId: string; label: string; enviados: number; pendientes: number;
}) {
  return (
    <div className="bg-[#0d1117] border border-[#00ff9d]/20 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={12} className="text-[#00ff9d]" />
          <span className="text-[10px] text-[#8b949e] font-mono tracking-widest uppercase">WhatsApp Bot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
          <span className="text-[9px] text-[#00ff9d] tracking-widest uppercase">Active</span>
        </div>
      </div>
      <p className="text-[11px] font-mono text-[#e6edf3]">{label}</p>
      <div className="flex gap-6">
        <div>
          <p className="text-[9px] text-[#8b949e] uppercase tracking-wider mb-0.5">Enviados</p>
          <p className="text-xl font-medium text-[#e6edf3]">{enviados}</p>
        </div>
        <div>
          <p className="text-[9px] text-[#8b949e] uppercase tracking-wider mb-0.5">Pendientes</p>
          <p className="text-xl font-medium text-[#e6edf3]">{pendientes}</p>
        </div>
      </div>
      <Sparkline values={SPARK} />
    </div>
  );
}

/* ── Big Metric Card ────────────────────────────────── */
function MetricCard({
  label, value, sub, accent, icon: Icon, detail,
}: {
  label: string; value: string; sub?: string; accent?: boolean;
  icon?: typeof MessageSquare; detail?: { label: string; value: string }[];
}) {
  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[9px] text-[#8b949e] uppercase tracking-[3px]">{label}</p>
        {Icon && <Icon size={13} className="text-[#8b949e]" />}
      </div>
      <p className={`text-4xl font-medium tracking-tight ${accent ? "text-[#00ff9d]" : "text-[#e6edf3]"}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[#8b949e]">{sub}</p>}
      {detail && (
        <div className="mt-2 border-t border-[#1c2128] pt-3 space-y-1.5">
          {detail.map(({ label: l, value: v }) => (
            <div key={l} className="flex justify-between">
              <span className="text-[10px] text-[#8b949e]">› {l}</span>
              <span className="text-[10px] text-[#e6edf3] font-mono">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Nicho Tile ─────────────────────────────────────── */
const NICHO_ICONS: Record<string, string> = {
  "Spa": "💆", "Inmobiliaria": "🏠", "Belleza": "💅", "Peluquería": "✂️",
  "Salud": "❤️", "Veterinaria": "🐾", "Fotografía": "📷", "Restaurante": "🍽️",
  "Estética": "✨", "Gym": "💪", "Dental": "🦷", "Clínica": "🏥",
  "Marketing": "📣", "Tienda": "🛍️", "Ferretería": "🔧", "Auto": "🚗",
};
function nichoIcon(name: string) {
  for (const [k, v] of Object.entries(NICHO_ICONS)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "🏢";
}

function NichoTile({ name, total, contactados }: { name: string; total: number; contactados: number }) {
  const pct = total > 0 ? Math.round((contactados / total) * 100) : 0;
  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 hover:border-[#00ff9d]/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{nichoIcon(name)}</span>
        <span className="text-[9px] text-[#00ff9d] bg-[#00ff9d]/10 px-2 py-0.5 rounded-full font-medium">
          {pct}%
        </span>
      </div>
      <p className="text-[11px] text-[#e6edf3] font-medium mb-1 leading-tight">{name}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-medium text-[#e6edf3]">{total}</span>
        <span className="text-[9px] text-[#8b949e]">leads</span>
      </div>
      <div className="mt-2 bg-[#21262d] rounded-full h-1">
        <div className="h-1 rounded-full bg-[#00ff9d]" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <p className="text-[9px] text-[#8b949e] mt-1">{contactados} contactados</p>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────── */
const TICKET = 500;
const COSTO_SISTEMA = 30;

function DashboardContent() {
  const stats = useQuery(api.prospects.stats);
  const allProspects = useQuery(api.prospects.list);
  const [phoneLabel] = useState("+54 9 11 4085-4065");

  if (!stats || !allProspects) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <Activity size={16} className="text-[#00ff9d] animate-pulse" />
        <span className="text-[11px] text-[#8b949e] tracking-widest uppercase">Cargando sistema...</span>
      </div>
    );
  }

  /* derived */
  const ingresos = stats.cerrados * TICKET;
  const roi = ingresos > 0 ? Math.round(ingresos / COSTO_SISTEMA) : 0;
  const cac = stats.cerrados > 0 ? (COSTO_SISTEMA / stats.cerrados).toFixed(2) : "—";
  const costoPorLead = stats.total > 0 ? (COSTO_SISTEMA / stats.total).toFixed(2) : "—";
  const costoPorReunion = stats.respondieron > 0 ? (COSTO_SISTEMA / stats.respondieron).toFixed(2) : "—";
  const profitNeto = ingresos - COSTO_SISTEMA;

  /* byNicho from list */
  const byNicho: Record<string, { total: number; contactados: number }> = {};
  for (const p of allProspects) {
    const k = p.nicho || "Sin nicho";
    if (!byNicho[k]) byNicho[k] = { total: 0, contactados: 0 };
    byNicho[k].total++;
    if (p.estado !== "pendiente") byNicho[k].contactados++;
  }
  const nichosArr = Object.entries(byNicho).sort((a, b) => b[1].total - a[1].total);

  const today = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="p-5 space-y-5 min-h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Zap size={14} className="text-[#00ff9d]" />
            <h1 className="text-xs font-bold tracking-[4px] uppercase text-[#e6edf3]">Automatik Pipeline</h1>
          </div>
          <p className="text-[9px] text-[#8b949e] tracking-[2px] uppercase ml-5">Outreach Command Center</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
            <span className="text-[9px] text-[#00ff9d] tracking-widest uppercase">System Online</span>
          </div>
          <span className="text-[10px] text-[#8b949e] font-mono">{today} · <LiveClock /></span>
        </div>
      </div>

      {/* ── Bot Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <BotCard phoneId="1185795881287585" label={phoneLabel} enviados={stats.enviados} pendientes={stats.pendientes} />
        <div className="bg-[#0d1117] border border-[#30363d]/40 rounded-xl p-4 flex items-center justify-center">
          <p className="text-[10px] text-[#484f58] tracking-widest uppercase">Bot 2 — No configurado</p>
        </div>
        <div className="bg-[#0d1117] border border-[#30363d]/40 rounded-xl p-4 flex items-center justify-center">
          <p className="text-[10px] text-[#484f58] tracking-widest uppercase">Bot 3 — No configurado</p>
        </div>
      </div>

      {/* ── Pipeline / Últimos 30 días ── */}
      <p className="text-[9px] text-[#8b949e] uppercase tracking-[3px]">Pipeline · Últimos 30 días</p>
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Mensajes enviados"
          value={stats.enviados.toString()}
          sub={`${stats.total > 0 ? Math.round((stats.enviados / stats.total) * 100) : 0}% del total`}
          icon={MessageSquare}
        />
        <MetricCard
          label="Respuestas"
          value={stats.respondieron.toString()}
          sub={`Tasa respuesta: ${stats.tasaRespuesta}%`}
          icon={TrendingUp}
        />
        <MetricCard
          label="Reuniones / Interesados"
          value={stats.respondieron.toString()}
          sub={`${stats.respondieron} este período`}
          icon={Users}
        />
        <MetricCard
          label="Tasa de cierre"
          value={`${stats.tasaConversion}%`}
          sub={`${stats.cerrados} cierres / ${stats.enviados} enviados`}
          icon={CheckCircle2}
        />
      </div>

      {/* ── Revenue ── */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Ingresos generados"
          value={`USD ${ingresos.toLocaleString()}`}
          sub={`${stats.cerrados} clientes cerrados · ticket USD ${TICKET}`}
          accent
          icon={DollarSign}
          detail={[
            { label: "Clientes cerrados", value: stats.cerrados.toString() },
            { label: "Ticket promedio", value: `USD ${TICKET}` },
            { label: "Inversión total", value: `USD ${COSTO_SISTEMA}` },
            { label: "Profit neto", value: `USD ${profitNeto.toLocaleString()}` },
          ]}
        />
        <MetricCard
          label="CAC"
          value={`USD ${cac}`}
          sub="Costo por adquisición"
          icon={Activity}
          detail={[
            { label: "Costo / Lead", value: `USD ${costoPorLead}` },
            { label: "Costo / Reunión", value: `USD ${costoPorReunion}` },
          ]}
        />
        <MetricCard
          label="ROI"
          value={`${roi}x`}
          sub={`${roi > 0 ? (roi * 100).toLocaleString() + "%" : "0%"} retorno sobre inversión`}
          icon={Zap}
          detail={[
            { label: "Por cada USD 1", value: `USD ${roi}` },
            { label: "Payback", value: roi > 0 ? "+1 día" : "—" },
          ]}
        />
      </div>

      {/* ── Nichos ── */}
      {nichosArr.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-[#8b949e] uppercase tracking-[3px]">
              Negocios / Contactados
            </p>
            <p className="text-[9px] text-[#8b949e]">
              {stats.total} leads · {Object.keys(byNicho).length} nichos distintos
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {nichosArr.map(([name, { total, contactados }]) => (
              <NichoTile key={name} name={name} total={total} contactados={contactados} />
            ))}
          </div>
        </>
      )}

    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
