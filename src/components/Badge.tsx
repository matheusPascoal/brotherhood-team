import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'danger' | 'warning' | 'primary' | 'gold' | 'neutral'

interface BadgeProps {
  tone: BadgeTone
  children: ReactNode
  dot?: boolean
}

export function Badge({ tone, children, dot = true }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  )
}

const BELT_CLASS: Record<string, string> = {
  branca: 'belt-pill--branca',
  azul: 'belt-pill--azul',
  roxa: 'belt-pill--roxa',
  marrom: 'belt-pill--marrom',
  preta: 'belt-pill--preta',
}

export function BeltPill({ faixa }: { faixa: string }) {
  const className = BELT_CLASS[faixa.toLowerCase()] ?? 'belt-pill--outra'
  return <span className={`belt-pill ${className}`}>{faixa}</span>
}
