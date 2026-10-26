import { useEffect, useState } from 'react'
import { ShoppingBasket } from 'lucide-react'
import { PESSOAS, MARMITAS, JANTARES, CARDAPIO, REFEICOES_FIXAS } from '../plan'
import { hojeISO, mondayOf, num } from '../utils'

const UNIDADES = { un: ['unidade', 'unidades'], fatia: ['fatia', 'fatias'], dose: ['dose', 'doses'] }

// Soma o cardápio da semana inteira (7 cafés, pós-treinos e lanches; almoços e jantares pelo cardápio).
function montarLista(pessoas) {
  const itens = new Map()
  const extras = new Set()
  const somar = (compras, vezes = 1) => {
    if (!compras) return
    for (const p of pessoas) {
      for (const [nome, qtd, unid] of compras[p] || []) {
        const chave = `${nome}|${unid}`
        itens.set(chave, { nome, unid, qtd: (itens.get(chave)?.qtd || 0) + qtd * vezes })
      }
    }
    for (const e of compras.extras || []) extras.add(e)
  }
  for (const c of Object.values(CARDAPIO)) {
    if (c.almoco) somar(MARMITAS[c.almoco].compras)
    if (c.jantar) somar(JANTARES[c.jantar].compras)
  }
  for (const r of ['cafe', 'pos', 'lanche']) somar(REFEICOES_FIXAS[r].compras, 7)
  const lista = [...itens.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return { lista, extras: [...extras].filter((e) => !lista.some((i) => i.nome === e)).sort((a, b) => a.localeCompare(b, 'pt-BR')) }
}

function quantidade({ qtd, unid }) {
  if (unid === 'g') {
    const g = Math.ceil(qtd / 50) * 50
    return g >= 1000 ? `${num(g / 1000, 1)} kg` : `${g} g`
  }
  const [um, varios] = UNIDADES[unid] || [unid, unid]
  return `${num(qtd, 1)} ${qtd === 1 ? um : varios}`
}

function lerMarcados(chave) {
  try { return JSON.parse(localStorage.getItem(chave)) || [] } catch { return [] }
}

export default function ListaCompras({ pessoa }) {
  const [quem, setQuem] = useState('casal')
  const chave = `pique-compras-${mondayOf(hojeISO())}`
  const [marcados, setMarcados] = useState(() => lerMarcados(chave))

  useEffect(() => {
    try { localStorage.setItem(chave, JSON.stringify(marcados)) } catch { /* sem armazenamento: a lista só não lembra */ }
  }, [chave, marcados])

  const { lista, extras } = montarLista(quem === 'casal' ? Object.keys(PESSOAS) : [pessoa])
  const alternar = (nome) => setMarcados((m) => (m.includes(nome) ? m.filter((x) => x !== nome) : [...m, nome]))
  const linhas = [...lista.map((i) => [i.nome, quantidade(i)]), ...extras.map((e) => [e, 'a gosto'])]
  const feitos = linhas.filter(([nome]) => marcados.includes(nome)).length

  return (
    <section className="bloco">
      <div className="bloco-topo">
        <h2 className="titulo-icone"><span className="icone-folha"><ShoppingBasket size={18} /></span>Lista de compras</h2>
        <span className="contagem">{feitos} de {linhas.length}</span>
      </div>
      <div className="alternador pequeno" role="group" aria-label="Lista para">
        <button className={quem === 'casal' ? 'alt ativo' : 'alt'} aria-pressed={quem === 'casal'} onClick={() => setQuem('casal')}>Para os dois</button>
        <button className={quem === 'eu' ? 'alt ativo' : 'alt'} aria-pressed={quem === 'eu'} onClick={() => setQuem('eu')}>Só {PESSOAS[pessoa].nome}</button>
      </div>
      <ul className="compras">
        {linhas.map(([nome, qtd]) => (
          <li key={nome}>
            <label className={marcados.includes(nome) ? 'caixa riscado' : 'caixa'}>
              <input type="checkbox" checked={marcados.includes(nome)} onChange={() => alternar(nome)} />
              <span className="compra-nome">{nome}</span>
              <span className="compra-qtd">{qtd}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="nota">
        Semana inteira pelo cardápio, com carnes e arroz em peso cru e o pós-treino pela primeira opção de cada um.
        A sobra de marmita do domingo não entra: faça uma porção a mais no preparo. Os itens marcados zeram na segunda-feira.
      </p>
      {marcados.length > 0 && <button className="botao link" onClick={() => setMarcados([])}>Desmarcar tudo</button>}
    </section>
  )
}
