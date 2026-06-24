# ZRA Vehicle Tariff Estimator 🇿🇲🚙

A modern, highly-responsive web application designed to help Zambian vehicle importers estimate their customs duties, taxes, and surcharges. The platform is built around the latest Zambia Revenue Authority (ZRA) schedules, including the 2025 Third Schedule rules for hybrids and standard ICE formulas.

## ✨ Features

- **AI Spec Resolver:** Powered by DeepSeek, users can simply type local JDM nicknames or engine codes (e.g., *"Vitz 1KR"*, *"Allion 1NZ"*, *"Aqua hybrid"*) to automatically resolve vehicle specifications and pre-fill the duty calculator.
- **2025 ZRA Duty Engine:** Fully compliant with the latest ZRA routing — handles Ad Valorem (CIF) calculations, Specific Duties based on age/engine capacity, and the special Third Schedule rates for hybrid and EV imports.
- **Smart 4-Stage Funnel:** A fluid, step-by-step calculator wizard that dynamically adjusts its questions based on the vehicle category and high-performance gatekeeper checks.
- **Live "Budget Hero" Summary:** Real-time calculation banner tracking CIF, specific duty, VAT, excise duty, and carbon tax breakdowns as you type.
- **Vehicle Watchlist:** Save your calculations to a local-storage-powered watchlist to compare different vehicles before making a purchase decision.
- **Clearing Agents Directory:** An easily accessible directory of registered clearing agents for professional assistance.

## 🛠 Tech Stack

- **Framework:** [React](https://reactjs.org/) & [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **AI Integration:** [DeepSeek API](https://platform.deepseek.com/)

## 🚀 Running Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/t3chpirat3/ZRA-Vehicle-Tariff-Estimator.git
   cd ZRA-Vehicle-Tariff-Estimator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   The AI Spec Resolver requires a DeepSeek API key to function. 
   Copy the example environment file and add your key:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and replace the placeholder with your actual DeepSeek API key:
   ```env
   VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000` (or another port specified by Vite).

## 📄 Legal & Privacy
This application is an independent project and is **not affiliated with or endorsed by the Zambia Revenue Authority (ZRA)**. All calculations are estimates intended for informational purposes only. Official assessments can only be provided by ZRA or a licensed clearing agent.

- No tracking cookies are used; the Vehicle Watchlist operates purely on your browser's local storage.
- Anonymous traffic analytics are handled securely via Vercel Web Analytics.

---
*Created independently by [t3chpirat3](https://shadreck.carrd.co/).*
