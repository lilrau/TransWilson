"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RelatoriosFiltrosPeriodo } from "./filtros/relatorios-filtros-periodo"
import { RelatorioFinanceiro } from "./tipos/relatorio-financeiro"
import { RelatorioFretes } from "./tipos/relatorio-fretes"
import { RelatorioMotoristas } from "./tipos/relatorio-motoristas"
import { RelatorioVeiculos } from "./tipos/relatorio-veiculos"

// Tipo para os filtros de período
export type FiltroPeriodo = {
  dataInicial: Date
  dataFinal: Date
}

export function RelatoriosContainer() {
  // Estado para os filtros de período (compartilhado entre todos os relatórios)
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>({
    dataInicial: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Primeiro dia do mês atual
    dataFinal: new Date(), // Hoje
  })

  return (
    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
      <div className="p-6">
        {/* Filtros de período (compartilhados entre todos os relatórios) */}
        <RelatoriosFiltrosPeriodo
          filtroPeriodo={filtroPeriodo}
          setFiltroPeriodo={setFiltroPeriodo}
        />

        {/* Tabs para os diferentes tipos de relatórios */}
        <Tabs defaultValue="financeiro" className="mt-6">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="fretes">Fretes</TabsTrigger>
            <TabsTrigger value="motoristas">Motoristas</TabsTrigger>
            <TabsTrigger value="veiculos">Veículos</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro" className="mt-6">
            <RelatorioFinanceiro filtroPeriodo={filtroPeriodo} />
          </TabsContent>

          <TabsContent value="fretes" className="mt-6">
            <RelatorioFretes filtroPeriodo={filtroPeriodo} />
          </TabsContent>

          <TabsContent value="motoristas" className="mt-6">
            <RelatorioMotoristas filtroPeriodo={filtroPeriodo} />
          </TabsContent>

          <TabsContent value="veiculos" className="mt-6">
            <RelatorioVeiculos filtroPeriodo={filtroPeriodo} />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}
