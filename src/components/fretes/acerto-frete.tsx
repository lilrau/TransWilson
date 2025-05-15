"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  Check, 
  Clock, 
  DollarSign, 
  Loader2, 
  TrendingDown, 
  TrendingUp 
} from "lucide-react"
import { 
  getAllFrete, 
  getFrete, 
  getFreteBalance,
  darBaixaFrete 
} from "@/lib/services/frete-service"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createDespesa } from "@/lib/services/despesa-service"
import { createEntrada, getAllEntradas } from "@/lib/services/entrada-service"
import { toast } from "@/hooks/use-toast"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase"

type Frete = {
  id: number
  frete_nome: string
  frete_origem: string | null
  frete_destino: string | null
  frete_valor_total: number | null
  frete_baixa: boolean | null
  created_at: string
  veiculo?: { id: number; veiculo_nome: string } | null
  motorista?: { id: number; motorista_nome: string } | null
  agenciador?: { id: number; agenciador_nome: string } | null
}

type FreteBalance = {
  saldo: number
  totalEntradas: number
  totalDespesas: number
  valorFrete: number
}

type Entrada = {
  id: number
  entrada_nome: string
  entrada_valor: number
  entrada_descricao: string | null
  entrada_tipo: string | null
  created_at: string
}

type Despesa = {
  id: number
  despesa_nome: string
  despesa_valor: number
  despesa_descricao: string | null
  despesa_tipo: string
  created_at: string
}

export function AcertoFreteComponent() {
  const [fretes, setFretes] = useState<Frete[]>([])
  const [selectedFreteId, setSelectedFreteId] = useState<string>("")
  const [selectedFrete, setSelectedFrete] = useState<Frete | null>(null)
  const [freteBalance, setFreteBalance] = useState<FreteBalance | null>(null)
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false)
  const [mediaKmL, setMediaKmL] = useState<string>("- Km/L")
  
  // Form states for registering new entries
  const [novaEntrada, setNovaEntrada] = useState({
    descricao: "",
    valor: ""
  })
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: "",
    tipo: "Estadia",
    valor: ""
  })
  const [registrando, setRegistrando] = useState(false)
  const [reativandoFrete, setReativandoFrete] = useState(false)
  const [dandomBaixa, setDandomBaixa] = useState(false)
  const [baixaValores, setBaixaValores] = useState<{ total: number, adiantado: number, final: number } | null>(null)

  useEffect(() => {
    async function loadFretes() {
      try {
        setLoading(true)
        const data = await getAllFrete()
        setFretes(data || [])
      } catch (error) {
        console.error("Erro ao carregar fretes:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFretes()
  }, [])

  async function handleFreteChange(id: string) {
    if (!id) {
      setSelectedFrete(null)
      setFreteBalance(null)
      setEntradas([])
      setDespesas([])
      setSelectedFreteId("")
      setMediaKmL("- Km/L")
      return
    }

    setSelectedFreteId(id)
    setLoadingDetails(true)

    try {
      // Load frete details
      const freteId = parseInt(id)
      const freteData = await getFrete(freteId)
      setSelectedFrete(freteData)

      // Load frete balance
      const balance = await getFreteBalance(freteId)
      setFreteBalance(balance)

      // Get entradas and despesas from supabase
      const { data: entradasData, error: entradasError } = await fetch(`/api/entradas?freteId=${freteId}`)
        .then(res => res.json())
      
      if (entradasError) {
        throw new Error("Erro ao carregar entradas")
      }
      
      const { data: despesasData, error: despesasError } = await fetch(`/api/despesas?freteId=${freteId}`)
        .then(res => res.json())
      
      if (despesasError) {
        throw new Error("Erro ao carregar despesas")
      }

      setEntradas(entradasData || [])
      setDespesas(despesasData || [])
      
      // Calculate Km/L average
      calcularMediaKmL(freteData, despesasData || [])
    } catch (error) {
      console.error("Erro ao carregar detalhes do frete:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os detalhes do frete."
      })
    } finally {
      setLoadingDetails(false)
    }
  }

  // Add function to calculate Km/L
  function calcularMediaKmL(frete: any, despesas: Despesa[]) {
    // Check if we have distance and fuel expenses
    if (!frete || !frete.frete_distancia || !despesas.length) {
      setMediaKmL("- Km/L")
      return
    }
    
    // Filter for fuel expenses only
    const despesasCombustivel = despesas.filter(d => d.despesa_tipo === "Combustível")
    
    if (!despesasCombustivel.length) {
      setMediaKmL("- Km/L")
      return
    }
    
    // Calculate total liters based on expenses
    // We need to estimate liters from the values
    // This is a simplified calculation assuming R$ 6,00 per liter
    // In a real app, you'd have a more accurate way to track actual liters
    const valorPorLitro = 6.0 // Valor médio estimado por litro
    const totalValorCombustivel = despesasCombustivel.reduce((acc, d) => acc + d.despesa_valor, 0)
    const litrosEstimados = totalValorCombustivel / valorPorLitro
    
    if (litrosEstimados <= 0) {
      setMediaKmL("- Km/L")
      return
    }
    
    // Calculate Km/L
    const kmL = frete.frete_distancia / litrosEstimados
    
    // Format with 1 decimal place
    setMediaKmL(`${kmL.toFixed(1)} Km/L`)
  }

  async function handleRegistrarEntrada() {
    if (!selectedFrete || !novaEntrada.descricao || !novaEntrada.valor) return
    
    setRegistrando(true)
    try {
      await createEntrada({
        entrada_nome: `Entrada: ${novaEntrada.descricao}`,
        entrada_descricao: novaEntrada.descricao,
        entrada_valor: parseFloat(novaEntrada.valor),
        entrada_tipo: "Frete",
        entrada_frete_id: selectedFrete.id,
      })

      // Refresh data
      await handleFreteChange(selectedFreteId)
      
      // Reset form
      setNovaEntrada({
        descricao: "",
        valor: ""
      })

      toast({
        title: "Entrada registrada",
        description: "A entrada foi registrada com sucesso."
      })
    } catch (error) {
      console.error("Erro ao registrar entrada:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar a entrada."
      })
    } finally {
      setRegistrando(false)
    }
  }

  async function handleRegistrarDespesa() {
    if (!selectedFrete || !novaDespesa.descricao || !novaDespesa.valor) return
    
    setRegistrando(true)
    try {
      const despesaData = {
        despesa_nome: `Despesa: ${novaDespesa.descricao}`,
        despesa_descricao: novaDespesa.descricao,
        despesa_valor: parseFloat(novaDespesa.valor),
        despesa_tipo: novaDespesa.tipo,
        despesa_veiculo: selectedFrete.veiculo?.id || null,
        despesa_motorista: selectedFrete.motorista?.id || null,
      };
      
      // Use the Supabase client directly to include the frete_id
      const { data, error } = await supabase()
        .from("despesa")
        .insert({
          ...despesaData,
          despesa_frete_id: selectedFrete.id
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Refresh data
      await handleFreteChange(selectedFreteId)
      
      // Reset form
      setNovaDespesa({
        descricao: "",
        tipo: "Estadia",
        valor: ""
      })

      toast({
        title: "Despesa registrada",
        description: "A despesa foi registrada com sucesso."
      })
    } catch (error) {
      console.error("Erro ao registrar despesa:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar a despesa."
      })
    } finally {
      setRegistrando(false)
    }
  }

  async function handleReativarFrete() {
    if (!selectedFrete) return
    
    setReativandoFrete(true)
    try {
      // Buscar a entrada específica de baixa do frete ("Recebimento do frete: [nome]")
      const { data: entradasBaixa, error: erroEntradas } = await supabase()
        .from("entrada")
        .select("id, entrada_nome")
        .eq("entrada_frete_id", selectedFrete.id)
        .ilike("entrada_nome", `Recebimento do frete: ${selectedFrete.frete_nome}%`)
        
      if (erroEntradas) {
        throw new Error("Erro ao buscar entradas de baixa")
      }
      
      // Se encontrou entradas de baixa, remover
      if (entradasBaixa && entradasBaixa.length > 0) {
        console.log("Entradas de baixa encontradas:", entradasBaixa)
        
        for (const entrada of entradasBaixa) {
          const { error: erroDelete } = await supabase()
            .from("entrada")
            .delete()
            .eq("id", entrada.id)
            
          if (erroDelete) {
            console.error("Erro ao remover entrada de baixa:", erroDelete)
            throw new Error("Erro ao remover entrada de baixa")
          }
        }
      }
      
      // Alterar o status do frete para não baixado
      await darBaixaFrete(selectedFrete.id, false)
      
      // Refresh data
      await handleFreteChange(selectedFreteId)
      
      toast({
        title: "Frete reativado",
        description: "O frete foi reativado com sucesso e a entrada de baixa foi removida."
      })
    } catch (error) {
      console.error("Erro ao reativar frete:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reativar o frete. " + (error instanceof Error ? error.message : "")
      })
    } finally {
      setReativandoFrete(false)
    }
  }

  // Função para preparar valores para a baixa
  async function prepararValoresBaixa() {
    if (!selectedFrete) return
    
    try {
      // Buscar todas as entradas relacionadas a este frete (adiantamentos, etc)
      const entradas = await getAllEntradas()
      const entradasDoFrete = (entradas || []).filter((entrada) => entrada.entrada_frete_id === selectedFrete.id)
      const totalAdiantado = entradasDoFrete.reduce((acc, entrada) => acc + (entrada.entrada_valor || 0), 0)
      
      // Calcular valor restante a receber
      const valorTotal = selectedFrete.frete_valor_total || 0
      const valorFinal = valorTotal - totalAdiantado
      
      setBaixaValores({ total: valorTotal, adiantado: totalAdiantado, final: valorFinal })
    } catch (error) {
      console.error("Erro ao preparar valores para baixa:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível calcular os valores para baixa do frete."
      })
    }
  }
  
  async function handleDarBaixa() {
    if (!selectedFrete || !baixaValores) return
    
    setDandomBaixa(true)
    try {
      // Atualizar o status do frete
      await darBaixaFrete(selectedFrete.id, true)
      
      // Criar uma entrada financeira apenas se houver valor a receber
      if (baixaValores.final > 0) {
        await createEntrada({
          entrada_nome: `Recebimento do frete: ${selectedFrete.frete_nome}`,
          entrada_descricao: `Origem: ${selectedFrete.frete_origem || "N/A"} - Destino: ${selectedFrete.frete_destino || "N/A"}`,
          entrada_valor: baixaValores.final,
          entrada_tipo: "Frete",
          entrada_frete_id: selectedFrete.id,
        })
      }
      
      // Refresh data
      await handleFreteChange(selectedFreteId)
      
      toast({
        title: "Frete baixado com sucesso",
        description: `O frete foi baixado e uma entrada financeira foi criada com valor de ${baixaValores.final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
      })
      
      // Reset
      setBaixaValores(null)
    } catch (error) {
      console.error("Erro ao dar baixa no frete:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível dar baixa no frete: " + (error instanceof Error ? error.message : "")
      })
    } finally {
      setDandomBaixa(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="frete-select">Selecione um Frete</Label>
          <Select value={selectedFreteId} onValueChange={handleFreteChange}>
            <SelectTrigger id="frete-select" className="w-full">
              <SelectValue placeholder="Selecione um frete" />
            </SelectTrigger>
            <SelectContent>
              {fretes.map((frete) => (
                <SelectItem key={frete.id} value={frete.id.toString()}>
                  {frete.frete_nome} - {frete.frete_origem} → {frete.frete_destino}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadingDetails && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {selectedFrete && freteBalance && !loadingDetails && (
        <div className="space-y-6">
          {/* Frete Info Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor do Frete</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {freteBalance.valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {freteBalance.totalEntradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {freteBalance.totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mediaKmL}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  freteBalance.saldo > 0 ? "text-green-600" : 
                  freteBalance.saldo < 0 ? "text-red-600" : ""
                )}>
                  {freteBalance.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex gap-2 items-center flex-wrap">
                <Badge variant={selectedFrete.frete_baixa ? "default" : "outline"} className="gap-1">
                  {selectedFrete.frete_baixa ? 
                    <><Check className="h-3.5 w-3.5" /> Baixado</> : 
                    <><Clock className="h-3.5 w-3.5" /> Em andamento</>
                  }
                </Badge>
                
                {selectedFrete.frete_baixa ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
                      >
                        Reativar Frete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reativar frete</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja reativar este frete? O status de baixa será removido, porém as entradas e despesas 
                          registradas serão mantidas. Isso pode afetar relatórios financeiros.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReativarFrete}
                          disabled={reativandoFrete}
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          {reativandoFrete ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Reativando...
                            </>
                          ) : (
                            "Confirmar Reativação"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                        onClick={prepararValoresBaixa}
                      >
                        Dar Baixa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar baixa do frete</AlertDialogTitle>
                        <AlertDialogDescription>
                          {baixaValores ? (
                            <div className="space-y-1">
                              <div>Valor total do frete: <strong>{baixaValores.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
                              <div>Total já adiantado: <strong className="text-amber-600">{baixaValores.adiantado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
                              <div>Valor a receber nesta baixa: <strong className="text-green-700">{baixaValores.final.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
                            </div>
                          ) : (
                            <span>Carregando valores...</span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDarBaixa}
                          disabled={dandomBaixa || !baixaValores}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {dandomBaixa ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            "Confirmar Baixa"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Frete Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Frete</CardTitle>
              <CardDescription>Informações detalhadas sobre o frete selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Nome do Frete</p>
                  <p className="text-lg">{selectedFrete.frete_nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data de Criação</p>
                  <p className="text-lg">
                    {format(new Date(selectedFrete.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Origem</p>
                  <p className="text-lg">{selectedFrete.frete_origem || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Destino</p>
                  <p className="text-lg">{selectedFrete.frete_destino || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Veículo</p>
                  <p className="text-lg">{selectedFrete.veiculo?.veiculo_nome || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Motorista</p>
                  <p className="text-lg">{selectedFrete.motorista?.motorista_nome || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Agenciador</p>
                  <p className="text-lg">{selectedFrete.agenciador?.agenciador_nome || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Entradas and Despesas */}
          <Tabs defaultValue="entradas" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entradas" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Entradas
              </TabsTrigger>
              <TabsTrigger value="despesas" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Despesas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="entradas">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Entradas</span>
                    <Badge variant="outline" className="ml-2">
                      {entradas.length} registros
                    </Badge>
                  </CardTitle>
                  <CardDescription>Registros de entradas relacionadas a este frete</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Form to add new entrada */}
                    <div className="grid gap-4 md:grid-cols-3 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="entrada-descricao">Descrição</Label>
                        <Input 
                          id="entrada-descricao" 
                          placeholder="Descrição da entrada"
                          value={novaEntrada.descricao}
                          onChange={(e) => setNovaEntrada({...novaEntrada, descricao: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entrada-valor">Valor</Label>
                        <Input 
                          id="entrada-valor" 
                          type="number" 
                          step="0.01"
                          placeholder="0,00"
                          value={novaEntrada.valor}
                          onChange={(e) => setNovaEntrada({...novaEntrada, valor: e.target.value})}
                        />
                      </div>
                      <Button 
                        onClick={handleRegistrarEntrada}
                        disabled={registrando || !novaEntrada.descricao || !novaEntrada.valor}
                      >
                        {registrando ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Registrar Entrada
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Entradas Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entradas.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                Nenhuma entrada registrada para este frete.
                              </TableCell>
                            </TableRow>
                          ) : (
                            entradas.map((entrada) => (
                              <TableRow key={entrada.id}>
                                <TableCell>
                                  {format(new Date(entrada.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell>{entrada.entrada_descricao || entrada.entrada_nome}</TableCell>
                                <TableCell>{entrada.entrada_tipo || "N/A"}</TableCell>
                                <TableCell className="text-right font-medium text-green-600">
                                  {entrada.entrada_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="despesas">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Despesas</span>
                    <Badge variant="outline" className="ml-2">
                      {despesas.length} registros
                    </Badge>
                  </CardTitle>
                  <CardDescription>Registros de despesas relacionadas a este frete</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Form to add new despesa */}
                    <div className="grid gap-4 md:grid-cols-4 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="despesa-descricao">Descrição</Label>
                        <Input 
                          id="despesa-descricao" 
                          placeholder="Descrição da despesa"
                          value={novaDespesa.descricao}
                          onChange={(e) => setNovaDespesa({...novaDespesa, descricao: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="despesa-tipo">Tipo</Label>
                        <Select 
                          value={novaDespesa.tipo} 
                          onValueChange={(value) => setNovaDespesa({...novaDespesa, tipo: value})}
                        >
                          <SelectTrigger id="despesa-tipo">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Estadia">Estadia</SelectItem>
                            <SelectItem value="Combustível">Combustível</SelectItem>
                            <SelectItem value="Pedágio">Pedágio</SelectItem>
                            <SelectItem value="Manutenção">Manutenção</SelectItem>
                            <SelectItem value="Alimentação">Alimentação</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="despesa-valor">Valor</Label>
                        <Input 
                          id="despesa-valor" 
                          type="number" 
                          step="0.01"
                          placeholder="0,00"
                          value={novaDespesa.valor}
                          onChange={(e) => setNovaDespesa({...novaDespesa, valor: e.target.value})}
                        />
                      </div>
                      <Button 
                        onClick={handleRegistrarDespesa}
                        disabled={registrando || !novaDespesa.descricao || !novaDespesa.valor}
                        variant="outline"
                      >
                        {registrando ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Registrar Despesa
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Despesas Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {despesas.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                Nenhuma despesa registrada para este frete.
                              </TableCell>
                            </TableRow>
                          ) : (
                            despesas.map((despesa) => (
                              <TableRow key={despesa.id}>
                                <TableCell>
                                  {format(new Date(despesa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell>{despesa.despesa_descricao || despesa.despesa_nome}</TableCell>
                                <TableCell>{despesa.despesa_tipo}</TableCell>
                                <TableCell className="text-right font-medium text-red-600">
                                  {despesa.despesa_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!selectedFrete && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Selecione um frete</h3>
          <p className="text-muted-foreground">
            Selecione um frete para visualizar seus detalhes e gerenciar seus acertos financeiros.
          </p>
        </div>
      )}
    </div>
  )
} 