-- Facilo Pro — schéma initial (Phase 1 : auth + facturation)
-- À exécuter dans Supabase (SQL Editor, ou `supabase db push` avec la CLI).

-- ---------------------------------------------------------------------
-- profiles : infos de profil créées à l'onboarding, 1:1 avec auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom_entreprise text,
  metier text,
  telephone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Un utilisateur voit/modifie son propre profil"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- subscriptions : source de vérité pour l'accès au dashboard.
-- Écrite UNIQUEMENT par les webhooks Stripe (service_role) — jamais par
-- le client, d'où l'absence de policy "insert/update" pour les users.
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none'
    check (status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Un utilisateur lit son propre abonnement"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Aucune policy insert/update/delete pour les utilisateurs : seule la
-- clé service_role (webhooks Stripe, jamais exposée au navigateur) peut
-- écrire ici. C'est volontaire — voir lib/supabase/server.ts:createServiceClient.

-- ---------------------------------------------------------------------
-- Trigger : crée automatiquement un profil vide + une ligne subscription
-- "none" à la création d'un compte auth.users (première connexion).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, status) values (new.id, 'none')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
