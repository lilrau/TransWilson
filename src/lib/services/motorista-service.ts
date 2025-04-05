"use server"

import { supabase } from "../supabase"

export const getAllMotorista = async () => {
  const { data, error } = await supabase()
    .from("motorista")
    .select("*")
    .order("motorista_nome", { ascending: true })

  if (error) throw error

  return data
}

export const getMotorista = async (id: number) => {
  const { data, error } = await supabase().from("motorista").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export const createMotorista = async (data: any) => {
  const result = await supabase().from("motorista").insert(data).select()

  if (result.error) throw result.error
  return result.data
}

export const updateMotorista = async (id: number, data: any) => {
  const result = await supabase().from("motorista").update(data).eq("id", id).select()

  if (result.error) throw result.error
  return result.data
}

export const deleteMotorista = async (id: number) => {
  const error = await supabase().from("motorista").delete().eq("id", id)
  console.log(error)

  if (error) throw error
}
