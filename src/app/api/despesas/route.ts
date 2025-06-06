import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const freteId = searchParams.get("freteId")

    if (!freteId) {
      return NextResponse.json({ error: "freteId é obrigatório" }, { status: 400 })
    }

    Logger.info("api/despesas", "Fetching despesas by freteId", { freteId })

    const { data, error } = await supabase()
      .from("despesa")
      .select("*")
      .eq("despesa_frete_id", freteId)
      .order("created_at", { ascending: false })

    if (error) {
      Logger.error("api/despesas", "Error fetching despesas", { error, freteId })
      return NextResponse.json({ error: "Erro ao buscar despesas" }, { status: 500 })
    }

    Logger.info("api/despesas", "Successfully fetched despesas", {
      freteId,
      count: data.length,
    })

    return NextResponse.json({ data })
  } catch (error) {
    Logger.error("api/despesas", "Unexpected error in despesas API", { error })
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
