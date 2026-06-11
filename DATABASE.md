-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.trips (
  id text NOT NULL,
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
  km numeric DEFAULT 0,
  exp_days numeric DEFAULT 0,
  act_days numeric DEFAULT 0,
  over_days numeric DEFAULT 0,
  lifted numeric DEFAULT 0,
  delivered numeric DEFAULT 0,
  lpg_diff text,
  lpg_bill text,
  billed numeric DEFAULT 0,
  peshgi numeric DEFAULT 0,
  status text,
  toll numeric DEFAULT 0,
  driver_exp numeric DEFAULT 0,
  helper_exp numeric DEFAULT 0,
  overday_cost numeric DEFAULT 0,
  chalan numeric DEFAULT 0,
  chalan_resp text,
  tyre numeric DEFAULT 0,
  loadunload numeric DEFAULT 0,
  weigh numeric DEFAULT 0,
  excise numeric DEFAULT 0,
  motorway numeric DEFAULT 0,
  grease numeric DEFAULT 0,
  air numeric DEFAULT 0,
  other_exp numeric DEFAULT 0,
  delay_reason text,
  delay_notes text,
  diesel_open numeric DEFAULT 0,
  diesel_close numeric DEFAULT 0,
  diesel_total numeric DEFAULT 0,
  diesel_consumed numeric DEFAULT 0,
  diesel_avg text,
  diesel_cost numeric DEFAULT 0,
  diesel_purchases jsonb DEFAULT '[]'::jsonb,
  notes text,
  total_exp numeric DEFAULT 0,
  net_pl numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  lpg_rent_mt numeric DEFAULT 0,
  lpg_rent_total numeric DEFAULT 0,
  engine_oil_litres numeric DEFAULT 0,
  engine_oil_price numeric DEFAULT 0,
  engine_oil_cost numeric DEFAULT 0,
  from_city text,
  to_city text,
  from_province text,
  to_province text,
  approved boolean NOT NULL DEFAULT true,
  created_by text,
  lpg_rate_kg numeric DEFAULT 0,
  lpg_gl_pkr numeric DEFAULT 0,
  daily_rate numeric DEFAULT 0,
  diesel_exp numeric DEFAULT 0,
  other_expense_items jsonb DEFAULT '[]'::jsonb,
  pending_edit jsonb,
  diesel_diff_resp text DEFAULT 'company'::text,
  trip_start_date date,
  trip_end_date date,
  trip_amount numeric DEFAULT 0,
  CONSTRAINT trips_pkey PRIMARY KEY (id)
);
CREATE TABLE public.expenses (
  id text NOT NULL,
  date date,
  cat text,
  description text,
  amount numeric DEFAULT 0,
  ref text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bowsers (
  id text NOT NULL,
  cap numeric DEFAULT 0,
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT now(),
  bowser_make text,
  bowser_year text NOT NULL DEFAULT ''::text,
  rent_per_month numeric DEFAULT 0,
  approved boolean NOT NULL DEFAULT true,
  created_by text,
  pending_edit jsonb,
  CONSTRAINT bowsers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vehicles (
  id text NOT NULL,
  cnic text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  vehicle_no text NOT NULL DEFAULT ''::text,
  vehicle_make text NOT NULL DEFAULT ''::text,
  vehicle_year text NOT NULL DEFAULT ''::text,
  bowser_id text NOT NULL DEFAULT ''::text,
  driver_name text NOT NULL DEFAULT ''::text,
  approved boolean NOT NULL DEFAULT true,
  created_by text,
  pending_edit jsonb,
  CONSTRAINT vehicles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.settings (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  company text DEFAULT 'CRESS LPG CARRIERS'::text,
  yard text,
  driver_daily numeric DEFAULT 0,
  helper_daily numeric DEFAULT 0,
  trip_days numeric DEFAULT 0,
  diesel_bench numeric DEFAULT 2.6,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.provinces (
  id text NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT provinces_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cities (
  id text NOT NULL,
  province_id text NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cities_pkey PRIMARY KEY (id),
  CONSTRAINT cities_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id)
);
CREATE TABLE public.sites (
  id text NOT NULL,
  city_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sites_pkey PRIMARY KEY (id),
  CONSTRAINT sites_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id)
);
CREATE TABLE public.city_distances (
  id text NOT NULL,
  from_city_id text NOT NULL,
  to_city_id text NOT NULL,
  km numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT city_distances_pkey PRIMARY KEY (id),
  CONSTRAINT city_distances_from_city_id_fkey FOREIGN KEY (from_city_id) REFERENCES public.cities(id),
  CONSTRAINT city_distances_to_city_id_fkey FOREIGN KEY (to_city_id) REFERENCES public.cities(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'operator'::text, 'viewer'::text])),
  name text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.expense_categories (
  id text NOT NULL,
  name text NOT NULL,
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.diesel_suppliers (
  id text NOT NULL,
  name text NOT NULL,
  CONSTRAINT diesel_suppliers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.diesel_purchases (
  id text NOT NULL,
  trip_id text NOT NULL,
  date date,
  supplier text,
  litres numeric DEFAULT 0,
  price numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT diesel_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT diesel_purchases_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);