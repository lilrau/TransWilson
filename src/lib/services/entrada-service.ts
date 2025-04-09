"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"

export interface EntradaData {
  id: number
  entrada_nome: string
  entrada_valor: number
  entrada_descricao: string | null
  entrada_tipo: string | null
  entrada_frete_id?: number | null
  created_at: string
  frete?: {
    id: number
    frete_nome: string
  } | null
}

export const getAllEntradas = unstable_cache(
  async () => {
    const { data, error } = await supabase()
      .from("entrada")
      .select(`
        *,
        frete:entrada_frete_id(id, frete_nome)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },
  ["entradas-list"],
  {
    revalidate: 60,
    tags: ["entradas"],
  },
)

export const getEntrada = unstable_cache(
  async (id: number) => {
    const { data, error } = await supabase()
      .from("entrada")
      .select(`
        *,
        frete:entrada_frete_id(id, frete_nome)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },
  ["entrada-detail"],
  {
    revalidate: 60,
    tags: ["entradas", "entrada"],
  },
)

export const createEntrada = async (data: Omit<EntradaData, "id" | "created_at">) => {
  const result = await supabase().from("entrada").insert(data).select()

  if (result.error) throw result.error

  revalidateTag("entradas")

  return result.data
}

export const updateEntrada = async (id: number, data: Partial<Omit<EntradaData, "id" | "created_at">>) => {
  const result = await supabase().from("entrada").update(data).eq("id", id).select()

  if (result.error) throw result.error

  revalidateTag("entradas")
  revalidateTag("entrada")

  return result.data
}

export const deleteEntrada = async (id: number) => {
  const result = await supabase().from("entrada").delete().eq("id", id)

  if (result.error) throw result.error

  revalidateTag("entradas")
  revalidateTag("entrada")

  return result
}

export const getTipoEntradaEnum = unstable_cache(
  async () => {
    const { data, error } = await supabase().rpc("get_tipo_entrada_enum")

    if (error) throw error
    return data
  },
  ["tipo-entrada-enum"],
  {
    revalidate: 3600, // Revalidar a cada hora, já que enums mudam com pouca frequência
    tags: ["enums", "tipo-entrada"],
  },
)
