-- Facilo Pro — programme de parrainage.
-- À exécuter dans Supabase (SQL Editor, ou `supabase db push`), après 0003.

-- ---------------------------------------------------------------------
-- referrals : un code de parrainage par utilisateur, généré à la demande
-- (première visite du dashboard).
-- ---------------------------------------------------------------------
create table if not exists public.referrals (
  code text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;

create policy "Un utilisateur lit son propre code de parrainage"
  on public.referrals for select
  using (auth.uid() = user_id);

create policy "Un utilisateur cree son propre code de parrainage"
  on public.referrals for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- referral_redemptions : une ligne par filleul inscrit via un lien de
-- parrainage. Un même compte ne peut être filleul qu'une fois.
-- Écrit par le serveur uniquement (service_role, à l'inscription) — la
-- récompense n'est PAS créditée automatiquement ici : ce sera ajouté une
-- fois le montant/la durée validés (voir lib/actions/referrals.ts).
--
-- Traçabilité jusqu'à l'abonnement payant : referred_user_id référence
-- auth.users(id), donc un JOIN avec public.subscriptions (status) permet
-- de savoir combien de filleuls sont devenus des clients payants, pas
-- seulement des comptes créés. Exemple :
--   select count(*) from public.referral_redemptions rr
--   join public.subscriptions s on s.user_id = rr.referred_user_id
--   where rr.code = '...' and s.status in ('active', 'trialing');
-- ---------------------------------------------------------------------
create table if not exists public.referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.referrals(code) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.referral_redemptions enable row level security;

create policy "Un utilisateur voit les filleuls de son propre code"
  on public.referral_redemptions for select
  using (
    exists (
      select 1 from public.referrals r
      where r.code = referral_redemptions.code and r.user_id = auth.uid()
    )
  );
