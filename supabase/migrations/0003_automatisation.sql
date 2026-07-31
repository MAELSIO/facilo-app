-- Facilo Pro — Phase 3 : automatisation des relances (le cœur de la promesse).
--
-- Table générique qui unifie les deux entités ayant réellement besoin d'un
-- envoi programmé : factures (J+7/J+15/J+30 après échéance) et rendez-vous
-- (rappel la veille). Une seule route de cron scanne cette table.

create table if not exists public.scheduled_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('facture', 'rendez_vous')),
  source_id uuid not null,
  channel text not null default 'email' check (channel in ('email')),
  send_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

alter table public.scheduled_reminders enable row level security;
create policy "scheduled_reminders: lecture propriétaire" on public.scheduled_reminders for select
  using (auth.uid() = user_id);
-- Pas de policy insert/update pour les utilisateurs : ces lignes sont créées
-- par des triggers (security definer) et mises à jour par le cron via la
-- clé service_role. Voir lib/supabase/server.ts:createServiceClient.

create index if not exists scheduled_reminders_due_idx
  on public.scheduled_reminders (send_at)
  where status = 'pending';
create index if not exists scheduled_reminders_source_idx
  on public.scheduled_reminders (source_type, source_id);

-- ---------------------------------------------------------------------
-- Trigger : à chaque facture insérée/mise à jour, recalcule ses 3 rappels
-- (J+7, J+15, J+30 après l'échéance). On annule d'abord les rappels
-- "pending" existants pour cette facture, puis on recrée — plus simple
-- et plus sûr qu'un diff incrémental, et le volume par facture est trivial (3 lignes).
create or replace function public.schedule_facture_reminders()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.statut <> 'impayee' then
    update public.scheduled_reminders
      set status = 'cancelled'
      where source_type = 'facture' and source_id = new.id and status = 'pending';
    return new;
  end if;

  update public.scheduled_reminders
    set status = 'cancelled'
    where source_type = 'facture' and source_id = new.id and status = 'pending';

  insert into public.scheduled_reminders (user_id, source_type, source_id, send_at)
  values
    (new.user_id, 'facture', new.id, (new.echeance + interval '7 days')),
    (new.user_id, 'facture', new.id, (new.echeance + interval '15 days')),
    (new.user_id, 'facture', new.id, (new.echeance + interval '30 days'));

  return new;
end;
$$;

drop trigger if exists on_facture_upsert_schedule on public.factures;
create trigger on_facture_upsert_schedule
  after insert or update of echeance, statut on public.factures
  for each row execute function public.schedule_facture_reminders();

-- ---------------------------------------------------------------------
-- Trigger : à chaque rendez-vous inséré/modifié, programme un rappel la
-- veille à 10h. Si le RDV a lieu dans moins de 24h, pas de rappel (trop tard).
create or replace function public.schedule_rdv_reminder()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  reminder_time timestamptz;
begin
  update public.scheduled_reminders
    set status = 'cancelled'
    where source_type = 'rendez_vous' and source_id = new.id and status = 'pending';

  if new.statut <> 'a_venir' then
    return new;
  end if;

  reminder_time := (new.date_heure::date - interval '1 day') + interval '10 hours';

  if reminder_time > now() then
    insert into public.scheduled_reminders (user_id, source_type, source_id, send_at)
    values (new.user_id, 'rendez_vous', new.id, reminder_time);
  end if;

  return new;
end;
$$;

drop trigger if exists on_rdv_upsert_schedule on public.rendez_vous;
create trigger on_rdv_upsert_schedule
  after insert or update of date_heure, statut on public.rendez_vous
  for each row execute function public.schedule_rdv_reminder();
