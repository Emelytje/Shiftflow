export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#0A2540" />
        <path d="M9 20c2.5 0 2.5-8 5-8s2.5 8 5 8 2.5-8 5-8" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="tracking-tight">
        Shift<span className="text-sky-400">Flow</span>
      </span>
    </span>
  );
}
