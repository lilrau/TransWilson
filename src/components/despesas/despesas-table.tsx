"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Edit, Loader2, MoreHorizontal, Trash } from "lucide-react"

import { deleteDespesa, getAllDespesa } from "@/lib/services/despesa-service"
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

type Despesa = {
  id: number
  despesa_nome: string
  despesa_descricao: string | null
  despesa_tipo: string | null
  despesa_valor: number | null
  despesa_veiculo: number | null
  despesa_motorista: number | null
  created_at: string
  veiculo: { id: number; veiculo_nome: string } | null
  motorista: { id: number; motorista_nome: string } | null
}

export function DespesasTable() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchDespesas()
  }, [])

  async function fetchDespesas() {
    try {
      setLoading(true)
      const data = await getAllDespesa()

      setDespesas(data || [])
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
  }

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

  if (despesas.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="text-lg font-medium mb-2">Nenhuma despesa cadastrada</h3>
        <p className="text-muted-foreground mb-4">Cadastre sua primeira despesa para começar.</p>
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

  // Formatar valor para exibição em reais
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
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
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {despesas.map((despesa) => (
            <TableRow key={despesa.id}>
              <TableCell className="font-medium">{despesa.despesa_nome}</TableCell>
              <TableCell>{despesa.despesa_tipo || "-"}</TableCell>
              <TableCell>{formatCurrency(despesa.despesa_valor)}</TableCell>
              <TableCell className="hidden md:table-cell">{despesa.veiculo?.veiculo_nome || "-"}</TableCell>
              <TableCell className="hidden md:table-cell">{despesa.motorista?.motorista_nome || "-"}</TableCell>
              <TableCell className="hidden md:table-cell">
                {new Date(despesa.created_at).toLocaleDateString("pt-BR")}
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
                        Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction disabled={isDeleting} onClick={() => despesa.id && handleDelete(despesa.id)}>
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
}
