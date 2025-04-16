"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"
import { Logger } from "../logger"

export interface FreteData {
  frete_nome: string
  frete_veiculo: number | null
  frete_agenciador: number | null
  frete_motorista: number | null
  frete_origem: string | null
  frete_destino: string | null
  frete_distancia: number | null
  frete_peso: number[]
  frete_valor_tonelada: number | null
  frete_valor_total: number | null
  created_at?: string
}

export const getAllFrete = unstable_cache(
  async () => {
    try {
      Logger.info("frete-service", "Fetching all fretes")
      const { data, error } = await supabase()
        .from("frete")
        .select(
          `
          *,
          veiculo:frete_veiculo(id, veiculo_nome),
          agenciador:frete_agenciador(id, agenciador_nome),
          motorista:frete_motorista(id, motorista_nome)
        `
        )
        .order("created_at", { ascending: false })

      if (error) {
        Logger.error("frete-service", "Failed to fetch all fretes", { error })
        throw error
      }

      Logger.info("frete-service", "Successfully fetched all fretes", { count: data.length })
      return data
    } catch (error) {
      Logger.error("frete-service", "Unexpected error while fetching all fretes", { error })
      throw error
    }
  },
  ["fretes-list"],
  {
    revalidate: 60,
    tags: ["fretes"],
  }
)

export const getFrete = unstable_cache(
  async (id: number) => {
    try {
      Logger.info("frete-service", "Fetching frete by id", { id })
      const { data, error } = await supabase()
        .from("frete")
        .select(
          `
          *,
          veiculo:frete_veiculo(id, veiculo_nome),
          agenciador:frete_agenciador(id, agenciador_nome),
          motorista:frete_motorista(id, motorista_nome)
        `
        )
        .eq("id", id)
        .single()

      if (error) {
        Logger.error("frete-service", "Failed to fetch frete by id", { error, id })
        throw error
      }

      Logger.info("frete-service", "Successfully fetched frete by id", { id })
      return data
    } catch (error) {
      Logger.error("frete-service", "Unexpected error while fetching frete by id", { error, id })
      throw error
    }
  },
  ["frete-detail"],
  {
    revalidate: 60,
    tags: ["fretes", "frete"],
  }
)

export const createFrete = async (data: FreteData) => {
  try {
    Logger.info("frete-service", "Creating new frete", {
      freteData: {
        ...data,
        frete_peso: data.frete_peso.length,
      },
    })

    const valorTotal =
      data.frete_peso.reduce((acc, peso) => acc + peso, 0) * (data.frete_valor_tonelada || 0)
    Logger.info("frete-service", "Calculated total value for frete", { valorTotal })

    const result = await supabase()
      .from("frete")
      .insert({
        ...data,
        frete_valor_total: valorTotal,
      })
      .select()

    if (result.error) {
      Logger.error("frete-service", "Failed to create frete", { error: result.error })
      throw result.error
    }

    revalidateTag("fretes")
    Logger.info("frete-service", "Successfully created frete", { freteId: result.data[0].id })
    return result.data
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while creating frete", { error })
    throw error
  }
}

export const updateFrete = async (id: number, data: Partial<FreteData>) => {
  try {
    Logger.info("frete-service", "Updating frete", {
      id,
      freteData: {
        ...data,
        frete_peso: data.frete_peso?.length,
      },
    })

    const updateData = { ...data }
    if (data.frete_peso || data.frete_valor_tonelada) {
      const currentFrete = await getFrete(id)
      const weights = data.frete_peso || currentFrete.frete_peso
      const pricePerTon = data.frete_valor_tonelada || currentFrete.frete_valor_tonelada
      updateData.frete_valor_total =
        weights.reduce((acc: number, peso: number) => acc + peso, 0) * (pricePerTon || 0)
      Logger.info("frete-service", "Recalculated total value for frete", {
        id,
        newTotalValue: updateData.frete_valor_total,
      })
    }

    const result = await supabase().from("frete").update(updateData).eq("id", id).select()

    if (result.error) {
      Logger.error("frete-service", "Failed to update frete", { error: result.error, id })
      throw result.error
    }

    revalidateTag("fretes")
    revalidateTag("frete")
    Logger.info("frete-service", "Successfully updated frete", { id })
    return result.data
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while updating frete", { error, id })
    throw error
  }
}

export const deleteFrete = async (id: number) => {
  try {
    Logger.info("frete-service", "Deleting frete", { id })
    const result = await supabase().from("frete").delete().eq("id", id)

    if (result.error) {
      Logger.error("frete-service", "Failed to delete frete", { error: result.error, id })
      throw result.error
    }

    revalidateTag("fretes")
    revalidateTag("frete")
    Logger.info("frete-service", "Successfully deleted frete", { id })
    return result
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while deleting frete", { error, id })
    throw error
  }
}

// Adicionar a função para dar baixa em um frete
export const darBaixaFrete = async (id: number, baixado = true) => {
  try {
    Logger.info("frete-service", "Dando baixa no frete", { id, baixado })
    const result = await supabase()
      .from("frete")
      .update({ frete_baixa: baixado })
      .eq("id", id)
      .select()

    if (result.error) {
      Logger.error("frete-service", "Failed to update frete status", { error: result.error, id })
      throw result.error
    }

    revalidateTag("fretes")
    revalidateTag("frete")
    Logger.info("frete-service", "Successfully updated frete status", { id })
    return result.data[0]
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while updating frete status", { error, id })
    throw error
  }
}
