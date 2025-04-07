"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Edit, Loader2, MoreHorizontal, Trash } from "lucide-react"

import { deleteVeiculo, getAllVeiculos } from "@/lib/services/veiculo-service"
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

type Veiculo = {
  id: number
  veiculo_nome: string
  veiculo_placa: string
  veiculo_reboque: string
  veiculo_ano: number | null
  veiculo_km_inicial: number | null
  veiculo_litro_inicial: number | null
  veiculo_motorista: number | null
  veiculo_created_at: string
}

export function VeiculosTable() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchVeiculos()
  }, [])

  async function fetchVeiculos() {
    try {
      setLoading(true)
      const data = await getAllVeiculos()

      setVeiculos(data || [])
    } catch (err: unknown) {
      console.error("Erro ao buscar veículos:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro ao buscar os veículos.")
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      setIsDeleting(true)
      await deleteVeiculo(id)

      setVeiculos(veiculos.filter((v) => v.id !== id))
    } catch (err: unknown) {
      console.error("Erro ao excluir veículo:", err)
      toast({
        variant: "destructive",
        title: "Erro ao excluir veículo",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao excluir o veículo.",
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
        <p className="font-medium">Erro ao carregar veículos</p>
        <p>{error}</p>
      </div>
    )
  }

  if (veiculos.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="text-lg font-medium mb-2">Nenhum veículo cadastrado</h3>
        <p className="text-muted-foreground mb-4">Cadastre seu primeiro veículo para começar.</p>
        <Button asChild>
          <Link href="/dashboard/cadastros/veiculos/novo">Cadastrar Veículo</Link>
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
            <TableHead>Placa</TableHead>
            <TableHead className="hidden md:table-cell">Reboque</TableHead>
            <TableHead className="hidden md:table-cell">Ano</TableHead>
            <TableHead className="hidden md:table-cell">KM Inicial</TableHead>
            <TableHead className="hidden md:table-cell">Litros Iniciais</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {veiculos.map((veiculo) => (
            <TableRow key={veiculo.id}>
              <TableCell className="font-medium">{veiculo.veiculo_nome}</TableCell>
              <TableCell>{veiculo.veiculo_placa}</TableCell>
              <TableCell className="hidden md:table-cell">{veiculo.veiculo_reboque}</TableCell>
              <TableCell className="hidden md:table-cell">{veiculo.veiculo_ano || "-"}</TableCell>
              <TableCell className="hidden md:table-cell">{veiculo.veiculo_km_inicial?.toFixed(1) || "-"}</TableCell>
              <TableCell className="hidden md:table-cell">{veiculo.veiculo_litro_inicial?.toFixed(2) || "-"}</TableCell>
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
                      <Link href={`/dashboard/cadastros/veiculos/${veiculo.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            setDeletingId(veiculo.id)
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
                            Tem certeza que deseja excluir o veículo <strong>{veiculo.veiculo_nome}</strong>? Esta ação
                            não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(veiculo.id)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting && deletingId === veiculo.id ? (
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
