"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Edit, Loader2, MoreHorizontal, Trash, FileText, FileX } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"

import { deleteDespesa, getAllDespesa } from "@/lib/services/despesa-service"
import { getSessionData } from "@/lib/auth"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Despesa = {
  id: number
  despesa_nome: string
  despesa_descricao: string | null
  despesa_tipo: string | null
  despesa_valor: number | null
  despesa_veiculo: number | null
  despesa_motorista: number | null
  created_at: string
  comprovante_url: string | null
  veiculo: { id: number; veiculo_nome: string } | null
  motorista: { id: number; motorista_nome: string } | null
}

export function DespesasTable() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [userType, setUserType] = useState<string>("")
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchSession() {
      const session = await getSessionData()
      if (session) {
        setUserType(session.userType)
        setUserId(session.id)
      }
    }
    fetchSession()
  }, [])

  const fetchDespesas = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllDespesa()

      // Filtrar despesas pelo mês selecionado
      const startDate = startOfMonth(selectedMonth)
      const endDate = endOfMonth(selectedMonth)

      let filteredData = (data || []).filter((despesa) => {
        const despesaDate = new Date(despesa.created_at)
        return despesaDate >= startDate && despesaDate <= endDate
      })

      // Se não for admin, filtra pelo motorista vinculado ao usuário logado
      if (userType !== "admin" && userId !== null) {
        filteredData = filteredData.filter((despesa) => despesa.despesa_motorista === userId)
      }

      setDespesas(filteredData)
    } catch (err: unknown) {
      console.error("Erro ao buscar despesas:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro ao buscar as despesas.")
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, userType, userId])

  useEffect(() => {
    if (userType) {
      fetchDespesas()
    }
  }, [fetchDespesas, userType])

  async function handleDelete(id: number) {
    try {
      setIsDeleting(true)
      await deleteDespesa(id)

      setDespesas(despesas.filter((d) => d.id !== id))
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
      })
    } catch (err: unknown) {
      console.error("Erro ao excluir despesa:", err)
      toast({
        variant: "destructive",
        title: "Erro ao excluir despesa",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao excluir a despesa.",
      })
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
        <p className="font-medium">Erro ao carregar despesas</p>
        <p>{error}</p>
      </div>
    )
  }

  // Formatar valor para exibição em reais
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
          Mês Anterior
        </Button>
        <div className="font-medium">{format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}</div>
        <Button
          variant="outline"
          onClick={() => setSelectedMonth(new Date())}
          disabled={format(selectedMonth, "MM/yyyy") === format(new Date(), "MM/yyyy")}
        >
          Mês Atual
        </Button>
      </div>

      {(() => {
        if (despesas.length === 0) {
          return (
            <div className="bg-muted p-8 rounded-md text-center">
              <h3 className="text-lg font-medium mb-2">Nenhuma despesa cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Cadastre sua primeira despesa para começar.
              </p>
              <Button asChild>
                <Link
                  href={`${window.location.pathname.includes("/movimentos/") ? "/dashboard/movimentos/despesas/novo" : "/dashboard/cadastros/despesas/novo"}`}
                >
                  Cadastrar Despesa
                </Link>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Veículo</TableHead>
                  <TableHead className="hidden md:table-cell">Motorista</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesas.map((despesa) => (
                  <TableRow key={despesa.id}>
                    <TableCell className="font-medium">{despesa.despesa_nome}</TableCell>
                    <TableCell>{despesa.despesa_tipo || "-"}</TableCell>
                    <TableCell>{formatCurrency(despesa.despesa_valor)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {despesa.veiculo?.veiculo_nome || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {despesa.motorista?.motorista_nome || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(despesa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-center">
                      {despesa.comprovante_url ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Ver comprovante</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-4xl">
                            <DialogHeader>
                              <DialogTitle className="text-base sm:text-lg">Comprovante - {despesa.despesa_nome}</DialogTitle>
                              <DialogDescription className="text-xs sm:text-sm">
                                Comprovante da despesa de {format(new Date(despesa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              {despesa.comprovante_url.endsWith('.pdf') ? (
                                <iframe
                                  src={despesa.comprovante_url}
                                  className="w-full h-[50vh] sm:h-[600px] border-0"
                                  title="Comprovante PDF"
                                />
                              ) : (
                                <div className="relative w-full h-[50vh] sm:h-[600px]">
                                  <Image
                                    src={despesa.comprovante_url}
                                    alt="Comprovante"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Button asChild size="sm" className="w-full sm:w-auto">
                                <a
                                  href={despesa.comprovante_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Abrir em nova aba
                                </a>
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled>
                          <FileX className="h-4 w-4" />
                          <span className="sr-only">Sem comprovante</span>
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link
                                href={`${window.location.pathname.includes("/movimentos/") ? "/dashboard/movimentos/despesas/" : "/dashboard/cadastros/despesas/"}${despesa.id}`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setDeletingId(despesa.id)
                                }}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser
                              desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={isDeleting}
                              onClick={() => despesa.id && handleDelete(despesa.id)}
                            >
                              {isDeleting && deletingId === despesa.id ? (
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      })()}
    </div>
  )
}
