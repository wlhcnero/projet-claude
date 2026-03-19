-- Groupes d'options (ex: "Taille", "Cuisson", "Extras")
create table item_option_groups (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  name text not null,
  required boolean default false,
  multiple boolean default false, -- permet sélection multiple
  position integer default 0
);

-- Options individuelles (ex: "S -0€", "M +1€", "Saignant")
create table item_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references item_option_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(10,2) default 0,
  position integer default 0
);

-- Désactiver RLS
alter table item_option_groups disable row level security;
alter table item_options disable row level security;
