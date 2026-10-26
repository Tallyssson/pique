-- Pique: migração 02 (registro da corrida e vínculo do casal)
-- Para quem já rodou o schema.sql antes. Rode este arquivo inteiro no SQL Editor do Supabase.
-- Pode rodar mais de uma vez sem problema.

-- Corrida: tempo e distância de cada sessão
alter table public.treino_logs add column if not exists duracao_min numeric;
alter table public.treino_logs add column if not exists distancia_km numeric;

-- Casal: cada perfil nasce com um código próprio; quem entra no casal passa a usar o código do outro
alter table public.profiles add column if not exists casal_id uuid not null default gen_random_uuid();

create or replace function public.meu_casal() returns uuid
language sql stable security definer set search_path = public as $$
  select casal_id from public.profiles where id = auth.uid()
$$;

create or replace function public.parceiros() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where casal_id = public.meu_casal() and id <> auth.uid()
$$;

-- Entra no casal de quem passou o código. Devolve o nome da outra pessoa.
create or replace function public.entrar_no_casal(codigo uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  outro text;
begin
  select nome into outro from public.profiles where casal_id = codigo and id <> auth.uid() limit 1;
  if outro is null then raise exception 'Código não encontrado'; end if;
  if (select count(*) from public.profiles where casal_id = codigo and id <> auth.uid()) > 1 then
    raise exception 'Esse casal já está completo';
  end if;
  update public.profiles set casal_id = codigo where id = auth.uid();
  return outro;
end;
$$;

create or replace function public.sair_do_casal() returns void
language sql security definer set search_path = public as $$
  update public.profiles set casal_id = gen_random_uuid() where id = auth.uid()
$$;

grant execute on function public.meu_casal(), public.parceiros(), public.entrar_no_casal(uuid), public.sair_do_casal() to authenticated;

-- Leitura do casal: perfil, treinos, refeições e água. Medidas e cargas continuam só de cada um.
drop policy if exists "perfil do casal" on public.profiles;
create policy "perfil do casal" on public.profiles
  for select using (casal_id = public.meu_casal());

drop policy if exists "treinos do casal" on public.treino_logs;
create policy "treinos do casal" on public.treino_logs
  for select using (user_id in (select public.parceiros()));

drop policy if exists "refeicoes do casal" on public.refeicao_logs;
create policy "refeicoes do casal" on public.refeicao_logs
  for select using (user_id in (select public.parceiros()));

drop policy if exists "agua do casal" on public.agua_logs;
create policy "agua do casal" on public.agua_logs
  for select using (user_id in (select public.parceiros()));
