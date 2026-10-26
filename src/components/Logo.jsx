export default function Logo({ tamanho = 56 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="logo">
      <path d="M32 54C32 54 14 44 14 27C14 17 22 10 32 8C42 10 50 17 50 27C50 44 32 54 32 54Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M32 54V20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 34C26 31 22 27 21 22M32 42C38 39 42 35 43 30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
