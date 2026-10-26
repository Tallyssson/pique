import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Heart, Dumbbell, UtensilsCrossed, Droplets } from 'lucide-react'
import { PESSOAS, ATIVIDADES_PRINCIPAIS, planoDoDia } from '../plan'
import { addDays, mondayOf, num } from '../utils'

const REFEICOES_DO_DIA = 5

const sessoes = (logs) => logs.filter((l) => l.concluido && ATIVIDADES_PRINCIPAIS.includes(l.atividade)).length

// Resumo do dia da outra pessoa do casal. Só aparece depois de vincular as contas no Perfil.
export default function Casal({ perfil, data, minhaSemana }) {
  const [par, setPar] = useState(null)
  const [dados, setDados] = useState(null)

  useEffect(() => {
    if (!perfil.casal_id) return
    let ativo = true
    supabase.from('profiles').select('id,nome,pessoa,data_inicio').eq('casal_id', perfil.casal_id).neq('id', perfil.id).maybeSingle()
      .then(({ data: p }) => { if (ativo) setPar(p) })
    return () => { ativo = false }
  }, [perfil.casal_id, perfil.id])

  useEffect(() => {
    if (!par) return
    let ativo = true
    const seg = mondayOf(data)
    Promise.all([
      supabase.from('treino_logs').select('data,atividade,concluido').eq('user_id', par.id).gte('data', seg).lte('data', addDays(seg, 6)),
      supabase.from('refeicao_logs').select('refeicao').eq('user_id', par.id).eq('data', data).eq('feito', true),
      supabase.from('agua_logs').select('ml').eq('user_id', par.id).eq('data', data).maybeSingle(),
    ]).then(([t, r, a]) => {
      if (!ativo || t.error || r.error) return
      setDados({ semana: t.data, refeicoes: r.data.length, agua: a.data?.ml || 0 })
    })
    return () => { ativo = false }
  }, [par, data])

  if (!par || !dados) return null

  const plano = planoDoDia(data, par.data_inicio)
  const previstas = plano.atividades.map((a) => a.tipo).filter((t) => ATIVIDADES_PRINCIPAIS.includes(t))
  const feitas = previstas.filter((t) => dados.semana.some((l) => l.data === data && l.atividade === t && l.concluido)).length
  const metaAgua = PESSOAS[par.pessoa].metas.agua

  return (
    <section className={`bloco casal p-${par.pessoa}`}>
      <div className="bloco-topo">
        <h2 className="titulo-icone"><span className="icone-folha"><Heart size={18} /></span>{par.nome}</h2>
        <span className="contagem">Semana: você {sessoes(minhaSemana)} · {par.nome} {sessoes(dados.semana)}</span>
      </div>
      <div className="resumo">
        <div className="resumo-item">
          <span className="resumo-icone"><Dumbbell size={18} /></span>
          <span className="resumo-num">{previstas.length ? `${feitas}/${previstas.length}` : 'Livre'}</span>
          <span className="resumo-rot">treino</span>
        </div>
        <div className="resumo-item">
          <span className="resumo-icone"><UtensilsCrossed size={18} /></span>
          <span className="resumo-num">{dados.refeicoes}/{REFEICOES_DO_DIA}</span>
          <span className="resumo-rot">refeições</span>
        </div>
        <div className="resumo-item">
          <span className="resumo-icone"><Droplets size={18} /></span>
          <span className="resumo-num">{num(dados.agua / 1000, 1)} L</span>
          <span className="resumo-rot">de {num(metaAgua / 1000, 1)} L</span>
        </div>
      </div>
    </section>
  )
}
