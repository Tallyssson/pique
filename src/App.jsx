import { useEffect, useState } from 'react'
import { supabase, configurado } from './supabase'
import Auth from './components/Auth'
import Onboarding from './components/Onboarding'
import Hoje from './components/Hoje'
import Treinos from './components/Treinos'
import Alimentacao from './components/Alimentacao'
import Medidas from './components/Medidas'
import Perfil from './components/Perfil'
import Logo from './components/Logo'
import { Home, Dumbbell, Salad, Ruler, UserRound } from 'lucide-react'

const ABAS = [
  ['hoje', 'Hoje', Home],
  ['treinos', 'Treinos', Dumbbell],
  ['alimentacao', 'Comida', Salad],
  ['medidas', 'Medidas', Ruler],
  ['perfil', 'Perfil', UserRound],
]

export default function App() {
  const [session, setSession] = useState(null)
  const [iniciando, setIniciando] = useState(true)
  const [perfil, setPerfil] = useState(undefined)
  const [aba, setAba] = useState('hoje')

  useEffect(() => {
    if (!configurado) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIniciando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setPerfil(undefined); return }
    let ativo = true
    setPerfil(undefined)
    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => { if (ativo) setPerfil(data || null) })
    return () => { ativo = false }
  }, [session?.user?.id])

  useEffect(() => {
    document.documentElement.dataset.pessoa = perfil?.pessoa || ''
  }, [perfil])

  if (!configurado) {
    return (
      <div className="tela-centro">
        <div className="cartao-simples">
          <Logo />
          <h1 className="marca">Pique</h1>
          <p>Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (ou nas variáveis da Vercel) e recarregue.</p>
        </div>
      </div>
    )
  }
  if (iniciando) return <div className="tela-centro"><span className="carregando"><Logo tamanho={40} /></span></div>
  if (!session) return <Auth />
  if (perfil === undefined) return <div className="tela-centro"><span className="carregando"><Logo tamanho={40} /></span></div>
  if (perfil === null) return <Onboarding userId={session.user.id} onPronto={setPerfil} />

  return (
    <div className="app">
      <main className="conteudo">
        {aba === 'hoje' && <Hoje perfil={perfil} irPara={(id) => { setAba(id); window.scrollTo(0, 0) }} />}
        {aba === 'treinos' && <Treinos perfil={perfil} />}
        {aba === 'alimentacao' && <Alimentacao perfil={perfil} />}
        {aba === 'medidas' && <Medidas perfil={perfil} />}
        {aba === 'perfil' && <Perfil perfil={perfil} onSalvo={setPerfil} />}
      </main>
      <nav className="abas" aria-label="Seções">
        {ABAS.map(([id, rotulo, Icone]) => (
          <button key={id} className={aba === id ? 'aba ativa' : 'aba'} aria-current={aba === id ? 'page' : undefined} onClick={() => { setAba(id); window.scrollTo(0, 0) }}>
            <span className="aba-icone"><Icone size={20} strokeWidth={1.8} /></span>
            <span className="aba-rotulo">{rotulo}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
