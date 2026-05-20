"use client";

import { useState } from "react";

interface Scent {
  name: string;
  emoji: string;
  description: string;
  triggers: string[];
}

const SCENTS: Record<string, Scent> = {
  oud: {
    name: "Oud Royale",
    emoji: "👑",
    description:
      "Deep, mysterious, and unmistakably luxe. A bold statement for those who command the room.",
    triggers: [
      "Mysterious & Bold",
      "Nights out",
      "Luxe & Elevated",
      "Oud & Musk",
      "Power & Confidence",
    ],
  },
  citrus: {
    name: "Citrus Bloom",
    emoji: "🌸",
    description:
      "Fresh, clean, and alive. Perfect for everyday wear with an effortlessly modern vibe.",
    triggers: [
      "Fresh & Clean",
      "Daily (work/errands)",
      "Minimal & Modern",
      "Citrus & Fresh",
      "Freedom & Energy",
    ],
  },
  rose: {
    name: "Rose Amber",
    emoji: "🌹",
    description:
      "Warm, romantic, and utterly captivating. For those who want to be unforgettable.",
    triggers: [
      "Warm & Romantic",
      "Special occasions",
      "Expressive & Artsy",
      "Floral & Sweet",
      "Warmth & Love",
    ],
  },
  noir: {
    name: "Noir Smoke",
    emoji: "🌙",
    description:
      "Earthy, grounding, and timeless. A classic choice with quiet confidence.",
    triggers: [
      "Earthy & Grounded",
      "All day every day",
      "Classic & Timeless",
      "Woody & Smoky",
      "Calmness & Mystery",
    ],
  },
};

const QUESTIONS = [
  {
    id: "q1",
    question: "What's your vibe?",
    options: ["Mysterious & Bold", "Fresh & Clean", "Warm & Romantic", "Earthy & Grounded"],
  },
  {
    id: "q2",
    question: "When do you wear fragrance most?",
    options: ["Daily (work/errands)", "Nights out", "Special occasions", "All day every day"],
  },
  {
    id: "q3",
    question: "Which word describes your style?",
    options: ["Luxe & Elevated", "Minimal & Modern", "Expressive & Artsy", "Classic & Timeless"],
  },
  {
    id: "q4",
    question: "What type of scents do you naturally gravitate to?",
    options: ["Oud & Musk", "Floral & Sweet", "Citrus & Fresh", "Woody & Smoky"],
  },
  {
    id: "q5",
    question: "What feeling do you want your scent to give off?",
    options: ["Power & Confidence", "Calmness & Mystery", "Warmth & Love", "Freedom & Energy"],
  },
];

function calculateMatch(answers: Record<string, string>): string {
  const scores: Record<string, number> = {
    oud: 0,
    citrus: 0,
    rose: 0,
    noir: 0,
  };

  Object.values(SCENTS).forEach((scent) => {
    const scentKey = Object.keys(SCENTS).find(
      (k) => SCENTS[k].name === scent.name
    ) as string;
    scent.triggers.forEach((trigger) => {
      if (Object.values(answers).includes(trigger)) {
        scores[scentKey]++;
      }
    });
  });

  const winner = Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  return winner;
}

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scentMatch = calculateMatch(answers);
  const scentKey = Object.keys(SCENTS).find(
    (k) => SCENTS[k].name === Object.values(SCENTS).find((s) => {
      const sk = Object.keys(SCENTS).find((key) => SCENTS[key].name === s.name);
      return sk === scentMatch;
    })?.name
  ) as string;

  async function handleLeadSubmit() {
    if (!email || !name) {
      setError("Email and name are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: name,
          phone: phone || undefined,
          source: "quiz-perfume",
          quiz_answers: answers,
          quiz_score: Object.values(answers).length,
          quiz_progress: "5/5",
          tags: ["quiz", "perfume", scentMatch],
        }),
      });

      if (response.ok) {
        setStep(7); // Move to results
      } else {
        setError("Failed to submit. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Step 0: Intro */}
      {step === 0 && (
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mb-4 text-5xl">✨</div>
            <h1 className="mb-3 text-3xl font-bold text-slate-900">
              Find Your Scent
            </h1>
            <p className="text-slate-600">
              Discover which perfume oil is perfectly matched to your personality
              and style in just 5 minutes.
            </p>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-white hover:from-amber-600 hover:to-amber-700"
          >
            Start Quiz →
          </button>
        </div>
      )}

      {/* Steps 1-5: Questions */}
      {step >= 1 && step <= 5 && (
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium text-slate-600">
                Question {step} of 5
              </span>
              <span className="text-sm font-medium text-amber-600">
                {Math.round((step / 5) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            {QUESTIONS[step - 1].question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {QUESTIONS[step - 1].options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setAnswers({
                    ...answers,
                    [QUESTIONS[step - 1].id]: option,
                  });
                  if (step < 5) {
                    setStep(step + 1);
                  } else {
                    setStep(6); // Go to lead capture
                  }
                }}
                className={`w-full rounded-lg border-2 p-4 text-left font-medium transition-all ${
                  answers[QUESTIONS[step - 1].id] === option
                    ? "border-amber-500 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Back button */}
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-6 text-sm text-slate-600 hover:text-slate-900"
            >
              ← Back
            </button>
          )}
        </div>
      )}

      {/* Step 6: Lead Capture */}
      {step === 6 && (
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            Almost there!
          </h2>
          <p className="mb-6 text-slate-600">
            Tell us a bit about you so we can send your personalized scent recommendation.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                First Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleLeadSubmit}
              disabled={loading || !email || !name}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
            >
              {loading ? "Calculating your match..." : "See My Scent Match →"}
            </button>
          </div>

          <button
            onClick={() => setStep(5)}
            className="mt-4 w-full text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 7: Results */}
      {step === 7 && (
        <div className="w-full max-w-lg space-y-6">
          {/* Scent Match Card */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mb-3 text-6xl">{SCENTS[scentMatch].emoji}</div>
              <h1 className="mb-2 text-3xl font-bold">
                {SCENTS[scentMatch].name}
              </h1>
            </div>

            <p className="mb-6 text-center text-slate-300">
              {SCENTS[scentMatch].description}
            </p>

            <button
              onClick={() => alert("Coming soon! Shop your scent.")}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-white hover:from-amber-600 hover:to-amber-700"
            >
              Shop {SCENTS[scentMatch].name} →
            </button>
          </div>

          {/* Instagram DM CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-900 to-pink-900 p-8 text-center text-white shadow-2xl">
            <div className="mb-3 text-3xl">📱</div>
            <h3 className="mb-2 text-xl font-bold">
              Want a personal recommendation?
            </h3>
            <p className="mb-6 text-slate-300">
              DM @its.danielphilip on Instagram with your scent match to get a
              personalized offer
            </p>
            <a
              href="https://instagram.com/its.danielphilip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-white px-6 py-3 font-bold text-pink-900 hover:bg-slate-100"
            >
              Message on Instagram →
            </a>
          </div>

          {/* Secondary CTA */}
          <div className="text-center text-sm text-slate-300">
            <p>Check your email for a special welcome offer</p>
          </div>
        </div>
      )}
    </div>
  );
}
