import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { TREINOS, CORRIDA, META_RITMO, natacaoDaSemana, semanaDoPlano, ATIVIDADES_PRINCIPAIS, SESSOES_POR_SEMANA } from '../plan'
import { hojeISO, addDays, mondayOf, formatarCurta, formatarData, formatarRitmo, num } from '../utils'
import LineChart from './LineChart'

export default function Treinos({ perfil }) {
  const [logs, setLogs] = useState([])
  const [sessoes, setSessoes] = useState([])
  const [corridas, setCorridas] = useState([])
  const [erro, setErro] = useState('')
  const hoje = hojeISO()
  const semanaAtual = semanaDoPlano(hoje, perfil.data_inicio)
  const seg = mondayOf(hoje)

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase.from('exercicio_logs').select('exercicio_id,cargas,data').eq('user_id', perfil.id).order('data', { ascending: false }),
      supabase.from('treino_logs').select('data,atividade').eq('user_id', perfil.id).eq('concluido', true).gte('data', addDays(seg, -21)),
    ]).then(([e, t]) => {
      if (!ativo) return
      if (e.error || t.error) { setErro('Não foi possível carregar o histórico.'); return }
      setLogs(e.data)
      setSessoes(t.data)
    })
    // Separada das outras: se a migração da corrida ainda não rodou, o resto da página continua funcionando.
    supabase.from('treino_logs').select('data,duracao_min,distancia_km').eq('user_id', perfil.id).eq('atividade', 'corrida')
      .not('duracao_min', 'is', null).not('distancia_km', 'is', null).order('data', { ascending: true })
      .then(({ data, error }) => { if (ativo && !error) setCorridas(data.filter((c) => c.distancia_km > 0)) })
    return () => { ativo = false }
  }, [perfil.id, seg])

  const ritmos = corridas.map((c) => ({ ...c, ritmo: c.duracao_min / c.distancia_km }))
  const melhorRitmo = ritmos.length ? Math.min(...ritmos.map((c) => c.ritmo)) : null
  const maiorDistancia = ritmos.length ? Math.max(...ritmos.map((c) => Number(c.distancia_km))) : null
  const meta = META_RITMO[perfil.pessoa]

  const stats = {}
  for (const l of logs) {
    const vals = (l.cargas || []).filter((v) => v != null)
    if (!vals.length) continue
    const s = stats[l.exercicio_id] || (stats[l.exercicio_id] = {})
    if (!s.ultima) { s.ultima = vals; s.data = l.data }
    const maior = Math.max(...vals)
    if (s.maior == null || maior > s.maior) s.maior = maior
  }

  const semanas = [3, 2, 1, 0].map((k) => {
    const inicio = addDays(seg, -7 * k)
    const fim = addDays(inicio, 6)
    const feitas = sessoes.filter((s) => s.data >= inicio && s.data <= fim && ATIVIDADES_PRINCIPAIS.includes(s.atividade)).length
    return { inicio, feitas, atual: k === 0 }
  })

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Treinos</h1>
      {erro && <p className="aviso">{erro}</p>}

      <section className="bloco">
        <h2>Constância</h2>
        <p className="nota">Sessões concluídas por semana: 3 musculações, 3 corridas e 1 natação.</p>
        <ul className="frequencia">
          {semanas.map((s) => (
            <li key={s.inicio}>
              <span className="freq-rotulo">{s.atual ? 'Esta semana' : `Semana de ${formatarCurta(s.inicio)}`}</span>
              <span className="freq-barra"><span style={{ width: `${(s.feitas / SESSOES_POR_SEMANA) * 100}%` }} /></span>
              <span className="freq-num">{s.feitas}/{SESSOES_POR_SEMANA}</span>
            </li>
          ))}
        </ul>
      </section>

      {Object.entries(TREINOS).map(([letra, ficha]) => (
        <section key={letra} className="bloco">
          <h2>{ficha.nome}</h2>
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr><th>Exercício</th><th>Séries</th><th>Última</th><th>Maior</th></tr>
              </thead>
              <tbody>
                {ficha.exercicios.map((e) => {
                  const s = stats[e.id]
                  return (
                    <tr key={e.id}>
                      <td>{e.nome}</td>
                      <td className="num">{e.series} x {e.reps}</td>
                      <td className="num">{e.semCarga ? '' : s ? `${s.ultima.map((v) => num(v)).join(' / ')} kg` : '-'}</td>
                      <td className="num">{e.semCarga ? '' : s ? `${num(s.maior)} kg` : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="bloco">
        <h2>Ritmo da corrida</h2>
        {ritmos.length === 0 ? (
          <p className="nota">Registre o tempo e a distância da corrida na tela Hoje e a evolução do ritmo aparece aqui.</p>
        ) : (
          <>
            <div className="metas">
              <div><span className="meta-num">{formatarRitmo(ritmos[ritmos.length - 1].ritmo)}</span><span className="meta-rot">último ritmo (min/km)</span></div>
              <div><span className="meta-num">{formatarRitmo(melhorRitmo)}</span><span className="meta-rot">melhor ritmo</span></div>
              <div><span className="meta-num">{num(maiorDistancia, 2)}</span><span className="meta-rot">maior distância (km)</span></div>
              {meta && <div className={melhorRitmo > meta ? 'alerta' : ''}><span className="meta-num">{formatarRitmo(meta)}</span><span className="meta-rot">meta para o TAF</span></div>}
            </div>
            <LineChart
              pontos={ritmos.map((c) => ({ x: formatarCurta(c.data), y: c.ritmo }))}
              unidade="min/km"
              rotulo="Ritmo"
              formatar={formatarRitmo}
            />
            <p className="nota">Quanto mais baixo, mais rápido. {meta && melhorRitmo > meta ? `Faltam ${formatarRitmo(melhorRitmo - meta)} por km para a meta.` : meta ? 'Meta alcançada!' : ''}</p>
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead><tr><th>Data</th><th>Tempo</th><th>Distância</th><th>Ritmo</th></tr></thead>
                <tbody>
                  {[...ritmos].reverse().slice(0, 8).map((c) => (
                    <tr key={c.data}>
                      <td>{formatarData(c.data)}</td>
                      <td className="num">{num(c.duracao_min, 1)} min</td>
                      <td className="num">{num(c.distancia_km, 2)} km</td>
                      <td className="num">{formatarRitmo(c.ritmo)}/km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="bloco">
        <h2>Progressão da corrida</h2>
        <p className="nota">Plano iniciado em {formatarData(perfil.data_inicio)}. A partir da semana 9, mantenha 30 min contínuos e comece a trabalhar ritmo para o TAF.</p>
        <ol className="progressao">
          {CORRIDA.map((c) => (
            <li key={c.semana} className={c.semana === semanaAtual ? 'agora' : c.semana < semanaAtual ? 'passou' : ''}>
              <span className="prog-sem">Semana {c.semana}</span>
              <span>{c.texto}{c.repeticoes > 1 ? `, ${c.repeticoes} vezes` : ''}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="bloco">
        <h2>Natação desta semana</h2>
        <dl className="etapas">
          {natacaoDaSemana(Math.max(semanaAtual, 1)).map(([etapa, texto]) => (
            <div key={etapa}><dt>{etapa}</dt><dd>{texto}</dd></div>
          ))}
        </dl>
        <p className="nota">O bloco principal aumenta a cada duas semanas: 8 x 50 m, depois 10 x 50 m, depois 6 x 100 m.</p>
      </section>
    </div>
  )
}
