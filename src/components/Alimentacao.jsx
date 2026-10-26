import { useState } from 'react'
import { PESSOAS, MARMITAS, JANTARES, CARDAPIO, REFEICOES_FIXAS, PATE_FRANGO, DICAS } from '../plan'
import { DIAS_CURTOS } from '../utils'
import ListaCompras from './ListaCompras'

const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]

export default function Alimentacao({ perfil }) {
  const [p, setP] = useState(perfil.pessoa)
  const metas = PESSOAS[p].metas

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Comida</h1>

      <div className="alternador" role="group" aria-label="Ver porções de">
        {Object.entries(PESSOAS).map(([k, pessoa]) => (
          <button key={k} className={p === k ? `alt p-${k} ativo` : `alt p-${k}`} aria-pressed={p === k} onClick={() => setP(k)}>
            {pessoa.nome}
          </button>
        ))}
      </div>

      <section className="bloco">
        <h2>Metas diárias</h2>
        <div className="metas">
          <div><span className="meta-num">{metas.kcal}</span><span className="meta-rot">kcal</span></div>
          <div><span className="meta-num">{metas.prot} g</span><span className="meta-rot">proteína</span></div>
          <div><span className="meta-num">{metas.carb} g</span><span className="meta-rot">carboidrato</span></div>
          <div><span className="meta-num">{metas.gord} g</span><span className="meta-rot">gordura</span></div>
          <div><span className="meta-num">{(metas.agua / 1000).toLocaleString('pt-BR')} L</span><span className="meta-rot">água</span></div>
        </div>
        <p className="nota">No almoço e no jantar: metade do prato com salada e legumes, um quarto com proteína e um quarto com carboidrato.</p>
      </section>

      <section className="bloco">
        <h2>Cardápio da semana</h2>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead><tr><th>Dia</th><th>Almoço</th><th>Jantar</th></tr></thead>
            <tbody>
              {ORDEM_DIAS.map((d) => {
                const c = CARDAPIO[d]
                return (
                  <tr key={d}>
                    <td>{DIAS_CURTOS[d]}</td>
                    <td>{c.almoco ? MARMITAS[c.almoco].nome : c.almocoTexto}</td>
                    <td>{c.jantar ? JANTARES[c.jantar].nome : c.jantarTexto}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="nota">Domingo é dia de preparar as marmitas da semana.</p>
      </section>

      <ListaCompras pessoa={perfil.pessoa} />

      <section className="bloco">
        <h2>Marmitas</h2>
        <ul className="lista-pratos">
          {Object.entries(MARMITAS).map(([id, m]) => (
            <li key={id}>
              <strong>{m.nome}</strong>
              <span className="porcao">{m[p]}</span>
              <span className="nota">{m.dica}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bloco">
        <h2>Jantares rápidos</h2>
        <ul className="lista-pratos">
          {Object.entries(JANTARES).map(([id, j]) => (
            <li key={id}><strong>{j.nome}</strong><span className="porcao">{j[p]}</span></li>
          ))}
        </ul>
      </section>

      <section className="bloco">
        <h2>Café e pós-treino para levar</h2>
        <ul className="lista-pratos">
          <li><strong>{REFEICOES_FIXAS.cafe.nome}</strong>{REFEICOES_FIXAS.cafe[p].map((o) => <span key={o} className="porcao">{o}</span>)}</li>
          <li><strong>{REFEICOES_FIXAS.pos.nome}</strong>{REFEICOES_FIXAS.pos[p].map((o) => <span key={o} className="porcao">{o}</span>)}</li>
          <li><strong>{REFEICOES_FIXAS.lanche.nome}</strong>{REFEICOES_FIXAS.lanche[p].map((o) => <span key={o} className="porcao">{o}</span>)}</li>
        </ul>
      </section>

      <section className="bloco">
        <h2>{PATE_FRANGO.nome}</h2>
        <p>{PATE_FRANGO.preparo}</p>
        <p className="nota">{PATE_FRANGO.rende}. {PATE_FRANGO.conservacao}</p>
      </section>

      <section className="bloco">
        <h2>Preparo e conservação</h2>
        <ul className="dicas">{DICAS.map((d) => <li key={d}>{d}</li>)}</ul>
      </section>
    </div>
  )
}
