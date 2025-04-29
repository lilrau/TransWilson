"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { db } from "../db/index"
import { fretes, freteSchema, veiculos, agenciadores, motoristas } from "../db/schema"
import { eq } from "drizzle-orm"
import { Logger } from "../logger"
import { z } from "zod"

// Infer the type from the schema
type FreteData = z.infer<typeof freteSchema>

// Define the structure for joined data explicitly
interface FreteWithRelations extends Omit<FreteData, 'frete_veiculo' | 'frete_agenciador' | 'frete_motorista' | 'frete_peso'> { // Omit original foreign keys and peso text
  id: number; // Ensure id is present
  created_at?: string; // Keep for compatibility if frontend expects it
  frete_peso: number[]; // Represent peso as number array
  veiculo: { id: number; veiculo_nome: string } | null;
  agenciador: { id: number; agenciador_nome: string } | null;
  motorista: { id: number; motorista_nome: string } | null;
}

// Helper to parse frete_peso (assuming comma-separated string)
const parseFretePeso = (pesoString: string | null | undefined): number[] => {
  if (!pesoString) return [];
  try {
    // First try parsing as JSON array
    const parsed = JSON.parse(pesoString);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'number')) {
      return parsed;
    }
  } catch (e) {
    // Ignore JSON parse error and try comma-separated
  }
  // Fallback to comma-separated string
  return pesoString.split(',').map(Number).filter(n => !isNaN(n));
};

// Helper to stringify frete_peso for DB (using JSON string)
const stringifyFretePeso = (pesoArray: number[] | undefined): string => {
  return JSON.stringify(pesoArray || []);
};

export const getAllFrete = unstable_cache(
  async () => {
    try {
      Logger.info("frete-service", "Fetching all fretes using Drizzle")
      const data = await db
        .select({
          ...fretes,
          veiculo: {
            id: veiculos.id,
            veiculo_nome: veiculos.veiculo_nome,
          },
          agenciador: {
            id: agenciadores.id,
            agenciador_nome: agenciadores.agenciador_nome,
          },
          motorista: {
            id: motoristas.id,
            motorista_nome: motoristas.motorista_nome,
          },
        })
        .from(fretes)
        .leftJoin(veiculos, eq(fretes.frete_veiculo, veiculos.id))
        .leftJoin(agenciadores, eq(fretes.frete_agenciador, agenciadores.id))
        .leftJoin(motoristas, eq(fretes.frete_motorista, motoristas.id))
        // .orderBy(fretes.created_at) // Order by ID or name if created_at not available
        .orderBy(fretes.id)

      Logger.info("frete-service", "Successfully fetched all fretes using Drizzle", { count: data.length })
      // Map data, parse peso, and add placeholder created_at
      return data.map(f => ({
        ...f,
        frete_peso: parseFretePeso(f.frete_peso),
        created_at: new Date().toISOString(),
      })) as FreteWithRelations[];
    } catch (error) {
      Logger.error("frete-service", "Unexpected error while fetching all fretes using Drizzle", { error })
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
      Logger.info("frete-service", "Fetching frete by id using Drizzle", { id })
      const result = await db
        .select({
          ...fretes,
          veiculo: {
            id: veiculos.id,
            veiculo_nome: veiculos.veiculo_nome,
          },
          agenciador: {
            id: agenciadores.id,
            agenciador_nome: agenciadores.agenciador_nome,
          },
          motorista: {
            id: motoristas.id,
            motorista_nome: motoristas.motorista_nome,
          },
        })
        .from(fretes)
        .leftJoin(veiculos, eq(fretes.frete_veiculo, veiculos.id))
        .leftJoin(agenciadores, eq(fretes.frete_agenciador, agenciadores.id))
        .leftJoin(motoristas, eq(fretes.frete_motorista, motoristas.id))
        .where(eq(fretes.id, id))
        .limit(1)

      if (result.length === 0) {
        Logger.warn("frete-service", "Frete not found by id using Drizzle", { id })
        return null
      }

      Logger.info("frete-service", "Successfully fetched frete by id using Drizzle", { id })
      // Map data, parse peso, and add placeholder created_at
      const frete = result[0];
      return {
        ...frete,
        frete_peso: parseFretePeso(frete.frete_peso),
        created_at: new Date().toISOString(),
      } as FreteWithRelations;
    } catch (error) {
      Logger.error("frete-service", "Unexpected error while fetching frete by id using Drizzle", { error, id })
      throw error
    }
  },
  ["frete-detail"],
  {
    revalidate: 60,
    tags: ["fretes", "frete"],
  }
)

// Adjust input type to match schema (omit id, created_at, calculated fields)
export const createFrete = async (data: Omit<FreteData, 'id' | 'frete_valor_total' | 'frete_baixa'>) => {
  try {
    // Validate data using Zod schema (excluding calculated fields)
    const validatedData = freteSchema.omit({ id: true, frete_valor_total: true, frete_baixa: true }).parse(data);

    Logger.info("frete-service", "Creating new frete using Drizzle", {
      freteData: {
        ...validatedData,
        frete_peso: validatedData.frete_peso.length, // Log length for brevity
      },
    })

    // Calculate valorTotal
    const valorTotal = validatedData.frete_peso.reduce((acc, peso) => acc + peso, 0) * (validatedData.frete_valor_tonelada || 0)
    Logger.info("frete-service", "Calculated total value for frete", { valorTotal })

    // Prepare data for insertion, stringifying peso
    const insertData = {
      ...validatedData,
      frete_peso: stringifyFretePeso(validatedData.frete_peso),
      frete_valor_total: valorTotal.toString(), // Store numeric as string if DB expects it
      frete_baixa: false, // Default value
    };

    const result = await db.insert(fretes).values(insertData).returning()

    revalidateTag("fretes")
    Logger.info("frete-service", "Successfully created frete using Drizzle", { freteId: result[0].id })
    return result.map(f => ({ ...f, frete_peso: parseFretePeso(f.frete_peso) })); // Return parsed peso
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while creating frete using Drizzle", { error })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

// Adjust input type for update
export const updateFrete = async (id: number, data: Partial<Omit<FreteData, 'id' | 'frete_valor_total'>>) => {
  try {
    // Validate partial data
    const validatedData = freteSchema.partial().omit({ id: true, frete_valor_total: true }).parse(data);

    Logger.info("frete-service", "Updating frete using Drizzle", {
      id,
      freteData: {
        ...validatedData,
        frete_peso: validatedData.frete_peso?.length, // Log length
      },
    })

    const updateData: Partial<typeof fretes.$inferInsert> = { ...validatedData };

    // Recalculate valorTotal if peso or valor_tonelada changed
    if (validatedData.frete_peso !== undefined || validatedData.frete_valor_tonelada !== undefined) {
      // Fetch current frete data to get potentially unchanged values
      const currentFreteResult = await db.select({ frete_peso: fretes.frete_peso, frete_valor_tonelada: fretes.frete_valor_tonelada }).from(fretes).where(eq(fretes.id, id)).limit(1);
      if (currentFreteResult.length === 0) {
        throw new Error(`Frete with id ${id} not found for update.`);
      }
      const currentFrete = currentFreteResult[0];

      const weights = validatedData.frete_peso !== undefined ? validatedData.frete_peso : parseFretePeso(currentFrete.frete_peso);
      const pricePerTon = validatedData.frete_valor_tonelada !== undefined ? validatedData.frete_valor_tonelada : Number(currentFrete.frete_valor_tonelada);

      const newTotalValue = weights.reduce((acc: number, peso: number) => acc + peso, 0) * (pricePerTon || 0)
      updateData.frete_valor_total = newTotalValue.toString();
      Logger.info("frete-service", "Recalculated total value for frete", {
        id,
        newTotalValue,
      })
    }

    // Stringify peso if it's being updated
    if (validatedData.frete_peso !== undefined) {
      updateData.frete_peso = stringifyFretePeso(validatedData.frete_peso);
    }

    const result = await db.update(fretes).set(updateData).where(eq(fretes.id, id)).returning()

    if (result.length === 0) {
      Logger.warn("frete-service", "Frete not found for update using Drizzle", { id })
      throw new Error(`Frete with id ${id} not found.`)
    }

    revalidateTag("fretes")
    revalidateTag("frete")
    Logger.info("frete-service", "Successfully updated frete using Drizzle", { id })
    return result.map(f => ({ ...f, frete_peso: parseFretePeso(f.frete_peso) })); // Return parsed peso
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while updating frete using Drizzle", { error, id })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

export const deleteFrete = async (id: number) => {
  try {
    Logger.info("frete-service", "Deleting frete using Drizzle", { id })
    const result = await db.delete(fretes).where(eq(fretes.id, id)).returning()

    if (result.length === 0) {
        Logger.warn("frete-service", "Frete not found for deletion using Drizzle", { id })
        throw new Error(`Frete with id ${id} not found.`)
     }

    revalidateTag("fretes")
    revalidateTag("frete")
    Logger.info("frete-service", "Successfully deleted frete using Drizzle", { id })
    return { success: true }
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while deleting frete using Drizzle", { error, id })
    throw error
  }
}

// Adicionar a função para dar baixa em um frete using Drizzle
export const darBaixaFrete = async (id: number, baixado = true) => {
  try {
    Logger.info("frete-service", "Updating frete baixa status using Drizzle", { id, baixado })
    const result = await db
      .update(fretes)
      .set({ frete_baixa: baixado })
      .where(eq(fretes.id, id))
      .returning()

    if (result.length === 0) {
      Logger.warn("frete-service", "Frete not found for baixa update using Drizzle", { id })
      throw new Error(`Frete with id ${id} not found.`)
    }

    revalidateTag("fretes")
    revalidateTag("frete")
    Logger.info("frete-service", "Successfully updated frete baixa status using Drizzle", { id, baixado })
    return result.map(f => ({ ...f, frete_peso: parseFretePeso(f.frete_peso) })); // Return parsed peso
  } catch (error) {
    Logger.error("frete-service", "Unexpected error while updating frete baixa status using Drizzle", { error, id })
    throw error
  }
}
