import React, { useState } from 'react';
import { 
  ShieldCheck, FileCheck2, Ship, Building2, CarFront, AlertTriangle, 
  Map, Briefcase, FileText, BadgeAlert, Anchor, CheckCircle2 
} from 'lucide-react';

export default function ImportGuide() {
  const [activeSection, setActiveSection] = useState<'permanent' | 'temporary' | 'commercial' | 'safety'>('permanent');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      
      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-black font-display text-black tracking-tight mb-3">
          {'{The Comprehensive Vehicle Import Guide}'}
        </h2>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-6">
          {'{Whether you\'re buying a car from Japan to keep forever, driving your South African SUV through for a holiday, or bringing in a fleet of contractor vehicles, here are the actual, on-the-ground steps and rules you need to know.}'}
        </p>
        
        {/* Internal Tabs */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveSection('permanent')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeSection === 'permanent' ? 'bw-active' : ''}`}
          >
            {'{Permanent Imports}'}
          </button>
          <button 
            onClick={() => setActiveSection('temporary')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeSection === 'temporary' ? 'bw-active' : ''}`}
          >
            {'{Temporary (Tourists & Transit)}'}
          </button>
          <button 
            onClick={() => setActiveSection('commercial')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeSection === 'commercial' ? 'bw-active' : ''}`}
          >
            {'{Corporate & Commercial TIP}'}
          </button>
          <button 
            onClick={() => setActiveSection('safety')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeSection === 'safety' ? 'bw-active' : ''}`}
          >
            {'{Road Safety & Compliance}'}
          </button>
        </div>
      </div>

      {/* PERMANENT IMPORTS */}
      {activeSection === 'permanent' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-black" />
              {'{Permanent Imports (Bringing a Car to Keep)}'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              The standard process for buying a vehicle from a foreign market (like Japan or the UK) and registering it locally in Zambia.
            </p>
            
            <div className="space-y-6 relative">
              <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-200 hidden sm:block"></div>

              {/* Step 1 */}
              <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 border-4 border-white shadow-sm z-10 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex-1 hover:border-slate-300 transition-colors">
                  <h4 className="text-md font-bold text-slate-800 mb-2">{'{1. Pre-Shipment Roadworthiness Inspection (RWI)}'}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    If sourcing from Japan, UK, UAE, Singapore, or South Africa, you <strong>must</strong> use an appointed agent (like JEVIC, ATJ, or EAA) to inspect the car before it ships. Expect to pay a baseline fee of ~$140 (or $200 for the UK).
                  </p>
                  <div className="bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-700">
                    <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Warning for Thailand & South Korea:</span> 
                    These countries have no appointed agents. The car will ship uninspected, and you'll automatically pay a "destination penalty" at the Zambian border (ZMW 2,500 - ZMW 3,500). Treat this as a fixed arrival cost.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 border-4 border-white shadow-sm z-10 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex-1 hover:border-slate-300 transition-colors">
                  <h4 className="text-md font-bold text-slate-800 mb-2">{'{2. The 5-Day ASYCUDA Pre-Clearance}'}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    You or your clearing agent must upload all shipping documents (Bill of Lading, Invoice, RWI Certificate) into the ZRA ASYCUDA World system <strong>at least 5 days before</strong> the car arrives at the Zambian border. Failure to do so results in an automatic ZMW 500 penalty.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 border-4 border-white shadow-sm z-10 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex-1 hover:border-slate-300 transition-colors">
                  <h4 className="text-md font-bold text-slate-800 mb-2">{'{3. The Border Clearances}'}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    At the border (Chirundu, Nakonde, Kazungula), your clearing agent finalizes the acquittal. You will pay:
                  </p>
                  <ul className="space-y-2 mb-3">
                    <li className="flex gap-2 text-sm text-slate-600 items-start">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span><strong>ZRA Import Duties:</strong> Vehicles under 2 years old pay Ad Valorem (percentage of CIF). Vehicles 2+ years old pay a flat Specific Duty based on engine cc and age.</span>
                    </li>
                    <li className="flex gap-2 text-sm text-slate-600 items-start">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Carbon Surtax:</strong> An initial importation environmental levy (ZMW 50k to 200k depending on engine cc).</span>
                    </li>
                    <li className="flex gap-2 text-sm text-slate-600 items-start">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Age Surtax:</strong> A 20% penalty if the vehicle is older than 5 years.</span>
                    </li>
                  </ul>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                    <strong>Note on SADC Imports (South Africa):</strong> If a vehicle was <em>manufactured</em> in South Africa (with a SADC Certificate of Origin), it qualifies for 0% Customs Duty. However, you still pay Excise Duty, VAT, and Carbon Surtax.
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 border-4 border-white shadow-sm z-10 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                  <CarFront className="w-5 h-5" />
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex-1 hover:border-slate-300 transition-colors">
                  <h4 className="text-md font-bold text-slate-800 mb-2">{'{4. RTSA Naturalization}'}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    After paying the border duties, ZRA issues a Customs Clearance Certificate. Now, you must make it legally Zambian:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                    <div className="bg-white p-2 rounded border border-slate-200"><strong>Interpol Clearance:</strong> Verifies it's not stolen (ZMW 200)</div>
                    <div className="bg-white p-2 rounded border border-slate-200"><strong>RTSA Physical Exam:</strong> Identity check (ZMW 64)</div>
                    <div className="bg-white p-2 rounded border border-slate-200"><strong>White Book:</strong> Official registration (ZMW 238)</div>
                    <div className="bg-white p-2 rounded border border-slate-200"><strong>Number Plates & Road Tax:</strong> (ZMW 388+ and weight-based annual tax)</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TEMPORARY IMPORTS (IBDF) */}
      {activeSection === 'temporary' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Map className="w-5 h-5 text-black" />
              {'{Temporary Imports (Tourists & Transit)}'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              For foreign-registered vehicles entering Zambia for holidays or transiting to third-party countries. Governed by the Integrated Border Declaration Form (IBDF).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1">{'{The IBDF Process}'}</h4>
                  <p className="text-sm text-slate-600">
                    The ASYCUDAWorld IBDF consolidates passenger details, vehicle particulars, and cash declarations. It grants you total conditional relief—meaning you don't pay the heavy import duties.
                  </p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1">{'{Carnet de Passages (CPD)}'}</h4>
                  <p className="text-sm text-slate-600">
                    If you hold an international Carnet, ZRA will stamp it instead of issuing an IBDF. A Carnet can allow your vehicle to stay for up to one year before requiring re-export.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1">{'{Mandatory Documents}'}</h4>
                  <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1 mt-2">
                    <li>Original Vehicle Registration Book (Logbook).</li>
                    <li>Police Clearance Certificate (Interpol) to prove it isn't stolen.</li>
                    <li>If you aren't the owner: A certified police affidavit or bank authorization letter explicitly granting permission to cross borders.</li>
                    <li>Valid Passport & International Driving Permit (IDP).</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-300">
                  <h4 className="font-bold text-black mb-1 flex items-center gap-1"><BadgeAlert className="w-4 h-4"/> {'{Duration & Extensions}'}</h4>
                  <p className="text-sm text-slate-700">
                    You typically get a free <strong>30-day permit</strong> synchronized with your tourist visa. You can extend it up to 90 days maximum by visiting a Customs Office <em>before</em> it expires. 
                  </p>
                </div>

                <div className="bg-slate-100 rounded-xl p-4 border border-black">
                  <h4 className="font-bold text-black mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> {'{The Draconian Penalties}'}</h4>
                  <p className="text-sm text-slate-700 mb-2">
                    Do not overstay. Do not lend, rent, or sell the car locally.
                  </p>
                  <ul className="text-sm text-slate-700 list-disc pl-4 space-y-1">
                    <li>Late exit penalty: <strong>K900 per day</strong>.</li>
                    <li>If you overstay by more than 10 days, the vehicle is subject to <strong>immediate asset forfeiture (seizure)</strong> by the State.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMMERCIAL TIP */}
      {activeSection === 'commercial' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-black" />
              {'{Corporate & Commercial TIP (Form TIP 0001)}'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              For corporate entities, contractors, and expatriates needing to keep a foreign-registered vehicle in Zambia for extended periods without permanently importing it.
            </p>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
              <h4 className="font-bold text-slate-800 mb-2">{'{The Procedure}'}</h4>
              <p className="text-sm text-slate-600 mb-3">
                You must apply using <strong>Form TIP 0001</strong> at least 5 days before the intended date of arrival. You must provide physical addresses, the exact reason for the temporary import, lease agreements (if hired), and vehicle identification.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Max Duration</span>
                  <span className="text-sm text-slate-700">Initial max is 12 months. Can be extended via written request to the Commissioner General for another 12 months (absolute ceiling: 24 months).</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Tax Liability</span>
                  <span className="text-sm text-slate-700">Vehicles on commercial hire/lease face partial conditional relief based on depreciated value over a 5-year lifespan. Security bonds may be required.</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 border border-black rounded-xl p-4">
              <h4 className="font-bold text-black mb-1 flex items-center gap-1"><BadgeAlert className="w-4 h-4"/> {'{Corporate Overstay Penalties}'}</h4>
              <p className="text-sm text-slate-700">
                Any corporate goods or vehicles remaining in Zambia beyond the authorized TIP window immediately face full import duties, plus a fine of 3,000 fee units per day (approx <strong>K1,200 per day</strong>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ROAD SAFETY & COMPLIANCE */}
      {activeSection === 'safety' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-black" />
              {'{Road Safety, Tolls & Financial Architecture}'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              Foreign-registered vehicles are heavily scrutinized at police checkpoints, toll plazas, and mobile roadblocks. Keep these strictly in order.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /> {'{Mandatory Insurance}'}</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    Third-party insurance is legally required. You have two options:
                  </p>
                  <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                    <li><strong>COMESA Yellow Card:</strong> The smartest option. A regional insurance scheme that covers you across participating countries (including emergency medical). Highly recommended.</li>
                    <li><strong>Local Border Insurance:</strong> Bought from brokers at the border (approx $30 for 30 days). The physical disk <em>must</em> be displayed on your passenger-side windshield at all times.</li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2">{'{Carbon Surtax (Transits & Visitors)}'}</h4>
                  <p className="text-sm text-slate-600">
                    Visiting vehicles pay a prorated annual Carbon Emission Surtax based on engine size (ranges from K123 for small cars up to K484 for engines over 3,000cc). Make sure to pay this at the border.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2">{'{Physical Safety Gear (Highway Code)}'}</h4>
                  <p className="text-sm text-slate-600 mb-2">Failing to have these will result in immediate roadside fines:</p>
                  <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                    <li><strong>Reflective Tapes (ZS 266 Standard):</strong> Two small white rectangular strips on the extreme left & right front bumper. Two red square strips on the outer rear bumper.</li>
                    <li><strong>Warning Triangles:</strong> Must carry two red warning triangles constructed with a sturdy <em>metal</em> base (not plastic).</li>
                    <li><strong>Fire Extinguisher:</strong> Mandatory if you are carrying auxiliary fuel in external jerry cans.</li>
                    <li><strong>T-Signs:</strong> If towing a trailer, you need a white and red "T-sign" mounted on the front and rear right-hand sides of the trailer.</li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2">{'{National Tolls & Council Levies}'}</h4>
                  <p className="text-sm text-slate-600">
                    Most private foreign vehicles pay a border Road Access Fee (approx $30). Commercial and transit heavy rigs pay point-of-use tolls per plaza (can be massive). Also expect local municipal district councils to charge minor environmental levies (e.g., USD 20) right after you exit the border zone.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
