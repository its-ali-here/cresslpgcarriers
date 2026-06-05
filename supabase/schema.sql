-- CRESS LPG Carriers — Supabase schema
-- Run this in the Supabase SQL editor to create all required tables.

create table if not exists trips (
  id text primary key,
  no text,
  month text,
  load_date date,
  offload_date date,
  vehicle text,
  driver text,
  helper text,
  client text,
  from_location text,
  to_location text,
  km numeric default 0,
  exp_days numeric default 0,
  act_days numeric default 0,
  over_days numeric default 0,
  lifted numeric default 0,
  delivered numeric default 0,
  lpg_diff text,
  lpg_bill text,
  billed numeric default 0,
  peshgi numeric default 0,
  status text,
  toll numeric default 0,
  driver_exp numeric default 0,
  helper_exp numeric default 0,
  overday_cost numeric default 0,
  chalan numeric default 0,
  chalan_resp text,
  tyre numeric default 0,
  loadunload numeric default 0,
  weigh numeric default 0,
  excise numeric default 0,
  motorway numeric default 0,
  grease numeric default 0,
  air numeric default 0,
  other_exp numeric default 0,
  other_notes text,
  delay_reason text,
  delay_notes text,
  diesel_open numeric default 0,
  diesel_close numeric default 0,
  diesel_total numeric default 0,
  diesel_consumed numeric default 0,
  diesel_avg text,
  diesel_cost numeric default 0,
  diesel_purchases jsonb default '[]',
  notes text,
  total_exp numeric default 0,
  net_pl numeric default 0,
  created_at timestamptz default now()
);

create table if not exists parties (
  id text primary key,
  type text not null,   -- 'client' | 'fuel' | 'vendor'
  name text not null,
  contact text,
  phone text,
  city text,
  addr text,
  notes text,
  opening numeric default 0,
  bal_type text default 'dr',  -- 'dr' | 'cr'
  created_at timestamptz default now()
);

create table if not exists transactions (
  id text primary key,
  party text references parties(id) on delete cascade,
  date date,
  type text,            -- 'dr' | 'cr'
  amount numeric default 0,
  ref text,
  description text,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id text primary key,
  date date,
  cat text,
  desc text,
  amount numeric default 0,
  ref text,
  created_at timestamptz default now()
);

create table if not exists peshgi (
  id text primary key,
  date date,
  person text,          -- driver id
  type text,            -- 'advance' | 'salary' | 'deduction' | 'settlement'
  amount numeric default 0,
  trip text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists fleet (
  id text primary key,
  reg text unique,
  model text,
  cap numeric default 0,
  year text,
  status text default 'Active',
  service date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists drivers (
  id text primary key,
  name text not null,
  role text default 'Driver',   -- 'Driver' | 'Helper'
  cnic text,
  phone text,
  lic text,
  lic_exp date,
  daily numeric default 0,
  salary numeric default 0,
  status text default 'Active',
  addr text,
  created_at timestamptz default now()
);

create table if not exists compliance (
  id text primary key,
  vehicle text,
  doc_type text,
  ref text,
  issue date,
  expiry date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists settings (
  id integer primary key default 1,
  company text default 'CRESS LPG CARRIERS',
  yard text,
  driver_daily numeric default 0,
  helper_daily numeric default 0,
  trip_days numeric default 0,
  diesel_bench numeric default 2.6,
  -- Enforce single row
  constraint settings_single_row check (id = 1)
);

-- Insert default settings row
insert into settings (id) values (1) on conflict (id) do nothing;

-- Enable Row Level Security (configure policies as needed for your auth setup)
alter table trips enable row level security;
alter table parties enable row level security;
alter table transactions enable row level security;
alter table expenses enable row level security;
alter table peshgi enable row level security;
alter table fleet enable row level security;
alter table drivers enable row level security;
alter table compliance enable row level security;
alter table settings enable row level security;

-- Allow all operations for authenticated users (adjust for multi-tenant if needed)
create policy "Allow all for authenticated" on trips for all using (true) with check (true);
create policy "Allow all for authenticated" on parties for all using (true) with check (true);
create policy "Allow all for authenticated" on transactions for all using (true) with check (true);
create policy "Allow all for authenticated" on expenses for all using (true) with check (true);
create policy "Allow all for authenticated" on peshgi for all using (true) with check (true);
create policy "Allow all for authenticated" on fleet for all using (true) with check (true);
create policy "Allow all for authenticated" on drivers for all using (true) with check (true);
create policy "Allow all for authenticated" on compliance for all using (true) with check (true);
create policy "Allow all for authenticated" on settings for all using (true) with check (true);
