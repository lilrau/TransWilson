import type { Metadata } from "next"
import { FretesForm } from "@/components/fretes/fretes-form"

export const metadata: Metadata = {
  title: "Editar Frete - Sistema de Fretagem",
  description: "Edição de frete no sistema de fretagem",
}

interface PageParams {
  params: {
    id: string
  }
}

export default async function EditarFretePage({ params }: PageParams) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Frete</h1>
        <p className="text-muted-foreground">Atualize os dados do frete.</p>
      </div>

      <FretesForm id={id} />
    </div>
  )
}