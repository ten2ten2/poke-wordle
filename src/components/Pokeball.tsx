export default function Pokeball({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="14" fill="white" />
      <path d="M2 16a14 14 0 0 1 28 0Z" fill="#dc2626" />
      <circle cx="16" cy="16" r="14" fill="none" stroke="#1f2937" strokeWidth="2" />
      <path d="M2 16h28" stroke="#1f2937" strokeWidth="2" />
      <circle cx="16" cy="16" r="5" fill="white" stroke="#1f2937" strokeWidth="2" />
      <circle cx="16" cy="16" r="2" fill="#e5e7eb" />
    </svg>
  );
}
