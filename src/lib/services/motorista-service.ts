"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { db } from "../db/index"
import { motoristas, motoristaSchema } from "../db/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "../password-utils"
import { Logger } from "../logger"
import { z } from "zod"

// Infer the type from the schema
type MotoristaData = z.infer<typeof motoristaSchema> & { id: number } // Add id explicitly

// Define the structure returned by Drizzle (might differ slightly from Zod schema, e.g., numeric as string)
interface MotoristaQueryResult {
  id: number
  motorista_nome: string
  motorista_cnh: string
  motorista_salario: string // Drizzle returns numeric as string
  motorista_frete: string // Drizzle returns numeric as string
  motorista_estadia: string // Drizzle returns numeric as string
  motorista_admissao: Date // Drizzle returns date as Date object
  motorista_senha: string
  // Add other fields if they exist in the DB table but not schema (e.g., created_at)
}

// Helper to map Drizzle result to the expected MotoristaData structure
const mapQueryResultToMotoristaData = (result: MotoristaQueryResult): MotoristaData => ({
  ...result,
  motorista_salario: Number(result.motorista_salario),
  motorista_frete: Number(result.motorista_frete),
  motorista_estadia: Number(result.motorista_estadia),
  // motorista_admissao is already a Date object
});

export const getAllMotorista = unstable_cache(
  async (): Promise<MotoristaData[]> => {
    try {
      Logger.info("motorista-service", "Fetching all motoristas using Drizzle")
      const data = await db.select().from(motoristas).orderBy(motoristas.motorista_nome)

      Logger.info("motorista-service", "Successfully fetched all motoristas using Drizzle", {
        count: data.length,
      })
      // Map results to ensure correct types (numeric to number)
      return data.map(mapQueryResultToMotoristaData);
    } catch (error) {
      Logger.error("motorista-service", "Unexpected error while fetching all motoristas using Drizzle", { error })
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
  async (id: number): Promise<MotoristaData | null> => {
    try {
      Logger.info("motorista-service", "Fetching motorista by id using Drizzle", { id })
      const result = await db.select().from(motoristas).where(eq(motoristas.id, id)).limit(1)

      if (result.length === 0) {
        Logger.warn("motorista-service", "Motorista not found by id using Drizzle", { id })
        return null
      }

      Logger.info("motorista-service", "Successfully fetched motorista by id using Drizzle", { id })
      // Map result to ensure correct types
      return mapQueryResultToMotoristaData(result[0] as MotoristaQueryResult);
    } catch (error) {
      Logger.error("motorista-service", "Unexpected error while fetching motorista by id using Drizzle", {
        error,
        id,
      })
      throw error
    }
  },
  ["motorista-detail"],
  {
    revalidate: 60,
    tags: ["motoristas", "motorista"],
  }
)

// Adjust input type to match schema (omit id)
export const createMotorista = async (data: Omit<MotoristaData, 'id'>) => {
  try {
    // Ensure admissao is a Date object
    const dataWithDate = {
        ...data,
        motorista_admissao: new Date(data.motorista_admissao)
    };
    const validatedData = motoristaSchema.parse(dataWithDate)

    Logger.info("motorista-service", "Creating new motorista using Drizzle", {
      motoristaData: {
        ...validatedData,
        motorista_senha: "********", // Mask password in logs
      },
    })

    const hashedPassword = await hashPassword(validatedData.motorista_senha)

    // Prepare data for insertion (convert numbers back to string for numeric columns if needed)
    const insertData = {
        ...validatedData,
        motorista_salario: validatedData.motorista_salario.toString(),
        motorista_frete: validatedData.motorista_frete.toString(),
        motorista_estadia: validatedData.motorista_estadia.toString(),
        motorista_senha: hashedPassword,
    };

    const result = await db.insert(motoristas).values(insertData).returning()

    revalidateTag("motoristas")
    Logger.info("motorista-service", "Successfully created motorista using Drizzle", {
      motoristaId: result[0].id,
    })
    // Map result before returning
    return result.map(r => mapQueryResultToMotoristaData(r as MotoristaQueryResult));
  } catch (error) {
    Logger.error("motorista-service", "Unexpected error while creating motorista using Drizzle", { error })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

// Adjust input type for update
export const updateMotorista = async (id: number, data: Partial<Omit<MotoristaData, 'id'>>) => {
  try {
    // Handle potential date string
    const dataWithDate = data.motorista_admissao
        ? { ...data, motorista_admissao: new Date(data.motorista_admissao) }
        : data;

    // Validate partial data
    const validatedData = motoristaSchema.partial().parse(dataWithDate)

    Logger.info("motorista-service", "Updating motorista using Drizzle", {
      id,
      motoristaData: {
        ...validatedData,
        motorista_senha: validatedData.motorista_senha ? "********" : undefined, // Mask password
      },
    })

    const updateData: Partial<typeof motoristas.$inferInsert> = { ...validatedData };

    // Hash password if provided and not empty
    if (validatedData.motorista_senha && validatedData.motorista_senha.length > 0) {
      updateData.motorista_senha = await hashPassword(validatedData.motorista_senha)
    } else {
      // Don't update password if it's empty or not provided
      delete updateData.motorista_senha
    }

    // Convert numbers back to string for numeric columns if they exist in updateData
    if (updateData.motorista_salario !== undefined) updateData.motorista_salario = updateData.motorista_salario.toString();
    if (updateData.motorista_frete !== undefined) updateData.motorista_frete = updateData.motorista_frete.toString();
    if (updateData.motorista_estadia !== undefined) updateData.motorista_estadia = updateData.motorista_estadia.toString();

    const result = await db.update(motoristas).set(updateData).where(eq(motoristas.id, id)).returning()

    if (result.length === 0) {
      Logger.warn("motorista-service", "Motorista not found for update using Drizzle", { id })
      throw new Error(`Motorista with id ${id} not found.`)
    }

    revalidateTag("motoristas")
    revalidateTag("motorista")
    Logger.info("motorista-service", "Successfully updated motorista using Drizzle", { id })
    // Map result before returning
    return result.map(r => mapQueryResultToMotoristaData(r as MotoristaQueryResult));
  } catch (error) {
    Logger.error("motorista-service", "Unexpected error while updating motorista using Drizzle", { error, id })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

export const deleteMotorista = async (id: number) => {
  try {
    Logger.info("motorista-service", "Deleting motorista using Drizzle", { id })
    const result = await db.delete(motoristas).where(eq(motoristas.id, id)).returning()

    if (result.length === 0) {
        Logger.warn("motorista-service", "Motorista not found for deletion using Drizzle", { id })
        throw new Error(`Motorista with id ${id} not found.`)
     }

    revalidateTag("motoristas")
    revalidateTag("motorista")
    Logger.info("motorista-service", "Successfully deleted motorista using Drizzle", { id })
    return { success: true }
  } catch (error: any) {
    // Check for foreign key violation error (Postgres error code 23503)
    if (error.code === '23503') {
        const fkError = new Error(
          "Não é possível excluir o motorista porque há registros associados a ele (ex: fretes, despesas)."
        )
        Logger.error("motorista-service", "Failed to delete motorista - foreign key constraint", {
          error: fkError,
          id,
        })
        throw fkError
    }
    Logger.error("motorista-service", "Unexpected error while deleting motorista using Drizzle", { error, id })
    throw error
  }
}

export const getMotoristaByCredentials = async (cnh: string): Promise<MotoristaData | null> => {
  try {
    Logger.info("motorista-service", "Fetching motorista by CNH using Drizzle", { cnh })
    const result = await db
      .select()
      .from(motoristas)
      .where(eq(motoristas.motorista_cnh, cnh))
      .limit(1)

    if (result.length === 0) {
      Logger.info("motorista-service", "No motorista found with provided CNH using Drizzle", { cnh })
      return null
    }

    Logger.info("motorista-service", "Successfully fetched motorista by CNH using Drizzle", { cnh })
    // Map result before returning
    return mapQueryResultToMotoristaData(result[0] as MotoristaQueryResult);
  } catch (error) {
    Logger.error("motorista-service", "Unexpected error while fetching motorista by CNH using Drizzle", {
      error,
      cnh,
    })
    throw error
  }
}
