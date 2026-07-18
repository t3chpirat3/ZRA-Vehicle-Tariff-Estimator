/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * marketDirectories.ts
 * Curated directories for the new source markets: Singapore, UK, UAE, Thailand, and Korea.
 * These act as browse-only directories similar to jdmDirectory.ts and saMarketDirectory.ts.
 */

export interface MarketMake {
  make: string;
  models: string[];
}

export interface MarketCategory {
  category: string;
  blurb: string;
  makes: MarketMake[];
}

export const SINGAPORE_DIRECTORY: MarketCategory[] = [
  {
    category: 'Luxury & Premium (10-Year COE)',
    blurb: 'Singapore is a major re-export hub for high-end European and Japanese vehicles. Strict 10-year COE rules mean excellent condition vehicles.',
    makes: [
      {
        make: 'Mercedes-Benz',
        models: ['S-Class', 'E-Class', 'C-Class', 'G-Class', 'GLC', 'GLE'],
      },
      {
        make: 'BMW',
        models: ['7 Series', '5 Series', '3 Series', 'X5', 'X6', 'X7', 'X3'],
      },
      {
        make: 'Audi',
        models: ['A8', 'A7', 'A6', 'A4', 'Q7', 'Q8', 'Q5'],
      },
      {
        make: 'Porsche',
        models: ['Cayenne', 'Macan', 'Panamera', '911'],
      },
      {
        make: 'Lexus',
        models: ['LS', 'GS', 'ES', 'RX', 'LX'],
      },
    ],
  },
  {
    category: 'Japanese High-End',
    blurb: 'High-trim Japanese vehicles, popular for their luxury features and impeccable maintenance.',
    makes: [
      {
        make: 'Toyota',
        models: ['Harrier', 'Alphard', 'Vellfire', 'C-HR', 'Noah', 'Voxy', 'Estima', 'Century'],
      },
      {
        make: 'Honda',
        models: ['Vezel', 'Fit', 'Odyssey'],
      },
      {
        make: 'Nissan',
        models: ['President', 'Elgrand'],
      },
    ],
  },
];

export const UK_DIRECTORY: MarketCategory[] = [
  {
    category: 'British Luxury & 4x4s',
    blurb: 'The home of Land Rover and Jaguar. The UK is a top source for premium RHD European SUVs and luxury sedans.',
    makes: [
      {
        make: 'Land Rover',
        models: ['Range Rover', 'Range Rover Sport', 'Discovery', 'Defender', 'Range Rover Evoque', 'Range Rover Velar'],
      },
      {
        make: 'Jaguar',
        models: ['XJ', 'XF', 'XE', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type'],
      },
      {
        make: 'Bentley',
        models: ['Continental', 'Bentayga', 'Flying Spur'],
      },
      {
        make: 'Rolls-Royce',
        models: ['Phantom', 'Ghost', 'Cullinan', 'Wraith'],
      },
    ],
  },
  {
    category: 'European Executive',
    blurb: 'High-quality German and European RHD vehicles.',
    makes: [
      {
        make: 'Mercedes-Benz',
        models: ['S-Class', 'E-Class', 'C-Class'],
      },
      {
        make: 'BMW',
        models: ['7 Series', '5 Series', '3 Series', 'X5'],
      },
      {
        make: 'Audi',
        models: ['A8', 'A7', 'A6', 'Q7'],
      },
      {
        make: 'Volkswagen',
        models: ['Golf', 'Touareg'],
      },
      {
        make: 'Mini',
        models: ['Cooper', 'Countryman'],
      },
    ],
  },
];

export const UAE_DIRECTORY: MarketCategory[] = [
  {
    category: 'Luxury SUVs & Off-Roaders',
    blurb: 'Dubai is the ultimate hub for heavy-duty luxury SUVs, often with premium GCC specs. (LHD and converted RHD stock)',
    makes: [
      {
        make: 'Toyota',
        models: ['Land Cruiser', 'Land Cruiser 300', 'Land Cruiser 200', 'Prado', 'Hilux', 'Alphard', 'Vellfire'],
      },
      {
        make: 'Nissan',
        models: ['Patrol', 'Armada'],
      },
      {
        make: 'Lexus',
        models: ['LX', 'GX', 'RX'],
      },
      {
        make: 'Mercedes-Benz',
        models: ['G-Class', 'GLE', 'GLS', 'S-Class', 'V-Class'],
      },
      {
        make: 'Porsche',
        models: ['Cayenne', 'Macan'],
      },
      {
        make: 'Land Rover',
        models: ['Range Rover', 'Range Rover Sport', 'Discovery'],
      },
    ],
  },
];

export const THAILAND_DIRECTORY: MarketCategory[] = [
  {
    category: 'Pickup Trucks (Bakkies)',
    blurb: 'Thailand is the global manufacturing hub for 1-ton pickups. This is where most Hiluxes and Rangers are born.',
    makes: [
      {
        make: 'Toyota',
        models: ['Hilux', 'Hilux Revo', 'Hilux Vigo', 'Hilux Vigo TRD', 'Hilux Vigo Rocco'],
      },
      {
        make: 'Ford',
        models: ['Ranger', 'Ranger Wildtrak', 'Ranger Raptor'],
      },
      {
        make: 'Isuzu',
        models: ['D-Max', 'D-Max V-Cross'],
      },
      {
        make: 'Mitsubishi',
        models: ['Triton', 'L200', 'Triton Athlete'],
      },
      {
        make: 'Nissan',
        models: ['Navara', 'NP300'],
      },
      {
        make: 'Mazda',
        models: ['BT-50'],
      },
      {
        make: 'Chevrolet',
        models: ['Colorado'],
      },
    ],
  },
  {
    category: 'PPVs (Pickup-Based SUVs) & Vans',
    blurb: 'Rugged 7-seater SUVs built on pickup chassis, designed to survive rough African roads.',
    makes: [
      {
        make: 'Toyota',
        models: ['Fortuner', 'Hiace Commuter'],
      },
      {
        make: 'Ford',
        models: ['Everest'],
      },
      {
        make: 'Isuzu',
        models: ['MU-X', 'MU-7'],
      },
      {
        make: 'Mitsubishi',
        models: ['Pajero Sport'],
      },
      {
        make: 'Nissan',
        models: ['Terra', 'Urvan'],
      },
    ],
  },
];

export const KOREA_DIRECTORY: MarketCategory[] = [
  {
    category: 'SUVs & Crossovers',
    blurb: 'Korea is rapidly growing as a source for high-value, feature-packed SUVs that match Japanese quality.',
    makes: [
      {
        make: 'Hyundai',
        models: ['Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Creta'],
      },
      {
        make: 'Kia',
        models: ['Sportage', 'Sorento', 'Telluride'],
      },
    ],
  },
  {
    category: 'Passenger Cars & Commercial',
    blurb: 'Affordable sedans and reliable light commercial vehicles.',
    makes: [
      {
        make: 'Hyundai',
        models: ['Elantra', 'Sonata', 'Accent', 'Staria', 'Starex', 'H100', 'Santa Cruz'],
      },
      {
        make: 'Kia',
        models: ['Rio', 'Cerato', 'K5', 'K7', 'K8', 'Carnival', 'K2700', 'Bongo'],
      },
    ],
  },
];
