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
  comprovante_url?: string | null
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

export const getFreteBalance = async (freteId: number) => {
  try {
    Logger.info("frete-service", "Calculating frete balance", { freteId })

    // Get the frete to get its total value
    const frete = await getFrete(freteId)
    if (!frete) {
      throw new Error("Frete não encontrado")
    }

    // Get all entries related to this frete
    const { data: entradas, error: entradasError } = await supabase()
      .from("entrada")
      .select("entrada_valor")
      .eq("entrada_frete_id", freteId)

    if (entradasError) {
      Logger.error("frete-service", "Failed to fetch frete entries", {
        error: entradasError,
        freteId,
      })
      throw entradasError
    }

    // Get all expenses related to this frete
    const { data: despesas, error: despesasError } = await supabase()
      .from("despesa")
      .select("despesa_valor")
      .eq("despesa_frete_id", freteId)

    if (despesasError) {
      Logger.error("frete-service", "Failed to fetch frete expenses", {
        error: despesasError,
        freteId,
      })
      throw despesasError
    }

    // Calculate total entries
    const totalEntradas = entradas.reduce((acc, entrada) => acc + (entrada.entrada_valor || 0), 0)

    // Calculate total expenses
    const totalDespesas = despesas.reduce((acc, despesa) => acc + (despesa.despesa_valor || 0), 0)

    // Calculate balance
    const saldo = totalEntradas - totalDespesas

    Logger.info("frete-service", "Successfully calculated frete balance", {
      freteId,
      totalEntradas,
      totalDespesas,
      saldo,
    })

    return {
      saldo,
      totalEntradas,
      totalDespesas,
      valorFrete: frete.frete_valor_total || 0,
    }
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while calculating frete balance", {
      error,
      freteId,
    })
    throw error
  }
}

export const uploadComprovante = async (file: File, freteId: number) => {
  try {
    Logger.info("frete-service", "Uploading comprovante", { freteId })

    const fileExt = file.name.split(".").pop()
    const fileName = `${freteId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase().storage.from("notasfiscais").upload(filePath, file)

    if (error) {
      Logger.error("frete-service", "Failed to upload comprovante", { error })
      throw error
    }

    const {
      data: { publicUrl },
    } = supabase().storage.from("notasfiscais").getPublicUrl(filePath)

    // Update the frete with the comprovante URL
    await updateFrete(freteId, { comprovante_url: publicUrl })

    Logger.info("frete-service", "Successfully uploaded comprovante", { freteId })
    return publicUrl
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while uploading comprovante", { error })
    throw error
  }
}

export const deleteComprovante = async (freteId: number, url: string) => {
  try {
    Logger.info("frete-service", "Deleting comprovante", { freteId })

    // Extract filename from URL
    const fileName = url.split("/").pop()
    if (!fileName) throw new Error("Invalid file URL")

    const { error } = await supabase().storage.from("notasfiscais").remove([fileName])

    if (error) {
      Logger.error("frete-service", "Failed to delete comprovante", { error })
      throw error
    }

    // Update the frete to remove the comprovante URL
    await updateFrete(freteId, { comprovante_url: null })

    Logger.info("frete-service", "Successfully deleted comprovante", { freteId })
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while deleting comprovante", { error })
    throw error
  }
}
