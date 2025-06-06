"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Plus, Trash, UserPlus, FileText, X, Upload } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { createFrete, getFrete, updateFrete, uploadComprovante, deleteComprovante } from "@/lib/services/frete-service"
import { getAllVeiculos } from "@/lib/services/veiculo-service"
import { getAllAgenciador } from "@/lib/services/agenciador-service"
import { getAllMotorista } from "@/lib/services/motorista-service"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSessionData } from "@/lib/auth"

const formSchema = z.object({
  frete_nome: z.string().min(3, {
    message: "O nome do frete deve ter pelo menos 3 caracteres.",
  }),
  frete_veiculo: z.coerce
    .number({
      required_error: "Por favor, selecione um veículo",
      invalid_type_error: "Selecione um veículo válido",
    })
    .min(1, "Por favor, selecione um veículo"),
  frete_agenciador: z.coerce
    .number({
      required_error: "Por favor, selecione um agenciador",
      invalid_type_error: "Selecione um agenciador válido",
    })
    .min(1, "Por favor, selecione um agenciador"),
  frete_motorista: z.coerce
    .number({
      required_error: "Por favor, selecione um motorista",
      invalid_type_error: "Selecione um motorista válido",
    })
    .min(1, "Por favor, selecione um motorista"),
  frete_origem: z.string().min(3, {
    message: "A origem deve ter pelo menos 3 caracteres.",
  }),
  frete_destino: z.string().min(3, {
    message: "O destino deve ter pelo menos 3 caracteres.",
  }),
  frete_distancia: z.coerce.number().min(0).nullable(),
  frete_peso: z.array(z.coerce.number().min(0)),
  frete_valor_tonelada: z.coerce.number().min(0),
  created_at: z.date({
    required_error: "Por favor, selecione a data do frete."
  }),
  comprovante: z.instanceof(File).optional().nullable(),
})

type FormValues = z.infer<typeof formSchema> & {
  comprovante?: File | null
}

interface FretesFormProps {
  id?: string
}

function formatCurrencyBRL(value: number | string) {
  const number = typeof value === "string" ? Number(value.replace(/\D/g, "")) / 100 : value
  return number.toLocaleString("pt-BR", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function FretesForm({ id }: FretesFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(id ? true : false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [veiculos, setVeiculos] = useState<{ id: number; nome: string; motorista?: { id: number } }[]>([])
  const [agenciadores, setAgenciadores] = useState<{ id: number; agenciador_nome: string }[]>([])
  const [motoristas, setMotoristas] = useState<{ id: number; motorista_nome: string }[]>([])
  const [weights, setWeights] = useState<string[]>([""])
  const [userType, setUserType] = useState<string>("")
  const [userId, setUserId] = useState<number | null>(null)
  const [selectedVehicleMotorista, setSelectedVehicleMotorista] = useState<number | undefined>(undefined)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null)

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
      created_at: new Date(),
    },
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [veiculosData, agenciadoresData, motoristasData] = await Promise.all([
          getAllVeiculos(),
          getAllAgenciador(),
          getAllMotorista(),
        ])

        setVeiculos(veiculosData?.map((v: { id: number; veiculo_nome: string; motorista?: { id: number } }) => 
          ({ id: v.id, nome: v.veiculo_nome, motorista: v.motorista })) || []
        )
        setAgenciadores(agenciadoresData?.map((a: { id: number; agenciador_nome: string }) => 
          ({ id: a.id, agenciador_nome: a.agenciador_nome })) || []
        )
        setMotoristas(motoristasData?.map((m: { id: number; motorista_nome: string }) => 
          ({ id: m.id, motorista_nome: m.motorista_nome })) || []
        )

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
              created_at: freteData.created_at ? new Date(freteData.created_at) : new Date(),
            })
            if (freteData.comprovante) {
              setComprovanteUrl(URL.createObjectURL(freteData.comprovante))
            }
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

  useEffect(() => {
    async function fetchSession() {
      const session = await getSessionData()
      if (session) {
        setUserType(session.userType)
        setUserId(session.id)
        
        // Se for motorista, buscar e setar o veículo automaticamente
        if (session.userType === "driver" && session.id) {
          const veiculosData = await getAllVeiculos()
          const veiculoDoMotorista = veiculosData?.find((v: { motorista?: { id: number } }) => v.motorista?.id === session.id)
          if (veiculoDoMotorista) {
            form.setValue("frete_veiculo", veiculoDoMotorista.id)
            form.setValue("frete_motorista", session.id)
            setSelectedVehicleMotorista(session.id)
          }
        }
      }
    }

    fetchSession()
  }, [form])

  const addWeight = () => {
    setWeights([...weights, ""])
    form.setValue("frete_peso", [...form.getValues("frete_peso"), 0])
  }

  const removeWeight = (index: number) => {
    const newWeights = weights.filter((_, i) => i !== index)
    setWeights(newWeights)
    form.setValue(
      "frete_peso",
      form.getValues("frete_peso").filter((_, i) => i !== index),
    )
  }

  const handleWeightChange = (value: string, index: number) => {
    const newWeights = [...weights]
    newWeights[index] = value
    setWeights(newWeights)

    const numericValue = Number.parseFloat(value) || 0
    const currentWeights = form.getValues("frete_peso")
    currentWeights[index] = numericValue
    form.setValue("frete_peso", currentWeights)
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Remove o arquivo do payload que será enviado para o banco
      const { comprovante, ...payload } = values

      const freteData = {
        ...payload,
        created_at: values.created_at.toISOString(),
      }
      let freteId: number

      if (id) {
        await updateFrete(Number(id), freteData)
        freteId = Number(id)
      } else {
        const result = await createFrete({
          ...freteData,
          frete_valor_total: values.frete_peso.reduce((acc, peso) => acc + peso, 0) * values.frete_valor_tonelada,
        })
        freteId = result[0].id
      }

      // Upload do comprovante se houver
      if (comprovante) {
        setUploadingFile(true)
        try {
          const url = await uploadComprovante(comprovante, freteId)
          setComprovanteUrl(url)
          toast({
            title: "Comprovante enviado",
            description: "O comprovante foi enviado com sucesso.",
          })
        } catch {
          toast({
            variant: "destructive",
            title: "Erro ao enviar comprovante",
            description: "Não foi possível enviar o comprovante.",
          })
        } finally {
          setUploadingFile(false)
        }
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

  const handleVehicleChange = useCallback(
    (value: string) => {
      form.setValue("frete_veiculo", Number(value))
      const selectedVehicle = veiculos.find((v) => v.id === Number(value))
      setSelectedVehicleMotorista(selectedVehicle?.motorista?.id)
      if (selectedVehicle?.motorista?.id) {
        form.setValue("frete_motorista", selectedVehicle.motorista.id)
      } else if (userType !== "driver") {
        form.setValue("frete_motorista", 0)
      }
    },
    [form, veiculos, userType],
  )

  useEffect(() => {
    if (userType === "driver" && userId !== null) {
      form.setValue("frete_motorista", userId)
    }
  }, [userType, userId, form])

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
                name="created_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Frete</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                          >
                            {field.value ? (
                              new Date(field.value).toLocaleDateString("pt-BR")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                      onValueChange={handleVehicleChange} 
                      value={field.value?.toString()}
                      disabled={userType === "driver"}
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
                    <FormMessage>{form.formState.errors.frete_veiculo?.message}</FormMessage>
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
                      onValueChange={(value) => {
                        if (value === "novo") {
                          router.push("/dashboard/cadastros/agenciadores/novo")
                          return
                        }
                        field.onChange(Number(value))
                      }}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um agenciador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="novo" className="text-primary">
                          <div className="flex items-center">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Novo Agenciador
                          </div>
                        </SelectItem>
                        {agenciadores.map((agenciador) => (
                          <SelectItem key={agenciador.id} value={agenciador.id.toString()}>
                            {agenciador.agenciador_nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage>{form.formState.errors.frete_agenciador?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frete_motorista"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Motorista</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === "novo") {
                            router.push("/dashboard/cadastros/motoristas/novo")
                            return
                          }
                          field.onChange(Number(value))
                        }}
                        value={field.value?.toString()}
                        disabled={(userType === "driver" && userId !== null) || selectedVehicleMotorista !== undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um motorista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {motoristas.map((motorista) => (
                            <SelectItem key={motorista.id} value={motorista.id.toString()}>
                              {motorista.motorista_nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage>{form.formState.errors.frete_motorista?.message}</FormMessage>
                    </FormItem>
                  )
                }}
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
                        inputMode="decimal"
                        placeholder="0,00"
                        value={formatCurrencyBRL(field.value ?? 0)}
                        onChange={e => {
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
                    step="0.0001"
                    placeholder="Peso em toneladas"
                    value={weight}
                    onChange={(e) => handleWeightChange(e.target.value, index)}
                  />
                  {weights.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeWeight(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="comprovante"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Comprovante</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <div
                          className={cn(
                            "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors",
                            "hover:border-primary/50 hover:bg-muted/50",
                            "focus-within:border-primary focus-within:bg-muted/50",
                            "dark:border-zinc-800 dark:hover:border-zinc-700",
                            value ? "border-primary/50 bg-muted/50" : "border-muted-foreground/25"
                          )}
                        >
                          {!value && (
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  onChange(file)
                                }
                              }}
                              {...field}
                            />
                          )}
                          <div className="flex flex-col items-center justify-center text-center">
                            {value instanceof File ? (
                              <>
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-8 w-8 text-primary" />
                                  <span className="font-medium">{value.name}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    onChange(null)
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Remover arquivo
                                </Button>
                              </>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium text-primary">Clique para selecionar</span> ou arraste e solte
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Suporta imagens e PDFs
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {comprovanteUrl && !value && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-muted rounded-lg mt-2">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="text-sm">Comprovante atual</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                asChild
                                className="w-full sm:w-auto justify-center"
                              >
                                <a
                                  href={comprovanteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80"
                                >
                                  Visualizar
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive w-full sm:w-auto justify-center"
                                onClick={async () => {
                                  if (id && comprovanteUrl) {
                                    try {
                                      await deleteComprovante(Number(id), comprovanteUrl)
                                      setComprovanteUrl(null)
                                      toast({
                                        title: "Comprovante excluído",
                                        description: "O comprovante foi excluído com sucesso.",
                                      })
                                    } catch (err) {
                                      console.error("Erro ao excluir comprovante:", err)
                                      toast({
                                        variant: "destructive",
                                        title: "Erro ao excluir comprovante",
                                        description: "Não foi possível excluir o comprovante.",
                                      })
                                    }
                                  }
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
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
                onClick={() => router.push("/dashboard/cadastros/fretes")}
                disabled={isSubmitting || uploadingFile}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || uploadingFile}>
                {isSubmitting || uploadingFile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingFile ? "Enviando comprovante..." : "Salvando..."}
                  </>
                ) : id ? (
                  "Atualizar Frete"
                ) : (
                  "Criar Frete"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
