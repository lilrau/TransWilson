"use server"

import { unstable_cache } from "next/cache"
import { supabase } from "../supabase"

export const getTipoDespesaEnum = unstable_cache(
  async () => {
    const { data, error } = await supabase().rpc("get_tipo_despesa_enum")

    if (error) throw error
    return data
  },
  ["tipo-despesa-enum"],
  {
    revalidate: 3600, // Revalidar a cada hora, já que enums mudam com pouca frequência
    tags: ["enums", "tipo-despesa"],
  }
)
