import type { Trip } from './types';

export const MIN_TRIPS_FOR_RANKING = 3;
export const SCORE_WEIGHTS = { diesel: 0.4, overrun: 0.35, cost: 0.25 } as const;

// Expense categories (from other_expense_items[].label) that are normal, expected
// operating costs — these feed the vehicle's cost score. Anything NOT in this list
// (chalans, tyre bills, "diesel tank" top-ups, etc.) is treated as a risk/discretionary
// cost: real money, but not something a driver's score should be penalized for on an
// unverified basis. New/unrecognized labels default to risk, not core, on purpose.
const CORE_EXPENSE_LABELS = new Set([
  'tolls',
  'weighbridge / manshana',
  'load / unload',
  'over days',
  'excise + pp',
  'greasing / service',
  'engine oil',
  'document issue',
  'holidays',
  'eid days',
  'water cooler',
  'medical',
  'madical',
  'helper bus rent',
  'watchover',
  'safety equipment rent',
  'safty sman rent',
  'safety',
  'safty',
  'equipment rent',
  'saman rent',
]);

function classifyExpenseLabel(label: string): 'core' | 'risk' {
  return CORE_EXPENSE_LABELS.has(label.trim().toLowerCase()) ? 'core' : 'risk';
}

function coreExpenseOf(t: Trip): number {
  const base = (t.trip_amount || 0) + (t.engine_oil_cost || 0) + (t.diesel_cost || 0);
  const items = (t.other_expense_items || [])
    .filter(i => classifyExpenseLabel(i.label) === 'core')
    .reduce((s, i) => s + (i.amount || 0), 0);
  return base + items;
}

function riskExpenseOf(t: Trip): number {
  return (t.other_expense_items || [])
    .filter(i => classifyExpenseLabel(i.label) === 'risk')
    .reduce((s, i) => s + (i.amount || 0), 0);
}

export interface VehiclePerformance {
  vehicle: string;
  tripCount: number;
  avgKmLtr: number | null;
  dieselBenchDelta: number | null;
  overrunRatio: number | null;
  costPerTon: number | null;
  coreCostPerTon: number | null;
  riskExpense: number;
  riskShare: number | null;
  dieselScore: number | null;
  overrunScore: number | null;
  costScore: number | null;
  compositeScore: number | null;
  rankable: boolean;
}

interface PeerStats {
  avgActDays: number | null;
  avgKmPerLtr: number | null;
  avgCoreCostPerTon: number | null;
  vehicleCount: number;
}

function routeKey(t: Trip): string | null {
  if (!t.from_city || !t.to_city) return null;
  return `${t.from_city}→${t.to_city}`;
}

// Quartile breakpoints of trip distance, used as a fallback peer group when a route
// has too few distinct vehicles to compare fairly (e.g. a one-off long haul).
function computeKmQuartiles(trips: Trip[]): number[] {
  const kms = trips.map(t => t.km).filter(k => k > 0).sort((a, b) => a - b);
  if (kms.length < 4) return [];
  const q = (p: number) => kms[Math.min(kms.length - 1, Math.floor(p * kms.length))];
  return [q(0.25), q(0.5), q(0.75)];
}

function distanceBucketKey(km: number, quartiles: number[]): string | null {
  if (!km || quartiles.length === 0) return null;
  const [q1, q2, q3] = quartiles;
  const idx = km <= q1 ? 0 : km <= q2 ? 1 : km <= q3 ? 2 : 3;
  return `bucket:${idx}`;
}

function buildPeerStats(trips: Trip[], keyFn: (t: Trip) => string | null): Map<string, PeerStats> {
  const groups = new Map<string, Trip[]>();
  for (const t of trips) {
    const key = keyFn(t);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const result = new Map<string, PeerStats>();
  for (const [key, gTrips] of groups) {
    const vehicles = new Set(gTrips.map(t => t.vehicle).filter(Boolean));
    if (vehicles.size < 2) continue; // no peer to compare against

    const daysTrips = gTrips.filter(t => t.act_days > 0);
    const avgActDays = daysTrips.length
      ? daysTrips.reduce((s, t) => s + t.act_days, 0) / daysTrips.length
      : null;

    const dieselTrips = gTrips.filter(t => t.diesel_consumed > 0);
    const totalKm = dieselTrips.reduce((s, t) => s + (t.km || 0), 0);
    const totalConsumed = dieselTrips.reduce((s, t) => s + t.diesel_consumed, 0);
    const avgKmPerLtr = totalConsumed > 0 ? totalKm / totalConsumed : null;

    const costTrips = gTrips.filter(t => t.delivered > 0);
    const totalCore = costTrips.reduce((s, t) => s + coreExpenseOf(t), 0);
    const totalDelivered = costTrips.reduce((s, t) => s + t.delivered, 0);
    const avgCoreCostPerTon = totalDelivered > 0 ? totalCore / (totalDelivered / 1000) : null;

    result.set(key, { avgActDays, avgKmPerLtr, avgCoreCostPerTon, vehicleCount: vehicles.size });
  }
  return result;
}

// Route peers first (same city pair, >=2 vehicles); falls back to a distance-bucket
// peer group when the route is too rare to compare fairly on its own.
function peerStatsFor(
  t: Trip,
  routeStats: Map<string, PeerStats>,
  bucketStats: Map<string, PeerStats>,
  quartiles: number[],
): PeerStats | undefined {
  const rk = routeKey(t);
  if (rk && routeStats.has(rk)) return routeStats.get(rk);
  const bk = distanceBucketKey(t.km, quartiles);
  if (bk) return bucketStats.get(bk);
  return undefined;
}

// Standalone risk-share lookup, independent of the full scoring pipeline (no
// dieselBench needed) — for report views that just want the expense-risk split
// per vehicle without route/peer normalization.
export function vehicleExpenseRisk(trips: Trip[]): Map<string, { riskExpense: number; riskShare: number | null }> {
  const byVehicle = new Map<string, Trip[]>();
  for (const t of trips) {
    const v = t.vehicle || '(unknown)';
    if (!byVehicle.has(v)) byVehicle.set(v, []);
    byVehicle.get(v)!.push(t);
  }

  const result = new Map<string, { riskExpense: number; riskShare: number | null }>();
  for (const [v, vTrips] of byVehicle) {
    const core = vTrips.reduce((s, t) => s + coreExpenseOf(t), 0);
    const risk = vTrips.reduce((s, t) => s + riskExpenseOf(t), 0);
    const total = core + risk;
    result.set(v, { riskExpense: risk, riskShare: total > 0 ? risk / total : null });
  }
  return result;
}

export function weightedAvgKmLtr(trips: Trip[]): number | null {
  const eligible = trips.filter(t => t.diesel_consumed > 0);
  if (eligible.length === 0) return null;
  const totalConsumed = eligible.reduce((s, t) => s + t.diesel_consumed, 0);
  const totalKm = eligible.reduce((s, t) => s + (t.km || 0), 0);
  return totalConsumed > 0 ? totalKm / totalConsumed : null;
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

// Averages each trip's own value against its peer group's average, one ratio per
// trip (ratio > 1 = worse than peers for days/cost, better for diesel km/ltr),
// then means the per-trip ratios for the vehicle. Trips without a usable peer
// group (e.g. a solo route with no fallback bucket data) are simply skipped,
// not defaulted to "average" — that would misrepresent an unmeasured trip as par.
function vehiclePeerRatios(
  vehicleTrips: Trip[],
  routeStats: Map<string, PeerStats>,
  bucketStats: Map<string, PeerStats>,
  quartiles: number[],
) {
  const dayRatios: number[] = [];
  const dieselRatios: number[] = [];
  const costRatios: number[] = [];

  for (const t of vehicleTrips) {
    const peer = peerStatsFor(t, routeStats, bucketStats, quartiles);
    if (!peer) continue;

    if (t.act_days > 0 && peer.avgActDays) {
      dayRatios.push(t.act_days / peer.avgActDays);
    }
    if (t.diesel_consumed > 0 && peer.avgKmPerLtr) {
      dieselRatios.push((t.km / t.diesel_consumed) / peer.avgKmPerLtr);
    }
    if (t.delivered > 0 && peer.avgCoreCostPerTon) {
      const tripCorePerTon = coreExpenseOf(t) / (t.delivered / 1000);
      costRatios.push(tripCorePerTon / peer.avgCoreCostPerTon);
    }
  }

  return {
    overrunRatio: mean(dayRatios),
    dieselPeerRatio: mean(dieselRatios),
    costPeerRatio: mean(costRatios),
  };
}

function normalize(value: number, min: number, max: number, higherIsBetter: boolean): number {
  if (max === min) return 50;
  const pct = (value - min) / (max - min);
  return (higherIsBetter ? pct : 1 - pct) * 100;
}

export function computeFleetPerformance(trips: Trip[], dieselBench: number): VehiclePerformance[] {
  const completed = trips.filter(t => t.status === 'Completed' && t.vehicle);

  const byVehicle = new Map<string, Trip[]>();
  for (const t of completed) {
    if (!byVehicle.has(t.vehicle)) byVehicle.set(t.vehicle, []);
    byVehicle.get(t.vehicle)!.push(t);
  }

  const quartiles = computeKmQuartiles(completed);
  const routeStats = buildPeerStats(completed, routeKey);
  const bucketStats = buildPeerStats(completed, t => distanceBucketKey(t.km, quartiles));

  const raw = [...byVehicle.entries()].map(([vehicle, vTrips]) => {
    const avgKmLtr = weightedAvgKmLtr(vTrips);
    const dieselBenchDelta = avgKmLtr !== null ? avgKmLtr - dieselBench : null;

    const totalExp = vTrips.reduce((s, t) => s + (t.total_exp || 0), 0);
    const totalDelivered = vTrips.reduce((s, t) => s + (t.delivered || 0), 0);
    const costPerTon = totalDelivered > 0 ? totalExp / (totalDelivered / 1000) : null;

    const totalCore = vTrips.reduce((s, t) => s + coreExpenseOf(t), 0);
    const coreCostPerTon = totalDelivered > 0 ? totalCore / (totalDelivered / 1000) : null;

    const riskExpense = vTrips.reduce((s, t) => s + riskExpenseOf(t), 0);
    const totalTracked = totalCore + riskExpense;
    const riskShare = totalTracked > 0 ? riskExpense / totalTracked : null;

    const { overrunRatio, dieselPeerRatio, costPeerRatio } = vehiclePeerRatios(vTrips, routeStats, bucketStats, quartiles);

    return {
      vehicle,
      tripCount: vTrips.length,
      avgKmLtr,
      dieselBenchDelta,
      overrunRatio,
      costPerTon,
      coreCostPerTon,
      riskExpense,
      riskShare,
      dieselPeerRatio,
      costPeerRatio,
    };
  });

  function minMax(values: number[]): [number, number] {
    return [Math.min(...values), Math.max(...values)];
  }

  const dieselValues = raw.map(r => r.dieselPeerRatio).filter((v): v is number => v !== null);
  const overrunValues = raw.map(r => r.overrunRatio).filter((v): v is number => v !== null);
  const costValues = raw.map(r => r.costPeerRatio).filter((v): v is number => v !== null);

  const [dieselMin, dieselMax] = dieselValues.length ? minMax(dieselValues) : [0, 0];
  const [overrunMin, overrunMax] = overrunValues.length ? minMax(overrunValues) : [0, 0];
  const [costMin, costMax] = costValues.length ? minMax(costValues) : [0, 0];

  return raw
    .map((r): VehiclePerformance => {
      const dieselScore = r.dieselPeerRatio !== null ? normalize(r.dieselPeerRatio, dieselMin, dieselMax, true) : null;
      const overrunScore = r.overrunRatio !== null ? normalize(r.overrunRatio, overrunMin, overrunMax, false) : null;
      const costScore = r.costPeerRatio !== null ? normalize(r.costPeerRatio, costMin, costMax, false) : null;

      const parts: Array<[number, number]> = [];
      if (dieselScore !== null) parts.push([dieselScore, SCORE_WEIGHTS.diesel]);
      if (overrunScore !== null) parts.push([overrunScore, SCORE_WEIGHTS.overrun]);
      if (costScore !== null) parts.push([costScore, SCORE_WEIGHTS.cost]);

      const weightSum = parts.reduce((s, [, w]) => s + w, 0);
      const compositeScore = weightSum > 0
        ? parts.reduce((s, [score, w]) => s + score * w, 0) / weightSum
        : null;

      return {
        vehicle: r.vehicle,
        tripCount: r.tripCount,
        avgKmLtr: r.avgKmLtr,
        dieselBenchDelta: r.dieselBenchDelta,
        overrunRatio: r.overrunRatio,
        costPerTon: r.costPerTon,
        coreCostPerTon: r.coreCostPerTon,
        riskExpense: r.riskExpense,
        riskShare: r.riskShare,
        dieselScore,
        overrunScore,
        costScore,
        compositeScore,
        rankable: r.tripCount >= MIN_TRIPS_FOR_RANKING && compositeScore !== null,
      };
    })
    .sort((a, b) => (b.compositeScore ?? -1) - (a.compositeScore ?? -1));
}

export function getWorstPerformers(perf: VehiclePerformance[], n = 5): VehiclePerformance[] {
  return perf.filter(p => p.rankable).slice(-n).reverse();
}

export function getBestPerformers(perf: VehiclePerformance[], n = 5): VehiclePerformance[] {
  return perf.filter(p => p.rankable).slice(0, n);
}

// Vehicles whose share of cost coming from risk/discretionary categories (tyre
// bills, chalans, unexplained "diesel tank" top-ups, etc.) is notably above the
// fleet average — a signal to look into, not a performance penalty.
export function getHighestRisk(perf: VehiclePerformance[], n = 5): VehiclePerformance[] {
  const withRisk = perf.filter(p => p.rankable && p.riskShare !== null);
  return [...withRisk].sort((a, b) => (b.riskShare ?? 0) - (a.riskShare ?? 0)).slice(0, n);
}

export function fleetAvgRiskShare(perf: VehiclePerformance[]): number | null {
  const values = perf.filter(p => p.rankable).map(p => p.riskShare).filter((v): v is number => v !== null);
  return mean(values);
}
