"use client";
import { useState } from "react";
import { Save, Eye, EyeOff } from "lucide-react";

export default function Configuracion() {
  const [token, setToken] = useState("");
  const [phoneId, setPhoneId] = useState("1185795881287585");
  const [ticket, setTicket] = useState("500");
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem("wa_token", token);
    localStorage.setItem("wa_phone_id", phoneId);
    localStorage.setItem("ticket_price", ticket);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-[11px] text-[#8b949e] uppercase tracking-[3px] mb-6 border-b border-[#30363d] pb-4">
        Configuración
      </h1>

      <div className="space-y-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <h2 className="text-sm font-medium text-[#e6edf3] mb-4">WhatsApp API</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 uppercase tracking-wide">Token de acceso</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="EAABsbCS..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff] pr-10 placeholder-[#484f58]"
                />
                <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3]">
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1 uppercase tracking-wide">Phone Number ID</label>
              <input
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <h2 className="text-sm font-medium text-[#e6edf3] mb-4">Pipeline</h2>
          <div>
            <label className="block text-[11px] text-[#8b949e] mb-1 uppercase tracking-wide">Precio por cliente (USD)</label>
            <input
              type="number"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              className="w-40 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
            />
            <p className="text-[11px] text-[#8b949e] mt-1.5">Usado para calcular ingresos y ROI en el dashboard</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
            saved
              ? "bg-[#0d2b1f] border border-[#3fb950]/30 text-[#3fb950]"
              : "bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] hover:bg-[#00ff9d]/20"
          }`}
        >
          <Save size={14} />
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
