"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RelatorioExportarProps {
  dados: Record<string, unknown>[]
  nomeArquivo: string
  disabled?: boolean
}

export function RelatorioExportar({
  dados,
  nomeArquivo,
  disabled = false,
}: RelatorioExportarProps) {
  const [exportando, setExportando] = useState(false)

  const exportarCSV = () => {
    if (!dados.length || disabled) return

    setExportando(true)

    try {
      // Obter cabeçalhos (chaves do primeiro objeto)
      const headers = Object.keys(dados[0])

      // Criar linhas de dados
      const csvRows = [
        // Cabeçalhos
        headers.join(","),
        // Dados
        ...dados.map((row) =>
          headers
            .map((header) => {
              // Formatar o valor para CSV (entre aspas se contiver vírgula)
              let valor = row[header]

              // Formatar datas
              if (valor instanceof Date) {
                valor = valor.toLocaleDateString("pt-BR")
              }

              // Converter para string e escapar aspas
              const valorStr = String(valor).replace(/"/g, '""')

              // Adicionar aspas se necessário
              return valorStr.includes(",") ? `"${valorStr}"` : valorStr
            })
            .join(",")
        ),
      ]

      // Juntar linhas com quebras de linha
      const csvString = csvRows.join("\n")

      // Criar blob e link para download
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      // Configurar e simular clique no link
      link.setAttribute("href", url)
      link.setAttribute("download", `${nomeArquivo}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
    } finally {
      setExportando(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportarCSV}
      disabled={disabled || exportando || !dados.length}
    >
      {exportando ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </>
      )}
    </Button>
  )
}
