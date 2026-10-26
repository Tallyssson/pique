-- Pique: treino e alimentação
-- Rode este arquivo inteiro no SQL Editor do Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  pessoa text not null check (pessoa in ('A', 'T')),
  altura_cm numeric not null,
  data_inicio date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.treino_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null,
  atividade text not null check (atividade in ('musculacao', 'corrida', 'natacao', 'caminhada')),
  concluido boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, data, atividade)
);

create table if not exists public.exercicio_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null,
  exercicio_id text not null,
  cargas jsonb not null default '[]'::jsonb,
  feito boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, data, exercicio_id)
);

create table if not exists public.refeicao_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null,
  refeicao text not null,
  feito boolean not null default false,
  escolha text,
  created_at timestamptz not null default now(),
  unique (user_id, data, refeicao)
);

create table if not exists public.agua_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null,
  ml integer not null default 0,
  unique (user_id, data)
);

create table if not exists public.medidas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null,
  peso_kg numeric,
  cintura numeric,
  abdomen numeric,
  quadril numeric,
  peito numeric,
  ombro numeric,
  braco_e numeric,
  braco_d numeric,
  coxa_e numeric,
  coxa_d numeric,
  panturrilha_e numeric,
  panturrilha_d numeric,
  created_at timestamptz not null default now()
);

create index if not exists exercicio_logs_busca on public.exercicio_logs (user_id, exercicio_id, data desc);
create index if not exists medidas_busca on public.medidas (user_id, data);

-- Segurança: cada pessoa só vê e altera os próprios dados
alter table public.profiles enable row level security;
alter table public.treino_logs enable row level security;
alter table public.exercicio_logs enable row level security;
alter table public.refeicao_logs enable row level security;
alter table public.agua_logs enable row level security;
alter table public.medidas enable row level security;

create policy "perfil proprio" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "treinos proprios" on public.treino_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "exercicios proprios" on public.exercicio_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "refeicoes proprias" on public.refeicao_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "agua propria" on public.agua_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "medidas proprias" on public.medidas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Depois deste arquivo, rode também supabase/migracao-02-corrida-casal.sql
