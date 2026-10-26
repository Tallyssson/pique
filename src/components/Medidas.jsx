import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { PESSOAS, CAMPOS_MEDIDA, MEDIDAS_INICIAIS } from '../plan'
import { hojeISO, formatarData, formatarCurta, num, lerNumero } from '../utils'
import LineChart from './LineChart'

const GRAFICOS = [['peso_kg', 'Peso', 'kg'], ['cintura', 'Cintura', 'cm'], ['abdomen', 'Abdômen', 'cm'], ['quadril', 'Quadril', 'cm']]

function indicadores(m, altura, sexo) {
  if (!m) return null
  const h = altura / 100
  const imc = m.peso_kg ? m.peso_kg / (h * h) : null
  const rce = m.cintura ? m.cintura / altura : null
  const rcq = m.cintura && m.quadril ? m.cintura / m.quadril : null
  const rfm = m.cintura ? (sexo === 'F' ? 76 : 64) - 20 * (altura / m.cintura) : null
  return { imc, rce, rcq, rfm }
}

export default function Medidas({ perfil }) {
  const [lista, setLista] = useState([])
  const [metrica, setMetrica] = useState('peso_kg')
  const [form, setForm] = useState(null)
  const [erro, setErro] = useState('')
  const sexo = PESSOAS[perfil.pessoa].sexo
  const altura = Number(perfil.altura_cm)

  async function carregar() {
    const { data, error } = await supabase.from('medidas').select('*').eq('user_id', perfil.id).order('data', { ascending: true })
    if (error) setErro('Não foi possível carregar as medidas.')
    else setLista(data)
  }
  useEffect(() => { carregar() }, [perfil.id])

  const primeira = lista[0]
  const ultima = lista[lista.length - 1]
  const ind = indicadores(ultima, altura, sexo)
  const refRcq = sexo === 'F' ? 0.85 : 0.9

  function novaMedicao() {
    setForm({ data: hojeISO(), ...Object.fromEntries(CAMPOS_MEDIDA.map(([c]) => [c, ''])) })
  }

  async function salvar(e) {
    e.preventDefault()
    const linha = { user_id: perfil.id, data: form.data }
    for (const [c] of CAMPOS_MEDIDA) linha[c] = lerNumero(form[c])
    const { error } = await supabase.from('medidas').insert(linha)
    if (error) { setErro('Não foi possível salvar a medição.'); return }
    setForm(null)
    carregar()
  }

  async function apagar(id) {
    if (!confirm('Apagar esta medição?')) return
    const { error } = await supabase.from('medidas').delete().eq('id', id)
    if (error) setErro('Não foi possível apagar.')
    else carregar()
  }

  async function importarIniciais() {
    const { error } = await supabase.from('medidas').insert({ user_id: perfil.id, data: MEDIDAS_INICIAIS.data, ...MEDIDAS_INICIAIS[perfil.pessoa] })
    if (error) setErro('Não foi possível registrar as medidas iniciais.')
    else carregar()
  }

  const [campoG, rotuloG, unidadeG] = GRAFICOS.find((g) => g[0] === metrica)
  const pontos = lista.filter((m) => m[campoG] != null).map((m) => ({ x: formatarCurta(m.data), y: Number(m[campoG]) }))

  function variacao(campo) {
    if (!primeira || !ultima || primeira === ultima || primeira[campo] == null || ultima[campo] == null) return null
    return Number(ultima[campo]) - Number(primeira[campo])
  }

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Medidas</h1>
      {erro && <p className="aviso">{erro}</p>}

      {lista.length === 0 && !form && (
        <section className="bloco">
          <p>Nenhuma medição registrada ainda.</p>
          <div className="linha-botoes">
            <button className="botao" onClick={importarIniciais}>Usar as medidas de {formatarData(MEDIDAS_INICIAIS.data)}</button>
            <button className="botao primario" onClick={novaMedicao}>Registrar medição</button>
          </div>
        </section>
      )}

      {ind && (
        <section className="bloco">
          <div className="bloco-topo">
            <h2>Situação atual</h2>
            <span className="contagem">{formatarData(ultima.data)}</span>
          </div>
          <div className="metas">
            <div><span className="meta-num">{num(ultima.peso_kg, 2)}</span><span className="meta-rot">kg</span></div>
            <div><span className="meta-num">{num(ind.imc)}</span><span className="meta-rot">IMC</span></div>
            <div className={ind.rce != null && ind.rce >= 0.5 ? 'alerta' : ''}><span className="meta-num">{num(ind.rce, 2)}</span><span className="meta-rot">cintura/altura (ideal abaixo de 0,50)</span></div>
            <div className={ind.rcq != null && ind.rcq >= refRcq ? 'alerta' : ''}><span className="meta-num">{num(ind.rcq, 2)}</span><span className="meta-rot">cintura/quadril (ideal abaixo de {num(refRcq, 2)})</span></div>
            <div><span className="meta-num">{num(ind.rfm, 0)}%</span><span className="meta-rot">gordura estimada</span></div>
          </div>
          {lista.length > 1 && (
            <ul className="variacoes">
              {[['peso_kg', 'Peso', 'kg'], ['cintura', 'Cintura', 'cm'], ['abdomen', 'Abdômen', 'cm']].map(([c, r, u]) => {
                const v = variacao(c)
                if (v == null) return null
                return <li key={c} className={v < 0 ? 'desceu' : v > 0 ? 'subiu' : ''}>{r}: {v > 0 ? '+' : ''}{num(v, 2)} {u} desde o início</li>
              })}
            </ul>
          )}
          <p className="nota">Gordura estimada pela relação altura/cintura (RFM). Serve para acompanhar a tendência, não como valor exato.</p>
        </section>
      )}

      {lista.length > 0 && (
        <section className="bloco">
          <div className="alternador pequeno" role="group" aria-label="Gráfico">
            {GRAFICOS.map(([c, r]) => (
              <button key={c} className={metrica === c ? 'alt ativo' : 'alt'} aria-pressed={metrica === c} onClick={() => setMetrica(c)}>{r}</button>
            ))}
          </div>
          <LineChart pontos={pontos} unidade={unidadeG} rotulo={rotuloG} />
        </section>
      )}

      {form ? (
        <form className="bloco" onSubmit={salvar}>
          <h2>Nova medição</h2>
          <p className="nota">Meça pela manhã, em jejum, antes do treino e com a fita sempre no mesmo ponto.</p>
          <label className="campo">
            <span>Data</span>
            <input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </label>
          <div className="grade-campos">
            {CAMPOS_MEDIDA.map(([c, r, u]) => (
              <label key={c} className="campo">
                <span>{r} ({u})</span>
                <input inputMode="decimal" value={form[c]} placeholder={ultima?.[c] != null ? num(ultima[c], 2) : ''} onChange={(e) => setForm({ ...form, [c]: e.target.value })} />
              </label>
            ))}
          </div>
          <div className="linha-botoes">
            <button type="button" className="botao" onClick={() => setForm(null)}>Cancelar</button>
            <button className="botao primario">Salvar medição</button>
          </div>
        </form>
      ) : lista.length > 0 && (
        <button className="botao primario largo" onClick={novaMedicao}>Registrar medição</button>
      )}

      {lista.length > 0 && (
        <section className="bloco">
          <h2>Histórico</h2>
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr><th>Data</th>{CAMPOS_MEDIDA.map(([c, r]) => <th key={c}>{r}</th>)}<th></th></tr>
              </thead>
              <tbody>
                {[...lista].reverse().map((m) => (
                  <tr key={m.id}>
                    <td>{formatarData(m.data)}</td>
                    {CAMPOS_MEDIDA.map(([c]) => <td key={c} className="num">{num(m[c], 2)}</td>)}
                    <td><button className="botao link perigo" onClick={() => apagar(m.id)}>Apagar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
