import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Heart, Download, Copy } from 'lucide-react'
import { PESSOAS, TREINOS, CAMPOS_MEDIDA } from '../plan'
import { hojeISO, formatarData, baixarCSV } from '../utils'

const NOMES_EXERCICIOS = Object.fromEntries(Object.values(TREINOS).flatMap((t) => t.exercicios.map((e) => [e.id, e.nome])))

export default function Perfil({ perfil, onSalvo }) {
  const [nome, setNome] = useState(perfil.nome)
  const [altura, setAltura] = useState(perfil.altura_cm)
  const [inicio, setInicio] = useState(perfil.data_inicio)
  const [msg, setMsg] = useState('')

  async function salvar(e) {
    e.preventDefault()
    if (inicio !== perfil.data_inicio && !confirm(
      `Mudar o início de ${formatarData(perfil.data_inicio)} para ${formatarData(inicio)} muda a semana da corrida, ` +
      'a natação e a alternância dos treinos A e B. Os registros já feitos continuam salvos. Continuar?'
    )) return
    const { data, error } = await supabase.from('profiles')
      .update({ nome, altura_cm: Number(String(altura).replace(',', '.')), data_inicio: inicio })
      .eq('id', perfil.id).select().single()
    if (error) setMsg('Não foi possível salvar.')
    else { onSalvo(data); setMsg('Perfil salvo.') }
  }

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Perfil</h1>
      <form className="bloco" onSubmit={salvar}>
        <p className="nota">Plano de porções: {PESSOAS[perfil.pessoa].nome}</p>
        <label className="campo"><span>Nome</span><input value={nome} onChange={(e) => setNome(e.target.value)} required /></label>
        <label className="campo"><span>Altura (cm)</span><input inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} required /></label>
        <label className="campo"><span>Início do plano (semana 1)</span><input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required /></label>
        {msg && <p className="aviso" role="status">{msg}</p>}
        <button className="botao primario">Salvar perfil</button>
      </form>
      <VinculoCasal perfil={perfil} onSalvo={onSalvo} />
      <Exportar perfil={perfil} />
      <button className="botao largo" onClick={() => supabase.auth.signOut()}>Sair da conta</button>
    </div>
  )
}

function VinculoCasal({ perfil, onSalvo }) {
  const [par, setPar] = useState(undefined)
  const [codigo, setCodigo] = useState('')
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!perfil.casal_id) return
    let ativo = true
    supabase.from('profiles').select('nome').eq('casal_id', perfil.casal_id).neq('id', perfil.id).maybeSingle()
      .then(({ data }) => { if (ativo) setPar(data) })
    return () => { ativo = false }
  }, [perfil.casal_id, perfil.id])

  async function recarregarPerfil() {
    const { data } = await supabase.from('profiles').select('*').eq('id', perfil.id).single()
    if (data) onSalvo(data)
  }

  async function entrar(e) {
    e.preventDefault()
    setMsg('')
    setEnviando(true)
    const { error } = await supabase.rpc('entrar_no_casal', { codigo: codigo.trim() })
    setEnviando(false)
    if (error) {
      setMsg(error.message.includes('completo') ? 'Esse casal já tem duas pessoas.' : 'Código não encontrado. Confira se copiou inteiro.')
      return
    }
    setCodigo('')
    recarregarPerfil()
  }

  async function sair() {
    if (!confirm(`Desvincular de ${par.nome}? Vocês deixam de ver o dia um do outro.`)) return
    const { error } = await supabase.rpc('sair_do_casal')
    if (error) setMsg('Não foi possível desvincular.')
    else { setPar(null); recarregarPerfil() }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(perfil.casal_id)
      setMsg('Código copiado. Mande para a outra pessoa.')
    } catch {
      setMsg('Não deu para copiar. Selecione o código e copie manualmente.')
    }
  }

  if (!perfil.casal_id) {
    return (
      <section className="bloco">
        <h2 className="titulo-icone"><span className="icone-folha"><Heart size={18} /></span>Casal</h2>
        <p className="nota">Para vincular as contas, rode o arquivo supabase/migracao-02-corrida-casal.sql no Supabase e recarregue o app.</p>
      </section>
    )
  }
  if (par === undefined) return null

  return (
    <section className="bloco">
      <h2 className="titulo-icone"><span className="icone-folha"><Heart size={18} /></span>Casal</h2>
      {par ? (
        <>
          <p>Vinculado com <strong>{par.nome}</strong>. Na tela Hoje cada um vê treino, refeições e água do outro. Medidas e cargas continuam privadas.</p>
          <button className="botao link perigo" onClick={sair}>Desvincular</button>
        </>
      ) : (
        <>
          <p className="nota">Vincule com a outra pessoa para acompanhar o dia um do outro. Uma pessoa copia o próprio código e a outra cola aqui.</p>
          <div className="codigo">
            <code>{perfil.casal_id}</code>
            <button type="button" className="botao" onClick={copiar}><Copy size={16} /> Copiar meu código</button>
          </div>
          <form className="linha-campo" onSubmit={entrar}>
            <label className="campo">
              <span>Código da outra pessoa</span>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="cole aqui" required />
            </label>
            <button className="botao primario" disabled={enviando}>Vincular</button>
          </form>
        </>
      )}
      {msg && <p className="aviso" role="status">{msg}</p>}
    </section>
  )
}

function Exportar({ perfil }) {
  const [erro, setErro] = useState('')
  const sufixo = `${perfil.nome.toLowerCase()}-${hojeISO()}`

  async function buscar(consulta) {
    setErro('')
    const { data, error } = await consulta
    if (error) { setErro('Não foi possível buscar os dados.'); return null }
    return data
  }

  async function medidas() {
    const d = await buscar(supabase.from('medidas').select('*').eq('user_id', perfil.id).order('data'))
    if (!d) return
    baixarCSV(`pique-medidas-${sufixo}.csv`, [
      ['Data', ...CAMPOS_MEDIDA.map(([, r, u]) => `${r} (${u})`)],
      ...d.map((m) => [formatarData(m.data), ...CAMPOS_MEDIDA.map(([c]) => (m[c] == null ? null : Number(m[c])))]),
    ])
  }

  async function cargas() {
    const d = await buscar(supabase.from('exercicio_logs').select('data,exercicio_id,cargas,feito').eq('user_id', perfil.id).order('data'))
    if (!d) return
    baixarCSV(`pique-cargas-${sufixo}.csv`, [
      ['Data', 'Exercício', 'Série 1 (kg)', 'Série 2 (kg)', 'Série 3 (kg)', 'Feito'],
      ...d.map((l) => [formatarData(l.data), NOMES_EXERCICIOS[l.exercicio_id] || l.exercicio_id, ...[0, 1, 2].map((i) => l.cargas?.[i] ?? null), l.feito ? 'sim' : 'não']),
    ])
  }

  async function treinos() {
    const d = await buscar(supabase.from('treino_logs').select('*').eq('user_id', perfil.id).eq('concluido', true).order('data'))
    if (!d) return
    baixarCSV(`pique-treinos-${sufixo}.csv`, [
      ['Data', 'Atividade', 'Tempo (min)', 'Distância (km)'],
      ...d.map((t) => [formatarData(t.data), t.atividade, t.duracao_min == null ? null : Number(t.duracao_min), t.distancia_km == null ? null : Number(t.distancia_km)]),
    ])
  }

  return (
    <section className="bloco">
      <h2 className="titulo-icone"><span className="icone-folha"><Download size={18} /></span>Exportar dados</h2>
      <p className="nota">Planilhas (CSV) que abrem no Excel ou no Google Planilhas, para levar ao nutricionista ou ao médico.</p>
      <div className="linha-botoes">
        <button className="botao" onClick={medidas}>Medidas</button>
        <button className="botao" onClick={cargas}>Cargas</button>
        <button className="botao" onClick={treinos}>Treinos e corridas</button>
      </div>
      {erro && <p className="aviso">{erro}</p>}
    </section>
  )
}
