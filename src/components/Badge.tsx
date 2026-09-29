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
  cinza: 'belt-pill--cinza',
  azul: 'belt-pill--azul',
  amarela: 'belt-pill--amarela',
  laranja: 'belt-pill--laranja',
  verde: 'belt-pill--verde',
  roxa: 'belt-pill--roxa',
  vermelha: 'belt-pill--vermelha',
  marrom: 'belt-pill--marrom',
  preta: 'belt-pill--preta',
}

export function BeltPill({ faixa }: { faixa: string }) {
  const className = BELT_CLASS[faixa.toLowerCase()] ?? 'belt-pill--outra'
  return <span className={`belt-pill ${className}`}>{faixa}</span>
}
