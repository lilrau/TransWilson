"use client"

import { VeiculosTable } from "@/components/veiculos/veiculos-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VeiculosPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <Button asChild>
          <Link href="/dashboard/cadastros/veiculos/novo">Cadastrar Veículo</Link>
        </Button>
      </div>
      <VeiculosTable />
    </div>
  )
}
