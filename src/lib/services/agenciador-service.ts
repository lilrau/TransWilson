"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"
import { Logger } from "../logger"

export interface AgenciadorData {
  agenciador_nome: string
  agenciador_cnpj?: string
  agenciador_telefone?: string
  created_at?: string
}

export const getAllAgenciador = unstable_cache(
  async () => {
    try {
      Logger.info("agenciador-service", "Fetching all agenciadores")
      const { data, error } = await supabase()
        .from("agenciador")
        .select("*")
        .order("agenciador_nome", { ascending: true })

      if (error) {
        Logger.error("agenciador-service", "Failed to fetch all agenciadores", { error })
        throw error
      }

      Logger.info("agenciador-service", "Successfully fetched all agenciadores", {
        count: data.length,
      })
      return data
    } catch (error) {
      Logger.error("agenciador-service", "Unexpected error while fetching all agenciadores", {
        error,
      })
      throw error
    }
  },
  ["agenciadores-list"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["agenciadores"],
  }
)

export const getAgenciador = unstable_cache(
  async (id: number) => {
    try {
      Logger.info("agenciador-service", "Fetching agenciador by id", { id })
      const { data, error } = await supabase().from("agenciador").select("*").eq("id", id).single()

      if (error) {
        Logger.error("agenciador-service", "Failed to fetch agenciador by id", { error, id })
        throw error
      }

      Logger.info("agenciador-service", "Successfully fetched agenciador by id", { id })
      return data
    } catch (error) {
      Logger.error("agenciador-service", "Unexpected error while fetching agenciador by id", {
        error,
        id,
      })
      throw error
    }
  },
  ["agenciador-detail"],
  {
    revalidate: 60,
    tags: ["agenciadores", "agenciador"],
  }
)

export const createAgenciador = async (data: AgenciadorData) => {
  try {
    Logger.info("agenciador-service", "Creating new agenciador", { agenciadorData: data })
    const result = await supabase().from("agenciador").insert(data).select()

    if (result.error) {
      Logger.error("agenciador-service", "Failed to create agenciador", { error: result.error })
      throw result.error
    }

    revalidateTag("agenciadores")
    Logger.info("agenciador-service", "Successfully created agenciador", {
      agenciadorId: result.data[0].id,
    })
    return result.data
  } catch (error) {
    Logger.error("agenciador-service", "Unexpected error while creating agenciador", { error })
    throw error
  }
}

export const updateAgenciador = async (id: number, data: Partial<AgenciadorData>) => {
  try {
    Logger.info("agenciador-service", "Updating agenciador", { id, agenciadorData: data })
    const result = await supabase().from("agenciador").update(data).eq("id", id).select()

    if (result.error) {
      Logger.error("agenciador-service", "Failed to update agenciador", { error: result.error, id })
      throw result.error
    }

    revalidateTag("agenciadores")
    revalidateTag("agenciador")

    Logger.info("agenciador-service", "Successfully updated agenciador", { id })
    return result.data
  } catch (error) {
    Logger.error("agenciador-service", "Unexpected error while updating agenciador", { error, id })
    throw error
  }
}

export const deleteAgenciador = async (id: number) => {
  try {
    Logger.info("agenciador-service", "Deleting agenciador", { id })
    const result = await supabase().from("agenciador").delete().eq("id", id)

    if (result.error) {
      Logger.error("agenciador-service", "Failed to delete agenciador", { error: result.error, id })
      throw result.error
    }

    revalidateTag("agenciadores")
    revalidateTag("agenciador")

    Logger.info("agenciador-service", "Successfully deleted agenciador", { id })
    return result
  } catch (error) {
    Logger.error("agenciador-service", "Unexpected error while deleting agenciador", { error, id })
    throw error
  }
}
