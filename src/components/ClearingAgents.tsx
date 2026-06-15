/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  Building,
  Shield,
  Award,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface Agent {
  tpin: string;
  company: string;
  licenseType: string;
  phone: string;
  email: string;
  address: string;
  location: string;
}

const AGENTS_DATA: Agent[] = [
  {
    tpin: '2345147648',
    company: 'BRAKA CARGO SERVICES LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0976274824',
    email: 'brakacargo@gmail.com',
    address: '978/06 MUKUNI VILLAGE OFF GREAT NORTH ROAD NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '2546516314',
    company: 'GLORYLIGHT INVESTMENTS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0966333387',
    email: 'glorylightinvestments@gmail.com',
    address: '77/14/1 CITYSHINE LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1001877904',
    company: 'ZAMBIA CHINA ECONOMIC ZONE LOGISTICS',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0962100759',
    email: 'zcczlogistic@gmail.com',
    address: 'P.O. BOX 37158 CHAMBISHI',
    location: 'Chambishi',
  },
  {
    tpin: '1002091794',
    company: 'LADY S FREIGHT LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0964878849',
    email: 'ladysfreightlimited@gmail.com',
    address: 'PLOT 35884 PHI LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2970128001',
    company: 'ZUMART LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0933748535',
    email: 'zumartin09@gmail.com',
    address: 'P.O BOX 60312 LIVINGSTONE',
    location: 'Livingstone',
  },
  {
    tpin: '2877598745',
    company: 'DOUBLE PORTION INVESTMENTS LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0977727546',
    email: 'kennedymudenda349@gmail.com',
    address: 'P.O. BOX 430109 NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '2410794327',
    company: 'GREATER GLORY AND WORKS LOGISTIX',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977727546',
    email: 'kennedymudenda349@gmail.com',
    address: 'SHOP 2 LEKANGA COMPLEX NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '2174269141',
    company: 'FERHODA CLEARING AND FORWARDING',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0978844763',
    email: 'felixbulambo@yahoo.com',
    address: 'ROOM 5 SINYANGWE BUILDING NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '2407113863',
    company: 'UPRIGHT LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977698481',
    email: 'nchimunya.hamwanya@gmail.com',
    address: 'PLOT 11774/A FIRST CHIKOLA RD ITAWA NDOLA',
    location: 'Ndola',
  },
  {
    tpin: '1006087963',
    company: 'CLEMAHNITY FREIGHT AND LOGISTICS',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977601549',
    email: 'clamahfreight2021@gmail.com',
    address: 'PLOT 18983M OFF KAFUE ROAD LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1001750361',
    company: 'DSV AIR AND SEA LIMITED',
    licenseType: 'FULL LICENCE',
    phone: '097740839',
    email: 'kris.vanheerden@zmdsv.com',
    address: 'P.O BOX 35063 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1001980969',
    company: 'LAKE EXPRESS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977510016',
    email: 'ziwakezious@gmail.com',
    address: 'P.O. BOX 32494 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2152049037',
    company: 'PROCET FREIGHT CARGO LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0977776037',
    email: 'mubangaduckson@yahoo.com',
    address: 'P.O. BOX 36160 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1003317767',
    company: 'GRATO CLEARING AND FORWARDING',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0975821351',
    email: 'komani.kaonga@gmail.com',
    address: 'P34/C5 KAFUE',
    location: 'Kafue',
  },
  {
    tpin: '2760872633',
    company: 'GREAT EQUATOR CARGO SERVICES LTD',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0978397797',
    email: 'dlukundo8@gmail.com',
    address: 'CRU 27753 CHIRUNDU BORDER CHIRUNDU',
    location: 'Chirundu',
  },
  {
    tpin: '2555138352',
    company: 'VINCE CLEARING AND GENERAL DEALERS',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0979947127',
    email: 'vinceclearingltd@gmail.com',
    address: '4CHR04 LUSAKA ROAD GARBON CHIRUNDU',
    location: 'Chirundu',
  },
  {
    tpin: '1004230061',
    company: 'ALERT FORWARDING ZAMBIA LIMITED',
    licenseType: 'FULL LICENCE',
    phone: '0979331072',
    email: 'simfukwehenry@gmail.com',
    address: '42052 GREAT NORTH ROAD MUKOMA VILLAGE NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '1003905052',
    company: 'ACROSS AFRICA FREIGHT LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0971121458',
    email: 'africa.freight17@gmail.com',
    address: 'ROOM 401 OLD WING LATEST TOWNSHIP LIVINGSTONE',
    location: 'Livingstone',
  },
  {
    tpin: '2818177061',
    company: 'MARVENA LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0978899988',
    email: 'marvenalogistics@gmail.com',
    address: 'SHOP NO. 6 KABWATA COMPLEX NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '1002081245',
    company: 'KAPCHI CAPITAL MINING IMPORTS',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977766124',
    email: 'kapchicapitalclearing@yahoo.com',
    address: 'DNC 230 DAMBWA NORTH LIVINGSTONE',
    location: 'Livingstone',
  },
  {
    tpin: '1001862056',
    company: 'SILVER SHIPPING SERVICES',
    licenseType: 'FULL LICENCE',
    phone: '0977782568',
    email: 'silvershippingservicesltd@yahoo.com',
    address: 'P.O. BOX 31648 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1001668194',
    company: 'C. STEINWEG BRIDGE ZAMBIA LTD',
    licenseType: 'FULL LICENCE',
    phone: '0969901212',
    email: 'sando.sinkala@za.steinweg',
    address: 'P.O. BOX 230117 NDOLA',
    location: 'Ndola',
  },
  {
    tpin: '1004402617',
    company: 'PERAFA LOGISTICS LIMITED',
    licenseType: 'FULL LICENCE',
    phone: '0975155755',
    email: 'dumingoltd@gmail.com',
    address: 'P.O. BOX CA132 CASTLE LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1017153975',
    company: 'SPOT ON CARGO LIMITED',
    licenseType: 'FULL LICENCE',
    phone: '0961124452',
    email: 'rpateras@polytra.be',
    address: 'BOX 79035 KITWE',
    location: 'Kitwe',
  },
  {
    tpin: '1017167106',
    company: 'STARTRUCK CLEARING AND FORWARDING',
    licenseType: 'FULL LICENCE',
    phone: '0978291184',
    email: 'startruck2018@gmail.com',
    address: '20 SAFWE ROAD CHILENJE SOUTH LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1012903055',
    company: 'JIMMY X ONE INVESTMENTS LIMITED',
    licenseType: 'FULL LICENCE',
    phone: '0977527834',
    email: 'jimmymalimakau@gmail.com',
    address: '10TH FLOOR SUITE 1002 INDECO HOUSE LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1002016003',
    company: 'ZAMPAK LOGISTICS LIMITED',
    licenseType: 'FULL LICENCE',
    phone: '0979534134',
    email: 'zampaklog20@gmail.com',
    address: 'PLOT NO. 1831 MULOZI COMPLEX NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '1017245683',
    company: 'VUUKA CLEARING AND FORWARDING',
    licenseType: 'FULL LICENCE',
    phone: '09786116767',
    email: 'am9032446@gmail.com',
    address: 'P.O. BOX 70464 NDOLA',
    location: 'Ndola',
  },
  {
    tpin: '1001914992',
    company: 'MARTICAS INVESTMENTS LIMITED',
    licenseType: 'FULL LICENCE',
    phone: '0960994834',
    email: 'victorkatu@gmail.com',
    address: 'P.O. BOX 38158 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1017019535',
    company: 'TRIPLE M LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0966690269',
    email: 'triplemlogisticsltd@gmail.com',
    address: 'SUITE 4 ANNEX BUILDING KITWE',
    location: 'Kitwe',
  },
  {
    tpin: '2352513148',
    company: 'ENSIGN CLEARING & FORWARDING LTD',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0978797043',
    email: 'enignclearing@gmail.com',
    address: '199B KAZUNGULA OFF ROAD KAZUNGULA',
    location: 'Kazungula',
  },
  {
    tpin: '1019801205',
    company: 'MIRCAPE INVESTMENTS LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0964439203',
    email: 'mircapeinvestment@gmail.com',
    address: 'PLOT X310 MPOSAMABWE ROAD CHILILABOMBWE',
    location: 'Chililabombwe',
  },
  {
    tpin: '1003402899',
    company: 'AZZURI INVESTMENTS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977938041',
    email: 'chingaipe_terry@gmail.com',
    address: 'P/BAG 234X LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1001857075',
    company: 'EVIO CUSTOMS CLEARING LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977621850',
    email: 'ethelhingahinga@yahoo.com',
    address: 'BOX 149 KARIBA BORDER SIAVONGA',
    location: 'Siavonga',
  },
  {
    tpin: '2470971888',
    company: 'SCAPULAR CLEARING AND FORWARDING',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0969610522',
    email: 'scapularclearing@gmail.com',
    address: '318 MC OFF KAUNDA ROAD LIVINGSTONE',
    location: 'Livingstone',
  },
  {
    tpin: '2411191665',
    company: 'TAFMA GENERAL DEALERS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977172877',
    email: 'aarontafuma@gmail.com',
    address: 'P.O. BOX F32A/2/672 CHELSTONE LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1019617264',
    company: 'FLASHKING LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0975966694',
    email: 'lloydsiampondo@gmail.com',
    address: 'P.O. BOX 192 KATIMAMULILO KASAMA',
    location: 'Kasama',
  },
  {
    tpin: '2719254477',
    company: 'PRISHA LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0973302389',
    email: 'hebychilufya105@gmail.com',
    address: '48 TAZARA COMPOUND TAZARA ROAD NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '2189567088',
    company: 'NITRAM LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '211840755',
    email: 'martin@nitramconsultants.co.zm',
    address: 'POSTNET BOX 291 CROSS ROADS KABULONGA LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2000281277',
    company: 'NZOS CLEARING AND FORWARDING LTD',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977784432',
    email: 'mwale.gracefb@gmail.com',
    address: 'P. O. BOX 38399 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2855350130',
    company: 'EASTLINE LOGISTICS & CARGO',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0976507016',
    email: 'info.eastlinelogistics@gmail.com',
    address: 'PLOT NO. 107 STEVENSON ROAD NTINDI VILLAGE NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '2000352557',
    company: 'MBAWEMI LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0968884692',
    email: 'mbawemilogistics2022@gmail.com',
    address: 'PLOT NO430124 NTINDI VILLAGE NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '1019499794',
    company: 'CHOBWAMU CONSTRUCTION & GENERAL DEARLERS',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0967610154',
    email: 'mickzn@gmail.com',
    address: 'SUITE 307 SUNSHARE TOWER ROMA LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1016910964',
    company: 'NELANA LINKS AND GENERAL SUPPLIERS',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0973691058',
    email: 'nelanalinks2018@gmail.com',
    address: 'P.O. BOX 2300 KITWE',
    location: 'Kitwe',
  },
  {
    tpin: '2420073648',
    company: 'DEMISH FREIGHT AND LOGISTICS',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0978481220',
    email: 'yotam@demishfl.com',
    address: 'PLOT NO. 18 NSANSA HOUSING OFF MUNGWI ROAD LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2447729222',
    company: 'EUNIE NET CONNECTIONS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0770140536',
    email: 'eunicenyambe2020@gmail.com',
    address: '3253 DAMBWA NORTH LIVINGSTONE',
    location: 'Livingstone',
  },
  {
    tpin: '2051592680',
    company: 'GOLDENGATE LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977771722',
    email: 'goldengatelogistics@gmail.com',
    address: '751 OFF MUMBWA ROAD GARDEN LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2336148444',
    company: 'KOJ CONTRACTORS AND SUPPLIERS LTD',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0777523554',
    email: 'kojltd40@gmail.com',
    address: '6 THOMSON SAKALA ROAD NYUMBA YANGA LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2149868330',
    company: 'WONDERWAVE LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977217837',
    email: 'wonderwavelogistics@gmail.com',
    address: '4974 KABELENGA ROAD RHODESPARK LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1002592663',
    company: 'FEDEX EXPRESS ZAMBIA LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0969787895',
    email: 'patmore.mukuw@fedex.com',
    address: 'P. O. BOX 33744 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2835215661',
    company: 'SIKAM LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0966181555',
    email: 'sikamlogistics@gmail.com',
    address: 'ROOM 3 BORNWELL ABEL SIKAONGA ESTATES NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '2705561898',
    company: 'LINKSWIFT INVESTMENTS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0975423834',
    email: 'linkswiftinv@gmail.com',
    address: 'P/BAG R247 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1001768301',
    company: 'TAUYA CARGO FORWARDERS',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0966782286',
    email: 'lisamweni@gmail.com',
    address: 'PLOT 100/39 OFF TWIN PALM ROAD LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1003417401',
    company: 'REFLECTIONS SHIPPING SERVICES LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0963438500',
    email: 'reflectionsshipping@gmail.com',
    address: 'P.O. BOX 430247 NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '1018581853',
    company: 'PLANET FREIGHT AND LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0971189897',
    email: 'planetfreightzm@yahoo.com',
    address: 'BOX 430038 NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '2190523102',
    company: 'TRENDING EXPRESS CARGO LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0978495530',
    email: 'trendingexpresscargo@gmail.com',
    address: 'MUKOMA VILLAGE OFF GREAT NORTH ROAD NAKONDE',
    location: 'Nakonde',
  },
  {
    tpin: '1003925416',
    company: 'UP AND FORWARD INVESTMENTS LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0966924110',
    email: 'upandforwardinv@yahoo.com',
    address: 'SUITE 9B KANJALA TRADING COMPLEX NDOLA',
    location: 'Ndola',
  },
  {
    tpin: '2567881401',
    company: 'PYRAMIDS CARGO FREIGHT LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977761996',
    email: 'clementphiri62@gmail.com',
    address: 'HOUSE NUMBER 58894 RAILWAY LINE KAMWALA LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1019979288',
    company: 'BWAMUCHI BUSINESS LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977232450',
    email: 'njelesanichilu@yahoo.com',
    address: 'PLOT NO. 8 HONEY BIRD AVENUE CHILILABOMBWE',
    location: 'Chililabombwe',
  },
  {
    tpin: '2195570639',
    company: 'EVANAMU MASTERS CLEARING & FORWARDING',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977390835',
    email: 'evansmunsanje@yahoo.com',
    address: 'MANDA HILL LIBUYU A338 LIVINGSTONE',
    location: 'Livingstone',
  },
  {
    tpin: '2523683655',
    company: 'TRANSEA GLOBAL CLEARING & FORWARDING',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977420503',
    email: 'hassanmp2000@gmail.com',
    address: '8502 KATINGA ROAD CHINIKA LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '2247073899',
    company: 'GREATLAKES INVESTMENTS LIMITED',
    licenseType: 'FINAL CLEARANCE + RIT ONLY',
    phone: '0964512850',
    email: 'josephkipayeni@gmail.com',
    address: 'PLOT NO. W100 LUBENGELE CHILILABOMBWE',
    location: 'Chililabombwe',
  },
  {
    tpin: '1016863786',
    company: 'FRONT MOVERS LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0965685960',
    email: 'frontmover2018@gmail.com',
    address: 'P.O. BOX 60631 LIVINGSTONE',
    location: 'Livingstone',
  },
  {
    tpin: '1004460831',
    company: 'ALITA LOGISTICS LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977190113',
    email: 'alitalogistics@gmail.com',
    address: 'P.O BOX 495 LIVINGSTONE',
    location: 'Livingstone',
  },
  {
    tpin: '2000231200',
    company: 'KUDORA FARM LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0977776037',
    email: 'kudorafarm@gmail.com',
    address: 'P. O.BOX 36160 LUSAKA',
    location: 'Lusaka',
  },
  {
    tpin: '1019797546',
    company: 'TOPRATE CARGO LIMITED',
    licenseType: 'FINAL CLEARANCE ONLY',
    phone: '0967233595',
    email: 'danielckaiz@gmail.com',
    address: '55961 OFF SESHEKE ROAD/SENANGA ROAD SESHEKE',
    location: 'Sesheke',
  },
];

const LOCATIONS = [
  'All',
  'Lusaka',
  'Nakonde',
  'Chirundu',
  'Livingstone',
  'Ndola',
  'Kitwe',
  'Chambishi',
  'Kafue',
  'Siavonga',
  'Kazungula',
  'Chililabombwe',
  'Sesheke',
];

const LICENSE_TYPES = [
  'All',
  'FINAL CLEARANCE ONLY',
  'FINAL CLEARANCE + RIT ONLY',
  'FULL LICENCE',
];

export default function ClearingAgents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedLicense, setSelectedLicense] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, type: 'tpin' | 'phone' | 'email', id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${type}-${id}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const filteredAgents = AGENTS_DATA.filter((agent) => {
    const matchesSearch =
      agent.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.tpin.includes(searchTerm) ||
      agent.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phone.includes(searchTerm) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      selectedLocation === 'All' ||
      agent.location.toLowerCase() === selectedLocation.toLowerCase();

    const matchesLicense =
      selectedLicense === 'All' ||
      agent.licenseType.toLowerCase() === selectedLicense.toLowerCase();

    return matchesSearch && matchesLocation && matchesLicense;
  });

  const getLicenseStyle = (lic: string) => {
    if (lic === 'FULL LICENCE') {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-250';
    }
    if (lic.includes('RIT')) {
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    }
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  };

  return (
    <div
      id="clearing-agents-tab-view"
      className="w-full flex justify-center items-start py-2 md:py-4 select-none min-h-0"
    >
      <div
        id="agents-frame-container"
        className="w-full max-w-4xl flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm transition-all"
      >
        {/* SECTION HEADER */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-950 flex-shrink-0 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded bg-indigo-400 animate-pulse"></span>
              ZRA Registered Clearing Agents
            </h2>
            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
              Verified list of ZRA Licensed Customs clearing agents as of 31.05.2024
            </p>
          </div>
          <div className="bg-white/10 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wide font-mono font-bold text-slate-300">
            {filteredAgents.length} Agents Listed
          </div>
        </div>

        {/* SEARCH & FILTERS CONTROLS */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex-shrink-0 grid grid-cols-1 md:grid-cols-4 gap-2.5">
          {/* Text Search */}
          <div className="relative md:col-span-2">
            <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="agents-search-input"
              type="text"
              placeholder="Search company, TPIN, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-250 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-inner"
            />
          </div>

          {/* Location filter */}
          <div>
            <select
              id="agents-location-filter"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-205 hover:border-slate-400 p-2 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%23475569' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '1.75rem',
              }}
            >
              <option value="All">📍 All Border Locations</option>
              {LOCATIONS.filter((l) => l !== 'All').map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* License Type filter */}
          <div>
            <select
              id="agents-license-filter"
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-205 hover:border-slate-400 p-2 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%23475569' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '1.75rem',
              }}
            >
              <option value="All">📜 All Licences</option>
              {LICENSE_TYPES.filter((t) => t !== 'All').map((type) => (
                <option key={type} value={type}>
                  {type === 'FINAL CLEARANCE ONLY'
                    ? 'Final Clearance'
                    : type === 'FINAL CLEARANCE + RIT ONLY'
                    ? 'Clearance & RIT'
                    : 'Full Licence'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTAINER AREA FOR THE DATA (Flows naturally with the page layout) */}
        <div className="p-4 bg-slate-50 space-y-3">
          {filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.tpin}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all duration-150"
                >
                  <div>
                    {/* Company Names & Badges row */}
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="font-extrabold text-[11px] md:text-[12px] text-slate-900 leading-snug uppercase min-w-0 flex-grow font-display">
                        {agent.company}
                      </h4>
                      <span className="bg-slate-100 text-slate-800 text-[8.5px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-slate-200/50 flex-shrink-0">
                        {agent.location}
                      </span>
                    </div>

                    {/* License Details Type badge */}
                    <div className="mb-2">
                      <span className={`inline-block text-[8px] font-black tracking-wide rounded-md px-2 py-0.5 uppercase ${getLicenseStyle(agent.licenseType)}`}>
                        {agent.licenseType}
                      </span>
                    </div>

                    {/* TPIN & Address breakdown detail */}
                    <div className="space-y-2 mt-2">
                      {/* TPIN row with copy action */}
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-150 px-2 py-1 rounded text-[10px] font-mono">
                        <span className="text-slate-400 font-sans font-bold">ZRA TPIN:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-extrabold">{agent.tpin}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(agent.tpin, 'tpin', agent.tpin)}
                            className="text-slate-400 hover:text-slate-900 p-0.5 transition-colors cursor-pointer"
                            title="Copy TPIN"
                          >
                            {copiedId === `tpin-${agent.tpin}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Decoded Physical Address */}
                      <div className="flex gap-1.5 text-[10px] text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{agent.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Methods Buttons (Phone, Email with inline visual copy/dial success checks) */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyText(agent.phone, 'phone', agent.tpin)}
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      {copiedId === `phone-${agent.tpin}` ? (
                        <span className="text-emerald-700 font-bold uppercase text-[9px]">Copied!</span>
                      ) : (
                        <span className="truncate">{agent.phone}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(agent.email, 'email', agent.tpin)}
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-[0.98] min-w-0"
                    >
                      <Mail className="w-3 h-3 text-slate-500" />
                      {copiedId === `email-${agent.tpin}` ? (
                        <span className="text-emerald-700 font-bold uppercase text-[9px]">Copied!</span>
                      ) : (
                        <span className="truncate text-left block max-w-full">{agent.email}</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
              <Building className="w-12 h-12 mx-auto mb-2 text-slate-350" />
              <p className="font-bold text-xs uppercase text-slate-400">No agents fit search filters</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal">
                Check details and locations of filters. Some border outposts might have fewer registered agents.
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM INFORMATIONAL STATUS BANNER */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex-shrink-0 flex items-center justify-between text-[9.5px] font-sans font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-slate-450" />
            <span>ZRA registered: All listed agents correspond with authentic authority matrices.</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-450 font-semibold">
            <span>Zambia Revenue Authority</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
