"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, Zap, Send } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospectos", label: "Prospectos", icon: Users },
  { href: "/campana", label: "Campaña", icon: Send },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 flex flex-col border-r border-[#30363d] bg-[#161b22] shrink-0">
      <div className="px-4 py-5 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-[#00ff9d]" />
          <span className="font-semibold text-sm tracking-wide">Automatik</span>
        </div>
        <p className="text-[10px] text-[#8b949e] mt-0.5 ml-6">Pipeline CRM</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
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
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="pulse-dot" />
          <span className="text-[10px] text-[#00ff9d]">Bot activo</span>
        </div>
      </div>
    </aside>
  );
}
