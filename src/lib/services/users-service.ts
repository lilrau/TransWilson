"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"
import { hashPassword } from "../password-utils"

export interface UserData {
  user_nome: string
  user_user: string
  user_email: string
  user_senha?: string
  user_ativo: boolean
  user_created_at?: string
}

export const getAllUsers = unstable_cache(
  async () => {
    const { data, error } = await supabase()
      .from("users")
      .select("*")
      .order("user_nome", { ascending: true })

    if (error) throw error

    return data
  },
  ["users-list"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["users"],
  }
)

export const getUserById = unstable_cache(
  async (id: number) => {
    const { data, error } = await supabase().from("users").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },
  ["user-detail"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["users", "user"],
  }
)

export const getUserByUsername = unstable_cache(
  async (username: string) => {
    const { data, error } = await supabase()
      .from("users")
      .select("*")
      .eq("user_user", username)
      .single()

    if (error) throw error
    return data
  },
  ["user-by-username"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["users", "user"],
  }
)

export const createUser = async (data: UserData) => {
  // Se houver uma senha, aplica o hash antes de salvar
  if (data.user_senha) {
    data.user_senha = await hashPassword(data.user_senha)
  }

  const result = await supabase().from("users").insert(data).select()

  if (result.error) throw result.error

  // Invalidar o cache quando um novo usuário é criado
  revalidateTag("users")

  return result.data
}

export const updateUser = async (id: number, data: Partial<UserData>) => {
  console.log("Dados recebidos para atualização:", data)
  // Cria uma cópia do objeto de dados para não modificar o original
  const updatedData = { ...data }
  
  // Se houver uma senha e ela não estiver vazia, aplica o hash antes de atualizar
  if (updatedData.user_senha && updatedData.user_senha.length > 0) {
    updatedData.user_senha = await hashPassword(updatedData.user_senha)
  } else if (updatedData.user_senha !== undefined) {
    // Se a senha estiver definida mas vazia, remove o campo para não sobrescrever a senha existente
    delete updatedData.user_senha
  }
  
  console.log("Dados para atualização:", updatedData)

  const result = await supabase()
   .from("users")
   .update(updatedData)
   .eq("id", id)
   .select()

  if (result.error) throw result.error

  // Invalidar o cache quando um usuário é atualizado
  revalidateTag("users")
  revalidateTag("user")

  return result.data
}

export const deleteUser = async (id: number) => {
  const result = await supabase().from("users").delete().eq("id", id)

  if (result.error) throw result.error

  // Invalidar o cache quando um usuário é excluído
  revalidateTag("users")
  revalidateTag("user")

  return result
}
