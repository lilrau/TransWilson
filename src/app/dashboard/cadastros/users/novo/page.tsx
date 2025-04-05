import { UsersForm } from "@/components/users/users-form"

export default function NovoUsuarioPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cadastrar Novo Usuário</h1>
      <UsersForm />
    </div>
  )
}
