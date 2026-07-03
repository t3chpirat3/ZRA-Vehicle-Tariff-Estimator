/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * jdmDirectory.ts
 * A lightweight, browse-only directory of nameplates available on the Japanese
 * used-export market (2000–2026) — the cars a Zambian buyer can realistically
 * source through SBT Japan, BE FORWARD and Autocom. Like saMarketDirectory.ts,
 * these entries carry no scoring, pricing or engine data; they exist purely so a
 * buyer can browse the market and jump straight to BE FORWARD listings.
 *
 * Compiled from the "Vehicle Models 2000–2026 Catalog" (model-family and
 * chassis tables), grouped here by origin for easy browsing.
 */

export interface JdmMake {
  make: string;
  models: string[];
}

export interface JdmCategory {
  category: string;
  blurb: string;
  makes: JdmMake[];
}

/**
 * Build a BE FORWARD keyword-search URL for a make + model. BE FORWARD's keyword
 * search always resolves to a results page (never a dead link), which makes it
 * the safest single destination for the many obscure JDM nameplates here. We
 * strip any parenthetical or slash so the search term stays clean.
 */
export function beforwardUrl(make: string, model: string): string {
  const cleaned = model.split('(')[0].split('/')[0].trim();
  const keyword = encodeURIComponent(`${make} ${cleaned}`);
  return `https://www.beforward.jp/stocklist/keyword=${keyword}/`;
}

export const JDM_DIRECTORY: JdmCategory[] = [
  {
    category: 'Japanese Mainstream',
    blurb: 'The high-volume Japanese brands that fill SBT and BE FORWARD — sedans, hatches, MPVs and crossovers.',
    makes: [
      {
        make: 'Toyota',
        models: [
          'Crown', 'Mark X', 'Mark II', 'Chaser', 'Cresta', 'Altezza', 'Aristo', 'Celsior', 'Century',
          'Corolla', 'Allion', 'Premio', 'Yaris', 'Vitz', 'Aqua', 'Prius', 'bB', 'ist', 'Ractis', 'Belta', 'Auris',
          'Alphard', 'Vellfire', 'Noah', 'Voxy', 'Esquire', 'Sienta', 'Wish', 'Isis', 'Passo', 'Roomy',
          'Land Cruiser', 'Land Cruiser Prado', 'FJ Cruiser', 'Rush', 'Vanguard', 'Harrier',
          'Supra', '86', 'GR86', 'Celica', 'MR2', 'MR-S',
          'HiAce', 'Probox', 'Succeed', 'Townace', 'Liteace', 'Coaster', 'Dyna', 'Toyoace', 'bZ4X',
        ],
      },
      {
        make: 'Nissan',
        models: [
          'Skyline', 'GT-R', 'Silvia', 'Fairlady Z', 'Stagea', 'Cima', 'Fuga', 'Cedric', 'Gloria', 'Teana',
          'March', 'Micra', 'Note', 'Tiida', 'Sylphy', 'Sentra', 'Almera', 'Cube', 'Juke', 'Kicks',
          'Elgrand', 'Serena', 'Bassara', 'Presage', 'Quest', 'Liberty', 'Lafesta',
          'X-Trail', 'Rogue', 'Murano', 'Pathfinder', 'Patrol', 'Armada', 'Terrano', 'Navara', 'NP300', 'Frontier',
          'Leaf', 'Ariya', 'Sakura', 'Magnite', 'Moco',
        ],
      },
      {
        make: 'Honda',
        models: [
          'Civic', 'Integra', 'Accord', 'Inspire', 'Legend', 'Prelude', 'NSX', 'S2000', 'CR-Z', 'Insight',
          'Fit', 'Jazz', 'City', 'Brio', 'Airwave', 'Logo', 'Life', 'That\u2019s',
          'Vezel', 'HR-V', 'CR-V', 'Crossroad', 'Crosstour', 'Element', 'Pilot', 'Passport',
          'Stepwgn', 'Odyssey', 'Stream', 'Freed', 'Mobilio', 'Jade', 'Shuttle', 'Elysion',
          'S660', 'Beat', 'N-Box', 'N-One', 'N-WGN', 'Clarity',
        ],
      },
      {
        make: 'Mazda',
        models: [
          'RX-7', 'RX-8', 'Roadster', 'MX-5', 'Mazda2', 'Demio', 'Mazda3', 'Axela', 'Mazda6', 'Atenza',
          'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-60', 'CX-70', 'CX-8', 'CX-9', 'CX-80', 'CX-90',
          'Premacy', 'Biante', 'MPV', 'Verisa', 'CX-7', 'Tribute', 'Bongo', 'Familia', 'Capella',
          'AZ-Wagon', 'AZ-Offroad', 'Laputa', 'Spiano', 'Flair', 'MX-30', 'BT-50',
        ],
      },
    ],
  },
  {
    category: 'Japanese Performance, Kei & Utility',
    blurb: 'Rally legends, sports coupes, kei cars and the rugged 4x4s and workhorses Japan does best.',
    makes: [
      {
        make: 'Subaru',
        models: [
          'Impreza', 'WRX', 'WRX STI', 'Legacy', 'Levorg', 'Forester', 'Outback', 'XV', 'Crosstrek', 'BRZ',
          'Exiga', 'Trezia', 'Tribeca', 'Baja', 'Justy', 'Solterra',
          'Sambar', 'Stella', 'Pleo', 'R1', 'R2', 'Dex', 'Lucra', 'Chiffon', 'Rex',
        ],
      },
      {
        make: 'Mitsubishi',
        models: [
          'Lancer Evolution', 'Lancer', 'Pajero', 'Pajero Sport', 'Montero', '3000GT', 'GTO', 'Eclipse', 'Eclipse Cross',
          'Outlander', 'Airtrek', 'ASX', 'RVR', 'Delica', 'Delica D:5', 'Grandis', 'Colt', 'Mirage', 'Attrage',
          'Galant', 'Endeavor', 'L200', 'Triton', 'i-MiEV', 'eK Wagon', 'eK Space', 'eK X', 'Town Box', 'Xpander',
        ],
      },
      {
        make: 'Suzuki',
        models: [
          'Swift', 'Jimny', 'Jimny Sierra', 'Alto', 'Alto Lapin', 'Wagon R', 'Hustler', 'Spacia', 'Solio', 'Cervo',
          'Every', 'Carry', 'Cappuccino', 'Kei', 'Splash', 'Baleno', 'Ignis', 'Aerio',
          'Vitara', 'Grand Vitara', 'Escudo', 'Jimny Wide', 'S-Cross', 'Fronx', 'XL7', 'APV', 'Ertiga', 'Kizashi',
        ],
      },
      {
        make: 'Daihatsu',
        models: [
          'Copen', 'Tanto', 'Move', 'Mira', 'Mira Cocoa', 'Mira e:S', 'Cast', 'Taft', 'Hijet', 'Atrai',
          'Rocky', 'Terios', 'Thor', 'Boon', 'Sirion', 'Materia', 'Gran Max', 'Luxio', 'Xenia',
        ],
      },
      {
        make: 'Isuzu',
        models: [
          'D-Max', 'MU-X', 'Trooper', 'VehiCROSS', 'Bighorn', 'Wizard', 'Ascender', 'Axiom', 'Amigo', 'Panther',
          'Elf', 'Forward', 'Giga',
        ],
      },
      {
        make: 'Hino',
        models: ['Dutro', 'Ranger', 'Profia', 'Liesse', 'Melpha', 'Rainbow', 'Selega'],
      },
    ],
  },
  {
    category: 'Japanese Luxury',
    blurb: 'Lexus — Toyota\u2019s premium arm, prized for refinement, reliability and strong resale.',
    makes: [
      {
        make: 'Lexus',
        models: [
          'IS', 'ES', 'GS', 'LS', 'HS', 'CT', 'RC', 'RC F', 'LC', 'SC', 'LFA',
          'UX', 'NX', 'RX', 'GX', 'LX', 'LBX', 'TX', 'RZ', 'LM',
        ],
      },
    ],
  },
  {
    category: 'German Premium Imports',
    blurb: 'The European luxury and volume marques widely stocked as used imports in Japan.',
    makes: [
      {
        make: 'Mercedes-Benz',
        models: [
          'A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS',
          'G-Class', 'SLK', 'SLC', 'SL', 'V-Class', 'AMG GT', 'Maybach', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS',
        ],
      },
      {
        make: 'BMW',
        models: [
          '1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series',
          'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z3', 'Z4', 'i3', 'i4', 'i5', 'i7', 'i8', 'iX',
        ],
      },
      {
        make: 'Audi',
        models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'RS5', 'e-tron'],
      },
      {
        make: 'Volkswagen',
        models: [
          'Golf', 'Polo', 'Passat', 'Jetta', 'Bora', 'CC', 'Arteon', 'Beetle', 'Scirocco', 'Eos', 'Up!', 'Lupo',
          'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Touran', 'Sharan', 'Atlas', 'Taos', 'Amarok', 'ID.4',
        ],
      },
    ],
  },
  {
    category: 'European Imports',
    blurb: 'French style, Swedish safety and British 4x4 luxury — niche but available through the exporters.',
    makes: [
      {
        make: 'Peugeot',
        models: [
          '208', '308', '408', '508', '2008', '3008', '5008', 'RCZ', 'Rifter', 'Partner', 'Traveller', 'Expert',
          'Boxer', 'Landtrek', '108', '301', '4007', '4008', 'Bipper', 'iOn',
        ],
      },
      {
        make: 'Renault',
        models: [
          'Clio', 'Lutecia', 'Megane', 'Twingo', 'Captur', 'Kangoo', 'Scenic', 'Espace', 'Koleos', 'Kadjar',
          'Duster', 'Sandero', 'Logan', 'Laguna', 'Fluence', 'Zoe', 'Trafic', 'Master', 'Kwid', 'Triber', 'Kiger',
        ],
      },
      {
        make: 'Volvo',
        models: ['C30', 'S40', 'V40', 'S60', 'V60', 'S90', 'V90', 'XC40', 'XC60', 'XC90', 'EX30', 'EX90'],
      },
      {
        make: 'Jaguar',
        models: ['XE', 'XF', 'XJ', 'F-Type', 'E-Pace', 'F-Pace', 'I-Pace'],
      },
      {
        make: 'Land Rover',
        models: [
          'Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar',
          'Range Rover Evoque',
        ],
      },
    ],
  },
  {
    category: 'Korean',
    blurb: 'Well stocked on the exporters — SBT carries Korean inventory, while BE FORWARD lists both Korean and South African (Durban) units; the Durban stock can road-freight to Chirundu in about three days.',
    makes: [
      {
        make: 'Hyundai',
        models: [
          'i10', 'i20', 'i30', 'i40', 'Accent', 'Elantra', 'Sonata', 'Grandeur', 'Genesis', 'Equus',
          'Getz', 'Matrix', 'Veloster', 'Tucson', 'Kona', 'Creta', 'Venue', 'Santa Fe', 'Palisade', 'Terracan',
          'Trajet', 'Staria', 'Ioniq 5', 'Nexo',
        ],
      },
      {
        make: 'Kia',
        models: [
          'Picanto', 'Rio', 'Cerato', 'Soul', 'Optima', 'Stinger', 'Stonic', 'Seltos', 'Sonet', 'Sportage',
          'Sorento', 'Mohave', 'Carnival', 'Niro', 'EV6',
        ],
      },
      {
        make: 'Ssangyong',
        models: ['Tivoli', 'Korando', 'Actyon', 'Kyron', 'Musso', 'Rexton', 'Rodius', 'Torres', 'XLV', 'Chairman'],
      },
    ],
  },
  {
    category: 'American',
    blurb: 'Niche on Japanese lots, but the off-roaders and muscle cars have a loyal following — Jeep especially.',
    makes: [
      {
        make: 'Jeep',
        models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Avenger', 'Grand Wagoneer'],
      },
      {
        make: 'Ford',
        models: ['Mustang', 'Explorer', 'Ranger', 'Everest', 'Focus', 'Fiesta', 'Kuga', 'EcoSport', 'Escape'],
      },
      {
        make: 'Chevrolet',
        models: [
          'Corvette', 'Camaro', 'Astro', 'Captiva', 'Cruze', 'Malibu', 'Equinox', 'Traverse', 'Tahoe', 'Suburban',
          'Silverado', 'Trailblazer', 'Trax', 'Spark', 'Sonic', 'Impala',
        ],
      },
    ],
  },
];
