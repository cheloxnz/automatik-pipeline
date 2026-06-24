"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Component, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null };
  static getDerivedStateFromError(e: Error) { return { err: e.message }; }
  render() {
    if (this.state.err) {
      return (
        <div className="p-6 space-y-4">
          <div className="bg-[#2d1313] border border-[#f85149]/30 rounded-xl p-5">
            <p className="text-[#f85149] text-sm font-medium mb-2">Error al cargar el dashboard</p>
            <p className="text-[11px] text-[#8b949e] font-mono break-all">{this.state.err}</p>
            <p className="text-[11px] text-[#8b949e] mt-3">
              Si importaste datos con el CSV viejo, puede haber registros corruptos. Andá a{" "}
              <b className="text-[#e6edf3]">Prospectos → Limpiar todo</b> y reimportá el CSV.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const TICKET = 500;
const COSTO_SISTEMA = 30;

function MetricCard({ label, value, sub, accent = false }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-medium ${accent ? "text-[#00ff9d]" : "text-[#e6edf3]"}`}>{value}</p>
      <p className="text-[11px] text-[#8b949e] mt-1.5">{sub}</p>
    </div>
  );
}

function NichoBar({ name, count, max }: { name: string; count: number; max: number }) {
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span className="text-[11px] text-[#e6edf3] w-28 truncate shrink-0">{name}</span>
      <div className="flex-1 bg-[#30363d] rounded-full h-2">
        <div className="h-2 rounded-full bg-[#00ff9d] opacity-80" style={{ width: `${Math.round((count / max) * 100)}%` }} />
      </div>
      <span className="text-[11px] text-[#8b949e] w-5 text-right">{count}</span>
    </div>
  );
}

const BADGE: Record<string, string> = {
  pendiente: "bg-[#21262d] text-[#8b949e]",
  enviado: "bg-[#0d2b1f] text-[#3fb950]",
  respondio: "bg-[#0c2040] text-[#58a6ff]",
  cerrado: "bg-[#1f1a0a] text-[#d29922]",
  error: "bg-[#2d1313] text-[#f85149]",
};

function DashboardContent() {
  const stats = useQuery(api.prospects.stats);
  const allProspects = useQuery(api.prospects.list);

  if (!stats || !allProspects) {
    return <div className="flex items-center justify-center h-full text-[#8b949e]">Cargando...</div>;
  }

  const ingresos = stats.cerrados * TICKET;
  const roi = ingresos > 0 ? Math.round(ingresos / COSTO_SISTEMA) : 0;

  const byNicho: Record<string, number> = {};
  for (const p of allProspects) {
    const k = p.nicho || "Sin nicho";
    byNicho[k] = (byNicho[k] || 0) + 1;
  }
  const nichosArr = Object.entries(byNicho).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxNicho = nichosArr[0]?.[1] ?? 1;
  const recent = allProspects.slice(0, 10);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
        <h1 className="text-[11px] text-[#8b949e] uppercase tracking-[3px]">Pipeline / Últimos 30 días</h1>
        <div className="flex items-center gap-2">
          <div className="pulse-dot" />
          <span className="text-[10px] text-[#00ff9d]">En vivo</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="Total leads" value={stats.total.toString()} sub="base de datos" />
        <MetricCard label="Enviados" value={stats.enviados.toString()} sub={`${stats.total > 0 ? Math.round((stats.enviados / stats.total) * 100) : 0}% del total`} />
        <MetricCard label="Respondieron" value={stats.respondieron.toString()} sub={`${stats.tasaRespuesta}% tasa`} />
        <MetricCard label="Cerrados" value={stats.cerrados.toString()} sub={`${stats.tasaConversion}% conv.`} />
        <MetricCard label="Pendientes" value={stats.pendientes.toString()} sub="por contactar" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Ingresos generados" value={`USD ${ingresos.toLocaleString()}`} sub={`${stats.cerrados} clientes cerrados`} accent />
        <MetricCard label="Valor por cliente" value={`USD ${TICKET}`} sub="precio promedio web" />
        <MetricCard label="ROI estimado" value={`${roi}x`} sub="vs costo del sistema" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-4">Leads por nicho</p>
          {nichosArr.length === 0 ? (
            <p className="text-[#8b949e] text-sm">Sin datos aún — importá tus prospectos</p>
          ) : (
            nichosArr.map(([name, count]) => <NichoBar key={name} name={name} count={count} max={maxNicho} />)
          )}
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-4">Actividad reciente</p>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#30363d]">
                {["Negocio", "País", "Estado"].map((h) => (
                  <th key={h} className="text-left text-[#8b949e] pb-2 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={3} className="py-4 text-center text-[#8b949e]">Sin prospectos aún</td></tr>
              ) : (
                recent.map((p) => (
                  <tr key={p._id} className="border-b border-[#1c2128]">
                    <td className="py-1.5 truncate max-w-[140px] text-[#e6edf3]">{p.nombre}</td>
                    <td className="py-1.5 text-[#8b949e]">{p.pais}</td>
                    <td className="py-1.5">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${BADGE[p.estado] ?? BADGE.pendiente}`}>
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
