"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"
import { Logger } from "../logger"

export interface DespesaData {
  despesa_nome: string
  despesa_descricao: string | null
  despesa_tipo: string
  despesa_valor: number
  despesa_veiculo: number | null
  despesa_motorista: number | null
  created_at?: string
  comprovante_url?: string | null
  despesa_metodo_pagamento?: string | null
  despesa_parcelas?: number
  despesa_frete_id?: number
}

export interface DespesaMotoristaResumo {
  totalPago: number
  despesas: DespesaData[]
}

export const getAllDespesa = unstable_cache(
  async () => {
    try {
      Logger.info("despesa-service", "Fetching all despesas")
      const { data, error } = await supabase()
        .from("despesa")
        .select(
          `
          *,
          veiculo:despesa_veiculo(id, veiculo_nome),
          motorista:despesa_motorista(id, motorista_nome)
        `
        )
        .order("created_at", { ascending: false })

      if (error) {
        Logger.error("despesa-service", "Failed to fetch all despesas", { error })
        throw error
      }

      Logger.info("despesa-service", "Successfully fetched all despesas", { count: data.length })
      return data
    } catch (error) {
      Logger.error("despesa-service", "Unexpected error while fetching all despesas", { error })
      throw error
    }
  },
  ["despesas-list"],
  {
    revalidate: 60,
    tags: ["despesas"],
  }
)

export const getDespesa = unstable_cache(
  async (id: number) => {
    try {
      Logger.info("despesa-service", "Fetching despesa by id", { id })
      const { data, error } = await supabase()
        .from("despesa")
        .select(
          `
          *,
          veiculo:despesa_veiculo(id, veiculo_nome),
          motorista:despesa_motorista(id, motorista_nome)
        `
        )
        .eq("id", id)
        .single()

      if (error) {
        Logger.error("despesa-service", "Failed to fetch despesa by id", { error, id })
        throw error
      }

      Logger.info("despesa-service", "Successfully fetched despesa by id", { id })
      return data
    } catch (error) {
      Logger.error("despesa-service", "Unexpected error while fetching despesa by id", {
        error,
        id,
      })
      throw error
    }
  },
  ["despesa-detail"],
  {
    revalidate: 60,
    tags: ["despesas", "despesa"],
  }
)

export const createDespesa = async (data: DespesaData) => {
  Logger.info("despesa-service", "Despesa data", { data })
  try {
    Logger.info("despesa-service", "Creating new despesa", { despesaData: data })
    let result
    if (data.despesa_parcelas && data.despesa_parcelas == 1) {
      result = await supabase().from("despesa").insert(data).select()
    } else {
      const parcelas = data.despesa_parcelas || 1
      delete data.despesa_parcelas 
      const valorPorParcela = data.despesa_valor / parcelas

      const despesas = Array.from({ length: parcelas }, (_, index) => ({
        ...data,
        despesa_nome: `${data.despesa_nome} - Parcela ${index + 1}`,
        despesa_valor: valorPorParcela,
        created_at: data.created_at || new Date(new Date().setMonth(new Date().getMonth() + index)).toISOString(),
      }))

      result = await supabase().from("despesa").insert(despesas).select()
    }

    if (result.error) {
      Logger.error("despesa-service", "Failed to create despesa", { error: result.error })
      throw result.error
    }

    revalidateTag("despesas")
    Logger.info("despesa-service", "Successfully created despesa", { despesaId: result.data[0].id })
    return result.data
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while creating despesa", { error })
    throw error
  }
}

export const updateDespesa = async (id: number, data: Partial<DespesaData>) => {
  try {
    Logger.info("despesa-service", "Updating despesa", { id, despesaData: data })
    const result = await supabase().from("despesa").update(data).eq("id", id).select()

    if (result.error) {
      Logger.error("despesa-service", "Failed to update despesa", { error: result.error, id })
      throw result.error
    }

    revalidateTag("despesas")
    revalidateTag("despesa")

    Logger.info("despesa-service", "Successfully updated despesa", { id })
    return result.data
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while updating despesa", { error, id })
    throw error
  }
}

export const deleteDespesa = async (id: number) => {
  try {
    Logger.info("despesa-service", "Deleting despesa", { id })
    const result = await supabase().from("despesa").delete().eq("id", id)

    if (result.error) {
      Logger.error("despesa-service", "Failed to delete despesa", { error: result.error, id })
      throw result.error
    }

    revalidateTag("despesas")
    revalidateTag("despesa")

    Logger.info("despesa-service", "Successfully deleted despesa", { id })
    return result
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while deleting despesa", { error, id })
    throw error
  }
}

export const getDespesasByMotorista = async (
  motoristaId: number
): Promise<DespesaMotoristaResumo> => {
  const { data, error } = await supabase()
    .from("despesa")
    .select("*")
    .eq("despesa_motorista", motoristaId)
    .order("created_at", { ascending: false })

  if (error) throw error

  // Calcular o total pago em salários
  const totalPago = data
    .filter((despesa) => despesa.despesa_tipo === "Salários")
    .reduce((acc, despesa) => acc + despesa.despesa_valor, 0)

  return {
    totalPago,
    despesas: data,
  }
}

export const getTipoDespesaEnum = unstable_cache(
  async () => {
    const { data, error } = await supabase().rpc("get_tipo_despesa_enum")

    if (error) throw error
    return data
  },
  ["tipo-despesa-enum"],
  {
    revalidate: 3600, // Revalidar a cada hora, já que enums mudam com pouca frequência
    tags: ["enums", "tipo-despesa"],
  }
)

export const uploadComprovante = async (file: File, despesaId: number) => {
  try {
    Logger.info("despesa-service", "Uploading comprovante", { despesaId })
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${despesaId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase()
      .storage
      .from('notasfiscais')
      .upload(filePath, file)

    if (error) {
      Logger.error("despesa-service", "Failed to upload comprovante", { error })
      throw error
    }

    const { data: { publicUrl } } = supabase()
      .storage
      .from('notasfiscais')
      .getPublicUrl(filePath)

    // Update the despesa with the comprovante URL
    await updateDespesa(despesaId, { comprovante_url: publicUrl })

    Logger.info("despesa-service", "Successfully uploaded comprovante", { despesaId })
    return publicUrl
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while uploading comprovante", { error })
    throw error
  }
}

export const deleteComprovante = async (despesaId: number, url: string) => {
  try {
    Logger.info("despesa-service", "Deleting comprovante", { despesaId })
    
    // Extract filename from URL
    const fileName = url.split('/').pop()
    if (!fileName) throw new Error('Invalid file URL')

    const { error } = await supabase()
      .storage
      .from('notasfiscais')
      .remove([fileName])

    if (error) {
      Logger.error("despesa-service", "Failed to delete comprovante", { error })
      throw error
    }

    // Update the despesa to remove the comprovante URL
    await updateDespesa(despesaId, { comprovante_url: null })

    Logger.info("despesa-service", "Successfully deleted comprovante", { despesaId })
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while deleting comprovante", { error })
    throw error
  }
}
