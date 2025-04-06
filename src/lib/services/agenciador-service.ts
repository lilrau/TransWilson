"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"

export interface AgenciadorData {
  nome: string
  created_at?: string
}

export const getAllAgenciador = unstable_cache(
  async () => {
    const { data, error } = await supabase()
      .from("agenciador")
      .select("*")
      .order("nome", { ascending: true })

    if (error) throw error

    return data
  },
  ["agenciadores-list"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["agenciadores"]
  }
)

export const getAgenciador = unstable_cache(
  async (id: number) => {
    const { data, error } = await supabase().from("agenciador").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },
  ["agenciador-detail"],
  {
    revalidate: 60,
    tags: ["agenciadores", "agenciador"]
  }
)

export const createAgenciador = async (data: AgenciadorData) => {
  const result = await supabase().from("agenciador").insert(data).select()

  if (result.error) throw result.error
  
  revalidateTag("agenciadores")
  
  return result.data
}

export const updateAgenciador = async (id: number, data: Partial<AgenciadorData>) => {
  const result = await supabase().from("agenciador").update(data).eq("id", id).select()

  if (result.error) throw result.error
  
  revalidateTag("agenciadores")
  revalidateTag("agenciador")
  
  return result.data
}

export const deleteAgenciador = async (id: number) => {
  const result = await supabase().from("agenciador").delete().eq("id", id)
  
  if (result.error) throw result.error
  
  revalidateTag("agenciadores")
  revalidateTag("agenciador")
  
  return result
}