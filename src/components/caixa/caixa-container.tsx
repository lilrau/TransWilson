"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getAllVeiculos } from "@/lib/services/veiculo-service"
import { getAllDespesa } from "@/lib/services/despesa-service"
import { getAllEntradas } from "@/lib/services/entrada-service"
import { Loader2, Check, Clock } from "lucide-react"

interface Transaction {
  id: number
  tipo: "entrada" | "saida"
  valor: number
  data: string
  descricao: string
  baixado: boolean
  veiculo?: {
    id: number
    nome: string
  }
}

interface Veiculo {
  id: number
  nome: string
}

interface VeiculoData {
  id: number
  veiculo_nome: string
}

interface DespesaData {
  id: number
  despesa_nome: string
  despesa_valor: number
  created_at: string
  veiculo?: {
    id: number
    veiculo_nome: string
  }
  frete?: {
    frete_baixa: boolean
  }
}

interface EntradaData {
  id: number
  entrada_nome: string
  entrada_valor: number
  created_at: string
  frete?: {
    frete_baixa: boolean
    veiculo?: {
      id: number
      veiculo_nome: string
    }
  }
}

export function CaixaContainer() {
  const [loading, setLoading] = useState(true)
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [selectedVeiculo, setSelectedVeiculo] = useState<string>("geral")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [saldo, setSaldo] = useState(0)

  useEffect(() => {
    async function loadVeiculos() {
      try {
        const data = await getAllVeiculos()
        setVeiculos(
          data?.map((veiculo: VeiculoData) => ({
            id: veiculo.id,
            nome: veiculo.veiculo_nome,
          })) || []
        )
      } catch (error) {
        console.error("Erro ao carregar veículos:", error)
      }
    }

    loadVeiculos()
  }, [])

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true)
      try {
        // Carregar despesas
        const despesas = await getAllDespesa()
        const despesasFormatted = despesas?.map((despesa: DespesaData) => ({
          id: despesa.id,
          tipo: "saida" as const,
          valor: despesa.despesa_valor || 0,
          data: despesa.created_at,
          descricao: despesa.despesa_nome,
          baixado: despesa.frete?.frete_baixa || false,
          veiculo: despesa.veiculo ? {
            id: despesa.veiculo.id,
            nome: despesa.veiculo.veiculo_nome,
          } : undefined
        })) || []

        // Carregar entradas
        const entradas = await getAllEntradas()
        const entradasFormatted = entradas?.map((entrada: EntradaData) => ({
          id: entrada.id,
          tipo: "entrada" as const,
          valor: entrada.entrada_valor || 0,
          data: entrada.created_at,
          descricao: entrada.entrada_nome,
          baixado: entrada.frete?.frete_baixa || false,
          veiculo: entrada.frete?.veiculo ? {
            id: entrada.frete.veiculo.id,
            nome: entrada.frete.veiculo.veiculo_nome,
          } : undefined
        })) || []

        // Combinar todas as transações
        const allTransactions = [...despesasFormatted, ...entradasFormatted]
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

        // Filtrar por veículo se necessário
        const filteredTransactions = selectedVeiculo === "geral"
          ? allTransactions
          : allTransactions.filter(t => t.veiculo?.id === Number(selectedVeiculo))

        setTransactions(filteredTransactions)

        // Calcular saldo
        const saldoCalculado = filteredTransactions.reduce((acc: number, transaction: Transaction) => {
          if (transaction.tipo === "entrada") {
            return acc + transaction.valor
          } else {
            return acc - transaction.valor
          }
        }, 0)

        setSaldo(saldoCalculado)
      } catch (error) {
        console.error("Erro ao carregar transações:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [selectedVeiculo])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle>Fluxo de Caixa</CardTitle>
            <Select value={selectedVeiculo} onValueChange={setSelectedVeiculo}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Selecione um veículo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                {veiculos.map((veiculo) => (
                  <SelectItem key={veiculo.id} value={veiculo.id.toString()}>
                    {veiculo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Saldo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      transactions.reduce((acc: number, t: Transaction) => t.tipo === "entrada" ? acc + t.valor : acc, 0)
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Saídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      transactions.reduce((acc: number, t: Transaction) => t.tipo === "saida" ? acc + t.valor : acc, 0)
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground">Nenhuma transação encontrada.</p>
                  ) : (
                    transactions.map((transaction) => (
                      <div
                        key={`${transaction.id}-${transaction.tipo}`}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{transaction.descricao}</p>
                            <Badge variant={transaction.baixado ? "default" : "secondary"} className="ml-2">
                              {transaction.baixado ? (
                                <><Check className="w-3 h-3 mr-1" /> Baixado</>
                              ) : (
                                <><Clock className="w-3 h-3 mr-1" /> Em Aberto</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {transaction.veiculo && ` • ${transaction.veiculo.nome}`}
                          </p>
                        </div>
                        <p className={`font-bold ${transaction.tipo === "entrada" ? "text-green-500" : "text-red-500"}`}>
                          {transaction.tipo === "entrada" ? "+" : "-"}
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.valor)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 