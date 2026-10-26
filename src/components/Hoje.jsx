import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { ChevronLeft, ChevronRight, Dumbbell, Footprints, Waves, Moon, UtensilsCrossed, Droplets, Check, Plus, Minus, Sparkles } from 'lucide-react'
import {
  PESSOAS, TREINOS, ORIENTACAO_MUSCULACAO, ORIENTACAO_CORRIDA, ATIVIDADES_PRINCIPAIS,
  planoDoDia, siglaDoDia, corridaDaSemana, natacaoDaSemana,
  REFEICOES_FIXAS, CARDAPIO, MARMITAS, JANTARES, LIVRE,
} from '../plan'
import { hojeISO, addDays, mondayOf, formatarDataLonga, formatarData, formatarRitmo, fromISO, lerNumero, num, DIAS_CURTOS } from '../utils'
import { TimerCorrida, TimerDescanso } from './Cronometro'
import Avisos from './Avisos'
import Casal from './Casal'

export default function Hoje({ perfil, irPara }) {
  const uid = perfil.id
  const p = perfil.pessoa
  const [data, setData] = useState(hojeISO())
  const [treino, setTreino] = useState({})
  const [ex, setEx] = useState({})
  const [ultimas, setUltimas] = useState({})
  const [ref, setRef] = useState({})
  const [agua, setAgua] = useState(0)
  const [semana, setSemana] = useState([])
  const [livres, setLivres] = useState([])
  const [corrida, setCorrida] = useState({ duracao: '', distancia: '' })
  const [erro, setErro] = useState('')

  const plano = planoDoDia(data, perfil.data_inicio)
  const temTreinoCedo = plano.atividades.some((a) => a.tipo === 'musculacao' || a.tipo === 'natacao')

  useEffect(() => {
    let ativo = true
    async function carregar() {
      setErro('')
      const seg = mondayOf(data)
      const res = await Promise.all([
        supabase.from('treino_logs').select('atividade,concluido,duracao_min,distancia_km').eq('user_id', uid).eq('data', data),
        supabase.from('exercicio_logs').select('exercicio_id,cargas,feito').eq('user_id', uid).eq('data', data),
        supabase.from('exercicio_logs').select('exercicio_id,cargas').eq('user_id', uid).lt('data', data).order('data', { ascending: false }).limit(120),
        supabase.from('refeicao_logs').select('refeicao,feito,escolha').eq('user_id', uid).eq('data', data),
        supabase.from('agua_logs').select('ml').eq('user_id', uid).eq('data', data).maybeSingle(),
        supabase.from('treino_logs').select('data,atividade,concluido').eq('user_id', uid).gte('data', seg).lte('data', addDays(seg, 6)),
        supabase.from('refeicao_logs').select('data,refeicao').eq('user_id', uid).eq('escolha', LIVRE).eq('feito', true).gte('data', seg).lte('data', addDays(seg, 6)),
      ])
      if (!ativo) return
      if (res.some((r) => r.error)) { setErro('Não foi possível carregar os registros. Verifique a conexão.'); return }
      const [t, e, u, r, a, s, lv] = res
      setTreino(Object.fromEntries(t.data.map((l) => [l.atividade, l.concluido])))
      const run = t.data.find((l) => l.atividade === 'corrida')
      setCorrida({ duracao: run?.duracao_min != null ? num(run.duracao_min, 2) : '', distancia: run?.distancia_km != null ? num(run.distancia_km, 2) : '' })
      setLivres(lv.data)
      setEx(Object.fromEntries(e.data.map((l) => [l.exercicio_id, { cargas: l.cargas || [], feito: l.feito }])))
      const ult = {}
      for (const l of u.data) {
        if (!ult[l.exercicio_id] && (l.cargas || []).some((v) => v != null)) ult[l.exercicio_id] = l.cargas
      }
      setUltimas(ult)
      setRef(Object.fromEntries(r.data.map((l) => [l.refeicao, { feito: l.feito, escolha: l.escolha }])))
      setAgua(a.data?.ml || 0)
      setSemana(s.data)
    }
    carregar()
    return () => { ativo = false }
  }, [data, uid])

  async function salvar(tabela, linha, conflito) {
    const { error } = await supabase.from(tabela).upsert({ user_id: uid, data, ...linha }, { onConflict: conflito })
    if (error) setErro('Não foi possível salvar. Tente de novo.')
  }

  function alternarAtividade(atividade) {
    const novo = !treino[atividade]
    setTreino({ ...treino, [atividade]: novo })
    setSemana((sem) => [...sem.filter((l) => !(l.data === data && l.atividade === atividade)), { data, atividade, concluido: novo }])
    salvar('treino_logs', { atividade, concluido: novo }, 'user_id,data,atividade')
  }

  // Registrar tempo ou distância já conta a corrida como concluída.
  function gravarCorrida(mudanca = {}) {
    const atual = { ...corrida, ...mudanca }
    setCorrida(atual)
    const duracao_min = lerNumero(atual.duracao)
    const distancia_km = lerNumero(atual.distancia)
    const linha = { atividade: 'corrida', duracao_min, distancia_km }
    if ((duracao_min || distancia_km) && !treino.corrida) {
      linha.concluido = true
      setTreino({ ...treino, corrida: true })
      setSemana((sem) => [...sem.filter((l) => !(l.data === data && l.atividade === 'corrida')), { data, atividade: 'corrida', concluido: true }])
    }
    salvar('treino_logs', linha, 'user_id,data,atividade')
  }

  function mudarCarga(id, i, valor) {
    setEx((prev) => {
      const atual = prev[id] || { cargas: [], feito: false }
      const cargas = [...atual.cargas]
      cargas[i] = valor
      return { ...prev, [id]: { ...atual, cargas } }
    })
  }

  function gravarExercicio(id, mudanca = {}) {
    const atual = { cargas: [], feito: false, ...ex[id], ...mudanca }
    setEx((prev) => ({ ...prev, [id]: atual }))
    const cargas = atual.cargas.map(lerNumero)
    salvar('exercicio_logs', { exercicio_id: id, cargas, feito: atual.feito }, 'user_id,data,exercicio_id')
  }

  function gravarRefeicao(id, novo) {
    setRef({ ...ref, [id]: novo })
    setLivres((ls) => {
      const outras = ls.filter((l) => !(l.data === data && l.refeicao === id))
      return novo.feito && novo.escolha === LIVRE ? [...outras, { data, refeicao: id }] : outras
    })
    salvar('refeicao_logs', { refeicao: id, ...novo }, 'user_id,data,refeicao')
  }

  function alternarRefeicao(id, escolhaPadrao) {
    const atual = ref[id] || {}
    gravarRefeicao(id, { feito: !atual.feito, escolha: atual.escolha || escolhaPadrao || null })
  }

  // Escolher a refeição livre já marca como feita.
  function escolherOpcao(id, escolha) {
    gravarRefeicao(id, { feito: escolha === LIVRE || ref[id]?.feito || false, escolha })
  }

  function mudarAgua(delta) {
    const novo = Math.max(0, agua + delta)
    setAgua(novo)
    salvar('agua_logs', { ml: novo }, 'user_id,data')
  }

  // Refeições do dia
  const dia = CARDAPIO[plano.dow]
  const marmita = dia.almoco ? MARMITAS[dia.almoco] : null
  const jantar = dia.jantar ? JANTARES[dia.jantar] : null
  const refeicoes = [
    { id: 'cafe', nome: REFEICOES_FIXAS.cafe.nome, opcoes: REFEICOES_FIXAS.cafe[p] },
    { id: 'pos', nome: temTreinoCedo ? REFEICOES_FIXAS.pos.nome : REFEICOES_FIXAS.pos.nomeSemTreino, opcoes: REFEICOES_FIXAS.pos[p] },
    { id: 'almoco', nome: 'Almoço', opcoes: [marmita ? `${marmita.nome}: ${marmita[p]} + salada à vontade` : dia.almocoTexto] },
    { id: 'lanche', nome: REFEICOES_FIXAS.lanche.nome, opcoes: REFEICOES_FIXAS.lanche[p] },
    { id: 'jantar', nome: 'Jantar', opcoes: [jantar ? `${jantar.nome}: ${jantar[p]}` : dia.jantarTexto] },
  ].map((r) => (r.opcoes.includes(LIVRE) ? r : { ...r, opcoes: [...r.opcoes, LIVRE] }))
  const refeicoesFeitas = refeicoes.filter((r) => ref[r.id]?.feito).length
  const metaAgua = PESSOAS[p].metas.agua
  const previstas = plano.atividades.map((a) => a.tipo).filter((t) => ATIVIDADES_PRINCIPAIS.includes(t))
  const concluidas = previstas.filter((t) => treino[t]).length

  return (
    <div className="pagina">
      <header className="hero">
        <div className="navega">
          <button className="seta" onClick={() => setData(addDays(data, -1))} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
          <button className="pilula-data" onClick={() => setData(hojeISO())} disabled={data === hojeISO()}>
            {data === hojeISO() ? 'Hoje' : 'Voltar para hoje'}
          </button>
          <button className="seta" onClick={() => setData(addDays(data, 1))} aria-label="Próximo dia"><ChevronRight size={20} /></button>
        </div>
        <p className="data-longa">{formatarDataLonga(data)}</p>
        <h1 className="titulo-dia">{plano.titulo}</h1>
        {plano.semana >= 1 && <span className="selo"><Sparkles size={14} /> Semana {plano.semana} do plano</span>}
        <div className="resumo">
          <div className="resumo-item">
            <span className="resumo-icone"><Dumbbell size={18} /></span>
            <span className="resumo-num">{previstas.length ? `${concluidas}/${previstas.length}` : 'Livre'}</span>
            <span className="resumo-rot">treino</span>
          </div>
          <div className="resumo-item">
            <span className="resumo-icone"><UtensilsCrossed size={18} /></span>
            <span className="resumo-num">{refeicoesFeitas}/{refeicoes.length}</span>
            <span className="resumo-rot">refeições</span>
          </div>
          <div className="resumo-item">
            <span className="resumo-icone"><Droplets size={18} /></span>
            <span className="resumo-num">{num(agua / 1000, 1)} L</span>
            <span className="resumo-rot">de {num(metaAgua / 1000, 1)} L</span>
          </div>
        </div>
      </header>

      <Regua data={data} inicio={perfil.data_inicio} semana={semana} onEscolher={setData} />

      {erro && <p className="aviso" role="alert">{erro}</p>}
      {data === hojeISO() && <Avisos perfil={perfil} irPara={irPara} />}
      <Casal perfil={perfil} data={data} minhaSemana={semana} />
      {plano.antes && <p className="aviso">O plano começa na semana de {formatarData(mondayOf(perfil.data_inicio))}.</p>}

      {plano.atividades.map((a) => {
        if (a.tipo === 'musculacao') {
          const ficha = TREINOS[a.treino]
          return (
            <section key="musc" className="bloco">
              <div className="bloco-topo">
                <h2 className="titulo-icone"><span className="icone-folha"><Dumbbell size={18} /></span>{ficha.nome}</h2>
                <Concluir ativo={treino.musculacao} onClick={() => alternarAtividade('musculacao')} />
              </div>
              <p className="nota">{ORIENTACAO_MUSCULACAO}</p>
              <TimerDescanso />
              <ol className="exercicios">
                {ficha.exercicios.map((e) => {
                  const log = ex[e.id] || { cargas: [], feito: false }
                  const ult = ultimas[e.id]
                  return (
                    <li key={e.id} className={log.feito ? 'ex feito' : 'ex'}>
                      <div className="ex-cab">
                        <div>
                          <strong className="ex-nome">{e.nome}</strong>
                          <span className="presc">{e.series} x {e.reps}</span>
                          {e.obs && <span className="obs">{e.obs}</span>}
                        </div>
                        <button className="marcar" aria-pressed={log.feito} onClick={() => gravarExercicio(e.id, { feito: !log.feito })}>
                          {log.feito && <Check size={18} strokeWidth={2.6} />}
                          <span className="sr">{log.feito ? 'Feito' : 'Marcar como feito'}</span>
                        </button>
                      </div>
                      {!e.semCarga && (
                        <div className="series">
                          {Array.from({ length: e.series }).map((_, i) => (
                            <label key={i} className="serie">
                              <span>Série {i + 1}</span>
                              <input
                                inputMode="decimal"
                                value={log.cargas[i] ?? ''}
                                placeholder={ult?.[i] != null ? num(ult[i]) : 'kg'}
                                onChange={(ev) => mudarCarga(e.id, i, ev.target.value)}
                                onBlur={() => gravarExercicio(e.id)}
                              />
                            </label>
                          ))}
                          <span className="unid">kg</span>
                        </div>
                      )}
                      {!e.semCarga && ult && (
                        <p className="ultima">Última vez: {ult.filter((v) => v != null).map((v) => num(v)).join(' / ')} kg</p>
                      )}
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        }
        if (a.tipo === 'corrida') {
          const c = corridaDaSemana(plano.semana)
          const duracao = lerNumero(corrida.duracao)
          const distancia = lerNumero(corrida.distancia)
          return (
            <section key="corrida" className="bloco">
              <div className="bloco-topo">
                <h2 className="titulo-icone"><span className="icone-folha"><Footprints size={18} /></span>Corrida</h2>
                <Concluir ativo={treino.corrida} onClick={() => alternarAtividade('corrida')} />
              </div>
              <p className="destaque">{c.texto}</p>
              {c.repeticoes > 1 && <p className="presc-grande">Repetir {c.repeticoes} vezes</p>}
              <p className="nota">{ORIENTACAO_CORRIDA}</p>
              <TimerCorrida key={`${data}-${c.semana}`} corrida={c} onFim={(min) => gravarCorrida({ duracao: num(min, 2) })} />
              <div className="grade-campos">
                <label className="campo">
                  <span>Tempo total (min)</span>
                  <input inputMode="decimal" value={corrida.duracao} placeholder="ex.: 24" onChange={(e) => setCorrida({ ...corrida, duracao: e.target.value })} onBlur={() => gravarCorrida()} />
                </label>
                <label className="campo">
                  <span>Distância (km)</span>
                  <input inputMode="decimal" value={corrida.distancia} placeholder="ex.: 3,2" onChange={(e) => setCorrida({ ...corrida, distancia: e.target.value })} onBlur={() => gravarCorrida()} />
                </label>
              </div>
              {duracao > 0 && distancia > 0 && (
                <p className="ritmo">Ritmo médio: <strong>{formatarRitmo(duracao / distancia)}</strong> por km</p>
              )}
            </section>
          )
        }
        if (a.tipo === 'natacao') {
          return (
            <section key="natacao" className="bloco">
              <div className="bloco-topo">
                <h2 className="titulo-icone"><span className="icone-folha"><Waves size={18} /></span>Natação</h2>
                <Concluir ativo={treino.natacao} onClick={() => alternarAtividade('natacao')} />
              </div>
              <dl className="etapas">
                {natacaoDaSemana(plano.semana).map(([etapa, texto]) => (
                  <div key={etapa}><dt>{etapa}</dt><dd>{texto}</dd></div>
                ))}
              </dl>
            </section>
          )
        }
        if (a.tipo === 'caminhada') {
          return (
            <section key="caminhada" className="bloco">
              <div className="bloco-topo">
                <h2 className="titulo-icone"><span className="icone-folha"><Footprints size={18} /></span>Caminhada leve</h2>
                <Concluir ativo={treino.caminhada} onClick={() => alternarAtividade('caminhada')} />
              </div>
              <p className="nota">Opcional: 20 a 30 min depois das 13h, sem pressa.</p>
            </section>
          )
        }
        return (
          <section key="descanso" className="bloco">
            <h2 className="titulo-icone"><span className="icone-folha"><Moon size={18} /></span>Descanso</h2>
            <p className="nota">{dia.obs || 'Dia de recuperar.'}</p>
          </section>
        )
      })}

      <section className="bloco">
        <div className="bloco-topo">
          <h2 className="titulo-icone"><span className="icone-folha"><UtensilsCrossed size={18} /></span>Refeições</h2>
          <span className="contagem">{refeicoesFeitas} de {refeicoes.length}</span>
        </div>
        <p className="nota">
          {livres.length === 0 && 'Refeição livre da semana: ainda disponível. Escolha "Refeição livre" em qualquer refeição.'}
          {livres.length === 1 && 'Refeição livre da semana: já usada.'}
          {livres.length > 1 && `Já foram ${livres.length} refeições livres nesta semana. O plano prevê uma.`}
        </p>
        <ul className="refeicoes">
          {refeicoes.map((r) => {
            const estado = ref[r.id] || {}
            const escolha = estado.escolha && r.opcoes.includes(estado.escolha) ? estado.escolha : r.opcoes[0]
            return (
              <li key={r.id} className={estado.feito ? 'ref feito' : 'ref'}>
                <button className="marcar" aria-pressed={!!estado.feito} onClick={() => alternarRefeicao(r.id, escolha)}>
                  {estado.feito && <Check size={18} strokeWidth={2.6} />}
                  <span className="sr">{estado.feito ? 'Feita' : 'Marcar como feita'}</span>
                </button>
                <div className="ref-corpo">
                  <strong>{r.nome}</strong>
                  {r.opcoes.length > 1 ? (
                    <select value={escolha} onChange={(e) => escolherOpcao(r.id, e.target.value)} aria-label={`Opção de ${r.nome.toLowerCase()}`}>
                      {r.opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <span>{r.opcoes[0]}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="bloco">
        <div className="bloco-topo">
          <h2 className="titulo-icone"><span className="icone-folha"><Droplets size={18} /></span>Água</h2>
          <span className="contagem">{num(agua / 1000, 2)} de {num(metaAgua / 1000, 1)} L</span>
        </div>
        <div className="barra" role="progressbar" aria-valuemin={0} aria-valuemax={metaAgua} aria-valuenow={agua}>
          <span style={{ width: `${Math.min(100, (agua / metaAgua) * 100)}%` }} />
        </div>
        <div className="linha-botoes">
          <button className="botao" onClick={() => mudarAgua(-250)} disabled={agua === 0}><Minus size={16} /> 250 ml</button>
          <button className="botao primario" onClick={() => mudarAgua(250)}><Plus size={16} /> Beber 250 ml</button>
        </div>
      </section>
    </div>
  )
}

function Concluir({ ativo, onClick }) {
  return (
    <button className={ativo ? 'concluir sim' : 'concluir'} aria-pressed={!!ativo} onClick={onClick}>
      {ativo && <Check size={15} strokeWidth={2.6} />}
      {ativo ? 'Concluído' : 'Concluir'}
    </button>
  )
}

function Regua({ data, inicio, semana, onEscolher }) {
  const seg = mondayOf(data)
  const hoje = hojeISO()
  return (
    <div className="regua" role="group" aria-label="Semana">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(seg, i)
        const plano = planoDoDia(d, inicio)
        const previstas = plano.atividades.map((a) => a.tipo).filter((t) => ATIVIDADES_PRINCIPAIS.includes(t))
        const feitas = previstas.filter((t) => semana.some((l) => l.data === d && l.atividade === t && l.concluido))
        let estado = ''
        if (previstas.length && feitas.length === previstas.length) estado = 'completo'
        else if (feitas.length) estado = 'parcial'
        else if (previstas.length && d < hoje) estado = 'perdido'
        const sigla = siglaDoDia(d, inicio)
        return (
          <button key={d} className={`dia ${estado} ${d === data ? 'atual' : ''}`} onClick={() => onEscolher(d)} aria-label={`${DIAS_CURTOS[fromISO(d).getDay()]}, ${plano.titulo}`}>
            <span className="dia-nome">{DIAS_CURTOS[fromISO(d).getDay()]}</span>
            <span className="dia-sigla">{sigla || '·'}</span>
          </button>
        )
      })}
    </div>
  )
}
