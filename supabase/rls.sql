-- rls.sql — Caderneta da Cláudia: Row Level Security no Supabase
-- Rode no SQL Editor do Supabase, uma vez, depois de criar as tabelas.
-- Para mudar uma policy depois, use "alter policy" ou apague e crie de novo no painel.
--
-- Rode DEPOIS de supabase/schema.sql. Supõe que as tabelas têm a coluna user_id do tipo uuid,
-- com o id de auth.users. Confira antes com:
--   select table_name, data_type from information_schema.columns
--   where table_schema = 'public' and column_name = 'user_id';

-- 1) Ligar o RLS (sem policy, ninguém lê nem escreve nada)
alter table public.lancamentos  enable row level security;
alter table public.categorias   enable row level security;
alter table public.contas       enable row level security;
alter table public.recorrencias enable row level security;
alter table public.usuarios     enable row level security;

-- Perfil: cada pessoa lê e edita só o seu.
-- Não há policy de insert/delete: o perfil é criado pelo gatilho do cadastro
-- (security definer) e apagado junto com a conta em auth.users.
create policy "usuarios_select_proprio" on public.usuarios
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "usuarios_update_proprio" on public.usuarios
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2) Lançamentos: cada pessoa só lê e escreve os seus
create policy "lancamentos_select_proprios" on public.lancamentos
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lancamentos_insert_proprios" on public.lancamentos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "lancamentos_update_proprios" on public.lancamentos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "lancamentos_delete_proprios" on public.lancamentos
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 3) Categorias
create policy "categorias_select_proprias" on public.categorias
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "categorias_insert_proprias" on public.categorias
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "categorias_update_proprias" on public.categorias
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "categorias_delete_proprias" on public.categorias
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 4) Contas
create policy "contas_select_proprias" on public.contas
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "contas_insert_proprias" on public.contas
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "contas_update_proprias" on public.contas
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "contas_delete_proprias" on public.contas
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 5) Recorrências
create policy "recorrencias_select_proprias" on public.recorrencias
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "recorrencias_insert_proprias" on public.recorrencias
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "recorrencias_update_proprias" on public.recorrencias
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "recorrencias_delete_proprias" on public.recorrencias
  for delete to authenticated using ((select auth.uid()) = user_id);
