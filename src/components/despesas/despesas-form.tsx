"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, ControllerRenderProps } from "react-hook-form"
import { z } from "zod"
import { cn } from "@/lib/utils"

import { createDespesa, getDespesa, updateDespesa, uploadComprovante, deleteComprovante } from "@/lib/services/despesa-service"
import { getAllVeiculos } from "@/lib/services/veiculo-service"
import { getAllMotorista } from "@/lib/services/motorista-service"
import { getTipoDespesaEnum } from "@/lib/services/enum-service"
import { getSessionData } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, FileText, Upload, X } from "lucide-react"
import { getAllFrete, getFrete } from "@/lib/services/frete-service"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  comprovante: z.instanceof(File).optional().nullable(),
  despesa_metodo_pagamento: z.string().optional().nullable(),
  despesa_parcelas: z.number().min(1, {
    message: "O número de parcelas deve ser pelo menos 1.",
  }),
  despesa_frete_id: z.number().nullable().optional(),
  created_at: z.date({ required_error: "A data é obrigatória." }),
})

const despesaMetodoPagamentoSchema = ["dinheiro", "pix", "debito", "credito"]

type FormValues = z.infer<typeof formSchema>

interface DespesasFormProps {
  id?: string
  despesa_frete_id?: number
}

function formatCurrencyBRL(value: number | string) {
  const number = typeof value === "string" ? Number(value.replace(/\D/g, "")) / 100 : value
  return number.toLocaleString("pt-BR", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ValorField = ({ field }: { field: ControllerRenderProps<FormValues, "despesa_valor"> }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <FormItem>
      <FormLabel>Valor</FormLabel>
      <FormControl>
        <Input
          ref={inputRef}
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
  )
}

export function DespesasForm({ id, despesa_frete_id }: DespesasFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(id ? true : false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipoOptions, setTipoOptions] = useState<string[]>([])
  const [veiculos, setVeiculos] = useState<{ id: number; nome: string; motorista?: { id: number; nome: string } }[]>([])
  const [motoristas, setMotoristas] = useState<{ id: number; nome: string }[]>([])
  const [userType, setUserType] = useState<string>("")
  const [userId, setUserId] = useState<number | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null)
  const [fretes, setFretes] = useState<{ id: number; frete_nome: string; frete_origem: string | null; frete_destino: string | null }[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      despesa_nome: "",
      despesa_descricao: "",
      despesa_tipo: "",
      despesa_valor: 0,
      despesa_veiculo: null,
      despesa_motorista: null,
      comprovante: null,
      despesa_metodo_pagamento: null,
      despesa_parcelas: 1,
      despesa_frete_id: despesa_frete_id ?? null,
      created_at: new Date(),
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
        setIsLoading(true)
        setError(null)
        const data = await getAllVeiculos()
        setVeiculos((data || []).map((v) => ({
          id: v.id,
          nome: v.veiculo_nome,
          motorista: v.motorista ? { id: v.motorista.id, nome: v.motorista.motorista_nome } : undefined,
        })))
      } catch {
        setError("Erro ao buscar veículos.")
      } finally {
        setIsLoading(false)
      }
    }

    async function fetchMotoristas() {
      try {
        const data = await getAllMotorista()

        setMotoristas(
          data?.map((motorista) => ({
            id: motorista.id,
            nome: motorista.motorista_nome,
          })) || [],
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

    async function fetchFretes() {
      try {
        const data = await getAllFrete()
        setFretes(
          (data || [])
            .filter((f: { frete_baixa?: boolean }) => !f.frete_baixa)
            .map((f: { id: number; frete_nome: string; frete_origem: string; frete_destino: string }) => ({
              id: f.id,
              frete_nome: f.frete_nome,
              frete_origem: f.frete_origem,
              frete_destino: f.frete_destino,
            }))
        )
      } catch {
        // Silencioso
      }
    }

    fetchVeiculos()
    fetchMotoristas()
    fetchTiposDespesa()
    fetchFretes()
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
            despesa_metodo_pagamento: typeof data.despesa_metodo_pagamento === "string" ? data.despesa_metodo_pagamento : null,
            despesa_parcelas: data.despesa_parcelas || 1,
            despesa_frete_id: data.despesa_frete_id || null,
            created_at: data.created_at ? new Date(data.created_at) : new Date(),
          })
          setComprovanteUrl(data.comprovante_url || null)
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

  // Handle vehicle change and automatically set the associated driver
  const handleVehicleChange = useCallback(
    (value: string) => {
      const newValue = value === "none" ? null : Number(value)
      form.setValue("despesa_veiculo", newValue)

      const selectedVehicle = veiculos.find((v) => v.id === newValue)

      if (selectedVehicle?.motorista?.id) {
        form.setValue("despesa_motorista", selectedVehicle.motorista.id)
      } else if (userType !== "driver") {
        form.setValue("despesa_motorista", null)
      }
    },
    [form, veiculos, userType]
  )

  // Set driver ID if user is a driver
  useEffect(() => {
    if (userType === "driver" && userId !== null) {
      form.setValue("despesa_motorista", userId)

      // Find the vehicle assigned to the driver
      const driverVehicle = veiculos.find(v => v.motorista?.id === userId)
      if (driverVehicle) {
        form.setValue("despesa_veiculo", driverVehicle.id)
      }
    }
  }, [userType, userId, form, veiculos])

  // Após o carregamento dos veículos e motoristas, se despesa_frete_id estiver preenchido e não for edição, preencha automaticamente:
  useEffect(() => {
    async function autoFillFromFrete() {
      if (!id) {
        const freteId = form.getValues("despesa_frete_id")
        const parsedFreteId = Number(freteId)
        if (parsedFreteId && !isNaN(parsedFreteId)) {
          try {
            const frete = await getFrete(parsedFreteId)
            if (frete) {
              if (frete.veiculo?.id) {
                form.setValue("despesa_veiculo", frete.veiculo.id)
              } else if (frete.frete_veiculo) {
                form.setValue("despesa_veiculo", frete.frete_veiculo)
              }
              if (frete.motorista?.id) {
                form.setValue("despesa_motorista", frete.motorista.id)
              } else if (frete.frete_motorista) {
                form.setValue("despesa_motorista", frete.frete_motorista)
              }
            }
          } catch {
            // Silencioso
          }
        }
      }
    }
    autoFillFromFrete()
  }, [id, form, veiculos, motoristas])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Se não for admin, força o motorista atual
      const motorista = userType !== "admin" && userId !== null ? userId : (values.despesa_motorista ?? null)

      const despesaData = {
        despesa_nome: values.despesa_nome,
        despesa_descricao: values.despesa_descricao ?? null,
        despesa_tipo: values.despesa_tipo,
        despesa_valor: values.despesa_valor,
        despesa_veiculo: values.despesa_veiculo ?? null,
        despesa_motorista: motorista,
        despesa_metodo_pagamento: values.despesa_metodo_pagamento ?? null,
        despesa_parcelas: values.despesa_metodo_pagamento?.toLowerCase() === "credito"
          ? (values.despesa_parcelas ?? undefined)
          : undefined,
        ...(values.despesa_frete_id != null ? { despesa_frete_id: values.despesa_frete_id } : {}),
        created_at: values.created_at.toISOString(),
      }
      // Remover despesa_parcelas se for null
      if (despesaData.despesa_parcelas === null) delete despesaData.despesa_parcelas

      let despesaId: number

      if (id) {
        // Modo de edição
        await updateDespesa(Number(id), despesaData)
        despesaId = Number(id)
        toast({
          title: "Despesa atualizada",
          description: "A despesa foi atualizada com sucesso.",
        })
      } else {
        // Modo de criação
        const result = await createDespesa(despesaData)
        despesaId = result[0].id
        toast({
          title: "Despesa criada",
          description: "A despesa foi criada com sucesso.",
        })
      }

      // Upload do comprovante se houver
      if (values.comprovante) {
        setUploadingFile(true)
        try {
          const url = await uploadComprovante(values.comprovante, despesaId)
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

      // Redirecionar para a lista de despesas
      router.push("/dashboard/cadastros/despesas")
      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar despesa:", error)
      if (error instanceof Error) {
        setError(error.message || "Ocorreu um erro ao salvar a despesa.")
      } else {
        setError("Ocorreu um erro desconhecido.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const MotoristaSelect = ({
    field,
  }: { field: { value: number | null | undefined; onChange: (value: number | null) => void } }) => {
    const [selectedValue, setSelectedValue] = useState<string | undefined>(field.value?.toString() || "none")

    // Move userType and userId to dependencies since they are used in the effect
    const currentUserType = userType
    const currentUserId = userId

    useEffect(() => {
      if (currentUserType === "driver" && currentUserId !== null) {
        field.onChange(currentUserId)
        setSelectedValue(currentUserId.toString())
      }
    }, [field, currentUserType, currentUserId])

    const handleChange = (value: string) => {
      const newValue = value === "none" ? null : Number.parseInt(value)
      field.onChange(newValue)
      setSelectedValue(value)
    }

    return (
      <FormItem>
        <FormLabel>Motorista</FormLabel>
        <Select onValueChange={handleChange} value={selectedValue} disabled={userType === "driver"}>
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
                render={({ field }) => <ValorField field={field} />}
              />

              <FormField
                control={form.control}
                name="despesa_descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da despesa" {...field} value={field.value || ""} />
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
                      onValueChange={handleVehicleChange}
                      value={field.value?.toString() || "none"}
                      disabled={userType === "driver"}
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
                render={({ field }) => <MotoristaSelect field={field} />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="despesa_metodo_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Selecione o método de pagamento</SelectItem>
                        {
                          despesaMetodoPagamentoSchema.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="despesa_frete_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frete (em andamento)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                      value={field.value ? String(field.value) : "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o frete em andamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {fretes.map((frete) => (
                          <SelectItem key={frete.id} value={frete.id.toString()}>
                            {frete.frete_nome} ({frete.frete_origem || "-"} → {frete.frete_destino || "-"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(() => {
              const metodoPagamento = form.watch("despesa_metodo_pagamento")
              const isCredito = metodoPagamento && typeof metodoPagamento === "string" && metodoPagamento.toLowerCase() === "credito"
              return isCredito ? (
                <FormField
                  control={form.control}
                  name="despesa_parcelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="1"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
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
                          <div className="flex flex-col items-center justify-center text-center">
                            {value ? (
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
                onClick={() => router.push("/dashboard/cadastros/despesas")}
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
