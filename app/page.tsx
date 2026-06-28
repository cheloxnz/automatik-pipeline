"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Component, ReactNode, useState, useEffect } from "react";
import {
  MessageSquare, Users, CheckCircle2, TrendingUp,
  DollarSign, Zap, Activity, Phone, ArrowRight,
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
          <p className="text-[11px] text-(--color-text-muted) font-mono">{this.state.err}</p>
          <p className="text-[11px] text-(--color-text-muted) mt-2">
            Andá a <b className="text-(--color-text)">Prospectos → Limpiar todo</b> y reimportá el CSV.
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

/* ── WhatsApp Bot Card ──────────────────────────────── */
function BotCard({ phoneId, label, enviados, pendientes, spark }: {
  phoneId: string; label: string; enviados: number; pendientes: number; spark: number[];
}) {
  return (
    <div className="bg-[#0d1117] border border-[#00ff9d]/20 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={12} className="text-[#00ff9d]" />
          <span className="text-[10px] text-(--color-text-muted) font-mono tracking-widest uppercase">WhatsApp Bot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
          <span className="text-[10px] text-[#00ff9d] tracking-widest uppercase">Active</span>
        </div>
      </div>
      <p className="text-[11px] font-mono text-(--color-text)">{label}</p>
      <div className="flex gap-6">
        <div>
          <p className="text-[10px] text-(--color-text-muted) uppercase tracking-wider mb-0.5">Enviados</p>
          <p className="text-xl font-medium text-(--color-text)">{enviados}</p>
        </div>
        <div>
          <p className="text-[10px] text-(--color-text-muted) uppercase tracking-wider mb-0.5">Pendientes</p>
          <p className="text-xl font-medium text-(--color-text)">{pendientes}</p>
        </div>
      </div>
      {spark.length > 1 && <Sparkline values={spark} />}
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
    <div className="bg-(--color-base) border border-(--color-border) rounded-xl p-5 flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-(--color-text-muted) uppercase tracking-[3px]">{label}</p>
        {Icon && <Icon size={13} className="text-(--color-text-muted)" />}
      </div>
      <p className={`font-medium tracking-tight ${accent ? "text-5xl text-[#00ff9d]" : "text-4xl text-(--color-text)"}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-(--color-text-muted)">{sub}</p>}
      {detail && (
        <div className="mt-2 border-t border-(--color-border-subtle) pt-3 space-y-1.5">
          {detail.map(({ label: l, value: v }) => (
            <div key={l} className="flex justify-between">
              <span className="text-[10px] text-(--color-text-muted)">› {l}</span>
              <span className="text-[10px] text-(--color-text) font-mono">{v}</span>
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
    <div className="bg-(--color-base) border border-(--color-border) rounded-xl p-4 hover:border-[#00ff9d]/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{nichoIcon(name)}</span>
        <span className="text-[10px] text-[#00ff9d] bg-[#00ff9d]/10 px-2 py-0.5 rounded-full font-medium">
          {pct}%
        </span>
      </div>
      <p className="text-[11px] text-(--color-text) font-medium mb-1 leading-tight">{name}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-medium text-(--color-text)">{total}</span>
        <span className="text-[10px] text-(--color-text-muted)">leads</span>
      </div>
      <div className="mt-2 bg-[#21262d] rounded-full h-1">
        <div className="h-1 rounded-full bg-[#00ff9d]" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <p className="text-[10px] text-(--color-text-muted) mt-1">{contactados} contactados</p>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────── */
const TICKET = 500;
const COSTO_SISTEMA = 30;

function DashboardContent() {
  const stats = useQuery(api.prospects.stats);
  const nichosData = useQuery(api.prospects.statsByNicho);
  const porPais = useQuery(api.prospects.statsByPais);
  const sparkData = useQuery(api.prospects.enviosPorDia);
  const [phoneLabel] = useState("+54 9 11 6507-1385");

  if (!stats || nichosData === undefined || porPais === undefined) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <Activity size={16} className="text-[#00ff9d] animate-pulse" />
        <span className="text-[11px] text-(--color-text-muted) tracking-widest uppercase">Cargando sistema...</span>
      </div>
    );
  }

  /* derived — usa ingresos reales si hay cierres con monto, sino estimado */
  const ingresoReal = stats.ingresoReal ?? 0;
  const ingresos = ingresoReal > 0 ? ingresoReal : stats.cerrados * TICKET;
  const ticketPromedio = stats.ticketPromedio && stats.ticketPromedio > 0 ? stats.ticketPromedio : TICKET;
  const roi = ingresos > 0 ? Math.round(ingresos / COSTO_SISTEMA) : 0;
  const cac = stats.cerrados > 0 ? (COSTO_SISTEMA / stats.cerrados).toFixed(2) : "—";
  const costoPorLead = stats.total > 0 ? (COSTO_SISTEMA / stats.total).toFixed(2) : "—";
  const costoPorReunion = stats.respondieron > 0 ? (COSTO_SISTEMA / stats.respondieron).toFixed(2) : "—";
  const profitNeto = ingresos - COSTO_SISTEMA;

  const nichosArr = nichosData ?? [];

  const today = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="p-5 space-y-5 min-h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-(--color-border) pb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Zap size={14} className="text-[#00ff9d]" />
            <h1 className="text-xs font-bold tracking-[4px] uppercase text-(--color-text)">Automatik Pipeline</h1>
          </div>
          <p className="text-[10px] text-(--color-text-muted) tracking-[2px] uppercase ml-5">Outreach Command Center</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
            <span className="text-[10px] text-[#00ff9d] tracking-widest uppercase">System Online</span>
          </div>
          <span className="text-[10px] text-(--color-text-muted) font-mono">{today} · <LiveClock /></span>
        </div>
      </div>

      {/* ── Bot + Quick Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="animate-card-in" style={{ "--i": "0" } as React.CSSProperties}>
          <BotCard phoneId="1236307326213120" label={phoneLabel} enviados={stats.enviados} pendientes={stats.pendientes} spark={sparkData ?? []} />
        </div>
        <div className="animate-card-in bg-(--color-base) border border-(--color-border) rounded-xl p-5 flex flex-col justify-between" style={{ "--i": "1" } as React.CSSProperties}>
          <p className="text-[10px] text-(--color-text-muted) uppercase tracking-[3px]">Respondieron</p>
          <div>
            <p className={`text-5xl font-medium tracking-tight ${stats.respondieron > 0 ? "text-[#f59e0b]" : "text-(--color-text-faint)"}`}>{stats.respondieron}</p>
            <p className="text-[10px] text-(--color-text-muted) mt-1">tasa {stats.tasaRespuesta}%</p>
          </div>
        </div>
        <div className="animate-card-in bg-(--color-base) border border-(--color-border) rounded-xl p-5 flex flex-col justify-between" style={{ "--i": "2" } as React.CSSProperties}>
          <p className="text-[10px] text-(--color-text-muted) uppercase tracking-[3px]">Cerrados</p>
          <div>
            <p className={`text-5xl font-medium tracking-tight ${stats.cerrados > 0 ? "text-[#34d399]" : "text-(--color-text-faint)"}`}>{stats.cerrados}</p>
            <p className="text-[10px] text-(--color-text-muted) mt-1">conversión {stats.tasaConversion}%</p>
          </div>
        </div>
      </div>

      {/* ── Funnel visual ── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-(--color-text-muted) uppercase tracking-[3px]">Funnel de conversión</p>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-(--color-text-muted)">
            Respuesta <span className={`font-bold ml-1 ${stats.tasaRespuesta >= 15 ? "text-[#3fb950]" : stats.tasaRespuesta >= 5 ? "text-[#d29922]" : "text-[#f85149]"}`}>{stats.tasaRespuesta}%</span>
          </span>
          <span className="text-[10px] text-(--color-text-muted)">
            Cierre <span className={`font-bold ml-1 ${stats.tasaConversion >= 10 ? "text-[#3fb950]" : stats.tasaConversion >= 3 ? "text-[#d29922]" : "text-[#f85149]"}`}>{stats.tasaConversion}%</span>
          </span>
        </div>
      </div>

      <div className="bg-(--color-base) border border-(--color-border) rounded-xl p-5">
        {(() => {
          const stages = [
            { label: "Total leads", value: stats.total, color: "#484f58", icon: Users },
            { label: "Enviados", value: stats.enviados, color: "#58a6ff", icon: MessageSquare },
            { label: "Respondieron", value: stats.respondieron, color: "#d29922", icon: TrendingUp },
            { label: "Cerrados", value: stats.cerrados, color: "#00ff9d", icon: CheckCircle2 },
          ];
          const max = Math.max(stats.total, 1);
          return (
            <div className="space-y-3">
              {stages.map((s, i) => {
                const pct = Math.max((s.value / max) * 100, s.value > 0 ? 2 : 0);
                const dropPct = i > 0 && stages[i - 1].value > 0
                  ? Math.round((s.value / stages[i - 1].value) * 100)
                  : null;
                const Icon = s.icon;
                return (
                  <div key={s.label}>
                    <div className="flex items-center gap-3 mb-1">
                      <Icon size={11} style={{ color: s.color }} className="shrink-0" />
                      <span className="text-[10px] text-(--color-text-muted) w-28 shrink-0">{s.label}</span>
                      <div className="flex-1 bg-(--color-surface) rounded-full h-7 overflow-hidden relative">
                        <div
                          className="h-full rounded-full flex items-center pl-2.5 transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: s.color + "26", borderLeft: `2px solid ${s.color}` }}
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: s.color }}>
                          {s.value.toLocaleString()}
                        </span>
                      </div>
                      {dropPct !== null ? (
                        <span className={`text-[10px] font-bold w-12 text-right ${dropPct >= 20 ? "text-[#3fb950]" : dropPct >= 8 ? "text-[#d29922]" : "text-[#f85149]"}`}>
                          {dropPct}%
                        </span>
                      ) : (
                        <span className="w-12" />
                      )}
                    </div>
                  </div>
                );
              })}
              {/* drop labels */}
              <div className="flex items-center gap-3 pt-1 border-t border-(--color-border-subtle)">
                <span className="text-[10px] text-(--color-text-faint) w-[calc(28px+112px+12px)]">Conversión por etapa →</span>
                <div className="flex-1 flex justify-around text-[10px] text-(--color-text-faint)">
                  {[
                    stats.total > 0 ? `${Math.round((stats.enviados / stats.total) * 100)}% enviado` : "—",
                    stats.enviados > 0 ? `${stats.tasaRespuesta}% respondió` : "—",
                    stats.respondieron > 0 ? `${Math.round((stats.cerrados / stats.respondieron) * 100)}% cerrado` : "—",
                  ].map((t, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <ArrowRight size={8} className="text-(--color-text-faint)" /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Revenue ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            label: "Ingresos generados",
            value: `USD ${ingresos.toLocaleString()}`,
            sub: `${stats.cerrados} clientes · ticket prom. USD ${ticketPromedio.toLocaleString()}`,
            accent: true as const,
            icon: DollarSign,
            detail: [
              { label: "Clientes cerrados", value: stats.cerrados.toString() },
              { label: "Ticket promedio", value: `USD ${TICKET}` },
              { label: "Inversión total", value: `USD ${COSTO_SISTEMA}` },
              { label: "Profit neto", value: `USD ${profitNeto.toLocaleString()}` },
            ],
          },
          {
            label: "CAC",
            value: `USD ${cac}`,
            sub: "Costo por adquisición",
            icon: Activity,
            detail: [
              { label: "Costo / Lead", value: `USD ${costoPorLead}` },
              { label: "Costo / Reunión", value: `USD ${costoPorReunion}` },
            ],
          },
          {
            label: "ROI",
            value: `${roi}x`,
            sub: `${roi > 0 ? (roi * 100).toLocaleString() + "%" : "0%"} retorno sobre inversión`,
            icon: Zap,
            detail: [
              { label: "Por cada USD 1", value: `USD ${roi}` },
              { label: "Payback", value: roi > 0 ? "+1 día" : "—" },
            ],
          },
        ].map((card, i) => (
          <div key={card.label} className="animate-card-in" style={{ "--i": String(i + 3) } as React.CSSProperties}>
            <MetricCard {...card} />
          </div>
        ))}
      </div>

      {/* ── Nichos ── */}
      {nichosArr.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-(--color-text-muted) uppercase tracking-[3px]">
              Negocios / Contactados
            </p>
            <p className="text-[10px] text-(--color-text-muted)">
              {stats.total} leads · {nichosArr.length} nichos distintos
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {nichosArr.map(({ nicho, total, contactados }) => (
              <NichoTile key={nicho} name={nicho} total={total} contactados={contactados} />
            ))}
          </div>
        </>
      )}

      {/* ── Por País ── */}
      {porPais && porPais.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-(--color-text-muted) uppercase tracking-[3px]">Cobertura por País</p>
            <p className="text-[10px] text-(--color-text-muted)">{porPais.length} países con prospectos</p>
          </div>
          <div className="bg-(--color-base) border border-(--color-border) rounded-xl p-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {porPais.map(({ pais, total }) => {
                const pct = stats.total > 0 ? Math.round((total / stats.total) * 100) : 0;
                return (
                  <div key={pais} className="flex items-center gap-3">
                    <div className="w-28 shrink-0">
                      <span className="text-[11px] font-semibold text-(--color-text)">{pais}</span>
                    </div>
                    <div className="flex-1 bg-(--color-surface) rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#00ff9d]/60 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-(--color-text) w-12 text-right">{total.toLocaleString()}</span>
                    <span className="text-[10px] text-(--color-text-faint) w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
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
