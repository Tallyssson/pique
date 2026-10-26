export function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function fromISO(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const hojeISO = () => toISO(new Date())

export function addDays(s, n) {
  const d = fromISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function mondayOf(s) {
  const d = fromISO(s)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toISO(d)
}

export const diffDays = (a, b) => Math.round((fromISO(a) - fromISO(b)) / 86400000)

export function formatarDataLonga(s) {
  const t = fromISO(s).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export const formatarCurta = (s) => fromISO(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export const formatarData = (s) => fromISO(s).toLocaleDateString('pt-BR')

export function num(v, casas = 1) {
  if (v == null || Number.isNaN(Number(v))) return '-'
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas })
}

export function lerNumero(v) {
  if (v === '' || v == null) return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// 5.25 -> '5:15'
export function formatarRitmo(minutos) {
  if (minutos == null || !Number.isFinite(minutos)) return '-'
  let m = Math.floor(minutos)
  let s = Math.round((minutos - m) * 60)
  if (s === 60) { m += 1; s = 0 }
  return `${m}:${String(s).padStart(2, '0')}`
}

// 95 -> '1:35'
export function formatarTempo(segundos) {
  const t = Math.max(0, Math.ceil(segundos))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

// CSV no formato do Excel em português: ponto e vírgula e vírgula decimal.
export function baixarCSV(nome, linhas) {
  const celula = (v) => {
    if (v == null) return ''
    const t = typeof v === 'number' ? String(v).replace('.', ',') : String(v)
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const texto = '﻿' + linhas.map((l) => l.map(celula).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
