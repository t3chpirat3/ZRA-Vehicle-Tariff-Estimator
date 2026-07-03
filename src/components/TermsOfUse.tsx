import React from 'react';
import { X } from 'lucide-react';

interface TermsOfUseProps {
  onClose?: () => void;
}

export default function TermsOfUse({ onClose }: TermsOfUseProps) {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-10 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-2xl sm:text-3xl font-black font-display text-[color:var(--text)] tracking-tight mb-2 pr-8">
          {'Terms of Use'}
        </h2>
        <p className="text-sm text-slate-500 font-medium mb-8">
          {'Effective Date: 2nd July, 2026'}
        </p>

        <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600 leading-relaxed space-y-6">
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'1. Acceptance of Terms'}</h3>
            <p>
              By accessing and using Duty Boss (the Zambia Vehicle Tariff Estimator, hereafter "the Platform"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Platform. We provide this service as a public utility for informational purposes regarding Zambian vehicle import logistics.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'2. Disclaimer of Accuracy (Calculations are Estimates)'}</h3>
            <p>
              The core function of the Platform is to provide estimated customs duties and taxes based on the Zambia Revenue Authority (ZRA) specific duty matrices and standard ad valorem formulas.
            </p>
            <p className="mt-2 text-slate-800 font-semibold">You explicitly acknowledge and agree that:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>AI Spec Resolver Limitations:</strong> The "Spec Resolver" utilizes artificial intelligence to interpret vehicle descriptions. AI models are probabilistic and may return inaccurate or hallucinatory vehicle specifications (such as incorrect engine capacities or body types). You are solely responsible for verifying the resolved specifications before relying on the subsequent duty estimates.
              </li>
              <li>
                <strong>All calculations are estimates.</strong> The figures provided by the Platform are not final tax assessments.
              </li>
              <li>
                <strong>Exchange rate volatility</strong> and compounding tax rules may cause final figures to fluctuate.
              </li>
              <li>
                <strong>ZRA has the final authority.</strong> The exact and final duties, taxes, and surcharges payable can only be determined by a certified Zambia Revenue Authority customs officer at the physical point of entry or via an official ASYCUDA assessment.
              </li>
            </ul>
            <p className="mt-2">
              You are strongly advised to consult directly with ZRA or a licensed clearing agent before committing to any vehicle purchase or importation.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'3. Local Data Storage and "Vehicle Watchlist"'}</h3>
            <p>
              The Platform features a "Vehicle Watchlist" and other temporary calculation-saving tools designed to enhance user experience.
            </p>
            <p className="mt-2 text-slate-800 font-semibold">By using these features, you acknowledge and agree that:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Client-Side Storage:</strong> The Platform utilizes your web browser's local storage (and/or session storage) to save this data. We do not transmit, sync, back up, or store this data on our external servers.
              </li>
              <li>
                <strong>Risk of Data Loss:</strong> Because this data lives exclusively on your personal device, it is inherently volatile. Your saved vehicles, calculations, and preferences will be permanently lost if you clear your browser's cache, delete your browsing history, use "Incognito" or "Private Browsing" modes, or if your browser automatically clears local storage based on your device settings.
              </li>
              <li>
                <strong>No Liability for Lost Data:</strong> We accept no responsibility or liability for the loss, corruption, or accidental deletion of any data saved within the Vehicle Watchlist or any other locally stored features. It is your sole responsibility to separately record or document any calculations or vehicle models you wish to retain permanently.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'4. Third-Party Information & Clearing Agents'}</h3>
            <p>
              The Platform includes a directory or list of "Registered Clearing Agents."
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Sourced Information:</strong> This information is sourced from publicly available ZRA databases.
              </li>
              <li>
                <strong>No Endorsement:</strong> The inclusion of any clearing agent on this Platform does not constitute an endorsement, recommendation, or guarantee of their services by us.
              </li>
              <li>
                <strong>No Liability for Inaccuracies:</strong> We do not guarantee the current validity, licensing status, or operational integrity of any agent listed. We are not liable for any inaccuracies in the provided contact details, nor are we responsible for any financial loss, delays, or damages incurred as a result of your engagement with any third-party clearing agent.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'5. No Professional, Financial, or Legal Advice'}</h3>
            <p>
              The content and outputs generated by the Platform do not constitute professional tax, financial, or legal advice. The Platform is a self-help tool designed to assist users in understanding potential landed costs. Users assume full responsibility for any financial decisions made based on the Platform's outputs.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'6. Limitation of Liability'}</h3>
            <p>
              To the maximum extent permitted by Zambian law, the creators, operators, and affiliates of the Platform shall not be held liable for any direct, indirect, incidental, consequential, or punitive damages arising from:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Your reliance on the estimated calculations.</li>
              <li>Errors, omissions, or delays in the provided ZRA tax matrices.</li>
              <li>Business interruptions, loss of profits, or unforeseen expenses incurred during the vehicle importation process.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'7. Modifications to the Service'}</h3>
            <p>
              We reserve the right to modify, update, or discontinue the Platform (or any part thereof) at any time without prior notice. We do not guarantee that the Platform will always reflect the most immediate, real-time updates to ZRA policy changes.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'8. Governing Law'}</h3>
            <p>
              These Terms of Use shall be governed by and construed in accordance with the laws of the Republic of Zambia.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
