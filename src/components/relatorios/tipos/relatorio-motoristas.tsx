"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Filter, User } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
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
import { getAllMotorista } from "@/lib/services/motorista-service"
import { getAllFrete } from "@/lib/services/frete-service"
import { getAllDespesa } from "@/lib/services/despesa-service"
import type { FiltroPeriodo } from "../relatorios-container"
import { RelatorioLoading } from "../ui/relatorio-loading"
import { RelatorioErro } from "../ui/relatorio-erro"
import { RelatorioVazio } from "../ui/relatorio-vazio"
import { RelatorioExportar } from "../ui/relatorio-exportar"
import { RelatorioGraficoContainer } from "../ui/relatorio-grafico-container"

// Tipo para os motoristas com dados agregados
type MotoristaRelatorio = {
  id: number
  nome: string
  cnh: string
  salario: number
  percentualFrete: number
  percentualEstadia: number
  dataAdmissao: string
  totalFretes: number
  valorFretes: number
  totalDespesas: number
  valorDespesas: number
  saldo: number
}

// Tipo para os filtros específicos do relatório de motoristas
type FiltroMotoristas = {
  busca: string
  ordenacao: "nome" | "fretes" | "valor" | "saldo"
  direcao: "asc" | "desc"
}

// Tipo para dados do gráfico comparativo
type DadoGraficoComparativo = {
  name: string
  fretes: number
  despesas: number
  saldo: number
}

// Tipo para dados do gráfico de pizza
type DadoGraficoPizza = {
  name: string
  value: number
}

interface RelatorioMotoristasProps {
  filtroPeriodo: FiltroPeriodo
}

// Cores para os gráficos
const CORES_GRAFICO = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function RelatorioMotoristas({ filtroPeriodo }: RelatorioMotoristasProps) {
  const [motoristas, setMotoristas] = useState<MotoristaRelatorio[]>([])
  const [motoristasFiltrados, setMotoristasFiltrados] = useState<MotoristaRelatorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para os filtros específicos
  const [filtros, setFiltros] = useState<FiltroMotoristas>({
    busca: "",
    ordenacao: "nome",
    direcao: "asc",
  })

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalMotoristas: 0,
    totalFretes: 0,
    valorTotalFretes: 0,
    valorTotalDespesas: 0,
  })

  // Dados para gráficos
  const [dadosGraficoComparativo, setDadosGraficoComparativo] = useState<DadoGraficoComparativo[]>(
    []
  )
  const [dadosGraficoFretes, setDadosGraficoFretes] = useState<DadoGraficoPizza[]>([])
  const [dadosGraficoDespesas, setDadosGraficoDespesas] = useState<DadoGraficoPizza[]>([])

  // Carregar dados
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true)
        setError(null)

        // Carregar motoristas, fretes e despesas em paralelo
        const [motoristasData, fretesData, despesasData] = await Promise.all([
          getAllMotorista(),
          getAllFrete(),
          getAllDespesa(),
        ])

        // Filtrar por período
        const dataInicial = filtroPeriodo.dataInicial.setHours(0, 0, 0, 0)
        const dataFinal = filtroPeriodo.dataFinal.setHours(23, 59, 59, 999)

        const fretesFiltrados = (fretesData || []).filter((frete) => {
          const freteDate = new Date(frete.created_at).getTime()
          return freteDate >= dataInicial && freteDate <= dataFinal
        })

        const despesasFiltradas = (despesasData || []).filter((despesa) => {
          const despesaDate = new Date(despesa.created_at).getTime()
          return despesaDate >= dataInicial && despesaDate <= dataFinal
        })

        // Calcular dados agregados para cada motorista
        const motoristasRelatorio: MotoristaRelatorio[] = (motoristasData || []).map(
          (motorista) => {
            // Fretes do motorista no período
            const fretesMotorista = fretesFiltrados.filter(
              (frete) => frete.frete_motorista === motorista.id
            )

            const totalFretes = fretesMotorista.length
            const valorFretes = fretesMotorista.reduce(
              (acc, frete) => acc + (frete.frete_valor_total || 0),
              0
            )

            // Despesas do motorista no período
            const despesasMotorista = despesasFiltradas.filter(
              (despesa) => despesa.despesa_motorista === motorista.id
            )

            const totalDespesas = despesasMotorista.length
            const valorDespesas = despesasMotorista.reduce(
              (acc, despesa) => acc + (despesa.despesa_valor || 0),
              0
            )

            // Saldo (valor dos fretes - despesas)
            const saldo = valorFretes - valorDespesas

            return {
              id: motorista.id,
              nome: motorista.motorista_nome,
              cnh: motorista.motorista_cnh,
              salario: motorista.motorista_salario,
              percentualFrete: motorista.motorista_frete,
              percentualEstadia: motorista.motorista_estadia,
              dataAdmissao: motorista.motorista_admissao as string,
              totalFretes,
              valorFretes,
              totalDespesas,
              valorDespesas,
              saldo,
            }
          }
        )

        setMotoristas(motoristasRelatorio)

        // Calcular estatísticas
        const totalFretes = fretesFiltrados.length
        const valorTotalFretes = fretesFiltrados.reduce(
          (acc, frete) => acc + (frete.frete_valor_total || 0),
          0
        )
        const valorTotalDespesas = despesasFiltradas.reduce(
          (acc, despesa) => acc + (despesa.despesa_valor || 0),
          0
        )

        setEstatisticas({
          totalMotoristas: motoristasRelatorio.length,
          totalFretes,
          valorTotalFretes,
          valorTotalDespesas,
        })

        // Preparar dados para gráficos
        prepararDadosGraficos(motoristasRelatorio)
      } catch (err) {
        console.error("Erro ao carregar dados de motoristas:", err)
        setError("Ocorreu um erro ao carregar os dados de motoristas.")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [filtroPeriodo])

  // Preparar dados para os gráficos
  const prepararDadosGraficos = (motoristasData: MotoristaRelatorio[]) => {
    // Ordenar motoristas por valor de fretes (decrescente)
    const motoristasOrdenados = [...motoristasData].sort((a, b) => b.valorFretes - a.valorFretes)

    // Pegar os top 5 motoristas para o gráfico comparativo
    const top5Motoristas = motoristasOrdenados.slice(0, 5)

    // Dados para o gráfico comparativo
    const dadosComparativo = top5Motoristas.map((motorista) => ({
      name: motorista.nome,
      fretes: motorista.valorFretes,
      despesas: motorista.valorDespesas,
      saldo: motorista.saldo,
    }))

    setDadosGraficoComparativo(dadosComparativo)

    // Dados para o gráfico de pizza de fretes
    const dadosFretes = top5Motoristas.map((motorista) => ({
      name: motorista.nome,
      value: motorista.valorFretes,
    }))

    setDadosGraficoFretes(dadosFretes)

    // Dados para o gráfico de pizza de despesas
    const dadosDespesas = top5Motoristas.map((motorista) => ({
      name: motorista.nome,
      value: motorista.valorDespesas,
    }))

    setDadosGraficoDespesas(dadosDespesas)
  }

  // Aplicar filtros e ordenação
  useEffect(() => {
    if (!motoristas.length) {
      setMotoristasFiltrados([])
      return
    }

    let filtered = [...motoristas]

    // Filtrar por busca
    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase()
      filtered = filtered.filter(
        (motorista) =>
          motorista.nome.toLowerCase().includes(termoBusca) ||
          motorista.cnh.toLowerCase().includes(termoBusca)
      )
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let comparacao = 0

      switch (filtros.ordenacao) {
        case "nome":
          comparacao = a.nome.localeCompare(b.nome)
          break
        case "fretes":
          comparacao = a.totalFretes - b.totalFretes
          break
        case "valor":
          comparacao = a.valorFretes - b.valorFretes
          break
        case "saldo":
          comparacao = a.saldo - b.saldo
          break
      }

      return filtros.direcao === "asc" ? comparacao : -comparacao
    })

    setMotoristasFiltrados(filtered)
  }, [motoristas, filtros])

  // Formatar valor para exibição em reais
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  // Renderizador personalizado para rótulos do gráfico de pizza
  const renderizarRotuloGraficoPizza = (props: {
    cx: number
    cy: number
    midAngle: number
    innerRadius: number
    outerRadius: number
    percent: number
    index: number
  }) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
    const RADIAN = Math.PI / 180
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

  // Formatador personalizado para tooltip do gráfico
  const formatadorTooltipGrafico = (value: number) => {
    return formatarMoeda(value)
  }

  if (loading) {
    return <RelatorioLoading mensagem="Carregando dados de motoristas..." />
  }

  if (error) {
    return <RelatorioErro mensagem={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            Total de Motoristas
          </h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {estatisticas.totalMotoristas}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
            Total de Fretes
          </h3>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {estatisticas.totalFretes}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
            Valor Total de Fretes
          </h3>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatarMoeda(estatisticas.valorTotalFretes)}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
            Valor Total de Despesas
          </h3>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {formatarMoeda(estatisticas.valorTotalDespesas)}
          </p>
        </div>
      </div>

      {/* Gráficos e Tabela */}
      <Tabs defaultValue="comparativo" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
          <TabsTrigger value="tabela">Tabela Detalhada</TabsTrigger>
        </TabsList>

        {/* Gráfico Comparativo */}
        <TabsContent value="comparativo" className="space-y-6">
          <RelatorioGraficoContainer
            titulo="Comparativo de Top 5 Motoristas"
            descricao="Comparação entre fretes, despesas e saldo dos principais motoristas"
            altura={400}
          >
            {dadosGraficoComparativo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosGraficoComparativo}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={formatadorTooltipGrafico} />
                  <Legend />
                  <Bar dataKey="fretes" name="Valor de Fretes" fill="#4ade80" />
                  <Bar dataKey="despesas" name="Despesas" fill="#f87171" />
                  <Bar dataKey="saldo" name="Saldo" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </p>
              </div>
            )}
          </RelatorioGraficoContainer>
        </TabsContent>

        {/* Gráficos de Distribuição */}
        <TabsContent value="distribuicao" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Distribuição de Fretes */}
            <RelatorioGraficoContainer
              titulo="Distribuição de Fretes por Motorista"
              descricao="Participação de cada motorista no valor total de fretes"
              altura={350}
            >
              {dadosGraficoFretes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoFretes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderizarRotuloGraficoPizza}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoFretes.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatadorTooltipGrafico} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Nenhum dado disponível para o período selecionado
                  </p>
                </div>
              )}
            </RelatorioGraficoContainer>

            {/* Gráfico de Distribuição de Despesas */}
            <RelatorioGraficoContainer
              titulo="Distribuição de Despesas por Motorista"
              descricao="Participação de cada motorista no valor total de despesas"
              altura={350}
            >
              {dadosGraficoDespesas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoDespesas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderizarRotuloGraficoPizza}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoDespesas.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatadorTooltipGrafico} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Nenhum dado disponível para o período selecionado
                  </p>
                </div>
              )}
            </RelatorioGraficoContainer>
          </div>
        </TabsContent>

        {/* Tabela Detalhada */}
        <TabsContent value="tabela" className="space-y-6">
          {/* Filtros específicos - APENAS NA ABA DE TABELA */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Ordenação
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <Select
                      value={filtros.ordenacao}
                      onValueChange={(value) =>
                        setFiltros({
                          ...filtros,
                          ordenacao: value as "nome" | "fretes" | "valor" | "saldo",
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nome">Nome</SelectItem>
                        <SelectItem value="fretes">Quantidade de Fretes</SelectItem>
                        <SelectItem value="valor">Valor de Fretes</SelectItem>
                        <SelectItem value="saldo">Saldo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <Select
                      value={filtros.direcao}
                      onValueChange={(value) =>
                        setFiltros({
                          ...filtros,
                          direcao: value as "asc" | "desc",
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Direção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente</SelectItem>
                        <SelectItem value="desc">Decrescente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-4 w-full sm:w-auto">
              <Input
                placeholder="Buscar motorista..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="w-full sm:w-[250px]"
              />

              <RelatorioExportar
                dados={motoristasFiltrados}
                nomeArquivo={`relatorio-motoristas-${format(new Date(), "yyyy-MM-dd")}`}
              />
            </div>
          </div>

          {/* Tabela de motoristas */}
          {motoristasFiltrados.length === 0 ? (
            <RelatorioVazio mensagem="Nenhum motorista encontrado para os filtros selecionados." />
          ) : (
            <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motorista</TableHead>
                    <TableHead>CNH</TableHead>
                    <TableHead>Fretes</TableHead>
                    <TableHead>Valor Fretes</TableHead>
                    <TableHead>Despesas</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motoristasFiltrados.map((motorista) => (
                    <TableRow key={motorista.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{motorista.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{motorista.cnh}</TableCell>
                      <TableCell>{motorista.totalFretes}</TableCell>
                      <TableCell>{formatarMoeda(motorista.valorFretes)}</TableCell>
                      <TableCell>{formatarMoeda(motorista.valorDespesas)}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          motorista.saldo >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatarMoeda(motorista.saldo)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
