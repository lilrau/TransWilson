"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"
import { hashPassword } from "../password-utils"
import { Logger } from "../logger"

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
  motorista_senha?: string
}

export const getAllMotorista = unstable_cache(
  async (): Promise<MotoristaData[]> => {
    try {
      Logger.info('motorista-service', 'Fetching all motoristas')
      const { data, error } = await supabase()
        .from("motorista")
        .select("*")
        .order("motorista_nome", { ascending: true })

      if (error) {
        Logger.error('motorista-service', 'Failed to fetch all motoristas', { error })
        throw error
      }

      Logger.info('motorista-service', 'Successfully fetched all motoristas', { count: data.length })
      return data
    } catch (error) {
      Logger.error('motorista-service', 'Unexpected error while fetching all motoristas', { error })
      throw error
    }
  },
  ["motoristas-list"],
  {
    revalidate: 60,
    tags: ["motoristas"],
  }
)

export const getMotorista = unstable_cache(
  async (id: number): Promise<MotoristaData> => {
    try {
      Logger.info('motorista-service', 'Fetching motorista by id', { id })
      const { data, error } = await supabase().from("motorista").select("*").eq("id", id).single()

      if (error) {
        Logger.error('motorista-service', 'Failed to fetch motorista by id', { error, id })
        throw error
      }

      Logger.info('motorista-service', 'Successfully fetched motorista by id', { id })
      return data
    } catch (error) {
      Logger.error('motorista-service', 'Unexpected error while fetching motorista by id', { error, id })
      throw error
    }
  },
  ["motorista-detail"],
  {
    revalidate: 60,
    tags: ["motoristas", "motorista"],
  }
)

export const createMotorista = async (data: Partial<MotoristaData>) => {
  try {
    Logger.info('motorista-service', 'Creating new motorista', { 
      motoristaData: { 
        ...data, 
        motorista_senha: undefined 
      } 
    })

    if (data.motorista_senha) {
      data.motorista_senha = await hashPassword(data.motorista_senha)
    }

    const result = await supabase().from("motorista").insert(data).select()

    if (result.error) {
      Logger.error('motorista-service', 'Failed to create motorista', { error: result.error })
      throw result.error
    }

    revalidateTag("motoristas")
    Logger.info('motorista-service', 'Successfully created motorista', { motoristaId: result.data[0].id })
    return result.data
  } catch (error) {
    Logger.error('motorista-service', 'Unexpected error while creating motorista', { error })
    throw error
  }
}

export const updateMotorista = async (id: number, data: Partial<MotoristaData>) => {
  try {
    Logger.info('motorista-service', 'Updating motorista', { 
      id, 
      motoristaData: { 
        ...data, 
        motorista_senha: undefined 
      } 
    })

    if (data.motorista_senha && data.motorista_senha.length > 0) {
      data.motorista_senha = await hashPassword(data.motorista_senha)
    } else if (data.motorista_senha !== undefined) {
      delete data.motorista_senha
    }

    const result = await supabase().from("motorista").update(data).eq("id", id).select()

    if (result.error) {
      Logger.error('motorista-service', 'Failed to update motorista', { error: result.error, id })
      throw result.error
    }

    revalidateTag("motoristas")
    revalidateTag("motorista")
    Logger.info('motorista-service', 'Successfully updated motorista', { id })
    return result.data
  } catch (error) {
    Logger.error('motorista-service', 'Unexpected error while updating motorista', { error, id })
    throw error
  }
}

export const deleteMotorista = async (id: number) => {
  try {
    Logger.info('motorista-service', 'Deleting motorista', { id })
    const result = await supabase().from("motorista").delete().eq("id", id)

    if (result.error?.code === "23503") {
      const error = new Error("Não é possível excluir o motorista porque há pedidos associados a ele.")
      Logger.error('motorista-service', 'Failed to delete motorista - associated orders exist', { error, id })
      throw error
    } else if (result.error) {
      Logger.error('motorista-service', 'Failed to delete motorista', { error: result.error, id })
      throw result.error
    }

    revalidateTag("motoristas")
    revalidateTag("motorista")
    Logger.info('motorista-service', 'Successfully deleted motorista', { id })
    return result
  } catch (error) {
    Logger.error('motorista-service', 'Unexpected error while deleting motorista', { error, id })
    throw error
  }
}

export const getMotoristaByCredentials = async (cnh: string): Promise<MotoristaData | null> => {
  try {
    Logger.info('motorista-service', 'Fetching motorista by CNH', { cnh })
    const { data, error } = await supabase()
      .from("motorista")
      .select("*")
      .eq("motorista_cnh", cnh)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        Logger.info('motorista-service', 'No motorista found with provided CNH', { cnh })
        return null
      }
      Logger.error('motorista-service', 'Failed to fetch motorista by CNH', { error, cnh })
      throw error
    }

    Logger.info('motorista-service', 'Successfully fetched motorista by CNH', { cnh })
    return data
  } catch (error) {
    Logger.error('motorista-service', 'Unexpected error while fetching motorista by CNH', { error, cnh })
    throw error
  }
}
