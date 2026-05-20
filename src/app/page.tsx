import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-white">✨ DanielPhilip</h1>
          <div className="flex gap-4">
            <Link
              href="/quiz"
              className="text-sm text-slate-300 hover:text-white"
            >
              Quiz
            </Link>
            <Link
              href="/admin-login"
              className="text-sm text-slate-300 hover:text-white"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <div className="mb-4 text-6xl">🌹</div>
            <h1 className="text-5xl font-bold text-white">
              Discover Your Signature Scent
            </h1>
            <p className="mt-4 text-xl text-slate-400">
              Our perfume oils are crafted for those who understand that fragrance
              is more than a scent&mdash;it&apos;s an expression of self.
            </p>
          </div>

          <div className="pt-6">
            <Link
              href="/quiz"
              className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 font-bold text-white hover:from-amber-600 hover:to-amber-700"
            >
              Start the Quiz →
            </Link>
            <p className="mt-3 text-sm text-slate-500">
              Takes 5 minutes • Zero commitment
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-700/50 bg-slate-800/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Why Our Oils?
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
              <div className="mb-3 text-3xl">🌿</div>
              <h3 className="mb-2 text-lg font-bold text-white">100% Pure</h3>
              <p className="text-slate-400">
                No fillers, no synthetics. Just pure, concentrated fragrance oils.
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
              <div className="mb-3 text-3xl">⏰</div>
              <h3 className="mb-2 text-lg font-bold text-white">Long-lasting</h3>
              <p className="text-slate-400">
                A little goes a long way. Our oils last 12+ hours on skin.
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
              <div className="mb-3 text-3xl">🎯</div>
              <h3 className="mb-2 text-lg font-bold text-white">Personalized</h3>
              <p className="text-slate-400">
                We help you find the perfect scent that matches your personality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">Ready to find your scent?</h2>
          <p className="mb-6 text-slate-400">
            Take our quick fragrance quiz and get a personalized recommendation
            based on your unique style and preferences.
          </p>
          <Link
            href="/quiz"
            className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-bold text-white hover:from-amber-600 hover:to-amber-700"
          >
            Start Quiz
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 px-6 py-8 text-center text-sm text-slate-500">
        <p>
          Questions? DM{" "}
          <a
            href="https://instagram.com/its.danielphilip"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-400"
          >
            @its.danielphilip
          </a>{" "}
          on Instagram
        </p>
      </footer>
    </main>
  );
}
