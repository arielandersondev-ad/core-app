export function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d={diagonal ? "M5 15 15 5m0 0H7m8 0v8" : "M3 10h14m-5-5 5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeatureIcon({ type }: { type: "ecosystem" | "insight" | "security" }) {
  if (type === "insight") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="size-8">
        <path d="M6 25V15m10 10V7m10 18V11" stroke="currentColor" strokeWidth="1.4" />
        <path d="m5 11 8-5 7 4 7-6" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 3" />
      </svg>
    );
  }

  if (type === "security") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="size-8">
        <path d="M16 3 27 7v8c0 7-4.8 11.3-11 14-6.2-2.7-11-7-11-14V7l11-4Z" stroke="currentColor" strokeWidth="1.4" />
        <path d="m11.5 16 3 3 6.5-7" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="size-8">
      <circle cx="7" cy="16" r="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="25" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="25" cy="24" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="m10 15 12-6m-12 8 12 6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
