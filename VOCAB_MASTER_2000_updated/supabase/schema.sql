-- VOCAB MASTER 2000: 최소 클라우드 저장 테이블
-- Supabase Dashboard > SQL Editor에서 전체 실행하세요.
create table if not exists public.user_learning_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  words jsonb not null default '[]'::jsonb,
  idioms jsonb not null default '[]'::jsonb,
  word_daily integer not null default 20,
  idiom_daily integer not null default 10,
  records jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_learning_data enable row level security;

drop policy if exists "Users can view own learning data" on public.user_learning_data;
create policy "Users can view own learning data"
on public.user_learning_data for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning data" on public.user_learning_data;
create policy "Users can insert own learning data"
on public.user_learning_data for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning data" on public.user_learning_data;
create policy "Users can update own learning data"
on public.user_learning_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
