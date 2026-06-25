import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose?: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
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
          {'Privacy Policy'}
        </h2>
        <p className="text-sm text-slate-500 font-medium mb-8">
          {'Effective Date: 14th June, 2026'}
        </p>

        <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600 leading-relaxed space-y-6">
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'1. Introduction'}</h3>
            <p>
              Welcome to ZRA Vehicle Tariff Estimator. We respect your privacy and are committed to protecting it. This Privacy Policy explains how we handle your information when you visit and use our vehicle calculation and discovery platform.
            </p>
            <p className="mt-2">
              Because our platform is designed to be a quick, accessible utility, we adhere to a principle of minimal data collection: we do not require you to create an account, and we do not actively collect personal identifying information (such as your name, email address, or phone number).
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'2. Information We Collect'}</h3>
            <p>When you use our platform, the data involved falls into two specific categories:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Automatically Collected Analytics Data:</strong> To keep the site running smoothly and understand how it is being used, our hosting and analytics provider (Vercel) automatically collects basic technical data. This may include your IP address, browser type, device type, referring URLs, and general geographic region.
              </li>
              <li>
                <strong>Locally Stored Data (Vehicle Watchlist):</strong> If you use the "Vehicle Watchlist" feature to save specific models or calculations, that data is stored locally on your device (using your browser's local storage or session storage). This data is never transmitted to, stored on, or processed by our servers.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'3. How We Use This Information'}</h3>
            <p>We use the automatically collected analytics data exclusively for operational purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>To monitor website traffic and server performance.</li>
              <li>To identify and fix technical issues or bugs.</li>
              <li>To understand general user trends (e.g., which calculation tools or pages are visited most frequently) so we can improve the platform's user experience.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'4. Third-Party Services'}</h3>
            <p>We do not sell, rent, or trade any user data to third parties.</p>
            <p className="mt-2">
              We utilize Vercel Web Analytics to help us analyze website traffic. Vercel processes basic technical information (like IP addresses and referrer data) securely and in compliance with global privacy standards to provide us with aggregated, anonymized performance metrics.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'5. Cookies and Local Storage'}</h3>
            <p>Instead of using tracking cookies to monitor your behavior across the internet, we use your browser's local storage solely to provide core functionality:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>The Vehicle Watchlist:</strong> This feature relies entirely on local storage to remember your saved vehicles during and between sessions. Because this lives on your device, you have complete control over it. You can permanently delete this data at any time by clearing your browser's cache and local storage data.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'6. Data Security'}</h3>
            <p>
              Even though we do not collect personal profiles or payment information, we take standard security measures to protect the integrity of the site, including utilizing secure hosting environments and SSL encryption for all web traffic.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{"7. Children's Privacy"}</h3>
            <p>
              Our platform is built for users researching vehicle importation and is not directed at children under the age of 13. We do not knowingly collect any data from children.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'8. Changes to This Policy'}</h3>
            <p>
              We may update this Privacy Policy occasionally if we introduce new features or integrate different technical tools. If changes are made, we will update the "Effective Date" at the top of this page.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{'9. Contact Us'}</h3>
            <p>If you have any questions about this Privacy Policy or how our platform handles technical data, please contact us at:</p>
            <p className="mt-2">
              <strong>Email:</strong> <a href="mailto:t3chpirat3@zradutycalculator.xyz" className="text-[color:var(--primary-hover)] underline hover:no-underline font-medium">t3chpirat3@zradutycalculator.xyz</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
