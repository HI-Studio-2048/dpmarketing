import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#121212]/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="text-lg tracking-[0.2em] uppercase text-[#121212]">
            Daniel Philip
          </Link>
          <div className="flex gap-8">
            <Link
              href="/quiz"
              className="text-sm tracking-wider uppercase text-[#121212]/60 hover:text-[#121212]"
            >
              Quiz
            </Link>
            <Link
              href="/admin-login"
              className="text-sm tracking-wider uppercase text-[#121212]/60 hover:text-[#121212]"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mx-auto max-w-xl space-y-8">
          <h1 className="text-5xl font-light tracking-tight text-[#121212]">
            Discover Your<br />Signature Scent
          </h1>
          <p className="text-lg font-light text-[#121212]/60">
            Perfume oils crafted for those who understand that fragrance
            is more than a scent&mdash;it&apos;s an expression of self.
          </p>

          <div className="pt-4">
            <Link
              href="/quiz"
              className="inline-block border border-[#121212] bg-[#121212] px-10 py-4 text-sm tracking-wider uppercase text-white hover:bg-white hover:text-[#121212]"
            >
              Take the Quiz
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-16 border-t border-[#121212]/20" />

      {/* Features Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-0 border border-[#121212]/10 md:grid-cols-3">
            <div className="border-b border-[#121212]/10 p-10 md:border-b-0 md:border-r">
              <h3 className="mb-3 text-sm tracking-wider uppercase text-[#121212]">100% Pure</h3>
              <p className="text-sm font-light leading-relaxed text-[#121212]/60">
                No fillers, no synthetics. Just pure, concentrated fragrance oils.
              </p>
            </div>

            <div className="border-b border-[#121212]/10 p-10 md:border-b-0 md:border-r">
              <h3 className="mb-3 text-sm tracking-wider uppercase text-[#121212]">Long-lasting</h3>
              <p className="text-sm font-light leading-relaxed text-[#121212]/60">
                A little goes a long way. Our oils last 12+ hours on skin.
              </p>
            </div>

            <div className="p-10">
              <h3 className="mb-3 text-sm tracking-wider uppercase text-[#121212]">Personalized</h3>
              <p className="text-sm font-light leading-relaxed text-[#121212]/60">
                We help you find the perfect scent that matches your personality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#121212] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-4 text-3xl font-light text-white">
            Ready to find your scent?
          </h2>
          <p className="mb-8 text-sm font-light text-white/60">
            5 questions. Your perfect match. Zero commitment.
          </p>
          <Link
            href="/quiz"
            className="inline-block border border-white bg-white px-10 py-4 text-sm tracking-wider uppercase text-[#121212] hover:bg-transparent hover:text-white"
          >
            Start Quiz
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#121212]/10 px-6 py-10 text-center">
        <p className="text-xs tracking-wider uppercase text-[#121212]/40">
          DM{" "}
          <a
            href="https://instagram.com/its.danielphilip"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#121212]/60 hover:text-[#121212]"
          >
            @its.danielphilip
          </a>{" "}
          on Instagram
        </p>
      </footer>
    </main>
  );
}
