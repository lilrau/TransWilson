import { FileQuestion } from "lucide-react"

interface RelatorioVazioProps {
  mensagem?: string
}

export function RelatorioVazio({
  mensagem = "Nenhum dado encontrado para o período selecionado.",
}: RelatorioVazioProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground max-w-md">{mensagem}</p>
    </div>
  )
}
