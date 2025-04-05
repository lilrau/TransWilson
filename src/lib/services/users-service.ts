"use server"

import { supabase } from "../supabase"

export interface UserData {
  user_nome: string
  user_user: string
  user_email: string
  user_role: string
  user_senha?: string
  user_ativo: boolean
  user_created_at?: string
}

export const getAllUsers = async () => {
  const { data, error } = await supabase()
    .from("users")
    .select("*")
    .order("user_nome", { ascending: true })

  if (error) throw error

  return data
}

export const getUserById = async (id: number) => {
  const { data, error } = await supabase().from("users").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export const getUserByUsername = async (username: string) => {
  const { data, error } = await supabase()
    .from("users")
    .select("*")
    .eq("user_user", username)
    .single()
  console.log(data)

  if (error) throw error
  return data
}

export const createUser = async (data: UserData) => {
  // Se houver uma senha, aplica o hash antes de salvar
  if (data.user_senha) {
    const { hashPassword } = await import("../password-utils")
    data.user_senha = await hashPassword(data.user_senha)
  }

  const result = await supabase().from("users").insert(data).select()

  if (result.error) throw result.error
  return result.data
}

export const updateUser = async (id: number, data: Partial<UserData>) => {
  // Se houver uma senha, aplica o hash antes de atualizar
  if (data.user_senha) {
    const { hashPassword } = await import("../password-utils")
    data.user_senha = await hashPassword(data.user_senha)
  }

  const result = await supabase().from("users").update(data).eq("id", id).select()

  if (result.error) throw result.error
  return result.data
}

export const deleteUser = async (id: number) => {
  const result = await supabase().from("users").delete().eq("id", id)

  if (result.error) throw result.error
  return result
}

export const getUserRoles = async () => {
  const { data, error } = await supabase().rpc("get_user_roles")

  if (error) throw error
  return data
}
