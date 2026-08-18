import { useEffect, useState, type ReactElement } from 'react'
import { AppDataProvider, useAppData } from './state/AppDataContext'
import { AppLayout } from './components/AppLayout'
import { AdminOverviewPage } from './features/admin/AdminOverviewPage'
import { ProfessoresPage } from './features/admin/ProfessoresPage'
import { AlunosPage } from './features/admin/AlunosPage'
import { PagamentosPage } from './features/admin/PagamentosPage'
import { RelatoriosPage } from './features/admin/RelatoriosPage'
import { EstoquePage } from './features/admin/EstoquePage'
import { PainelProfessorPage } from './features/professor/PainelProfessorPage'
import { HorariosPage } from './features/professor/HorariosPage'
import { AlunosPagamentosPage } from './features/professor/AlunosPagamentosPage'
import { PresencasPage } from './features/professor/PresencasPage'
import { MeuPainelPage } from './features/aluno/MeuPainelPage'
import { LoginPage } from './features/auth/LoginPage'
import type { Profile, Role } from './domain/types'
import './App.css'

const TABS_BY_ROLE: Record<Role, { key: string; label: string }[]> = {
  admin: [
    { key: 'visao-geral', label: 'Visão Geral' },
    { key: 'professores', label: 'Professores' },
    { key: 'alunos', label: 'Todos Alunos' },
    { key: 'pagamentos', label: 'Pagamentos Confirmados' },
    { key: 'relatorios', label: 'Relatórios Mensais' },
    { key: 'estoque', label: 'Controle de Estoque' },
  ],
  professor: [
    { key: 'painel', label: 'Painel do Professor' },
    { key: 'horarios', label: 'Horários de Aulas' },
    { key: 'alunos-pagamentos', label: 'Alunos & Pagamentos' },
    { key: 'presencas', label: 'Registro de Presenças' },
  ],
  aluno: [{ key: 'meu-painel', label: 'Meu Painel' }],
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page">
      <h1>{title}</h1>
      <p className="empty-state">Esta tela ainda não foi construída.</p>
    </div>
  )
}

function AppShell({ currentAccount }: { currentAccount: Profile }) {
  const tabs = TABS_BY_ROLE[currentAccount.role]
  const [activeTab, setActiveTab] = useState(tabs[0].key)

  useEffect(() => {
    setActiveTab(TABS_BY_ROLE[currentAccount.role][0].key)
  }, [currentAccount.role])

  const activeTabLabel = tabs.find((t) => t.key === activeTab)?.label ?? tabs[0].label

  const pagesByRole: Record<Role, Record<string, () => ReactElement | null>> = {
    admin: {
      'visao-geral': () => <AdminOverviewPage onNavigate={setActiveTab} />,
      professores: ProfessoresPage,
      alunos: AlunosPage,
      pagamentos: PagamentosPage,
      relatorios: RelatoriosPage,
      estoque: EstoquePage,
    },
    professor: {
      painel: () => <PainelProfessorPage onNavigate={setActiveTab} />,
      horarios: HorariosPage,
      'alunos-pagamentos': AlunosPagamentosPage,
      presencas: PresencasPage,
    },
    aluno: {
      'meu-painel': MeuPainelPage,
    },
  }
  const CurrentPage = pagesByRole[currentAccount.role][activeTab]

  return (
    <AppLayout tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
      {CurrentPage ? <CurrentPage /> : <PlaceholderPage title={activeTabLabel} />}
    </AppLayout>
  )
}

function AuthGate() {
  const { currentAccount, authLoading } = useAppData()
  if (authLoading) {
    return (
      <div className="login-screen">
        <p>Carregando...</p>
      </div>
    )
  }
  return currentAccount ? <AppShell currentAccount={currentAccount} /> : <LoginPage />
}

function App() {
  return (
    <AppDataProvider>
      <AuthGate />
    </AppDataProvider>
  )
}

export default App
