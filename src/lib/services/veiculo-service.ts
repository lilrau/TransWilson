"use server"

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

export const getAllVeiculos = async () => {
  const { data, error } = await supabase()
    .from("veiculo")
    .select("*")
    .order("veiculo_nome", { ascending: true })

  if (error) throw error

  return data
}

export const getVeiculo = async (id: number) => {
  const { data, error } = await supabase().from("veiculo").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export const createVeiculo = async (data: VeiculoData) => {
  const result = await supabase().from("veiculo").insert(data).select()

  if (result.error) throw result.error
  return result.data
}

export const updateVeiculo = async (id: number, data: Partial<VeiculoData>) => {
  const result = await supabase().from("veiculo").update(data).eq("id", id).select()

  if (result.error) throw result.error
  return result.data
}

export const deleteVeiculo = async (id: number) => {
  const result = await supabase().from("veiculo").delete().eq("id", id)
  if (result.error) throw result.error
  return result
}
