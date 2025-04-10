"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Plus, Trash } from "lucide-react"

import { createFrete, getFrete, updateFrete } from "@/lib/services/frete-service"
import { getAllVeiculos } from "@/lib/services/veiculo-service"
import { getAllAgenciador } from "@/lib/services/agenciador-service"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
    frete_nome: z.string().min(3, {
      message: "O nome do frete deve ter pelo menos 3 caracteres.",
    }),
    frete_veiculo: z.coerce.number({
      required_error: "Por favor, selecione um veículo",
      invalid_type_error: "Selecione um veículo válido",
    }).min(1, "Por favor, selecione um veículo"),
    frete_agenciador: z.coerce.number({
      required_error: "Por favor, selecione um agenciador",
      invalid_type_error: "Selecione um agenciador válido",
    }).min(1, "Por favor, selecione um agenciador"),
    frete_motorista: z.coerce.number({
      required_error: "Por favor, selecione um motorista",
      invalid_type_error: "Selecione um motorista válido",
    }).min(1, "Por favor, selecione um motorista"),
    frete_origem: z.string().min(3, {
      message: "A origem deve ter pelo menos 3 caracteres.",
    }),
    frete_destino: z.string().min(3, {
      message: "O destino deve ter pelo menos 3 caracteres.",
    }),
    frete_distancia: z.coerce.number().min(0).nullable(),
    frete_peso: z.array(z.coerce.number().min(0)),
    frete_valor_tonelada: z.coerce.number().min(0),
  })  

type FormValues = z.infer<typeof formSchema>

interface FretesFormProps {
  id?: string
}

export function FretesForm({ id }: FretesFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(id ? true : false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [veiculos, setVeiculos] = useState<{ id: number; nome: string; motorista?: { id: number } }[]>([])
  const [agenciadores, setAgenciadores] = useState<{ id: number; nome: string }[]>([])
  const [motoristas, setMotoristas] = useState<{ id: number; nome: string }[]>([])
  const [weights, setWeights] = useState<string[]>([''])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frete_nome: "",
      frete_veiculo: undefined,
      frete_agenciador: undefined,
      frete_motorista: undefined,
      frete_origem: "",
      frete_destino: "",
      frete_distancia: null,
      frete_peso: [0],
      frete_valor_tonelada: 0,
    },
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [veiculosData, agenciadoresData, motoristasData] = await Promise.all([
          getAllVeiculos(),
          getAllAgenciador(),
          getAllMotorista()
        ])

        setVeiculos(veiculosData?.map(v => ({ id: v.id, nome: v.veiculo_nome, motorista: v.motorista })) || [])
        setAgenciadores(agenciadoresData?.map(a => ({ id: a.id, nome: a.nome })) || [])
        setMotoristas(motoristasData?.map(m => ({ id: m.id, nome: m.motorista_nome })) || [])

        if (id) {
          const freteData = await getFrete(Number(id))
          if (freteData) {
            setWeights(freteData.frete_peso.map(String))
            form.reset({
              frete_nome: freteData.frete_nome || "",
              frete_veiculo: freteData.frete_veiculo,
              frete_agenciador: freteData.frete_agenciador,
              frete_motorista: freteData.frete_motorista,
              frete_origem: freteData.frete_origem || "",
              frete_destino: freteData.frete_destino || "",
              frete_distancia: freteData.frete_distancia,
              frete_peso: freteData.frete_peso,
              frete_valor_tonelada: freteData.frete_valor_tonelada || 0,
            })
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar todos os dados necessários.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, form])

  const addWeight = () => {
    setWeights([...weights, ''])
    form.setValue('frete_peso', [...form.getValues('frete_peso'), 0])
  }

  const removeWeight = (index: number) => {
    const newWeights = weights.filter((_, i) => i !== index)
    setWeights(newWeights)
    form.setValue('frete_peso', form.getValues('frete_peso').filter((_, i) => i !== index))
  }

  const handleWeightChange = (value: string, index: number) => {
    const newWeights = [...weights]
    newWeights[index] = value
    setWeights(newWeights)
    
    const numericValue = parseFloat(value) || 0
    const currentWeights = form.getValues('frete_peso')
    currentWeights[index] = numericValue
    form.setValue('frete_peso', currentWeights)
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      if (id) {
        await updateFrete(Number(id), values)
      } else {
        await createFrete({
        ...values,
        frete_valor_total: values.frete_peso.reduce((acc, peso) => acc + peso, 0) * values.frete_valor_tonelada
        })
      }

      toast({
        title: id ? "Frete atualizado com sucesso!" : "Frete cadastrado com sucesso!",
        description: id
          ? `Os dados do frete ${values.frete_nome} foram atualizados.`
          : `O frete ${values.frete_nome} foi cadastrado.`,
      })

      router.push("/dashboard/cadastros/fretes")
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao cadastrar frete:", err)
        setError(err.message || "Ocorreu um erro ao cadastrar o frete.")
      } else {
        console.error("Erro desconhecido:", err)
        setError("Ocorreu um erro desconhecido ao cadastrar o frete.")
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
                name="frete_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Frete</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do frete" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frete_veiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(Number(value))
                        const selectedVehicle = veiculos.find(v => v.id === Number(value))
                        if (selectedVehicle?.motorista?.id) {
                          form.setValue('frete_motorista', selectedVehicle.motorista.id)
                        }
                      }}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veiculos.map((veiculo) => (
                          <SelectItem key={veiculo.id} value={veiculo.id.toString()}>
                            {veiculo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.frete_veiculo?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frete_agenciador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agenciador</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um agenciador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agenciadores.map((agenciador) => (
                          <SelectItem key={agenciador.id} value={agenciador.id.toString()}>
                            {agenciador.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.frete_agenciador?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frete_motorista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id.toString()}>
                            {motorista.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.frete_motorista?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frete_origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <FormControl>
                      <Input placeholder="Local de origem" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frete_destino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <FormControl>
                      <Input placeholder="Local de destino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frete_distancia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distância (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Distância em quilômetros"
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
                name="frete_valor_tonelada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor por Tonelada (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor por tonelada"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Pesos (toneladas)</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addWeight}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Peso
                </Button>
              </div>
              
              {weights.map((weight, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Peso em toneladas"
                    value={weight}
                    onChange={(e) => handleWeightChange(e.target.value, index)}
                  />
                  {weights.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeWeight(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/cadastros/fretes")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {id ? "Atualizando..." : "Cadastrando..."}
                  </>
                ) : (
                  id ? "Atualizar Frete" : "Cadastrar Frete"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
