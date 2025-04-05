import type React from "react"
import type { Metadata } from "next"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"

export const metadata: Metadata = {
  title: "Dashboard - Sistema de Fretagem",
  description: "Dashboard do sistema de gerenciamento de fretagem de caminhões",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar - escondida em dispositivos móveis */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center px-4 md:px-6">
          <MobileSidebar />
          <h1 className="text-xl font-semibold ml-4 md:ml-0">Sistema de Fretagem</h1>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
