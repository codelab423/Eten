-- ============================================================
-- "Wat eten we vanavond?" - database voor Supabase
--
-- Plak dit hele bestand in: Supabase dashboard -> SQL Editor
-- -> New query -> plakken -> Run
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. profiles: naam per gebruiker (zodat we weten WIE stemt)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  naam text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Iedereen mag profielen lezen"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Eigen profiel aanmaken"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Eigen profiel aanpassen"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Automatisch een profiel aanmaken zodra iemand zich registreert.
-- De naam komt uit het "naam"-veld dat we meesturen bij het aanmaken
-- van het account (zie js/auth.js).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, naam)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'naam', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2. gerechten: de lijst met mogelijke gerechten
-- ------------------------------------------------------------
create table if not exists public.gerechten (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  emoji text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.gerechten enable row level security;

create policy "Iedereen mag gerechten lezen"
  on public.gerechten for select
  to authenticated
  using (true);

create policy "Ingelogde gebruikers mogen gerechten toevoegen"
  on public.gerechten for insert
  to authenticated
  with check (auth.uid() = created_by);

-- ------------------------------------------------------------
-- 3. stemmen: 1 stem per gebruiker per dag (wijzigen mag)
-- ------------------------------------------------------------
create table if not exists public.stemmen (
  id uuid primary key default gen_random_uuid(),
  gerecht_id uuid not null references public.gerechten (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  datum date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, datum)
);

alter table public.stemmen enable row level security;

create policy "Iedereen mag stemmen lezen"
  on public.stemmen for select
  to authenticated
  using (true);

create policy "Eigen stem uitbrengen"
  on public.stemmen for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Eigen stem aanpassen"
  on public.stemmen for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Eigen stem verwijderen"
  on public.stemmen for delete
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. gegeten: geschiedenis van wat we daadwerkelijk gegeten hebben
-- ------------------------------------------------------------
create table if not exists public.gegeten (
  id uuid primary key default gen_random_uuid(),
  gerecht_id uuid not null references public.gerechten (id) on delete cascade,
  datum date not null default current_date,
  vastgesteld_door uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.gegeten enable row level security;

create policy "Iedereen mag geschiedenis lezen"
  on public.gegeten for select
  to authenticated
  using (true);

create policy "Ingelogde gebruikers mogen vastleggen wat we eten"
  on public.gegeten for insert
  to authenticated
  with check (auth.uid() = vastgesteld_door);

-- ------------------------------------------------------------
-- 5. Realtime aanzetten, zodat iedereen live updates ziet
-- ------------------------------------------------------------
-- Let op: als je deze query een tweede keer draait en een tabel
-- stond er al in, krijg je een foutmelding "already member of
-- publication" - dat is geen probleem, dan staat het al goed.
alter publication supabase_realtime add table public.gerechten;
alter publication supabase_realtime add table public.stemmen;
alter publication supabase_realtime add table public.gegeten;
