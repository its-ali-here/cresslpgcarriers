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
  other_notes text,
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
  CONSTRAINT trips_pkey PRIMARY KEY (id)
);
CREATE TABLE public.parties (
  id text NOT NULL,
  type text NOT NULL,
  name text NOT NULL,
  contact text,
  phone text,
  city text,
  addr text,
  notes text,
  opening numeric DEFAULT 0,
  bal_type text DEFAULT 'dr'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parties_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id text NOT NULL,
  party text,
  date date,
  type text,
  amount numeric DEFAULT 0,
  ref text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_party_fkey FOREIGN KEY (party) REFERENCES public.parties(id)
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
CREATE TABLE public.fleet (
  id text NOT NULL,
  reg text UNIQUE,
  model text,
  cap numeric DEFAULT 0,
  year text,
  status text DEFAULT 'Active'::text,
  service date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  bowser_make text,
  bowser_no text,
  axles numeric DEFAULT 0,
  CONSTRAINT fleet_pkey PRIMARY KEY (id)
);
CREATE TABLE public.drivers (
  id text NOT NULL,
  name text NOT NULL,
  cnic text,
  phone text,
  lic text,
  lic_exp date,
  salary numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  vehicle_id text,
  CONSTRAINT drivers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.compliance (
  id text NOT NULL,
  vehicle text,
  doc_type text,
  ref text,
  issue date,
  expiry date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT compliance_pkey PRIMARY KEY (id)
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
CREATE TABLE public.peshgi (
  id text NOT NULL,
  date date,
  person text,
  type text,
  amount numeric DEFAULT 0,
  trip text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT peshgi_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'operator'::text, 'viewer'::text])),
  name text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);