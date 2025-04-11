"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"

export interface DespesaData {
  despesa_nome: string
  despesa_descricao: string | null
  despesa_tipo: string
  despesa_valor: number
  despesa_veiculo: number | null
  despesa_motorista: number | null
  created_at?: string
}

export interface DespesaMotoristaResumo {
  totalPago: number
  despesas: DespesaData[]
}

export const getAllDespesa = unstable_cache(
  async () => {
    const { data, error } = await supabase()
      .from("despesa")
      .select(`
        *,
        veiculo:despesa_veiculo(id, veiculo_nome),
        motorista:despesa_motorista(id, motorista_nome)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },
  ["despesas-list"],
  {
    revalidate: 60,
    tags: ["despesas"]
  }
)

export const getDespesa = unstable_cache(
  async (id: number) => {
    const { data, error } = await supabase()
      .from("despesa")
      .select(`
        *,
        veiculo:despesa_veiculo(id, veiculo_nome),
        motorista:despesa_motorista(id, motorista_nome)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },
  ["despesa-detail"],
  {
    revalidate: 60,
    tags: ["despesas", "despesa"]
  }
)

export const createDespesa = async (data: DespesaData) => {
  const result = await supabase()
    .from("despesa")
    .insert(data)
    .select()

  if (result.error) throw result.error
  
  revalidateTag("despesas")
  
  return result.data
}

export const updateDespesa = async (id: number, data: Partial<DespesaData>) => {
  const result = await supabase()
    .from("despesa")
    .update(data)
    .eq("id", id)
    .select()

  if (result.error) throw result.error
  
  revalidateTag("despesas")
  revalidateTag("despesa")
  
  return result.data
}

export const deleteDespesa = async (id: number) => {
  const result = await supabase().from("despesa").delete().eq("id", id)
  
  if (result.error) throw result.error
  
  revalidateTag("despesas")
  revalidateTag("despesa")
  
  return result
}

export const getDespesasByMotorista = async (motoristaId: number): Promise<DespesaMotoristaResumo> => {
  const { data, error } = await supabase()
    .from("despesa")
    .select("*")
    .eq("despesa_motorista", motoristaId)
    .order("created_at", { ascending: false })

  if (error) throw error

  // Calcular o total pago em salários
  const totalPago = data
    .filter(despesa => despesa.despesa_tipo === "Salários")
    .reduce((acc, despesa) => acc + despesa.despesa_valor, 0)

  return {
    totalPago,
    despesas: data
  }
}

export const getTipoDespesaEnum = unstable_cache(
  async () => {
    const { data, error } = await supabase().rpc("get_tipo_despesa_enum")

    if (error) throw error
    return data
  },
  ["tipo-despesa-enum"],
  {
    revalidate: 3600, // Revalidar a cada hora, já que enums mudam com pouca frequência
    tags: ["enums", "tipo-despesa"],
  }
)

