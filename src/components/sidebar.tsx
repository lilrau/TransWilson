"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  ChevronDown,
  ClipboardList,
  Truck,
  DollarSign,
  Users,
  Package,
  BarChart4,
  PlusCircle,
  ArrowRightLeft,
  Wallet,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { clearSessionCookie } from "@/lib/auth"

type SidebarItemWithSubItems = {
  title: string
  icon: React.ElementType
  items: {
    title: string
    href: string
    icon: React.ElementType
  }[]
}

type SidebarItem = {
  title: string
  href: string
  icon: React.ElementType
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    movimentos: true,
    cadastros: true,
  })
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await clearSessionCookie()
    router.push("/")
  }

  const toggleMenu = (menu: string) => {
    if (collapsed) return
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }))
  }

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev)
  }

  const movimentos: SidebarItemWithSubItems = {
    title: "Movimentos",
    icon: ClipboardList,
    items: [
      {
        title: "Fretes",
        href: "/dashboard/movimentos/fretes",
        icon: Truck,
      },
      {
        title: "Criar Frete",
        href: "/dashboard/movimentos/criar-frete",
        icon: PlusCircle,
      },
      {
        title: "Despesas",
        href: "/dashboard/movimentos/despesas",
        icon: Wallet,
      },
      {
        title: "Entradas e Saídas",
        href: "/dashboard/movimentos/entradas-saidas",
        icon: ArrowRightLeft,
      },
      {
        title: "Salários",
        href: "/dashboard/movimentos/salarios",
        icon: DollarSign,
      },
    ],
  }

  const cadastros: SidebarItemWithSubItems = {
    title: "Cadastros",
    icon: Package,
    items: [
      {
        title: "Motoristas",
        href: "/dashboard/cadastros/motoristas",
        icon: Users,
      },
      {
        title: "Veículos",
        href: "/dashboard/cadastros/veiculos",
        icon: Truck,
      },
      {
        title: "Agenciadores",
        href: "/dashboard/cadastros/agenciadores",
        icon: UserCog,
      },
      {
        title: "Usuários",
        href: "/dashboard/cadastros/users",
        icon: Users,
      },
    ],
  }

  const singleItems: SidebarItem[] = [
    {
      title: "Relatórios",
      href: "/dashboard/relatorios",
      icon: BarChart4,
    },
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "h-screen border-r flex flex-col bg-slate-50 dark:bg-black dark:border-zinc-800 transition-all duration-300 ease-in-out will-change-auto",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "p-4 border-b dark:border-zinc-800 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors",
            collapsed ? "w-full justify-center" : "w-full"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Truck className="h-6 w-6 text-primary flex-shrink-0" />
            {!collapsed && (
              <h1 className="font-semibold text-lg truncate dark:text-white">
                Sistema de Fretagem
              </h1>
            )}
          </div>
        </Link>

        <div className="flex-1 overflow-auto py-4 transition-all duration-300 ease-in-out">
          <nav className="space-y-1 px-2">
            {/* Single items */}
            {singleItems.map((item) => (
              <Tooltip key={item.title} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                      collapsed && "justify-center",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && item.title}
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
              </Tooltip>
            ))}

            {/* Movimentos - Collapsible */}
            <div>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleMenu("movimentos")}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900",
                      collapsed && "justify-center"
                    )}
                  >
                    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                      <movimentos.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && movimentos.title}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 ml-auto transition-transform",
                          openMenus.movimentos ? "transform rotate-180" : ""
                        )}
                      />
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{movimentos.title}</TooltipContent>}
              </Tooltip>

              {openMenus.movimentos && !collapsed && (
                <div className="mt-1 pl-4 space-y-1">
                  {movimentos.items.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                        pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}

              {collapsed && (
                <div className="mt-1 space-y-1">
                  {movimentos.items.map((item) => (
                    <Tooltip key={item.title} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
                            pathname === item.href
                              ? "bg-primary text-primary-foreground"
                              : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900"
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>

            {/* Cadastros - Collapsible */}
            <div>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleMenu("cadastros")}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900",
                      collapsed && "justify-center"
                    )}
                  >
                    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                      <cadastros.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && cadastros.title}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 ml-auto transition-transform",
                          openMenus.cadastros ? "transform rotate-180" : ""
                        )}
                      />
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{cadastros.title}</TooltipContent>}
              </Tooltip>

              {openMenus.cadastros && !collapsed && (
                <div className="mt-1 pl-4 space-y-1">
                  {cadastros.items.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                        pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}

              {collapsed && (
                <div className="mt-1 space-y-1">
                  {cadastros.items.map((item) => (
                    <Tooltip key={item.title} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
                            pathname === item.href
                              ? "bg-primary text-primary-foreground"
                              : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900"
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div
          className={cn(
            "p-4 border-t dark:border-zinc-800 flex flex-col gap-2 transition-all duration-300 ease-in-out",
            collapsed && "items-center"
          )}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className={cn("flex items-center gap-2", collapsed && "w-10 h-10 p-0 justify-center")}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Recolher</span>
              </>
            )}
          </Button>

          {!collapsed && (
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          )}

          {collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleLogout} className="w-10 h-10">
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
