"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"

export interface MotoristaData {
  id: number
  motorista_nome: string
  motorista_cnh: string
  motorista_salario: number
  motorista_frete: number
  motorista_estadia: number
  motorista_admissao: Date | string
  motorista_ult_acesso?: string | null
  motorista_created_at?: string
}

export const getAllMotorista = unstable_cache(
  async (): Promise<MotoristaData[]> => {
    const { data, error } = await supabase()
      .from("motorista")
      .select("*")
      .order("motorista_nome", { ascending: true })

    if (error) throw error

    return data
  },
  ["motoristas-list"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["motoristas"],
  }
)

export const getMotorista = unstable_cache(
  async (id: number): Promise<MotoristaData> => {
    const { data, error } = await supabase().from("motorista").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },
  ["motorista-detail"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["motoristas", "motorista"],
  }
)

export const createMotorista = async (data: Partial<MotoristaData>) => {
  const result = await supabase().from("motorista").insert(data).select()

  if (result.error) throw result.error

  // Invalidar o cache quando um novo motorista é criado
  revalidateTag("motoristas")

  return result.data
}

export const updateMotorista = async (id: number, data: Partial<MotoristaData>) => {
  const result = await supabase().from("motorista").update(data).eq("id", id).select()

  if (result.error) throw result.error

  // Invalidar o cache quando um motorista é atualizado
  revalidateTag("motoristas")
  revalidateTag("motorista")

  return result.data
}

export const deleteMotorista = async (id: number) => {
  const result = await supabase().from("motorista").delete().eq("id", id)

  if (result.error?.code === "23503")
    throw new Error("Não é possível excluir o motorista porque há pedidos associados a ele.")
  
  // Invalidar o cache quando um motorista é excluído
  revalidateTag("motoristas")
  revalidateTag("motorista")
}
