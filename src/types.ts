/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Types & Rates for ZRA Vehicle Tariff Estimator 2025/2026

export type VehicleAge = '0-2' | '2-5' | '5+';
export type VehicleCategory = 'motor-car' | 'goods-vehicle' | 'bus' | 'motorcycle';

export type MotorCarType = 'sedan' | 'hatchback' | 'station' | 'suv';
export type GoodsVehicleType = 'single-cab' | 'double-cab' | 'panel-van' | 'truck';
export type BusFuelType = 'diesel' | 'other-diesel';

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric';

export interface CalculatorState {
  age: VehicleAge | '';
  cat: VehicleCategory | '';
  type: MotorCarType | GoodsVehicleType | '';
  fuel: FuelType | '';
  busFuel: BusFuelType | '';
  engine: string; // e.g., '1000', '1500', '2500', '3000', '3500'
  cifEngine: string; // Engine for carbon surtax under CIF mode
  weight: string; // Gross Vehicle Weight value mapping
  seats: string;  // Seating capacity mapping e.g., '10', '20', '38', '50'
  vdp: string;    // Motorcycle VDP selection
  cifUSD: number;
  fx: number;
}

export interface CIFRates {
  cd: number; // Customs Duty
  ed: number; // Excise Duty
}

export interface CalculationResult {
  mode: 'cif' | 'specific';
  cifZMW?: number;
  base?: number;
  cd?: number;
  ed?: number;
  vat?: number;
  carbon: number;
  cband?: string;
  total: number;
  rates?: CIFRates;
  note: string;
}

export interface WatchlistItem {
  id: number;
  desc: string;
  currency: 'USD' | 'ZAR';
  price: number;
  fob: number;
  source: string;
  url: string;
  dcId: string;
  dcUrl: string;
  notes: string;
  duty: number;
  fx: number;
  savedAt: string;
  lastChecked?: string;
  calcState?: CalculatorState; // Saved state of inline calculation
}

export const CARBON_RATES: Record<string, number> = {
  '0-1500': 123.20,
  '1501-2000': 246.40,
  '2001-3000': 352.00,
  '3001+': 484.00,
};

// Rate structure T for specific duties
export const T_SPECIFIC_RATES: Record<
  '2-5' | '5+',
  Record<string, Record<string, number>>
> = {
  '2-5': {
    'bus-diesel': { '0-14': 66666.20, '15-32': 99311.30, '33-44': 219012.80, '45+': 273422.30 },
    'bus-other-diesel': { '0-14': 66666.20, '15-32': 99311.30, '33-44': 219012.80, '45+': 273422.30 },
    'sedan-petrol': { '0-1000': 39461.45, '1001-1500': 50343.35, '1501-2500': 61225.25, '2501-3000': 66666.20, '3001+': 82989.05 },
    'hatchback-petrol': { '0-1000': 34020.50, '1001-1500': 44902.40, '1501-2500': 55784.30, '2501-3000': 61225.25, '3001+': 72107.15 },
    'station-petrol': { '0-1000': 39461.45, '1001-1500': 50340.60, '1501-2500': 61225.25, '2501-3000': 66666.20, '3001+': 82989.05 },
    'suv-petrol': { '0-1000': 48866.53, '1001-1500': 56597.74, '1501-2500': 77548.10, '2501-3000': 88430.00, '3001+': 104752.85 },
    'sedan-diesel': { '0-1000': 39461.45, '1001-1500': 50343.35, '1501-2500': 61225.25, '2501-3000': 66666.20, '3001+': 82989.05 },
    'hatchback-diesel': { '0-1000': 34020.50, '1001-1500': 44902.40, '1501-2500': 55784.30, '2501-3000': 61225.25, '3001+': 77548.10 },
    'station-diesel': { '0-1000': 39461.45, '1001-1500': 50340.60, '1501-2500': 61225.25, '2501-3000': 66666.20, '3001+': 82989.05 },
    'suv-diesel': { '0-1000': 48866.53, '1001-1500': 56597.74, '1501-2500': 77548.10, '2501-3000': 88430.00, '3001+': 104752.85 },
    'single-cab-diesel': { '1-1.5': 55784.30, '1.5-3': 66666.20, '3-5': 77548.10 },
    'double-cab-diesel': { '0-3': 77548.10, '3-5': 85165.43 },
    'panel-van-diesel': { '0-1': 34510.20, '1-1.5': 39461.45, '1.5-3': 44902.40, '3-5': 55784.30 },
    'truck-diesel': { '0-2': 50343.36, '2-5': 55784.30, '5-10': 88430.00, '10-20': 110193.80, '20+': 131957.60 },
    'single-cab-petrol': { '1-1.5': 55784.30, '1.5-3': 66666.20, '3-5': 77548.10 },
    'double-cab-petrol': { '0-3': 77548.10, '3-5': 85165.43 },
    'panel-van-petrol': { '0-1': 34510.20, '1-1.5': 39461.45, '1.5-3': 44902.40, '3-5': 55784.30 },
    'truck-petrol': { '0-2': 50343.36, '2-5': 55784.30, '5-10': 88430.00, '10-20': 110193.80, '20+': 131957.60 },
    'single-cab-hybrid': { '1-1.5': 55784.30, '1.5-3': 66666.20, '3-5': 77548.10 },
    'double-cab-hybrid': { '0-3': 77548.10, '3-5': 85165.43 },
    'panel-van-hybrid': { '0-1': 34510.20, '1-1.5': 39461.45, '1.5-3': 44902.40, '3-5': 55784.30 },
    'truck-hybrid': { '0-2': 50343.36, '2-5': 55784.30, '5-10': 88430.00, '10-20': 110193.80, '20+': 131957.60 }
  },
  '5+': {
    'bus-diesel': { '0-14': 36020.50, '15-32': 38196.88, '33-44': 52343.35, '45+': 112193.80 },
    'bus-other-diesel': { '0-14': 36020.50, '15-32': 38196.88, '33-44': 52343.35, '45+': 112193.80 },
    'sedan-petrol': { '0-1000': 25138.60, '1001-1500': 29491.36, '1501-2500': 33844.12, '2501-3000': 41461.45, '3001+': 46902.40 },
    'hatchback-petrol': { '0-1000': 25138.60, '1001-1500': 29491.36, '1501-2500': 33844.12, '2501-3000': 41461.45, '3001+': 46902.40 },
    'station-petrol': { '0-1000': 25138.60, '1001-1500': 29491.36, '1501-2500': 36020.71, '2501-3000': 41461.45, '3001+': 46902.40 },
    'suv-petrol': { '0-1000': 31869.84, '1001-1500': 36508.57, '1501-2500': 49078.78, '2501-3000': 59525.40, '3001+': 68666.20 },
    'sedan-diesel': { '0-1000': 25138.60, '1001-1500': 29491.36, '1501-2500': 33844.12, '2501-3000': 41461.45, '3001+': 46902.40 },
    'hatchback-diesel': { '0-1000': 25138.60, '1001-1500': 29491.36, '1501-2500': 33844.12, '2501-3000': 41461.45, '3001+': 46902.40 },
    'station-diesel': { '0-1000': 25138.60, '1001-1500': 29491.36, '1501-2500': 36020.71, '2501-3000': 41461.45, '3001+': 46902.40 },
    'suv-diesel': { '0-1000': 31869.84, '1001-1500': 36508.57, '1501-2500': 49078.78, '2501-3000': 59525.40, '3001+': 68666.20 },
    'single-cab-diesel': { '1-1.5': 25138.60, '1.5-3': 41461.45, '3-5': 46902.40 },
    'double-cab-diesel': { '0-3': 63225.25, '3-5': 69210.29 },
    'panel-van-diesel': { '0-1': 22309.32, '1-1.5': 25138.60, '1.5-3': 41461.45, '3-5': 46902.40 },
    'truck-diesel': { '0-2': 25954.74, '2-5': 30579.55, '5-10': 36020.50, '10-20': 44726.02, '20+': 52343.35 },
    'single-cab-petrol': { '1-1.5': 25138.60, '1.5-3': 41461.45, '3-5': 46902.40 },
    'double-cab-petrol': { '0-3': 63225.25, '3-5': 69210.29 },
    'panel-van-petrol': { '0-1': 22309.32, '1-1.5': 25138.60, '1.5-3': 41461.45, '3-5': 46902.40 },
    'truck-petrol': { '0-2': 25954.74, '2-5': 30579.55, '5-10': 36020.50, '10-20': 44726.02, '20+': 52343.35 },
    'single-cab-hybrid': { '1-1.5': 25138.60, '1.5-3': 41461.45, '3-5': 46902.40 },
    'double-cab-hybrid': { '0-3': 63225.25, '3-5': 69210.29 },
    'panel-van-hybrid': { '0-1': 22309.32, '1-1.5': 25138.60, '1.5-3': 41461.45, '3-5': 46902.40 },
    'truck-hybrid': { '0-2': 25954.74, '2-5': 30579.55, '5-10': 36020.50, '10-20': 44726.02, '20+': 52343.35 }
  }
};

export const MOTO_RATES: Record<
  '2-5' | '5+',
  Record<string, number>
> = {
  '2-5': { '2000': 4275.21, '2500': 5000.21, '3000': 5725.21, '3500': 6450.21, '4000': 7175.21, '8000': 12975.21 },
  '5+': { '1500': 4049.80, '2000': 4274.80, '2500': 4499.80, '3000': 4724.80, '3500': 4949.80, '6000': 6074.80 }
};

export const CIF_PERCENTAGES: Record<
  VehicleCategory,
  Record<string, CIFRates>
> = {
  'motor-car': {
    petrol: { cd: 0.25, ed: 0.30 },
    diesel: { cd: 0.25, ed: 0.30 },
    hybrid: { cd: 0.25, ed: 0.25 },
    electric: { cd: 0.00, ed: 0.00 }
  },
  'goods-vehicle': {
    petrol: { cd: 0.15, ed: 0.10 },
    diesel: { cd: 0.15, ed: 0.10 },
    hybrid: { cd: 0.15, ed: 0.10 },
    electric: { cd: 0.00, ed: 0.00 }
  },
  'bus': {
    diesel: { cd: 0.15, ed: 0.00 },
    'other-diesel': { cd: 0.15, ed: 0.00 },
    electric: { cd: 0.00, ed: 0.00 }
  },
  'motorcycle': {
    petrol: { cd: 0.15, ed: 0.05 },
    electric: { cd: 0.00, ed: 0.00 }
  }
};

// Helpers for bounds parsing

export function zmwFormat(num: number): string {
  return 'ZMW ' + num.toLocaleString('en-ZM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isCIFMode(state: { age: VehicleAge | ''; cat: VehicleCategory | ''; fuel: FuelType | '' }): boolean {
  if (state.cat === 'motorcycle') return state.age === '0-2';
  return state.age === '0-2' || state.fuel === 'hybrid' || state.fuel === 'electric';
}

export function getEngineBand(cc: number): string {
  if (cc === 1000) return '0-1000';
  if (cc === 1500) return '1001-1500';
  if (cc === 2500) return '1501-2500';
  if (cc === 3000) return '2501-3000';
  return '3001+';
}

export function getCarbonBand(cc: number): string {
  if (cc <= 1500) return '0-1500';
  if (cc <= 2000) return '1501-2000';
  if (cc <= 3000) return '2001-3000';
  return '3001+';
}

export function getWeightBand(w: string, type: GoodsVehicleType): string {
  const wt = parseFloat(w);
  if (type === 'single-cab') {
    if (wt <= 1.5) return '1-1.5';
    if (wt <= 3) return '1.5-3';
    return '3-5';
  }
  if (type === 'double-cab') {
    return wt <= 3 ? '0-3' : '3-5';
  }
  if (type === 'panel-van') {
    if (wt <= 1) return '0-1';
    if (wt <= 1.5) return '1-1.5';
    if (wt <= 3) return '1.5-3';
    return '3-5';
  }
  if (type === 'truck') {
    if (wt <= 2) return '0-2';
    if (wt <= 5) return '2-5';
    if (wt <= 10) return '5-10';
    if (wt <= 20) return '10-20';
    return '20+';
  }
  return '';
}

export function getBusSeatBand(seatsStr: string): string {
  const n = parseInt(seatsStr, 10);
  if (n <= 14) return '0-14';
  if (n <= 32) return '15-32';
  if (n <= 44) return '33-44';
  return '45+';
}

// Global calculation function
export function calculateDuty(state: CalculatorState): CalculationResult | null {
  const { age, cat, type, fuel, busFuel, engine, cifEngine, weight, seats, vdp, cifUSD, fx } = state;
  if (!age || !cat) return null;

  const isCif = isCIFMode({ age, cat, fuel: fuel || '' as FuelType });

  if (isCif) {
    if (!cifUSD || !fx || cifUSD <= 0 || fx <= 0) return null;
    const cz = cifUSD * fx;

    const fk = (cat === 'bus' ? busFuel : fuel) || '';
    const cr = CIF_PERCENTAGES[cat]?.[fk];
    if (!cr) return null;

    const cd = cz * cr.cd;
    const ed = (cz + cd) * cr.ed;
    const vat = (cz + cd + ed) * 0.16;

    let carbon = 0;
    let cb = '';
    if (cat === 'motor-car' && fuel !== 'electric' && cifEngine && parseInt(cifEngine, 10) > 0) {
      cb = getCarbonBand(parseInt(cifEngine, 10));
      carbon = CARBON_RATES[cb] || 0;
    }

    return {
      mode: 'cif',
      cifZMW: cz,
      cd,
      ed,
      vat,
      carbon,
      cband: cb,
      total: cd + ed + vat + carbon,
      rates: cr,
      note: `CIF-based ad valorem. Customs: ${(cr.cd * 100)}% on CIF | Excise: ${(cr.ed * 100)}% on (CIF+CD) | VAT: 16% on (CIF+CD+ED). Rate: 1 USD = ZMW ${fx}.` +
        (fuel === 'electric' ? ' EVs exempt from CD & ED.' : '') +
        (fuel === 'hybrid' ? ' Hybrids get reduced 25% Excise.' : '')
    };
  } else {
    // Specific mode calculations
    if (cat === 'motorcycle') {
      if (!vdp) return null;
      if (age === '0-2') return null; // handled under CIF
      const d = MOTO_RATES[age][vdp];
      if (d === undefined) return null;
      const carbon = 123.20;
      return {
        mode: 'specific',
        base: d,
        carbon,
        total: d + carbon,
        note: 'Includes CD, VAT, Motor Vehicle Fee, ASYCUDA Fee, and Motor Vehicle Surtax. Carbon Surtax added separately.'
      };
    }

    if (cat === 'bus') {
      if (!busFuel || !seats) return null;
      if (age === '0-2') return null; // handled under CIF
      const key = `bus-${busFuel}`;
      const row = T_SPECIFIC_RATES[age][key];
      if (!row) return null;
      const v = row[getBusSeatBand(seats)];
      if (v === undefined) return null;
      return {
        mode: 'specific',
        base: v,
        carbon: 0,
        total: v,
        note: 'Includes CD, ED, VAT, Motor Vehicle Fee, ASYCUDA Fee, and Motor Vehicle Surtax 2.'
      };
    }

    if (cat === 'motor-car') {
      if (!type || !fuel || !engine) return null;
      if (age === '0-2') return null; // handled under CIF
      const key = `${type}-${fuel}`;
      const row = T_SPECIFIC_RATES[age][key];
      if (!row) return null;
      const base = row[getEngineBand(parseInt(engine, 10))];
      if (base === undefined) return null;
      const cb = getCarbonBand(parseInt(engine, 10));
      const carbon = CARBON_RATES[cb] || 0;
      return {
        mode: 'specific',
        base,
        carbon,
        cband: cb,
        total: base + carbon,
        note: 'Includes CD, ED, VAT, Motor Vehicle Fee, ASYCUDA Fee, and Motor Vehicle Surtax 2. Carbon Surtax added separately.'
      };
    }

    if (cat === 'goods-vehicle') {
      if (!type || !fuel || !weight) return null;
      if (age === '0-2') return null; // handled under CIF
      const key = `${type}-${fuel}`;
      const row = T_SPECIFIC_RATES[age][key];
      if (!row) return null;
      const v = row[getWeightBand(weight, type as GoodsVehicleType)];
      if (v === undefined) return null;
      return {
        mode: 'specific',
        base: v,
        carbon: 0,
        total: v,
        note: 'Includes CD, ED, VAT, Motor Vehicle Fee, ASYCUDA Fee, and Motor Vehicle Surtax 2.'
      };
    }
  }

  return null;
}

export const WEIGHT_OPTIONS_MAP: Record<GoodsVehicleType, { v: string; l: string }[]> = {
  'single-cab': [
    { v: '1.2', l: 'Exceeding 1t, not exceeding 1.5t' },
    { v: '2', l: 'Above 1.5t, not exceeding 3t' },
    { v: '4', l: 'Exceeding 3t, not exceeding 5t' },
  ],
  'double-cab': [
    { v: '2.5', l: 'Not exceeding 3 tonnes' },
    { v: '4', l: 'Exceeding 3t, not exceeding 5t' },
  ],
  'panel-van': [
    { v: '0.8', l: 'Not exceeding 1 tonne' },
    { v: '1.2', l: 'Exceeding 1t, not exceeding 1.5t' },
    { v: '2', l: 'Above 1.5t, not exceeding 3t' },
    { v: '4', l: 'Exceeding 3t, not exceeding 5t' },
  ],
  truck: [
    { v: '1.5', l: 'Up to 2 tonnes' },
    { v: '3', l: 'Above 2t, not exceeding 5t' },
    { v: '7', l: 'Above 5t, not exceeding 10t' },
    { v: '15', l: 'Above 10t, not exceeding 20t' },
    { v: '25', l: 'Exceeding 20 tonnes' },
  ],
};
