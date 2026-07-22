import Link from 'next/link';
import { Logo } from '@/components/Logo';

const features = [
  { title: 'Slimme planner', desc: 'Dag-, week- en maandweergave met drag & drop, kleuren per afdeling en templates.' },
  { title: 'AI-planning', desc: 'Automatisch inplannen, tekorten voorspellen en kosten optimaliseren.' },
  { title: 'Urenregistratie', desc: 'Klokken via web, kiosk, QR of GPS — inclusief over-, nacht- en weekenduren.' },
  { title: 'Verlof & afwezigheid', desc: 'Vakantie, ADV, ziekte en meer met saldi en goedkeuringsflow.' },
  { title: 'Werknemersportaal', desc: 'Eigen planning, beschikbaarheid doorgeven, verlof aanvragen en chatten.' },
  { title: 'Rapporten & export', desc: 'Uren, kosten en bezetting — exporteer naar PDF, Excel en CSV.' },
];

const sectors = ['Horeca', 'Retail', 'Supermarkten', 'Magazijnen', 'Transport', 'Zorg', 'Kantoor', 'Productie', 'Events', 'Schoonmaak'];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      <header className="flex items-center justify-between py-6">
        <Logo className="text-xl" />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Inloggen</Link>
          <Link href="/register" className="btn-primary">Gratis starten</Link>
        </nav>
      </header>

      <section className="animate-fade-up py-16 text-center md:py-24">
        <span className="glass inline-block px-4 py-1.5 text-sm text-sky-300">
          Slim personeelsbeheer, zonder zorgen
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Personeelsplanning die <span className="text-sky-400">sneller</span>,
          slimmer en gebruiksvriendelijker is
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          ShiftFlow is het moderne platform voor werkroosters en personeelsplanning
          voor bedrijven van elke grootte. Met AI-planning, urenregistratie en een
          krachtig werknemersportaal.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register" className="btn-primary">Gratis starten</Link>
          <Link href="/login" className="btn-ghost">Bekijk demo</Link>
        </div>
        <p className="mt-4 text-sm text-white/40">
          Demo-account: owner@demo.shiftflow.app · wachtwoord Demo1234!
        </p>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="glass p-6 transition hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-white/60">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="glass-strong my-12 p-8 text-center">
        <h2 className="text-2xl font-semibold">Voor elke sector</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {sectors.map((s) => (
            <span key={s} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80">
              {s}
            </span>
          ))}
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-sm text-white/50 md:flex-row">
        <Logo />
        <span>© {new Date().getFullYear()} ShiftFlow. Alle rechten voorbehouden.</span>
      </footer>
    </main>
  );
}
