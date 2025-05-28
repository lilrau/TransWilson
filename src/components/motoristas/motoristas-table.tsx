"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DollarSign, Edit, Loader2, MoreHorizontal, Trash } from "lucide-react"
import { deleteMotorista, getAllMotorista } from "@/lib/services/motorista-service"
import {
  createDespesa,
  getDespesasByMotorista,
  type DespesaMotoristaResumo,
} from "@/lib/services/despesa-service"
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
import { tryCatch } from "@/lib/try-catch"

interface MotoristaData {
  id: number
  motorista_nome: string
  motorista_cpf: string
  motorista_salario: number
  motorista_frete: number
  motorista_estadia: number
  motorista_admissao: string | Date | null
}

// Add the formatCPF function
const formatCPF = (cpf: string) => {
  // Remove any non-digit characters
  const cleaned = cpf.replace(/\D/g, "")
  // Format as XXX.XXX.XXX-XX
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function MotoristasTable() {
  const [motoristas, setMotoristas] = useState<MotoristaData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [paymentValue, setPaymentValue] = useState<string>("")
  const [despesasMotorista, setDespesasMotorista] = useState<DespesaMotoristaResumo | null>(null)
  const [loadingDespesas, setLoadingDespesas] = useState(false)
  const [, setSelectedMotoristaId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchMotoristas() {
      try {
        setLoading(true)
        const { data, error } = await tryCatch(getAllMotorista())

        if (error) throw error

        setMotoristas(data || [])
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Erro ao buscar motoristas:", err)
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMotoristas()
  }, [error])

  async function handlePayment(id: number, nome: string, valor: number) {
    try {
      setIsPaying(true)

      // Criar uma nova despesa para o pagamento do motorista
      await createDespesa({
        despesa_nome: `Pagamento - ${nome}`,
        despesa_descricao: `Pagamento de salário para o motorista ${nome}`,
        despesa_tipo: "Salários",
        despesa_valor: valor,
        despesa_veiculo: null,
        despesa_motorista: id,
      })

      toast({
        title: "Pagamento registrado",
        description: `O pagamento para ${nome} foi registrado com sucesso.`,
      })
    } catch (err: unknown) {
      console.error("Erro ao registrar pagamento:", err)
      toast({
        variant: "destructive",
        title: "Erro ao registrar pagamento",
        description:
          err instanceof Error ? err.message : "Ocorreu um erro ao registrar o pagamento.",
      })
    } finally {
      setIsPaying(false)
      setPaymentValue("")
    }
  }

  async function handleDelete(id: number) {
    try {
      setIsDeleting(true)
      const { error } = await tryCatch(deleteMotorista(id))
      if (error) throw error

      setMotoristas(motoristas.filter((m) => m.id !== id))
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao excluir motorista:", err.message)
        toast({
          variant: "destructive",
          title: "Erro ao excluir motorista",
          description: err.message,
        })
      }
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
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
        <p className="font-medium">Erro ao carregar motoristas</p>
        <p>{error}</p>
      </div>
    )
  }

  if (motoristas.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="text-lg font-medium mb-2">Nenhum motorista cadastrado</h3>
        <p className="text-muted-foreground mb-4">Cadastre seu primeiro motorista para começar.</p>
        <Button asChild>
          <Link href="/dashboard/cadastros/motoristas/novo">Cadastrar Motorista</Link>
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
            <TableHead>CPF</TableHead>
            <TableHead className="hidden md:table-cell">Salário</TableHead>
            <TableHead className="hidden md:table-cell">% Frete</TableHead>
            <TableHead className="hidden md:table-cell">% Estadia</TableHead>
            <TableHead className="hidden md:table-cell">Admissão</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {motoristas.map((motorista) => (
            <TableRow key={motorista.id}>
              <TableCell className="font-medium">{motorista.motorista_nome}</TableCell>
              <TableCell>{formatCPF(motorista.motorista_cpf)}</TableCell>
              <TableCell className="hidden md:table-cell">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(motorista.motorista_salario)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {motorista.motorista_frete.toFixed(2)}%
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {motorista.motorista_estadia.toFixed(2)}%
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {motorista.motorista_admissao
                  ? format(new Date(motorista.motorista_admissao), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "-"}
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
                    <AlertDialog
                      onOpenChange={(open) => {
                        if (open) {
                          // Define o valor padrão como o salário do motorista quando o modal é aberto
                          setPaymentValue(motorista.motorista_salario.toString())
                          setSelectedMotoristaId(motorista.id)

                          // Buscar despesas do motorista
                          const fetchDespesasMotorista = async () => {
                            try {
                              setLoadingDespesas(true)
                              const data = await getDespesasByMotorista(motorista.id)
                              setDespesasMotorista(data)
                            } catch (err) {
                              console.error("Erro ao buscar despesas do motorista:", err)
                              toast({
                                variant: "destructive",
                                title: "Erro ao buscar despesas",
                                description: "Não foi possível carregar o histórico de pagamentos.",
                              })
                            } finally {
                              setLoadingDespesas(false)
                            }
                          }

                          fetchDespesasMotorista()
                        } else {
                          setDespesasMotorista(null)
                          setSelectedMotoristaId(null)
                        }
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                          }}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Registrar Pagamento
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Registrar Pagamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            {loadingDespesas ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Carregando histórico de pagamentos...</span>
                              </div>
                            ) : despesasMotorista ? (
                              <div className="space-y-2">
                                <p>
                                  Salário mensal:{" "}
                                  <strong>
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(motorista.motorista_salario)}
                                  </strong>
                                </p>
                                <p>
                                  Total já pago:{" "}
                                  <strong>
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(despesasMotorista.totalPago)}
                                  </strong>
                                </p>
                                <p>
                                  {despesasMotorista.totalPago >= motorista.motorista_salario ? (
                                    <span className="text-green-600 font-medium">
                                      Salário já foi pago integralmente.
                                    </span>
                                  ) : (
                                    <>
                                      Falta pagar:{" "}
                                      <strong className="text-amber-600">
                                        {new Intl.NumberFormat("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                        }).format(
                                          motorista.motorista_salario - despesasMotorista.totalPago
                                        )}
                                      </strong>
                                    </>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Informe o valor a ser pago para o motorista{" "}
                                  <strong>{motorista.motorista_nome}</strong>.
                                </p>
                              </div>
                            ) : (
                              <p>
                                Informe o valor a ser pago para o motorista{" "}
                                <strong>{motorista.motorista_nome}</strong>.
                              </p>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Valor do pagamento"
                            value={paymentValue}
                            onChange={(e) => setPaymentValue(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handlePayment(
                                motorista.id,
                                motorista.motorista_nome,
                                Number.parseFloat(paymentValue)
                              )
                            }
                            disabled={isPaying || !paymentValue}
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
                      </AlertDialogContent>
                    </AlertDialog>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/cadastros/motoristas/${motorista.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            setDeletingId(motorista.id)
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
                            Tem certeza que deseja excluir o motorista{" "}
                            <strong>{motorista.motorista_nome}</strong>? Esta ação não pode ser
                            desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(motorista.id)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting && deletingId === motorista.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Excluindo...
                              </>
                            ) : (
                              "Sim, excluir"
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
