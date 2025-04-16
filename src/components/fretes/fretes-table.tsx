"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
// Adicionar importações necessárias
import {
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Loader2,
  MoreHorizontal,
  Trash,
} from "lucide-react"
import { createEntrada } from "@/lib/services/entrada-service"
import { darBaixaFrete, deleteFrete, getAllFrete, getFrete } from "@/lib/services/frete-service"
import { getMotorista } from "@/lib/services/motorista-service"
import { createDespesa } from "@/lib/services/despesa-service"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Atualizar a interface Frete para incluir o campo frete_baixa
type Frete = {
  id: number
  frete_nome: string
  frete_origem: string | null
  frete_destino: string | null
  frete_valor_total: number | null
  frete_baixa: boolean | null
  created_at: string
  veiculo?: { id: number; veiculo_nome: string } | null
  motorista?: { id: number; motorista_nome: string } | null
  agenciador?: { id: number; agenciador_nome: string } | null
}

type CommissionCalculatorProps = {
  freteId: number
  motoristaId: number
  motoristaName: string
  commissionValue: string
  setCommissionValue: (value: string) => void
  onPayment: (valor: number) => Promise<void>
  isPaying: boolean
}

function CommissionCalculator({
  freteId,
  motoristaId,
  motoristaName,
  commissionValue,
  setCommissionValue,
  onPayment,
  isPaying,
}: CommissionCalculatorProps) {
  const [calculationData, setCalculationData] = useState<{
    valorComissao: number
    percentual: number
    valorTotal: number
  } | null>(null)
  const [isCalculating, setIsCalculating] = useState(true)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  useEffect(() => {
    const calculateCommission = async () => {
      try {
        setIsCalculating(true)
        const freteData = await getFrete(freteId)
        const motoristaData = await getMotorista(motoristaId)

        if (!freteData || !motoristaData) {
          throw new Error("Não foi possível obter os dados do frete ou do motorista")
        }

        const valorComissao = (freteData.frete_valor_total * motoristaData.motorista_frete) / 100
        setCommissionValue(valorComissao.toFixed(2))

        setCalculationData({
          valorComissao,
          percentual: motoristaData.motorista_frete,
          valorTotal: freteData.frete_valor_total,
        })
      } catch (err) {
        console.error("Erro ao calcular comissão:", err)
        setCalculationError("Não foi possível calcular a comissão.")
      } finally {
        setIsCalculating(false)
      }
    }

    calculateCommission()
  }, [freteId, motoristaId, setCommissionValue])

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Registrar Comissão</AlertDialogTitle>
        <AlertDialogDescription>
          <div className="space-y-2">
            {isCalculating ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Calculando comissão...</span>
              </div>
            ) : calculationError ? (
              <div className="text-destructive">
                <p>{calculationError}</p>
              </div>
            ) : calculationData ? (
              <>
                <p>
                  Valor total do frete:{" "}
                  <strong>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(calculationData.valorTotal)}
                  </strong>
                </p>
                <p>
                  Percentual de comissão: <strong>{calculationData.percentual.toFixed(2)}%</strong>
                </p>
                <p>
                  Valor da comissão:{" "}
                  <strong className="text-green-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(calculationData.valorComissao)}
                  </strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Informe o valor da comissão a ser paga para o motorista{" "}
                  <strong>{motoristaName}</strong>.
                </p>
              </>
            ) : null}
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-4">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Valor da comissão"
          value={commissionValue}
          onChange={(e) => setCommissionValue(e.target.value)}
          className="mb-2"
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => onPayment(Number.parseFloat(commissionValue))}
          disabled={isPaying || !commissionValue}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Confirmar Pagamento"
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}

export function FretesTable() {
  const [fretes, setFretes] = useState<Frete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPayingCommission, setIsPayingCommission] = useState(false)
  const [commissionValue, setCommissionValue] = useState<string>("")
  // Adicionar estado para controlar a operação de baixa
  const [dandomBaixa, setDandomBaixa] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  // Adicionar estado para filtro de status
  const [statusFilter, setStatusFilter] = useState<"todos" | "andamento" | "baixados">("todos")

  useEffect(() => {
    fetchFretes()
  }, [])

  async function fetchFretes() {
    try {
      setLoading(true)
      const data = await getAllFrete()
      setFretes(data || [])
    } catch (err: unknown) {
      console.error("Erro ao buscar fretes:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro ao buscar os fretes.")
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      setIsDeleting(true)
      await deleteFrete(id)
      setFretes(fretes.filter((f) => f.id !== id))
      toast({
        title: "Frete excluído",
        description: "O frete foi excluído com sucesso.",
      })
    } catch (err: unknown) {
      console.error("Erro ao excluir frete:", err)
      toast({
        variant: "destructive",
        title: "Erro ao excluir frete",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao excluir o frete.",
      })
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  // Adicionar função para dar baixa no frete
  async function handleDarBaixa(frete: Frete) {
    try {
      setDandomBaixa(frete.id)

      // Atualizar o status do frete
      await darBaixaFrete(frete.id, true)

      // Criar uma entrada financeira com o valor do frete
      if (frete.frete_valor_total) {
        await createEntrada({
          entrada_nome: `Recebimento do frete: ${frete.frete_nome}`,
          entrada_descricao: `Origem: ${frete.frete_origem || "N/A"} - Destino: ${frete.frete_destino || "N/A"}`,
          entrada_valor: frete.frete_valor_total,
          entrada_tipo: "Frete",
          entrada_frete_id: frete.id,
        })
      }

      // Atualizar a lista de fretes
      setFretes(fretes.map((f) => (f.id === frete.id ? { ...f, frete_baixa: true } : f)))

      toast({
        title: "Frete baixado com sucesso",
        description: `O frete ${frete.frete_nome} foi baixado e uma entrada financeira foi criada.`,
      })
    } catch (err) {
      console.error("Erro ao dar baixa no frete:", err)
      toast({
        variant: "destructive",
        title: "Erro ao dar baixa no frete",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao dar baixa no frete.",
      })
    } finally {
      setDandomBaixa(null)
    }
  }

  // Adicionar função para reativar um frete
  async function handleReativarFrete(frete: Frete) {
    try {
      setDandomBaixa(frete.id)

      // Atualizar o status do frete
      await darBaixaFrete(frete.id, false)

      // Atualizar a lista de fretes
      setFretes(fretes.map((f) => (f.id === frete.id ? { ...f, frete_baixa: false } : f)))

      toast({
        title: "Frete reativado com sucesso",
        description: `O frete ${frete.frete_nome} foi reativado.`,
      })
    } catch (err) {
      console.error("Erro ao reativar frete:", err)
      toast({
        variant: "destructive",
        title: "Erro ao reativar frete",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao reativar o frete.",
      })
    } finally {
      setDandomBaixa(null)
    }
  }

  async function handleCommissionPayment(
    freteId: number,
    motoristaId: number,
    motoristaName: string,
    valor: number
  ) {
    try {
      setIsPayingCommission(true)
      // Lógica para registrar o pagamento da comissão
      await createDespesa({
        despesa_nome: `Comissão para ${motoristaName} (Frete ${freteId})`,
        despesa_descricao: `Pagamento de comissão para o motorista ${motoristaName} referente ao frete ${freteId}`,
        despesa_valor: valor,
        despesa_tipo: "Comissão",
        despesa_motorista_id: motoristaId,
        despesa_frete_id: freteId,
      })

      toast({
        title: "Comissão paga com sucesso",
        description: `A comissão de ${new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(valor)} foi paga para ${motoristaName}.`,
      })
    } catch (error) {
      console.error("Erro ao pagar comissão:", error)
      toast({
        variant: "destructive",
        title: "Erro ao pagar comissão",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro ao pagar a comissão.",
      })
    } finally {
      setIsPayingCommission(false)
    }
  }

  // Adicionar função para filtrar fretes por status
  const filteredFretes = fretes.filter((frete) => {
    if (statusFilter === "todos") return true
    if (statusFilter === "andamento") return !frete.frete_baixa
    if (statusFilter === "baixados") return frete.frete_baixa
    return true
  })

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
        <p className="font-medium">Erro ao carregar fretes</p>
        <p>{error}</p>
      </div>
    )
  }

  // Adicionar controles de filtro acima da tabela
  // Adicionar após a div com className="flex items-center justify-between"
  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "todos" ? "default" : "outline"}
          onClick={() => setStatusFilter("todos")}
        >
          Todos os Fretes
        </Button>
        <Button
          variant={statusFilter === "andamento" ? "default" : "outline"}
          onClick={() => setStatusFilter("andamento")}
          className="border-amber-200 text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
        >
          <Clock className="mr-2 h-4 w-4" />
          Em Andamento
        </Button>
        <Button
          variant={statusFilter === "baixados" ? "default" : "outline"}
          onClick={() => setStatusFilter("baixados")}
          className="border-green-200 text-green-700 hover:text-green-800 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Baixados
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Motorista</TableHead>
            <TableHead>Agenciador</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFretes.map((frete) => (
            <TableRow
              key={frete.id}
              className={frete.frete_baixa ? "bg-green-50 dark:bg-green-900/10" : ""}
            >
              <TableCell className="font-medium">{frete.frete_nome}</TableCell>
              <TableCell>{frete.frete_origem}</TableCell>
              <TableCell>{frete.frete_destino}</TableCell>
              <TableCell>{frete.veiculo?.veiculo_nome || "-"}</TableCell>
              <TableCell>{frete.motorista?.motorista_nome || "-"}</TableCell>
              <TableCell>{frete.agenciador?.agenciador_nome || "-"}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(frete.frete_valor_total || 0)}
              </TableCell>
              <TableCell>
                {frete.frete_baixa ? (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Baixado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span>Em andamento</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(frete.created_at), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Replace any with MouseEvent<HTMLElement> */}
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Opção de dar baixa ou reativar */}
                    {!frete.frete_baixa ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Dar Baixa
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar baixa do frete</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja dar baixa neste frete? Isso irá criar uma
                              entrada financeira no valor de{" "}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(frete.frete_valor_total || 0)}
                              .
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDarBaixa(frete)}
                              disabled={dandomBaixa === frete.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {dandomBaixa === frete.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                "Confirmar Baixa"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                            }}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Reativar Frete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reativar frete</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja reativar este frete? Isso não afetará as
                              entradas financeiras já criadas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleReativarFrete(frete)}
                              disabled={dandomBaixa === frete.id}
                            >
                              {dandomBaixa === frete.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                "Confirmar Reativação"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {frete.motorista && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault()
                              }}
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Registrar Comissão
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <CommissionCalculator
                              freteId={frete.id}
                              motoristaId={frete.motorista.id}
                              motoristaName={frete.motorista.motorista_nome}
                              commissionValue={commissionValue}
                              setCommissionValue={setCommissionValue}
                              onPayment={(valor) =>
                                handleCommissionPayment(
                                  frete.id,
                                  frete.motorista.id,
                                  frete.motorista.motorista_nome,
                                  valor
                                )
                              }
                              isPaying={isPayingCommission}
                            />
                          </AlertDialogContent>
                        </AlertDialog>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/cadastros/fretes/${frete.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            setDeletingId(frete.id)
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este frete? Esta ação não pode ser
                            desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => frete.id && handleDelete(frete.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting && deletingId === frete.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Excluindo...
                              </>
                            ) : (
                              "Confirmar"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
