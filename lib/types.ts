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

export interface OtherExpense {
  label: string;
  amount: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface DieselSupplier {
  id: string;
  name: string;
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
  trip_start_date: string;
  trip_end_date: string;
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
  act_days: number;
  lifted: number;
  delivered: number;
  lpg_diff: string;
  lpg_bill: string;
  lpg_rate_kg: number;
  lpg_gl_pkr: number;
  lpg_rent_mt: number;
  lpg_rent_total: number;
  billed: number;
  peshgi: number;
  status: string;
  toll: number;
  trip_amount: number;
  daily_rate: number;
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
  other_expense_items?: OtherExpense[];
  delay_reason: string;
  delay_notes: string;
  diesel_exp?: number;
  diesel_diff_resp?: string;
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
  pending_edit?: Record<string, unknown> | null;
}



export interface Expense {
  id: string;
  date: string;
  cat: string;
  description: string;
  amount: number;
  ref: string;
}


export interface FleetItem {
  id: string;
  bowser_make: string;
  bowser_year: string;
  cap: number;
  status: string;
  rent_per_month: number;
  approved?: boolean;
  created_by?: string;
  pending_edit?: Record<string, unknown> | null;
}

export const BOWSER_STATUSES = ['Running in fleet', 'Rented out', 'Vacant', 'Maintenance'] as const;
export type BowserStatus = typeof BOWSER_STATUSES[number];

export interface Driver {
  id: string;
  vehicle_no: string;
  vehicle_make: string;
  vehicle_year: string;
  bowser_id: string;
  driver_name: string;
  cnic: string;
  phone: string;
  approved?: boolean;
  created_by?: string;
  pending_edit?: Record<string, unknown> | null;
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
  expenses: Expense[];
  fleet: FleetItem[];
  drivers: Driver[];
  settings: Settings;
  provinces: Province[];
  cities: City[];
  sites: Site[];
  cityDistances: CityDistance[];
  expenseCategories: ExpenseCategory[];
  dieselSuppliers: DieselSupplier[];
}
