import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type ConnectionState =
  | { status: 'loading' }
  | { status: 'ok' }
  | { status: 'error'; message: string }

export function SupabaseConnectionTest() {
  const [state, setState] = useState<ConnectionState>({ status: 'loading' })

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) {
          setState({ status: 'error', message: error.message })
        } else {
          setState({ status: 'ok' })
        }
      })
      .catch((error: unknown) => {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        })
      })
  }, [])

  if (state.status === 'loading') return <p>Testando conexão com Supabase…</p>
  if (state.status === 'error')
    return <p style={{ color: 'crimson' }}>Falha na conexão: {state.message}</p>
  return <p style={{ color: 'seagreen' }}>Conexão com Supabase estabelecida com sucesso.</p>
}
