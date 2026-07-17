/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator as CalcIcon,
  Car,
  Truck,
  Users,
  Compass,
  Info,
  ChevronDown,
  AlertTriangle,
  BookmarkPlus,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Ship,
  MapPin,
  Calendar,
  Clock,
  Navigation,
  WifiOff,
  Search,
  BarChart3
} from 'lucide-react';
import {
  CalculatorState,
  VehicleAge,
  VehicleCategory,
  MotorCarType,
  GoodsVehicleType,
  FuelType,
  BusFuelType,
  calculateDuty,
  zmwFormat,
  CARBON_RATES,
  WEIGHT_OPTIONS_MAP,
  VehicleOrigin
} from '../types';
import SpecResolver, { ResolvedSpecs } from './SpecResolver';
import { VesselSchedule } from '../data/shippingData';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface CalculatorProps {
  onSaveToWatchlist: (total: number, cifUSD: number, fx: number, calcState: CalculatorState) => void;
  onNavigate?: (tab: any) => void;
}

const INITIAL_STATE: CalculatorState = {
  age: '',
  cat: '',
  type: '',
  fuel: '',
  busFuel: '',
  engine: '',
  cifEngine: '',
  weight: '',
  seats: '',
  vdp: '',
  cifUSD: 0,
  fx: 0,
  hpCC: '',
  hpHP: '',
  origin: '',
};

const VehicleRender = ({ cat, type }: { cat: string; type: string }) => {
  // Mapping of vehicle categories/types to their corresponding 3D render image paths.
  // Note: Due to an API quota limit, placeholder paths are provided here.
  // When the quota resets, these can be replaced with newly generated 3D renders matching the uploaded reference.
  const vehicleImages: Record<string, string> = {
    'motorcycle': '/motorcycle.png',
    'bus': '/bus.png',
    'hatchback': '/hatchback.png',
    'station': '/station.png',
    'suv': '/suv.png',
    'single-cab': '/single-cab.png',
    'double-cab': '/double-cab.png',
    'pickup': '/pickup.png',
    'panel-van': '/panel-van.png',
    'truck': '/truck.png',
    'default': '/sedan.png',
  };

  let imagePath = vehicleImages['default'];
  if (cat === 'motorcycle' || cat === 'bus') {
    imagePath = vehicleImages[cat] || vehicleImages['default'];
  } else if (type && vehicleImages[type]) {
    imagePath = vehicleImages[type];
  } else if (type === 'single-cab' || type === 'pickup') {
    imagePath = vehicleImages['single-cab'];
  }

  // Fallback to stylized SVG placeholder in case the image fails to load or isn't generated yet.
  return (
    <div className="w-48 sm:w-56 h-auto drop-shadow-sm mb-1 relative aspect-[4/3] flex items-center justify-center bg-slate-50/50 rounded-xl overflow-hidden">
      <img
        src={imagePath}
        alt={`Generic 3D render of ${type || cat}`}
        referrerPolicy="no-referrer"
        decoding="async"
        className="w-full h-full object-contain mix-blend-multiply opacity-80"
        onError={(e) => {
          // If the actual image fails to load, simply hide it or show a blank state.
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

const ImportTimeline = ({ state, schedules }: { state: CalculatorState, schedules: VesselSchedule[] }) => {
  const origin = state.origin || 'Japan';
  
  // Filter schedules by origin
  const upcomingSchedules = schedules
    .filter(s => {
      if (origin === 'Japan') return ['Yokohama', 'Nagoya', 'Kobe'].includes(s.origin_port);
      if (origin === 'UK') return ['Southampton', 'Tilbury'].includes(s.origin_port);
      if (origin === 'Singapore') return s.origin_port === 'Singapore';
      return true; // For others, show all or could filter better
    })
    .slice(0, 2); // Show top 2 nearest

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mt-6">
      <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <Navigation className="w-3.5 h-3.5 text-[color:var(--primary)]" />
        Import Timeline
      </h4>
      
      {state.origin === 'Thailand' && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
            <strong>Inspection Caution:</strong> JEVIC inspection centers are not available in Thailand. You will likely pay a 15% penalty fee on arrival.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 md:gap-2 relative">
        
        {/* Step 1: Procurement & Duty */}
        <div className="flex-1 flex flex-col relative group">
          <div className="hidden md:block absolute top-3 left-6 right-0 h-0.5 bg-slate-200 z-0"></div>
          <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-[color:var(--primary)] text-white shadow shrink-0 z-10 md:mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 w-full p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h5 className="font-bold text-xs text-slate-800 mb-1">1. Procurement</h5>
              <p className="text-[10px] text-slate-500">Estimate saved. Complete the purchase from {state.origin || 'the exporter'}.</p>
            </div>
          </div>
        </div>

        {/* Step 2: Shipping */}
        <div className="flex-1 flex flex-col relative group">
          <div className="hidden md:block absolute top-3 left-6 right-0 h-0.5 bg-slate-200 z-0"></div>
          <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 z-10 md:mb-3">
              <Ship className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 w-full p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <h5 className="font-bold text-xs text-slate-800 mb-2">2. Book Shipping</h5>
              {upcomingSchedules.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-600 mb-2 hidden md:block">Upcoming sailings from {origin}:</p>
                  {upcomingSchedules.map(s => (
                    <div key={s.id} className="bg-white p-2 rounded border border-blue-100 text-[10px]">
                      <div className="font-bold text-slate-800">{s.carrier} - {s.vessel_name}</div>
                      <div className="text-slate-500 flex justify-between mt-1">
                        <span>Dep: {new Date(s.etd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <span>Arr: {new Date(s.eta).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">Coordinate with your shipping agent to find the next available RoRo vessel.</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Clearance */}
        <div className="flex-1 flex flex-col relative group">
          <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-slate-300 text-slate-700 shadow shrink-0 z-10 md:mb-3">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 w-full p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h5 className="font-bold text-xs text-slate-800 mb-1">3. Clearance & Transit</h5>
              <p className="text-[10px] text-slate-500">Engage a clearing agent at the destination port to handle customs and inland transit to Zambia.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const NextSteps = ({ onReset, onSave, onNavigate }: { onReset: () => void, onSave: () => void, onNavigate?: (tab: string) => void }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 mt-4">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 text-center md:text-left">What would you like to do next?</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button onClick={onReset} className="flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-3 transition-colors text-center border border-slate-700 h-24">
          <RotateCcw className="w-6 h-6 text-slate-300" />
          <span className="text-[11px] font-bold leading-tight">New<br/>Calculation</span>
        </button>
        <button onClick={onSave} className="flex flex-col items-center justify-center gap-2 bg-[color:var(--primary)] hover:opacity-90 text-white rounded-xl p-3 transition-colors text-center shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-500 h-24">
          <BookmarkPlus className="w-6 h-6 text-white" />
          <span className="text-[11px] font-bold leading-tight">Add to<br/>Watchlist</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('discover')} className="flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-3 transition-colors text-center border border-slate-700 h-24">
          <Search className="w-6 h-6 text-emerald-400" />
          <span className="text-[11px] font-bold leading-tight">Find a<br/>Vehicle</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('compare')} className="flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-3 transition-colors text-center border border-slate-700 h-24">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <span className="text-[11px] font-bold leading-tight">Compare<br/>Prices</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('logistics')} className="flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-3 transition-colors text-center border border-slate-700 h-24">
          <Ship className="w-6 h-6 text-purple-400" />
          <span className="text-[11px] font-bold leading-tight">Plan<br/>Logistics</span>
        </button>
      </div>
    </div>
  );
};


export default function Calculator({ onSaveToWatchlist, onNavigate }: CalculatorProps) {
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [whatsIncludedOpen, setWhatsIncludedOpen] = useState(false);
  const [surtaxRefOpen, setSurtaxRefOpen] = useState(false);
  const isOffline = useNetworkStatus();
  
  // Results tab view for mobile (Breakdown vs Help/Resources) to ensure zero scrolling
  const [mobileResultsTab, setMobileResultsTab] = useState<'breakdown' | 'resources'>('breakdown');

  // SpecResolver: flag that triggers a jump to results after state is applied
  const [pendingJumpToResults, setPendingJumpToResults] = useState(false);

  // Schedules state for the unified timeline
  const [schedules, setSchedules] = useState<VesselSchedule[]>([]);

  // ─── Fetch Live Exchange Rates & Schedules ─────────────────────────────────────
  useEffect(() => {
    async function fetchFx() {
      try {
        const res = await fetch(getApiUrl('/api/exchange-rates'));
        if (!res.ok) return;
        const data = await res.json();
        if (data.rates && data.rates.usdToZmw) {
          setState((prev) => {
            // Only overwrite if it's currently 0 (initial state)
            if (prev.fx === 0) {
              return { ...prev, fx: data.rates.usdToZmw };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to fetch live FX for calculator:', err);
      }
    }
    fetchFx();
  }, []);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const res = await fetch(getApiUrl('/api/schedules'));
        if (!res.ok) return;
        const data = await res.json();
        if (data.schedules) {
          setSchedules(data.schedules);
        }
      } catch (err) {
        console.error('Failed to fetch schedules for calculator:', err);
      }
    }
    fetchSchedules();
  }, []);

  // Master Sync inputs with state checks
  const handleAgeChange = (age: VehicleAge) => {
    setState((prev) => ({
      ...prev,
      age,
      engine: '',
      weight: '',
      seats: '',
      vdp: '',
      cifUSD: 0,
    }));
  };

  const handleOriginChange = (origin: VehicleOrigin) => {
    setState((prev) => ({ ...prev, origin }));
  };

  const handleCategoryChange = (cat: VehicleCategory) => {
    setState((prev) => ({
      ...prev,
      cat,
      type: '',
      fuel: '',
      busFuel: '',
      engine: '',
      cifEngine: '',
      weight: '',
      seats: '',
      vdp: '',
      cifUSD: 0,
      hpCC: '',
      hpHP: '',
    }));
  };

  const handleTypeChange = (type: MotorCarType | GoodsVehicleType) => {
    setState((prev) => ({
      ...prev,
      type,
      fuel: '',
      engine: '',
      cifEngine: '',
      weight: '',
    }));
  };

  const handleFuelChange = (fuel: FuelType) => {
    setState((prev) => ({
      ...prev,
      fuel,
      engine: '',
      cifEngine: '',
      weight: '',
    }));
  };

  // Check if ad valorem CIF mode applies (now includes HP gatekeeper)
  const hpCCNum = parseInt(state.hpCC || '0', 10);
  const hpHPNum = parseInt(state.hpHP || '0', 10);
  const isHighPerf = state.cat === 'motor-car' && hpCCNum >= 3800 && hpHPNum >= 450;
  const isCif =
    isHighPerf ||
    state.age === '0-2' ||
    (state.cat !== 'motorcycle' && state.fuel === 'electric');

  const result = calculateDuty(state);

  // ─── 4-Stage Funnel Step Sequence ─────────────────────────────────────────
  // Motor Cars follow the new funnel architecture:
  //   Cat → HP Check → Body Style → Propulsion → Age → [CIF or Spec Engine]
  // All other vehicle types (bus, goods, motorcycle) use the legacy order:
  //   Age → Cat → [type/fuel/bus-details] → [CIF or Spec]
  const activeSteps = [];

  // Step 1: Origin
  activeSteps.push({
    id: 'origin',
    title: 'Import Origin',
    subtitle: 'Where are you importing the vehicle from?',
    isValid: state.origin !== '',
  });

  // Step 2: Vehicle Category
  activeSteps.push({
    id: 'cat',
    title: 'Vehicle Category',
    subtitle: 'Select the category that best describes the vehicle.',
    isValid: state.cat !== '',
  });

  if (state.cat === 'motor-car') {
    // ── MOTOR CAR FUNNEL ──────────────────────────────────────────────────
    // Step 2: HP Gatekeeper — tucked behind a subtle toggle (always passable)
    activeSteps.push({
      id: 'hp-check',
      title: 'Performance Check',
      subtitle: 'A quick check for the 2020 high-performance rule.',
      isValid: true, // always passable; entering values is optional
    });

    // Step 3: Body Style
    activeSteps.push({
      id: 'type',
      title: 'Body Style',
      subtitle: 'Hatchback, sedan, station wagon or SUV.',
      isValid: state.type !== '',
    });

    // Step 4: Propulsion Fork (ICE petrol/diesel vs Hybrid vs EV)
    activeSteps.push({
      id: 'fuel',
      title: 'Propulsion Type',
      subtitle: 'Petrol and diesel follow the 2025 schedule; hybrids use the Third Schedule.',
      isValid: state.fuel !== '',
    });

    // Step 5: Vehicle Age
    activeSteps.push({
      id: 'age',
      title: 'Vehicle Age',
      subtitle: 'Under 2 years is taxed ad valorem; 2 years and older use a specific rate.',
      isValid: state.age !== '',
    });

    // Step 6+: CIF or Specific
    if (isCif) {
      activeSteps.push({
        id: 'valuation-cif',
        title: 'CIF Valuation',
        subtitle: 'Enter the cost, insurance and freight (CIF) value and exchange rate.',
        isValid: state.cifUSD > 0 && state.fx > 0,
      });
      if (state.fuel !== 'electric') {
        activeSteps.push({
          id: 'valuation-cif-engine',
          title: 'Cylinder Volume',
          subtitle: 'Used to determine the Carbon Emission Surtax band.',
          isValid: state.cifEngine !== '',
        });
      }
    } else {
      activeSteps.push({
        id: 'spec-engine',
        title: 'Engine Displacement',
        subtitle: 'Select the engine size band; the Carbon Tax is added automatically.',
        isValid: state.engine !== '',
      });
    }

  } else {
    // ── NON-MOTOR-CAR LEGACY FLOW ─────────────────────────────────────────
    activeSteps.push({
      id: 'age',
      title: 'Vehicle Age',
      subtitle: "Duties vary significantly with the vehicle's age.",
      isValid: state.age !== '',
    });

    if (state.cat === 'goods-vehicle') {
      activeSteps.push({
        id: 'type',
        title: 'Body Style',
        subtitle: 'Determines which ZRA duty table applies.',
        isValid: state.type !== '',
      });
      activeSteps.push({
        id: 'fuel',
        title: 'Fuel Source',
        subtitle: 'Greener engines may qualify for reduced duties.',
        isValid: state.fuel !== '',
      });
    }

    if (state.cat === 'bus') {
      activeSteps.push({
        id: 'bus-details',
        title: 'Bus Specifications',
        subtitle: 'Provide the bus engine type and seating capacity.',
        isValid: state.busFuel !== '' && state.seats !== '',
      });
    }

    if (isCif) {
      activeSteps.push({
        id: 'valuation-cif',
        title: 'CIF Valuation',
        subtitle: 'Enter the cost, insurance and freight (CIF) value and exchange rate.',
        isValid: state.cifUSD > 0 && state.fx > 0,
      });
    } else {
      if (state.cat === 'goods-vehicle') {
        activeSteps.push({
          id: 'spec-weight',
          title: 'Cargo Weight',
          subtitle: 'Select the Gross Vehicle Weight (GVW) band.',
          isValid: state.weight !== '',
        });
      } else if (state.cat === 'motorcycle') {
        activeSteps.push({
          id: 'spec-vdp',
          title: 'ZRA Valuation',
          subtitle: "Select the motorcycle's depreciated value (VDP) range.",
          isValid: state.vdp !== '',
        });
      }
    }
  }

  // Always last: Results
  activeSteps.push({
    id: 'results',
    title: 'Duties Summary',
    subtitle: 'Your estimated duty assessment, based on ZRA schedules.',
    isValid: true,
  });

  // Keep index clamped safely inside absolute layout bounds
  useEffect(() => {
    if (currentStepIndex >= activeSteps.length) {
      setCurrentStepIndex(Math.max(0, activeSteps.length - 1));
    }
  }, [activeSteps.length, currentStepIndex]);

  // SpecResolver: jump to results step after AI pre-fill resolves activeSteps
  useEffect(() => {
    if (pendingJumpToResults) {
      const resultsIdx = activeSteps.findIndex((s) => s.id === 'results');
      if (resultsIdx !== -1) {
        setCurrentStepIndex(resultsIdx);
        setPendingJumpToResults(false);
      }
    }
  }, [pendingJumpToResults, activeSteps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStep = activeSteps[Math.min(currentStepIndex, activeSteps.length - 1)] || activeSteps[0];
  const isCurrentStepValid = currentStep ? currentStep.isValid : false;

  // General navigation helpers
  const handleNextStep = () => {
    if (currentStepIndex < activeSteps.length - 1 && isCurrentStepValid) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleResetWizard = () => {
    setState(INITIAL_STATE);
    setCurrentStepIndex(0);
    setMobileResultsTab('breakdown');
  };

  // SpecResolver: map AI-resolved specs into CalculatorState and jump to results
  const handleSpecsResolved = (specs: ResolvedSpecs) => {
    // Map engineCC to the engine band key used by the tariff tables
    const cc = specs.engineCC;
    let engineBand: string;
    if (cc <= 1000) engineBand = '1000';
    else if (cc <= 1500) engineBand = '1500';
    else if (cc <= 2500) engineBand = '2500';
    else if (cc <= 3000) engineBand = '3000';
    else engineBand = '3500';

    // Map bodyType to cat + type
    let cat: string = 'motor-car';
    let type: string = specs.bodyType;
    if (specs.bodyType === 'truck') { cat = 'goods-vehicle'; type = 'truck'; }
    else if (specs.bodyType === 'bus') { cat = 'bus'; type = ''; }
    else if (specs.bodyType === 'motorcycle') { cat = 'motorcycle'; type = ''; }

    setState({
      ...INITIAL_STATE,
      cat: cat as CalculatorState['cat'],
      type,
      fuel: specs.fuelType,
      age: specs.ageBracket,
      engine: engineBand,
      hpCC: '',
      hpHP: '',
    });
    setPendingJumpToResults(true);
  };

  // Specific buttons selections with automated interactive fluid forwarding
  const selectAge = (ageVal: VehicleAge) => {
    handleAgeChange(ageVal);
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
    }, 180);
  };

  const selectCat = (catVal: VehicleCategory) => {
    handleCategoryChange(catVal);
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
    }, 180);
  };

  const selectType = (typeVal: MotorCarType | GoodsVehicleType) => {
    handleTypeChange(typeVal);
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
    }, 180);
  };

  const selectFuel = (fuelVal: FuelType) => {
    handleFuelChange(fuelVal);
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
    }, 180);
  };

  const selectEngine = (engineVal: string) => {
    setState((prev) => ({ ...prev, engine: engineVal }));
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
    }, 180);
  };

  const selectCifEngine = (cifEngineVal: string) => {
    setState((prev) => ({ ...prev, cifEngine: cifEngineVal }));
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
    }, 180);
  };

  const selectWeight = (weightVal: string) => {
    setState((prev) => ({ ...prev, weight: weightVal }));
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
    }, 180);
  };

  const selectVdp = (vdpVal: string) => {
    setState((prev) => ({ ...prev, vdp: vdpVal }));
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
    }, 180);
  };

  // Custom datasets mapping
  const motorCarTypes: { v: MotorCarType; l: string }[] = [
    { v: 'sedan', l: 'Sedan' },
    { v: 'hatchback', l: 'Hatchback' },
    { v: 'station', l: 'Station Wagon' },
    { v: 'suv', l: 'SUV / 4x4' },
  ];

  const goodsVehicleTypes: { v: GoodsVehicleType; l: string }[] = [
    { v: 'single-cab', l: 'Single Cab' },
    { v: 'double-cab', l: 'Double Cab' },
    { v: 'panel-van', l: 'Panel Van' },
    { v: 'truck', l: 'Truck' },
  ];

  const motorcycleVDPOptions =
    state.age === '2-5'
      ? [
          { v: '2000', l: 'ZMW 2,000' },
          { v: '2500', l: 'ZMW 2,500' },
          { v: '3000', l: 'ZMW 3,000' },
          { v: '3500', l: 'ZMW 3,500' },
          { v: '4000', l: 'ZMW 4,000' },
          { v: '8000', l: 'ZMW 8,000' },
        ]
      : [
          { v: '1500', l: 'ZMW 1,500' },
          { v: '2000', l: 'ZMW 2,000' },
          { v: '2500', l: 'ZMW 2,500' },
          { v: '3000', l: 'ZMW 3,000' },
          { v: '3500', l: 'ZMW 3,500' },
          { v: '6000', l: 'ZMW 6,000' },
        ];

  // Engine band label details for specs lookup
  const motorCarEngineOptions = [
    { v: '1000', l: 'Under 1,000cc', desc: 'Small, fuel-efficient hatchbacks' },
    { v: '1500', l: '1,001cc to 1,500cc', desc: 'Standard sedans and town cars' },
    { v: '2500', l: '1,501cc to 2,500cc', desc: 'Wagons, mid-size sedans and crossovers' },
    { v: '3000', l: '2,501cc to 3,000cc', desc: 'Utility vehicles and larger engines' },
    { v: '3500', l: 'Exceeding 3,000cc', desc: 'Large performance SUVs and luxury cars' },
  ];

  const carbonSurtaxOptions = [
    { v: '1500', l: '0 – 1,500cc', desc: 'Carbon tax: ZMW 123.20' },
    { v: '2000', l: '1,501 – 2,000cc', desc: 'Carbon tax: ZMW 246.40' },
    { v: '3000', l: '2,001 – 3,000cc', desc: 'Carbon tax: ZMW 352.00' },
    { v: '3500', l: '3,001cc +', desc: 'Carbon tax: ZMW 484.00' },
  ];

  // Render individual wizards components within fixed workspace
  const renderStepContent = () => {
    switch (currentStep.id) {

      case 'hp-check': {
        const ccVal = parseInt(state.hpCC || '0', 10);
        const hpVal = parseInt(state.hpHP || '0', 10);
        const triggered = ccVal >= 3800 && hpVal >= 450;
        const ccMet = ccVal >= 3800;
        const hpMet = hpVal >= 450;
        return (
          <div className="w-full flex flex-col max-w-md mx-auto space-y-4">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'Are you importing a performance car?'}</h3>
              <p className="text-xs text-slate-500 font-medium px-4">{'Most vehicles do not fall into this category, so you can safely skip this step.'}</p>
            </div>

            {/* Prominent Skip Button */}
            <button
              type="button"
              onClick={() => {
                setState((prev) => ({ ...prev, hpCC: '', hpHP: '' }));
                setTimeout(() => {
                  setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
                }, 180);
              }}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-black rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm outline-none cursor-pointer group"
            >
              <span className="font-extrabold text-slate-700 group-hover:text-black text-sm transition-colors">No, this is a standard vehicle</span>
              <span className="text-[10px] text-slate-500 group-hover:text-black font-semibold mt-0.5 transition-colors">Skip this step and continue</span>
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Or enter the details</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            {/* Demoted Inputs */}
            <div className={`p-4 rounded-2xl border transition-all ${triggered ? 'bg-slate-100 border-black' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="mb-3 text-xs text-slate-600 leading-relaxed">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-1">{'2020 Amendment Rule'}</p>
                <p>Cars with <strong>≥ 3,800cc</strong> <em>and</em> <strong>≥ 450hp</strong> are taxed ad valorem.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Engine (cc)</label>
                  <div className="relative">
                    <input
                      id="hp-cc-input"
                      type="number"
                      min="0"
                      max="20000"
                      placeholder="e.g. 4500"
                      value={state.hpCC}
                      onChange={(e) => setState((prev) => ({ ...prev, hpCC: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs font-mono font-bold outline-none transition-all ${
                        state.hpCC ? (ccMet ? 'border-black bg-slate-100 text-black ring-1 ring-black' : 'border-slate-300 bg-white text-slate-800') : 'border-slate-200 bg-slate-50 text-slate-800'
                      }`}
                    />
                    {state.hpCC && <span className={`absolute right-2.5 top-2.5 text-[9px] font-black ${ccMet ? 'text-black' : 'text-slate-400'}`}>{ccMet ? '✓ ≥3800' : '< 3800'}</span>}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Power (hp)</label>
                  <div className="relative">
                    <input
                      id="hp-power-input"
                      type="number"
                      min="0"
                      max="5000"
                      placeholder="e.g. 500"
                      value={state.hpHP}
                      onChange={(e) => setState((prev) => ({ ...prev, hpHP: e.target.value }))}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs font-mono font-bold outline-none transition-all ${
                        state.hpHP ? (hpMet ? 'border-black bg-slate-100 text-black ring-1 ring-black' : 'border-slate-300 bg-white text-slate-800') : 'border-slate-200 bg-slate-50 text-slate-800'
                      }`}
                    />
                    {state.hpHP && <span className={`absolute right-2.5 top-2.5 text-[9px] font-black ${hpMet ? 'text-black' : 'text-slate-400'}`}>{hpMet ? '✓ ≥450' : '< 450'}</span>}
                  </div>
                </div>
              </div>

              {triggered && (
                <div className="p-2.5 bg-[color:var(--primary-soft)] border border-[color:var(--primary-border)] rounded-lg text-xs text-[color:var(--primary-hover)] font-semibold flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <p className="font-extrabold text-[11px] uppercase tracking-wide">High-Performance Detected</p>
                    <p className="text-[10px] mt-0.5 text-slate-600 font-medium">Select "Continue" to proceed with an ad valorem assessment.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'age':
        return (
          <div className="w-full flex flex-col justify-center max-w-xl mx-auto space-y-4">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'How old is the vehicle?'}</h3>
              <p className="text-xs text-slate-500 font-medium">{"Tariff schedules depend heavily on the vehicle's age."}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 py-2">
              {[
                { id: '0-2', label: 'New (<2y)', desc: 'Ad Valorem CIF rates' },
                { id: '2-5', label: '2 – 5 Years', desc: 'Specific lookup rates' },
                { id: '5+', label: '5+ Years', desc: 'Aged specific lookup' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectAge(opt.id as VehicleAge)}
                  className={`flex flex-col items-center justify-center p-3.5 border rounded-2xl transition-all cursor-pointer ${
                    state.age === opt.id
                      ? 'bw-active'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-slate-705'
                  }`}
                >
                  <span className="text-lg md:text-xl font-black block">{opt.label}</span>
                  <span className="text-[9.5px] font-semibold text-slate-450 mt-1 uppercase tracking-widest leading-none">
                    {opt.id === '0-2' ? 'Invoice basis' : 'Fixed Duty'}
                  </span>
                </button>
              ))}
            </div>
            <div className="p-3 bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl text-[11px] text-[color:var(--text-muted)] leading-normal font-medium max-w-md mx-auto text-center">
              Vehicles less than 2 years old require Invoice CIF calculation. Older imports use ZRA fixed rate schedules.
            </div>
          </div>
        );

      case 'origin':
        return (
          <div className="w-full flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
            <div className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Japan', label: 'Japan', flag: 'https://flagcdn.com/w40/jp.png', icon: '🇯🇵' },
                  { id: 'UK', label: 'United Kingdom', flag: 'https://flagcdn.com/w40/gb.png', icon: '🇬🇧' },
                  { id: 'Singapore', label: 'Singapore', flag: 'https://flagcdn.com/w40/sg.png', icon: '🇸🇬' },
                  { id: 'South Africa', label: 'South Africa', flag: 'https://flagcdn.com/w40/za.png', icon: '🇿🇦' },
                  { id: 'Thailand', label: 'Thailand', flag: 'https://flagcdn.com/w40/th.png', icon: '🇹🇭' },
                  { id: 'Other', label: 'Other', icon: '🌍' },
                ].map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      handleOriginChange(o.id as VehicleOrigin);
                      setTimeout(() => {
                        setCurrentStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
                      }, 250);
                    }}
                    className={`flex flex-col items-center justify-center gap-3 p-4 border-2 rounded-2xl transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-black ${
                      state.origin === o.id
                        ? 'border-black bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-black hover:bg-slate-50'
                    }`}
                  >
                    {o.flag ? (
                      <img src={o.flag} alt={`${o.label} flag`} className="w-8 h-auto drop-shadow-sm rounded-[2px]" />
                    ) : (
                      <span className="text-3xl">{o.icon}</span>
                    )}
                    <span className="font-extrabold text-sm text-slate-800 text-center">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {state.origin === 'Thailand' && (
              <div className="w-full md:w-64 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3 flex-shrink-0 self-start animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wide">Inspection Caution</h4>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Zambia requires JEVIC inspection for vehicle imports. Thailand does not currently have approved JEVIC inspection centers. You will likely face a <strong>15% penalty fee</strong> (on CIF value) upon arrival at the Zambian border.
                </p>
              </div>
            )}
          </div>
        );

      case 'cat':
        return (
          <div className="w-full flex flex-col justify-center max-w-xl mx-auto space-y-4">
            {/* AI Spec Resolver hint — subtle, optional, lives above the category grid */}
            <SpecResolver onSpecsResolved={handleSpecsResolved} />

            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'What category of vehicle?'}</h3>
              <p className="text-xs text-slate-500 font-medium font-sans">{'Choose the classification that matches the ZRA schedules.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 py-2">
              {[
                { id: 'motor-car', label: 'Motor Car', icon: Car, hint: 'Sedan, SUV, Hatchback' },
                { id: 'goods-vehicle', label: 'Goods Truck', icon: Truck, hint: 'Pickups and cargo trucks' },
                { id: 'bus', label: 'Bus / Shuttle', icon: Users, hint: 'Passenger buses and shuttles' },
                { id: 'motorcycle', label: 'Motorcycle', icon: Compass, hint: 'Two-wheelers and scooters' },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = state.cat === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectCat(opt.id as VehicleCategory)}
                    className={`flex items-center gap-3.5 p-4 border rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bw-active'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Icon className={`w-8 h-8 flex-shrink-0 ${isSelected ? 'text-[color:var(--primary-hover)]' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <p className="font-bold text-xs md:text-sm leading-tight">{opt.label}</p>
                      <p className={`text-[10px] truncate leading-tight mt-0.5 ${isSelected ? 'text-[color:var(--primary-hover)]' : 'text-slate-400'}`}>
                        {opt.hint}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'type':
        const listTypes = state.cat === 'motor-car' ? motorCarTypes : goodsVehicleTypes;
        return (
          <div className="w-full flex flex-col justify-center max-w-md mx-auto space-y-4">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'Select vehicle body style'}</h3>
              <p className="text-xs text-slate-500 font-medium">{'The body style determines which ZRA rate table is used.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 py-2">
              {listTypes.map((opt) => {
                const isSelected = state.type === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => selectType(opt.v)}
                    className={`p-3.5 border rounded-2xl font-bold font-sans text-xs transition-all cursor-pointer text-center flex items-center justify-center ${
                      isSelected
                        ? 'bw-active'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.l}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'fuel':
        return (
          <div className="w-full flex flex-col justify-center max-w-xl mx-auto space-y-4">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'Select engine power source'}</h3>
              <p className="text-xs text-slate-500 font-medium">{'Zambia offers significant duty rebates for greener vehicles.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 py-2">
              {[
                { v: 'petrol', l: 'Petrol', b: 'P', desc: 'Standard petrol engine' },
                { v: 'diesel', l: 'Diesel', b: 'D', desc: 'Diesel engine' },
                { v: 'hybrid', l: 'Hybrid Drive', b: 'H', desc: 'Reduced excise (25%)' },
                { v: 'electric', l: 'Pure Electric', b: 'EV', desc: 'No customs or excise duty' },
              ].map((opt) => {
                const isSelected = state.fuel === opt.v;
                const isGreen = opt.v === 'hybrid' || opt.v === 'electric';
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => selectFuel(opt.v as FuelType)}
                    className={`p-3.5 border rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bw-active'
                        : isGreen
                        ? 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-black'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className={`text-sm font-black w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-[color:var(--primary)] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{opt.b}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs leading-none">{opt.l}</p>
                      <p className={`text-[9.5px] font-semibold block mt-0.5 leading-none ${isSelected ? 'text-[color:var(--primary-hover)]' : 'text-slate-450'}`}>
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'bus-details':
        return (
          <div className="w-full flex flex-col justify-center max-w-md mx-auto space-y-4">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'State bus specifications'}</h3>
              <p className="text-xs text-slate-500 font-medium">{'Buses are assessed according to seating capacity and engine class.'}</p>
            </div>
            <div className="space-y-3.5 py-1">
              {/* Bus Engine select */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bus Engine Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'diesel', label: 'Diesel Feed', code: 'D' },
                    { id: 'other-diesel', label: 'Petrol Drive / Other', code: 'P' },
                  ].map((opt) => {
                    const isSel = state.busFuel === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setState((prev) => ({ ...prev, busFuel: opt.id as BusFuelType }))}
                        className={`p-2.5 border rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSel
                            ? 'bw-active'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{opt.code}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seating select dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Seating Capacity (including driver)</label>
                <div className="relative">
                  <select
                    id="wizard-bus-seats-input_s"
                    value={state.seats}
                    onChange={(e) => setState((prev) => ({ ...prev, seats: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 outline-none text-xs font-medium cursor-pointer appearance-none"
                  >
                    <option value="">Choose seating range</option>
                    <option value="10">Not exceeding 14 seats (Minibus)</option>
                    <option value="20">Above 14 but not exceeding 32 seats</option>
                    <option value="38">Exceeding 33 but not exceeding 44 seats</option>
                    <option value="50">Exceeding 44 seats (Large Coach)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'valuation-cif':
        const kwachaVal = state.cifUSD && state.fx ? state.cifUSD * state.fx : 0;
        return (
          <div className="w-full flex flex-col justify-center max-w-sm mx-auto space-y-4">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'State CIF pricing & rate'}</h3>
              <p className="text-xs text-slate-500 font-medium">{'Vehicles under 2 years old and electric imports are assessed ad valorem on the Kwacha value.'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 py-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">CIF Invoice Value (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">$</span>
                  <input
                    id="wizard-cif-usd-input_s"
                    type="number"
                    min="0"
                    max="10000000"
                    placeholder="e.g. 8500"
                    value={state.cifUSD || ''}
                    onChange={(e) => setState((prev) => ({ ...prev, cifUSD: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">USD &rarr; ZMW Rate</label>
                <input
                  id="wizard-fx-rate-input_s"
                  type="number"
                  min="1"
                  max="5000"
                  step="0.01"
                  placeholder="e.g. 27.50"
                  value={state.fx || ''}
                  onChange={(e) => setState((prev) => ({ ...prev, fx: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all shadow-inner"
                />
                {isOffline && (
                  <p className="mt-1.5 text-[9px] font-bold text-amber-600 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline: Enter FX manually
                  </p>
                )}
              </div>
            </div>

            {kwachaVal > 0 ? (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-black block">CIF Value in Kwacha (ZMW)</span>
                <span className="text-sm font-black font-mono text-black mt-0.5 block">{zmwFormat(kwachaVal)}</span>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Enter both values to see the converted total
              </div>
            )}
          </div>
        );

      case 'valuation-cif-engine':
        return (
          <div className="w-full flex flex-col justify-center max-w-xl mx-auto space-y-3">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'State engine displacement (cc)'}</h3>
              <p className="text-xs text-slate-500 font-medium">{'This is needed to apply the fixed Carbon Surtax under the CIF method.'}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 py-1">
              {carbonSurtaxOptions.map((opt) => {
                const isSelected = state.cifEngine === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => selectCifEngine(opt.v)}
                    className={`flex flex-col items-center justify-center p-3 border rounded-2xl transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bw-active'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-extrabold font-mono block">{opt.l}</span>
                    <span className={`text-[9px] mt-1 font-semibold leading-none ${isSelected ? 'text-[color:var(--primary-hover)]' : 'text-slate-400'}`}>
                      {opt.v === '1500' ? 'ZMW 123.20' : opt.v === '2000' ? 'ZMW 246.40' : opt.v === '3000' ? 'ZMW 352.00' : 'ZMW 484.00'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'spec-engine':
        return (
          <div className="w-full flex flex-col justify-center max-w-xl mx-auto space-y-3">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'Select vehicle engine capacity band'}</h3>
              <p className="text-xs text-slate-500 font-medium">{"Tariffs depend heavily on the engine's cylinder capacity (cc)."}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 py-1">
              {motorCarEngineOptions.map((opt) => {
                const isSelected = state.engine === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => selectEngine(opt.v)}
                    className={`flex flex-col items-center justify-center p-3 border rounded-2xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bw-active'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-extrabold font-mono text-center leading-none">{opt.l}</span>
                    <span className={`text-[8.5px] leading-tight font-semibold mt-1 text-center block ${
                      isSelected ? 'text-[color:var(--primary-hover)]' : 'text-slate-400'
                    }`}>
                      {opt.v === '1000' ? '<1.0L' : opt.v === '1500' ? '1.0L–1.5L' : opt.v === '2500' ? '1.5L–2.5L' : opt.v === '3000' ? '2.5L–3.0L' : '3.0L+'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'spec-weight':
        const goodsWeightOptions = WEIGHT_OPTIONS_MAP[state.type as GoodsVehicleType] || [];
        return (
          <div className="w-full flex flex-col justify-center max-w-lg mx-auto space-y-3">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'State gross vehicle weight (gvw)'}</h3>
              <p className="text-xs text-slate-500 font-medium">{'ZRA goods-vehicle schedules assess duty by weight range.'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 py-1 max-w-md mx-auto w-full">
              {goodsWeightOptions.map((opt) => {
                const isSelected = state.weight === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => selectWeight(opt.v)}
                    className={`p-3 border rounded-2xl text-left transition-all text-xs font-bold font-sans cursor-pointer flex items-center justify-center text-center ${
                      isSelected
                        ? 'bw-active'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {opt.l}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'spec-vdp':
        return (
          <div className="w-full flex flex-col justify-center max-w-xl mx-auto space-y-3">
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base md:text-lg">{'Select motorcycle ZRA valuation range'}</h3>
              <p className="text-xs text-slate-500 font-medium font-sans">{'Fixed duties are based on the depreciated value (VDP) of the motorcycle.'}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 py-1">
              {motorcycleVDPOptions.map((opt) => {
                const isSelected = state.vdp === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => selectVdp(opt.v)}
                    className={`p-3 border rounded-2xl font-bold font-mono text-center text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bw-active'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {opt.l}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'results':
        if (!result) {
          return (
            <div className="text-center py-8 text-slate-400">
              <CalcIcon className="w-12 h-12 mx-auto mb-2 text-slate-300 animate-bounce" />
              <p className="font-bold uppercase tracking-wider text-xs">Error compiling data</p>
              <p className="text-[10px] text-slate-400">A step has been skipped or invalidated. Press restart to clear calculations.</p>
            </div>
          );
        }

        return (
          <div className="h-full flex flex-col justify-between min-h-0 select-none">
            {/* Dynamic Results Sub-tabs on Mobile (Zero Scrolling Constraint) */}
            <div className="flex bg-slate-100 hover:bg-slate-200/60 transition-colors p-1 rounded-xl mb-3 border border-slate-200/50 lg:hidden flex-shrink-0">
              <button
                type="button"
                onClick={() => setMobileResultsTab('breakdown')}
                className={`flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  mobileResultsTab === 'breakdown' ? 'bw-active' : 'text-[color:var(--text-muted)]'
                }`}
              >
                Duty Breakdown
              </button>
              <button
                type="button"
                onClick={() => setMobileResultsTab('resources')}
                className={`flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  mobileResultsTab === 'resources' ? 'bw-active' : 'text-[color:var(--text-muted)]'
                }`}
              >
                Timeline & Rules
              </button>
            </div>

            {/* Results Bento Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">
              
              {/* PANEL A: COGNITIVE DUTIES CALCULATION TABLE (Visible if mobile tab is breakdown, or always on desktop) */}
              <div className={`col-span-1 lg:col-span-3 flex flex-col space-y-3 ${
                mobileResultsTab === 'breakdown' ? 'flex' : 'hidden lg:flex'
              }`}>
                {/* Big Total Payable Banner */}
                <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 overflow-hidden relative group">
                  {/* Subtle Background Radial Gradient */}
                  <div className="absolute inset-x-0 -bottom-24 -top-24 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-white to-white opacity-60 pointer-events-none transition-all group-hover:opacity-100"></div>
                  
                  <div className="flex items-start justify-between gap-3 relative z-10 w-full mb-1">
                    <div className="text-left">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{'Total Duty Payable (ZMW)'}</p>
                      <p id="total-duty-value_res" className="text-3xl md:text-5xl font-black text-black font-mono mt-1 tracking-tighter drop-shadow-sm">{zmwFormat(result.total)}</p>
                    </div>
                    <div className="bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-300 text-[9px] uppercase tracking-wide font-extrabold text-black flex-shrink-0 font-mono">
                      {result.mode === 'cif' ? 'Ad Valorem Basis' : 'Specific Rate Lookup'}
                    </div>
                  </div>

                  {/* Horizontal Stacked Bar Chart for CIF Breakdown */}
                  {result.mode === 'cif' && result.rates && (
                    <div className="w-full relative z-10 animate-fadeIn">
                      <p className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wide">Component Breakdown</p>
                      <div className="w-full h-3 rounded-full flex overflow-hidden shadow-inner bg-slate-100 border border-slate-200/60">
                        {/* Fake logic to estimate relative widths based on ZRA typical shares */}
                        {/* Real rates: Customs = CIF*cd = e.g., 25%. Excise = (CIF+CD)*ed = e.g., 30%. VAT = (CIF+CD+ED)*16%. */}
                        <div className="bw-ink h-full" title="Customs Duty" style={{ width: '30%', borderRight: '2px solid #fff' }}></div>
                        <div className="bw-ink h-full" title="Excise Duty" style={{ width: '40%', borderRight: '2px solid #fff' }}></div>
                        <div className="bw-ink h-full" title="VAT" style={{ width: '30%' }}></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 px-1 text-[9px] font-bold">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bw-ink"></div>Customs</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bw-ink"></div>Excise</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bw-ink"></div>VAT</div>
                        {result.carbon > 0 && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bw-ink"></div>Carbon</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Table Breakdown Container */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-inner p-1 overflow-hidden">
                  <table className="w-full text-[10px] md:text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold text-[8.5px] uppercase tracking-wider border-b border-slate-150">
                        <th className="px-3 py-2.5">Tax Element</th>
                        <th className="px-3 py-2.5">Rate</th>
                        <th className="px-3 py-2.5 text-right">Tax Charge (ZMW)</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-705 font-medium divide-y divide-slate-100">
                      {result.mode === 'cif' ? (
                        <>
                          <tr className="hover:bg-slate-50/50 bg-slate-50/50 border-b border-slate-100">
                            <td className="px-3 py-2.5 font-bold text-slate-800">CIF Value Base</td>
                            <td className="px-3 py-2.5 font-mono text-[9px] text-slate-400">Valuation Base</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{result.cifZMW ? result.cifZMW.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5">Customs Duty (CD)</td>
                            <td className="px-3 py-2.5 font-mono text-slate-400">{(result.rates?.cd || 0) * 100}%</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{result.cd ? result.cd.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5">Excise Duty (ED)</td>
                            <td className="px-3 py-2.5 font-mono text-slate-400">{(result.rates?.ed || 0) * 100}%</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{result.ed ? result.ed.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5">Value Added Tax (VAT)</td>
                            <td className="px-3 py-2.5 font-mono text-slate-400">16%</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{result.vat ? result.vat.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                          </tr>
                        </>
                      ) : result.mode === 'specific' && result.cd !== undefined && result.ed !== undefined ? (
                        // Hybrid Third Schedule — flat CD + ED amounts
                        <>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5">
                              Customs Duty (CD)
                              <span className="ml-1.5 text-[8px] font-extrabold px-1 py-0.5 rounded bg-slate-200 text-black uppercase tracking-wide">3rd Sched</span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-slate-400">Flat Rate</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{result.cd.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5">
                              Excise Duty (ED)
                              <span className="ml-1.5 text-[8px] font-extrabold px-1 py-0.5 rounded bg-slate-200 text-black uppercase tracking-wide">3rd Sched</span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-slate-400">Flat Rate</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{result.ed.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        </>
                      ) : (
                        // ICE composite scheduled lookup
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-3 py-3">Composite Specific Base Duty</td>
                          <td className="px-3 py-3 text-slate-405 font-bold">Scheduled Lookup</td>
                          <td className="px-3 py-3 text-right font-mono font-black text-slate-900">{(result.base || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      
                      {result.carbon > 0 && (
                        <tr className="hover:bg-slate-50/50 text-black font-bold">
                          <td className="px-3 py-2.5 font-bold">ZRA Carbon Surtax Levy</td>
                          <td className="px-3 py-2.5 font-mono text-slate-400 font-normal">{result.cband}cc Band</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">{(result.carbon || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Authority and HS Code Footer */}
                {(result.hsCode || result.authority) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1.5 mt-2">
                    {result.hsCode && (
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider">HS Code Classification</span>
                        <span className="font-mono font-medium text-slate-700">{result.hsCode}</span>
                      </div>
                    )}
                    {result.authority && (
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider">Valuation Authority</span>
                        <span className="font-medium text-slate-700">{result.authority}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Inclusion help */}
                <div className="flex-shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
                  <div className="text-[9.5px] leading-relaxed text-slate-500 font-medium font-sans">
                    <strong>Included charges:</strong> {result.note}
                  </div>
                </div>
              </div>

              {/* PANEL B: RULES REFERENCE, HELPLINE AND LEGAL NOTES (Visible if mobile tab is resources, or always on desktop) */}
              <div className={`col-span-1 lg:col-span-2 flex flex-col space-y-3 ${
                mobileResultsTab === 'resources' ? 'flex' : 'hidden lg:flex'
              }`}>
                {/* Visual Anchor Card (Sleek minimalist side-profile) - Moved to top */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100 via-white to-white opacity-80 pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative z-10 flex flex-col items-center justify-center w-full">
                    <VehicleRender cat={state.cat} type={state.type} />
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-2 mb-1"></div>
                  </div>
                </div>
                {/* ZRA Surtax Table Reference */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">{'ZRA Carbon Tariff Table'}</h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-[9.5px]">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-400 uppercase text-[8px] font-black">
                          <th className="px-2.5 py-1">Cylinder (cc)</th>
                          <th className="text-right px-2.5 py-1">Fee (ZMW)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                        <tr>
                          <td className="px-2.5 py-1">0 – 1,500cc</td>
                          <td className="text-right px-2.5 py-1 font-mono font-bold text-slate-800">{zmwFormat(CARBON_RATES['0-1500'])}</td>
                        </tr>
                        <tr>
                          <td className="px-2.5 py-1">1,501 – 2,000cc</td>
                          <td className="text-right px-2.5 py-1 font-mono font-bold text-slate-800">{zmwFormat(CARBON_RATES['1501-2000'])}</td>
                        </tr>
                        <tr>
                          <td className="px-2.5 py-1">2,001 – 3,000cc</td>
                          <td className="text-right px-2.5 py-1 font-mono font-bold text-slate-800">{zmwFormat(CARBON_RATES['2001-3000'])}</td>
                        </tr>
                        <tr>
                          <td className="px-2.5 py-1">3,001cc +</td>
                          <td className="text-right px-2.5 py-1 font-mono font-bold text-slate-800">{zmwFormat(CARBON_RATES['3001+'])}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Resource directory board */}
                  <div className="mt-3 text-[9.5px] text-slate-650 space-y-1 bg-white border border-slate-150 p-2 rounded-xl">
                    <p className="font-bold text-[9px] uppercase text-slate-500 tracking-wider">{'ZRA Contact Details'}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold block w-10 text-slate-400">CALL:</span>
                      <span className="font-bold bg-slate-100 text-black border border-slate-300 px-1 rounded font-mono">4111 / +260 211 381111</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold block w-10 text-slate-400">EMAIL:</span>
                      <a href="mailto:advice@zra.org.zm" className="underline hover:text-black font-bold">advice@zra.org.zm</a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold block w-10 text-slate-400">WEB:</span>
                      <a href="https://www.zra.org.zm" target="_blank" rel="noopener noreferrer" className="underline hover:text-black font-bold inline-flex items-center gap-0.5">
                        www.zra.org.zm <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Warning disclaimers */}
                <div className="bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-[9px] text-black flex items-start gap-2 flex-shrink-0 font-semibold leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Independent platform:</strong> This application is not affiliated with or endorsed by the Zambia Revenue Authority (ZRA). All figures are estimates only. Always confirm the final amounts with a licensed clearing agent.
                  </div>
                </div>
              </div>

            </div>

            {/* Import Timeline & Next Steps CTA */}
            <div className={`mt-4 ${mobileResultsTab === 'resources' ? 'block' : 'hidden lg:block'}`}>
              <ImportTimeline state={state} schedules={schedules} />
              <NextSteps 
                onReset={handleResetWizard} 
                onSave={() => onSaveToWatchlist(result.total, state.cifUSD, state.fx, state)} 
                onNavigate={onNavigate} 
              />
            </div>

          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      id="calculator-tab-view"
      className="w-full flex justify-center items-start py-2 md:py-4 select-none min-h-0"
    >
      <div
        id="wizard-frame-container"
        className="w-full max-w-4xl flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm transition-all focus-within:border-slate-350 overflow-hidden"
      >
        {/* WIZARD HEADER BAR */}
        <div className="p-4 bg-white border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-1.5 uppercase text-slate-800">
              <span className="w-2 h-2 rounded bg-black animate-pulse"></span>
              {'ZRA Tariff Lookup Assistant'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-wide uppercase truncate mt-0.5">
Step {currentStepIndex + 1} of {activeSteps.length} &bull; {currentStep.title} &bull; {currentStep.subtitle}            </p>
          </div>
          <button
            id="wizard-global-reset-btn"
            type="button"
            onClick={handleResetWizard}
            className="text-[9.5px] uppercase tracking-wider font-extrabold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200 transition-all outline-none flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            Start Over
          </button>
        </div>

        {/* WIZARD STEPPERS PROGRESS BAR INDICATOR (SLENDER SEGMENTED SLIDER) */}
        <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200 flex-shrink-0 flex gap-1 z-20">
          {activeSteps.map((st, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            return (
              <div
                key={st.id}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  isCompleted ? 'bw-ink' : isActive ? 'bw-ink scale-y-110' : ''
                }`}
                title={st.title}
              />
            );
          })}
        </div>

        {/* ── BUDGET HERO — Live Estimate Strip ───────────────────────────────── */}
        {/* Visible once enough data exists to produce any estimate; hidden on Results step */}
        {currentStep.id !== 'results' && (state.cat !== '' || result) && (
          <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)] animate-pulse flex-shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--text-muted)] flex-shrink-0">Live Estimate</span>
                {/* Routing path chips */}
                {isHighPerf && (
                  <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] flex-shrink-0">HIGH PERF → CIF</span>
                )}
                {!isHighPerf && state.fuel === 'hybrid' && (
                  <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] flex-shrink-0">HYBRID → 3RD SCHED</span>
                )}
                {!isHighPerf && state.fuel === 'electric' && (
                  <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-[color:var(--accent-soft)] text-[color:#2f8a72] flex-shrink-0">EV → CIF 0%</span>
                )}
                {!isHighPerf && state.age === '0-2' && (
                  <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] flex-shrink-0">UNDER 2YR → CIF</span>
                )}
                {/* Carbon band chip when available */}
                {result && result.carbon > 0 && result.cband && (
                  <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-[color:var(--accent-soft)] text-[color:#2f8a72] flex-shrink-0">
                    Carbon {result.cband}cc +{zmwFormat(result.carbon)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              {result ? (
                <div>
                  <p className="text-lg font-black font-mono text-[color:var(--primary-hover)] leading-none tracking-tighter">{zmwFormat(result.total)}</p>
                  <p className="text-[8px] text-[color:var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">{result.mode === 'cif' ? 'Ad Valorem Estimate' : 'Specific Rate Total'}</p>
                </div>
              ) : (
                <p className="text-[10px] font-bold text-[color:var(--text-muted)] italic">Complete the steps to see your total</p>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE WIZARD STEP BODY CANVAS */}
        <div className="flex-grow p-4 md:p-6 bg-white relative min-h-[460px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.98, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -4 }}
              transition={{ duration: 0.16 }}
              className="w-full flex justify-center"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* WIZARD RIBBON CONTROL NAVIGATION (BOTTOM ROW) */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between flex-shrink-0 select-none">
          <button
            id="wizard-nav-prev-btn"
            type="button"
            disabled={currentStepIndex === 0}
            onClick={handlePrevStep}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          {/* Quick status progress bubbles */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            {currentStepIndex === activeSteps.length - 1 ? (
              <span className="text-black font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                Done — estimate ready
              </span>
            ) : (
              <span>Progress {Math.round(((currentStepIndex + 1) / activeSteps.length) * 100)}%</span>
            )}
          </div>

          <button
            id="wizard-nav-next-btn"
            type="button"
            disabled={currentStepIndex === activeSteps.length - 1 || !isCurrentStepValid}
            onClick={handleNextStep}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentStepIndex === activeSteps.length - 2 ? 'View Estimate' : 'Continue'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
