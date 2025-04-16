"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { createDespesa, getDespesa, updateDespesa } from "@/lib/services/despesa-service"
import { getAllVeiculos } from "@/lib/services/veiculo-service"
import { getAllMotorista } from "@/lib/services/motorista-service"
import { getTipoDespesaEnum } from "@/lib/services/enum-service"
import { getSessionData } from "@/lib/auth"
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
import { toast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  despesa_nome: z.string().min(3, {
    message: "O nome da despesa deve ter pelo menos 3 caracteres.",
  }),
  despesa_descricao: z.string().optional(),
  despesa_tipo: z.string().min(1, {
    message: "O tipo de despesa é obrigatório.",
  }),
  despesa_valor: z.coerce.number().min(0, {
    message: "O valor deve ser maior ou igual a zero.",
  }),
  despesa_veiculo: z.coerce.number().nullable().optional(),
  despesa_motorista: z.coerce.number().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface DespesasFormProps {
  id?: string
}

export function DespesasForm({ id }: DespesasFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(id ? true : false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipoOptions, setTipoOptions] = useState<string[]>([])
  const [veiculos, setVeiculos] = useState<
    { id: number; nome: string; motorista?: { id: number; nome: string } }[]
  >([])
  const [motoristas, setMotoristas] = useState<{ id: number; nome: string }[]>([])
  const [userType, setUserType] = useState<string>("") 
  const [userId, setUserId] = useState<number | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      despesa_nome: "",
      despesa_descricao: "",
      despesa_tipo: "",
      despesa_valor: 0,
      despesa_veiculo: null,
      despesa_motorista: null,
    },
  })

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

  useEffect(() => {
    async function fetchVeiculos() {
      try {
        const data = await getAllVeiculos()

        setVeiculos(
          data?.map((veiculo) => ({
            id: veiculo.id,
            nome: veiculo.veiculo_nome,
            motorista: veiculo.motorista
              ? {
                  id: veiculo.motorista.id,
                  nome: veiculo.motorista.motorista_nome,
                }
              : undefined,
          })) || []
        )
      } catch (err) {
        console.error("Erro ao buscar veículos:", err)
        toast({
          variant: "destructive",
          title: "Erro ao carregar veículos",
          description: "Não foi possível carregar a lista de veículos.",
        })
      }
    }

    async function fetchMotoristas() {
      try {
        const data = await getAllMotorista()

        setMotoristas(
          data?.map((motorista) => ({
            id: motorista.id,
            nome: motorista.motorista_nome,
          })) || []
        )
      } catch (err) {
        console.error("Erro ao buscar motoristas:", err)
        toast({
          variant: "destructive",
          title: "Erro ao carregar motoristas",
          description: "Não foi possível carregar a lista de motoristas.",
        })
      }
    }

    async function fetchTiposDespesa() {
      try {
        const data = await getTipoDespesaEnum()
        if (data && Array.isArray(data)) {
          setTipoOptions(data)
        }
      } catch (err) {
        console.error("Erro ao buscar tipos de despesa:", err)
        toast({
          variant: "destructive",
          title: "Erro ao carregar tipos de despesa",
          description: "Não foi possível carregar os tipos de despesa.",
        })
      }
    }

    fetchVeiculos()
    fetchMotoristas()
    fetchTiposDespesa()
  }, [])

  // Fetch despesa data when in edit mode
  useEffect(() => {
    async function fetchDespesa() {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getDespesa(Number(id))

        if (data) {
          form.reset({
            despesa_nome: data.despesa_nome || "",
            despesa_descricao: data.despesa_descricao || "",
            despesa_tipo: data.despesa_tipo || null,
            despesa_valor: data.despesa_valor || null,
            despesa_veiculo: data.despesa_veiculo || null,
            despesa_motorista: data.despesa_motorista || null,
          })
        } else {
          setError("Despesa não encontrada.")
        }
      } catch (err) {
        console.error("Erro ao buscar despesa:", err)
        if (err instanceof Error) {
          setError(err.message || "Ocorreu um erro ao buscar os dados da despesa.")
        } else {
          setError("Ocorreu um erro desconhecido.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchDespesa()
    }
  }, [id, form])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Se não for admin, força o motorista atual
      const motorista = userType !== "admin" && userId !== null ? userId : values.despesa_motorista ?? null
      
      const despesaData = {
        despesa_nome: values.despesa_nome,
        despesa_descricao: values.despesa_descricao ?? null,
        despesa_tipo: values.despesa_tipo,
        despesa_valor: values.despesa_valor,
        despesa_veiculo: values.despesa_veiculo ?? null,
        despesa_motorista: motorista,
      }

      if (id) {
        // Modo de edição
        await updateDespesa(Number(id), despesaData)
        toast({
          title: "Despesa atualizada",
          description: "A despesa foi atualizada com sucesso.",
        })
      } else {
        // Modo de criação
        await createDespesa(despesaData)
        toast({
          title: "Despesa criada",
          description: "A despesa foi criada com sucesso.",
        })
      }

      // Redirecionar para a lista de despesas
      router.push("/dashboard/cadastros/despesas")
      router.refresh()
    } catch (err) {
      console.error("Erro ao salvar despesa:", err)
      if (err instanceof Error) {
        setError(err.message || "Ocorreu um erro ao salvar a despesa.")
      } else {
        setError("Ocorreu um erro desconhecido.")
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

  if (error && !isSubmitting) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="despesa_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Despesa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da despesa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="despesa_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Despesa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de despesa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipoOptions.length > 0 ? (
                          tipoOptions.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="carregando" disabled>
                            Carregando tipos...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="despesa_valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value === null ? "" : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="despesa_descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descrição da despesa"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="despesa_veiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const newValue = value === "none" ? null : Number.parseInt(value)
                        field.onChange(newValue)

                        // Seleciona automaticamente o motorista associado ao veículo
                        if (newValue !== null) {
                          const selectedVehicle = veiculos.find((v) => v.id === newValue)
                          if (selectedVehicle?.motorista?.id) {
                            form.setValue("despesa_motorista", selectedVehicle.motorista.id)
                          } else {
                            form.setValue("despesa_motorista", null)
                          }
                        } else {
                          form.setValue("despesa_motorista", null)
                        }
                      }}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {veiculos.map((veiculo) => (
                          <SelectItem key={veiculo.id} value={veiculo.id.toString()}>
                            {veiculo.nome}
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
                name="despesa_motorista"
                render={({ field }) => {
                  // Se não for admin e tiver userId, força o motorista atual
                  useEffect(() => {
                    if (userType !== "admin" && userId !== null) {
                      field.onChange(userId)
                    }
                  }, [userType, userId, field])
                  
                  return (
                    <FormItem>
                      <FormLabel>Motorista</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : Number.parseInt(value))}
                        value={field.value?.toString() || "none"}
                        disabled={userType !== "admin" && userId !== null}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um motorista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {motoristas.map((motorista) => (
                            <SelectItem key={motorista.id} value={motorista.id.toString()}>
                              {motorista.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/cadastros/despesas")}
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
                ) : id ? (
                  "Atualizar Despesa"
                ) : (
                  "Criar Despesa"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
