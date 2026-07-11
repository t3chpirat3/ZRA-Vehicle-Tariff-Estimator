export type InlandRouteId = 'dar_nakonde' | 'durban_chirundu' | 'durban_gaborone_kazungula' | 'durban_roro_dar' | 'sa_local_drive';

export interface InlandRoute {
  id: InlandRouteId;
  label: string;
  origin: string;
  destination: string;
  description: string;
  transportMode: 'Carrier' | 'Drive' | 'RoRo + Drive';
  estimatedCostMin: number; // USD
  estimatedCostMax: number; // USD
  transitDaysMin: number;
  transitDaysMax: number;
  unregisteredAllowed: boolean;
  borderFees: {
    name: string;
    estimatedCostUSD: number;
  }[];
}

export const INLAND_ROUTES: InlandRoute[] = [
  {
    id: 'dar_nakonde',
    label: 'Dar Es Salaam → Nakonde (Carrier/Drive)',
    origin: 'Dar Es Salaam, Tanzania',
    destination: 'Nakonde / Lusaka, Zambia',
    description: 'The most popular route for Japanese and UK imports. Vehicles are either driven or carried via truck down the TUNDUMA border.',
    transportMode: 'Carrier',
    estimatedCostMin: 1100, // Based on Be Forward small vehicles
    estimatedCostMax: 1850, // Based on larger vans/SUVs
    transitDaysMin: 5,
    transitDaysMax: 7,
    unregisteredAllowed: true, // Typically allowed with temporary plates/clearing
    borderFees: [
      { name: 'Standard Border Fees / Council Levies', estimatedCostUSD: 10 },
      { name: 'Third-Party Transit Insurance', estimatedCostUSD: 40 },
    ]
  },
  {
    id: 'durban_chirundu',
    label: 'Durban → Zimbabwe → Chirundu (Carrier)',
    origin: 'Durban, South Africa',
    destination: 'Chirundu / Lusaka, Zambia',
    description: 'Direct inland freight from Durban port through Zimbabwe. Unregistered port imports must use a carrier while in SA.',
    transportMode: 'Carrier',
    estimatedCostMin: 1700, // Line haul + clearing docs + port handling
    estimatedCostMax: 3000,
    transitDaysMin: 10,
    transitDaysMax: 14,
    unregisteredAllowed: false, // Must be carried, cannot be self-driven unregistered
    borderFees: [
      { name: 'Chirundu Road Tax/Toll', estimatedCostUSD: 20 },
      { name: 'Third-Party Transit Insurance', estimatedCostUSD: 40 },
    ]
  },
  {
    id: 'durban_gaborone_kazungula',
    label: 'Durban → Gaborone → Kazungula (Carrier)',
    origin: 'Durban, South Africa',
    destination: 'Kazungula, Zambia',
    description: 'Carrier transport from Durban into Botswana, then moving up to the Kazungula bridge border.',
    transportMode: 'Carrier',
    estimatedCostMin: 900,
    estimatedCostMax: 1200,
    transitDaysMin: 5,
    transitDaysMax: 10,
    unregisteredAllowed: false,
    borderFees: [
      { name: 'Kazungula Bridge Toll (Light Vehicle)', estimatedCostUSD: 20 },
      { name: 'Third-Party Transit Insurance', estimatedCostUSD: 40 },
    ]
  },
  {
    id: 'sa_local_drive',
    label: 'South Africa (Registered) → Kazungula/Chirundu (Self-Drive)',
    origin: 'South Africa',
    destination: 'Zambia',
    description: 'For vehicles already registered locally in South Africa. Self-driving is permitted and popular.',
    transportMode: 'Drive',
    estimatedCostMin: 250, // Mostly fuel and food
    estimatedCostMax: 500,
    transitDaysMin: 2,
    transitDaysMax: 4,
    unregisteredAllowed: false,
    borderFees: [
      { name: 'Bridge Toll / Road Tax', estimatedCostUSD: 20 },
      { name: 'Third-Party Transit Insurance', estimatedCostUSD: 40 },
    ]
  },
  {
    id: 'durban_roro_dar',
    label: 'Durban → Dar Es Salaam (RoRo) → Nakonde',
    origin: 'Durban, South Africa',
    destination: 'Nakonde, Zambia',
    description: 'Hitching a ride on a coastal Ro-Ro consolidation vessel from Durban to Dar es Salaam, then driving down to Nakonde.',
    transportMode: 'RoRo + Drive',
    estimatedCostMin: 1800, // Ocean freight + Dar-Nakonde transport
    estimatedCostMax: 2800,
    transitDaysMin: 15,
    transitDaysMax: 25,
    unregisteredAllowed: true, // Since it goes via sea, avoids SA road rules
    borderFees: [
      { name: 'Standard Border Fees', estimatedCostUSD: 10 },
      { name: 'Third-Party Transit Insurance', estimatedCostUSD: 40 },
    ]
  }
];

export const CARBON_TAX_ZMW = [
  { maxCC: 1500, feeZMW: 123.20 },
  { maxCC: 2000, feeZMW: 246.40 },
  { maxCC: 3000, feeZMW: 352.00 },
  { maxCC: 99999, feeZMW: 484.00 } // > 3000cc
];
