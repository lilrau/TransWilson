"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { db } from "../db"
import { users, userSchema } from "../db/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "../password-utils"
import { Logger } from "../logger"
import { z } from "zod"

// Infer the type from the schema
type UserData = z.infer<typeof userSchema> & { id: number } // Add id explicitly

// Define the structure returned by Drizzle
interface UserQueryResult {
  id: number
  user_nome: string
  user_user: string
  user_email: string
  user_senha: string | null // Password might be null if not set/selected
  user_ativo: boolean
  // Add other fields if they exist in the DB table but not schema (e.g., created_at)
}

// Helper to map Drizzle result to the expected UserData structure
const mapQueryResultToUserData = (result: UserQueryResult): UserData => ({
  ...result,
  // No type conversions needed for users table based on schema
});

export const getAllUsers = unstable_cache(
  async (): Promise<UserData[]> => {
    try {
      Logger.info("users-service", "Fetching all users using Drizzle")
      const data = await db.select().from(users).orderBy(users.user_nome)

      Logger.info("users-service", "Successfully fetched all users using Drizzle", { count: data.length })
      // Map results (though no conversions needed here)
      return data.map(u => mapQueryResultToUserData(u as UserQueryResult));
    } catch (error) {
      Logger.error("users-service", "Unexpected error while fetching all users using Drizzle", { error })
      throw error
    }
  },
  ["users-list"],
  {
    revalidate: 60,
    tags: ["users"],
  }
)

export const getUserById = unstable_cache(
  async (id: number): Promise<UserData | null> => {
    try {
      Logger.info("users-service", "Fetching user by id using Drizzle", { id })
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1)

      if (result.length === 0) {
        Logger.warn("users-service", "User not found by id using Drizzle", { id })
        return null
      }

      Logger.info("users-service", "Successfully fetched user by id using Drizzle", { id })
      return mapQueryResultToUserData(result[0] as UserQueryResult);
    } catch (error) {
      Logger.error("users-service", "Unexpected error while fetching user by id using Drizzle", { error, id })
      throw error
    }
  },
  ["user-detail"],
  {
    revalidate: 60,
    tags: ["users", "user"],
  }
)

export const getUserByUsername = unstable_cache(
  async (username: string): Promise<UserData | null> => {
    try {
      Logger.info("users-service", "Fetching user by username using Drizzle", { username })
      const result = await db
        .select()
        .from(users)
        .where(eq(users.user_user, username))
        .limit(1)

      if (result.length === 0) {
        Logger.info("users-service", "User not found by username using Drizzle", { username })
        return null
      }

      Logger.info("users-service", "Successfully fetched user by username using Drizzle", { username })
      return mapQueryResultToUserData(result[0] as UserQueryResult);
    } catch (error) {
      Logger.error("users-service", "Unexpected error while fetching user by username using Drizzle", {
        error,
        username,
      })
      throw error
    }
  },
  ["user-by-username"],
  {
    revalidate: 60,
    tags: ["users", "user"],
  }
)

// Adjust input type to match schema (omit id)
export const createUser = async (data: Omit<UserData, 'id'>) => {
  try {
    const validatedData = userSchema.parse(data)
    Logger.info("users-service", "Creating new user using Drizzle", {
      userData: { ...validatedData, user_senha: "********" }, // Mask password
    })

    let hashedPassword: string | undefined = undefined;
    if (validatedData.user_senha) {
      hashedPassword = await hashPassword(validatedData.user_senha)
    }

    const insertData = {
        ...validatedData,
        user_senha: hashedPassword, // Use hashed password or undefined
    };

    const result = await db.insert(users).values(insertData).returning()

    revalidateTag("users")
    Logger.info("users-service", "Successfully created user using Drizzle", { userId: result[0].id })
    return result.map(u => mapQueryResultToUserData(u as UserQueryResult));
  } catch (error) {
    Logger.error("users-service", "Unexpected error while creating user using Drizzle", { error })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

// Adjust input type for update
export const updateUser = async (id: number, data: Partial<Omit<UserData, 'id'>>) => {
  try {
    // Validate partial data
    const validatedData = userSchema.partial().parse(data)

    Logger.info("users-service", "Updating user using Drizzle", {
      id,
      userData: { ...validatedData, user_senha: validatedData.user_senha ? "********" : undefined }, // Mask password
    })

    const updateData: Partial<typeof users.$inferInsert> = { ...validatedData };

    // Hash password if provided and not empty
    if (validatedData.user_senha && validatedData.user_senha.length > 0) {
      updateData.user_senha = await hashPassword(validatedData.user_senha)
    } else {
      // Don't update password if it's empty or not provided
      delete updateData.user_senha
    }

    const result = await db.update(users).set(updateData).where(eq(users.id, id)).returning()

    if (result.length === 0) {
      Logger.warn("users-service", "User not found for update using Drizzle", { id })
      throw new Error(`User with id ${id} not found.`)
    }

    revalidateTag("users")
    revalidateTag("user") // Also revalidate single user cache if needed
    Logger.info("users-service", "Successfully updated user using Drizzle", { id })
    return result.map(u => mapQueryResultToUserData(u as UserQueryResult));
  } catch (error) {
    Logger.error("users-service", "Unexpected error while updating user using Drizzle", { error, id })
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
    }
    throw error
  }
}

export const deleteUser = async (id: number) => {
  try {
    Logger.info("users-service", "Deleting user using Drizzle", { id })
    const result = await db.delete(users).where(eq(users.id, id)).returning()

    if (result.length === 0) {
        Logger.warn("users-service", "User not found for deletion using Drizzle", { id })
        throw new Error(`User with id ${id} not found.`)
     }

    revalidateTag("users")
    revalidateTag("user")
    Logger.info("users-service", "Successfully deleted user using Drizzle", { id })
    return { success: true }
  } catch (error) {
    // Add specific error handling if needed (e.g., foreign key constraints)
    Logger.error("users-service", "Unexpected error while deleting user using Drizzle", { error, id })
    throw error
  }
}
