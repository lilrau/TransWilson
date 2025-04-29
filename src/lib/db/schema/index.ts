import { pgTable, serial, varchar, integer, boolean, numeric, date, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Agenciadores
export const agenciadores = pgTable('agenciadores', {
  id: serial('id').primaryKey(),
  agenciador_nome: varchar('agenciador_nome', { length: 255 }).notNull(),
  agenciador_cnpj: varchar('agenciador_cnpj', { length: 32 }),
  agenciador_telefone: varchar('agenciador_telefone', { length: 32 }),
});

export const agenciadorSchema = z.object({
  agenciador_nome: z.string().min(3),
  agenciador_cnpj: z.string().optional(),
  agenciador_telefone: z.string().optional(),
});

// Despesas
export const despesas = pgTable('despesas', {
  id: serial('id').primaryKey(),
  despesa_nome: varchar('despesa_nome', { length: 255 }).notNull(),
  despesa_descricao: text('despesa_descricao'),
  despesa_tipo: varchar('despesa_tipo', { length: 64 }).notNull(),
  despesa_valor: numeric('despesa_valor').notNull(),
  despesa_veiculo: integer('despesa_veiculo'),
  despesa_motorista: integer('despesa_motorista'),
});

export const despesaSchema = z.object({
  despesa_nome: z.string().min(3),
  despesa_descricao: z.string().optional(),
  despesa_tipo: z.string().min(1),
  despesa_valor: z.coerce.number().min(0),
  despesa_veiculo: z.coerce.number().nullable().optional(),
  despesa_motorista: z.coerce.number().nullable().optional(),
});

// Entradas
export const entradas = pgTable('entradas', {
  id: serial('id').primaryKey(),
  entrada_nome: varchar('entrada_nome', { length: 255 }).notNull(),
  entrada_valor: numeric('entrada_valor').notNull(),
  entrada_descricao: text('entrada_descricao'),
  entrada_tipo: varchar('entrada_tipo', { length: 64 }).notNull(),
  entrada_frete_id: integer('entrada_frete_id'),
});

export const entradaSchema = z.object({
  entrada_nome: z.string().min(3),
  entrada_valor: z.coerce.number().min(0),
  entrada_descricao: z.string().optional(),
  entrada_tipo: z.string().min(1),
  entrada_frete_id: z.number().nullable(),
});

// Fretes
export const fretes = pgTable('fretes', {
  id: serial('id').primaryKey(),
  frete_nome: varchar('frete_nome', { length: 255 }).notNull(),
  frete_veiculo: integer('frete_veiculo').notNull(), // Consider adding foreign key references
  frete_agenciador: integer('frete_agenciador').notNull(), // Consider adding foreign key references
  frete_motorista: integer('frete_motorista').notNull(), // Consider adding foreign key references
  frete_origem: varchar('frete_origem', { length: 255 }).notNull(),
  frete_destino: varchar('frete_destino', { length: 255 }).notNull(),
  frete_distancia: numeric('frete_distancia'),
  frete_peso: text('frete_peso'), // Array workaround - Consider JSONB or separate table for better querying
  frete_valor_tonelada: numeric('frete_valor_tonelada').notNull(),
  frete_valor_total: numeric('frete_valor_total'), // Added column
  frete_baixa: boolean('frete_baixa').default(false).notNull(), // Added column
});

export const freteSchema = z.object({
  frete_nome: z.string().min(3),
  frete_veiculo: z.coerce.number().min(1),
  frete_agenciador: z.coerce.number().min(1),
  frete_motorista: z.coerce.number().min(1),
  frete_origem: z.string().min(3),
  frete_destino: z.string().min(3),
  frete_distancia: z.coerce.number().min(0).nullable().optional(),
  // Adjust frete_peso validation based on how the text field is handled (e.g., comma-separated string)
  // For now, assuming it's parsed into an array elsewhere or before validation
  frete_peso: z.array(z.coerce.number().min(0)),
  frete_valor_tonelada: z.coerce.number().min(0),
  frete_valor_total: z.coerce.number().min(0).nullable().optional(), // Added field
  frete_baixa: z.boolean().optional().default(false), // Added field
});

// Motoristas
export const motoristas = pgTable('motoristas', {
  id: serial('id').primaryKey(),
  motorista_nome: varchar('motorista_nome', { length: 255 }).notNull(),
  motorista_cnh: varchar('motorista_cnh', { length: 16 }).notNull(),
  motorista_salario: numeric('motorista_salario').notNull(),
  motorista_frete: numeric('motorista_frete').notNull(),
  motorista_estadia: numeric('motorista_estadia').notNull(),
  motorista_admissao: date('motorista_admissao').notNull(),
  motorista_senha: varchar('motorista_senha', { length: 255 }).notNull(),
});

export const motoristaSchema = z.object({
  motorista_nome: z.string().min(3),
  motorista_cnh: z.string().length(9),
  motorista_salario: z.coerce.number().min(0),
  motorista_frete: z.coerce.number().min(0).max(100),
  motorista_estadia: z.coerce.number().min(0).max(100),
  motorista_admissao: z.date(),
  motorista_senha: z.string().min(6),
});

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  user_nome: varchar('user_nome', { length: 255 }).notNull(),
  user_user: varchar('user_user', { length: 255 }).notNull(),
  user_email: varchar('user_email', { length: 255 }).notNull(),
  user_senha: varchar('user_senha', { length: 255 }),
  user_ativo: boolean('user_ativo').notNull(),
});

export const userSchema = z.object({
  user_nome: z.string().min(3),
  user_user: z.string().min(3),
  user_email: z.string().email(),
  user_senha: z.string().min(6).optional(),
  user_ativo: z.boolean(),
});

// Veiculos
export const veiculos = pgTable('veiculos', {
  id: serial('id').primaryKey(),
  veiculo_nome: varchar('veiculo_nome', { length: 255 }).notNull(),
  veiculo_placa: varchar('veiculo_placa', { length: 16 }).notNull(),
  veiculo_reboque: varchar('veiculo_reboque', { length: 64 }).notNull(),
  veiculo_ano: integer('veiculo_ano'),
  veiculo_km_inicial: integer('veiculo_km_inicial'),
  veiculo_litro_inicial: integer('veiculo_litro_inicial'),
  veiculo_motorista: integer('veiculo_motorista'),
});

export const veiculoSchema = z.object({
  veiculo_nome: z.string().min(3),
  veiculo_placa: z.string().length(7),
  veiculo_reboque: z.string().nonempty(),
  veiculo_ano: z.coerce.number().min(1900).max(new Date().getFullYear()).nullable().optional(),
  veiculo_km_inicial: z.coerce.number().min(0).nullable().optional(),
  veiculo_litro_inicial: z.coerce.number().min(0).nullable().optional(),
  veiculo_motorista: z.coerce.number().nullable().optional(),
});