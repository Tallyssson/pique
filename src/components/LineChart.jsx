import { num } from '../utils'

export default function LineChart({ pontos, unidade, rotulo, formatar = num }) {
  if (pontos.length < 2) return <p className="nota">Com duas medições ou mais, o gráfico aparece aqui.</p>
  const W = 340, H = 170
  const pad = { l: 44, r: 14, t: 14, b: 26 }
  const ys = pontos.map((p) => p.y)
  let min = Math.min(...ys), max = Math.max(...ys)
  if (min === max) { min -= 1; max += 1 }
  const folga = (max - min) * 0.15
  min -= folga; max += folga
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (pontos.length - 1)
  const y = (v) => pad.t + ((max - v) * (H - pad.t - pad.b)) / (max - min)
  const d = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ')
  const marcas = [max, (max + min) / 2, min]
  return (
    <svg className="grafico" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${rotulo}: de ${formatar(ys[0])} para ${formatar(ys[ys.length - 1])} ${unidade}`}>
      {marcas.map((m) => (
        <g key={m}>
          <line x1={pad.l} x2={W - pad.r} y1={y(m)} y2={y(m)} className="grade" />
          <text x={pad.l - 6} y={y(m) + 4} textAnchor="end" className="eixo">{formatar(m)}</text>
        </g>
      ))}
      <path d={d} className="linha" />
      {pontos.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.y)} r="4" className="ponto" />)}
      <text x={x(0)} y={H - 6} textAnchor="start" className="eixo">{pontos[0].x}</text>
      <text x={x(pontos.length - 1)} y={H - 6} textAnchor="end" className="eixo">{pontos[pontos.length - 1].x}</text>
    </svg>
  )
}
