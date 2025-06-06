"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"
import { Logger } from "../logger"

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
    motorista?: {
      id: number
    } | null
  } | null
}

export const getAllEntradas = unstable_cache(
  async () => {
    try {
      Logger.info("entrada-service", "Fetching all entradas")
      const { data, error } = await supabase()
        .from("entrada")
        .select(
          `
          *,
          frete:entrada_frete_id(
            id, 
            frete_nome, 
            frete_baixa,
            veiculo:frete_veiculo(id, veiculo_nome),
            motorista:frete_motorista(id)
          )
        `
        )
        .order("created_at", { ascending: false })

      if (error) {
        Logger.error("entrada-service", "Failed to fetch all entradas", { error })
        throw error
      }

      Logger.info("entrada-service", "Successfully fetched all entradas", { count: data.length })
      return data
    } catch (error) {
      Logger.error("entrada-service", "Unexpected error while fetching all entradas", { error })
      throw error
    }
  },
  ["entradas-list"],
  {
    revalidate: 60,
    tags: ["entradas"],
  }
)

export const getEntrada = unstable_cache(
  async (id: number) => {
    try {
      Logger.info("entrada-service", "Fetching entrada by id", { id })
      const { data, error } = await supabase()
        .from("entrada")
        .select(
          `
          *,
          frete:entrada_frete_id(id, frete_nome, motorista:frete_motorista(id))
        `
        )
        .eq("id", id)
        .single()

      if (error) {
        Logger.error("entrada-service", "Failed to fetch entrada by id", { error, id })
        throw error
      }

      Logger.info("entrada-service", "Successfully fetched entrada by id", { id })
      return data
    } catch (error) {
      Logger.error("entrada-service", "Unexpected error while fetching entrada by id", {
        error,
        id,
      })
      throw error
    }
  },
  ["entrada-detail"],
  {
    revalidate: 60,
    tags: ["entradas", "entrada"],
  }
)

export const createEntrada = async (data: Omit<EntradaData, "id">) => {
  try {
    Logger.info("entrada-service", "Creating new entrada", { entradaData: data })
    const result = await supabase().from("entrada").insert(data).select()

    if (result.error) {
      Logger.error("entrada-service", "Failed to create entrada", { error: result.error })
      throw result.error
    }

    revalidateTag("entradas")
    Logger.info("entrada-service", "Successfully created entrada", { entradaId: result.data[0].id })
    return result.data
  } catch (error) {
    Logger.error("entrada-service", "Unexpected error while creating entrada", { error })
    throw error
  }
}

export const updateEntrada = async (id: number, data: Partial<Omit<EntradaData, "id">>) => {
  try {
    Logger.info("entrada-service", "Updating entrada", { id, entradaData: data })
    const result = await supabase().from("entrada").update(data).eq("id", id).select()

    if (result.error) {
      Logger.error("entrada-service", "Failed to update entrada", { error: result.error, id })
      throw result.error
    }

    revalidateTag("entradas")
    revalidateTag("entrada")

    Logger.info("entrada-service", "Successfully updated entrada", { id })
    return result.data
  } catch (error) {
    Logger.error("entrada-service", "Unexpected error while updating entrada", { error, id })
    throw error
  }
}

export const deleteEntrada = async (id: number) => {
  try {
    Logger.info("entrada-service", "Deleting entrada", { id })
    const result = await supabase().from("entrada").delete().eq("id", id)

    if (result.error) {
      Logger.error("entrada-service", "Failed to delete entrada", { error: result.error, id })
      throw result.error
    }

    revalidateTag("entradas")
    revalidateTag("entrada")

    Logger.info("entrada-service", "Successfully deleted entrada", { id })
    return result
  } catch (error) {
    Logger.error("entrada-service", "Unexpected error while deleting entrada", { error, id })
    throw error
  }
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
  }
)
