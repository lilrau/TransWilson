"use client"

import React from "react"
import { useEffect, useState, useRef } from "react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  Loader2,
} from "lucide-react"
import { getAllDespesa, getTipoDespesaEnum } from "@/lib/services/despesa-service"
import { getAllEntradas, getTipoEntradaEnum } from "@/lib/services/entrada-service"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Movimento = {
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

export function EntradasSaidasTable() {
  const [entradaCategories, setEntradaCategories] = useState<string[]>([])
  const [despesaCategories, setDespesaCategories] = useState<string[]>([])
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [filteredMovimentos, setFilteredMovimentos] = useState<Movimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({})
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [filters, setFilters] = useState({
    tipo: "todos",
    categoria: "",
    descricao: "",
    valorMin: "",
    valorMax: "",
  })
  const [categorias, setCategorias] = useState<string[]>([])
  const detailRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const [tiposEntrada, tiposDespesa] = await Promise.all([
          getTipoEntradaEnum(),
          getTipoDespesaEnum(),
        ])

        if (tiposEntrada && tiposDespesa) {
          setEntradaCategories(tiposEntrada)
          setDespesaCategories(tiposDespesa)
          setCategorias([...tiposEntrada, ...tiposDespesa])
        }
      } catch (err) {
        console.error("Erro ao buscar categorias:", err)
        setError("Erro ao carregar as categorias.")
      }
    }

    fetchCategorias()
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Definir início e fim do mês selecionado
        const startDate = startOfMonth(selectedMonth)
        const endDate = endOfMonth(selectedMonth)

        // Buscar despesas e entradas em paralelo
        const [despesasData, entradasData] = await Promise.all([getAllDespesa(), getAllEntradas()])

        // Mapear despesas para o formato unificado
        const despesas: Movimento[] = (despesasData || [])
          .filter((despesa) => {
            const despesaDate = new Date(despesa.created_at)
            return despesaDate >= startDate && despesaDate <= endDate
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
        const entradas: Movimento[] = (entradasData || [])
          .filter((entrada) => {
            const entradaDate = new Date(entrada.created_at)
            return entradaDate >= startDate && entradaDate <= endDate
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
      } catch (err) {
        console.error("Erro ao buscar movimentos:", err)
        setError("Ocorreu um erro ao carregar os dados de entradas e saídas.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedMonth])

  // Efeito para medir a altura dos detalhes quando expandidos
  useEffect(() => {
    const newRowHeights: Record<string, number> = {}

    Object.keys(expandedRows).forEach((rowId) => {
      if (expandedRows[rowId] && detailRefs.current[rowId]) {
        newRowHeights[rowId] = detailRefs.current[rowId]?.scrollHeight || 0
      }
    })

    setRowHeights(newRowHeights)
  }, [expandedRows, movimentos])

  // Efeito para aplicar filtros
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...movimentos]

      if (filters.tipo !== "todos") {
        filtered = filtered.filter((movimento) => movimento.tipo === filters.tipo)
      }

      if (filters.categoria && filters.categoria !== "todas") {
        filtered = filtered.filter((movimento) => movimento.categoria === filters.categoria)
      }

      if (filters.descricao) {
        filtered = filtered.filter(
          (movimento) =>
            movimento.nome.toLowerCase().includes(filters.descricao.toLowerCase()) ||
            (movimento.descricao?.toLowerCase() || "").includes(filters.descricao.toLowerCase())
        )
      }

      if (filters.valorMin) {
        filtered = filtered.filter((movimento) => movimento.valor >= Number(filters.valorMin))
      }

      if (filters.valorMax) {
        filtered = filtered.filter((movimento) => movimento.valor <= Number(filters.valorMax))
      }

      setFilteredMovimentos(filtered)
    }

    applyFilters()
  }, [movimentos, filters])

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p className="font-medium">Erro ao carregar dados</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
            Mês Anterior
          </Button>
          <div className="font-medium">
            {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedMonth(new Date())}
            disabled={format(selectedMonth, "MM/yyyy") === format(new Date(), "MM/yyyy")}
          >
            Mês Atual
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-1">
            <Select
              value={filters.tipo}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, tipo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Movimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select
              value={filters.categoria}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, categoria: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>

                {/* Categorias de Entrada */}
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <ArrowUpCircle className="h-3 w-3 text-green-500" />
                  Entradas
                </div>
                {categorias
                  .filter((cat) => entradaCategories.includes(cat))
                  .map((categoria) => (
                    <SelectItem key={`entrada-${categoria}`} value={categoria} className="pl-6">
                      {categoria}
                    </SelectItem>
                  ))}

                {/* Categorias de Despesa */}
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1 mt-2">
                  <ArrowDownCircle className="h-3 w-3 text-red-500" />
                  Despesas
                </div>
                {categorias
                  .filter((cat) => despesaCategories.includes(cat))
                  .map((categoria) => (
                    <SelectItem key={`despesa-${categoria}`} value={categoria} className="pl-6">
                      {categoria}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Filtrar por descrição"
            value={filters.descricao}
            onChange={(e) => setFilters((prev) => ({ ...prev, descricao: e.target.value }))}
            className="md:col-span-1"
          />

          <Input
            type="number"
            placeholder="Valor mínimo"
            value={filters.valorMin}
            onChange={(e) => setFilters((prev) => ({ ...prev, valorMin: e.target.value }))}
            className="md:col-span-0.5"
          />

          <Input
            type="number"
            placeholder="Valor máximo"
            value={filters.valorMax}
            onChange={(e) => setFilters((prev) => ({ ...prev, valorMax: e.target.value }))}
            className="md:col-span-0.5"
          />
        </div>
      </div>

      {filteredMovimentos.length === 0 ? (
        <div className="bg-muted p-8 rounded-md text-center">
          <h3 className="text-lg font-medium mb-2">Nenhum movimento financeiro encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Não há registros de entradas ou saídas no sistema.
          </p>
        </div>
      ) : (
        <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovimentos.map((movimento) => (
                <React.Fragment key={movimento.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRowExpansion(movimento.id)}
                  >
                    <TableCell className="p-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {expandedRows[movimento.id] ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{formatDate(movimento.data)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {movimento.tipo === "entrada" ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-500" />
                        )}
                        {movimento.nome}
                      </div>
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
                      {formatCurrency(movimento.valor)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30 dark:bg-zinc-800/30">
                    <TableCell colSpan={5} className="p-0 overflow-hidden">
                      <div
                        className={cn(
                          "transition-all duration-300 ease-in-out",
                          expandedRows[movimento.id] ? "opacity-100" : "opacity-0 max-h-0"
                        )}
                        style={{
                          maxHeight: expandedRows[movimento.id]
                            ? `${rowHeights[movimento.id] || 1000}px`
                            : "0px",
                        }}
                      >
                        <div
                          ref={(el: HTMLDivElement | null): void => {
                            detailRefs.current[movimento.id] = el
                          }}
                          className="p-0"
                        >
                          <Card className="border-0 shadow-none bg-transparent">
                            <CardContent className="p-4 space-y-2">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-base font-medium">Detalhes do Movimento</h3>
                                <Button variant="outline" size="sm" asChild>
                                  <Link
                                    href={
                                      movimento.tipo === "entrada"
                                        ? `/dashboard/movimentos/entradas/${movimento.id.replace("entrada-", "")}/editar`
                                        : `/dashboard/movimentos/despesas/${movimento.id.replace("despesa-", "")}`
                                    }
                                    className="flex items-center gap-1"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                    <span>Editar</span>
                                  </Link>
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                    Detalhes
                                  </h4>
                                  <p className="text-sm">
                                    {movimento.descricao || "Sem descrição adicional"}
                                  </p>
                                </div>

                                {movimento.entidade && (
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                      {movimento.entidade.tipo === "motorista"
                                        ? "Motorista"
                                        : "Veículo"}
                                    </h4>
                                    <p className="text-sm">{movimento.entidade.nome}</p>
                                  </div>
                                )}

                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                    Data e Hora
                                  </h4>
                                  <p className="text-sm">
                                    {format(new Date(movimento.data), "dd/MM/yyyy 'às' HH:mm", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
