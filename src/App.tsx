import { useEffect, useState, type ReactElement } from 'react'
import { AppDataProvider, useAppData } from './state/AppDataContext'
import { AppLayout } from './components/AppLayout'
import { AdminOverviewPage } from './features/admin/AdminOverviewPage'
import { ProfessoresPage } from './features/admin/ProfessoresPage'
import { AlunosPage } from './features/admin/AlunosPage'
import { ModalidadesPage } from './features/admin/ModalidadesPage'
import { PagamentosPage } from './features/admin/PagamentosPage'
import { RelatoriosPage } from './features/admin/RelatoriosPage'
import { EstoquePage } from './features/admin/EstoquePage'
import { PainelProfessorPage } from './features/professor/PainelProfessorPage'
import { HorariosPage } from './features/professor/HorariosPage'
import { AlunosPagamentosPage } from './features/professor/AlunosPagamentosPage'
import { PagamentosTurmasPage } from './features/professor/PagamentosTurmasPage'
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
    { key: 'modalidades', label: 'Modalidades' },
    { key: 'pagamentos', label: 'Pagamentos Confirmados' },
    { key: 'relatorios', label: 'Relatórios Mensais' },
    { key: 'estoque', label: 'Controle de Estoque' },
  ],
  professor: [
    { key: 'painel', label: 'Painel do Professor' },
    { key: 'horarios', label: 'Horários de Aulas' },
    { key: 'alunos-pagamentos', label: 'Alunos & Pagamentos' },
    { key: 'pagamentos-turmas', label: 'Pagamentos por Turma' },
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

// Cada aba tem sua própria rota (ex.: /alunos-pagamentos), sincronizada com a
// URL via History API — sem depender de uma lib de rotas. tabKeyFromPath só
// aceita chaves válidas para o papel atual, senão a tela cai na primeira aba.
function tabKeyFromPath(pathname: string, tabs: { key: string }[]): string | null {
  const key = pathname.replace(/^\//, '')
  return tabs.some((t) => t.key === key) ? key : null
}

function AppShell({ currentAccount }: { currentAccount: Profile }) {
  const tabs = TABS_BY_ROLE[currentAccount.role]
  const [activeTab, setActiveTab] = useState(() => tabKeyFromPath(window.location.pathname, tabs) ?? tabs[0].key)

  function navigate(key: string) {
    setActiveTab(key)
    if (window.location.pathname !== '/' + key) {
      window.history.pushState(null, '', '/' + key)
    }
  }

  // Ao logar ou trocar de papel, garante que a URL corresponde a uma aba
  // válida do papel atual (preserva deep link se já bater, senão cai na
  // primeira aba do papel).
  useEffect(() => {
    const roleTabs = TABS_BY_ROLE[currentAccount.role]
    const nextTab = tabKeyFromPath(window.location.pathname, roleTabs) ?? roleTabs[0].key
    setActiveTab(nextTab)
    if (window.location.pathname !== '/' + nextTab) {
      window.history.replaceState(null, '', '/' + nextTab)
    }
  }, [currentAccount.role])

  // Botão voltar/avançar do navegador.
  useEffect(() => {
    function onPopState() {
      const key = tabKeyFromPath(window.location.pathname, TABS_BY_ROLE[currentAccount.role])
      if (key) setActiveTab(key)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [currentAccount.role])

  const activeTabLabel = tabs.find((t) => t.key === activeTab)?.label ?? tabs[0].label

  const pagesByRole: Record<Role, Record<string, () => ReactElement | null>> = {
    admin: {
      'visao-geral': () => <AdminOverviewPage onNavigate={navigate} />,
      professores: ProfessoresPage,
      alunos: AlunosPage,
      modalidades: ModalidadesPage,
      pagamentos: PagamentosPage,
      relatorios: RelatoriosPage,
      estoque: EstoquePage,
    },
    professor: {
      painel: () => <PainelProfessorPage onNavigate={navigate} />,
      horarios: HorariosPage,
      'alunos-pagamentos': AlunosPagamentosPage,
      'pagamentos-turmas': PagamentosTurmasPage,
      presencas: PresencasPage,
    },
    aluno: {
      'meu-painel': MeuPainelPage,
    },
  }
  const CurrentPage = pagesByRole[currentAccount.role][activeTab]

  return (
    <AppLayout tabs={tabs} activeTab={activeTab} onTabChange={navigate}>
      {CurrentPage ? <CurrentPage /> : <PlaceholderPage title={activeTabLabel} />}
    </AppLayout>
  )
}

function AuthGate() {
  const { currentAccount, authLoading, dataLoading } = useAppData()
  if (authLoading || (currentAccount && dataLoading)) {
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
