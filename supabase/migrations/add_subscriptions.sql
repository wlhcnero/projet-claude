create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  plan text not null default 'free',
  updated_at timestamp default now()
);

alter table subscriptions disable row level security;
