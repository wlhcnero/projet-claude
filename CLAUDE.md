# MenuQR Pro — Mémoire projet

## Stack
- Next.js 14 App Router
- Supabase (Auth + PostgreSQL + Storage)
- Tailwind CSS + shadcn/ui (composants manuels dans /components/ui)
- TypeScript strict
- Déploiement : Vercel

## Conventions
- Jamais de `any` TypeScript
- try/catch obligatoire sur tous les appels Supabase
- Mobile-first sur toutes les pages
- Variables d'environnement dans .env.local uniquement
- Un git commit par feature terminée

## Routes
- /dashboard → protégée, auth obligatoire
- /menu/[slug] → publique, aucune auth
- /login et /signup → pages auth

## Variables d'environnement requises (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

## Schéma base de données
```sql
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamp default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  position integer default 0
);

create table items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2),
  image_url text,
  available boolean default true,
  position integer default 0
);
```

## Structure des fichiers clés
- /lib/supabase.ts → client Supabase côté navigateur
- /lib/supabase-server.ts → client Supabase côté serveur (SSR)
- /lib/utils.ts → cn() helper + slugify()
- /components/ui/ → composants shadcn/ui installés manuellement
- /hooks/use-toast.ts → hook toast

## Erreurs connues — NE PAS reproduire
- [SETUP] ERREUR : ESLint rejette `interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}` (no-empty-object-type) → FIX : utiliser `type InputProps = React.InputHTMLAttributes<HTMLInputElement>` à la place
- [MENU PUBLIC] ERREUR : TypeScript "Parameter 'item' implicitly has an 'any' type" sur les items des catégories Supabase → FIX : typer explicitement le résultat avec `as MenuCategory[]`
- [AUTH] ERREUR : Prerendering fail sur /login et /signup — `createClient()` appelé au niveau module déclenche une erreur Supabase car les env vars sont vides au build → FIX : déplacer `createClient()` à l'intérieur des handlers + `export const dynamic = "force-dynamic"`
