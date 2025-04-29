CREATE TABLE "agenciadores" (
	"id" serial PRIMARY KEY NOT NULL,
	"agenciador_nome" varchar(255) NOT NULL,
	"agenciador_cnpj" varchar(32),
	"agenciador_telefone" varchar(32)
);
--> statement-breakpoint
CREATE TABLE "despesas" (
	"id" serial PRIMARY KEY NOT NULL,
	"despesa_nome" varchar(255) NOT NULL,
	"despesa_descricao" text,
	"despesa_tipo" varchar(64) NOT NULL,
	"despesa_valor" numeric NOT NULL,
	"despesa_veiculo" integer,
	"despesa_motorista" integer
);
--> statement-breakpoint
CREATE TABLE "entradas" (
	"id" serial PRIMARY KEY NOT NULL,
	"entrada_nome" varchar(255) NOT NULL,
	"entrada_valor" numeric NOT NULL,
	"entrada_descricao" text,
	"entrada_tipo" varchar(64) NOT NULL,
	"entrada_frete_id" integer
);
--> statement-breakpoint
CREATE TABLE "fretes" (
	"id" serial PRIMARY KEY NOT NULL,
	"frete_nome" varchar(255) NOT NULL,
	"frete_veiculo" integer NOT NULL,
	"frete_agenciador" integer NOT NULL,
	"frete_motorista" integer NOT NULL,
	"frete_origem" varchar(255) NOT NULL,
	"frete_destino" varchar(255) NOT NULL,
	"frete_distancia" numeric,
	"frete_peso" text,
	"frete_valor_tonelada" numeric NOT NULL,
	"frete_valor_total" numeric,
	"frete_baixa" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motoristas" (
	"id" serial PRIMARY KEY NOT NULL,
	"motorista_nome" varchar(255) NOT NULL,
	"motorista_cnh" varchar(16) NOT NULL,
	"motorista_salario" numeric NOT NULL,
	"motorista_frete" numeric NOT NULL,
	"motorista_estadia" numeric NOT NULL,
	"motorista_admissao" date NOT NULL,
	"motorista_senha" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_nome" varchar(255) NOT NULL,
	"user_user" varchar(255) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"user_senha" varchar(255),
	"user_ativo" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "veiculos" (
	"id" serial PRIMARY KEY NOT NULL,
	"veiculo_nome" varchar(255) NOT NULL,
	"veiculo_placa" varchar(16) NOT NULL,
	"veiculo_reboque" varchar(64) NOT NULL,
	"veiculo_ano" integer,
	"veiculo_km_inicial" integer,
	"veiculo_litro_inicial" integer,
	"veiculo_motorista" integer
);
