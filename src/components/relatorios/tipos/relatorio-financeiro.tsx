"use client"

import { useEffect, useState } from "react"
import { format, eachDayOfInterval, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDownCircle, ArrowUpCircle, Filter } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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
import { getAllDespesa } from "@/lib/services/despesa-service"
import { getAllEntradas, getTipoEntradaEnum } from "@/lib/services/entrada-service"
import type { FiltroPeriodo } from "../relatorios-container"
import { RelatorioLoading } from "../ui/relatorio-loading"
import { RelatorioErro } from "../ui/relatorio-erro"
import { RelatorioVazio } from "../ui/relatorio-vazio"
import { RelatorioExportar } from "../ui/relatorio-exportar"
import { RelatorioGraficoContainer } from "../ui/relatorio-grafico-container"

// Tipo para os movimentos financeiros
type MovimentoFinanceiro = {
  id: string
  tipo: "entrada" | "despesa"
  nome: string
  descricao: string | null
  valor: number
  categoria: string | null
  data: string
  entidade?: {
    tipo: string
    nome: string
  } | null
}

// Tipo para os filtros específicos do relatório financeiro
type FiltroFinanceiro = {
  tipo: "todos" | "entrada" | "despesa"
  categoria: string
  valorMinimo: string
  valorMaximo: string
  busca: string
}

// Tipo para dados do gráfico diário
type DadoGraficoDiario = {
  data: string
  entradas: number
  despesas: number
  saldo: number
}

// Tipo para dados do gráfico de categoria
type DadoGraficoCategoria = {
  name: string
  value: number
}

interface RelatorioFinanceiroProps {
  filtroPeriodo: FiltroPeriodo
}

// Cores para os gráficos
const CORES_GRAFICO = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function RelatorioFinanceiro({ filtroPeriodo }: RelatorioFinanceiroProps) {
  const [movimentos, setMovimentos] = useState<MovimentoFinanceiro[]>([])
  const [movimentosFiltrados, setMovimentosFiltrados] = useState<MovimentoFinanceiro[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para os filtros específicos
  const [filtros, setFiltros] = useState<FiltroFinanceiro>({
    tipo: "todos",
    categoria: "",
    valorMinimo: "",
    valorMaximo: "",
    busca: "",
  })

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    saldo: 0,
  })

  // Dados para gráficos
  const [dadosGraficoDiario, setDadosGraficoDiario] = useState<DadoGraficoDiario[]>([])
  const [dadosGraficoCategoriasEntrada, setDadosGraficoCategoriasEntrada] = useState<
    DadoGraficoCategoria[]
  >([])
  const [dadosGraficoCategoriasDespesa, setDadosGraficoCategoriasDespesa] = useState<
    DadoGraficoCategoria[]
  >([])

  // Carregar dados
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true)
        setError(null)

        // Carregar categorias
        const tiposEntrada = await getTipoEntradaEnum()
        setCategorias(tiposEntrada || [])

        // Carregar despesas e entradas em paralelo
        const [despesasData, entradasData] = await Promise.all([getAllDespesa(), getAllEntradas()])

        // Filtrar por período
        const dataInicial = filtroPeriodo.dataInicial.setHours(0, 0, 0, 0)
        const dataFinal = filtroPeriodo.dataFinal.setHours(23, 59, 59, 999)

        // Mapear despesas para o formato unificado
        const despesas: MovimentoFinanceiro[] = (despesasData || [])
          .filter((despesa) => {
            const despesaDate = new Date(despesa.created_at).getTime()
            return despesaDate >= dataInicial && despesaDate <= dataFinal
          })
          .map((despesa) => ({
            id: `despesa-${despesa.id}`,
            tipo: "despesa",
            nome: despesa.despesa_nome,
            descricao: despesa.despesa_descricao,
            valor: Number(despesa.despesa_valor),
            categoria: despesa.despesa_tipo,
            data: despesa.created_at,
            entidade: despesa.motorista
              ? { tipo: "motorista", nome: despesa.motorista.motorista_nome }
              : despesa.veiculo
                ? { tipo: "veículo", nome: despesa.veiculo.veiculo_nome }
                : null,
          }))

        // Mapear entradas para o formato unificado
        const entradas: MovimentoFinanceiro[] = (entradasData || [])
          .filter((entrada) => {
            const entradaDate = new Date(entrada.created_at).getTime()
            return entradaDate >= dataInicial && entradaDate <= dataFinal
          })
          .map((entrada) => ({
            id: `entrada-${entrada.id}`,
            tipo: "entrada",
            nome: entrada.entrada_nome,
            descricao: entrada.entrada_descricao,
            valor: Number(entrada.entrada_valor),
            categoria: entrada.entrada_tipo,
            data: entrada.created_at,
            entidade: null,
          }))

        // Combinar e ordenar por data (mais recente primeiro)
        const combinedData = [...despesas, ...entradas].sort(
          (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
        )

        setMovimentos(combinedData)

        // Calcular estatísticas
        const totalEntradas = entradas.reduce((acc, entrada) => acc + entrada.valor, 0)
        const totalSaidas = despesas.reduce((acc, despesa) => acc + despesa.valor, 0)

        setEstatisticas({
          totalEntradas,
          totalSaidas,
          saldo: totalEntradas - totalSaidas,
        })

        // Preparar dados para o gráfico diário
        prepararDadosGraficoDiario(
          entradas,
          despesas,
          filtroPeriodo.dataInicial,
          filtroPeriodo.dataFinal
        )

        // Preparar dados para os gráficos de categorias
        prepararDadosGraficoCategorias(entradas, despesas)
      } catch (err) {
        console.error("Erro ao carregar dados financeiros:", err)
        setError("Ocorreu um erro ao carregar os dados financeiros.")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [filtroPeriodo])

  // Preparar dados para o gráfico diário
  const prepararDadosGraficoDiario = (
    entradas: MovimentoFinanceiro[],
    despesas: MovimentoFinanceiro[],
    dataInicial: Date,
    dataFinal: Date
  ) => {
    // Criar um array com todos os dias no intervalo
    const dias = eachDayOfInterval({ start: dataInicial, end: dataFinal })

    // Para cada dia, calcular o total de entradas e despesas
    const dadosDiarios = dias.map((dia) => {
      // Filtrar entradas e despesas do dia
      const entradasDoDia = entradas.filter((entrada) => {
        const dataEntrada = new Date(entrada.data)
        return isSameDay(dataEntrada, dia)
      })

      const despesasDoDia = despesas.filter((despesa) => {
        const dataDespesa = new Date(despesa.data)
        return isSameDay(dataDespesa, dia)
      })

      // Calcular totais
      const totalEntradas = entradasDoDia.reduce((acc, entrada) => acc + entrada.valor, 0)
      const totalDespesas = despesasDoDia.reduce((acc, despesa) => acc + despesa.valor, 0)

      return {
        data: format(dia, "dd/MM"),
        entradas: totalEntradas,
        despesas: totalDespesas,
        saldo: totalEntradas - totalDespesas,
      }
    })

    setDadosGraficoDiario(dadosDiarios)
  }

  // Preparar dados para os gráficos de categorias
  const prepararDadosGraficoCategorias = (
    entradas: MovimentoFinanceiro[],
    despesas: MovimentoFinanceiro[]
  ) => {
    // Agrupar entradas por categoria
    const entradasPorCategoria: Record<string, number> = {}
    entradas.forEach((entrada) => {
      const categoria = entrada.categoria || "Sem categoria"
      entradasPorCategoria[categoria] = (entradasPorCategoria[categoria] || 0) + entrada.valor
    })

    // Agrupar despesas por categoria
    const despesasPorCategoria: Record<string, number> = {}
    despesas.forEach((despesa) => {
      const categoria = despesa.categoria || "Sem categoria"
      despesasPorCategoria[categoria] = (despesasPorCategoria[categoria] || 0) + despesa.valor
    })

    // Converter para o formato do gráfico
    const dadosEntradas = Object.entries(entradasPorCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const dadosDespesas = Object.entries(despesasPorCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    setDadosGraficoCategoriasEntrada(dadosEntradas)
    setDadosGraficoCategoriasDespesa(dadosDespesas)
  }

  // Aplicar filtros
  useEffect(() => {
    if (!movimentos.length) {
      setMovimentosFiltrados([])
      return
    }

    let filtered = [...movimentos]

    // Filtrar por tipo
    if (filtros.tipo !== "todos") {
      filtered = filtered.filter((movimento) => movimento.tipo === filtros.tipo)
    }

    // Filtrar por categoria
    if (filtros.categoria) {
      filtered = filtered.filter((movimento) => movimento.categoria === filtros.categoria)
    }

    // Filtrar por valor mínimo
    if (filtros.valorMinimo) {
      filtered = filtered.filter((movimento) => movimento.valor >= Number(filtros.valorMinimo))
    }

    // Filtrar por valor máximo
    if (filtros.valorMaximo) {
      filtered = filtered.filter((movimento) => movimento.valor <= Number(filtros.valorMaximo))
    }

    // Filtrar por busca
    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase()
      filtered = filtered.filter(
        (movimento) =>
          movimento.nome.toLowerCase().includes(termoBusca) ||
          (movimento.descricao?.toLowerCase() || "").includes(termoBusca) ||
          (movimento.categoria?.toLowerCase() || "").includes(termoBusca)
      )
    }

    setMovimentosFiltrados(filtered)
  }, [movimentos, filtros])

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
    return <RelatorioLoading mensagem="Carregando dados financeiros..." />
  }

  if (error) {
    return <RelatorioErro mensagem={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
            Total de Entradas
          </h3>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatarMoeda(estatisticas.totalEntradas)}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
            Total de Saídas
          </h3>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {formatarMoeda(estatisticas.totalSaidas)}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            estatisticas.saldo >= 0
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          }`}
        >
          <h3
            className={`text-sm font-medium mb-1 ${
              estatisticas.saldo >= 0
                ? "text-blue-800 dark:text-blue-300"
                : "text-amber-800 dark:text-amber-300"
            }`}
          >
            Saldo
          </h3>
          <p
            className={`text-2xl font-bold ${
              estatisticas.saldo >= 0
                ? "text-blue-700 dark:text-blue-400"
                : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {formatarMoeda(estatisticas.saldo)}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="evolucao" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="evolucao">Evolução Diária</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="tabela">Tabela Detalhada</TabsTrigger>
        </TabsList>

        {/* Gráfico de Evolução Diária */}
        <TabsContent value="evolucao" className="space-y-6">
          <RelatorioGraficoContainer
            titulo="Evolução Financeira Diária"
            descricao="Entradas, despesas e saldo por dia no período selecionado"
            altura={400}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dadosGraficoDiario}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={formatadorTooltipGrafico} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="entradas"
                  name="Entradas"
                  stroke="#4ade80"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  name="Despesas"
                  stroke="#f87171"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </RelatorioGraficoContainer>
        </TabsContent>

        {/* Gráficos de Categorias */}
        <TabsContent value="categorias" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Categorias de Entrada */}
            <RelatorioGraficoContainer
              titulo="Entradas por Categoria"
              descricao="Distribuição das entradas por categoria"
              altura={350}
            >
              {dadosGraficoCategoriasEntrada.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoCategoriasEntrada}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderizarRotuloGraficoPizza}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoCategoriasEntrada.map((entry, index) => (
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
                  <p className="text-muted-foreground">Nenhuma entrada no período selecionado</p>
                </div>
              )}
            </RelatorioGraficoContainer>

            {/* Gráfico de Categorias de Despesa */}
            <RelatorioGraficoContainer
              titulo="Despesas por Categoria"
              descricao="Distribuição das despesas por categoria"
              altura={350}
            >
              {dadosGraficoCategoriasDespesa.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoCategoriasDespesa}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderizarRotuloGraficoPizza}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoCategoriasDespesa.map((entry, index) => (
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
                  <p className="text-muted-foreground">Nenhuma despesa no período selecionado</p>
                </div>
              )}
            </RelatorioGraficoContainer>
          </div>

          {/* Gráfico de Barras Comparativo */}
          <RelatorioGraficoContainer
            titulo="Comparativo por Categoria"
            descricao="Comparação entre as principais categorias de entradas e despesas"
            altura={400}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  ...dadosGraficoCategoriasEntrada.slice(0, 5).map((item) => ({
                    name: item.name,
                    Entradas: item.value,
                    Despesas: 0,
                  })),
                  ...dadosGraficoCategoriasDespesa.slice(0, 5).map((item) => ({
                    name: item.name,
                    Entradas: 0,
                    Despesas: item.value,
                  })),
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip formatter={formatadorTooltipGrafico} />
                <Legend />
                <Bar dataKey="Entradas" fill="#4ade80" />
                <Bar dataKey="Despesas" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </RelatorioGraficoContainer>
        </TabsContent>

        {/* Tabela Detalhada */}
        <TabsContent value="tabela" className="space-y-6">
          {/* Filtros específicos - APENAS NA ABA DE TABELA */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={filtros.tipo}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, tipo: value as "todos" | "entrada" | "despesa" })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de Movimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros Avançados
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <label className="text-sm font-medium mb-1 block">Categoria</label>
                    <Select
                      value={filtros.categoria}
                      onValueChange={(value) => setFiltros({ ...filtros, categoria: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <label className="text-sm font-medium mb-1 block">Valor Mínimo</label>
                    <Input
                      type="number"
                      placeholder="R$ 0,00"
                      value={filtros.valorMinimo}
                      onChange={(e) => setFiltros({ ...filtros, valorMinimo: e.target.value })}
                    />
                  </div>

                  <div className="p-2">
                    <label className="text-sm font-medium mb-1 block">Valor Máximo</label>
                    <Input
                      type="number"
                      placeholder="R$ 0,00"
                      value={filtros.valorMaximo}
                      onChange={(e) => setFiltros({ ...filtros, valorMaximo: e.target.value })}
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-4 w-full sm:w-auto">
              <Input
                placeholder="Buscar..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="w-full sm:w-[250px]"
              />

              <RelatorioExportar
                dados={movimentosFiltrados}
                nomeArquivo={`relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}`}
              />
            </div>
          </div>

          {/* Tabela de movimentos */}
          {movimentosFiltrados.length === 0 ? (
            <RelatorioVazio mensagem="Nenhum movimento financeiro encontrado para os filtros selecionados." />
          ) : (
            <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentosFiltrados.map((movimento) => (
                    <TableRow key={movimento.id}>
                      <TableCell>
                        {format(new Date(movimento.data), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {movimento.tipo === "entrada" ? (
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                          )}
                          {movimento.nome}
                        </div>
                        {movimento.descricao && (
                          <span className="text-xs text-muted-foreground block mt-1">
                            {movimento.descricao}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            movimento.tipo === "entrada"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          }
                        >
                          {movimento.categoria ||
                            (movimento.tipo === "entrada" ? "Entrada" : "Despesa")}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          movimento.tipo === "entrada"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {movimento.tipo === "entrada" ? "+" : "-"}
                        {formatarMoeda(movimento.valor)}
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
