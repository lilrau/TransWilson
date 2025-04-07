"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DollarSign, Edit, Loader2, MoreHorizontal, Trash } from "lucide-react"
import { deleteFrete, getAllFrete, getFrete } from "@/lib/services/frete-service"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
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

type Frete = {
  id: number
  frete_nome: string
  frete_origem: string
  frete_destino: string
  frete_valor_total: number
  created_at: string
  veiculo: { id: number; veiculo_nome: string }
  motorista: { id: number; motorista_nome: string }
  agenciador: { id: number; nome: string }
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
                  Informe o valor da comissão a ser paga para o motorista <strong>{motoristaName}</strong>.
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
    }
  }

  async function handleCommissionPayment(freteId: number, motoristaId: number, motoristaName: string, valor: number) {
    try {
      setIsPayingCommission(true)

      await createDespesa({
        despesa_nome: `Comissão - ${motoristaName}`,
        despesa_descricao: `Pagamento de comissão para o motorista ${motoristaName} referente ao frete #${freteId}`,
        despesa_tipo: "Comissão Motorista",
        despesa_valor: valor,
        despesa_veiculo: null,
        despesa_motorista: motoristaId,
      })

      toast({
        title: "Comissão registrada",
        description: `A comissão para ${motoristaName} foi registrada com sucesso.`,
      })
    } catch (err: unknown) {
      console.error("Erro ao registrar comissão:", err)
      toast({
        variant: "destructive",
        title: "Erro ao registrar comissão",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao registrar a comissão.",
      })
    } finally {
      setIsPayingCommission(false)
      setCommissionValue("")
    }
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
        <p className="font-medium">Erro ao carregar fretes</p>
        <p>{error}</p>
      </div>
    )
  }

  if (fretes.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="text-lg font-medium mb-2">Nenhum frete cadastrado</h3>
        <p className="text-muted-foreground mb-4">Cadastre seu primeiro frete para começar.</p>
        <Button asChild>
          <Link href="/dashboard/cadastros/fretes/novo">Cadastrar Frete</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800">
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
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fretes.map((frete) => (
            <TableRow key={frete.id}>
              <TableCell className="font-medium">{frete.frete_nome}</TableCell>
              <TableCell>{frete.frete_origem}</TableCell>
              <TableCell>{frete.frete_destino}</TableCell>
              <TableCell>{frete.veiculo?.veiculo_nome || "-"}</TableCell>
              <TableCell>{frete.motorista?.motorista_nome || "-"}</TableCell>
              <TableCell>{frete.agenciador?.nome || "-"}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(frete.frete_valor_total)}
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
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
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
                                  valor,
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
                            Tem certeza que deseja excluir este frete? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => frete.id && handleDelete(frete.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
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
