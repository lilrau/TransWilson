"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { db } from "../db/index"
import { entradas, entradaSchema, fretes, motoristas } from "../db/schema"
import { eq } from "drizzle-orm"
import { Logger } from "../logger"
import { z } from "zod"

// Infer the type from the schema
type EntradaData = z.infer<typeof entradaSchema>

// Define the structure for joined data explicitly
interface EntradaWithRelations extends Omit<EntradaData, 'entrada_frete_id'> { // Omit original foreign key
  id: number; // Ensure id is present
  created_at?: string; // Keep for compatibility if frontend expects it
  frete: {
    id: number;
    frete_nome: string;
    motorista: { // Include nested motorista info
      id: number;
    } | null;
  } | null;
}

export const getAllEntradas = unstable_cache(
  async () => {
    try {
      Logger.info("entrada-service", "Fetching all entradas using Drizzle")
      const data = await db
        .select({
          id: entradas.id,
          entrada_nome: entradas.entrada_nome,
          entrada_valor: entradas.entrada_valor,
          entrada_descricao: entradas.entrada_descricao,
          entrada_tipo: entradas.entrada_tipo,
          // entrada_frete_id: entradas.entrada_frete_id, // Exclude original FK if mapping to nested object
          frete: {
            id: fretes.id,
            frete_nome: fretes.frete_nome,
            motorista: {
              id: motoristas.id,
            },
          },
        })
        .from(entradas)
        .leftJoin(fretes, eq(entradas.entrada_frete_id, fretes.id))
        .leftJoin(motoristas, eq(fretes.frete_motorista, motoristas.id)) // Join motoristas through fretes
        // .orderBy(entradas.created_at) // Order by ID or name if created_at not available
        .orderBy(entradas.id)

      Logger.info("entrada-service", "Successfully fetched all entradas using Drizzle", { count: data.length })
      // Map data to include a placeholder created_at if needed
      return data.map(e => ({ ...e, created_at: new Date().toISOString() })) as EntradaWithRelations[];
    } catch (error) {
      Logger.error("entrada-service", "Unexpected error while fetching all entradas using Drizzle", { error })
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
      Logger.info("entrada-service", "Fetching entrada by id using Drizzle", { id })
      const result = await db
        .select({
          id: entradas.id,
          entrada_nome: entradas.entrada_nome,
          entrada_valor: entradas.entrada_valor,
          entrada_descricao: entradas.entrada_descricao,
          entrada_tipo: entradas.entrada_tipo,
          // entrada_frete_id: entradas.entrada_frete_id,
          frete: {
            id: fretes.id,
            frete_nome: fretes.frete_nome,
            motorista: {
              id: motoristas.id,
            },
          },
        })
        .from(entradas)
        .leftJoin(fretes, eq(entradas.entrada_frete_id, fretes.id))
        .leftJoin(motoristas, eq(fretes.frete_motorista, motoristas.id))
        .where(eq(entradas.id, id))
        .limit(1)

      if (result.length === 0) {
        Logger.warn("entrada-service", "Entrada not found by id using Drizzle", { id })
        return null
      }

      Logger.info("entrada-service", "Successfully fetched entrada by id using Drizzle", { id })
      // Map data to include a placeholder created_at if needed
      return { ...result[0], created_at: new Date().toISOString() } as EntradaWithRelations;
    } catch (error) {
      Logger.error("entrada-service", "Unexpected error while fetching entrada by id using Drizzle", {
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

// Adjust input type to match schema (omit id, created_at)
export const createEntrada = async (data: Omit<EntradaData, 'id'>) => {
  try {
    const validatedData = entradaSchema.omit({ id: true }).parse(data) // Validate without id
    Logger.info("entrada-service", "Creating new entrada using Drizzle", { entradaData: validatedData })
    const result = await db.insert(entradas).values(validatedData).returning()

    revalidateTag("entradas")
    Logger.info("entrada-service", "Successfully created entrada using Drizzle", { entradaId: result[0].id })
    return result
  } catch (error) {
    Logger.error("entrada-service", "Unexpected error while creating entrada using Drizzle", { error })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

// Adjust input type for update
export const updateEntrada = async (
  id: number,
  data: Partial<Omit<EntradaData, 'id'>>
) => {
  try {
    const validatedData = entradaSchema.partial().omit({ id: true }).parse(data)
    Logger.info("entrada-service", "Updating entrada using Drizzle", { id, entradaData: validatedData })
    const result = await db.update(entradas).set(validatedData).where(eq(entradas.id, id)).returning()

    if (result.length === 0) {
      Logger.warn("entrada-service", "Entrada not found for update using Drizzle", { id })
      throw new Error(`Entrada with id ${id} not found.`)
    }

    revalidateTag("entradas")
    revalidateTag("entrada")

    Logger.info("entrada-service", "Successfully updated entrada using Drizzle", { id })
    return result
  } catch (error) {
    Logger.error("entrada-service", "Unexpected error while updating entrada using Drizzle", { error, id })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

export const deleteEntrada = async (id: number) => {
  try {
    Logger.info("entrada-service", "Deleting entrada using Drizzle", { id })
    const result = await db.delete(entradas).where(eq(entradas.id, id)).returning()

    if (result.length === 0) {
        Logger.warn("entrada-service", "Entrada not found for deletion using Drizzle", { id })
        throw new Error(`Entrada with id ${id} not found.`)
     }

    revalidateTag("entradas")
    revalidateTag("entrada")

    Logger.info("entrada-service", "Successfully deleted entrada using Drizzle", { id })
    return { success: true }
  } catch (error) {
    Logger.error("entrada-service", "Unexpected error while deleting entrada using Drizzle", { error, id })
    throw error
  }
}

// TODO: Reimplement getTipoEntradaEnum using Drizzle if needed.
// This could involve fetching distinct values from the entrada_tipo column
// or defining the enum types within the application code.
/*
export const getTipoEntradaEnum = unstable_cache(
  async () => {
    // Example: Fetch distinct values
    try {
      Logger.info("entrada-service", "Fetching distinct entrada_tipo values using Drizzle")
      const result = await db.selectDistinct({ tipo: entradas.entrada_tipo }).from(entradas);
      Logger.info("entrada-service", "Successfully fetched distinct entrada_tipo values", { count: result.length })
      return result.map(r => r.tipo);
    } catch (error) {
      Logger.error("entrada-service", "Failed to fetch distinct entrada_tipo values", { error })
      throw error
    }
    // Original Supabase RPC call:
    // const { data, error } = await supabase().rpc("get_tipo_entrada_enum")
    // if (error) throw error
    // return data
  },
  ["tipo-entrada-enum"],
  {
    revalidate: 3600, // Revalidar a cada hora
    tags: ["enums", "tipo-entrada"],
  }
)
*/
