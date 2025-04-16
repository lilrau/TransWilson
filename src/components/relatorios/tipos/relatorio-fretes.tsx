"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Filter, MapPin, Truck, User } from "lucide-react"
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
  LineChart,
  Line,
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
import { getAllFrete } from "@/lib/services/frete-service"
import { getAllMotorista } from "@/lib/services/motorista-service"
import { getAllVeiculos } from "@/lib/services/veiculo-service"
import type { FiltroPeriodo } from "../relatorios-container"
import { RelatorioLoading } from "../ui/relatorio-loading"
import { RelatorioErro } from "../ui/relatorio-erro"
import { RelatorioVazio } from "../ui/relatorio-vazio"
import { RelatorioExportar } from "../ui/relatorio-exportar"
import { RelatorioGraficoContainer } from "../ui/relatorio-grafico-container"

// Tipo para os fretes
type Frete = {
  id: number
  frete_nome: string
  frete_origem: string | null
  frete_destino: string | null
  frete_valor_total: number | null
  created_at: string
  veiculo?: { id: number; veiculo_nome: string } | null
  motorista?: { id: number; motorista_nome: string } | null
  agenciador?: { id: number; agenciador_nome: string } | null
}

// Tipo para os filtros específicos do relatório de fretes
type FiltroFretes = {
  motorista: string
  veiculo: string
  origem: string
  destino: string
  busca: string
}

// Tipo para dados do gráfico de origem/destino
type DadoGraficoRota = {
  name: string
  value: number
}

// Tipo para dados do gráfico de motoristas
type DadoGraficoMotorista = {
  name: string
  value: number
}

// Tipo para dados do gráfico de evolução temporal
type DadoGraficoEvolucao = {
  data: string
  valor: number
}

// Função para normalizar strings (remover acentos e padronizar)
const normalizarTexto = (texto: string | null): string => {
  if (!texto) return ""

  // Converter para minúsculas
  let normalizado = texto.toLowerCase()

  // Remover acentos
  normalizado = normalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Remover espaços extras
  normalizado = normalizado.trim().replace(/\s+/g, " ")

  return normalizado
}

// Função para padronizar uma rota
const padronizarRota = (origem: string | null, destino: string | null): string => {
  const origemNormalizada = normalizarTexto(origem)
  const destinoNormalizada = normalizarTexto(destino)

  if (!origemNormalizada || !destinoNormalizada) return ""

  return `${origemNormalizada} → ${destinoNormalizada}`
}

interface RelatorioFretesProps {
  filtroPeriodo: FiltroPeriodo
}

// Cores para os gráficos
const CORES_GRAFICO = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function RelatorioFretes({ filtroPeriodo }: RelatorioFretesProps) {
  const [fretes, setFretes] = useState<Frete[]>([])
  const [fretesFiltrados, setFretesFiltrados] = useState<Frete[]>([])
  const [motoristas, setMotoristas] = useState<{ id: number; nome: string }[]>([])
  const [veiculos, setVeiculos] = useState<{ id: number; nome: string }[]>([])
  const [origens, setOrigens] = useState<string[]>([])
  const [destinos, setDestinos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para os filtros específicos
  const [filtros, setFiltros] = useState<FiltroFretes>({
    motorista: "",
    veiculo: "",
    origem: "",
    destino: "",
    busca: "",
  })

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalFretes: 0,
    valorTotal: 0,
    mediaValor: 0,
  })

  // Dados para gráficos
  const [dadosGraficoRotas, setDadosGraficoRotas] = useState<DadoGraficoRota[]>([])
  const [dadosGraficoMotoristas, setDadosGraficoMotoristas] = useState<DadoGraficoMotorista[]>([])
  const [dadosGraficoEvolucao, setDadosGraficoEvolucao] = useState<DadoGraficoEvolucao[]>([])

  // Carregar dados
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true)
        setError(null)

        // Carregar fretes, motoristas e veículos em paralelo
        const [fretesData, motoristasData, veiculosData] = await Promise.all([
          getAllFrete(),
          getAllMotorista(),
          getAllVeiculos(),
        ])

        // Filtrar por período
        const dataInicial = filtroPeriodo.dataInicial.setHours(0, 0, 0, 0)
        const dataFinal = filtroPeriodo.dataFinal.setHours(23, 59, 59, 999)

        const fretesFiltrados = (fretesData || []).filter((frete) => {
          const freteDate = new Date(frete.created_at).getTime()
          return freteDate >= dataInicial && freteDate <= dataFinal
        })

        setFretes(fretesFiltrados)

        // Extrair motoristas
        setMotoristas(
          motoristasData?.map((motorista) => ({
            id: motorista.id,
            nome: motorista.motorista_nome,
          })) || []
        )

        // Extrair veículos
        setVeiculos(
          veiculosData?.map((veiculo) => ({
            id: veiculo.id,
            nome: veiculo.veiculo_nome,
          })) || []
        )

        // Modifique a parte que extrai origens e destinos únicos
        // Substitua o trecho atual por este:

        // Extrair origens e destinos únicos
        const origensMap = new Map<string, string>()
        const destinosMap = new Map<string, string>()

        fretesFiltrados.forEach((frete) => {
          if (frete.frete_origem) {
            const origemNormalizada = normalizarTexto(frete.frete_origem)
            if (origemNormalizada && !origensMap.has(origemNormalizada)) {
              origensMap.set(origemNormalizada, frete.frete_origem)
            }
          }

          if (frete.frete_destino) {
            const destinoNormalizado = normalizarTexto(frete.frete_destino)
            if (destinoNormalizado && !destinosMap.has(destinoNormalizado)) {
              destinosMap.set(destinoNormalizado, frete.frete_destino)
            }
          }
        })

        const origensUnicas = Array.from(origensMap.values())
        const destinosUnicos = Array.from(destinosMap.values())

        setOrigens(origensUnicas)
        setDestinos(destinosUnicos)

        // Calcular estatísticas
        const valorTotal = fretesFiltrados.reduce(
          (acc, frete) => acc + (frete.frete_valor_total || 0),
          0
        )

        const mediaValor = fretesFiltrados.length ? valorTotal / fretesFiltrados.length : 0

        setEstatisticas({
          totalFretes: fretesFiltrados.length,
          valorTotal,
          mediaValor,
        })

        // Preparar dados para gráficos
        prepararDadosGraficoRotas(fretesFiltrados)
        prepararDadosGraficoMotoristas(fretesFiltrados)
        prepararDadosGraficoEvolucao(fretesFiltrados)
      } catch (err) {
        console.error("Erro ao carregar dados de fretes:", err)
        setError("Ocorreu um erro ao carregar os dados de fretes.")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [filtroPeriodo])

  // Preparar dados para o gráfico de rotas
  const prepararDadosGraficoRotas = (fretes: Frete[]) => {
    const rotasContagem: Record<string, number> = {}
    const rotasOriginais: Record<string, string> = {} // Para manter a formatação original para exibição

    fretes.forEach((frete) => {
      if (frete.frete_origem && frete.frete_destino) {
        // Normalizar a rota para agrupamento
        const rotaNormalizada = padronizarRota(frete.frete_origem, frete.frete_destino)

        if (rotaNormalizada) {
          // Incrementar contagem
          rotasContagem[rotaNormalizada] = (rotasContagem[rotaNormalizada] || 0) + 1

          // Armazenar a primeira versão original encontrada para exibição
          if (!rotasOriginais[rotaNormalizada]) {
            rotasOriginais[rotaNormalizada] = `${frete.frete_origem} → ${frete.frete_destino}`
          }
        }
      }
    })

    // Converter para o formato do gráfico usando as versões originais para exibição
    const dadosRotas = Object.entries(rotasContagem)
      .map(([rotaNormalizada, value]) => ({
        name: rotasOriginais[rotaNormalizada] || rotaNormalizada, // Usa a versão original para exibição
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 rotas

    setDadosGraficoRotas(dadosRotas)
  }

  // Preparar dados para o gráfico de motoristas
  const prepararDadosGraficoMotoristas = (fretes: Frete[]) => {
    const motoristasValores: Record<string, number> = {}

    fretes.forEach((frete) => {
      if (frete.motorista?.motorista_nome && frete.frete_valor_total) {
        const nome = frete.motorista.motorista_nome
        motoristasValores[nome] = (motoristasValores[nome] || 0) + frete.frete_valor_total
      }
    })

    const dadosMotoristas = Object.entries(motoristasValores)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 motoristas

    setDadosGraficoMotoristas(dadosMotoristas)
  }

  // Preparar dados para o gráfico de evolução temporal
  const prepararDadosGraficoEvolucao = (fretes: Frete[]) => {
    // Agrupar fretes por mês
    const fretesPorMes: Record<string, number> = {}

    fretes.forEach((frete) => {
      const data = new Date(frete.created_at)
      const mesAno = format(data, "MM/yyyy")
      fretesPorMes[mesAno] = (fretesPorMes[mesAno] || 0) + (frete.frete_valor_total || 0)
    })

    // Converter para o formato do gráfico e ordenar por data
    const dadosEvolucao = Object.entries(fretesPorMes)
      .map(([data, valor]) => ({ data, valor }))
      .sort((a, b) => {
        const [mesA, anoA] = a.data.split("/")
        const [mesB, anoB] = b.data.split("/")
        return (
          new Date(Number(anoA), Number(mesA) - 1).getTime() -
          new Date(Number(anoB), Number(mesB) - 1).getTime()
        )
      })

    setDadosGraficoEvolucao(dadosEvolucao)
  }

  // Aplicar filtros
  useEffect(() => {
    if (!fretes.length) {
      setFretesFiltrados([])
      return
    }

    let filtered = [...fretes]

    // Filtrar por motorista
    if (filtros.motorista) {
      filtered = filtered.filter((frete) => frete.motorista?.motorista_nome === filtros.motorista)
    }

    // Filtrar por veículo
    if (filtros.veiculo) {
      filtered = filtered.filter((frete) => frete.veiculo?.veiculo_nome === filtros.veiculo)
    }

    // Filtrar por origem
    if (filtros.origem) {
      filtered = filtered.filter(
        (frete) => normalizarTexto(frete.frete_origem) === normalizarTexto(filtros.origem)
      )
    }

    // Filtrar por destino
    if (filtros.destino) {
      filtered = filtered.filter(
        (frete) => normalizarTexto(frete.frete_destino) === normalizarTexto(filtros.destino)
      )
    }

    // Filtrar por busca
    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase()
      filtered = filtered.filter(
        (frete) =>
          frete.frete_nome.toLowerCase().includes(termoBusca) ||
          (frete.frete_origem?.toLowerCase() || "").includes(termoBusca) ||
          (frete.frete_destino?.toLowerCase() || "").includes(termoBusca) ||
          (frete.motorista?.motorista_nome.toLowerCase() || "").includes(termoBusca) ||
          (frete.veiculo?.veiculo_nome.toLowerCase() || "").includes(termoBusca) ||
          (frete.agenciador?.agenciador_nome.toLowerCase() || "").includes(termoBusca)
      )
    }

    setFretesFiltrados(filtered)
  }, [fretes, filtros])

  // Formatar valor para exibição em reais
  const formatarMoeda = (valor: number | null) => {
    if (valor === null) return "-"
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
    return <RelatorioLoading mensagem="Carregando dados de fretes..." />
  }

  if (error) {
    return <RelatorioErro mensagem={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            Total de Fretes
          </h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {estatisticas.totalFretes}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
            Valor Total
          </h3>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatarMoeda(estatisticas.valorTotal)}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
            Valor Médio
          </h3>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {formatarMoeda(estatisticas.mediaValor)}
          </p>
        </div>
      </div>

      {/* Gráficos e Tabela */}
      <Tabs defaultValue="rotas" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="rotas">Rotas</TabsTrigger>
          <TabsTrigger value="motoristas">Motoristas</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="tabela">Tabela Detalhada</TabsTrigger>
        </TabsList>

        {/* Gráfico de Rotas */}
        <TabsContent value="rotas" className="space-y-6">
          <RelatorioGraficoContainer
            titulo="Principais Rotas"
            descricao="Top 10 rotas mais frequentes"
            altura={400}
          >
            {dadosGraficoRotas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosGraficoRotas}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Quantidade de Fretes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Nenhuma rota encontrada no período selecionado
                </p>
              </div>
            )}
          </RelatorioGraficoContainer>
        </TabsContent>

        {/* Gráfico de Motoristas */}
        <TabsContent value="motoristas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Valor por Motorista */}
            <RelatorioGraficoContainer
              titulo="Top 5 Motoristas por Valor"
              descricao="Motoristas com maior valor total de fretes"
              altura={350}
            >
              {dadosGraficoMotoristas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosGraficoMotoristas}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip formatter={formatadorTooltipGrafico} />
                    <Legend />
                    <Bar dataKey="value" name="Valor Total" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Nenhum motorista encontrado no período selecionado
                  </p>
                </div>
              )}
            </RelatorioGraficoContainer>

            {/* Gráfico de Pizza de Motoristas */}
            <RelatorioGraficoContainer
              titulo="Distribuição por Motorista"
              descricao="Participação de cada motorista no valor total"
              altura={350}
            >
              {dadosGraficoMotoristas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoMotoristas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderizarRotuloGraficoPizza}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoMotoristas.map((entry, index) => (
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
                    Nenhum motorista encontrado no período selecionado
                  </p>
                </div>
              )}
            </RelatorioGraficoContainer>
          </div>
        </TabsContent>

        {/* Gráfico de Evolução */}
        <TabsContent value="evolucao" className="space-y-6">
          <RelatorioGraficoContainer
            titulo="Evolução do Valor de Fretes"
            descricao="Valor total de fretes por mês"
            altura={400}
          >
            {dadosGraficoEvolucao.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dadosGraficoEvolucao}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip formatter={formatadorTooltipGrafico} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    name="Valor Total"
                    stroke="#8884d8"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
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

        {/* Tabela Detalhada */}
        <TabsContent value="tabela" className="space-y-6">
          {/* Filtros específicos - APENAS NA ABA DE TABELA */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <label className="text-sm font-medium mb-1 block">Motorista</label>
                    <Select
                      value={filtros.motorista}
                      onValueChange={(value) => setFiltros({ ...filtros, motorista: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.nome}>
                            {motorista.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <label className="text-sm font-medium mb-1 block">Veículo</label>
                    <Select
                      value={filtros.veiculo}
                      onValueChange={(value) => setFiltros({ ...filtros, veiculo: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {veiculos.map((veiculo) => (
                          <SelectItem key={veiculo.id} value={veiculo.nome}>
                            {veiculo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <label className="text-sm font-medium mb-1 block">Origem</label>
                    <Select
                      value={filtros.origem}
                      onValueChange={(value) => setFiltros({ ...filtros, origem: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {origens.map((origem) => (
                          <SelectItem key={origem} value={origem}>
                            {origem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <label className="text-sm font-medium mb-1 block">Destino</label>
                    <Select
                      value={filtros.destino}
                      onValueChange={(value) => setFiltros({ ...filtros, destino: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {destinos.map((destino) => (
                          <SelectItem key={destino} value={destino}>
                            {destino}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                dados={fretesFiltrados}
                nomeArquivo={`relatorio-fretes-${format(new Date(), "yyyy-MM-dd")}`}
              />
            </div>
          </div>

          {/* Tabela de fretes */}
          {fretesFiltrados.length === 0 ? (
            <RelatorioVazio mensagem="Nenhum frete encontrado para os filtros selecionados." />
          ) : (
            <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Origem/Destino</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fretesFiltrados.map((frete) => (
                    <TableRow key={frete.id}>
                      <TableCell className="font-medium">{frete.frete_nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {frete.frete_origem || "N/A"} → {frete.frete_destino || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{frete.motorista?.motorista_nome || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>{frete.veiculo?.veiculo_nome || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(frete.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatarMoeda(frete.frete_valor_total)}
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

// This function is defined but not used, so we can remove it or implement it if needed
/* 
const renderCustomizedLabel = ({ 
  cx, 
  cy, 
  midAngle, 
  innerRadius, 
  outerRadius, 
  percent 
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}
*/
