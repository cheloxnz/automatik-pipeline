"use client";
import "./globals.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import Sidebar from "@/components/Sidebar";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ConvexProvider client={convex}>
          <div className="flex h-screen bg-[#0d1117] text-[#e6edf3] overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </ConvexProvider>
      </body>
    </html>
  );
}
