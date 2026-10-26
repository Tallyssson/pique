import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Flag, Ruler, TrendingDown } from 'lucide-react'
import { DATAS, DIAS_REAVALIACAO } from '../plan'
import { hojeISO, addDays, diffDays, formatarData, num } from '../utils'

// Peso que não caiu pelo menos isso em 3 semanas conta como parado.
const QUEDA_MINIMA_KG = 0.3

export default function Avisos({ perfil, irPara }) {
  const [medidas, setMedidas] = useState(null)
  const hoje = hojeISO()

  useEffect(() => {
    let ativo = true
    supabase.from('medidas').select('data,peso_kg').eq('user_id', perfil.id).order('data', { ascending: true })
      .then(({ data }) => { if (ativo) setMedidas(data || []) })
    return () => { ativo = false }
  }, [perfil.id])

  if (!medidas) return null

  const contagens = [['Prova objetiva', DATAS.prova], ['TAF', DATAS.taf]]
    .filter(([, d]) => d && d >= hoje)
    .map(([nome, d]) => [nome, diffDays(d, hoje), d])

  const ultimaData = medidas.length ? medidas[medidas.length - 1].data : perfil.data_inicio
  const proxima = addDays(ultimaData, DIAS_REAVALIACAO)
  const faltam = diffDays(proxima, hoje)

  // Compara a pesagem mais recente com a última feita 3 semanas ou mais antes dela.
  const pesos = medidas.filter((m) => m.peso_kg != null)
  const recente = pesos[pesos.length - 1]
  const base = recente && [...pesos].reverse().find((m) => diffDays(recente.data, m.data) >= 21)
  const pesoParado = recente && base && diffDays(hoje, recente.data) <= 14
    && Number(base.peso_kg) - Number(recente.peso_kg) < QUEDA_MINIMA_KG

  return (
    <>
      {faltam <= 2 && (
        <section className="bloco chamada">
          <h2 className="titulo-icone"><span className="icone-folha"><Ruler size={18} /></span>Hora da reavaliação</h2>
          <p className="nota">
            {medidas.length ? `A última medição foi em ${formatarData(ultimaData)}.` : 'Ainda não há medições registradas.'}{' '}
            Meça pela manhã, em jejum e antes do treino. Com os números novos dá para ajustar calorias, cargas e a fase da corrida.
          </p>
          <button className="botao primario" onClick={() => irPara('medidas')}>Registrar medidas</button>
        </section>
      )}

      {pesoParado && (
        <section className="bloco chamada alerta">
          <h2 className="titulo-icone"><span className="icone-folha"><TrendingDown size={18} /></span>Peso parado</h2>
          <p className="nota">
            De {formatarData(base.data)} ({num(base.peso_kg, 2)} kg) para {formatarData(recente.data)} ({num(recente.peso_kg, 2)} kg) o peso quase não mudou.
            O combinado no plano é reduzir um pouco as calorias. Vale conferir também se as porções estão sendo pesadas.
          </p>
        </section>
      )}

      {(contagens.length > 0 || faltam > 2) && (
        <div className="contagens">
          {contagens.map(([nome, dias, d]) => (
            <div key={nome} className="contagem-item">
              <Flag size={16} />
              <span className="contagem-num">{dias}</span>
              <span className="contagem-rot">{dias === 1 ? 'dia' : 'dias'} para {nome === 'TAF' ? 'o TAF' : 'a prova'} ({formatarData(d)})</span>
            </div>
          ))}
          {faltam > 2 && (
            <div className="contagem-item">
              <Ruler size={16} />
              <span className="contagem-num">{faltam}</span>
              <span className="contagem-rot">{faltam === 1 ? 'dia' : 'dias'} para a reavaliação</span>
            </div>
          )}
          {pesos.length > 0 && pesos.length < 4 && (
            <p className="nota">Dica: registre só o peso toda semana na aba Medidas; o app avisa se ele parar de cair por 3 semanas.</p>
          )}
        </div>
      )}
    </>
  )
}
