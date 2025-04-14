"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { createAgenciador, getAgenciador, updateAgenciador } from "@/lib/services/agenciador-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  agenciador_nome: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres.",
  }),
  agenciador_cnpj: z.string().optional(),
  agenciador_telefone: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AgenciadoresFormProps {
  id?: string
}

export function AgenciadoresForm({ id }: AgenciadoresFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(id ? true : false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agenciador_nome: "",
      agenciador_cnpj: "",
      agenciador_telefone: "",
    },
  })

  useEffect(() => {
    async function fetchAgenciador() {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getAgenciador(Number(id))

        if (data) {
          form.reset({
            agenciador_nome: data.agenciador_nome || "",
            agenciador_cnpj: data.agenciador_cnpj || "",
            agenciador_telefone: data.agenciador_telefone || "",
          })
        } else {
          setError("Agenciador não encontrado.")
        }
      } catch (err: unknown) {
        console.error("Erro ao buscar agenciador:", err)
        if (err instanceof Error) {
          setError(err.message || "Ocorreu um erro ao buscar os dados do agenciador.")
        } else {
          setError("Ocorreu um erro desconhecido.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchAgenciador()
    }
  }, [id, form])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      if (id) {
        await updateAgenciador(Number(id), values)
      } else {
        await createAgenciador(values)
      }

      toast({
        title: id ? "Agenciador atualizado com sucesso!" : "Agenciador cadastrado com sucesso!",
        description: id
          ? `Os dados de ${values.agenciador_nome} foram atualizados.`
          : `O agenciador ${values.agenciador_nome} foi cadastrado.`,
      })

      router.push("/dashboard/cadastros/agenciadores")
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao cadastrar agenciador:", err)
        setError(err.message || "Ocorreu um erro ao cadastrar o agenciador.")
      } else {
        console.error("Erro desconhecido:", err)
        setError("Ocorreu um erro desconhecido ao cadastrar o agenciador.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
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
            <FormField
              control={form.control}
              name="agenciador_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Agenciador</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do agenciador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agenciador_cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="CNPJ do agenciador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agenciador_telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefone do agenciador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/cadastros/agenciadores")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {id ? "Atualizando..." : "Cadastrando..."}
                  </>
                ) : id ? (
                  "Atualizar Agenciador"
                ) : (
                  "Cadastrar Agenciador"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
