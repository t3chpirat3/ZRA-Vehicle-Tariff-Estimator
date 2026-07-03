/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * saMarketDirectory.ts
 * A lightweight, browse-only directory of nameplates sold in the South African
 * market (2000–present) that can plausibly be imported to Zambia. Unlike the
 * rich discovery catalog in vehiclesData.ts, these entries carry no scoring,
 * pricing or engine data — they exist purely so a buyer can browse the SA
 * market and jump straight to cars.co.za listings.
 *
 * Curated from the manufacturers listed on cars.co.za.
 */

export interface SaMake {
  make: string;
  models: string[];
}

export interface SaCategory {
  category: string;
  blurb: string;
  makes: SaMake[];
}

/** cars.co.za path segment: original casing, non-alphanumerics → hyphen. */
const seg = (s: string) =>
  s
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Build a cars.co.za listings URL for a make + model. Model display names may
 * contain parentheticals or slashes (e.g. "Corolla (Quest/Hatch/Cross)"); we
 * take the leading model token so the link resolves cleanly.
 */
export function carsZaUrl(make: string, model: string): string {
  const cleaned = model.split('(')[0].split('/')[0].replace(/\brange\b/i, '').trim();
  return `https://www.cars.co.za/usedcars/${seg(make)}/${seg(cleaned)}/`;
}

export const SA_MARKET_DIRECTORY: SaCategory[] = [
  {
    category: 'SA Market Leaders & Heavyweights',
    blurb: 'The backbone of the SA market — long local histories and the highest sales volumes.',
    makes: [
      { make: 'Ford', models: ['Ranger', 'Everest', 'Fiesta', 'Focus', 'Figo', 'EcoSport', 'Puma', 'Territory', 'Kuga', 'Mustang', 'Bantam', 'Ikon', 'Mondeo', 'Tourneo', 'Transit'] },
      { make: 'Isuzu', models: ['KB Series', 'D-Max', 'MU-X', 'Frontier'] },
      { make: 'Nissan', models: ['Hardbody (NP300)', 'Navara', 'NP200', '1400 Bakkie', 'Almera', 'Micra', 'Magnite', 'Qashqai', 'X-Trail', 'Patrol', 'Pathfinder', 'Juke', '350Z', '370Z', 'GT-R', 'Leaf'] },
      { make: 'Toyota', models: ['Hilux', 'Fortuner', 'Corolla (Quest/Hatch/Cross)', 'Yaris', 'Starlet', 'Vitz', 'Etios', 'Aygo', 'RunX', 'Tazz', 'RAV4', 'Land Cruiser (70/200/300/Prado)', 'C-HR', 'Urban Cruiser', 'FJ Cruiser', '86', 'Supra', 'Quantum', 'Hiace'] },
      { make: 'Volkswagen', models: ['Citi Golf', 'Polo', 'Polo Vivo', 'Golf (Mk4–Mk8)', 'Jetta', 'Passat', 'Up!', 'T-Cross', 'Taigo', 'T-Roc', 'Tiguan', 'Touareg', 'Amarok', 'Caddy', 'Transporter/Kombi/Caravelle', 'Scirocco', 'Beetle'] },
    ],
  },
  {
    category: 'Premium & Luxury Europeans',
    blurb: 'German giants, British luxury and Italian/Swedish boutique offerings.',
    makes: [
      { make: 'Alfa Romeo', models: ['147', '156', '159', 'MiTo', 'Giulietta', 'Giulia', 'Stelvio', 'Tonale', '4C', 'GT', 'Brera'] },
      { make: 'Aston Martin', models: ['DB7', 'DB9', 'DB11', 'DB12', 'Vantage', 'Vanquish', 'Rapide', 'DBX'] },
      { make: 'Audi', models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron'] },
      { make: 'BMW', models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4', 'i3', 'i8', 'iX', 'i4', 'i5', 'i7'] },
      { make: 'Jaguar', models: ['X-Type', 'S-Type', 'XE', 'XF', 'XJ', 'E-Pace', 'F-Pace', 'I-Pace', 'F-Type', 'XK'] },
      { make: 'Land Rover', models: ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Sport', 'Velar', 'Evoque'] },
      { make: 'Mercedes-AMG', models: ['A45', 'C63', 'E63', 'G63', 'GT', 'SL63'] },
      { make: 'Mercedes-Benz', models: ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'SLK', 'SLC', 'SL', 'V-Class', 'Vito', 'Sprinter', 'X-Class'] },
      { make: 'Porsche', models: ['911', 'Boxster', 'Cayman (718)', 'Cayenne', 'Macan', 'Panamera', 'Taycan'] },
      { make: 'Volvo', models: ['C30', 'S40', 'V40', 'S60', 'V60', 'S90', 'V90', 'XC40', 'XC60', 'XC90', 'EX30', 'EX90'] },
    ],
  },
  {
    category: 'European Mainstream & Stellantis',
    blurb: 'Accessible European brands, many now sharing Stellantis or Renault-alliance platforms.',
    makes: [
      { make: 'Citroen', models: ['C1', 'C2', 'C3', 'C4', 'C5 Aircross', 'DS3', 'DS4', 'DS5', 'Berlingo', 'C4 Cactus'] },
      { make: 'Fiat', models: ['Uno', 'Palio', 'Siena', 'Punto', '500', '500X', 'Panda', 'Tipo', 'Fullback', 'Ducato', 'Fiorino', 'Strada'] },
      { make: 'Mini', models: ['Hatch (Cooper)', 'Clubman', 'Countryman', 'Paceman', 'Convertible'] },
      { make: 'Opel', models: ['Corsa', 'Astra', 'Kadett', 'Meriva', 'Zafira', 'Mokka', 'Crossland', 'Grandland', 'Adam', 'Vivaro'] },
      { make: 'Peugeot', models: ['206', '207', '208', '307', '308', '2008', '3008', '5008', 'Partner', 'Boxer', 'RCZ'] },
      { make: 'Renault', models: ['Clio', 'Megane', 'Sandero', 'Kwid', 'Triber', 'Kiger', 'Duster', 'Captur', 'Koleos', 'Kadjar', 'Scenic', 'Kangoo', 'Trafic'] },
      { make: 'SEAT', models: ['Ibiza', 'Leon', 'Altea'] },
      { make: 'Smart', models: ['ForTwo', 'ForFour'] },
    ],
  },
  {
    category: 'Asian Mainstream (Japan & Korea)',
    blurb: 'Dominant in entry-level, family SUV and crossover segments.',
    makes: [
      { make: 'Daihatsu', models: ['Charade', 'Sirion', 'Terios', 'Materia', 'Gran Max'] },
      { make: 'Datsun', models: ['Go', 'Go+'] },
      { make: 'Honda', models: ['Jazz', 'Civic', 'Accord', 'Ballade', 'Brio', 'Amaze', 'HR-V', 'CR-V', 'BR-V', 'WR-V', 'Elevate', 'S2000'] },
      { make: 'Hyundai', models: ['Atos', 'i10', 'Grand i10', 'Getz', 'i20', 'i30', 'Accent', 'Elantra', 'Venue', 'Creta', 'Kona', 'Tucson (ix35)', 'Santa Fe', 'Palisade', 'H100', 'H-1', 'Staria'] },
      { make: 'Kia', models: ['Picanto', 'Rio', 'Cerato', 'Pegas', 'Sonet', 'Seltos', 'Carens', 'Sportage', 'Sorento', 'Carnival', 'K2700'] },
      { make: 'Lexus', models: ['IS', 'ES', 'GS', 'LS', 'UX', 'NX', 'RX', 'LX', 'LC', 'RC'] },
      { make: 'Mazda', models: ['2', '3', '5', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-5', 'BT-50', 'RX-8', 'Etude', 'Rustler'] },
      { make: 'Mitsubishi', models: ['Colt', 'Triton', 'ASX', 'Eclipse Cross', 'Outlander', 'Pajero', 'Pajero Sport', 'Lancer'] },
      { make: 'Subaru', models: ['Impreza', 'WRX', 'STI', 'Forester', 'Outback', 'XV', 'Legacy', 'BRZ'] },
      { make: 'Suzuki', models: ['Alto', 'Celerio', 'S-Presso', 'Swift', 'Ignis', 'Baleno', 'Ciaz', 'Dzire', 'Jimny', 'Vitara', 'Grand Vitara', 'Fronx', 'Brezza', 'Ertiga', 'Eeco'] },
    ],
  },
  {
    category: 'The American Contingent',
    blurb: 'Large SUVs and value hatches — several have since exited the SA market.',
    makes: [
      { make: 'Chevrolet', models: ['Spark', 'Aveo', 'Sonic', 'Cruze', 'Optra', 'Lumina', 'Captiva', 'Trailblazer', 'Utility'] },
      { make: 'Chrysler', models: ['PT Cruiser', '300C', 'Crossfire', 'Grand Voyager'] },
      { make: 'Hummer', models: ['H3'] },
      { make: 'Jeep', models: ['Wrangler', 'Cherokee', 'Grand Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Patriot'] },
    ],
  },
  {
    category: 'Chinese, Indian & Emerging Wave',
    blurb: 'The fastest-growing SA segment, reshaping crossover, SUV and bakkie buying.',
    makes: [
      { make: 'BYD', models: ['Atto 3', 'Dolphin', 'Seal'] },
      { make: 'Changan', models: ['Star Bakkie', 'CS35', 'Hunter'] },
      { make: 'Chery', models: ['QQ3', 'Tiggo', 'J2', 'Tiggo 4 Pro', 'Tiggo 7 Pro', 'Tiggo 8 Pro'] },
      { make: 'Foton', models: ['Tunland', 'View'] },
      { make: 'Geely', models: ['LC', 'LC Cross', 'MK', 'Coolray', 'E2', 'E5'] },
      { make: 'GWM', models: ['Steed', 'P-Series', 'Tank 300', 'Tank 500', 'Ora 03', 'Hover', 'H5'] },
      { make: 'Haval', models: ['H1', 'H2', 'H6', 'H6 GT', 'H9', 'Jolion'] },
      { make: 'Ineos', models: ['Grenadier', 'Quartermaster'] },
      { make: 'JAC', models: ['T6', 'T8', 'T9', 'X200'] },
      { make: 'Jaecoo', models: ['J5', 'J7', 'J8'] },
      { make: 'Jetour', models: ['Dashing', 'T2', 'X70 Plus'] },
      { make: 'JMC', models: ['Boarding', 'Vigus', 'Landwind'] },
      { make: 'Mahindra', models: ['Bolero', 'Pik Up', 'Scorpio', 'Scorpio-N', 'XUV300', 'XUV500', 'XUV700', 'KUV100', 'Thar'] },
      { make: 'MG', models: ['MG3', 'MG6'] },
      { make: 'Omoda', models: ['C5', 'C9'] },
      { make: 'Proton', models: ['Arena', 'Gen-2', 'Satria Neo', 'Persona', 'Saga', 'X50', 'X70', 'X90'] },
      { make: 'SsangYong', models: ['Korando', 'Musso', 'Rexton', 'Kyron', 'Actyon'] },
      { make: 'Tata', models: ['Indica', 'Indigo', 'Bolt', 'Xenon', 'Super Ace', 'Telcoline'] },
    ],
  },
];
