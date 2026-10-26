import { useState } from 'react'
import { supabase } from '../supabase'
import { ArrowRight } from 'lucide-react'
import Logo from './Logo'

export default function Auth() {
  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setMsg('')
    setEnviando(true)
    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setMsg('E-mail ou senha incorretos.')
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password: senha })
      if (error) setMsg(error.message.includes('6') ? 'A senha precisa ter pelo menos 6 caracteres.' : 'Não foi possível criar a conta. Confira o e-mail.')
      else if (!data.session) setMsg('Conta criada. Abra o e-mail de confirmação e depois entre aqui.')
    }
    setEnviando(false)
  }

  return (
    <div className="tela-centro">
      <form className="cartao-simples splash" onSubmit={enviar}>
        <Logo tamanho={64} />
        <h1 className="marca">Pique</h1>
        <p className="slogan">Disposição de volta</p>
        <p className="sub">Treino, comida e medidas de vocês dois no mesmo lugar.</p>
        <label className="campo">
          <span>E-mail</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="campo">
          <span>Senha</span>
          <input type="password" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        {msg && <p className="aviso" role="status">{msg}</p>}
        <button className="botao primario com-seta" disabled={enviando}>
          <span>{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</span>
          <span className="seta-circulo"><ArrowRight size={18} /></span>
        </button>
        <button type="button" className="botao link" onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setMsg('') }}>
          {modo === 'entrar' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  )
}
