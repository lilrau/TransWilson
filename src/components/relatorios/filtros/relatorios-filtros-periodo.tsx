"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { FiltroPeriodo } from "../relatorios-container"

interface RelatoriosFiltrosPeriodoProps {
  filtroPeriodo: FiltroPeriodo
  setFiltroPeriodo: (filtro: FiltroPeriodo) => void
}

export function RelatoriosFiltrosPeriodo({
  filtroPeriodo,
  setFiltroPeriodo,
}: RelatoriosFiltrosPeriodoProps) {
  const [dataInicialAberta, setDataInicialAberta] = useState(false)
  const [dataFinalAberta, setDataFinalAberta] = useState(false)

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Data Inicial</label>
        <Popover open={dataInicialAberta} onOpenChange={setDataInicialAberta}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filtroPeriodo.dataInicial ? (
                format(filtroPeriodo.dataInicial, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filtroPeriodo.dataInicial}
              onSelect={(date) => {
                if (date) {
                  setFiltroPeriodo({
                    ...filtroPeriodo,
                    dataInicial: date,
                  })
                  setDataInicialAberta(false)
                }
              }}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Data Final</label>
        <Popover open={dataFinalAberta} onOpenChange={setDataFinalAberta}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filtroPeriodo.dataFinal ? (
                format(filtroPeriodo.dataFinal, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filtroPeriodo.dataFinal}
              onSelect={(date) => {
                if (date) {
                  setFiltroPeriodo({
                    ...filtroPeriodo,
                    dataFinal: date,
                  })
                  setDataFinalAberta(false)
                }
              }}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
