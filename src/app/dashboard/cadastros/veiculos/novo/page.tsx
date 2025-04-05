import { VeiculosForm } from "@/components/veiculos/veiculos-form"

export default function NovoUsuarioPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cadastrar Novo Veículo</h1>
      <VeiculosForm />
    </div>
  )
}
