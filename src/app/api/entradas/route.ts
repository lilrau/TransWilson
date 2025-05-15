import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const freteId = searchParams.get("freteId")

    if (!freteId) {
      return NextResponse.json(
        { error: "freteId é obrigatório" },
        { status: 400 }
      )
    }

    Logger.info("api/entradas", "Fetching entradas by freteId", { freteId })
    
    const { data, error } = await supabase()
      .from("entrada")
      .select("*")
      .eq("entrada_frete_id", freteId)
      .order("created_at", { ascending: false })

    if (error) {
      Logger.error("api/entradas", "Error fetching entradas", { error, freteId })
      return NextResponse.json(
        { error: "Erro ao buscar entradas" },
        { status: 500 }
      )
    }

    Logger.info("api/entradas", "Successfully fetched entradas", { 
      freteId, 
      count: data.length 
    })
    
    return NextResponse.json({ data })
  } catch (error) {
    Logger.error("api/entradas", "Unexpected error in entradas API", { error })
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 