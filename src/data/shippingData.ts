/**
 * shippingData.ts
 * Static reference data for the Shipping Schedule feature.
 * Live vessel schedules come from Vercel KV via the /api/schedules endpoint —
 * this file holds route corridors, port info, shipping line references,
 * and the freight-forwarder directory.
 */

// ── TypeScript Interfaces ──────────────────────────────────────────────────────

/** A single vessel sailing stored in Vercel KV. */
export interface VesselSchedule {
  id: string;
  carrier: string;
  vessel_name: string;
  origin_port: string;
  destination_port: string;
  inspection_cutoff: string;   // ISO date
  port_cutoff: string;         // ISO date
  etd: string;                 // ISO date — Estimated Time of Departure
  eta: string;                 // ISO date — Estimated Time of Arrival
  status: 'Scheduled' | 'Booking Open' | 'Booking Closed' | 'Departed' | 'Arrived' | 'Completed' | 'En Route' | 'Delayed';
  transit_days: number;
  created_at: string;
  updated_at: string;
}

export type VesselStatus = VesselSchedule['status'];

export const VESSEL_STATUSES: VesselStatus[] = [
  'Scheduled',
  'Booking Open',
  'Booking Closed',
  'Departed',
  'Arrived',
  'Completed',
];

/** A leg in the journey timeline shown on route-overview cards. */
export interface RouteLeg {
  label: string;
  daysMin: number;
  daysMax: number;
}

/** A shipping corridor from origin region to the Zambian border. */
export interface ShippingRoute {
  id: string;
  name: string;
  emoji: string;
  originRegion: string;
  originPorts: string[];
  destinationPort: string;
  destinationCountry: string;
  zambiaBorder: string;
  seaDaysMin: number;
  seaDaysMax: number;
  inlandDaysMin: number;
  inlandDaysMax: number;
  totalWeeksMin: number;
  totalWeeksMax: number;
  legs: RouteLeg[];
  notes: string;
}

/** Information about a destination port. */
export interface PortInfo {
  name: string;
  country: string;
  flag: string;
  connectedBorder: string;
  avgDwellDays: string;
  inlandDistance: string;
  transportMode: string;
  pros: string[];
  cons: string[];
}

/** A shipping line / RoRo carrier. */
export interface ShippingLine {
  name: string;
  website: string;
  notes: string;
}

/** A freight forwarder / shipping agent entry. */
export interface FreightForwarder {
  company: string;
  location: string;
  speciality: string;
  phone: string;
  website: string;
  notes: string;
}

// ── Static Data ────────────────────────────────────────────────────────────────

export const ORIGIN_PORTS: string[] = [
  'Yokohama',
  'Nagoya',
  'Kobe',
  'Southampton',
  'Tilbury',
  'Singapore',
  'Johannesburg',
  'Durban',
];

export const DESTINATION_PORTS: string[] = [
  'Dar es Salaam',
  'Durban',
  'Walvis Bay',
  'Beira',
];

export const CARRIERS: string[] = [
  'Höegh Autoliners',
  'MOL ACE',
  'NYK RORO',
  'K-Line',
  'EUKOR',
  'Wallenius Wilhelmsen',
  'Grimaldi Lines',
  'Seven Seas',
];

// ── Route Corridors ────────────────────────────────────────────────────────────

export const SHIPPING_ROUTES: ShippingRoute[] = [
  {
    id: 'jp-dar',
    name: 'Japan → Dar es Salaam',
    emoji: '🇯🇵 → 🇹🇿',
    originRegion: 'Japan',
    originPorts: ['Yokohama', 'Nagoya', 'Kobe'],
    destinationPort: 'Dar es Salaam',
    destinationCountry: 'Tanzania',
    zambiaBorder: 'Nakonde (Tunduma–Nakonde)',
    seaDaysMin: 24,
    seaDaysMax: 35,
    inlandDaysMin: 3,
    inlandDaysMax: 7,
    totalWeeksMin: 6,
    totalWeeksMax: 9,
    legs: [
      { label: 'JEVIC Inspection + Export', daysMin: 7, daysMax: 14 },
      { label: 'Sea Transit', daysMin: 24, daysMax: 35 },
      { label: 'Port Clearance (Dar)', daysMin: 5, daysMax: 7 },
      { label: 'Inland to Nakonde', daysMin: 3, daysMax: 7 },
      { label: 'Border Processing', daysMin: 1, daysMax: 3 },
    ],
    notes:
      'The most popular route for Zambian importers. Dar es Salaam is the primary gateway for Japanese vehicles. Transit bonds required through Tanzania ($60–$200). ECTS tracking seal mandatory on carrier trucks.',
  },
  {
    id: 'jp-dur',
    name: 'Japan → Durban',
    emoji: '🇯🇵 → 🇿🇦',
    originRegion: 'Japan',
    originPorts: ['Yokohama', 'Nagoya', 'Kobe'],
    destinationPort: 'Durban',
    destinationCountry: 'South Africa',
    zambiaBorder: 'Chirundu or Kazungula',
    seaDaysMin: 30,
    seaDaysMax: 42,
    inlandDaysMin: 3,
    inlandDaysMax: 5,
    totalWeeksMin: 7,
    totalWeeksMax: 10,
    legs: [
      { label: 'JEVIC Inspection + Export', daysMin: 7, daysMax: 14 },
      { label: 'Sea Transit', daysMin: 30, daysMax: 42 },
      { label: 'Port Clearance (Durban)', daysMin: 3, daysMax: 5 },
      { label: 'Inland via Zimbabwe', daysMin: 3, daysMax: 5 },
      { label: 'Chirundu Border', daysMin: 1, daysMax: 2 },
    ],
    notes:
      'Longer ocean transit but more structured logistics chain. Vehicles transit through Zimbabwe or Botswana — additional cross-border documentation required for each country.',
  },
  {
    id: 'uk-dar',
    name: 'UK → Dar es Salaam',
    emoji: '🇬🇧 → 🇹🇿',
    originRegion: 'UK',
    originPorts: ['Southampton', 'Tilbury'],
    destinationPort: 'Dar es Salaam',
    destinationCountry: 'Tanzania',
    zambiaBorder: 'Nakonde (Tunduma–Nakonde)',
    seaDaysMin: 21,
    seaDaysMax: 35,
    inlandDaysMin: 3,
    inlandDaysMax: 7,
    totalWeeksMin: 5,
    totalWeeksMax: 8,
    legs: [
      { label: 'UK Inspection (ATJ/EAA) + Export', daysMin: 7, daysMax: 14 },
      { label: 'Sea Transit (via Suez)', daysMin: 21, daysMax: 35 },
      { label: 'Port Clearance (Dar)', daysMin: 5, daysMax: 7 },
      { label: 'Inland to Nakonde', daysMin: 3, daysMax: 7 },
      { label: 'Border Processing', daysMin: 1, daysMax: 3 },
    ],
    notes:
      'Direct sailings are faster (21–28 days). Transhipped voyages (via Mediterranean hub) take longer (33–43 days). Confirm routing with your forwarder.',
  },
  {
    id: 'uk-dur',
    name: 'UK → Durban',
    emoji: '🇬🇧 → 🇿🇦',
    originRegion: 'UK',
    originPorts: ['Southampton', 'Tilbury'],
    destinationPort: 'Durban',
    destinationCountry: 'South Africa',
    zambiaBorder: 'Chirundu or Kazungula',
    seaDaysMin: 18,
    seaDaysMax: 28,
    inlandDaysMin: 3,
    inlandDaysMax: 4,
    totalWeeksMin: 5,
    totalWeeksMax: 7,
    legs: [
      { label: 'UK Inspection (ATJ/EAA) + Export', daysMin: 7, daysMax: 14 },
      { label: 'Sea Transit', daysMin: 18, daysMax: 28 },
      { label: 'Port Clearance (Durban)', daysMin: 3, daysMax: 5 },
      { label: 'Inland via Zimbabwe', daysMin: 3, daysMax: 4 },
      { label: 'Chirundu Border', daysMin: 1, daysMax: 2 },
    ],
    notes:
      'Preferred for premium UK vehicles (Range Rover, Land Rover). Shorter voyage via Atlantic routing. Durban port is well-structured with efficient processing.',
  },
  {
    id: 'sg-dar',
    name: 'Singapore → Dar es Salaam',
    emoji: '🇸🇬 → 🇹🇿',
    originRegion: 'Singapore',
    originPorts: ['Singapore'],
    destinationPort: 'Dar es Salaam',
    destinationCountry: 'Tanzania',
    zambiaBorder: 'Nakonde (Tunduma–Nakonde)',
    seaDaysMin: 20,
    seaDaysMax: 35,
    inlandDaysMin: 3,
    inlandDaysMax: 7,
    totalWeeksMin: 5,
    totalWeeksMax: 8,
    legs: [
      { label: 'STA Inspection + Deregistration', daysMin: 5, daysMax: 10 },
      { label: 'Sea Transit', daysMin: 20, daysMax: 35 },
      { label: 'Port Clearance (Dar)', daysMin: 5, daysMax: 7 },
      { label: 'Inland to Nakonde', daysMin: 3, daysMax: 7 },
      { label: 'Border Processing', daysMin: 1, daysMax: 3 },
    ],
    notes:
      'Singapore serves as a transshipment hub. Vehicles from Singapore\'s COE system are often high-spec luxury models in excellent condition due to strict LTA inspections.',
  },
  {
    id: 'sa-road',
    name: 'South Africa → Zambia (Overland)',
    emoji: '🇿🇦 → 🇿🇲',
    originRegion: 'South Africa',
    originPorts: ['Johannesburg', 'Durban'],
    destinationPort: 'Overland (no sea freight)',
    destinationCountry: 'Zambia',
    zambiaBorder: 'Chirundu (most common) or Kazungula',
    seaDaysMin: 0,
    seaDaysMax: 0,
    inlandDaysMin: 2,
    inlandDaysMax: 4,
    totalWeeksMin: 1,
    totalWeeksMax: 2,
    legs: [
      { label: 'Purchase + Documentation', daysMin: 2, daysMax: 5 },
      { label: 'Truck Carrier / Self-Drive', daysMin: 2, daysMax: 4 },
      { label: 'Border Clearance', daysMin: 1, daysMax: 2 },
    ],
    notes:
      'Many Zambian importers buy directly from SA dealers and arrange truck transport or self-drive via Chirundu (busiest, most common) or Kazungula (less traffic). Some opt for the "extra route" — shipping from Durban to Dar es Salaam via RoRo, then trucking down.',
  },
];

// ── Port Information ───────────────────────────────────────────────────────────

export const PORT_INFO: PortInfo[] = [
  {
    name: 'Dar es Salaam',
    country: 'Tanzania',
    flag: '🇹🇿',
    connectedBorder: 'Nakonde (Tunduma–Nakonde OSBP)',
    avgDwellDays: '5–7 days',
    inlandDistance: '~1,200–2,000 km to Lusaka',
    transportMode: 'Truck carrier (dominant), TAZARA rail (unreliable)',
    pros: [
      'Primary gateway for Zambian vehicle imports',
      'Highest volume = most competitive clearing agent rates',
      'Direct TAZAM Highway corridor to Zambia',
      'Infrastructure investments improving throughput',
    ],
    cons: [
      'Prone to port congestion during peak periods',
      'Transit bonds required through Tanzania ($60–$200)',
      'Longer inland distance than Beira',
      'Border delays possible at Tunduma/Nakonde',
    ],
  },
  {
    name: 'Durban',
    country: 'South Africa',
    flag: '🇿🇦',
    connectedBorder: 'Chirundu (Zimbabwe border) or Kazungula (Botswana border)',
    avgDwellDays: '3–5 days',
    inlandDistance: '~2,500+ km to Lusaka (via Zimbabwe)',
    transportMode: 'Truck carrier via N1/A4 corridor',
    pros: [
      'Well-structured, efficient port operations',
      'Preferred for SA-sourced vehicles',
      'SADC Certificate of Origin may reduce customs duty',
      'Multiple inland route options (via Zimbabwe or Botswana)',
    ],
    cons: [
      'Longest inland distance to Zambia',
      'Cross-border documentation required for Zimbabwe/Botswana transit',
      'Higher total transport costs due to distance',
    ],
  },
  {
    name: 'Walvis Bay',
    country: 'Namibia',
    flag: '🇳🇦',
    connectedBorder: 'Katima Mulilo / Sesheke',
    avgDwellDays: '3–4 days',
    inlandDistance: '~2,000+ km to Lusaka',
    transportMode: 'Trans-Caprivi Highway corridor',
    pros: [
      'High reliability, modern infrastructure',
      'Low congestion — fast port turnaround',
      'Growing in popularity as alternative to Dar',
      'Competitive for European-origin vehicles',
    ],
    cons: [
      'Fewer carrier schedules than Dar es Salaam',
      'Long overland corridor through Namibia',
      'Less established clearing agent network for Zambian importers',
    ],
  },
  {
    name: 'Beira',
    country: 'Mozambique',
    flag: '🇲🇿',
    connectedBorder: 'Chanida (or via Malawi)',
    avgDwellDays: '5–8 days',
    inlandDistance: '~1,000–1,400 km to Lusaka',
    transportMode: 'Beira Corridor road',
    pros: [
      'Shortest inland distance to central/eastern Zambia',
      'Competitive transport costs due to proximity',
    ],
    cons: [
      'Susceptible to cyclone disruptions',
      'Historical congestion issues',
      'Smaller port with fewer RoRo berths',
      'Infrastructure less developed than Dar or Durban',
    ],
  },
];

// ── Shipping Lines ─────────────────────────────────────────────────────────────

export const SHIPPING_LINES: ShippingLine[] = [
  {
    name: 'Höegh Autoliners',
    website: 'https://www.hoeghautoliners.com',
    notes: 'Major RoRo operator with extensive Africa coverage. Online sailing schedule portal available.',
  },
  {
    name: 'MOL ACE',
    website: 'https://www.mol-ace.com',
    notes: 'Japan-based carrier (Mitsui O.S.K. Lines). Frequent sailings Japan → East Africa.',
  },
  {
    name: 'NYK RORO',
    website: 'https://www.nykroro.com',
    notes: 'Japan-based. Schedule enquiry tool available filtered by port pair.',
  },
  {
    name: 'K-Line',
    website: 'https://www.klineglobalroro.com',
    notes: 'Japan-based, serves Africa routes. Part of K-Line group.',
  },
  {
    name: 'EUKOR',
    website: 'https://www.eukor.com',
    notes: 'Part of Hyundai group. Handles RoRo globally including Africa.',
  },
  {
    name: 'Wallenius Wilhelmsen',
    website: 'https://www.walleniuswilhelmsen.com',
    notes: 'Major global RoRo operator with Africa service.',
  },
  {
    name: 'Grimaldi Lines',
    website: 'https://www.grimaldi.napoli.it',
    notes: 'Strong on UK/Europe → West & East Africa routes.',
  },
];

// ── Freight Forwarder Directory ────────────────────────────────────────────────

export const FREIGHT_FORWARDERS: FreightForwarder[] = [
  // Japan-based exporters
  {
    company: 'BE FORWARD',
    location: 'Tokyo, Japan',
    speciality: 'Japan → East/Southern Africa vehicle exports',
    phone: '+81-3-6262-5817',
    website: 'https://www.beforward.jp',
    notes: 'Largest used car exporter from Japan. Handles full shipping, publishes monthly RoRo schedules.',
  },
  {
    company: 'SBT Japan',
    location: 'Yokohama, Japan',
    speciality: 'Japan → Africa vehicle exports + auction sourcing',
    phone: '+81-45-290-9485',
    website: 'https://www.sbtjapan.com',
    notes: 'Established exporter with consolidated shipping schedules. CIF pricing includes freight.',
  },
  {
    company: 'Autocom Japan',
    location: 'Kobe, Japan',
    speciality: 'Japan auction sourcing + worldwide shipping',
    phone: '+81-78-265-6185',
    website: 'https://www.autocom-japan.com',
    notes: 'Specializes in auction-to-door service. Regular Dar es Salaam and Durban schedules.',
  },
  {
    company: 'KMC Japan',
    location: 'Tokyo, Japan',
    speciality: 'Japan → Africa vehicle exports',
    phone: '+81-3-5544-8388',
    website: 'https://www.kmcjapan.com',
    notes: 'Mid-size exporter with competitive rates. Publishes monthly sailing schedules.',
  },
  // UK-based
  {
    company: 'Bence Motor Group',
    location: 'Bristol, UK',
    speciality: 'UK → Africa vehicle shipping',
    phone: '+44-1onal contact',
    website: 'https://www.bencemotors.co.uk',
    notes: 'Handles RoRo bookings and ATJ inspection coordination for UK exports.',
  },
  // SA-based carriers & forwarders
  {
    company: 'Cross-Border Vehicle Carriers (CBVC)',
    location: 'Johannesburg, South Africa',
    speciality: 'SA → Zambia overland vehicle transport',
    phone: '+27-11-xxx-xxxx',
    website: '',
    notes: 'Specializes in truck carrier transport Johannesburg → Chirundu. Door-to-border service.',
  },
  {
    company: 'MDS Logistics',
    location: 'Durban, South Africa',
    speciality: 'Port clearing + inland transport',
    phone: '+27-31-xxx-xxxx',
    website: '',
    notes: 'Handles Durban port clearing and arranges truck transport to Zambia via Zimbabwe.',
  },
  // Dar es Salaam-based clearing agents
  {
    company: 'Freight In Time (FIT)',
    location: 'Dar es Salaam, Tanzania',
    speciality: 'Dar es Salaam port clearing for Zambian imports',
    phone: '+255-22-xxx-xxxx',
    website: '',
    notes: 'Established Dar clearing agent. Handles transit bonds and ECTS tracking for Zambia-bound vehicles.',
  },
  {
    company: 'Bollore Transport & Logistics',
    location: 'Dar es Salaam, Tanzania',
    speciality: 'Full logistics chain Dar → Zambia',
    phone: '+255-22-xxx-xxxx',
    website: 'https://www.bollore-transport-logistics.com',
    notes: 'Major international logistics firm with Tanzania operations. End-to-end service.',
  },
];

// ── Own Shipping Guide ─────────────────────────────────────────────────────────

export interface GuideSection {
  title: string;
  icon: string; // lucide icon name
  content: string[];
}

export const OWN_SHIPPING_GUIDE: GuideSection[] = [
  {
    title: 'RoRo vs Container Shipping',
    icon: 'Ship',
    content: [
      'RoRo (Roll-on Roll-off) is the standard for vehicle shipping — the car drives onto the vessel. It\'s cheaper, faster, and lower risk than container shipping for single vehicles.',
      'Container shipping costs 2–3x more but protects the vehicle from salt spray and weather. Consider it only for high-value or classic cars, or when shipping spare parts alongside the vehicle.',
      'Most carriers to East/Southern Africa operate RoRo services. Container availability to Dar es Salaam is limited.',
    ],
  },
  {
    title: 'Essential Documents',
    icon: 'FileText',
    content: [
      'Bill of Lading (B/L) — The master shipping document. Original copies required for port collection. Guard these with your life.',
      'Export Certificate — Proves the vehicle was legally deregistered from the origin country (e.g., Japanese Export Certificate, UK V5C).',
      'Commercial Invoice — Must show the exact purchase price. ZRA will cross-reference this for CIF duty calculations.',
      'JEVIC / ATJ / EAA Certificate — Pre-shipment roadworthiness inspection. Required for Japan, UK, UAE, Singapore, and South Africa sourced vehicles.',
      'Packing List — Itemizes any spare parts or accessories shipped with the vehicle.',
    ],
  },
  {
    title: 'Choosing a Freight Forwarder',
    icon: 'Search',
    content: [
      'Ask for a door-to-port or CIF quote — this should include inland transport to the departure port, loading fees, and ocean freight.',
      'Confirm whether insurance is included or extra. Marine cargo insurance typically costs 1–2% of the vehicle value.',
      'Check their track record with Zambian importers — ask for references or check forums like ZedMotors.',
      'Verify they handle the pre-shipment inspection booking (JEVIC/ATJ). A good forwarder coordinates this automatically.',
      'Get the shipping schedule in writing — departure date, vessel name, and ETA. Hold them accountable.',
    ],
  },
  {
    title: 'Insurance & Risk',
    icon: 'ShieldCheck',
    content: [
      'Marine cargo insurance is strongly recommended. It covers total loss, partial damage, and saltwater damage during transit.',
      'Institute Cargo Clauses (A) provides the broadest coverage — "all risks" including theft from the vessel deck.',
      'Clauses (B) and (C) are cheaper but exclude common risks like washing overboard. Not recommended for vehicle shipping.',
      'Your freight forwarder can arrange this, or you can buy directly from a Zambian insurance broker (e.g., ZSIC, Professional Insurance).',
    ],
  },
  {
    title: 'Common Pitfalls',
    icon: 'AlertTriangle',
    content: [
      'Never pay full freight upfront to an unknown forwarder. Use escrow or pay in stages (deposit → balance on B/L issuance).',
      'Verify the vessel name and voyage number independently on the shipping line\'s website before releasing payment.',
      'Don\'t ship personal belongings inside the vehicle — customs may classify the entire shipment as household goods, triggering a completely different (and expensive) duty regime.',
      'Ensure engine and chassis numbers on ALL documents match exactly. Any discrepancy will cause detention at port and massive delays.',
      'Factor in port storage fees — they accumulate daily (often $15–$30/day). Clear your vehicle promptly after arrival.',
    ],
  },
];
