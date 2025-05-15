"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { createEntrada, getTipoEntradaEnum } from "@/lib/services/entrada-service"
import { getAllFrete } from "@/lib/services/frete-service"
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
import { useEffect } from "react"

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
  entrada_frete_id: z.number().nullable(),
})

type FormValues = z.infer<typeof formSchema>

export function EntradaForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipoOptions, setTipoOptions] = useState<string[]>([])
  const [isLoadingTipos, setIsLoadingTipos] = useState(true)
  const [fretes, setFretes] = useState<{ id: number; frete_nome: string }[]>([])
  const [isLoadingFretes, setIsLoadingFretes] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entrada_nome: "",
      entrada_valor: 0,
      entrada_descricao: "",
      entrada_tipo: "",
      entrada_frete_id: null,
    },
  })

  useEffect(() => {
    async function fetchTiposEntrada() {
      try {
        setIsLoadingTipos(true)
        const data = await getTipoEntradaEnum()
        if (data && Array.isArray(data)) {
          setTipoOptions(data)
        }
      } catch (err) {
        console.error("Erro ao buscar tipos de entrada:", err)
        toast({
          variant: "destructive",
          title: "Erro ao carregar tipos de entrada",
          description: "Não foi possível carregar os tipos de entrada.",
        })
      } finally {
        setIsLoadingTipos(false)
      }
    }

    fetchTiposEntrada()
  }, [])

  const entradaTipo = form.watch("entrada_tipo");

  async function fetchFretes() {
    if (entradaTipo?.toLowerCase() === "frete") {
      setIsLoadingFretes(true)
      try {
        const data = await getAllFrete().then(fretes => fretes.filter(f => !f.frete_baixa))
        if (data) {
          setFretes(data)
        }
      } catch (err) {
        console.error("Erro ao buscar fretes:", err)
        toast({
          variant: "destructive",
          title: "Erro ao carregar fretes",
          description: "Não foi possível carregar a lista de fretes.",
        })
      } finally {
        setIsLoadingFretes(false)
      }
    } else {
      setFretes([])
    }
  }

  useEffect(() => {
    fetchFretes();
  }, [entradaTipo]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      if (values.entrada_tipo.toLowerCase() === "frete" && !values.entrada_frete_id) {
        setError("Selecione um frete quando o tipo de entrada for 'Frete'.")
        return
      }

      await createEntrada({
        entrada_nome: values.entrada_nome,
        entrada_valor: values.entrada_valor,
        entrada_descricao: values.entrada_descricao || null,
        entrada_tipo: values.entrada_tipo,
        entrada_frete_id:
          values.entrada_tipo.toLowerCase() === "frete" ? values.entrada_frete_id : null,
      })

      toast({
        title: "Entrada registrada com sucesso!",
        description: `A entrada ${values.entrada_nome} foi registrada.`,
      })

      router.push("/dashboard/movimentos/entradas-saidas")
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao registrar entrada:", err)
        setError(err.message || "Ocorreu um erro ao registrar a entrada.")
      } else {
        console.error("Erro desconhecido:", err)
        setError("Ocorreu um erro desconhecido ao registrar a entrada.")
      }
    } finally {
      setIsSubmitting(false)
    }
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
                        {isLoadingTipos ? (
                          <SelectItem value="carregando" disabled>
                            Carregando tipos...
                          </SelectItem>
                        ) : (
                          tipoOptions.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))
                        )}
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

              {form.watch("entrada_tipo")?.toLowerCase() === "frete" && (
                <FormField
                  control={form.control}
                  name="entrada_frete_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frete</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                        value={field.value?.toString() || undefined}
                        disabled={isLoadingFretes}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingFretes ? "Carregando fretes..." : "Selecione o frete"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingFretes ? (
                            <SelectItem value="loading" disabled>
                              Carregando fretes...
                            </SelectItem>
                          ) : fretes.length > 0 ? (
                            fretes.map((frete) => (
                              <SelectItem key={frete.id} value={frete.id.toString()}>
                                {frete.frete_nome}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Nenhum frete disponível
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                    Registrando...
                  </>
                ) : (
                  "Registrar Entrada"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
