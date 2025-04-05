"use server"

import { supabase } from "../supabase"

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

export const createVeiculo = async (data: any) => {
  const result = await supabase().from("veiculo").insert(data).select()

  if (result.error) throw result.error
  return result.data
}

export const updateVeiculo = async (id: number, data: any) => {
  const result = await supabase().from("veiculo").update(data).eq("id", id).select()

  if (result.error) throw result.error
  return result.data
}

export const deleteVeiculo = async (id: number) => {
  const error = await supabase().from("veiculo").delete().eq("id", id)
  console.log(error)

  if (error) throw error
}
