"use server"

import { supabase } from "../supabase"

export interface MotoristaData {
  motorista_nome: string
  motorista_cnh: string
  motorista_salario: number
  motorista_frete: number
  motorista_estadia: number
  motorista_admissao: Date | string
  motorista_ult_acesso?: string | null
  motorista_created_at?: string
}

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

export const createMotorista = async (data: MotoristaData) => {
  const result = await supabase().from("motorista").insert(data).select()

  if (result.error) throw result.error
  return result.data
}

export const updateMotorista = async (id: number, data: Partial<MotoristaData>) => {
  const result = await supabase().from("motorista").update(data).eq("id", id).select()

  if (result.error) throw result.error
  return result.data
}

export const deleteMotorista = async (id: number) => {
  const result = await supabase().from("motorista").delete().eq("id", id)
  if (result.error) throw result.error
  return result
}
