# Facilo Pro

Le vrai produit derrière l'offre à 19 €/mois du [site vitrine Facilo](https://maelsio.github.io/facilo/) (repo séparé `MAELSIO/facilo`, non touché par ce projet).

**État actuel : Phases 1, 2 et 3 codées.** Inscription (magic link), paiement Stripe (essai 14 jours sans carte bancaire), résiliation self-service, les 5 outils avec sauvegarde par client, et l'automatisation réelle des relances (cron quotidien). Reste la **Phase 4** (fast-follows non bloquants : import de la liste d'attente, IA générative, vraie base d'aides, SMS — voir `C:\Users\PC\.claude\plans\cheeky-wobbling-locket.md`).

**Tout ce code est écrit et compile, mais n'a pas encore tourné contre de vrais comptes Supabase/Stripe/Resend** — voir "Mise en route" ci-dessous.

## Stack

Next.js 16 (App Router, TypeScript) · Supabase (Postgres + Auth + triggers SQL) · Stripe (Checkout + Customer Portal) · Resend (email) · Vercel (hébergement + Cron) · Tailwind CSS v4.

> **Next.js 16 a des changements de rupture** par rapport aux versions précédentes : le middleware s'appelle maintenant `proxy.ts` (voir `proxy.ts` à la racine), et `cookies()` est asynchrone. Avant de modifier ce projet, lisez `AGENTS.md` et `node_modules/next/dist/docs/` plutôt que de se fier à des habitudes d'une version antérieure de Next.js.

## Comment fonctionne l'automatisation (Phase 3)

C'est le cœur de la promesse "Facilo Pro" ("les relances partent seules"). Le mécanisme :

1. Vous créez une facture ou un rendez-vous dans le dashboard.
2. Un **trigger SQL** (`supabase/migrations/0003_automatisation.sql`) programme automatiquement les rappels dans `scheduled_reminders` : J+7 / J+15 / J+30 après l'échéance pour une facture, la veille à 10h pour un rendez-vous.
3. Marquer une facture "payée" ou un rendez-vous "honoré/manqué" annule les rappels en attente (même trigger).
4. `vercel.json` déclenche `GET /api/cron/send-reminders` chaque jour à 8h UTC. La route trouve les rappels dus, régénère le texte avec les mêmes fonctions que le dashboard (`lib/generators/*`, portées du site vitrine), et envoie par email via Resend au client concerné.

**Prérequis pour que ça envoie réellement quelque chose** : chaque `client` doit avoir un email renseigné (champ optionnel à la création) — sans ça, le rappel est marqué `failed` avec une raison explicite, sans planter le reste du traitement.

## Mise en route — étape par étape

### 1. Créer les comptes nécessaires

Aucun de ces comptes ne peut être créé à votre place (surtout Stripe, qui gère de l'argent réel) :

1. **[Supabase](https://supabase.com)** — créez un projet (gratuit). Récupérez dans _Project Settings > API_ : `Project URL`, clé `anon public`, clé `service_role` (⚠️ secrète, jamais exposée au navigateur).
2. **[Stripe](https://stripe.com)** — créez un compte. Dans _Produits_, créez "Facilo Pro" à 19 €/mois récurrent, notez l'ID du prix (`price_...`). Dans _Developers > API keys_, récupérez la clé secrète (commencez avec les clés **test**, `sk_test_...`).
3. **[Vercel](https://vercel.com)** — connectez votre compte GitHub.
4. **[Resend](https://resend.com)** — créez un compte gratuit, ajoutez et vérifiez un domaine d'envoi (_Domains_) si vous en avez un ; sinon les emails de test peuvent partir depuis `onboarding@resend.dev` (limité, à ne pas utiliser en production réelle).

### 2. Configurer la base de données

Dans le SQL Editor de votre projet Supabase, exécutez **dans l'ordre** :
1. `supabase/migrations/0001_init.sql` — `profiles`, `subscriptions`.
2. `supabase/migrations/0002_outils.sql` — `clients`, `factures`, `devis`, `avis`, `rendez_vous`, `aides_profils`.
3. `supabase/migrations/0003_automatisation.sql` — `scheduled_reminders` + les triggers de planification automatique.

### 3. Configurer l'email "Magic Link" dans Supabase

_Authentication > Email Templates > Magic Link_ — vérifiez que le lien pointe vers :
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
```
Et dans _Authentication > URL Configuration_, ajoutez votre URL de développement (`http://localhost:3000`) et votre future URL de production aux **Redirect URLs** autorisées.

### 4. Variables d'environnement

```bash
cp .env.example .env.local
```
Remplissez `.env.local` avec les valeurs récupérées à l'étape 1 (voir les commentaires dans le fichier pour où trouver chaque clé).

### 5. Lancer en local

```bash
npm install
npm run dev
```

Ouvrez `http://localhost:3000` → redirigé vers `/login` → entrez votre email → cliquez le lien reçu → vous arrivez sur `/dashboard`.

### 6. Tester les webhooks Stripe en local

Le paiement ne mettra pas à jour `subscriptions.status` sans un webhook actif. En local, utilisez le [Stripe CLI](https://docs.stripe.com/stripe-cli) :

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copiez le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET` de `.env.local`, puis redémarrez `npm run dev`.

### 7. Parcours de test complet (à faire avant toute mise en ligne)

**Abonnement**
1. `/login` → recevoir le lien → connexion.
2. Sur `/dashboard`, cliquer "Démarrer l'essai gratuit" → redirection Stripe Checkout.
3. Utiliser la carte de test `4242 4242 4242 4242`, n'importe quelle date future, n'importe quel CVC.
4. Retour sur `/dashboard` → le message d'abonnement inactif doit avoir disparu.
5. Vérifier dans Supabase (table `subscriptions`) que `status = 'trialing'`.
6. Cliquer "Gérer mon abonnement" → vérifier l'accès au Customer Portal Stripe → tester l'annulation → `status` doit repasser à `canceled` après le prochain webhook.

**Les 5 outils**
7. `/dashboard/parametres` → renseigner le nom de l'entreprise (utilisé dans tous les documents générés).
8. `/dashboard/clients` → ajouter un client **avec un email valide** (indispensable pour tester l'envoi automatique).
9. `/dashboard/factures` → créer une facture avec une échéance dans le passé → "Voir la relance" doit afficher un email cohérent.
10. `/dashboard/devis`, `/dashboard/avis`, `/dashboard/rendez-vous`, `/dashboard/aides` → tester la génération sur chacun.

**L'automatisation (cron)**
11. Dans Supabase (Table Editor), vérifiez que `scheduled_reminders` contient bien des lignes après avoir créé une facture/un RDV à l'étape 9-10.
12. Testez la route de cron manuellement en local :
    ```bash
    curl -H "Authorization: Bearer VOTRE_CRON_SECRET" http://localhost:3000/api/cron/send-reminders
    ```
    Elle ne traite que les rappels dont `send_at <= maintenant` — pour tester sans attendre J+7, modifiez temporairement `send_at` d'une ligne dans Supabase à une date passée avant d'appeler la route.
13. Vérifiez la réception réelle de l'email (boîte du client de test), et que la ligne `scheduled_reminders` passe à `status = 'sent'`.

### 8. Déployer sur Vercel

1. Poussez ce repo sur GitHub (déjà fait : `MAELSIO/facilo-app`).
2. Sur Vercel, "Import Project" → sélectionnez le repo → dans les paramètres, ajoutez **toutes** les variables de `.env.local` (Project Settings > Environment Variables), y compris `CRON_SECRET` (générez une chaîne aléatoire longue).
3. Une fois déployé, ajoutez l'URL Vercel (ou votre domaine final) aux Redirect URLs autorisées dans Supabase (étape 3), et créez un nouvel endpoint de webhook Stripe pointant vers `https://votre-url/api/webhooks/stripe` (Developers > Webhooks > Add endpoint) — copiez le nouveau `whsec_...` dans les variables d'environnement Vercel.
4. Vercel active automatiquement le cron défini dans `vercel.json` dès le déploiement — vérifiez son exécution dans l'onglet _Cron Jobs_ du projet Vercel.
5. Refaites le parcours de test complet (étape 7) sur l'URL de production, en mode Stripe **test**, avant de basculer les clés en mode **live**.

### 9. Passer en production réelle

Seulement une fois qu'une entité légale existe (Stripe l'exige pour activer les paiements réels) : remplacez les clés `sk_test_...` / `pk_test_...` par les clés live dans Vercel, recréez le webhook Stripe en mode live, vérifiez un vrai domaine d'envoi dans Resend (pas `onboarding@resend.dev`), et refaites le parcours de test une dernière fois avec une vraie carte.

## Ce qui n'est pas encore fait (Phase 4 — non bloquant pour lancer)

- Import structuré de la liste d'attente actuelle du site vitrine (aujourd'hui juste des emails dans une boîte).
- IA générative en remplacement des templates déterministes (`lib/generators/*`).
- Vraie base de dispositifs d'aides (aujourd'hui 12 exemples dans `lib/generators/simulateur-aides.ts`).
- SMS en plus de l'email pour les rappels automatiques.
- Génération de types TypeScript depuis le schéma Supabase réel (`supabase gen types typescript`) — le code actuel type les entités manuellement, sans risque mais sans la garantie stricte que donnerait le typage généré.
