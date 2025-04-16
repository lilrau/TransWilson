"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"
import { Logger } from "../logger"

export interface VeiculoData {
  veiculo_nome: string
  veiculo_placa: string
  veiculo_reboque: string
  veiculo_ano?: number | null
  veiculo_km_inicial?: number | null
  veiculo_litro_inicial?: number | null
  veiculo_motorista?: number | null
  veiculo_created_at?: string
}

export const getAllVeiculos = unstable_cache(
  async () => {
    try {
      Logger.info("veiculo-service", "Fetching all veiculos")
      const { data, error } = await supabase()
        .from("veiculo")
        .select(
          `
          *,
          motorista:veiculo_motorista(id, motorista_nome)
        `
        )
        .order("veiculo_nome", { ascending: true })

      if (error) {
        Logger.error("veiculo-service", "Failed to fetch all veiculos", { error })
        throw error
      }

      Logger.info("veiculo-service", "Successfully fetched all veiculos", { count: data.length })
      return data
    } catch (error) {
      Logger.error("veiculo-service", "Unexpected error while fetching all veiculos", { error })
      throw error
    }
  },
  ["veiculos-list"],
  {
    revalidate: 60,
    tags: ["veiculos"],
  }
)

export const getVeiculo = unstable_cache(
  async (id: number) => {
    try {
      Logger.info("veiculo-service", "Fetching veiculo by id", { id })
      const { data, error } = await supabase().from("veiculo").select("*").eq("id", id).single()

      if (error) {
        Logger.error("veiculo-service", "Failed to fetch veiculo by id", { error, id })
        throw error
      }

      Logger.info("veiculo-service", "Successfully fetched veiculo by id", { id })
      return data
    } catch (error) {
      Logger.error("veiculo-service", "Unexpected error while fetching veiculo by id", {
        error,
        id,
      })
      throw error
    }
  },
  ["veiculo-detail"],
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ["veiculos", "veiculo"],
  }
)

export const createVeiculo = async (data: VeiculoData) => {
  try {
    Logger.info("veiculo-service", "Creating new veiculo", { veiculoData: data })
    const result = await supabase().from("veiculo").insert(data).select()

    if (result.error) {
      Logger.error("veiculo-service", "Failed to create veiculo", { error: result.error })
      throw result.error
    }

    revalidateTag("veiculos")
    Logger.info("veiculo-service", "Successfully created veiculo", { veiculoId: result.data[0].id })
    return result.data
  } catch (error) {
    Logger.error("veiculo-service", "Unexpected error while creating veiculo", { error })
    throw error
  }
}

export const updateVeiculo = async (id: number, data: Partial<VeiculoData>) => {
  try {
    Logger.info("veiculo-service", "Updating veiculo", { id, veiculoData: data })
    const result = await supabase().from("veiculo").update(data).eq("id", id).select()

    if (result.error) {
      Logger.error("veiculo-service", "Failed to update veiculo", { error: result.error, id })
      throw result.error
    }

    revalidateTag("veiculos")
    revalidateTag("veiculo")

    Logger.info("veiculo-service", "Successfully updated veiculo", { id })
    return result.data
  } catch (error) {
    Logger.error("veiculo-service", "Unexpected error while updating veiculo", { error, id })
    throw error
  }
}

export const deleteVeiculo = async (id: number) => {
  try {
    Logger.info("veiculo-service", "Deleting veiculo", { id })
    const result = await supabase().from("veiculo").delete().eq("id", id)

    if (result.error) {
      Logger.error("veiculo-service", "Failed to delete veiculo", { error: result.error, id })
      throw result.error
    }

    revalidateTag("veiculos")
    revalidateTag("veiculo")

    Logger.info("veiculo-service", "Successfully deleted veiculo", { id })
    return result
  } catch (error) {
    Logger.error("veiculo-service", "Unexpected error while deleting veiculo", { error, id })
    throw error
  }
}
