"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"

export interface VeiculoData {
  veiculo_nome: string
  veiculo_placa: string
  veiculo_reboque: string
  veiculo_ano?: number | null
  veiculo_km_inicial?: number | null
  veiculo_litro_inicial?: number | null
  veiculo_motorista?: number | null
  veiculo_created_at?: string
}

export const getAllVeiculos = unstable_cache(
  async () => {
    const { data, error } = await supabase()
      .from("veiculo")
      .select("*")
      .order("veiculo_nome", { ascending: true })

    if (error) throw error

    return data
  },
  ["veiculos-list"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["veiculos"]
  }
)

export const getVeiculo = unstable_cache(
  async (id: number) => {
    const { data, error } = await supabase().from("veiculo").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },
  ["veiculo-detail"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["veiculos", "veiculo"]
  }
)

export const createVeiculo = async (data: VeiculoData) => {
  const result = await supabase().from("veiculo").insert(data).select()

  if (result.error) throw result.error
  
  // Invalidar o cache quando um novo veículo é criado
  revalidateTag("veiculos")
  
  return result.data
}

export const updateVeiculo = async (id: number, data: Partial<VeiculoData>) => {
  const result = await supabase().from("veiculo").update(data).eq("id", id).select()

  if (result.error) throw result.error
  
  // Invalidar o cache quando um veículo é atualizado
  revalidateTag("veiculos")
  revalidateTag("veiculo")
  
  return result.data
}

export const deleteVeiculo = async (id: number) => {
  const result = await supabase().from("veiculo").delete().eq("id", id)
  
  if (result.error) throw result.error
  
  // Invalidar o cache quando um veículo é excluído
  revalidateTag("veiculos")
  revalidateTag("veiculo")
  
  return result
}
