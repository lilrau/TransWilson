"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { db } from "../db/index"
import { despesas, despesaSchema, veiculos, motoristas } from "../db/schema"
import { eq, sql } from "drizzle-orm"
import { Logger } from "../logger"
import { z } from "zod"

// Infer the type from the schema
type DespesaData = z.infer<typeof despesaSchema>

// Define the structure for joined data explicitly if needed
interface DespesaWithRelations extends DespesaData {
  id: number; // Ensure id is present
  veiculo: { id: number; veiculo_nome: string } | null;
  motorista: { id: number; motorista_nome: string } | null;
  created_at?: string; // Keep for compatibility if frontend expects it
}

export interface DespesaMotoristaResumo {
  totalPago: number
  despesas: DespesaWithRelations[] // Use the extended type
}

export const getAllDespesa = unstable_cache(
  async () => {
    try {
      Logger.info("despesa-service", "Fetching all despesas using Drizzle")
      const data = await db
        .select({
          ...despesas,
          veiculo: {
            id: veiculos.id,
            veiculo_nome: veiculos.veiculo_nome,
          },
          motorista: {
            id: motoristas.id,
            motorista_nome: motoristas.motorista_nome,
          },
        })
        .from(despesas)
        .leftJoin(veiculos, eq(despesas.despesa_veiculo, veiculos.id))
        .leftJoin(motoristas, eq(despesas.despesa_motorista, motoristas.id))
        // .orderBy(despesas.created_at) // Assuming created_at doesn't exist in schema, order by id or name
        .orderBy(despesas.id) // Order by ID for consistency

      Logger.info("despesa-service", "Successfully fetched all despesas using Drizzle", { count: data.length })
      // Map data to include a placeholder created_at if needed
      return data.map(d => ({ ...d, created_at: new Date().toISOString() })) as DespesaWithRelations[];
    } catch (error) {
      Logger.error("despesa-service", "Unexpected error while fetching all despesas using Drizzle", { error })
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
      Logger.info("despesa-service", "Fetching despesa by id using Drizzle", { id })
      const result = await db
        .select({
          ...despesas,
          veiculo: {
            id: veiculos.id,
            veiculo_nome: veiculos.veiculo_nome,
          },
          motorista: {
            id: motoristas.id,
            motorista_nome: motoristas.motorista_nome,
          },
        })
        .from(despesas)
        .leftJoin(veiculos, eq(despesas.despesa_veiculo, veiculos.id))
        .leftJoin(motoristas, eq(despesas.despesa_motorista, motoristas.id))
        .where(eq(despesas.id, id))
        .limit(1)

      if (result.length === 0) {
        Logger.warn("despesa-service", "Despesa not found by id using Drizzle", { id })
        return null
      }

      Logger.info("despesa-service", "Successfully fetched despesa by id using Drizzle", { id })
      // Map data to include a placeholder created_at if needed
      return { ...result[0], created_at: new Date().toISOString() } as DespesaWithRelations;
    } catch (error) {
      Logger.error("despesa-service", "Unexpected error while fetching despesa by id using Drizzle", {
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
  try {
    const validatedData = despesaSchema.parse(data)
    Logger.info("despesa-service", "Creating new despesa using Drizzle", { despesaData: validatedData })
    const result = await db.insert(despesas).values(validatedData).returning()

    revalidateTag("despesas")
    Logger.info("despesa-service", "Successfully created despesa using Drizzle", { despesaId: result[0].id })
    return result
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while creating despesa using Drizzle", { error })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

export const updateDespesa = async (id: number, data: Partial<DespesaData>) => {
  try {
    const validatedData = despesaSchema.partial().parse(data)
    Logger.info("despesa-service", "Updating despesa using Drizzle", { id, despesaData: validatedData })
    const result = await db.update(despesas).set(validatedData).where(eq(despesas.id, id)).returning()

    if (result.length === 0) {
      Logger.warn("despesa-service", "Despesa not found for update using Drizzle", { id })
      throw new Error(`Despesa with id ${id} not found.`)
    }

    revalidateTag("despesas")
    revalidateTag("despesa")

    Logger.info("despesa-service", "Successfully updated despesa using Drizzle", { id })
    return result
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while updating despesa using Drizzle", { error, id })
     if (error instanceof z.ZodError) {
       console.error("Validation error:", error.errors)
     }
    throw error
  }
}

export const deleteDespesa = async (id: number) => {
  try {
    Logger.info("despesa-service", "Deleting despesa using Drizzle", { id })
    const result = await db.delete(despesas).where(eq(despesas.id, id)).returning()

    if (result.length === 0) {
        Logger.warn("despesa-service", "Despesa not found for deletion using Drizzle", { id })
        throw new Error(`Despesa with id ${id} not found.`)
    }

    revalidateTag("despesas")
    revalidateTag("despesa")

    Logger.info("despesa-service", "Successfully deleted despesa using Drizzle", { id })
    return { success: true }
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while deleting despesa using Drizzle", { error, id })
    throw error
  }
}

export const getDespesasByMotorista = async (
  motoristaId: number
): Promise<DespesaMotoristaResumo> => {
  try {
    Logger.info("despesa-service", "Fetching despesas by motorista using Drizzle", { motoristaId })
    const data = await db
      .select({
        ...despesas,
        // Explicitly select related fields, even if null
        veiculo: {
          id: veiculos.id,
          veiculo_nome: veiculos.veiculo_nome,
        },
        motorista: {
          id: motoristas.id,
          motorista_nome: motoristas.motorista_nome,
        },
      })
      .from(despesas)
      .leftJoin(veiculos, eq(despesas.despesa_veiculo, veiculos.id))
      .leftJoin(motoristas, eq(despesas.despesa_motorista, motoristas.id))
      .where(eq(despesas.despesa_motorista, motoristaId))
      // .orderBy(despesas.created_at) // Order by ID or name if created_at not available
      .orderBy(despesas.id)

    Logger.info("despesa-service", "Successfully fetched despesas by motorista using Drizzle", { motoristaId, count: data.length })

    // Map data to include a placeholder created_at if needed
    const mappedData = data.map(d => ({ ...d, created_at: new Date().toISOString() })) as DespesaWithRelations[];

    // Calculate the total paid for 'Salários'
    const totalPago = mappedData
      .filter((despesa) => despesa.despesa_tipo === "Salários")
      // Ensure despesa_valor is treated as a number
      .reduce((acc, despesa) => acc + Number(despesa.despesa_valor || 0), 0)

    return {
      totalPago,
      despesas: mappedData,
    }
  } catch (error) {
    Logger.error("despesa-service", "Unexpected error while fetching despesas by motorista using Drizzle", { error, motoristaId })
    throw error
  }
}

// TODO: Reimplement getTipoDespesaEnum using Drizzle if needed.
// This could involve fetching distinct values from the despesa_tipo column
// or defining the enum types within the application code.
/*
export const getTipoDespesaEnum = unstable_cache(
  async () => {
    // Example: Fetch distinct values
    try {
      Logger.info("despesa-service", "Fetching distinct despesa_tipo values using Drizzle")
      const result = await db.selectDistinct({ tipo: despesas.despesa_tipo }).from(despesas);
      Logger.info("despesa-service", "Successfully fetched distinct despesa_tipo values", { count: result.length })
      return result.map(r => r.tipo);
    } catch (error) {
      Logger.error("despesa-service", "Failed to fetch distinct despesa_tipo values", { error })
      throw error
    }
    // Original Supabase RPC call:
    // const { data, error } = await supabase().rpc("get_tipo_despesa_enum")
    // if (error) throw error
    // return data
  },
  ["tipo-despesa-enum"],
  {
    revalidate: 3600, // Revalidar a cada hora
    tags: ["enums", "tipo-despesa"],
  }
)
*/
