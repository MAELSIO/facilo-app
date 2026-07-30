# Facilo Pro

Le vrai produit derrière l'offre à 19 €/mois du [site vitrine Facilo](https://maelsio.github.io/facilo/) (repo séparé `MAELSIO/facilo`, non touché par ce projet).

**État actuel : Phase 1** — inscription (magic link), paiement Stripe (essai 14 jours sans carte bancaire), résiliation self-service (Customer Portal). Les 5 outils avec sauvegarde et l'automatisation arrivent en Phase 2/3 (voir `C:\Users\PC\.claude\plans\cheeky-wobbling-locket.md` sur la machine de développement pour le plan complet).

## Stack

Next.js 16 (App Router, TypeScript) · Supabase (Postgres + Auth) · Stripe (Checkout + Customer Portal) · Tailwind CSS v4 · déploiement Vercel.

> **Next.js 16 a des changements de rupture** par rapport aux versions précédentes : le middleware s'appelle maintenant `proxy.ts` (voir `proxy.ts` à la racine), et `cookies()` est asynchrone. Avant de modifier ce projet, lisez `AGENTS.md` et `node_modules/next/dist/docs/` plutôt que de se fier à des habitudes d'une version antérieure de Next.js.

## Mise en route — étape par étape

### 1. Créer les comptes nécessaires

Aucun de ces comptes ne peut être créé à votre place (surtout Stripe, qui gère de l'argent réel) :

1. **[Supabase](https://supabase.com)** — créez un projet (gratuit). Récupérez dans _Project Settings > API_ : `Project URL`, clé `anon public`, clé `service_role` (⚠️ secrète, jamais exposée au navigateur).
2. **[Stripe](https://stripe.com)** — créez un compte. Dans _Produits_, créez "Facilo Pro" à 19 €/mois récurrent, notez l'ID du prix (`price_...`). Dans _Developers > API keys_, récupérez la clé secrète (commencez avec les clés **test**, `sk_test_...`).
3. **[Vercel](https://vercel.com)** — connectez votre compte GitHub.
4. **[Resend](https://resend.com)** — pas nécessaire avant la Phase 3 (envoi des relances automatiques), mais autant créer le compte gratuit dès maintenant.

### 2. Configurer la base de données

Dans le SQL Editor de votre projet Supabase, exécutez le contenu de `supabase/migrations/0001_init.sql`. Ça crée les tables `profiles` et `subscriptions`, active la Row Level Security, et le trigger qui initialise ces deux lignes à chaque nouvelle inscription.

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

1. `/login` → recevoir le lien → connexion.
2. Sur `/dashboard`, cliquer "Démarrer l'essai gratuit" → redirection Stripe Checkout.
3. Utiliser la carte de test `4242 4242 4242 4242`, n'importe quelle date future, n'importe quel CVC.
4. Retour sur `/dashboard` → le message d'abonnement inactif doit avoir disparu.
5. Vérifier dans Supabase (table `subscriptions`) que `status = 'trialing'`.
6. Cliquer "Gérer mon abonnement" → vérifier l'accès au Customer Portal Stripe → tester l'annulation → `status` doit repasser à `canceled` après le prochain webhook.

### 8. Déployer sur Vercel

1. Poussez ce repo sur GitHub (`MAELSIO/facilo-app` recommandé, séparé du repo vitrine).
2. Sur Vercel, "Import Project" → sélectionnez le repo → dans les paramètres, ajoutez **toutes** les variables de `.env.local` (Project Settings > Environment Variables).
3. Une fois déployé, ajoutez l'URL Vercel (ou votre domaine final) aux Redirect URLs autorisées dans Supabase (étape 3), et créez un nouvel endpoint de webhook Stripe pointant vers `https://votre-url/api/webhooks/stripe` (Developers > Webhooks > Add endpoint) — copiez le nouveau `whsec_...` dans les variables d'environnement Vercel.
4. Refaites le parcours de test complet (étape 7) sur l'URL de production, en mode Stripe **test**, avant de basculer les clés en mode **live**.

### 9. Passer en production réelle

Seulement une fois qu'une entité légale existe (Stripe l'exige pour activer les paiements réels) : remplacez les clés `sk_test_...` / `pk_test_...` par les clés live dans Vercel, recréez le webhook Stripe en mode live, et refaites le parcours de test une dernière fois avec une vraie carte.

## Ce qui n'est pas encore fait

Voir le plan complet pour le détail des phases suivantes :
- **Phase 2** : les 5 outils (facture, avis, devis, rendez-vous, aides) avec sauvegarde par client.
- **Phase 3** : l'automatisation réelle — envoi des relances programmées sans action manuelle (le cœur de la promesse "Facilo Pro").
- **Phase 4** : import de la liste d'attente actuelle, IA générative, vraie base de dispositifs d'aides, SMS.
