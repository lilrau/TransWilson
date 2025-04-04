"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "../ui/calendar";

const formSchema = z.object({
  motorista_nome: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres.",
  }),
  motorista_cnh: z.string().length(11, {
    message: "A CNH deve ter 11 caracteres.",
  }),
  motorista_salario: z.coerce.number().min(0, {
    message: "O salário não pode ser negativo.",
  }),
  motorista_frete: z.coerce.number().min(0).max(100, {
    message: "A porcentagem deve estar entre 0 e 100.",
  }),
  motorista_estadia: z.coerce.number().min(0).max(100, {
    message: "A porcentagem deve estar entre 0 e 100.",
  }),
  motorista_admissao: z.date({
    required_error: "A data de admissão é obrigatória.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface MotoristasEditFormProps {
  id: string;
}

export function MotoristasEditForm({ id }: MotoristasEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motorista_nome: "",
      motorista_cnh: "",
      motorista_salario: 0,
      motorista_frete: 0,
      motorista_estadia: 0,
      motorista_admissao: new Date(),
    },
  });

  // Buscar dados do motorista
  useEffect(() => {
    async function fetchMotorista() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("motorista")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          // Converter a string de data para objeto Date
          const admissaoDate = data.motorista_admissao
            ? new Date(data.motorista_admissao)
            : new Date();

          form.reset({
            motorista_nome: data.motorista_nome || "",
            motorista_cnh: data.motorista_cnh || "",
            motorista_salario: data.motorista_salario || 0,
            motorista_frete: data.motorista_frete || 0,
            motorista_estadia: data.motorista_estadia || 0,
            motorista_admissao: admissaoDate,
          });
        } else {
          setError("Motorista não encontrado.");
        }
      } catch (err: unknown) {
        console.error("Erro ao buscar motorista:", err);
        if (err instanceof Error) {
          setError(
            err.message || "Ocorreu um erro ao buscar os dados do motorista."
          );
        } else {
          setError("Ocorreu um erro desconhecido.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchMotorista();
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("motorista")
        .update(values)
        .eq("id", id)
        .select();

      if (error) throw error;

      toast({
        title: "Motorista atualizado com sucesso!",
        description: `Os dados de ${values.motorista_nome} foram atualizados.`,
      });

      router.push("/dashboard/cadastros/motoristas");
      router.refresh();
    } catch (err: unknown) {
      console.error("Erro ao atualizar motorista:", err);
      if (err instanceof Error) {
        setError(err.message || "Ocorreu um erro ao atualizar o motorista.");
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="motorista_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Motorista</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_cnh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNH</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número da CNH"
                        maxLength={11}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Número da Carteira Nacional de Habilitação (11 dígitos)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_salario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_frete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentagem do Frete (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentual que o motorista recebe sobre o valor do frete
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_estadia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentagem da Estadia (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentual que o motorista recebe sobre o valor da estadia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_admissao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Admissão</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/cadastros/motoristas")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
