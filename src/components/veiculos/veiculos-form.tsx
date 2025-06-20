"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { createVeiculo, getVeiculo, updateVeiculo } from "@/lib/services/veiculo-service"
import { getAllMotorista } from "@/lib/services/motorista-service"
import { getTipoReboqueEnum } from "@/lib/services/enum-service"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  veiculo_nome: z.string().min(3, {
    message: "Informe um nome descritivo para o veículo",
  }),
  veiculo_placa: z.string().length(7, {
    message: "A placa deve conter 7 caracteres (ex: ABC1234)",
  }),
  veiculo_reboque: z.string().nonempty({
    message: "Selecione o tipo de reboque do veículo",
  }),
  veiculo_ano: z.coerce
    .number()
    .min(1900, `O ano tem que ser entre 1900 e ${new Date().getFullYear()}`)
    .max(new Date().getFullYear(), `O ano tem que ser entre 1900 e ${new Date().getFullYear()}`)
    .nullable()
    .optional(),
  veiculo_km_inicial: z.coerce.number().min(0).nullable().optional(),
  veiculo_litro_inicial: z.coerce.number().min(0).nullable().optional(),
  veiculo_motorista: z.coerce.number().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface VeiculosFormProps {
  id?: string
}

function formatCurrencyBRL(value: number | string) {
  const number = typeof value === "string" ? Number(value.replace(/\D/g, "")) / 100 : value
  return number.toLocaleString("pt-BR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function VeiculosForm({ id }: VeiculosFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(id ? true : false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reboqueOptions, setReboqueOptions] = useState<string[]>([])
  const [selectedReboque, setSelectedReboque] = useState<string>("")
  const [motoristas, setMotoristas] = useState<{ id: number; nome: string }[]>([])
  const [selectedMotorista, setSelectedMotorista] = useState<string>("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculo_nome: "",
      veiculo_placa: "",
      veiculo_reboque: "",
      veiculo_ano: null,
      veiculo_km_inicial: null,
      veiculo_litro_inicial: null,
      veiculo_motorista: null,
    },
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch motoristas
        const motoristasData = await getAllMotorista()
        setMotoristas(
          motoristasData?.map((motorista) => ({
            id: motorista.id,
            nome: motorista.motorista_nome,
          })) || []
        )

        // Fetch reboque options
        const reboqueData = await getTipoReboqueEnum()
        setReboqueOptions(reboqueData || [])
      } catch (err) {
        console.error("Erro ao buscar dados:", err)
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados necessários.",
        })
      }
    }

    fetchData()
  }, [])

  // Add useEffect for fetching vehicle data when in edit mode
  useEffect(() => {
    async function fetchVeiculo() {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getVeiculo(Number(id))

        if (data) {
          form.reset({
            veiculo_nome: data.veiculo_nome || "",
            veiculo_placa: data.veiculo_placa || "",
            veiculo_reboque: data.veiculo_reboque || "",
            veiculo_ano: data.veiculo_ano || null,
            veiculo_km_inicial: data.veiculo_km_inicial || null,
            veiculo_litro_inicial: data.veiculo_litro_inicial || null,
            veiculo_motorista: data.veiculo_motorista || null,
          })
          setSelectedReboque(data.veiculo_reboque || "")
          if (data.motorista?.motorista_nome) {
            setSelectedMotorista(data.motorista.motorista_nome)
          }
        } else {
          setError("Veículo não encontrado.")
        }
      } catch (err) {
        console.error("Erro ao buscar veículo:", err)
        if (err instanceof Error) {
          setError(err.message || "Ocorreu um erro ao buscar os dados do veículo.")
        } else {
          setError("Ocorreu um erro desconhecido.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchVeiculo()
    }
  }, [id, form])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      const veiculoData = {
        ...values,
        veiculo_reboque: selectedReboque,
        veiculo_motorista: values.veiculo_motorista || null,
      }

      if (id) {
        // Update mode
        await updateVeiculo(Number(id), veiculoData)
      } else {
        // Create mode
        await createVeiculo(veiculoData)
      }

      toast({
        title: id ? "Veículo atualizado com sucesso!" : "Veículo cadastrado com sucesso!",
        description: id
          ? `Os dados de ${values.veiculo_nome} foram atualizados.`
          : `O veículo ${values.veiculo_nome} foi cadastrado.`,
      })

      router.push("/dashboard/cadastros/veiculos")
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao cadastrar veículo:", err)
        setError(err.message || "Ocorreu um erro ao cadastrar o veículo.")
      } else {
        console.error("Erro desconhecido:", err)
        setError("Ocorreu um erro desconhecido ao cadastrar o veículo.")
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
                name="veiculo_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Veículo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do veículo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="veiculo_placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input placeholder="Placa do veículo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Tipo de Reboque</FormLabel>
                <FormControl>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        {selectedReboque || "Selecione o tipo de reboque"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {reboqueOptions.map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => {
                            setSelectedReboque(option)
                            form.setValue("veiculo_reboque", option)
                          }}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="veiculo_ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ano do veículo"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Motorista</FormLabel>
                <FormControl>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        {selectedMotorista || "Selecione o motorista"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {motoristas.map((motorista) => (
                        <DropdownMenuItem
                          key={motorista.id}
                          onClick={() => {
                            setSelectedMotorista(motorista.nome)
                            form.setValue("veiculo_motorista", motorista.id) // Salva o ID do motorista no formulário
                          }}
                        >
                          {motorista.nome}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="veiculo_km_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Inicial</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="KM inicial do veículo"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="veiculo_litro_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Litros Iniciais</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="0,00"
                        value={formatCurrencyBRL(field.value ?? 0)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          const float = Number(raw) / 100
                          field.onChange(float)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {id ? "Atualizando..." : "Cadastrando..."}
                </>
              ) : id ? (
                "Atualizar Veículo"
              ) : (
                "Cadastrar Veículo"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
