"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Edit, Loader2, MoreHorizontal, Trash } from "lucide-react"
import { deleteFrete, getAllFrete } from "@/lib/services/frete-service"
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

export function FretesTable() {
  const [fretes, setFretes] = useState<Frete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    <div className="rounded-md border bg-white">
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
              <TableCell>{frete.veiculo?.veiculo_nome || '-'}</TableCell>
              <TableCell>{frete.motorista?.motorista_nome || '-'}</TableCell>
              <TableCell>{frete.agenciador?.nome || '-'}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
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
                          <AlertDialogCancel onClick={() => setDeletingId(null)}>
                            Cancelar
                          </AlertDialogCancel>
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