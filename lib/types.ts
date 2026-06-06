export type UserRole = 'admin' | 'operator' | 'viewer';

export interface UserProfile {
  userId: string;
  role: UserRole;
  name: string;
}

export interface DieselPurchase {
  date: string;
  supplier: string;
  litres: number;
  price: number;
  amount: number;
}

export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  province_id: string;
  name: string;
}

export const SITE_TYPES = ['Plant', 'Refinery', 'Terminal', 'Yard', 'Depot', 'Port', 'Other'] as const;
export type SiteType = typeof SITE_TYPES[number];

export interface Site {
  id: string;
  city_id: string;
  name: string;
  type: SiteType;
}

export interface CityDistance {
  id: string;
  from_city_id: string;
  to_city_id: string;
  km: number;
}

export interface Trip {
  id: string;
  no: string;
  month: string;
  load_date: string;
  offload_date: string;
  vehicle: string;
  driver: string;
  helper: string;
  client: string;
  from_province: string;
  from_city: string;
  from: string;
  to_province: string;
  to_city: string;
  to: string;
  km: number;
  exp_days: number;
  act_days: number;
  over_days: number;
  lifted: number;
  delivered: number;
  lpg_diff: string;
  lpg_bill: string;
  lpg_rent_mt: number;
  lpg_rent_total: number;
  billed: number;
  peshgi: number;
  status: string;
  toll: number;
  driver_exp: number;
  helper_exp: number;
  overday_cost: number;
  chalan: number;
  chalan_resp: string;
  tyre: number;
  loadunload: number;
  weigh: number;
  excise: number;
  motorway: number;
  grease: number;
  air: number;
  engine_oil_litres: number;
  engine_oil_price: number;
  engine_oil_cost: number;
  other_exp: number;
  other_notes: string;
  delay_reason: string;
  delay_notes: string;
  diesel_open: number;
  diesel_close: number;
  diesel_total: number;
  diesel_consumed: number;
  diesel_avg: string;
  diesel_cost: number;
  diesel_purchases: DieselPurchase[];
  notes: string;
  total_exp: number;
  net_pl: number;
  approved?: boolean;
  created_by?: string;
}

export interface Party {
  id: string;
  type: 'client' | 'fuel' | 'vendor';
  name: string;
  contact: string;
  phone: string;
  city: string;
  addr: string;
  notes: string;
  opening: number;
  bal_type: 'dr' | 'cr';
}

export interface Transaction {
  id: string;
  party: string;
  date: string;
  type: 'dr' | 'cr';
  amount: number;
  ref: string;
  desc: string;
}

export interface Expense {
  id: string;
  date: string;
  cat: string;
  desc: string;
  amount: number;
  ref: string;
}

export interface PeshgiEntry {
  id: string;
  date: string;
  person: string;
  type: 'advance' | 'salary' | 'deduction' | 'settlement';
  amount: number;
  trip: string;
  notes: string;
}

export interface FleetItem {
  id: string;
  reg: string;
  model: string;
  cap: number;
  year: string;
  status: string;
  service: string;
  notes: string;
  bowser_make: string;
  bowser_no: string;
  axles: number;
}

export interface Driver {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  lic: string;
  lic_exp: string;
  salary: number;
  vehicle_id: string;
}

export interface ComplianceDoc {
  id: string;
  vehicle: string;
  doc_type: string;
  ref: string;
  issue: string;
  expiry: string;
  notes: string;
}

export interface Settings {
  company: string;
  yard: string;
  driverDaily: number;
  helperDaily: number;
  tripDays: number;
  dieselBench: number;
}

export interface AppDB {
  trips: Trip[];
  parties: Party[];
  transactions: Transaction[];
  expenses: Expense[];
  peshgi: PeshgiEntry[];
  fleet: FleetItem[];
  drivers: Driver[];
  compliance: ComplianceDoc[];
  settings: Settings;
  provinces: Province[];
  cities: City[];
  sites: Site[];
  cityDistances: CityDistance[];
}
