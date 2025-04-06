"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Edit, Loader2, MoreHorizontal, Trash } from "lucide-react"
import { deleteAgenciador, getAllAgenciador } from "@/lib/services/agenciador-service"
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

type Agenciador = {
  id: number
  nome: string
  created_at: string
}

export function AgenciadoresTable() {
  const [agenciadores, setAgenciadores] = useState<Agenciador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchAgenciadores()
  }, [])

  async function fetchAgenciadores() {
    try {
      setLoading(true)
      const data = await getAllAgenciador()
      setAgenciadores(data || [])
    } catch (err: unknown) {
      console.error("Erro ao buscar agenciadores:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro ao buscar os agenciadores.")
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      setIsDeleting(true)
      await deleteAgenciador(id)
      setAgenciadores(agenciadores.filter((a) => a.id !== id))
    } catch (err: unknown) {
      console.error("Erro ao excluir agenciador:", err)
      toast({
        variant: "destructive",
        title: "Erro ao excluir agenciador",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao excluir o agenciador.",
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
        <p className="font-medium">Erro ao carregar agenciadores</p>
        <p>{error}</p>
      </div>
    )
  }

  if (agenciadores.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="text-lg font-medium mb-2">Nenhum agenciador cadastrado</h3>
        <p className="text-muted-foreground mb-4">Cadastre seu primeiro agenciador para começar.</p>
        <Button asChild>
          <Link href="/dashboard/cadastros/agenciadores/novo">Cadastrar Agenciador</Link>
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
            <TableHead>Data de Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agenciadores.map((agenciador) => (
            <TableRow key={agenciador.id}>
              <TableCell className="font-medium">{agenciador.nome}</TableCell>
              <TableCell>
                {format(new Date(agenciador.created_at), "dd/MM/yyyy", {
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
                      <Link href={`/dashboard/cadastros/agenciadores/${agenciador.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            setDeletingId(agenciador.id)
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
                            Tem certeza que deseja excluir este agenciador? Esta ação não pode ser
                            desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingId(null)}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(agenciador.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting && deletingId === agenciador.id ? (
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