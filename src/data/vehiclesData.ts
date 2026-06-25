/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * vehiclesData.ts
 * Curated catalog of vehicles relevant to the Zambian used-import market.
 *
 * This dataset powers the Vehicle Discovery feature. It is intentionally
 * hand-authored and extensible — add or edit entries freely. The discovery
 * engine derives repairability from `engineFamily` (how many catalog models
 * share an engine), so keep engine family strings consistent across entries
 * that genuinely share a powerplant (e.g. the Toyota 2GR-FE V6 lives in the
 * Mark X, Crown, Kluger, Harrier and Vanguard).
 *
 * `fobUsdLow` / `fobUsdHigh` are rough typical landed-from-Japan FOB ranges
 * for a representative used unit — they feed the landed-cost estimator, not
 * a live price feed, so treat them as guidance.
 */

import { VehicleCategory, MotorCarType, GoodsVehicleType, VehicleAge, FuelType } from '../types';

export type BodyStyle = 'hatchback' | 'sedan' | 'station' | 'suv' | 'mpv' | 'pickup';
export type Drivetrain = 'fwd' | 'rwd' | 'awd' | '4wd';

/** The five primary use cases the questionnaire asks about. */
export type UseCase = 'family' | 'city' | 'work' | 'offroad' | 'longDistance';
/** Driving environments common across Zambia. */
export type Terrain = 'tar' | 'gravel' | 'sand' | 'mixed';

/** Ratings are on a 1–5 scale (5 = excellent for that quality). */
export interface VehicleScores {
  // Use-case suitability
  family: number;
  city: number;
  work: number;
  offroad: number;
  longDistance: number;
  // Qualities the user can rank by importance
  comfort: number;
  speed: number;
  towing: number;
  fuelEconomy: number;
  clearance: number;
}

export interface VehicleModel {
  id: string;
  make: string;
  model: string;
  /** Local / JDM nicknames so search and the AI can match street language. */
  aka?: string[];
  body: BodyStyle;
  drivetrain: Drivetrain;
  seats: number;
  fuel: FuelType;
  /** Engine family code used for the repairability (engine ubiquity) score. */
  engineFamily: string;
  engineCC: number;

  // ── Fields used to drive the duty calculator headlessly ──
  calcCat: VehicleCategory;
  calcType: MotorCarType | GoodsVehicleType;
  /** Gross weight (tonnes) for goods vehicles; ignored otherwise. */
  calcWeight?: string;
  /** Age bracket the majority of imported units fall into. */
  typicalAge: VehicleAge;

  fobUsdLow: number;
  fobUsdHigh: number;

  /**
   * Model name as listed on cars.co.za. Set this ONLY for vehicles that are a
   * genuine South African sourcing market for Zambia — chiefly the larger
   * "SA-spec" pickups and SUVs (Hilux, Land Cruiser, Navara, D-Max, etc.).
   * When present, a model-level cars.co.za link is offered; when absent, only
   * the Japanese exporters are shown.
   */
  saName?: string;

  /**
   * Whether the Japanese exporters (SBT / BE FORWARD / Autocom) realistically
   * stock this model. Defaults to true. Set false for SA- or India-market-only
   * nameplates (e.g. Corolla Quest, Polo Vivo, Etios) so we don't show dead
   * Japan links — those show only the cars.co.za link.
   */
  jpAvailable?: boolean;

  scores: VehicleScores;
  /** How common the model already is on Zambian roads (1 = rare, 5 = everywhere). */
  popularityZm: number;
  blurb: string;
}

/**
 * Per-make weighting for parts availability / mechanic familiarity in Zambia.
 * 5 = parts on every corner; 1 = specialist-only, expect waits and cost.
 */
export const BRAND_PARTS_TIER: Record<string, number> = {
  Toyota: 5,
  Nissan: 5,
  Honda: 4,
  Mitsubishi: 4,
  Suzuki: 4,
  Isuzu: 4,
  Mazda: 3,
  Subaru: 3,
  Ford: 3,
  Hyundai: 3,
  Kia: 3,
  Volkswagen: 2,
  Jeep: 2,
  Mercedes: 2,
  BMW: 2,
  Audi: 2,
  'Land Rover': 1,
};

export const VEHICLES: VehicleModel[] = [
  // ───────────────────────── Hatchbacks ─────────────────────────
  {
    id: 'toyota-vitz', make: 'Toyota', model: 'Vitz', aka: ['Yaris', 'Platz'],
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: '1NZ-FE', engineCC: 1300,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '5+',
    fobUsdLow: 2500, fobUsdHigh: 5000,
    scores: { family: 3, city: 5, work: 2, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 5,
    blurb: 'Cheap, frugal city hatch that every roadside mechanic already knows inside out.',
  },
  {
    id: 'honda-fit', make: 'Honda', model: 'Fit', aka: ['Jazz'],
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'L15A', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '5+',
    fobUsdLow: 3000, fobUsdHigh: 6500,
    scores: { family: 4, city: 5, work: 2, offroad: 1, longDistance: 3, comfort: 3, speed: 3, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 5,
    blurb: 'The current darling — surprisingly roomy inside, sips fuel, easy to park.',
  },
  {
    id: 'mazda-demio', make: 'Mazda', model: 'Demio', aka: ['Mazda2'],
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'Skyactiv-G', engineCC: 1300,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '5+',
    fobUsdLow: 3000, fobUsdHigh: 6500,
    scores: { family: 3, city: 5, work: 2, offroad: 1, longDistance: 3, comfort: 3, speed: 3, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 3,
    blurb: 'Sharper-looking and better to drive than its rivals, with strong economy.',
  },
  {
    id: 'nissan-note', make: 'Nissan', model: 'Note',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'HR12', engineCC: 1200,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '5+',
    fobUsdLow: 2800, fobUsdHigh: 5500,
    scores: { family: 4, city: 5, work: 2, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 3,
    blurb: 'Tall, practical little hatch with a big boot for its footprint.',
  },
  {
    id: 'suzuki-swift', make: 'Suzuki', model: 'Swift',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'K12', engineCC: 1200,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '5+',
    fobUsdLow: 2800, fobUsdHigh: 5500,
    scores: { family: 3, city: 5, work: 2, offroad: 1, longDistance: 3, comfort: 3, speed: 3, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 2,
    blurb: 'Light and genuinely fun to drive; a cheap-to-run pocket rocket.',
  },
  {
    id: 'toyota-aqua', make: 'Toyota', model: 'Aqua', aka: ['Prius C'],
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'hybrid',
    engineFamily: '1NZ-FXE', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '2-5',
    fobUsdLow: 3500, fobUsdHigh: 7500,
    scores: { family: 3, city: 5, work: 2, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 4,
    blurb: 'Hybrid city champion — extraordinary fuel economy if the battery is healthy.',
  },

  // ───────────────────────── Sedans ─────────────────────────
  {
    id: 'toyota-markx', make: 'Toyota', model: 'Mark X',
    body: 'sedan', drivetrain: 'rwd', seats: 5, fuel: 'petrol',
    engineFamily: '4GR-FSE', engineCC: 2500,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '5+',
    fobUsdLow: 5000, fobUsdHigh: 9000,
    scores: { family: 3, city: 2, work: 1, offroad: 1, longDistance: 4, comfort: 4, speed: 4, towing: 2, fuelEconomy: 2, clearance: 2 },
    popularityZm: 5,
    blurb: "The current status sedan — a smooth rear-wheel-drive cruiser that replaced the Mark II line.",
  },
  {
    id: 'toyota-mark2', make: 'Toyota', model: 'Mark II', aka: ['Chaser', 'Cresta'],
    body: 'sedan', drivetrain: 'rwd', seats: 5, fuel: 'petrol',
    engineFamily: '1JZ-GE', engineCC: 2500,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '5+',
    fobUsdLow: 3500, fobUsdHigh: 7000,
    scores: { family: 3, city: 2, work: 1, offroad: 1, longDistance: 4, comfort: 4, speed: 4, towing: 2, fuelEconomy: 2, clearance: 2 },
    popularityZm: 3,
    blurb: 'The old-money executive sedan and tuner darling that the Mark X succeeded.',
  },
  {
    id: 'toyota-altezza', make: 'Toyota', model: 'Altezza', aka: ['Lexus IS200'],
    body: 'sedan', drivetrain: 'rwd', seats: 5, fuel: 'petrol',
    engineFamily: '3S-GE', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '5+',
    fobUsdLow: 3500, fobUsdHigh: 6500,
    scores: { family: 2, city: 3, work: 1, offroad: 1, longDistance: 3, comfort: 3, speed: 4, towing: 1, fuelEconomy: 2, clearance: 2 },
    popularityZm: 2,
    blurb: 'Sporty rear-driver that was the must-have status car before the Mark X arrived.',
  },
  {
    id: 'toyota-allion', make: 'Toyota', model: 'Allion', aka: ['Premio'],
    body: 'sedan', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: '2ZR-FE', engineCC: 1800,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '2-5',
    fobUsdLow: 4000, fobUsdHigh: 7500,
    scores: { family: 4, city: 4, work: 2, offroad: 1, longDistance: 4, comfort: 4, speed: 2, towing: 1, fuelEconomy: 4, clearance: 2 },
    popularityZm: 5,
    blurb: 'The sensible, comfortable family sedan — quietly bulletproof and easy to own.',
  },
  {
    id: 'toyota-crown', make: 'Toyota', model: 'Crown',
    body: 'sedan', drivetrain: 'rwd', seats: 5, fuel: 'petrol',
    engineFamily: '4GR-FSE', engineCC: 2500,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '5+',
    fobUsdLow: 6000, fobUsdHigh: 12000,
    scores: { family: 3, city: 2, work: 1, offroad: 1, longDistance: 5, comfort: 5, speed: 4, towing: 2, fuelEconomy: 2, clearance: 2 },
    popularityZm: 2,
    blurb: 'Understated luxury cruiser — limousine comfort that shares the Mark X V6.',
  },
  {
    id: 'mazda-axela', make: 'Mazda', model: 'Axela', aka: ['Mazda3'],
    body: 'sedan', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'Skyactiv-G', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '2-5',
    fobUsdLow: 4000, fobUsdHigh: 8000,
    scores: { family: 3, city: 4, work: 1, offroad: 1, longDistance: 4, comfort: 4, speed: 3, towing: 1, fuelEconomy: 4, clearance: 2 },
    popularityZm: 3,
    blurb: 'Handsome, well-built sedan that drives with real polish and good economy.',
  },
  {
    id: 'nissan-sylphy', make: 'Nissan', model: 'Bluebird Sylphy', aka: ['Sylphy'],
    body: 'sedan', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'MR20', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '5+',
    fobUsdLow: 3500, fobUsdHigh: 6500,
    scores: { family: 4, city: 4, work: 2, offroad: 1, longDistance: 4, comfort: 4, speed: 2, towing: 1, fuelEconomy: 3, clearance: 2 },
    popularityZm: 3,
    blurb: 'Roomy, comfortable family sedan — a quiet, value-packed alternative to the Allion.',
  },
  {
    id: 'subaru-impreza', make: 'Subaru', model: 'Impreza G4',
    body: 'sedan', drivetrain: 'awd', seats: 5, fuel: 'petrol',
    engineFamily: 'FB20', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '2-5',
    fobUsdLow: 4000, fobUsdHigh: 8000,
    scores: { family: 3, city: 3, work: 2, offroad: 2, longDistance: 4, comfort: 3, speed: 3, towing: 2, fuelEconomy: 3, clearance: 3 },
    popularityZm: 2,
    blurb: 'All-wheel-drive sedan that shrugs off gravel and wet roads with confidence.',
  },

  // ───────────────────────── Station wagons ─────────────────────────
  {
    id: 'toyota-fielder', make: 'Toyota', model: 'Corolla Fielder', aka: ['Fielder'],
    body: 'station', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: '2ZR-FE', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'station', typicalAge: '2-5',
    fobUsdLow: 3500, fobUsdHigh: 7000,
    scores: { family: 4, city: 4, work: 3, offroad: 1, longDistance: 4, comfort: 3, speed: 2, towing: 2, fuelEconomy: 4, clearance: 2 },
    popularityZm: 5,
    blurb: 'The do-everything wagon — family runabout by day, light hauler by weekend.',
  },
  {
    id: 'toyota-probox', make: 'Toyota', model: 'Probox', aka: ['Succeed'],
    body: 'station', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: '1NZ-FE', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'station', typicalAge: '5+',
    fobUsdLow: 2500, fobUsdHigh: 6000,
    scores: { family: 3, city: 4, work: 5, offroad: 1, longDistance: 4, comfort: 2, speed: 2, towing: 2, fuelEconomy: 5, clearance: 2 },
    popularityZm: 5,
    blurb: 'The near-indestructible business workhorse — cheap to run and famously reliable.',
  },
  {
    id: 'nissan-wingroad', make: 'Nissan', model: 'Wingroad',
    body: 'station', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'HR15', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'station', typicalAge: '5+',
    fobUsdLow: 2800, fobUsdHigh: 5500,
    scores: { family: 3, city: 4, work: 4, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 2, fuelEconomy: 4, clearance: 2 },
    popularityZm: 3,
    blurb: 'A practical, affordable wagon and a roomier alternative to the Probox.',
  },
  {
    id: 'subaru-legacy', make: 'Subaru', model: 'Legacy Touring', aka: ['Legacy', 'Outback'],
    body: 'station', drivetrain: 'awd', seats: 5, fuel: 'petrol',
    engineFamily: 'EJ20', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'station', typicalAge: '5+',
    fobUsdLow: 3500, fobUsdHigh: 7000,
    scores: { family: 4, city: 3, work: 2, offroad: 2, longDistance: 5, comfort: 4, speed: 3, towing: 2, fuelEconomy: 3, clearance: 3 },
    popularityZm: 2,
    blurb: 'Comfortable all-wheel-drive tourer that loves long gravel highways.',
  },

  // ───────────────────────── SUVs / crossovers ─────────────────────────
  {
    id: 'toyota-harrier', make: 'Toyota', model: 'Harrier', aka: ['Lexus RX'],
    body: 'suv', drivetrain: 'awd', seats: 5, fuel: 'petrol',
    engineFamily: '2AZ-FE', engineCC: 2400,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 6000, fobUsdHigh: 12000,
    scores: { family: 4, city: 3, work: 2, offroad: 2, longDistance: 4, comfort: 5, speed: 3, towing: 3, fuelEconomy: 3, clearance: 3 },
    popularityZm: 4,
    blurb: 'The aspirational urban SUV — plush, badge-proud, and shares the Camry/RAV4 engine.',
  },
  {
    id: 'mazda-cx5', make: 'Mazda', model: 'CX-5',
    body: 'suv', drivetrain: 'awd', seats: 5, fuel: 'diesel',
    engineFamily: 'Skyactiv-D', engineCC: 2200,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '2-5',
    fobUsdLow: 9000, fobUsdHigh: 16000, saName: 'CX-5',
    scores: { family: 4, city: 3, work: 2, offroad: 2, longDistance: 4, comfort: 4, speed: 3, towing: 3, fuelEconomy: 4, clearance: 3 },
    popularityZm: 5,
    blurb: 'The SUV everyone wants right now — handsome, refined, and the diesel is economical.',
  },
  {
    id: 'toyota-kluger', make: 'Toyota', model: 'Kluger', aka: ['Highlander'],
    body: 'suv', drivetrain: 'awd', seats: 7, fuel: 'petrol',
    engineFamily: '2GR-FE', engineCC: 3500,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 8000, fobUsdHigh: 15000,
    scores: { family: 5, city: 2, work: 3, offroad: 2, longDistance: 5, comfort: 4, speed: 4, towing: 4, fuelEconomy: 2, clearance: 3 },
    popularityZm: 2,
    blurb: 'Spacious 7-seat family hauler whose V6 is shared with the Harrier and Crown.',
  },
  {
    id: 'toyota-rav4', make: 'Toyota', model: 'RAV4',
    body: 'suv', drivetrain: 'awd', seats: 5, fuel: 'petrol',
    engineFamily: '2AZ-FE', engineCC: 2400,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '2-5',
    fobUsdLow: 6000, fobUsdHigh: 13000, saName: 'RAV4',
    scores: { family: 4, city: 3, work: 2, offroad: 3, longDistance: 4, comfort: 4, speed: 3, towing: 3, fuelEconomy: 3, clearance: 3 },
    popularityZm: 4,
    blurb: 'The all-rounder crossover — comfortable on tar, capable enough on gravel.',
  },
  {
    id: 'toyota-vanguard', make: 'Toyota', model: 'Vanguard',
    body: 'suv', drivetrain: 'awd', seats: 7, fuel: 'petrol',
    engineFamily: '2AZ-FE', engineCC: 2400,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 6000, fobUsdHigh: 11000,
    scores: { family: 5, city: 3, work: 2, offroad: 2, longDistance: 4, comfort: 4, speed: 3, towing: 3, fuelEconomy: 3, clearance: 3 },
    popularityZm: 2,
    blurb: 'A 7-seat RAV4 in all but name — overlooked value with parts that are everywhere.',
  },
  {
    id: 'nissan-xtrail', make: 'Nissan', model: 'X-Trail',
    body: 'suv', drivetrain: 'awd', seats: 5, fuel: 'petrol',
    engineFamily: 'QR25', engineCC: 2500,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 5000, fobUsdHigh: 11000, saName: 'X-Trail',
    scores: { family: 4, city: 3, work: 3, offroad: 3, longDistance: 4, comfort: 3, speed: 3, towing: 3, fuelEconomy: 3, clearance: 4 },
    popularityZm: 4,
    blurb: 'Boxy, rugged family SUV that handles gravel and the school run equally well.',
  },
  {
    id: 'subaru-forester', make: 'Subaru', model: 'Forester',
    body: 'suv', drivetrain: 'awd', seats: 5, fuel: 'petrol',
    engineFamily: 'FB25', engineCC: 2500,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 5000, fobUsdHigh: 11000, saName: 'Forester',
    scores: { family: 4, city: 3, work: 3, offroad: 3, longDistance: 4, comfort: 3, speed: 3, towing: 3, fuelEconomy: 3, clearance: 4 },
    popularityZm: 3,
    blurb: 'Symmetrical all-wheel drive makes this a superb companion on rough back roads.',
  },
  {
    id: 'toyota-prado', make: 'Toyota', model: 'Land Cruiser Prado', aka: ['Prado'],
    body: 'suv', drivetrain: '4wd', seats: 7, fuel: 'diesel',
    engineFamily: '1KD-FTV', engineCC: 3000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 15000, fobUsdHigh: 32000, saName: 'Land Cruiser Prado',
    scores: { family: 5, city: 2, work: 4, offroad: 5, longDistance: 5, comfort: 4, speed: 3, towing: 5, fuelEconomy: 2, clearance: 5 },
    popularityZm: 4,
    blurb: 'Serious go-anywhere 4x4 and a genuine status symbol — built to last decades.',
  },
  {
    id: 'mitsubishi-pajero', make: 'Mitsubishi', model: 'Pajero', aka: ['Shogun', 'Montero'],
    body: 'suv', drivetrain: '4wd', seats: 7, fuel: 'diesel',
    engineFamily: '4M41', engineCC: 3200,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 8000, fobUsdHigh: 18000, saName: 'Pajero',
    scores: { family: 5, city: 2, work: 4, offroad: 5, longDistance: 5, comfort: 4, speed: 3, towing: 5, fuelEconomy: 2, clearance: 5 },
    popularityZm: 3,
    blurb: 'A proven heavy-duty 4x4 — a more affordable doorway into serious off-roading.',
  },
  {
    id: 'suzuki-escudo', make: 'Suzuki', model: 'Escudo', aka: ['Vitara', 'Grand Vitara'],
    body: 'suv', drivetrain: '4wd', seats: 5, fuel: 'petrol',
    engineFamily: 'J20', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 4000, fobUsdHigh: 9000,
    scores: { family: 3, city: 3, work: 3, offroad: 4, longDistance: 3, comfort: 3, speed: 2, towing: 3, fuelEconomy: 3, clearance: 4 },
    popularityZm: 2,
    blurb: 'Compact, genuinely capable 4x4 — light, cheap to fuel, and great in the bush.',
  },
  {
    id: 'honda-vezel', make: 'Honda', model: 'Vezel', aka: ['HR-V'],
    body: 'suv', drivetrain: 'fwd', seats: 5, fuel: 'hybrid',
    engineFamily: 'L15B', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '2-5',
    fobUsdLow: 7000, fobUsdHigh: 13000, saName: 'HR-V',
    scores: { family: 3, city: 4, work: 2, offroad: 1, longDistance: 4, comfort: 4, speed: 3, towing: 2, fuelEconomy: 4, clearance: 3 },
    popularityZm: 3,
    blurb: 'Stylish compact crossover; the hybrid sips fuel around town.',
  },

  // ───────────────────────── MPVs / people movers ─────────────────────────
  {
    id: 'toyota-noah', make: 'Toyota', model: 'Noah', aka: ['Voxy', 'Esquire'],
    body: 'mpv', drivetrain: 'fwd', seats: 8, fuel: 'petrol',
    engineFamily: '3ZR-FE', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '2-5',
    fobUsdLow: 5000, fobUsdHigh: 11000,
    scores: { family: 5, city: 3, work: 3, offroad: 1, longDistance: 4, comfort: 4, speed: 2, towing: 2, fuelEconomy: 3, clearance: 2 },
    popularityZm: 5,
    blurb: 'The practical 8-seat king — family, church and small-business favourite.',
  },
  {
    id: 'toyota-wish', make: 'Toyota', model: 'Wish',
    body: 'mpv', drivetrain: 'fwd', seats: 7, fuel: 'petrol',
    engineFamily: '2ZR-FE', engineCC: 1800,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 4000, fobUsdHigh: 8000,
    scores: { family: 5, city: 4, work: 2, offroad: 1, longDistance: 4, comfort: 4, speed: 2, towing: 1, fuelEconomy: 4, clearance: 2 },
    popularityZm: 4,
    blurb: 'A low, car-like 7-seater that is easy to drive and easier to fuel.',
  },
  {
    id: 'nissan-serena', make: 'Nissan', model: 'Serena',
    body: 'mpv', drivetrain: 'fwd', seats: 8, fuel: 'petrol',
    engineFamily: 'MR20', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 4500, fobUsdHigh: 9500,
    scores: { family: 5, city: 3, work: 3, offroad: 1, longDistance: 4, comfort: 4, speed: 2, towing: 2, fuelEconomy: 3, clearance: 2 },
    popularityZm: 3,
    blurb: 'Spacious 8-seater with clever sliding doors — a strong Noah alternative.',
  },
  {
    id: 'toyota-sienta', make: 'Toyota', model: 'Sienta',
    body: 'mpv', drivetrain: 'fwd', seats: 7, fuel: 'petrol',
    engineFamily: '2NZ-FE', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '2-5',
    fobUsdLow: 4000, fobUsdHigh: 8000,
    scores: { family: 4, city: 5, work: 2, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 3,
    blurb: 'Compact 7-seater with sliding doors — squeezes a big family into a small footprint.',
  },
  {
    id: 'toyota-granvia', make: 'Toyota', model: 'Granvia', aka: ['Grand Hiace', 'HiAce'],
    body: 'mpv', drivetrain: 'rwd', seats: 8, fuel: 'diesel',
    engineFamily: '1KD-FTV', engineCC: 3000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 6000, fobUsdHigh: 13000,
    scores: { family: 5, city: 2, work: 4, offroad: 2, longDistance: 5, comfort: 4, speed: 2, towing: 4, fuelEconomy: 3, clearance: 3 },
    popularityZm: 2,
    blurb: 'Big diesel people-mover built for long-haul comfort and serious passenger loads.',
  },

  // ───────────────────────── Pickups ─────────────────────────
  {
    id: 'toyota-hilux', make: 'Toyota', model: 'Hilux',
    body: 'pickup', drivetrain: '4wd', seats: 5, fuel: 'diesel',
    engineFamily: '1KD-FTV', engineCC: 3000,
    calcCat: 'goods-vehicle', calcType: 'double-cab', calcWeight: '2.5', typicalAge: '5+',
    fobUsdLow: 12000, fobUsdHigh: 25000, saName: 'Hilux',
    scores: { family: 3, city: 2, work: 5, offroad: 5, longDistance: 4, comfort: 3, speed: 3, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 5,
    blurb: 'The unkillable workhorse — best resale value on the road and parts on every corner.',
  },
  {
    id: 'nissan-navara', make: 'Nissan', model: 'Navara', aka: ['Frontier'],
    body: 'pickup', drivetrain: '4wd', seats: 5, fuel: 'diesel',
    engineFamily: 'YD25', engineCC: 2500,
    calcCat: 'goods-vehicle', calcType: 'double-cab', calcWeight: '2.5', typicalAge: '5+',
    fobUsdLow: 9000, fobUsdHigh: 18000, saName: 'Navara',
    scores: { family: 3, city: 2, work: 5, offroad: 4, longDistance: 4, comfort: 3, speed: 3, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 3,
    blurb: 'Strong, comfortable double-cab — a capable, slightly cheaper Hilux rival.',
  },
  {
    id: 'mitsubishi-triton', make: 'Mitsubishi', model: 'Triton', aka: ['L200'],
    body: 'pickup', drivetrain: '4wd', seats: 5, fuel: 'diesel',
    engineFamily: '4D56', engineCC: 2500,
    calcCat: 'goods-vehicle', calcType: 'double-cab', calcWeight: '2.5', typicalAge: '5+',
    fobUsdLow: 8000, fobUsdHigh: 16000, saName: 'Triton',
    scores: { family: 3, city: 2, work: 5, offroad: 4, longDistance: 4, comfort: 3, speed: 3, towing: 4, fuelEconomy: 3, clearance: 5 },
    popularityZm: 3,
    blurb: 'Tough, no-nonsense farm and site truck with a well-proven diesel.',
  },
  {
    id: 'isuzu-dmax', make: 'Isuzu', model: 'D-Max', aka: ['KB'],
    body: 'pickup', drivetrain: '4wd', seats: 5, fuel: 'diesel',
    engineFamily: '4JJ1', engineCC: 3000,
    calcCat: 'goods-vehicle', calcType: 'double-cab', calcWeight: '2.5', typicalAge: '5+',
    fobUsdLow: 10000, fobUsdHigh: 20000, saName: 'D-Max',
    scores: { family: 3, city: 2, work: 5, offroad: 4, longDistance: 4, comfort: 3, speed: 2, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 3,
    blurb: 'A farmer and fleet favourite — torquey diesel built for hard, dependable work.',
  },

  // ───────────────────────── Electric ─────────────────────────
  {
    id: 'nissan-leaf', make: 'Nissan', model: 'Leaf',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'electric',
    engineFamily: 'EM57', engineCC: 0,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '2-5',
    fobUsdLow: 5000, fobUsdHigh: 11000,
    scores: { family: 3, city: 5, work: 2, offroad: 1, longDistance: 2, comfort: 4, speed: 3, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 1,
    blurb: 'Electric city runabout — exempt from customs and excise, but you must plan charging yourself.',
  },

  // ═══════════ SA-spec pickups & ladder-frame SUVs (South Africa sourcing) ═══════════
  {
    id: 'toyota-fortuner', make: 'Toyota', model: 'Fortuner',
    body: 'suv', drivetrain: '4wd', seats: 7, fuel: 'diesel',
    engineFamily: '1KD-FTV', engineCC: 3000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 14000, fobUsdHigh: 28000, saName: 'Fortuner',
    scores: { family: 5, city: 2, work: 4, offroad: 5, longDistance: 5, comfort: 4, speed: 3, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 4,
    blurb: 'Hilux-based 7-seat SUV — the default family 4x4 for SA-spec buyers, with parts on every corner.',
  },
  {
    id: 'ford-ranger', make: 'Ford', model: 'Ranger',
    body: 'pickup', drivetrain: '4wd', seats: 5, fuel: 'diesel',
    engineFamily: 'Duratorq-TDCi', engineCC: 3000,
    calcCat: 'goods-vehicle', calcType: 'double-cab', calcWeight: '2.5', typicalAge: '5+',
    fobUsdLow: 12000, fobUsdHigh: 26000, saName: 'Ranger',
    scores: { family: 3, city: 2, work: 5, offroad: 5, longDistance: 4, comfort: 4, speed: 4, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 4,
    blurb: 'The Hilux’s arch-rival — comfortable, powerful and hugely popular in SA-spec double-cab form.',
  },
  {
    id: 'ford-everest', make: 'Ford', model: 'Everest',
    body: 'suv', drivetrain: '4wd', seats: 7, fuel: 'diesel',
    engineFamily: 'Duratorq-TDCi', engineCC: 3000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 14000, fobUsdHigh: 28000, saName: 'Everest',
    scores: { family: 5, city: 2, work: 4, offroad: 5, longDistance: 5, comfort: 4, speed: 4, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 3,
    blurb: 'Ranger-based 7-seater — a spacious, capable alternative to the Fortuner.',
  },
  {
    id: 'mazda-bt50', make: 'Mazda', model: 'BT-50',
    body: 'pickup', drivetrain: '4wd', seats: 5, fuel: 'diesel',
    engineFamily: 'Duratorq-TDCi', engineCC: 3200,
    calcCat: 'goods-vehicle', calcType: 'double-cab', calcWeight: '2.5', typicalAge: '5+',
    fobUsdLow: 9000, fobUsdHigh: 18000, saName: 'BT-50',
    scores: { family: 3, city: 2, work: 5, offroad: 4, longDistance: 4, comfort: 3, speed: 3, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 2,
    blurb: 'A Ford Ranger underneath — the same proven mechanicals for less money.',
  },
  {
    id: 'vw-amarok', make: 'Volkswagen', model: 'Amarok',
    body: 'pickup', drivetrain: '4wd', seats: 5, fuel: 'diesel',
    engineFamily: 'VW-2.0-TDI', engineCC: 2000,
    calcCat: 'goods-vehicle', calcType: 'double-cab', calcWeight: '2.5', typicalAge: '5+',
    fobUsdLow: 12000, fobUsdHigh: 24000, saName: 'Amarok',
    scores: { family: 3, city: 2, work: 5, offroad: 4, longDistance: 5, comfort: 4, speed: 4, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 2,
    blurb: 'Car-like, refined bakkie with strong torque — superb on the highway, though VW parts cost more.',
  },
  {
    id: 'isuzu-mux', make: 'Isuzu', model: 'MU-X',
    body: 'suv', drivetrain: '4wd', seats: 7, fuel: 'diesel',
    engineFamily: '4JJ1', engineCC: 3000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 13000, fobUsdHigh: 26000, saName: 'MU-X',
    scores: { family: 5, city: 2, work: 4, offroad: 5, longDistance: 5, comfort: 4, speed: 3, towing: 5, fuelEconomy: 3, clearance: 5 },
    popularityZm: 2,
    blurb: 'D-Max-based 7-seat 4x4 — a rugged, durable workhorse SUV for big families and bad roads.',
  },
  {
    id: 'mitsubishi-pajero-sport', make: 'Mitsubishi', model: 'Pajero Sport',
    body: 'suv', drivetrain: '4wd', seats: 7, fuel: 'diesel',
    engineFamily: '4D56', engineCC: 2500,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 10000, fobUsdHigh: 20000, saName: 'Pajero-Sport',
    scores: { family: 5, city: 2, work: 4, offroad: 5, longDistance: 5, comfort: 4, speed: 3, towing: 4, fuelEconomy: 3, clearance: 5 },
    popularityZm: 2,
    blurb: 'Triton-based 7-seater — serious off-road ability with the same widely-serviced diesel.',
  },
  {
    id: 'toyota-landcruiser-200', make: 'Toyota', model: 'Land Cruiser 200',
    body: 'suv', drivetrain: '4wd', seats: 8, fuel: 'diesel',
    engineFamily: '1VD-FTV', engineCC: 4500,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 30000, fobUsdHigh: 65000, saName: 'Land Cruiser 200',
    scores: { family: 5, city: 1, work: 5, offroad: 5, longDistance: 5, comfort: 5, speed: 3, towing: 5, fuelEconomy: 1, clearance: 5 },
    popularityZm: 3,
    blurb: 'The ultimate go-anywhere status 4x4 — built to cross a continent and outlast everything around it.',
  },

  // ═══════════ Popular crossovers & family SUVs ═══════════
  {
    id: 'honda-crv', make: 'Honda', model: 'CR-V',
    body: 'suv', drivetrain: 'awd', seats: 5, fuel: 'petrol',
    engineFamily: 'K24', engineCC: 2400,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 6000, fobUsdHigh: 13000, saName: 'CR-V',
    scores: { family: 4, city: 3, work: 2, offroad: 2, longDistance: 4, comfort: 4, speed: 3, towing: 3, fuelEconomy: 3, clearance: 3 },
    popularityZm: 3,
    blurb: 'Comfortable, reliable family crossover with a roomy cabin and a smooth petrol engine.',
  },
  {
    id: 'nissan-qashqai', make: 'Nissan', model: 'Qashqai', aka: ['Dualis'],
    body: 'suv', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'MR20', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 6000, fobUsdHigh: 12000, saName: 'Qashqai',
    scores: { family: 4, city: 4, work: 2, offroad: 1, longDistance: 4, comfort: 4, speed: 3, towing: 2, fuelEconomy: 4, clearance: 3 },
    popularityZm: 3,
    blurb: 'Easy-driving urban crossover sharing its engine with the X-Trail and Serena.',
  },
  {
    id: 'hyundai-tucson', make: 'Hyundai', model: 'Tucson', aka: ['ix35'],
    body: 'suv', drivetrain: 'fwd', seats: 5, fuel: 'diesel',
    engineFamily: 'Hyundai-R-2.0', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 7000, fobUsdHigh: 15000, saName: 'Tucson',
    scores: { family: 4, city: 3, work: 2, offroad: 2, longDistance: 4, comfort: 4, speed: 3, towing: 3, fuelEconomy: 4, clearance: 3 },
    popularityZm: 2,
    blurb: 'Well-equipped, good-value family SUV; the diesel is strong and economical.',
  },
  {
    id: 'kia-sportage', make: 'Kia', model: 'Sportage',
    body: 'suv', drivetrain: 'fwd', seats: 5, fuel: 'diesel',
    engineFamily: 'Hyundai-R-2.0', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '5+',
    fobUsdLow: 7000, fobUsdHigh: 15000, saName: 'Sportage',
    scores: { family: 4, city: 3, work: 2, offroad: 2, longDistance: 4, comfort: 4, speed: 3, towing: 3, fuelEconomy: 4, clearance: 3 },
    popularityZm: 2,
    blurb: 'The Tucson’s mechanical twin in a sharper suit — strong value with shared, available parts.',
  },
  {
    id: 'suzuki-jimny', make: 'Suzuki', model: 'Jimny',
    body: 'suv', drivetrain: '4wd', seats: 4, fuel: 'petrol',
    engineFamily: 'K15B', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '2-5',
    fobUsdLow: 9000, fobUsdHigh: 16000, saName: 'Jimny',
    scores: { family: 2, city: 4, work: 3, offroad: 5, longDistance: 2, comfort: 2, speed: 2, towing: 2, fuelEconomy: 4, clearance: 5 },
    popularityZm: 3,
    blurb: 'Tiny, characterful and astonishingly capable off-road — a cult favourite that sips fuel.',
  },
  {
    id: 'mazda-cx30', make: 'Mazda', model: 'CX-30',
    body: 'suv', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'Skyactiv-G', engineCC: 2000,
    calcCat: 'motor-car', calcType: 'suv', typicalAge: '2-5',
    fobUsdLow: 12000, fobUsdHigh: 20000, saName: 'CX-30',
    scores: { family: 3, city: 4, work: 1, offroad: 1, longDistance: 4, comfort: 4, speed: 3, towing: 2, fuelEconomy: 4, clearance: 3 },
    popularityZm: 2,
    blurb: 'A premium-feeling compact crossover — stylish, refined and good on fuel.',
  },

  // ═══════════ SA-market hatches & sedans ═══════════
  {
    id: 'toyota-corolla-quest', make: 'Toyota', model: 'Corolla Quest',
    body: 'sedan', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: '2ZR-FE', engineCC: 1800,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '2-5',
    fobUsdLow: 6000, fobUsdHigh: 12000, saName: 'Corolla-Quest', jpAvailable: false,
    scores: { family: 4, city: 4, work: 2, offroad: 1, longDistance: 4, comfort: 4, speed: 2, towing: 1, fuelEconomy: 4, clearance: 2 },
    popularityZm: 3,
    blurb: 'SA’s default no-nonsense family sedan — cheap to run, easy to fix, and everywhere.',
  },
  {
    id: 'honda-civic', make: 'Honda', model: 'Civic',
    body: 'sedan', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'R18', engineCC: 1800,
    calcCat: 'motor-car', calcType: 'sedan', typicalAge: '5+',
    fobUsdLow: 6000, fobUsdHigh: 13000, saName: 'Civic',
    scores: { family: 4, city: 4, work: 1, offroad: 1, longDistance: 4, comfort: 4, speed: 3, towing: 1, fuelEconomy: 4, clearance: 2 },
    popularityZm: 3,
    blurb: 'Sharp, dependable and fun to drive — a longstanding favourite that holds its value.',
  },
  {
    id: 'vw-polo', make: 'Volkswagen', model: 'Polo',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'VW-TSI', engineCC: 1200,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '2-5',
    fobUsdLow: 6000, fobUsdHigh: 12000, saName: 'Polo',
    scores: { family: 3, city: 5, work: 1, offroad: 1, longDistance: 4, comfort: 4, speed: 3, towing: 1, fuelEconomy: 4, clearance: 2 },
    popularityZm: 3,
    blurb: 'SA’s best-selling hatch — solid and grown-up to drive, though the turbo needs careful upkeep.',
  },
  {
    id: 'vw-polo-vivo', make: 'Volkswagen', model: 'Polo Vivo',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'VW-1.4', engineCC: 1400,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '2-5',
    fobUsdLow: 5000, fobUsdHigh: 9000, saName: 'Polo-Vivo', jpAvailable: false,
    scores: { family: 3, city: 5, work: 1, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 1, fuelEconomy: 4, clearance: 2 },
    popularityZm: 2,
    blurb: 'The simpler, cheaper Polo built for SA — a hugely popular and affordable first car.',
  },
  {
    id: 'vw-golf', make: 'Volkswagen', model: 'Golf',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'VW-TSI', engineCC: 1400,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '5+',
    fobUsdLow: 7000, fobUsdHigh: 15000, saName: 'Golf',
    scores: { family: 4, city: 4, work: 1, offroad: 1, longDistance: 5, comfort: 5, speed: 4, towing: 2, fuelEconomy: 4, clearance: 2 },
    popularityZm: 3,
    blurb: 'The benchmark hatch — refined and quick (especially the GTI), but mind the turbo and DSG upkeep.',
  },
  {
    id: 'toyota-etios', make: 'Toyota', model: 'Etios',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: '2NR-FE', engineCC: 1500,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '2-5',
    fobUsdLow: 4000, fobUsdHigh: 8000, saName: 'Etios', jpAvailable: false,
    scores: { family: 3, city: 5, work: 2, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 2,
    blurb: 'No-frills, spacious and very cheap to run — a small-car and taxi workhorse.',
  },
  {
    id: 'suzuki-baleno', make: 'Suzuki', model: 'Baleno', aka: ['Toyota Starlet'],
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'K14B', engineCC: 1400,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '2-5',
    fobUsdLow: 6000, fobUsdHigh: 11000, saName: 'Baleno',
    scores: { family: 3, city: 5, work: 1, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 2,
    blurb: 'Lightweight, roomy and frugal — also sold rebadged as the Toyota Starlet.',
  },
  {
    id: 'hyundai-i20', make: 'Hyundai', model: 'i20',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'Hyundai-1.4', engineCC: 1400,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '2-5',
    fobUsdLow: 5000, fobUsdHigh: 10000, saName: 'i20',
    scores: { family: 3, city: 5, work: 1, offroad: 1, longDistance: 3, comfort: 3, speed: 2, towing: 1, fuelEconomy: 4, clearance: 2 },
    popularityZm: 2,
    blurb: 'Comfortable, well-built small hatch with a big boot and generous features.',
  },
  {
    id: 'kia-picanto', make: 'Kia', model: 'Picanto',
    body: 'hatchback', drivetrain: 'fwd', seats: 5, fuel: 'petrol',
    engineFamily: 'Kappa-1.2', engineCC: 1200,
    calcCat: 'motor-car', calcType: 'hatchback', typicalAge: '2-5',
    fobUsdLow: 5000, fobUsdHigh: 9000, saName: 'Picanto',
    scores: { family: 2, city: 5, work: 1, offroad: 1, longDistance: 2, comfort: 3, speed: 2, towing: 1, fuelEconomy: 5, clearance: 2 },
    popularityZm: 2,
    blurb: 'Cheerful, ultra-economical city car that is cheap to buy and cheap to keep.',
  },
  {
    id: 'nissan-np200', make: 'Nissan', model: 'NP200',
    body: 'pickup', drivetrain: 'fwd', seats: 2, fuel: 'petrol',
    engineFamily: 'Renault-K', engineCC: 1600,
    calcCat: 'goods-vehicle', calcType: 'single-cab', calcWeight: '1.2', typicalAge: '2-5',
    fobUsdLow: 5000, fobUsdHigh: 9000, saName: 'NP200', jpAvailable: false,
    scores: { family: 1, city: 4, work: 5, offroad: 2, longDistance: 3, comfort: 2, speed: 2, towing: 3, fuelEconomy: 4, clearance: 3 },
    popularityZm: 2,
    blurb: 'A half-tonne SA-built bakkie — the go-to cheap, light hauler for small businesses.',
  },
];
