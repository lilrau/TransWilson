import { DespesasForm } from "@/components/despesas/despesas-form"

export default function NovaDespesaPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cadastrar Nova Despesa</h1>
      <DespesasForm />
    </div>
  )
}
