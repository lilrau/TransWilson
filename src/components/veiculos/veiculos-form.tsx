"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { createVeiculo } from "@/lib/services/veiculo-service"
import { getAllMotorista } from "@/lib/services/motorista-service"
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
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  veiculo_nome: z.string().min(3, {
    message: "O nome do veículo deve ter pelo menos 3 caracteres.",
  }),
  veiculo_placa: z.string().length(7, {
    message: "A placa deve ter exatamente 7 caracteres.",
  }),
  veiculo_reboque: z.string().nonempty({
    message: "O tipo de reboque é obrigatório.",
  }),
  veiculo_ano: z.coerce.number().min(1900).max(new Date().getFullYear()).nullable().optional(),
  veiculo_km_inicial: z.coerce.number().min(0).nullable().optional(),
  veiculo_litro_inicial: z.coerce.number().min(0).nullable().optional(),
  veiculo_motorista: z.coerce.number().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function VeiculosForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reboqueOptions, setreboqueOptions] = useState<string[]>([
    "Carreta",
    "Bi-trem",
    "Rodotrem",
    "Simples",
  ])
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
    async function fetchMotoristas() {
      try {
        const data = await getAllMotorista()

        // Mapeia os dados retornados pelo serviço
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

    fetchMotoristas()
  }, [])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Preparar os dados para envio
      const veiculoData = {
        ...values,
        veiculo_reboque: selectedReboque,
        veiculo_motorista: values.veiculo_motorista || null,
      }

      // Usar o serviço para criar o veículo
      await createVeiculo(veiculoData)

      toast({
        title: "Veículo cadastrado com sucesso!",
        description: `O veículo ${values.veiculo_nome} foi cadastrado.`,
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

  return (
    <Card>
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
                        value={field.value ?? ""}
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
                        value={field.value ?? ""}
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
                        type="number"
                        step="0.01"
                        placeholder="Litros iniciais no tanque"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Cadastrando..." : "Cadastrar Veículo"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
