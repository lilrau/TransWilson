import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - Sistema de Fretagem",
  description: "Dashboard do sistema de gerenciamento de fretagem de caminhões",
}

export default function DashboardPage() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Cards de resumo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Fretes Ativos</h2>
          <p className="text-3xl font-bold">12</p>
          <p className="text-sm text-slate-500 mt-2">4 a caminho, 8 em carregamento</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Motoristas Disponíveis</h2>
          <p className="text-3xl font-bold">8</p>
          <p className="text-sm text-slate-500 mt-2">De um total de 15 motoristas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2">Faturamento Mensal</h2>
          <p className="text-3xl font-bold">R$ 87.500</p>
          <p className="text-sm text-slate-500 mt-2">+12% em relação ao mês anterior</p>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Fretes Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Origem</th>
                <th className="text-left py-3 px-4 font-medium">Destino</th>
                <th className="text-left py-3 px-4 font-medium">Motorista</th>
                <th className="text-left py-3 px-4 font-medium">Valor</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">#1234</td>
                <td className="py-3 px-4">São Paulo, SP</td>
                <td className="py-3 px-4">Rio de Janeiro, RJ</td>
                <td className="py-3 px-4">Carlos Silva</td>
                <td className="py-3 px-4">R$ 3.500</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Concluído
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">#1235</td>
                <td className="py-3 px-4">Belo Horizonte, MG</td>
                <td className="py-3 px-4">Brasília, DF</td>
                <td className="py-3 px-4">Marcos Oliveira</td>
                <td className="py-3 px-4">R$ 4.200</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Em trânsito
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">#1236</td>
                <td className="py-3 px-4">Curitiba, PR</td>
                <td className="py-3 px-4">Florianópolis, SC</td>
                <td className="py-3 px-4">André Santos</td>
                <td className="py-3 px-4">R$ 2.800</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Carregando
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">#1237</td>
                <td className="py-3 px-4">Salvador, BA</td>
                <td className="py-3 px-4">Recife, PE</td>
                <td className="py-3 px-4">Paulo Mendes</td>
                <td className="py-3 px-4">R$ 3.900</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Em trânsito
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
