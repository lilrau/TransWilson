// In your [id]/page.tsx file
import type { Metadata } from "next"
import { MotoristasEditForm } from "@/components/motoristas/motoristas-edit-form"

export const metadata: Metadata = {
  title: "Editar Motorista - Sistema de Fretagem",
  description: "Edição de motorista no sistema de fretagem",
}

interface PageParams {
  params: {
    id: string
  }
}

export default async function EditarMotoristaPage({ params }: PageParams) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Motorista</h1>
        <p className="text-muted-foreground">Atualize os dados do motorista.</p>
      </div>

      <MotoristasEditForm id={id} />
    </div>
  )
}