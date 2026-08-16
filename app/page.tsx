import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { serializeJsonLd } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  // SEO Schema definition for Packwise as a Software Application
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Packwise',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Smart packing lists for every trip. Organize by category, track what you have packed, and never forget an item again.',
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/*
        SCOUT SEO RATIONALE:
        Render the structured JSON-LD data. It is escaped using serializeJsonLd to prevent XSS.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧳</span>
          <span className="font-bold text-xl text-gray-900">Packwise</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Sign in
          </Link>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          <span>✨</span>
          <span>Smart packing for every adventure</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Never forget to pack{' '}
          <span className="text-blue-600">anything again</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Packwise helps you create smart, organized packing lists for every trip.
          Get AI-suggested items, organize by category, and track your progress.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Start packing smarter
          </Link>
          <Link
            href="#features"
            className="text-gray-600 px-8 py-4 rounded-xl text-lg font-medium hover:text-gray-900 transition-colors"
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Everything you need for stress-free packing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '📋',
              title: 'Smart Lists',
              description: 'Create detailed packing lists organized by categories like clothing, toiletries, and electronics.',
            },
            {
              icon: '🤖',
              title: 'AI Suggestions',
              description: 'Get intelligent item suggestions based on your destination, trip type, and duration.',
            },
            {
              icon: '✅',
              title: 'Track Progress',
              description: 'Check off items as you pack and see your completion progress in real time.',
            },
            {
              icon: '📱',
              title: 'Mobile Friendly',
              description: 'Access your packing lists from any device, anywhere, anytime.',
            },
            {
              icon: '🔄',
              title: 'Reusable Templates',
              description: 'Save trips as templates and reuse them for similar future adventures.',
            },
            {
              icon: '🌍',
              title: 'Multiple Trips',
              description: 'Manage all your upcoming and past trips in one organized dashboard.',
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to pack smarter?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join thousands of travelers who never forget anything.</p>
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
          >
            Get started for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧳</span>
          <span className="font-semibold text-gray-900">Packwise</span>
        </div>
        <p className="text-gray-400 text-sm">Built with Next.js, Supabase & Prisma</p>
      </footer>
    </main>
  )
}
