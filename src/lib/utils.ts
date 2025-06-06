import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskCPF(value: string): string {
  // Remove tudo que não é dígito
  const cleanValue = value.replace(/\D/g, "")

  // Limita a 11 dígitos
  const cpf = cleanValue.slice(0, 11)

  // Aplica a máscara progressivamente
  if (cpf.length <= 3) {
    return cpf
  }
  if (cpf.length <= 6) {
    return cpf.replace(/(\d{3})(\d{0,3})/, "$1.$2")
  }
  if (cpf.length <= 9) {
    return cpf.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3")
  }
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4")
}

export function unmaskCPF(value: string): string {
  // Remove tudo que não é dígito
  return value.replace(/\D/g, "")
}
