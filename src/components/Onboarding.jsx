import { useState } from 'react'
import { supabase } from '../supabase'
import { PESSOAS, MEDIDAS_INICIAIS } from '../plan'
import Logo from './Logo'
import { hojeISO, mondayOf, formatarData } from '../utils'

export default function Onboarding({ userId, onPronto }) {
  const [pessoa, setPessoa] = useState('')
  const [inicio, setInicio] = useState(mondayOf(hojeISO()))
  const [importar, setImportar] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!pessoa) { setErro('Escolha quem está usando esta conta.'); return }
    setSalvando(true)
    const p = PESSOAS[pessoa]
    const perfil = { id: userId, nome: p.nome, pessoa, altura_cm: p.altura, data_inicio: inicio }
    const { data, error } = await supabase.from('profiles').insert(perfil).select().single()
    if (error) { setErro('Não foi possível salvar o perfil. Tente de novo.'); setSalvando(false); return }
    if (importar) {
      await supabase.from('medidas').insert({ user_id: userId, data: MEDIDAS_INICIAIS.data, ...MEDIDAS_INICIAIS[pessoa] })
    }
    onPronto(data)
  }

  return (
    <div className="tela-centro">
      <div className="cartao-simples splash">
        <Logo tamanho={48} />
        <h1 className="marca pequena">Quem é você?</h1>
        <p className="sub">Cada um usa a própria conta. As porções e metas mudam conforme a pessoa.</p>
        <div className="escolha-pessoa">
          {Object.entries(PESSOAS).map(([k, p]) => (
            <button key={k} type="button" className={pessoa === k ? `pessoa p-${k} marcada` : `pessoa p-${k}`} aria-pressed={pessoa === k} onClick={() => setPessoa(k)}>
              <strong>{p.nome}</strong>
              <span>{p.metas.kcal} kcal por dia</span>
            </button>
          ))}
        </div>
        <label className="campo">
          <span>Início do plano (semana 1)</span>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </label>
        <label className="caixa">
          <input type="checkbox" checked={importar} onChange={(e) => setImportar(e.target.checked)} />
          <span>Registrar as medidas de {formatarData(MEDIDAS_INICIAIS.data)} como ponto de partida</span>
        </label>
        {erro && <p className="aviso">{erro}</p>}
        <button className="botao primario" onClick={salvar} disabled={salvando}>Começar</button>
      </div>
    </div>
  )
}
