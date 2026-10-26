import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Timer, X } from 'lucide-react'
import { DESCANSO_SERIES } from '../plan'
import { formatarTempo } from '../utils'

// O som precisa ser liberado num toque do usuário (exigência do iPhone), por isso prepararSom vai nos botões.
let audio = null
function prepararSom() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)()
    audio.resume()
  } catch { audio = null }
}

function bipe(vezes = 1) {
  if (navigator.vibrate) navigator.vibrate(Array.from({ length: vezes * 2 - 1 }, (_, i) => (i % 2 ? 120 : 280)))
  if (!audio) return
  for (let i = 0; i < vezes; i++) {
    const t = audio.currentTime + i * 0.32
    const osc = audio.createOscillator()
    const vol = audio.createGain()
    osc.frequency.value = 880
    vol.gain.setValueAtTime(0.3, t)
    vol.gain.exponentialRampToValueAtTime(0.001, t + 0.26)
    osc.connect(vol).connect(audio.destination)
    osc.start(t)
    osc.stop(t + 0.26)
  }
}

// Conta pelo relógio do aparelho, não por ticks: não atrasa se o navegador desacelerar o intervalo.
function useCronometro() {
  const [estado, setEstado] = useState({ inicio: null, acumulado: 0 })
  const [, setTick] = useState(0)
  const rodando = estado.inicio != null
  useEffect(() => {
    if (!rodando) return
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [rodando])
  const decorrido = (estado.acumulado + (rodando ? Date.now() - estado.inicio : 0)) / 1000
  return {
    rodando,
    decorrido,
    iniciar: () => setEstado((e) => (e.inicio != null ? e : { ...e, inicio: Date.now() })),
    pausar: () => setEstado((e) => (e.inicio == null ? e : { inicio: null, acumulado: e.acumulado + Date.now() - e.inicio })),
    zerar: () => setEstado({ inicio: null, acumulado: 0 }),
  }
}

// Mantém a tela acesa enquanto o cronômetro corre (quando o navegador permite).
function useTelaLigada(ativo) {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return
    let trava = null
    let cancelado = false
    const pedir = () => navigator.wakeLock.request('screen')
      .then((t) => { if (cancelado) t.release(); else trava = t })
      .catch(() => {})
    const aoVoltar = () => { if (document.visibilityState === 'visible') pedir() }
    pedir()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      cancelado = true
      trava?.release().catch(() => {})
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [ativo])
}

export function TimerCorrida({ corrida, onFim }) {
  const fases = []
  for (let i = 0; i < corrida.repeticoes; i++) {
    fases.push({ nome: corrida.caminhada ? 'Trote' : 'Corrida', seg: corrida.trote * 60, rodada: i + 1 })
    if (corrida.caminhada) fases.push({ nome: 'Caminhada', seg: corrida.caminhada * 60, rodada: i + 1 })
  }
  const total = fases.reduce((s, f) => s + f.seg, 0)
  const crono = useCronometro()
  const t = Math.min(crono.decorrido, total)
  const acabou = crono.decorrido >= total

  let idx = 0
  let inicioFase = 0
  while (idx < fases.length - 1 && t >= inicioFase + fases[idx].seg) { inicioFase += fases[idx].seg; idx++ }
  const fase = fases[idx]

  useTelaLigada(crono.rodando)

  const ultimaFase = useRef(0)
  useEffect(() => {
    if (!crono.rodando || idx === ultimaFase.current) return
    ultimaFase.current = idx
    bipe(fases[idx].nome === 'Caminhada' ? 1 : 2)
  }, [idx, crono.rodando])

  useEffect(() => {
    if (!acabou || !crono.rodando) return
    crono.pausar()
    bipe(3)
    onFim?.(total / 60)
  }, [acabou, crono.rodando])

  function iniciar() {
    prepararSom()
    if (acabou) { crono.zerar(); ultimaFase.current = 0 }
    crono.iniciar()
  }

  function zerar() {
    crono.zerar()
    ultimaFase.current = 0
  }

  const comecou = crono.decorrido > 0
  return (
    <div className={`cronometro ${fase.nome === 'Caminhada' ? 'calmo' : ''}`}>
      <div className="crono-topo">
        <span className="crono-fase">{acabou ? 'Terminou' : comecou ? fase.nome : 'Cronômetro'}</span>
        {corrida.repeticoes > 1 && <span className="crono-rodada">Rodada {fase.rodada} de {corrida.repeticoes}</span>}
      </div>
      <span className="crono-tempo">{acabou ? formatarTempo(total) : formatarTempo(inicioFase + fase.seg - t)}</span>
      <div className="barra fina" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.round(t)}>
        <span style={{ width: `${(t / total) * 100}%` }} />
      </div>
      <p className="nota">
        {acabou ? 'Boa! O tempo foi preenchido abaixo.' : `${formatarTempo(t)} de ${formatarTempo(total)} no total. Apita a cada troca.`}
      </p>
      <div className="linha-botoes">
        {comecou && <button className="botao" onClick={zerar}><RotateCcw size={16} /> Zerar</button>}
        {crono.rodando
          ? <button className="botao primario" onClick={crono.pausar}><Pause size={16} /> Pausar</button>
          : <button className="botao primario" onClick={iniciar}><Play size={16} /> {acabou ? 'De novo' : comecou ? 'Continuar' : 'Iniciar'}</button>}
      </div>
    </div>
  )
}

export function TimerDescanso() {
  const [alvo, setAlvo] = useState(null)
  const crono = useCronometro()
  const falta = alvo == null ? 0 : alvo - crono.decorrido

  useTelaLigada(crono.rodando)

  useEffect(() => {
    if (alvo == null || falta > 0) return
    bipe(2)
    crono.zerar()
    setAlvo(null)
  }, [alvo, falta <= 0])

  function comecar(seg) {
    prepararSom()
    crono.zerar()
    setAlvo(seg)
    crono.iniciar()
  }

  function cancelar() {
    crono.zerar()
    setAlvo(null)
  }

  if (alvo != null) {
    return (
      <div className="descanso ativo">
        <Timer size={18} />
        <span className="descanso-tempo">{formatarTempo(falta)}</span>
        <span className="barra fina"><span style={{ width: `${(falta / alvo) * 100}%` }} /></span>
        <button className="seta pequena" onClick={cancelar} aria-label="Cancelar descanso"><X size={16} /></button>
      </div>
    )
  }
  return (
    <div className="descanso">
      <Timer size={18} />
      <span>Descanso</span>
      {DESCANSO_SERIES.map((s) => (
        <button key={s} className="pilula" onClick={() => comecar(s)}>{s} s</button>
      ))}
    </div>
  )
}
