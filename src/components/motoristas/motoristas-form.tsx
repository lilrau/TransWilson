"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"

import { createMotorista, getMotorista, updateMotorista } from "@/lib/services/motorista-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { tryCatch } from "@/lib/try-catch"

const formSchema = z.object({
  motorista_nome: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres.",
  }),
  motorista_cpf: z.string().length(11, {
    message: "O CPF deve ter 11 dígitos.",
  }),
  motorista_salario: z.coerce.number().min(0, {
    message: "O salário não pode ser negativo.",
  }),
  motorista_frete: z.coerce.number().min(0).max(100, {
    message: "A porcentagem deve estar entre 0 e 100.",
  }),
  motorista_estadia: z.coerce.number().min(0).max(100, {
    message: "A porcentagem deve estar entre 0 e 100.",
  }),
  motorista_admissao: z.date({
    required_error: "A data de admissão é obrigatória.",
  }),
  motorista_senha: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface MotoristasFormProps {
  id?: string
}

export function MotoristasForm({ id }: MotoristasFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(id ? true : false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para permitir apenas entrada numérica
  const handleNumericInput = (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    // Remove qualquer caractere que não seja número ou ponto decimal
    const value = e.target.value.replace(/[^0-9.]/g, "")

    // Garante que não haja mais de um ponto decimal
    const parts = value.split(".")
    const sanitizedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : value

    // Atualiza o valor do campo
    onChange(sanitizedValue)
  }

  // Função para permitir apenas entrada de dígitos (sem pontos decimais)
  const handleDigitsOnly = (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    // Remove qualquer caractere que não seja número
    const value = e.target.value.replace(/[^0-9]/g, "")

    // Atualiza o valor do campo
    onChange(value)
  }
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motorista_nome: "",
      motorista_cpf: "",
      motorista_salario: 0,
      motorista_frete: 0,
      motorista_estadia: 0,
      motorista_admissao: new Date(),
      motorista_senha: "",
    },
  })

  // Buscar dados do motorista se estiver em modo de edição
  useEffect(() => {
    async function fetchMotorista() {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await tryCatch(getMotorista(Number(id)))
        if (error) throw error

        if (data) {
          // Converter a string de data para objeto Date
          const admissaoDate = data.motorista_admissao
            ? new Date(data.motorista_admissao)
            : new Date()

          form.reset({
            motorista_nome: data.motorista_nome || "",
            motorista_cpf: data.motorista_cpf || "",
            motorista_salario: data.motorista_salario || 0,
            motorista_frete: data.motorista_frete || 0,
            motorista_estadia: data.motorista_estadia || 0,
            motorista_admissao: admissaoDate,
          })
        } else {
          setError("Motorista não encontrado.")
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Erro ao buscar motorista:", err)
          setError("Ocorreu um erro ao buscar os dados do motorista.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchMotorista()
    }
  }, [id, form])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      if (id) {
        // Modo de edição
        await tryCatch(updateMotorista(Number(id), values))
      } else {
        // Modo de criação
        await createMotorista(values)
      }

      toast({
        title: id ? "Motorista atualizado com sucesso!" : "Motorista cadastrado com sucesso!",
        description: id
          ? `Os dados de ${values.motorista_nome} foram atualizados.`
          : `O motorista ${values.motorista_nome} foi cadastrado.`,
      })

      router.push("/dashboard/cadastros/motoristas")
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao cadastrar motorista:", err)
        setError("Ocorreu um erro ao cadastrar o motorista.")
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="motorista_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Motorista</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_cpf"
                render={({ field }) => {
                  const { error } = form.getFieldState("motorista_cpf", form.formState)
                  return (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Número do CPF"
                          maxLength={11}
                          inputMode="numeric"
                          {...field}
                          onChange={(e) => handleDigitsOnly(e, field.onChange)}
                        />
                      </FormControl>
                      {error ? (
                        <FormMessage />
                      ) : (
                        <FormDescription>
                          Número do CPF (11 dígitos)
                        </FormDescription>
                      )}
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="motorista_salario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => handleNumericInput(e, field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_frete"
                render={({ field }) => {
                  const { error } = form.getFieldState("motorista_frete", form.formState)
                  return (
                    <FormItem>
                      <FormLabel>Porcentagem do Frete (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => handleNumericInput(e, field.onChange)}
                        />
                      </FormControl>
                      {error ? (
                        <FormMessage />
                      ) : (
                        <FormDescription>
                          Percentual que o motorista recebe sobre o valor do frete
                        </FormDescription>
                      )}
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="motorista_estadia"
                render={({ field }) => {
                  const { error } = form.getFieldState("motorista_estadia", form.formState)
                  return (
                    <FormItem>
                      <FormLabel>Porcentagem da Estadia (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => handleNumericInput(e, field.onChange)}
                        />
                      </FormControl>
                      {error ? (
                        <FormMessage />
                      ) : (
                        <FormDescription>
                          Percentual que o motorista recebe sobre o valor da estadia
                        </FormDescription>
                      )}
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="motorista_senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite uma senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_admissao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Admissão</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/cadastros/motoristas")}
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
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
