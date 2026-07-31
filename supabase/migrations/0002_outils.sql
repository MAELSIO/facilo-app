-- Facilo Pro — Phase 2 : les 5 outils avec persistance par utilisateur.
-- Toutes les tables sont scopées par RLS sur user_id = auth.uid().

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  email text,
  telephone text,
  type text not null default 'particulier' check (type in ('particulier', 'professionnel')),
  created_at timestamptz not null default now()
);
alter table public.clients enable row level security;
create policy "clients: accès propriétaire" on public.clients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists clients_user_id_idx on public.clients(user_id);

-- ---------------------------------------------------------------------
create table if not exists public.factures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  numero text,
  montant numeric(10, 2) not null,
  echeance date not null,
  statut text not null default 'impayee' check (statut in ('impayee', 'payee', 'annulee')),
  niveau_relance smallint not null default 1 check (niveau_relance between 1 and 3),
  infos_paiement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.factures enable row level security;
create policy "factures: accès propriétaire" on public.factures for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists factures_user_id_idx on public.factures(user_id);
create index if not exists factures_statut_idx on public.factures(statut);

-- ---------------------------------------------------------------------
create table if not exists public.devis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  numero text,
  description text not null,
  contenu text,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  validite_jusquau date,
  created_at timestamptz not null default now()
);
alter table public.devis enable row level security;
create policy "devis: accès propriétaire" on public.devis for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists devis_user_id_idx on public.devis(user_id);

-- ---------------------------------------------------------------------
create table if not exists public.avis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  texte_avis text not null,
  ton text not null default 'positif' check (ton in ('positif', 'negatif')),
  reponse_generee text,
  plateforme text,
  created_at timestamptz not null default now()
);
alter table public.avis enable row level security;
create policy "avis: accès propriétaire" on public.avis for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists avis_user_id_idx on public.avis(user_id);

-- ---------------------------------------------------------------------
create table if not exists public.rendez_vous (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  date_heure timestamptz not null,
  service text,
  statut text not null default 'a_venir' check (statut in ('a_venir', 'honore', 'manque', 'annule')),
  created_at timestamptz not null default now()
);
alter table public.rendez_vous enable row level security;
create policy "rendez_vous: accès propriétaire" on public.rendez_vous for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists rendez_vous_user_id_idx on public.rendez_vous(user_id);
create index if not exists rendez_vous_date_idx on public.rendez_vous(date_heure);

-- ---------------------------------------------------------------------
-- Simulateur d'aides : profil sauvegardé, génération toujours à la
-- demande (pas de veille automatique en Phase 2/3 — voir guide-demarrage,
-- "confort" = hors scope de lancement).
create table if not exists public.aides_profils (
  user_id uuid primary key references auth.users(id) on delete cascade,
  metier text,
  region text,
  departement text,
  anciennete numeric,
  effectif integer,
  projets text[],
  updated_at timestamptz not null default now()
);
alter table public.aides_profils enable row level security;
create policy "aides_profils: accès propriétaire" on public.aides_profils for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- updated_at automatique sur factures (utile pour l'automatisation Phase 3,
-- qui doit détecter les changements de statut/échéance).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists factures_set_updated_at on public.factures;
create trigger factures_set_updated_at
  before update on public.factures
  for each row execute function public.set_updated_at();
