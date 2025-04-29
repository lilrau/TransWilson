"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { db } from "../db/index"
import { veiculos, veiculoSchema, motoristas } from "../db/schema"
import { eq } from "drizzle-orm"
import { Logger } from "../logger"
import { z } from "zod"

// Infer the type from the schema
type VeiculoData = z.infer<typeof veiculoSchema> & { id: number } // Add id explicitly

// Define the structure for joined data explicitly
interface VeiculoWithRelations extends Omit<VeiculoData, 'veiculo_motorista'> { // Omit original foreign key
  id: number;
  created_at?: string; // Keep for compatibility if frontend expects it
  motorista: {
    id: number;
    motorista_nome: string;
  } | null;
}

// Helper to map Drizzle result (numeric/integer might be string/number)
const mapQueryResultToVeiculoData = (result: any): VeiculoData => ({
  ...result,
  veiculo_ano: result.veiculo_ano !== null ? Number(result.veiculo_ano) : null,
  veiculo_km_inicial: result.veiculo_km_inicial !== null ? Number(result.veiculo_km_inicial) : null,
  veiculo_litro_inicial: result.veiculo_litro_inicial !== null ? Number(result.veiculo_litro_inicial) : null,
  veiculo_motorista: result.veiculo_motorista !== null ? Number(result.veiculo_motorista) : null,
});

export const getAllVeiculos = unstable_cache(
  async (): Promise<VeiculoWithRelations[]> => {
    try {
      Logger.info("veiculo-service", "Fetching all veiculos using Drizzle")
      const data = await db
        .select({
          ...veiculos,
          motorista: {
            id: motoristas.id,
            motorista_nome: motoristas.motorista_nome,
          },
        })
        .from(veiculos)
        .leftJoin(motoristas, eq(veiculos.veiculo_motorista, motoristas.id))
        .orderBy(veiculos.veiculo_nome)

      Logger.info("veiculo-service", "Successfully fetched all veiculos using Drizzle", { count: data.length })
      // Map data and add placeholder created_at
      return data.map(v => ({
        ...mapQueryResultToVeiculoData(v),
        motorista: v.motorista,
        created_at: new Date().toISOString(),
      })) as VeiculoWithRelations[];
    } catch (error) {
      Logger.error("veiculo-service", "Unexpected error while fetching all veiculos using Drizzle", { error })
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
  async (id: number): Promise<VeiculoData | null> => {
    try {
      Logger.info("veiculo-service", "Fetching veiculo by id using Drizzle", { id })
      // Note: Original Supabase query didn't join motorista here, so Drizzle won't either
      const result = await db.select().from(veiculos).where(eq(veiculos.id, id)).limit(1)

      if (result.length === 0) {
        Logger.warn("veiculo-service", "Veiculo not found by id using Drizzle", { id })
        return null
      }

      Logger.info("veiculo-service", "Successfully fetched veiculo by id using Drizzle", { id })
      // Map result to ensure correct types
      return mapQueryResultToVeiculoData(result[0]);
    } catch (error) {
      Logger.error("veiculo-service", "Unexpected error while fetching veiculo by id using Drizzle", {
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

// Adjust input type to match schema (omit id, created_at)
export const createVeiculo = async (data: Omit<VeiculoData, 'id'>) => {
  try {
    const validatedData = veiculoSchema.parse(data)
    Logger.info("veiculo-service", "Creating new veiculo using Drizzle", { veiculoData: validatedData })

    // Prepare data for insertion (handle potential type mismatches if necessary, though schema looks ok)
    const insertData = {
        ...validatedData,
        // Ensure numeric/integer fields are correctly formatted if DB expects strings
        // veiculo_ano: validatedData.veiculo_ano?.toString(),
        // veiculo_km_inicial: validatedData.veiculo_km_inicial?.toString(),
        // veiculo_litro_inicial: validatedData.veiculo_litro_inicial?.toString(),
    };

    const result = await db.insert(veiculos).values(insertData).returning()

    revalidateTag("veiculos")
    Logger.info("veiculo-service", "Successfully created veiculo using Drizzle", { veiculoId: result[0].id })
    return result.map(mapQueryResultToVeiculoData);
  } catch (error) {
    Logger.error("veiculo-service", "Unexpected error while creating veiculo using Drizzle", { error })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

// Adjust input type for update
export const updateVeiculo = async (id: number, data: Partial<Omit<VeiculoData, 'id'>>) => {
  try {
    const validatedData = veiculoSchema.partial().parse(data)
    Logger.info("veiculo-service", "Updating veiculo using Drizzle", { id, veiculoData: validatedData })

    const updateData: Partial<typeof veiculos.$inferInsert> = { ...validatedData };

    // Prepare data for update (handle potential type mismatches if necessary)
    // if (updateData.veiculo_ano !== undefined) updateData.veiculo_ano = updateData.veiculo_ano?.toString();
    // if (updateData.veiculo_km_inicial !== undefined) updateData.veiculo_km_inicial = updateData.veiculo_km_inicial?.toString();
    // if (updateData.veiculo_litro_inicial !== undefined) updateData.veiculo_litro_inicial = updateData.veiculo_litro_inicial?.toString();

    const result = await db.update(veiculos).set(updateData).where(eq(veiculos.id, id)).returning()

    if (result.length === 0) {
      Logger.warn("veiculo-service", "Veiculo not found for update using Drizzle", { id })
      throw new Error(`Veiculo with id ${id} not found.`)
    }

    revalidateTag("veiculos")
    revalidateTag("veiculo")

    Logger.info("veiculo-service", "Successfully updated veiculo using Drizzle", { id })
    return result.map(mapQueryResultToVeiculoData);
  } catch (error) {
    Logger.error("veiculo-service", "Unexpected error while updating veiculo using Drizzle", { error, id })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

export const deleteVeiculo = async (id: number) => {
  try {
    Logger.info("veiculo-service", "Deleting veiculo using Drizzle", { id })
    const result = await db.delete(veiculos).where(eq(veiculos.id, id)).returning()

    if (result.length === 0) {
        Logger.warn("veiculo-service", "Veiculo not found for deletion using Drizzle", { id })
        throw new Error(`Veiculo with id ${id} not found.`)
     }

    revalidateTag("veiculos")
    revalidateTag("veiculo")

    Logger.info("veiculo-service", "Successfully deleted veiculo using Drizzle", { id })
    return { success: true }
  } catch (error: any) {
    // Check for foreign key violation error (Postgres error code 23503)
    if (error.code === '23503') {
        const fkError = new Error(
          "Não é possível excluir o veículo porque há registros associados a ele (ex: fretes, despesas)."
        )
        Logger.error("veiculo-service", "Failed to delete veiculo - foreign key constraint", {
          error: fkError,
          id,
        })
        throw fkError
    }
    Logger.error("veiculo-service", "Unexpected error while deleting veiculo using Drizzle", { error, id })
    throw error
  }
}
