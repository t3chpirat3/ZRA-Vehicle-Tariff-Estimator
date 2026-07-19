import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: "How much is ZRA duty on a car in Zambia?",
    answer: "It depends heavily on the vehicle's age, engine capacity (CC), and body type. Vehicles under 2 years old are taxed based on an ad-valorem (percentage) rate of the CIF value. Vehicles 2 years and older are taxed using a fixed specific duty rate based on their engine size and body type. Use our calculator above to get an exact estimate based on the latest ZRA tariff schedules."
  },
  {
    question: "What is CIF and why is it important?",
    answer: "CIF stands for Cost, Insurance, and Freight. It represents the total value of the vehicle including its purchase price, marine insurance, and transport costs to the African port of discharge (like Dar es Salaam or Durban). For vehicles under 2 years old, ZRA calculates Customs Duty, Excise Duty, and VAT as a percentage of this total CIF value."
  },
  {
    question: "Do I need a pre-shipment inspection (JEVIC/ATJ)?",
    answer: "Yes. Under Zambian Standard ZS 560, all used vehicles imported from Japan, UK, UAE, Singapore, or South Africa must undergo a mandatory Roadworthiness Inspection (RWI) which includes biosecurity screening. Fees are typically $140 ($200 for the UK). If you deliberately skip this inspection in an accredited country (like Japan), you will face a massive punitive fine equal to 15% of the vehicle's entire CIF value. For unlisted countries (like Thailand or South Korea), the penalty is a fixed statutory fee ranging from ZMW 2,500 to ZMW 3,500."
  },
  {
    question: "Can I import a Left-Hand Drive (LHD) vehicle?",
    answer: "No. Zambian law strictly prohibits the importation of Left-Hand Drive (LHD) vehicles for general private or commercial use. Exceptions are extremely rare and granted only for specialized utility equipment (like fire engines or ambulances) or via ministerial dispensations. Beware of LHD-to-RHD conversions in hubs like Dubai; if deemed substandard by inspectors, the vehicle will be prohibited from export to Zambia."
  },
  {
    question: "Which countries are the best for sourcing used vehicles?",
    answer: "Japan is the dominant source due to rigorous local inspections (Shaken) and high volume of RHD units. The UK is preferred for premium luxury SUVs. Singapore offers high-spec luxury cars due to their local COE system. South Africa is the primary source for SADC-manufactured utility vehicles (like the Hilux or Ranger). A South African manufactured vehicle (minimum 35% local value addition) may qualify for a SADC Certificate of Origin, which drops Customs Duty to 0%. However, you are still fully liable for Excise Duty, 16% VAT, and the Carbon Emission Surtax."
  },
  {
    question: "Are there any tax incentives for electric vehicles or hybrids?",
    answer: "Yes! To encourage green energy, the ZRA provides 0% Customs Duty on battery electric passenger cars and trucks. Hybrid vehicles also benefit from a reduced Excise Duty rate (15% down from 30%)."
  },
  {
    question: "What is the ZRA duty fee schedule for vehicles?",
    answer: "As of the latest updates, ZRA uses a specific duty schedule for most used vehicle imports. This schedule breaks down taxes by cylinder capacity (e.g., 1000cc - 1500cc, 1500cc - 2500cc). High-performance vehicles and very new vehicles (0-2 years) follow a different percentage-based calculation."
  },
  {
    question: "How do I calculate ZRA import fees and taxes?",
    answer: "To manually calculate ZRA import fees, you need to determine the Customs Duty, Excise Duty, Value Added Tax (VAT), and Carbon Surtax based on the vehicle's HS Code. The easiest way is to use Duty Boss: simply enter the vehicle details and we will instantly calculate all applicable taxes according to the official ZRA tables."
  },
  {
    question: "What is the 5-day ASYCUDA pre-clearance rule?",
    answer: "Your clearing agent must submit an electronic customs declaration via the ASYCUDA World system at least 5 days before the vehicle physically arrives at the Zambian border. If this advance window is missed, the ZRA system automatically triggers a non-negotiable ZMW 500.10 fine, and the vehicle will be stuck accruing daily storage fees until rectified."
  },
  {
    question: "What is the 'Performance Tax' trap?",
    answer: "Normally, vehicles 2 years and older are taxed using a flat Specific Duty rate. However, if you import a high-performance vehicle (like a Mercedes C63 or BMW M5) that exceeds BOTH 3800cc and 450hp, ZRA ignores the age and charges you the massive Ad-Valorem (percentage) duty based on the CIF value instead. Many buyers find this out the hard way."
  },
  {
    question: "What is the Removal in Transit (RIT) procedure?",
    answer: "RIT allows you to defer paying import duties at the border and instead pay them when the vehicle reaches your destination city. The vehicle travels inland under your clearing agent's customs bond. Once you depart the border, you are legally required to report to a designated inland bonded warehouse within exactly 5 days to finalize clearance, otherwise massive fines are levied."
  },
  {
    question: "Is Duty Boss affiliated with the Zambia Revenue Authority (ZRA)?",
    answer: "No. Duty Boss is an independent, private tool built to help Zambians estimate vehicle import costs easily. We use the official publicly available ZRA tariff schedules to provide accurate estimates, but we are not affiliated with, endorsed by, or operated by the government."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-12 mb-8 border-t border-[color:var(--border)] pt-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-[color:var(--text)] mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`border rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? 'bg-[color:var(--surface)] border-[color:var(--primary-border)] shadow-sm' : 'bg-[color:var(--surface-soft)] border-[color:var(--border)] hover:border-[color:var(--border-strong)]'
                }`}
              >
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className={`text-sm font-extrabold ${isOpen ? 'text-[color:var(--primary-hover)]' : 'text-[color:var(--text)]'}`}>
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform text-[color:var(--text-muted)] ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-[color:var(--text-muted)] leading-relaxed font-medium">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
