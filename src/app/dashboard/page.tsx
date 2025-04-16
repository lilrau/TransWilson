"use client"

import { useEffect, useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  eachDayOfInterval,
  isSameDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Loader2,
  Plus,
  Truck,
  Users,
  Wallet,
  TrendingUp,
  MapPin,
  DollarSign,
} from "lucide-react"
import { getAllFrete } from "@/lib/services/frete-service"
import { getAllMotorista } from "@/lib/services/motorista-service"
import { getAllEntradas } from "@/lib/services/entrada-service"
import { getAllDespesa } from "@/lib/services/despesa-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Define interfaces for our data types
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

interface Motorista {
  id: number
  motorista_nome: string
}

interface Entrada {
  id: number
  entrada_nome: string
  entrada_valor: number
  entrada_tipo: string | null
  created_at: string
}

interface Despesa {
  id: number
  despesa_nome: string
  despesa_valor: number | null
  despesa_tipo: string | null
  created_at: string
}

interface DailyFinanceData {
  date: string
  entradas: number
  despesas: number
  saldo: number
}

interface ChartData {
  name: string
  value: number
}

interface Stats {
  fretesAtivos: number
  motoristasDisponiveis: number
  totalMotoristas: number
  faturamentoMensal: number
  faturamentoAnterior: number
  percentualCrescimento: number
}

// Custom type for the PieChart label renderer
interface PieChartLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  index: number
  name: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // Dados
  const [fretes, setFretes] = useState<Frete[]>([])
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [, setMotoristas] = useState<Motorista[]>([])

  // Dados para gráficos
  const [dailyFinanceData, setDailyFinanceData] = useState<DailyFinanceData[]>([])
  const [originDestinationData, setOriginDestinationData] = useState<ChartData[]>([])
  const [despesasPorTipoData, setDespesasPorTipoData] = useState<ChartData[]>([])
  const [entradasPorTipoData, setEntradasPorTipoData] = useState<ChartData[]>([])

  // Estatísticas calculadas
  const [stats, setStats] = useState<Stats>({
    fretesAtivos: 0,
    motoristasDisponiveis: 0,
    totalMotoristas: 0,
    faturamentoMensal: 0,
    faturamentoAnterior: 0,
    percentualCrescimento: 0,
  })

  // Cores para gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]
  const RADIAN = Math.PI / 180

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Definir início e fim do mês selecionado
        const startDate = startOfMonth(selectedMonth)
        const endDate = endOfMonth(selectedMonth)

        // Definir início e fim do mês anterior para comparação
        const startPrevMonth = startOfMonth(subMonths(selectedMonth, 1))
        const endPrevMonth = endOfMonth(subMonths(selectedMonth, 1))

        // Buscar dados em paralelo
        const [fretesData, motoristasData, entradasData, despesasData] = await Promise.all([
          getAllFrete(),
          getAllMotorista(),
          getAllEntradas(),
          getAllDespesa(),
        ])

        // Filtrar dados pelo mês selecionado
        const fretesDoMes = (fretesData || []).filter((frete) => {
          const freteDate = new Date(frete.created_at)
          return freteDate >= startDate && freteDate <= endDate
        })

        const entradasDoMes = (entradasData || []).filter((entrada) => {
          const entradaDate = new Date(entrada.created_at)
          return entradaDate >= startDate && entradaDate <= endDate
        })

        const despesasDoMes = (despesasData || []).filter((despesa) => {
          const despesaDate = new Date(despesa.created_at)
          return despesaDate >= startDate && despesaDate <= endDate
        })

        const entradasMesAnterior = (entradasData || []).filter((entrada) => {
          const entradaDate = new Date(entrada.created_at)
          return entradaDate >= startPrevMonth && entradaDate <= endPrevMonth
        })

        // Calcular estatísticas
        const faturamentoMensal = entradasDoMes.reduce(
          (total, entrada) => total + entrada.entrada_valor,
          0
        )
        const faturamentoAnterior = entradasMesAnterior.reduce(
          (total, entrada) => total + entrada.entrada_valor,
          0
        )
        const percentualCrescimento =
          faturamentoAnterior > 0
            ? ((faturamentoMensal - faturamentoAnterior) / faturamentoAnterior) * 100
            : 0

        // Contar motoristas disponíveis (simulado)
        const motoristasDisponiveis = Math.floor(motoristasData.length * 0.6) // 60% dos motoristas

        // Preparar dados para gráficos
        prepareDailyFinanceData(entradasDoMes, despesasDoMes, startDate, endDate)
        prepareOriginDestinationData(fretesDoMes)
        prepareDespesasPorTipoData(despesasDoMes)
        prepareEntradasPorTipoData(entradasDoMes)

        // Atualizar estados
        setFretes(fretesData || [])
        setMotoristas(motoristasData || [])
        setEntradas(entradasData || [])
        setDespesas(despesasData || [])

        setStats({
          fretesAtivos: fretesDoMes.length,
          motoristasDisponiveis,
          totalMotoristas: motoristasData.length,
          faturamentoMensal,
          faturamentoAnterior,
          percentualCrescimento,
        })
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        setError("Ocorreu um erro ao carregar os dados da dashboard.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedMonth])

  // Preparar dados para gráfico de finanças diárias
  const prepareDailyFinanceData = (
    entradas: Entrada[],
    despesas: Despesa[],
    startDate: Date,
    endDate: Date
  ) => {
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const dailyData = days.map((day) => {
      const entradasDoDia = entradas.filter((entrada) =>
        isSameDay(new Date(entrada.created_at), day)
      )

      const despesasDoDia = despesas.filter((despesa) =>
        isSameDay(new Date(despesa.created_at), day)
      )

      const totalEntradas = entradasDoDia.reduce((sum, entrada) => sum + entrada.entrada_valor, 0)
      const totalDespesas = despesasDoDia.reduce(
        (sum, despesa) => sum + (despesa.despesa_valor || 0),
        0
      )

      return {
        date: format(day, "dd/MM"),
        entradas: totalEntradas,
        despesas: totalDespesas,
        saldo: totalEntradas - totalDespesas,
      }
    })

    setDailyFinanceData(dailyData)
  }

  // Preparar dados para gráfico de origem/destino
  const prepareOriginDestinationData = (fretes: Frete[]) => {
    const origensDestinos: Record<string, number> = {}

    fretes.forEach((frete) => {
      if (frete.frete_origem && frete.frete_destino) {
        const rota = `${frete.frete_origem} → ${frete.frete_destino}`
        origensDestinos[rota] = (origensDestinos[rota] || 0) + 1
      }
    })

    const data = Object.entries(origensDestinos)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 rotas

    setOriginDestinationData(data)
  }

  // Preparar dados para gráfico de despesas por tipo
  const prepareDespesasPorTipoData = (despesas: Despesa[]) => {
    const despesasPorTipo: Record<string, number> = {}

    despesas.forEach((despesa) => {
      if (despesa.despesa_tipo) {
        despesasPorTipo[despesa.despesa_tipo] =
          (despesasPorTipo[despesa.despesa_tipo] || 0) + (despesa.despesa_valor || 0)
      } else {
        despesasPorTipo["Outros"] = (despesasPorTipo["Outros"] || 0) + (despesa.despesa_valor || 0)
      }
    })

    const data = Object.entries(despesasPorTipo).map(([name, value]) => ({ name, value }))

    setDespesasPorTipoData(data)
  }

  // Preparar dados para gráfico de entradas por tipo
  const prepareEntradasPorTipoData = (entradas: Entrada[]) => {
    const entradasPorTipo: Record<string, number> = {}

    entradas.forEach((entrada) => {
      if (entrada.entrada_tipo) {
        entradasPorTipo[entrada.entrada_tipo] =
          (entradasPorTipo[entrada.entrada_tipo] || 0) + entrada.entrada_valor
      } else {
        entradasPorTipo["Outros"] = (entradasPorTipo["Outros"] || 0) + entrada.entrada_valor
      }
    })

    const data = Object.entries(entradasPorTipo).map(([name, value]) => ({ name, value }))

    setEntradasPorTipoData(data)
  }

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

  // Renderizador personalizado para rótulos do gráfico de pizza
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: PieChartLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Filtrar fretes baseado no status selecionado
  const filteredFretes = fretes.slice(0, 10) // Limitar a 10 fretes para a tabela

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
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do sistema de fretagem</p>
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
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Fretes Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold">{stats.fretesAtivos}</div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                  Total de {stats.fretesAtivos} fretes neste mês
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href="/dashboard/movimentos/fretes">
                      <Truck className="h-4 w-4" />
                      <span>Ver Fretes</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Motoristas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold">{stats.motoristasDisponiveis}</div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                  De um total de {stats.totalMotoristas} motoristas
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href="/dashboard/cadastros/motoristas">
                      <Users className="h-4 w-4" />
                      <span>Ver Motoristas</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Faturamento Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-3xl font-bold">{formatCurrency(stats.faturamentoMensal)}</div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 flex items-center">
                  <span
                    className={stats.percentualCrescimento >= 0 ? "text-green-500" : "text-red-500"}
                  >
                    {stats.percentualCrescimento >= 0 ? "+" : ""}
                    {stats.percentualCrescimento.toFixed(1)}%
                  </span>
                  <span className="ml-1">em relação ao mês anterior</span>
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href="/dashboard/movimentos/entradas-saidas">
                      <Wallet className="h-4 w-4" />
                      <span>Ver Financeiro</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Finanças Diárias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Financeira Diária
            </CardTitle>
            <CardDescription>Entradas, despesas e saldo por dia no mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyFinanceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="entradas"
                    stroke="#4ade80"
                    strokeWidth={2}
                    name="Entradas"
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#f87171"
                    strokeWidth={2}
                    name="Despesas"
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    name="Saldo"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para Fretes e Financeiro */}
        <Tabs defaultValue="fretes" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="fretes">Fretes Recentes</TabsTrigger>
            <TabsTrigger value="financeiro">Resumo Financeiro</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos Detalhados</TabsTrigger>
          </TabsList>

          <TabsContent value="fretes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Fretes Recentes</h2>

              <div className="flex items-center gap-2">
                <Button asChild variant="default" size="sm">
                  <Link href="/dashboard/movimentos/criar-frete">
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Frete
                  </Link>
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b dark:border-zinc-800">
                        <th className="text-left py-3 px-4 font-medium">ID</th>
                        <th className="text-left py-3 px-4 font-medium">Origem</th>
                        <th className="text-left py-3 px-4 font-medium">Destino</th>
                        <th className="text-left py-3 px-4 font-medium">Motorista</th>
                        <th className="text-left py-3 px-4 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFretes.length > 0 ? (
                        filteredFretes.map((frete) => (
                          <tr key={frete.id} className="border-b dark:border-zinc-800">
                            <td className="py-3 px-4">#{frete.id}</td>
                            <td className="py-3 px-4">{frete.frete_origem || "São Paulo, SP"}</td>
                            <td className="py-3 px-4">
                              {frete.frete_destino || "Rio de Janeiro, RJ"}
                            </td>
                            <td className="py-3 px-4">
                              {frete.motorista?.motorista_nome || "Motorista não atribuído"}
                            </td>
                            <td className="py-3 px-4">
                              {formatCurrency(frete.frete_valor_total || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">
                            Nenhum frete encontrado para o período selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {filteredFretes.length > 0 && (
              <div className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/movimentos/fretes">Ver todos os fretes</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Resumo Financeiro</h2>

              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/movimentos/entradas-saidas">Ver detalhes</Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entradas</CardTitle>
                  <CardDescription>Receitas do período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.faturamentoMensal)}
                  </div>

                  <div className="mt-4 space-y-2">
                    {entradas
                      .filter((entrada) => {
                        const entradaDate = new Date(entrada.created_at)
                        return (
                          entradaDate >= startOfMonth(selectedMonth) &&
                          entradaDate <= endOfMonth(selectedMonth)
                        )
                      })
                      .slice(0, 3)
                      .map((entrada) => (
                        <div
                          key={entrada.id}
                          className="flex justify-between items-center py-1 border-b dark:border-zinc-800"
                        >
                          <div className="font-medium">{entrada.entrada_nome}</div>
                          <div className="text-green-600 dark:text-green-400">
                            {formatCurrency(entrada.entrada_valor)}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Despesas</CardTitle>
                  <CardDescription>Gastos do período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(
                      despesas
                        .filter((despesa) => {
                          const despesaDate = new Date(despesa.created_at)
                          return (
                            despesaDate >= startOfMonth(selectedMonth) &&
                            despesaDate <= endOfMonth(selectedMonth)
                          )
                        })
                        .reduce((total, despesa) => total + (despesa.despesa_valor || 0), 0)
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {despesas
                      .filter((despesa) => {
                        const despesaDate = new Date(despesa.created_at)
                        return (
                          despesaDate >= startOfMonth(selectedMonth) &&
                          despesaDate <= endOfMonth(selectedMonth)
                        )
                      })
                      .slice(0, 3)
                      .map((despesa) => (
                        <div
                          key={despesa.id}
                          className="flex justify-between items-center py-1 border-b dark:border-zinc-800"
                        >
                          <div className="font-medium">{despesa.despesa_nome}</div>
                          <div className="text-red-600 dark:text-red-400">
                            {formatCurrency(despesa.despesa_valor || 0)}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="graficos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Gráfico de Despesas por Tipo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Despesas por Tipo
                  </CardTitle>
                  <CardDescription>Distribuição de despesas por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={despesasPorTipoData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {despesasPorTipoData.map((entry, _index) => (
                            <Cell key={`cell-${_index}`} fill={COLORS[_index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Entradas por Tipo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Entradas por Tipo
                  </CardTitle>
                  <CardDescription>Distribuição de receitas por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={entradasPorTipoData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {entradasPorTipoData.map((entry, _index) => (
                            <Cell key={`cell-${_index}`} fill={COLORS[_index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Rotas Mais Frequentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Rotas Mais Frequentes
                  </CardTitle>
                  <CardDescription>Top 5 rotas de origem/destino</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={originDestinationData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Quantidade de Fretes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Comparação Mensal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Comparação Financeira
                  </CardTitle>
                  <CardDescription>Comparação entre entradas e despesas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Mês Atual",
                            entradas: stats.faturamentoMensal,
                            despesas: despesas
                              .filter((despesa) => {
                                const despesaDate = new Date(despesa.created_at)
                                return (
                                  despesaDate >= startOfMonth(selectedMonth) &&
                                  despesaDate <= endOfMonth(selectedMonth)
                                )
                              })
                              .reduce((total, despesa) => total + (despesa.despesa_valor || 0), 0),
                          },
                          {
                            name: "Mês Anterior",
                            entradas: stats.faturamentoAnterior,
                            despesas: despesas
                              .filter((despesa) => {
                                const despesaDate = new Date(despesa.created_at)
                                return (
                                  despesaDate >= startOfMonth(subMonths(selectedMonth, 1)) &&
                                  despesaDate <= endOfMonth(subMonths(selectedMonth, 1))
                                )
                              })
                              .reduce((total, despesa) => total + (despesa.despesa_valor || 0), 0),
                          },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="entradas" name="Entradas" fill="#4ade80" />
                        <Bar dataKey="despesas" name="Despesas" fill="#f87171" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
