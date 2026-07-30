import React, { useState, useEffect, useRef } from "react";
import {
  Search, ShieldAlert, LineChart, FileCheck,
  CarFront, MapPin, BadgeDollarSign,
  ChevronRight, ArrowLeft, BookOpen, Clock
} from "lucide-react";
import { MarkdownContent } from "./MarkdownContent";
import buyersGuideData from "../data/buyersGuideData.json";

// ── Category Definitions ─────────────────────────────────────────────────────
interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  indices: number[];
  desc: string;
  color: string;
}

const categories: Category[] = [
  {
    id: "marketplaces",
    label: "Marketplaces & Sourcing",
    icon: Search,
    indices: [0, 1, 2, 3, 18, 24, 28],
    desc: "Understand how platforms operate, where to buy, and the Japanese auction ecosystem.",
    color: "#6366f1",
  },
  {
    id: "financials",
    label: "Financials & Scams",
    icon: BadgeDollarSign,
    indices: [4, 5, 11, 15],
    desc: "Payment structures, escrow, insider tips, resolving fraud, and missing items.",
    color: "#10b981",
  },
  {
    id: "fraud",
    label: "Inspections & Fraud",
    icon: ShieldAlert,
    indices: [9, 10, 14, 12],
    desc: "Odometer verification, JEVIC/QISJ inspections, forged documents, and UI quirks.",
    color: "#f59e0b",
  },
  {
    id: "assessment",
    label: "Condition Assessment",
    icon: FileCheck,
    indices: [7, 8, 13, 16, 17],
    desc: "Reading auction sheets, forensic photo analysis, and source market specific conditions.",
    color: "#3b82f6",
  },
  {
    id: "performance",
    label: "Performance & Tuners",
    icon: LineChart,
    indices: [19, 20],
    desc: "Sourcing JDM legends, octane mismatch, and RTSA legal traps for off-road modifications.",
    color: "#ef4444",
  },
  {
    id: "regulations",
    label: "Regulations & Final Mile",
    icon: MapPin,
    indices: [21, 22, 23, 26, 27],
    desc: "Border impounds, transit logistics, LHD exemptions, fitness checklists, and the ultimate tyre guide.",
    color: "#8b5cf6",
  },
  {
    id: "mechanics",
    label: "Mechanics & Tech",
    icon: CarFront,
    indices: [25],
    desc: "Understanding engine displacement, range vs efficiency, turbos, and hybrids.",
    color: "#06b6d4",
  },
];

// ── Article Title Overrides ──────────────────────────────────────────────────
const articleTitleOverrides: Record<number, string> = {
  6:  "Editorial Note: Knowledge Base Continuation",
  11: "Recovering from Odometer Fraud: Legal Recourse",
  12: "Navigating Platform UIs: Avoiding Listing Traps",
  13: "Forensic Photo Analysis: Reading Between the Lines",
  14: "Digital Document Forgery: How to Detect It",
  16: "Source Market Conditions & Climate Risks",
  17: "Domestic Specs & Import Quirks by Market",
  18: "Accessing the Japanese Auction Market Directly",
  19: "Sourcing JDM Performance Legends",
  21: "Border Impounds: What to Do When Your Car Gets Seized",
  22: "Final Mile Logistical Blind Spots",
  24: "Import vs. Local Bonded Warehouse: The Dilemma",
};

function getArticleTitle(index: number): string {
  if (articleTitleOverrides[index]) return articleTitleOverrides[index];
  const raw = (buyersGuideData as string[])[index];
  if (!raw) return `Article ${index}`;
  const firstLine = raw.split("\n")[0].replace(/\r/g, "").trim();
  const cleaned = firstLine.replace(/^#+\s*/, "").trim();
  if (cleaned.length > 80) return cleaned.substring(0, 78) + "...";
  return cleaned;
}

function estimateReadTime(index: number): string {
  const raw = (buyersGuideData as string[])[index] || "";
  const words = raw.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 220));
  return `${mins} min read`;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function BuyersGuide() {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id);
  const [selectedArticleIndex, setSelectedArticleIndex] = useState<number | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"categories" | "articles" | "reader">("categories");
  const readerRef = useRef<HTMLDivElement>(null);

  const activeCategory = categories.find((c) => c.id === activeCategoryId)!;

  const categoryArticles = activeCategory.indices.filter(
    (i) => !!(buyersGuideData as string[])[i]
  );

  useEffect(() => {
    setSelectedArticleIndex(categoryArticles[0] ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryId]);

  useEffect(() => {
    readerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedArticleIndex]);

  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    setMobilePanel("articles");
  };

  const handleSelectArticle = (index: number) => {
    setSelectedArticleIndex(index);
    setMobilePanel("reader");
  };

  const selectedContent =
    selectedArticleIndex !== null
      ? (buyersGuideData as string[])[selectedArticleIndex]
      : null;

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-12">

      {/* Page Header */}
      <div className="mb-6 px-1">
        <h2 className="text-3xl font-black font-display text-[color:var(--text)] tracking-tight mb-2">
          The Importer's Knowledge Base
        </h2>
        <p className="text-[color:var(--text-muted)] text-sm leading-relaxed max-w-2xl">
          The definitive guide to sourcing, vetting, and securely acquiring vehicles from international
          markets. Browse by category, then pick an article — no endless scrolling required.
        </p>
      </div>

      {/* Three-Panel Shell */}
      <div
        className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl overflow-hidden shadow-sm flex"
        style={{ minHeight: "640px" }}
      >

        {/* Panel 1: Category Sidebar */}
        <aside
          className={`w-56 flex-shrink-0 border-r border-[color:var(--border)] bg-[color:var(--surface-soft)] flex-col ${
            mobilePanel !== "categories" ? "hidden md:flex" : "flex"
          } md:flex`}
          style={{ minHeight: "640px" }}
        >
          <div className="p-4 border-b border-[color:var(--border)]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-muted)]">
              Topics
            </span>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                    isActive
                      ? "bg-[color:var(--primary)] text-white shadow-sm"
                      : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--text)]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive ? "bg-white/20" : "bg-[color:var(--border)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${isActive ? "text-white" : ""}`}>
                      {cat.label}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isActive ? "text-white/70" : "text-[color:var(--text-muted)]"
                      }`}
                    >
                      {cat.indices.length} article{cat.indices.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                      isActive ? "translate-x-0.5 text-white/70" : "opacity-0 group-hover:opacity-50"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-[color:var(--border)]">
            <p className="text-[10px] text-[color:var(--text-muted)] text-center">
              {categories.reduce((s, c) => s + c.indices.length, 0)} articles &middot; {categories.length} topics
            </p>
          </div>
        </aside>

        {/* Panel 2: Article List */}
        <div
          className={`w-64 flex-shrink-0 border-r border-[color:var(--border)] flex-col ${
            mobilePanel === "articles" ? "flex" : "hidden md:flex"
          } md:flex`}
          style={{ minHeight: "640px" }}
        >
          {/* Header */}
          <div className="p-4 border-b border-[color:var(--border)] flex items-center gap-2">
            <button
              onClick={() => setMobilePanel("categories")}
              className="md:hidden p-1 -ml-1 rounded-lg hover:bg-[color:var(--border)] text-[color:var(--text-muted)] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: activeCategory.color + "22", color: activeCategory.color }}
            >
              <activeCategory.icon className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-[color:var(--text)] truncate flex-1">
              {activeCategory.label}
            </span>
          </div>
          {/* Category blurb */}
          <div className="px-4 py-3 bg-[color:var(--surface-soft)] border-b border-[color:var(--border)]">
            <p className="text-[11px] text-[color:var(--text-muted)] leading-relaxed">
              {activeCategory.desc}
            </p>
          </div>
          {/* Article list */}
          <nav className="flex-1 overflow-y-auto">
            {categoryArticles.map((articleIndex, pos) => {
              const isSelected = selectedArticleIndex === articleIndex;
              const title = getArticleTitle(articleIndex);
              const readTime = estimateReadTime(articleIndex);
              return (
                <button
                  key={articleIndex}
                  onClick={() => handleSelectArticle(articleIndex)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-[color:var(--border)] transition-all duration-150 group relative ${
                    isSelected
                      ? "bg-[color:var(--primary-soft)] border-l-2"
                      : "hover:bg-[color:var(--surface-soft)]"
                  }`}
                  style={isSelected ? { borderLeftColor: activeCategory.color } : {}}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black ${
                      isSelected
                        ? "text-white"
                        : "text-[color:var(--text-muted)] bg-[color:var(--border)]"
                    }`}
                    style={isSelected ? { backgroundColor: activeCategory.color } : {}}
                  >
                    {pos + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold leading-snug ${
                        isSelected ? "text-[color:var(--primary)]" : "text-[color:var(--text)]"
                      }`}
                    >
                      {title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 text-[color:var(--text-muted)]" />
                      <span className="text-[10px] text-[color:var(--text-muted)]">{readTime}</span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 flex-shrink-0 mt-1 transition-opacity ${
                      isSelected
                        ? "opacity-100 text-[color:var(--primary)]"
                        : "opacity-0 group-hover:opacity-40"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Panel 3: Article Reader */}
        <div
          className={`flex-1 min-w-0 flex-col ${
            mobilePanel === "reader" ? "flex" : "hidden md:flex"
          } md:flex`}
          style={{ minHeight: "640px" }}
        >
          {selectedContent ? (
            <>
              {/* Reader top bar */}
              <div className="px-6 py-4 border-b border-[color:var(--border)] flex items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobilePanel("articles")}
                    className="md:hidden p-1 -ml-1 rounded-lg hover:bg-[color:var(--border)] text-[color:var(--text-muted)] transition flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <BookOpen className="w-4 h-4 text-[color:var(--text-muted)] flex-shrink-0" />
                  <span className="text-xs font-bold text-[color:var(--text)] truncate">
                    {getArticleTitle(selectedArticleIndex!)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[color:var(--text-muted)] bg-[color:var(--surface-soft)] px-2.5 py-1 rounded-full border border-[color:var(--border)]">
                    <Clock className="w-3 h-3" />
                    {estimateReadTime(selectedArticleIndex!)}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: activeCategory.color + "22",
                      color: activeCategory.color,
                    }}
                  >
                    {activeCategory.label}
                  </span>
                </div>
              </div>

              {/* Prev / Next navigation strip */}
              {categoryArticles.length > 1 &&
                (() => {
                  const pos = categoryArticles.indexOf(selectedArticleIndex!);
                  const prevIdx = pos > 0 ? categoryArticles[pos - 1] : null;
                  const nextIdx = pos < categoryArticles.length - 1 ? categoryArticles[pos + 1] : null;
                  return (
                    <div className="px-6 py-2 border-b border-[color:var(--border)] flex items-center justify-between gap-4 bg-[color:var(--surface-soft)] flex-shrink-0">
                      {prevIdx !== null ? (
                        <button
                          onClick={() => handleSelectArticle(prevIdx)}
                          className="flex items-center gap-1.5 text-[11px] text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition group"
                        >
                          <ChevronRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                          <span className="truncate max-w-[140px]">{getArticleTitle(prevIdx)}</span>
                        </button>
                      ) : (
                        <span />
                      )}
                      <span className="text-[10px] text-[color:var(--text-muted)] flex-shrink-0 font-mono">
                        {pos + 1} / {categoryArticles.length}
                      </span>
                      {nextIdx !== null ? (
                        <button
                          onClick={() => handleSelectArticle(nextIdx)}
                          className="flex items-center gap-1.5 text-[11px] text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition group"
                        >
                          <span className="truncate max-w-[140px]">{getArticleTitle(nextIdx)}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  );
                })()}

              {/* Article body — this is the ONLY scroll container */}
              <div ref={readerRef} className="flex-1 overflow-y-auto">
                <div className="p-6 sm:p-8 max-w-3xl">
                  <div className="prose-styles">
                    <MarkdownContent content={selectedContent} />
                  </div>
                </div>

                {/* Up Next CTA at bottom of article */}
                {(() => {
                  const pos = categoryArticles.indexOf(selectedArticleIndex!);
                  const nextIdx =
                    pos < categoryArticles.length - 1 ? categoryArticles[pos + 1] : null;
                  if (!nextIdx) return null;
                  return (
                    <div className="mx-6 sm:mx-8 mb-8 p-4 border border-[color:var(--border)] rounded-xl bg-[color:var(--surface-soft)] flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-muted)] mb-1">
                          Up Next
                        </p>
                        <p className="text-sm font-semibold text-[color:var(--text)] truncate">
                          {getArticleTitle(nextIdx)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSelectArticle(nextIdx)}
                        className="bw-active flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 whitespace-nowrap"
                      >
                        Continue <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[color:var(--surface-soft)] border border-[color:var(--border)] flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-[color:var(--text-muted)]" />
              </div>
              <h3 className="font-bold text-[color:var(--text)] mb-2">Select an article</h3>
              <p className="text-sm text-[color:var(--text-muted)] max-w-xs">
                Choose a topic from the left, then pick an article from the list to start reading.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
