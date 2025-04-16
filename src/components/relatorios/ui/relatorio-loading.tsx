import { Loader2 } from "lucide-react"

interface RelatorioLoadingProps {
  mensagem?: string
}

export function RelatorioLoading({ mensagem = "Carregando dados..." }: RelatorioLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{mensagem}</p>
    </div>
  )
}
