"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTrip } from "@/actions/trip.actions";
import { generatePackingList } from "@/utils/packingGenerator";
import type { TransportMode } from "@/types";

const TRIP_TYPES = [
  { value: "leisure", label: "Leisure", icon: "🌴" },
  { value: "beach", label: "Beach", icon: "🏖️" },
  { value: "hiking", label: "Hiking", icon: "🏕️" },
  { value: "city", label: "City Break", icon: "🏙️" },
  { value: "skiing", label: "Ski", icon: "⛷️" },
  { value: "business", label: "Business", icon: "💼" },
];

const TRANSPORT_MODES: {
  value: TransportMode;
  label: string;
  icon: string;
  hint: string;
}[] = [
  {
    value: "flight",
    label: "Flight",
    icon: "✈️",
    hint: "Adds TSA, carry-on & comfort items",
  },
  {
    value: "car",
    label: "Road Trip",
    icon: "🚗",
    hint: "Adds road trip & emergency items",
  },
  {
    value: "train",
    label: "Train",
    icon: "🚆",
    hint: "Adds rail pass & comfort items",
  },
  {
    value: "cruise",
    label: "Cruise",
    icon: "🛳️",
    hint: "Adds seasickness, formal & port items",
  },
];

const COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Japan",
  "China",
  "Australia",
  "New Zealand",
  "Brazil",
  "Argentina",
  "India",
  "South Korea",
  "Thailand",
  "Vietnam",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Portugal",
  "Greece",
  "Turkey",
  "Egypt",
  "South Africa",
  "Kenya",
  "Morocco",
  "United Arab Emirates",
  "Israel",
  "Russia",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Norway",
  "Sweden",
  "Denmark",
  "Finland",
  "Iceland",
  "Ireland",
  "Croatia",
  "Chile",
  "Peru",
  "Colombia",
  "Costa Rica",
].sort();

function getDurationDays(start: string, end: string): number {
  if (!start || !end) return 5;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function getUpcomingWeekend() {
  const d = new Date();
  // 5 is Friday
  const daysUntilFriday = (5 + 7 - d.getDay()) % 7 || 7;
  const friday = new Date(d.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
  const sunday = new Date(friday.getTime() + 2 * 24 * 60 * 60 * 1000);

  return {
    start: friday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    country: "",
    tripType: "leisure",
    transportMode: null as TransportMode | null,
    startDate: getUpcomingWeekend().start,
    endDate: getUpcomingWeekend().end,
    generateSuggestions: true,
  });
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryInputRef = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node) &&
        !countryInputRef.current?.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country: string) => {
    setFormData({ ...formData, country });
    setCountrySearch("");
    setShowCountryDropdown(false);
  };

  const handleTransportToggle = (mode: TransportMode) => {
    setFormData((prev) => ({
      ...prev,
      transportMode: prev.transportMode === mode ? null : mode,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fullDestination = formData.country
      ? `${formData.destination}, ${formData.country}`
      : formData.destination;

    const finalName = formData.name.trim() || `Trip to ${formData.destination}`;
    const result = await createTrip({
      name: finalName,
      destination: fullDestination || "",
      tripType: formData.tripType,
      transportMode: formData.transportMode,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      generateSuggestions: formData.generateSuggestions,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.tripId) {
      router.push(`/trip/${result.tripId}`);
    }
  };

  const duration = getDurationDays(formData.startDate, formData.endDate);
  const templateCategories = formData.generateSuggestions
    ? generatePackingList(
        formData.tripType as
          | "leisure"
          | "business"
          | "beach"
          | "hiking"
          | "city"
          | "skiing",
        duration,
        formData.transportMode,
      )
    : [];
  const totalItems = templateCategories.reduce(
    (sum, c) => sum + c.items.length,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Plan a New Trip
          </h1>
          <p className="text-gray-500 mt-2">
            Tell us about your trip and we&apos;ll create a smart packing list
            for you.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Form ── */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2 flex-1 bg-blue-600 rounded-full" />
                  <div className="h-2 flex-1 bg-gray-200 rounded-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Where to? *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paris, France or Aspen, CO"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={
                    !formData.destination ||
                    !formData.startDate ||
                    !formData.endDate
                  }
                  className="w-full py-4 mt-8 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2 flex-1 bg-gray-200 rounded-full" />
                  <div className="h-2 flex-1 bg-blue-600 rounded-full" />
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
                >
                  ← Back
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Trip Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {TRIP_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, tripType: t.value })
                        }
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                          formData.tripType === t.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-2xl mb-1">{t.icon}</span>
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template toggle */}
                <div
                  onClick={() =>
                    setFormData({
                      ...formData,
                      generateSuggestions: !formData.generateSuggestions,
                    })
                  }
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.generateSuggestions
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${formData.generateSuggestions ? "text-blue-800" : "text-gray-700"}`}
                    >
                      ✨ Start with a template
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${formData.generateSuggestions ? "text-blue-600" : "text-gray-400"}`}
                    >
                      Pre-fill a smart packing list based on your trip type
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.generateSuggestions
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.generateSuggestions && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading
                    ? "Creating Trip…"
                    : formData.generateSuggestions
                      ? "Create Trip & Generate List"
                      : "Create Trip"}
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Add Advanced Details (Optional)
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
                >
                  ← Back
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Summer in Paris"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country (Optional)
                  </label>
                  <input
                    ref={countryInputRef}
                    type="text"
                    placeholder="Type to search..."
                    value={
                      showCountryDropdown ? countrySearch : formData.country
                    }
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setShowCountryDropdown(true);
                    }}
                    onFocus={() => setShowCountryDropdown(true)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-[38px] text-gray-400 pointer-events-none">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {showCountryDropdown && filteredCountries.length > 0 && (
                    <div
                      ref={countryDropdownRef}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                      {filteredCountries.map((country) => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => handleCountrySelect(country)}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <span
                            className={
                              formData.country === country
                                ? "font-semibold text-blue-600"
                                : "text-gray-700"
                            }
                          >
                            {country}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      How are you getting there?
                    </label>
                    {formData.transportMode && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, transportMode: null })
                        }
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TRANSPORT_MODES.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => handleTransportToggle(m.value)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                          formData.transportMode === m.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">{m.icon}</span>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              formData.transportMode === m.value
                                ? "text-indigo-700"
                                : "text-gray-700"
                            }`}
                          >
                            {m.label}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {m.hint}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-8 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading
                    ? "Creating Trip…"
                    : formData.generateSuggestions
                      ? "Create Trip & Generate List"
                      : "Create Trip"}
                </button>
              </>
            )}
          </form>

          {/* ── Template Preview Panel ── */}
          {step >= 2 && (
            <div className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sticky top-8">
                {formData.generateSuggestions ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Template Preview
                      </h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {totalItems} items
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      {
                        TRIP_TYPES.find((t) => t.value === formData.tripType)
                          ?.icon
                      }{" "}
                      {
                        TRIP_TYPES.find((t) => t.value === formData.tripType)
                          ?.label
                      }
                      {formData.transportMode && (
                        <>
                          {" "}
                          ·{" "}
                          {
                            TRANSPORT_MODES.find(
                              (m) => m.value === formData.transportMode,
                            )?.icon
                          }{" "}
                          {
                            TRANSPORT_MODES.find(
                              (m) => m.value === formData.transportMode,
                            )?.label
                          }
                        </>
                      )}
                      {" · "}
                      {duration} day{duration !== 1 ? "s" : ""}
                    </p>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {templateCategories.map((cat) => (
                        <div key={cat.name}>
                          <p
                            className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                              cat.name.includes("Essentials") &&
                              formData.transportMode
                                ? "text-indigo-500"
                                : "text-gray-500"
                            }`}
                          >
                            {cat.name}
                          </p>
                          <div className="space-y-1">
                            {cat.items.map((item) => (
                              <div
                                key={item}
                                className="flex items-center gap-2"
                              >
                                <div className="w-3.5 h-3.5 rounded border border-gray-200 flex-shrink-0" />
                                <span className="text-xs text-gray-600">
                                  {item}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100">
                      You can add, remove, or edit any item after creating the
                      trip.
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-3xl mb-3">📝</p>
                    <p className="text-sm font-medium text-gray-700">
                      Starting blank
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      You&apos;ll build your packing list from scratch.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
