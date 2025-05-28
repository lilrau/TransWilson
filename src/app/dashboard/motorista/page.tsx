"use client"

import { useEffect, useState } from "react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Loader2,
  Truck,
  TrendingUp,
} from "lucide-react"
import { getAllFrete } from "@/lib/services/frete-service"
import { getMotorista } from "@/lib/services/motorista-service"
import { getSessionData } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Interface para os fretes
interface Frete {
  id: number
  frete_nome: string
  frete_origem: string | null
  frete_destino: string | null
  frete_valor_total: number | null
  created_at: string
  motorista?: {
    id: number
    motorista_nome: string
  } | null
}

// Interface para dados do gráfico
interface DadosGrafico {
  data: string
  valor: number
}

// Interface para dados do motorista
interface Motorista {
  id: number
  motorista_nome: string
  motorista_cpf: string
  motorista_salario: number
  motorista_frete: number
  motorista_estadia: number
  motorista_admissao: string
}

export default function DashboardMotorista() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [motorista, setMotorista] = useState<Motorista | null>(null)
  const [fretes, setFretes] = useState<Frete[]>([])
  const [dadosGrafico, setDadosGrafico] = useState<DadosGrafico[]>([])
  const [estatisticas, setEstatisticas] = useState({
    totalFretes: 0,
    valorTotal: 0,
    mediaValor: 0,
  })

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true)
        setError(null)

        // Obter dados da sessão para identificar o motorista
        const session = await getSessionData()
        if (!session || session.userType !== "driver") {
          throw new Error("Sessão inválida ou usuário não é motorista")
        }

        // Carregar dados do motorista
        const motoristaData = await getMotorista(session.id)
        if (!motoristaData) {
          throw new Error("Não foi possível carregar os dados do motorista")
        }
        setMotorista(motoristaData)

        // Definir início e fim do mês selecionado
        const startDate = startOfMonth(selectedMonth)
        const endDate = endOfMonth(selectedMonth)

        // Buscar fretes do motorista
        const fretesData = await getAllFrete()
        const fretesDoMotorista = (fretesData || []).filter(
          (frete) =>
            frete.motorista?.id === session.id &&
            new Date(frete.created_at) >= startDate &&
            new Date(frete.created_at) <= endDate
        )

        setFretes(fretesDoMotorista)

        // Calcular estatísticas
        const totalFretes = fretesDoMotorista.length
        const valorTotal = fretesDoMotorista.reduce(
          (total, frete) => total + (frete.frete_valor_total || 0),
          0
        )
        const mediaValor = totalFretes > 0 ? valorTotal / totalFretes : 0

        setEstatisticas({
          totalFretes,
          valorTotal,
          mediaValor,
        })

        // Preparar dados para o gráfico
        const dadosGraficoTemp = fretesDoMotorista.map((frete) => ({
          data: format(new Date(frete.created_at), "dd/MM"),
          valor: frete.frete_valor_total || 0,
        }))

        setDadosGrafico(dadosGraficoTemp)
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        setError(
          err instanceof Error ? err.message : "Ocorreu um erro ao carregar os dados da dashboard."
        )
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [selectedMonth])

  // Função para navegar entre meses
  const changeMonth = (direction: "prev" | "next") => {
    setSelectedMonth((prev) => (direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)))
  }

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard do Motorista</h1>
            <p className="text-muted-foreground">Bem-vindo, {motorista?.motorista_nome}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeMonth("prev")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => changeMonth("next")}
              disabled={format(selectedMonth, "MM/yyyy") === format(new Date(), "MM/yyyy")}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Fretes Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold">{estatisticas.totalFretes}</div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                  Total de fretes neste mês
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold">{formatCurrency(estatisticas.valorTotal)}</div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                  Faturamento do mês
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Média por Frete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold">{formatCurrency(estatisticas.mediaValor)}</div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                  Valor médio por frete
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Evolução */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução dos Fretes
            </CardTitle>
            <CardDescription>Valor dos fretes ao longo do mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dadosGrafico}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#4ade80"
                    strokeWidth={2}
                    name="Valor do Frete"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Fretes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fretes do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-medium">ID</th>
                    <th className="text-left py-3 px-4 font-medium">Origem</th>
                    <th className="text-left py-3 px-4 font-medium">Destino</th>
                    <th className="text-left py-3 px-4 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {fretes.length > 0 ? (
                    fretes.map((frete) => (
                      <tr key={frete.id} className="border-b dark:border-zinc-800">
                        <td className="py-3 px-4">#{frete.id}</td>
                        <td className="py-3 px-4">{frete.frete_origem || "Não informado"}</td>
                        <td className="py-3 px-4">{frete.frete_destino || "Não informado"}</td>
                        <td className="py-3 px-4">
                          {formatCurrency(frete.frete_valor_total || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        Nenhum frete encontrado para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}