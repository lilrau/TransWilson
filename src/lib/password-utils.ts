/**
 * Utilitários para manipulação segura de senhas
 */
import bcrypt from "bcryptjs"

/**
 * Gera um hash seguro para uma senha
 * @param password - A senha em texto puro para ser hasheada
 * @returns Uma Promise que resolve para o hash da senha
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verifica se uma senha em texto puro corresponde a um hash
 * @param password - A senha em texto puro para verificar
 * @param hash - O hash armazenado para comparar
 * @returns Uma Promise que resolve para um booleano indicando se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
