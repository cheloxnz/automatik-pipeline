"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LayoutDashboard, Users, Settings, Zap, Send, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const SEEN_KEY = "ap_seen_respondieron";

export default function Sidebar() {
  const path = usePathname();
  const stats = useQuery(api.prospects.stats);
  const [seen, setSeen] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(SEEN_KEY) ?? "0", 10);
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const respondieron = stats?.respondieron ?? 0;
  const unread = Math.max(0, respondieron - seen);

  useEffect(() => {
    if (path === "/prospectos" && respondieron > 0) {
      localStorage.setItem(SEEN_KEY, String(respondieron));
      setSeen(respondieron);
    }
  }, [path, respondieron]);

  useEffect(() => { setMobileOpen(false); }, [path]);

  const nav = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { href: "/prospectos", label: "Prospectos", icon: Users, badge: unread },
    { href: "/campana", label: "Campaña", icon: Send, badge: 0 },
    { href: "/configuracion", label: "Configuración", icon: Settings, badge: 0 },
  ];

  const navContent = (
    <>
      <div className="px-4 py-5 border-b border-[#30363d] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[#00ff9d]" />
            <span className="font-semibold text-sm tracking-wide">Automatik</span>
          </div>
          <p className="text-[10px] text-[#8b949e] mt-0.5 ml-6">Pipeline CRM</p>
        </div>
        <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" className="md:hidden text-[#8b949e] hover:text-[#e6edf3]">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon, badge }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-[#00ff9d]/10 text-[#00ff9d]"
                  : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#f59e0b] text-[#0d1117] text-[10px] font-bold flex items-center justify-center">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
          <span className="text-[10px] text-[#00ff9d]">Bot activo</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#161b22] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3]"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed left-0 top-0 h-full w-56 flex flex-col border-r border-[#30363d] bg-[#161b22] z-50 transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-[#30363d] bg-[#161b22] shrink-0">
        {navContent}
      </aside>
    </>
  );
}
