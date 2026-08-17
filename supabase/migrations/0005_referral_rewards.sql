-- Facilo Pro — récompense de parrainage : 1 mois offert au parrain ET au
-- filleul, crédité quand le filleul devient réellement payant (pas au
-- simple essai gratuit). À exécuter après 0004_referrals.sql.

alter table public.referral_redemptions
  add column if not exists reward_granted_at timestamptz;
