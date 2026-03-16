-- ============================================
-- MenuQR Pro — Système de commandes en ligne
-- ============================================

-- Table des commandes
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  table_number text not null,
  status text not null default 'pending'
    check (status in ('pending', 'preparing', 'ready', 'served')),
  total_amount numeric(10,2) not null default 0,
  customer_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table des articles dans une commande
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  item_id uuid references items(id) on delete set null,
  item_name text not null,
  item_price numeric(10,2) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  item_notes text
);

-- Index pour performance
create index if not exists orders_restaurant_id_idx on orders(restaurant_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- Row Level Security
alter table orders enable row level security;
alter table order_items enable row level security;

-- Propriétaires : voir leurs commandes
create policy "owners_select_orders"
  on orders for select
  using (
    restaurant_id in (
      select id from restaurants where user_id = auth.uid()
    )
  );

-- Propriétaires : mettre à jour le statut
create policy "owners_update_orders"
  on orders for update
  using (
    restaurant_id in (
      select id from restaurants where user_id = auth.uid()
    )
  );

-- Tout le monde peut créer une commande (clients)
create policy "public_insert_orders"
  on orders for insert
  with check (true);

-- Tout le monde peut voir sa commande (accès par id)
create policy "public_select_own_order"
  on orders for select
  using (true);

-- Propriétaires : voir les articles de leurs commandes
create policy "owners_select_order_items"
  on order_items for select
  using (
    order_id in (
      select o.id from orders o
      join restaurants r on r.id = o.restaurant_id
      where r.user_id = auth.uid()
    )
  );

-- Tout le monde peut créer des articles (clients)
create policy "public_insert_order_items"
  on order_items for insert
  with check (true);

-- Tout le monde peut voir les articles de commande
create policy "public_select_order_items"
  on order_items for select
  using (true);

-- Activer Realtime pour les commandes
alter publication supabase_realtime add table orders;
