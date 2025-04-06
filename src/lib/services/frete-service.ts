"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"

export interface FreteData {
  frete_nome: string
  frete_veiculo: number | null
  frete_agenciador: number | null
  frete_motorista: number | null
  frete_origem: string | null
  frete_destino: string | null
  frete_distancia: number | null
  frete_peso: number[]
  frete_valor_tonelada: number | null
  frete_valor_total: number | null
  created_at?: string
}

export const getAllFrete = unstable_cache(
  async () => {
    const { data, error } = await supabase()
      .from("frete")
      .select(`
        *,
        veiculo:frete_veiculo(id, veiculo_nome),
        agenciador:frete_agenciador(id, nome),
        motorista:frete_motorista(id, motorista_nome)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },
  ["fretes-list"],
  {
    revalidate: 60,
    tags: ["fretes"]
  }
)

export const getFrete = unstable_cache(
  async (id: number) => {
    const { data, error } = await supabase()
      .from("frete")
      .select(`
        *,
        veiculo:frete_veiculo(id, veiculo_nome),
        agenciador:frete_agenciador(id, nome),
        motorista:frete_motorista(id, motorista_nome)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },
  ["frete-detail"],
  {
    revalidate: 60,
    tags: ["fretes", "frete"]
  }
)

export const createFrete = async (data: FreteData) => {
  // Calculate total value
  const valorTotal = data.frete_peso.reduce((acc, peso) => acc + peso, 0) * (data.frete_valor_tonelada || 0)
  
  const result = await supabase()
    .from("frete")
    .insert({
      ...data,
      frete_valor_total: valorTotal
    })
    .select()

  if (result.error) throw result.error
  
  revalidateTag("fretes")
  
  return result.data
}

export const updateFrete = async (id: number, data: Partial<FreteData>) => {
  // If updating weights or price per ton, recalculate total value
  let updateData = { ...data }
  if (data.frete_peso || data.frete_valor_tonelada) {
    const currentFrete = await getFrete(id)
    const weights = data.frete_peso || currentFrete.frete_peso
    const pricePerTon = data.frete_valor_tonelada || currentFrete.frete_valor_tonelada
    updateData.frete_valor_total = weights.reduce((acc: number, peso: number) => acc + peso, 0) * (pricePerTon || 0)
  }

  const result = await supabase()
    .from("frete")
    .update(updateData)
    .eq("id", id)
    .select()

  if (result.error) throw result.error
  
  revalidateTag("fretes")
  revalidateTag("frete")
  
  return result.data
}

export const deleteFrete = async (id: number) => {
  const result = await supabase().from("frete").delete().eq("id", id)
  
  if (result.error) throw result.error
  
  revalidateTag("fretes")
  revalidateTag("frete")
  
  return result
}