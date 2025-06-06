"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Filter, Truck, User } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAllVeiculos } from "@/lib/services/veiculo-service"
import { getAllFrete } from "@/lib/services/frete-service"
import { getAllDespesa } from "@/lib/services/despesa-service"
import type { FiltroPeriodo } from "../relatorios-container"
import { RelatorioLoading } from "../ui/relatorio-loading"
import { RelatorioErro } from "../ui/relatorio-erro"
import { RelatorioVazio } from "../ui/relatorio-vazio"
import { RelatorioExportar } from "../ui/relatorio-exportar"

// Tipo para os veículos com dados agregados
type VeiculoRelatorio = {
  id: number
  nome: string
  placa: string
  reboque: string
  ano: number | null
  motorista: string | null
  totalFretes: number
  valorFretes: number
  totalDespesas: number
  valorDespesas: number
  saldo: number
}

// Tipo para os filtros específicos do relatório de veículos
type FiltroVeiculos = {
  reboque: string
  busca: string
  ordenacao: "nome" | "fretes" | "valor" | "saldo"
  direcao: "asc" | "desc"
}

interface RelatorioVeiculosProps {
  filtroPeriodo: FiltroPeriodo
}

export function RelatorioVeiculos({ filtroPeriodo }: RelatorioVeiculosProps) {
  const [veiculos, setVeiculos] = useState<VeiculoRelatorio[]>([])
  const [veiculosFiltrados, setVeiculosFiltrados] = useState<VeiculoRelatorio[]>([])
  const [tiposReboque, setTiposReboque] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para os filtros específicos
  const [filtros, setFiltros] = useState<FiltroVeiculos>({
    reboque: "",
    busca: "",
    ordenacao: "nome",
    direcao: "asc",
  })

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalVeiculos: 0,
    totalFretes: 0,
    valorTotalFretes: 0,
    valorTotalDespesas: 0,
  })

  // Carregar dados
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true)
        setError(null)

        // Carregar veículos, fretes e despesas em paralelo
        const [veiculosData, fretesData, despesasData] = await Promise.all([
          getAllVeiculos(),
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

        // Extrair tipos de reboque únicos
        const reboquesUnicos = Array.from(
          new Set(veiculosData.map((veiculo) => veiculo.veiculo_reboque).filter(Boolean))
        )

        setTiposReboque(reboquesUnicos)

        // Calcular dados agregados para cada veículo
        const veiculosRelatorio: VeiculoRelatorio[] = (veiculosData || []).map((veiculo) => {
          // Fretes do veículo no período
          const fretesVeiculo = fretesFiltrados.filter(
            (frete) => frete.frete_veiculo === veiculo.id
          )

          const totalFretes = fretesVeiculo.length
          const valorFretes = fretesVeiculo.reduce(
            (acc, frete) => acc + (frete.frete_valor_total || 0),
            0
          )

          // Despesas do veículo no período
          const despesasVeiculo = despesasFiltradas.filter(
            (despesa) => despesa.despesa_veiculo === veiculo.id
          )

          const totalDespesas = despesasVeiculo.length
          const valorDespesas = despesasVeiculo.reduce(
            (acc, despesa) => acc + (despesa.despesa_valor || 0),
            0
          )

          // Saldo (valor dos fretes - despesas)
          const saldo = valorFretes - valorDespesas

          return {
            id: veiculo.id,
            nome: veiculo.veiculo_nome,
            placa: veiculo.veiculo_placa,
            reboque: veiculo.veiculo_reboque,
            ano: veiculo.veiculo_ano,
            motorista: veiculo.motorista?.motorista_nome || null,
            totalFretes,
            valorFretes,
            totalDespesas,
            valorDespesas,
            saldo,
          }
        })

        setVeiculos(veiculosRelatorio)

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
          totalVeiculos: veiculosRelatorio.length,
          totalFretes,
          valorTotalFretes,
          valorTotalDespesas,
        })
      } catch (err) {
        console.error("Erro ao carregar dados de veículos:", err)
        setError("Ocorreu um erro ao carregar os dados de veículos.")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [filtroPeriodo])

  // Aplicar filtros e ordenação
  useEffect(() => {
    if (!veiculos.length) {
      setVeiculosFiltrados([])
      return
    }

    let filtered = [...veiculos]

    // Filtrar por tipo de reboque
    if (filtros.reboque && filtros.reboque !== "todos") {
      filtered = filtered.filter((veiculo) => veiculo.reboque === filtros.reboque)
    }

    // Filtrar por busca
    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase()
      filtered = filtered.filter(
        (veiculo) =>
          veiculo.nome.toLowerCase().includes(termoBusca) ||
          veiculo.placa.toLowerCase().includes(termoBusca) ||
          (veiculo.motorista?.toLowerCase() || "").includes(termoBusca)
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

    setVeiculosFiltrados(filtered)
  }, [veiculos, filtros])

  // Formatar valor para exibição em reais
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  if (loading) {
    return <RelatorioLoading mensagem="Carregando dados de veículos..." />
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
            Total de Veículos
          </h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {estatisticas.totalVeiculos}
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

      {/* Filtros específicos */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={filtros.reboque}
            onValueChange={(value) => setFiltros({ ...filtros, reboque: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Reboque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {tiposReboque.map((reboque) => (
                <SelectItem key={reboque} value={reboque}>
                  {reboque}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            placeholder="Buscar veículo..."
            value={filtros.busca}
            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
            className="w-full sm:w-[250px]"
          />

          <RelatorioExportar
            dados={veiculosFiltrados}
            nomeArquivo={`relatorio-veiculos-${format(new Date(), "yyyy-MM-dd")}`}
          />
        </div>
      </div>

      {/* Tabela de veículos */}
      {veiculosFiltrados.length === 0 ? (
        <RelatorioVazio mensagem="Nenhum veículo encontrado para os filtros selecionados." />
      ) : (
        <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Reboque</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Fretes</TableHead>
                <TableHead>Valor Fretes</TableHead>
                <TableHead>Despesas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veiculosFiltrados.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span>{veiculo.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{veiculo.placa}</TableCell>
                  <TableCell>{veiculo.reboque}</TableCell>
                  <TableCell>
                    {veiculo.motorista ? (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{veiculo.motorista}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Não atribuído</span>
                    )}
                  </TableCell>
                  <TableCell>{veiculo.totalFretes}</TableCell>
                  <TableCell>{formatarMoeda(veiculo.valorFretes)}</TableCell>
                  <TableCell>{formatarMoeda(veiculo.valorDespesas)}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      veiculo.saldo >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatarMoeda(veiculo.saldo)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
