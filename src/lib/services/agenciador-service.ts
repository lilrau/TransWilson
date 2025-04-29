"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { db } from "../db"
import { agenciadores, agenciadorSchema } from "../db/schema"
import { eq } from "drizzle-orm"
import { Logger } from "../logger"
import { z } from "zod"

// Infer the type from the schema
type AgenciadorData = z.infer<typeof agenciadorSchema>

export const getAllAgenciador = unstable_cache(
  async () => {
    try {
      Logger.info("agenciador-service", "Fetching all agenciadores using Drizzle")
      const data = await db.select().from(agenciadores).orderBy(agenciadores.agenciador_nome)

      Logger.info("agenciador-service", "Successfully fetched all agenciadores using Drizzle", {
        count: data.length,
      })
      // Ensure the returned data matches the expected structure if needed by the frontend
      // Drizzle returns the raw data, might need mapping if frontend expects `created_at`
      return data.map(a => ({ ...a, created_at: new Date().toISOString() })) // Temporary workaround for created_at
    } catch (error) {
      Logger.error("agenciador-service", "Unexpected error while fetching all agenciadores using Drizzle", {
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
      Logger.info("agenciador-service", "Fetching agenciador by id using Drizzle", { id })
      const data = await db.select().from(agenciadores).where(eq(agenciadores.id, id)).limit(1)

      if (data.length === 0) {
        Logger.warn("agenciador-service", "Agenciador not found by id using Drizzle", { id })
        return null // Or throw an error if preferred
      }

      Logger.info("agenciador-service", "Successfully fetched agenciador by id using Drizzle", { id })
      // Temporary workaround for created_at
      return { ...data[0], created_at: new Date().toISOString() }
    } catch (error) {
      Logger.error("agenciador-service", "Unexpected error while fetching agenciador by id using Drizzle", {
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
    // Validate data using Zod schema
    const validatedData = agenciadorSchema.parse(data)
    Logger.info("agenciador-service", "Creating new agenciador using Drizzle", { agenciadorData: validatedData })

    const result = await db.insert(agenciadores).values(validatedData).returning()

    revalidateTag("agenciadores")
    Logger.info("agenciador-service", "Successfully created agenciador using Drizzle", {
      agenciadorId: result[0].id,
    })
    return result
  } catch (error) {
    Logger.error("agenciador-service", "Unexpected error while creating agenciador using Drizzle", { error })
    // Handle Zod validation errors specifically if needed
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
      // You might want to throw a more specific error or return a structured error response
    }
    throw error
  }
}

export const updateAgenciador = async (id: number, data: Partial<AgenciadorData>) => {
  try {
    // Validate partial data - Zod's partial schema can be useful here
    const validatedData = agenciadorSchema.partial().parse(data)
    Logger.info("agenciador-service", "Updating agenciador using Drizzle", { id, agenciadorData: validatedData })

    const result = await db.update(agenciadores).set(validatedData).where(eq(agenciadores.id, id)).returning()

    if (result.length === 0) {
      Logger.warn("agenciador-service", "Agenciador not found for update using Drizzle", { id })
      // Handle case where the agenciador doesn't exist
      throw new Error(`Agenciador with id ${id} not found.`)
    }

    revalidateTag("agenciadores")
    revalidateTag("agenciador")

    Logger.info("agenciador-service", "Successfully updated agenciador using Drizzle", { id })
    return result
  } catch (error) {
    Logger.error("agenciador-service", "Unexpected error while updating agenciador using Drizzle", { error, id })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

export const deleteAgenciador = async (id: number) => {
  try {
    Logger.info("agenciador-service", "Deleting agenciador using Drizzle", { id })
    const result = await db.delete(agenciadores).where(eq(agenciadores.id, id)).returning()

    if (result.length === 0) {
        Logger.warn("agenciador-service", "Agenciador not found for deletion using Drizzle", { id })
        // Handle case where the agenciador doesn't exist
        throw new Error(`Agenciador with id ${id} not found.`)
    }

    revalidateTag("agenciadores")
    revalidateTag("agenciador")

    Logger.info("agenciador-service", "Successfully deleted agenciador using Drizzle", { id })
    return { success: true } // Return a success indicator
  } catch (error) {
    Logger.error("agenciador-service", "Unexpected error while deleting agenciador using Drizzle", { error, id })
    throw error
  }
}
