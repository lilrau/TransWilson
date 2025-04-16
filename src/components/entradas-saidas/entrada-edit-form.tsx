"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { getEntrada, updateEntrada, getTipoEntradaEnum } from "@/lib/services/entrada-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  entrada_nome: z.string().min(3, {
    message: "O nome da entrada deve ter pelo menos 3 caracteres.",
  }),
  entrada_valor: z.coerce.number().min(0, {
    message: "O valor deve ser maior ou igual a zero.",
  }),
  entrada_descricao: z.string().optional(),
  entrada_tipo: z.string().min(1, {
    message: "O tipo de entrada é obrigatório.",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface EntradaEditFormProps {
  id: string
}

export function EntradaEditForm({ id }: EntradaEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipoOptions, setTipoOptions] = useState<string[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entrada_nome: "",
      entrada_valor: 0,
      entrada_descricao: "",
      entrada_tipo: "",
    },
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        // Buscar tipos de entrada e dados da entrada em paralelo
        const [tiposData, entradaData] = await Promise.all([
          getTipoEntradaEnum(),
          getEntrada(Number(id)),
        ])

        if (tiposData && Array.isArray(tiposData)) {
          setTipoOptions(tiposData)
        }

        if (entradaData) {
          form.reset({
            entrada_nome: entradaData.entrada_nome,
            entrada_valor: entradaData.entrada_valor,
            entrada_descricao: entradaData.entrada_descricao || "",
            entrada_tipo: entradaData.entrada_tipo || "",
          })
        } else {
          setError("Entrada não encontrada.")
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err)
        setError("Ocorreu um erro ao carregar os dados da entrada.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, form])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      await updateEntrada(Number(id), {
        entrada_nome: values.entrada_nome,
        entrada_valor: values.entrada_valor,
        entrada_descricao: values.entrada_descricao || null,
        entrada_tipo: values.entrada_tipo,
      })

      toast({
        title: "Entrada atualizada com sucesso!",
        description: `A entrada ${values.entrada_nome} foi atualizada.`,
      })

      router.push("/dashboard/movimentos/entradas-saidas")
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao atualizar entrada:", err)
        setError(err.message || "Ocorreu um erro ao atualizar a entrada.")
      } else {
        console.error("Erro desconhecido:", err)
        setError("Ocorreu um erro desconhecido ao atualizar a entrada.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="entrada_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Entrada</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da entrada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entrada_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Entrada</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de entrada" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipoOptions.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entrada_valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value === 0 ? "" : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entrada_descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição detalhada da entrada"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/movimentos/entradas-saidas")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
