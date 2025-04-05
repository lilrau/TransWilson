"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Edit, Loader2, MoreHorizontal, Trash } from "lucide-react"
import { deleteMotorista, getAllMotorista } from "@/lib/services/motorista-service"
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

type Motorista = {
  id: number
  motorista_nome: string
  motorista_cnh: string
  motorista_salario: number
  motorista_frete: number
  motorista_estadia: number
  motorista_admissao: string
  motorista_ult_acesso: string | null
  motorista_created_at: string
}

export function MotoristasTable() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchMotoristas()
  }, [])

  async function fetchMotoristas() {
    try {
      setLoading(true)
      const data = await getAllMotorista()

      if (error) throw error

      setMotoristas(data || [])
    } catch (err: unknown) {
      console.error("Erro ao buscar motoristas:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro ao buscar os motoristas.")
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      setIsDeleting(true)
      await deleteMotorista(id)

      setMotoristas(motoristas.filter((m) => m.id !== id))
    } catch (err: unknown) {
      console.error("Erro ao excluir motorista:", err)
      toast({
        variant: "destructive",
        title: "Erro ao excluir motorista",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao excluir o motorista.",
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
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNH</TableHead>
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
              <TableCell>{motorista.motorista_cnh}</TableCell>
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
