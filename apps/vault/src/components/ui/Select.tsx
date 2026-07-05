'use client'

// A real <select> underneath (keeps native keyboard/mobile/a11y behavior)
// with the OS's glossy default appearance stripped via `appearance-none`
// and a hand-drawn chevron in its place.
export default function Select({
  value, onChange, options, className = '',
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none bg-vault-surface border border-vault-border rounded-lg pl-3 pr-8 py-2 text-sm font-mono text-vault-text focus:outline-none focus:border-vault-accent/50 cursor-pointer transition-colors ${className}`}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-vault-surface text-vault-text">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vault-text-dim"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
