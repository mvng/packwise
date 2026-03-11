import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-blue-200">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧳</span>
            <span className="font-bold text-xl text-gray-900 tracking-tight">Packwise</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Log in
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8 shadow-sm">
            <span className="text-blue-600">✨</span>
            <span>Packwise 2.0 is now live</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 tracking-tight leading-[1.1]">
            Pack like a pro.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Travel stress-free.
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate AI-powered packing lists tailored to your destination and trip duration. Never forget your passport, charger, or toothbrush again.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Packing for Free
            </Link>
            <div className="text-sm text-gray-500 font-medium">
              No credit card required. Cancel anytime.
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 pt-10 border-t border-gray-200/60 max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Trusted by 10,000+ travelers worldwide</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale">
               {/* Placeholders for logos, using simple text or simple SVG shapes for aesthetics */}
               <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 rounded-full bg-gray-400"></div> Nomads</div>
               <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-gray-400 transform rotate-45"></div> JetSet</div>
               <div className="flex items-center gap-2 font-bold text-xl"><div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[20px] border-t-gray-400 border-r-[12px] border-r-transparent"></div> Wanderlust</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Packwise Works</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">From booking to boarding in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-100 -z-10"></div>

            {[
              {
                step: '01',
                title: 'Add your destination',
                description: 'Tell us where you are going, how long you are staying, and the purpose of your trip.',
                icon: '✈️'
              },
              {
                step: '02',
                title: 'Get AI suggestions',
                description: 'Our AI generates a comprehensive packing list based on the local weather and your activities.',
                icon: '🧠'
              },
              {
                step: '03',
                title: 'Check it off',
                description: 'Use our mobile-friendly interface to check off items as they go into your suitcase.',
                icon: '🎒'
              }
            ].map((item, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm border border-blue-100">
                  {item.icon}
                </div>
                <div className="absolute top-8 right-8 text-4xl font-bold text-gray-100">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to pack perfectly</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Powerful features disguised as a simple checklist.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📋', title: 'Smart Categories', desc: 'Auto-categorize items into clothing, toiletries, electronics, and documents.' },
              { icon: '🌤️', title: 'Weather Aware', desc: 'Get suggestions tailored to the historical weather data of your destination.' },
              { icon: '⚖️', title: 'Luggage Limits', desc: 'Keep track of your luggage constraints to avoid overweight baggage fees.' },
              { icon: '👨‍👩‍👧‍👦', title: 'Family Packing', desc: 'Manage packing lists for multiple family members in a single trip.' },
              { icon: '📱', title: 'Offline Mode', desc: 'Access and update your packing list even without an internet connection.' },
              { icon: '🔄', title: 'Templates', desc: 'Save your perfect list as a template for your next identical getaway.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="text-3xl mb-4 bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">Loved by frequent flyers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: "Packwise completely changed how I travel. I used to pack the night before and always forgot my phone charger. Not anymore.", author: "Sarah J.", role: "Digital Nomad" },
              { quote: "The AI suggestions are surprisingly accurate. It reminded me to bring a universal adapter for my trip to London.", author: "Michael T.", role: "Business Consultant" },
              { quote: "Finally, an app that lets me manage the packing for my entire family of four without losing my mind.", author: "Emily R.", role: "Mother & Blogger" }
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-gray-100 relative">
                <div className="text-blue-200 text-6xl absolute top-4 right-6 font-serif">"</div>
                <p className="text-gray-700 mb-6 relative z-10 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-500">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
              <p className="text-gray-500 mb-6">Perfect for the occasional traveler.</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-500 font-medium">/forever</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Up to 3 active trips', 'Basic packing templates', 'Standard item categories', 'Mobile-friendly access'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="w-full py-4 px-6 rounded-xl font-bold text-center border-2 border-gray-200 text-gray-900 hover:border-gray-300 transition-colors">
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gray-900 p-8 md:p-10 rounded-3xl border border-gray-800 shadow-xl flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase shadow-sm">Most Popular</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-gray-400 mb-6">For the serious jetsetter and families.</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">$4.99</span>
                <span className="text-gray-400 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited active trips', 'AI-powered suggestions', 'Weather-aware packing', 'Family & group lists', 'Custom categories', 'Luggage weight tracking'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="w-full py-4 px-6 rounded-xl font-bold text-center bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {[
              { q: "Is Packwise really free?", a: "Yes! Our Basic plan is free forever and includes everything you need for casual travel. You only pay if you need advanced features like AI suggestions and unlimited trips." },
              { q: "How do the AI suggestions work?", a: "Our Pro plan uses an AI model trained on thousands of optimal packing lists. It analyzes your destination, duration, and trip type to suggest items you might otherwise forget." },
              { q: "Can I share my list with someone else?", a: "Currently, you can export your list as a PDF or text format. Collaborative editing is on our roadmap for Q3!" },
              { q: "Does it work offline?", a: "Yes, once your list is loaded, you can check items off while offline (e.g., during your flight). Changes will sync when you reconnect." }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-gray-100">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform how you travel?</h2>
          <p className="text-blue-100 mb-10 text-xl max-w-2xl mx-auto">Join thousands of smart travelers who trust Packwise for their journeys. Setup takes less than 2 minutes.</p>
          <Link
            href="/login"
            className="bg-white text-blue-600 px-10 py-5 rounded-full text-lg font-bold hover:bg-blue-50 transition-all inline-block shadow-xl hover:-translate-y-1 hover:shadow-2xl"
          >
            Create Your First Packing List
          </Link>
          <p className="mt-6 text-sm text-blue-200">Free forever plan available. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">🧳</span>
              <span className="font-bold text-xl text-white tracking-tight">Packwise</span>
            </div>
            <p className="text-gray-500 max-w-sm mb-6">
              The smartest way to pack for any journey. AI-powered lists, beautiful design, and stress-free travel.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center">𝕏</div>
              <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center">in</div>
              <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center">IG</div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Templates</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Travel Guides</Link></li>
              <li><Link href="#faq" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Packwise Inc. All rights reserved.</p>
          <p className="text-sm">Built with Next.js & Tailwind</p>
        </div>
      </footer>
    </main>
  )
}
