"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { supabase } from "../supabase"
import { hashPassword } from "../password-utils"
import { Logger } from "../logger"

export interface UserData {
  user_nome: string
  user_user: string
  user_email: string
  user_senha?: string
  user_ativo: boolean
  user_created_at?: string
}

export const getAllUsers = unstable_cache(
  async () => {
    try {
      Logger.info('users-service', 'Fetching all users')
      const { data, error } = await supabase()
        .from("users")
        .select("*")
        .order("user_nome", { ascending: true })

      if (error) {
        Logger.error('users-service', 'Failed to fetch all users', { error })
        throw error
      }

      Logger.info('users-service', 'Successfully fetched all users', { count: data.length })
      return data
    } catch (error) {
      Logger.error('users-service', 'Unexpected error while fetching all users', { error })
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
  async (id: number) => {
    try {
      Logger.info('users-service', 'Fetching user by id', { id })
      const { data, error } = await supabase().from("users").select("*").eq("id", id).single()

      if (error) {
        Logger.error('users-service', 'Failed to fetch user by id', { error, id })
        throw error
      }

      Logger.info('users-service', 'Successfully fetched user by id', { id })
      return data
    } catch (error) {
      Logger.error('users-service', 'Unexpected error while fetching user by id', { error, id })
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
  async (username: string) => {
    try {
      Logger.info('users-service', 'Fetching user by username', { username })
      const { data, error } = await supabase()
        .from("users")
        .select("*")
        .eq("user_user", username)
        .single()

      if (error) {
        Logger.error('users-service', 'Failed to fetch user by username', { error, username })
        throw error
      }

      Logger.info('users-service', 'Successfully fetched user by username', { username })
      return data
    } catch (error) {
      Logger.error('users-service', 'Unexpected error while fetching user by username', { error, username })
      throw error
    }
  },
  ["user-by-username"],
  {
    revalidate: 60,
    tags: ["users", "user"],
  }
)

export const createUser = async (data: UserData) => {
  try {
    Logger.info('users-service', 'Creating new user', { userData: { ...data, user_senha: undefined } })

    if (data.user_senha) {
      data.user_senha = await hashPassword(data.user_senha)
    }

    const result = await supabase().from("users").insert(data).select()

    if (result.error) {
      Logger.error('users-service', 'Failed to create user', { error: result.error })
      throw result.error
    }

    revalidateTag("users")
    Logger.info('users-service', 'Successfully created user', { userId: result.data[0].id })
    return result.data
  } catch (error) {
    Logger.error('users-service', 'Unexpected error while creating user', { error })
    throw error
  }
}

export const updateUser = async (id: number, data: Partial<UserData>) => {
  try {
    Logger.info('users-service', 'Updating user', { id, userData: { ...data, user_senha: undefined } })
    const updatedData = { ...data }
    
    if (updatedData.user_senha && updatedData.user_senha.length > 0) {
      updatedData.user_senha = await hashPassword(updatedData.user_senha)
    } else if (updatedData.user_senha !== undefined) {
      delete updatedData.user_senha
    }

    const result = await supabase()
      .from("users")
      .update(updatedData)
      .eq("id", id)
      .select()

    if (result.error) {
      Logger.error('users-service', 'Failed to update user', { error: result.error, id })
      throw result.error
    }

    revalidateTag("users")
    Logger.info('users-service', 'Successfully updated user', { id })
    return result.data
  } catch (error) {
    Logger.error('users-service', 'Unexpected error while updating user', { error, id })
    throw error
  }
}

export const deleteUser = async (id: number) => {
  try {
    Logger.info('users-service', 'Deleting user', { id })
    const result = await supabase().from("users").delete().eq("id", id)

    if (result.error) {
      Logger.error('users-service', 'Failed to delete user', { error: result.error, id })
      throw result.error
    }

    revalidateTag("users")
    revalidateTag("user")
    Logger.info('users-service', 'Successfully deleted user', { id })
    return result
  } catch (error) {
    Logger.error('users-service', 'Unexpected error while deleting user', { error, id })
    throw error
  }
}
