"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Scent {
  name: string;
  description: string;
  triggers: string[];
}

const SCENTS: Record<string, Scent> = {
  oud: {
    name: "Oud Royale",
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
    question: "What&apos;s your vibe?",
    questionText: "What's your vibe?",
    options: [
      "Mysterious & Bold",
      "Fresh & Clean",
      "Warm & Romantic",
      "Earthy & Grounded",
    ],
  },
  {
    id: "q2",
    question: "When do you wear fragrance most?",
    questionText: "When do you wear fragrance most?",
    options: [
      "Daily (work/errands)",
      "Nights out",
      "Special occasions",
      "All day every day",
    ],
  },
  {
    id: "q3",
    question: "Which word describes your style?",
    questionText: "Which word describes your style?",
    options: [
      "Luxe & Elevated",
      "Minimal & Modern",
      "Expressive & Artsy",
      "Classic & Timeless",
    ],
  },
  {
    id: "q4",
    question: "What type of scents do you naturally gravitate to?",
    questionText: "What type of scents do you naturally gravitate to?",
    options: ["Oud & Musk", "Floral & Sweet", "Citrus & Fresh", "Woody & Smoky"],
  },
  {
    id: "q5",
    question: "What feeling do you want your scent to give off?",
    questionText: "What feeling do you want your scent to give off?",
    options: [
      "Power & Confidence",
      "Calmness & Mystery",
      "Warmth & Love",
      "Freedom & Energy",
    ],
  },
];

function calculateMatch(answers: Record<string, string>): string {
  const scores: Record<string, number> = { oud: 0, citrus: 0, rose: 0, noir: 0 };

  for (const [key, scent] of Object.entries(SCENTS)) {
    for (const trigger of scent.triggers) {
      if (Object.values(answers).includes(trigger)) {
        scores[key]++;
      }
    }
  }

  return Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scentMatch = calculateMatch(answers);

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
        router.push(`/thank-you?scent=${scentMatch}`);
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
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-[#121212]/10 px-6 py-6 text-center">
        <Link href="/" className="text-lg tracking-[0.2em] uppercase text-[#121212]">
          Daniel Philip
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        {/* Step 0: Intro */}
        {step === 0 && (
          <div className="w-full max-w-md text-center">
            <p className="mb-4 text-xs tracking-[0.3em] uppercase text-[#121212]/40">
              Fragrance Quiz
            </p>
            <h1 className="mb-4 text-4xl font-light text-[#121212]">
              Find Your Scent
            </h1>
            <p className="mb-10 text-sm font-light leading-relaxed text-[#121212]/60">
              Discover which perfume oil is perfectly matched to your
              personality and style.
            </p>

            <button
              onClick={() => setStep(1)}
              className="w-full border border-[#121212] bg-[#121212] px-8 py-4 text-sm tracking-wider uppercase text-white hover:bg-white hover:text-[#121212]"
            >
              Begin
            </button>
          </div>
        )}

        {/* Steps 1-5: Questions */}
        {step >= 1 && step <= 5 && (
          <div className="w-full max-w-md">
            {/* Progress */}
            <div className="mb-12">
              <div className="mb-3 flex justify-between text-xs tracking-wider uppercase text-[#121212]/40">
                <span>{step} of 5</span>
                <span>{Math.round((step / 5) * 100)}%</span>
              </div>
              <div className="h-px w-full bg-[#121212]/10">
                <div
                  className="h-px bg-[#121212] transition-all duration-500"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <h2 className="mb-8 text-2xl font-light text-[#121212]">
              {QUESTIONS[step - 1].questionText}
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
                      setStep(6);
                    }
                  }}
                  className={`w-full border px-6 py-4 text-left text-sm transition-all ${
                    answers[QUESTIONS[step - 1].id] === option
                      ? "border-[#121212] bg-[#121212] text-white"
                      : "border-[#121212]/20 text-[#121212] hover:border-[#121212]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Back */}
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="mt-8 text-xs tracking-wider uppercase text-[#121212]/40 hover:text-[#121212]"
              >
                Back
              </button>
            )}
          </div>
        )}

        {/* Step 6: Lead Capture */}
        {step === 6 && (
          <div className="w-full max-w-md">
            <p className="mb-2 text-xs tracking-[0.3em] uppercase text-[#121212]/40">
              Almost there
            </p>
            <h2 className="mb-2 text-2xl font-light text-[#121212]">
              Your results are ready
            </h2>
            <p className="mb-10 text-sm font-light text-[#121212]/60">
              Enter your details to reveal your personalized scent match.
            </p>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs tracking-wider uppercase text-[#121212]/60">
                  First Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full border-b border-[#121212]/20 bg-transparent py-3 text-sm text-[#121212] placeholder:text-[#121212]/30 focus:border-[#121212] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs tracking-wider uppercase text-[#121212]/60">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border-b border-[#121212]/20 bg-transparent py-3 text-sm text-[#121212] placeholder:text-[#121212]/30 focus:border-[#121212] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs tracking-wider uppercase text-[#121212]/60">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full border-b border-[#121212]/20 bg-transparent py-3 text-sm text-[#121212] placeholder:text-[#121212]/30 focus:border-[#121212] focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleLeadSubmit}
                disabled={loading || !email || !name}
                className="w-full border border-[#121212] bg-[#121212] px-8 py-4 text-sm tracking-wider uppercase text-white hover:bg-white hover:text-[#121212] disabled:opacity-30"
              >
                {loading ? "Revealing..." : "Reveal My Match"}
              </button>
            </div>

            <button
              onClick={() => setStep(5)}
              className="mt-8 text-xs tracking-wider uppercase text-[#121212]/40 hover:text-[#121212]"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
