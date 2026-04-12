import Link from 'next/link';

/** Flower-of-life derived icon — 7 overlapping circles, stroke only */
function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="2 1 36 38"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      {/* center */}
      <circle cx="20" cy="20" r="9" strokeOpacity="0.9" />
      {/* top */}
      <circle cx="20" cy="11" r="9" strokeOpacity="0.65" />
      {/* top-right */}
      <circle cx="27.8" cy="15.5" r="9" strokeOpacity="0.65" />
      {/* bottom-right */}
      <circle cx="27.8" cy="24.5" r="9" strokeOpacity="0.65" />
      {/* bottom */}
      <circle cx="20" cy="29" r="9" strokeOpacity="0.65" />
      {/* bottom-left */}
      <circle cx="12.2" cy="24.5" r="9" strokeOpacity="0.65" />
      {/* top-left */}
      <circle cx="12.2" cy="15.5" r="9" strokeOpacity="0.65" />
    </svg>
  );
}

interface SeoPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SeoPageShell({ title, description, children }: SeoPageShellProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <header className="border-b border-neutral-800 py-4 px-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2.5 w-fit group">
          <div className="spin-slow text-primary-500 size-7 shrink-0 transition-transform group-hover:scale-110">
            <FlowerIcon className="size-7" />
          </div>
          <span className="font-black text-xl tracking-tight text-white" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            empatify
          </span>
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4 text-white">{title}</h1>
        <p className="text-neutral-400 text-lg mb-10">{description}</p>
        {children}
        <div className="mt-16 p-6 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
          <p className="text-neutral-300 mb-4 text-lg">Ready to find out if your friends really know your music taste?</p>
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Play Empatify Free
          </Link>
        </div>
      </main>
      <footer className="border-t border-neutral-800 py-6 px-6 text-center text-neutral-500 text-sm">
        © 2026 Rudolpho-AI · <Link href="/de/impressum" className="hover:text-neutral-300">Impressum</Link>
      </footer>
    </div>
  );
}
