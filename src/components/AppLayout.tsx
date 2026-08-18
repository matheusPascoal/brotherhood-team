import type { ReactNode } from 'react'
import {
  RotateCcw,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  GraduationCap,
  Users,
  CircleDollarSign,
  FileText,
  CalendarClock,
  ClipboardCheck,
  UserCircle,
  Boxes,
} from 'lucide-react'
import { useAppData } from '../state/AppDataContext'
import type { Role } from '../domain/types'
import { Badge, type BadgeTone } from './Badge'

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  professor: 'Professor',
  aluno: 'Aluno',
}

const ROLE_TONE: Record<Role, BadgeTone> = {
  admin: 'primary',
  professor: 'gold',
  aluno: 'neutral',
}

const TAB_ICON: Record<string, typeof LayoutDashboard> = {
  'visao-geral': LayoutDashboard,
  professores: GraduationCap,
  alunos: Users,
  pagamentos: CircleDollarSign,
  relatorios: FileText,
  estoque: Boxes,
  painel: LayoutDashboard,
  horarios: CalendarClock,
  'alunos-pagamentos': Users,
  presencas: ClipboardCheck,
  'meu-painel': UserCircle,
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

interface AppLayoutProps {
  tabs: { key: string; label: string }[]
  activeTab: string
  onTabChange: (key: string) => void
  children: ReactNode
}

export function AppLayout({ tabs, activeTab, onTabChange, children }: AppLayoutProps) {
  const { profiles, currentAccount, switchAccount, resetData, logout } = useAppData()

  if (!currentAccount) return null

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__identity">
          <div className="app-header__logo">
            <img src="/logo.jpg" alt="Brotherhood Team" className="app-header__logo-img" />
          </div>
          <div className="app-header__brand">
            <div className="app-header__brand-name">
              BROTHERHOOD <span className="accent">TEAM</span>{' '}
              <Badge tone="primary" dot={false}>
                System
              </Badge>
            </div>
            <div className="app-header__brand-sub">Gestão Integrada de Artes Marciais</div>
          </div>
        </div>

        <div className="app-header__actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={resetData} title="Restaurar dados iniciais">
            <RotateCcw size={14} strokeWidth={2} />
            Reset Data
          </button>

          <div className="app-header__account">
            <div className="avatar">{initials(currentAccount.fullName)}</div>
            <div className="app-header__account-text">
              <span className="app-header__account-name">
                {currentAccount.fullName}
                <Badge tone={ROLE_TONE[currentAccount.role]} dot={false}>
                  {ROLE_LABEL[currentAccount.role]}
                </Badge>
              </span>
              <span className="app-header__account-email">{currentAccount.email}</span>
            </div>
            <select
              aria-label="Conta de demonstração"
              className="app-header__account-select"
              value={currentAccount.id}
              onChange={(e) => switchAccount(e.target.value)}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({ROLE_LABEL[p.role]})
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout} title="Sair" aria-label="Sair">
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <nav className="app-tabs">
        {tabs.map((tab) => {
          const Icon = TAB_ICON[tab.key] ?? ChevronDown
          return (
            <button
              key={tab.key}
              type="button"
              className={tab.key === activeTab ? 'tab tab--active' : 'tab'}
              onClick={() => onTabChange(tab.key)}
            >
              <Icon size={16} strokeWidth={1.75} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <main className="app-content">{children}</main>

      <footer className="app-footer">
        <div className="app-footer__status">
          <Badge tone="success">Servidor Ativo</Badge>
        </div>
        <span>Brotherhood Team · v0.1 (mock)</span>
      </footer>
    </div>
  )
}
