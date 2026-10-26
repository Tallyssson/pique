import { diffDays, mondayOf, fromISO } from './utils'

// Datas do concurso. Preencha a do TAF quando o edital sair (formato 'AAAA-MM-DD').
export const DATAS = { prova: '2027-01-17', taf: null }

// Ritmo de corrida que cada um quer alcançar no TAF, em minutos por km (ex.: 5.5 = 5:30/km).
// Deixe null enquanto não souber o índice.
export const META_RITMO = { A: null, T: null }

export const DIAS_REAVALIACAO = 28

export const PESSOAS = {
  A: { nome: 'Amanda', sexo: 'F', altura: 174, metas: { kcal: 1750, prot: 125, gord: 55, carb: 190, agua: 2500 } },
  T: { nome: 'Tallysson', sexo: 'M', altura: 178, metas: { kcal: 2200, prot: 165, gord: 70, carb: 230, agua: 3300 } },
}

export const MEDIDAS_INICIAIS = {
  data: '2026-10-26',
  A: { peso_kg: 69.95, cintura: 80, abdomen: 87.5, quadril: 105, peito: 92.5, ombro: 97, braco_e: 29, braco_d: 29, coxa_e: 61, coxa_d: 61.5, panturrilha_e: 34, panturrilha_d: 34 },
  T: { peso_kg: 95.3, cintura: 94, abdomen: 99.5, quadril: 111, peito: 107, ombro: 120.5, braco_e: 36.5, braco_d: 38, coxa_e: 65, coxa_d: 63.5, panturrilha_e: 40, panturrilha_d: 41 },
}

export const CAMPOS_MEDIDA = [
  ['peso_kg', 'Peso', 'kg'],
  ['cintura', 'Cintura', 'cm'],
  ['abdomen', 'Abdômen', 'cm'],
  ['quadril', 'Quadril', 'cm'],
  ['peito', 'Peito', 'cm'],
  ['ombro', 'Ombro', 'cm'],
  ['braco_e', 'Braço esquerdo', 'cm'],
  ['braco_d', 'Braço direito', 'cm'],
  ['coxa_e', 'Coxa esquerda', 'cm'],
  ['coxa_d', 'Coxa direita', 'cm'],
  ['panturrilha_e', 'Panturrilha esquerda', 'cm'],
  ['panturrilha_d', 'Panturrilha direita', 'cm'],
]

export const TREINOS = {
  A: {
    nome: 'Treino A',
    exercicios: [
      { id: 'leg_press', nome: 'Leg press 45°', series: 3, reps: '12' },
      { id: 'goblet', nome: 'Agachamento goblet', series: 3, reps: '10', obs: 'Halter junto ao peito' },
      { id: 'supino_halter', nome: 'Supino reto com halteres', series: 3, reps: '10' },
      { id: 'desenvolvimento', nome: 'Desenvolvimento sentado com halteres', series: 2, reps: '12' },
      { id: 'flexora', nome: 'Cadeira flexora', series: 3, reps: '12' },
      { id: 'prancha', nome: 'Prancha', series: 3, reps: '20 a 30 s', semCarga: true },
    ],
  },
  B: {
    nome: 'Treino B',
    exercicios: [
      { id: 'terra_romeno', nome: 'Levantamento terra romeno com halteres', series: 3, reps: '10' },
      { id: 'afundo', nome: 'Afundo (passada parada)', series: 2, reps: '10 cada perna' },
      { id: 'puxada', nome: 'Puxada frontal', series: 3, reps: '12' },
      { id: 'remada_baixa', nome: 'Remada baixa', series: 3, reps: '12' },
      { id: 'elevacao_pelvica', nome: 'Elevação pélvica', series: 3, reps: '12' },
      { id: 'dead_bug', nome: 'Dead bug (abdominal deitado)', series: 3, reps: '10', semCarga: true },
    ],
  },
}

export const DESCANSO_SERIES = [60, 90] // segundos

export const ORIENTACAO_MUSCULACAO =
  'Aqueça 5 min na esteira. Descanse 60 a 90 s entre séries e termine cada série sentindo que faria mais 2 ou 3 repetições. Quando a última série ficar fácil assim, suba um pouco a carga.'

export const CORRIDA = [
  { semana: 1, texto: '1 min de trote, 2 min caminhando', repeticoes: 8, trote: 1, caminhada: 2 },
  { semana: 2, texto: '2 min de trote, 2 min caminhando', repeticoes: 6, trote: 2, caminhada: 2 },
  { semana: 3, texto: '3 min de trote, 1 min 30 caminhando', repeticoes: 5, trote: 3, caminhada: 1.5 },
  { semana: 4, texto: '5 min de trote, 1 min caminhando', repeticoes: 4, trote: 5, caminhada: 1 },
  { semana: 5, texto: '8 min de trote, 1 min caminhando', repeticoes: 3, trote: 8, caminhada: 1 },
  { semana: 6, texto: '12 min de trote, 1 min caminhando', repeticoes: 2, trote: 12, caminhada: 1 },
  { semana: 7, texto: '20 min de corrida contínua', repeticoes: 1, trote: 20, caminhada: 0 },
  { semana: 8, texto: '25 min de corrida contínua', repeticoes: 1, trote: 25, caminhada: 0 },
  { semana: 9, texto: '30 min de corrida contínua', repeticoes: 1, trote: 30, caminhada: 0 },
]

export const ORIENTACAO_CORRIDA =
  'Trote num ritmo em que dá para conversar. Se a semana ficar pesada, repita antes de avançar. No sábado, se puder, corra ao ar livre.'

export function corridaDaSemana(semana) {
  const i = Math.min(Math.max(semana, 1), CORRIDA.length) - 1
  return CORRIDA[i]
}

export function natacaoDaSemana(semana) {
  let principal = '8 x 50 m em ritmo moderado, descanso de 30 a 45 s'
  if (semana >= 3) principal = '10 x 50 m em ritmo moderado, descanso de 30 a 45 s'
  if (semana >= 5) principal = '6 x 100 m em ritmo moderado, descanso de 45 a 60 s'
  return [
    ['Aquecimento', '200 m nadando solto, bem leve'],
    ['Principal', principal],
    ['Educativo', '4 x 25 m só pernada, com prancha se tiver'],
    ['Final', '100 a 200 m soltos'],
  ]
}

export function semanaDoPlano(data, inicio) {
  return Math.floor(diffDays(mondayOf(data), mondayOf(inicio)) / 7) + 1
}

// Segunda, quarta e sábado: musculação + corrida. Sexta: natação.
// Semanas ímpares: A, B, A. Semanas pares: B, A, B.
export function planoDoDia(data, inicio) {
  const semana = semanaDoPlano(data, inicio)
  const dow = fromISO(data).getDay()
  if (semana < 1) return { semana, dow, antes: true, titulo: 'Antes do início', atividades: [] }
  const par = semana % 2 === 0
  let atividades = []
  if (dow === 1) atividades = [{ tipo: 'musculacao', treino: par ? 'B' : 'A' }, { tipo: 'corrida' }]
  if (dow === 3) atividades = [{ tipo: 'musculacao', treino: par ? 'A' : 'B' }, { tipo: 'corrida' }]
  if (dow === 6) atividades = [{ tipo: 'musculacao', treino: par ? 'B' : 'A' }, { tipo: 'corrida' }]
  if (dow === 5) atividades = [{ tipo: 'natacao' }]
  if (dow === 2 || dow === 4) atividades = [{ tipo: 'caminhada', opcional: true }]
  if (dow === 0) atividades = [{ tipo: 'descanso' }]

  let titulo = 'Descanso'
  const musc = atividades.find((a) => a.tipo === 'musculacao')
  if (musc) titulo = `Treino ${musc.treino} e corrida`
  else if (dow === 5) titulo = 'Natação'
  else if (dow === 2 || dow === 4) titulo = 'Caminhada leve'
  return { semana, dow, titulo, atividades }
}

export function siglaDoDia(data, inicio) {
  const p = planoDoDia(data, inicio)
  const musc = p.atividades.find((a) => a.tipo === 'musculacao')
  if (musc) return musc.treino
  if (p.atividades.some((a) => a.tipo === 'natacao')) return 'N'
  return ''
}

export const ATIVIDADES_PRINCIPAIS = ['musculacao', 'corrida', 'natacao']
export const SESSOES_POR_SEMANA = 7 // 3 musculação + 3 corridas + 1 natação

export const LIVRE = 'Refeição livre'

// `compras`: quanto comprar por porção, já em peso cru (carne cozida perde cerca de 25% do peso,
// arroz cozido pesa cerca de 3 vezes o cru). Itens em `extras` entram na lista sem quantidade.
export const MARMITAS = {
  macarrao: {
    nome: 'Macarrão com patinho',
    A: '60 g de macarrão cru (cerca de 150 g cozido) + 120 g de patinho cozido',
    T: '90 g de macarrão cru (cerca de 220 g cozido) + 160 g de patinho cozido',
    dica: 'Misture abobrinha e cenoura ralada no molho. Prefira molho com pouco açúcar ou tomate pelado.',
    compras: { A: [['Macarrão', 60, 'g'], ['Patinho moído', 160, 'g']], T: [['Macarrão', 90, 'g'], ['Patinho moído', 215, 'g']], extras: ['Molho de tomate ou tomate pelado', 'Abobrinha', 'Cenoura'] },
  },
  strogonoff: {
    nome: 'Strogonoff de frango com arroz',
    A: '120 g de frango + 120 g de arroz cozido',
    T: '160 g de frango + 180 g de arroz cozido',
    dica: 'Use peito de frango e troque metade do creme de leite por requeijão light. Champignon, brócolis ou vagem combinam.',
    compras: { A: [['Peito de frango', 160, 'g'], ['Arroz', 40, 'g']], T: [['Peito de frango', 215, 'g'], ['Arroz', 60, 'g']], extras: ['Creme de leite', 'Requeijão light', 'Champignon'] },
  },
  escondidinho: {
    nome: 'Escondidinho de macaxeira',
    A: '150 g de purê de macaxeira + 120 g de frango desfiado ou patinho',
    T: '220 g de purê de macaxeira + 160 g de frango desfiado ou patinho',
    dica: 'Faça o purê com leite e pouco requeijão, sem excesso de manteiga.',
    compras: { A: [['Macaxeira', 150, 'g'], ['Peito de frango', 160, 'g']], T: [['Macaxeira', 220, 'g'], ['Peito de frango', 215, 'g']], extras: ['Leite', 'Requeijão light'] },
  },
  frango_batata: {
    nome: 'Frango assado com batata-doce',
    A: '120 g de frango + 150 g de batata-doce + brócolis',
    T: '160 g de frango + 220 g de batata-doce + brócolis',
    dica: 'Tudo no forno de uma vez. Rende bastante.',
    compras: { A: [['Peito de frango', 160, 'g'], ['Batata-doce', 150, 'g']], T: [['Peito de frango', 215, 'g'], ['Batata-doce', 220, 'g']], extras: ['Brócolis'] },
  },
  carne_panela: {
    nome: 'Carne de panela com abóbora',
    A: '120 g de carne + 100 g de arroz + 1 concha de feijão + abóbora',
    T: '160 g de carne + 150 g de arroz + 1 concha de feijão + abóbora',
    dica: 'Patinho ou músculo na pressão. Retire a gordura visível antes de cozinhar.',
    compras: { A: [['Patinho ou músculo', 160, 'g'], ['Arroz', 35, 'g'], ['Feijão', 25, 'g']], T: [['Patinho ou músculo', 215, 'g'], ['Arroz', 50, 'g'], ['Feijão', 25, 'g']], extras: ['Abóbora'] },
  },
  tilapia: {
    nome: 'Tilápia com arroz e legumes',
    A: '130 g de tilápia + 120 g de arroz + cenoura e vagem',
    T: '180 g de tilápia + 180 g de arroz + cenoura e vagem',
    dica: 'Peixe congelado dura até 2 meses.',
    compras: { A: [['Filé de tilápia', 175, 'g'], ['Arroz', 40, 'g']], T: [['Filé de tilápia', 240, 'g'], ['Arroz', 60, 'g']], extras: ['Cenoura', 'Vagem'] },
  },
}

export const JANTARES = {
  cuscuz: {
    nome: 'Cuscuz com ovos', A: '50 g de flocão + 2 ovos', T: '70 g de flocão + 3 ovos',
    compras: { A: [['Flocão de milho', 50, 'g'], ['Ovos', 2, 'un']], T: [['Flocão de milho', 70, 'g'], ['Ovos', 3, 'un']] },
  },
  tapioca: {
    nome: 'Tapioca com frango', A: '1 tapioca média + 80 g de frango desfiado + queijo light', T: '1 tapioca grande + 120 g de frango desfiado',
    compras: { A: [['Goma de tapioca', 50, 'g'], ['Peito de frango', 105, 'g']], T: [['Goma de tapioca', 70, 'g'], ['Peito de frango', 160, 'g']], extras: ['Queijo light'] },
  },
  omelete: {
    nome: 'Omelete com legumes', A: '2 ovos + 2 claras + legumes + 1 fatia de pão', T: '3 ovos + 2 claras + legumes + 2 fatias de pão',
    compras: { A: [['Ovos', 4, 'un'], ['Pão integral', 1, 'fatia']], T: [['Ovos', 5, 'un'], ['Pão integral', 2, 'fatia']], extras: ['Tomate', 'Cebola'] },
  },
  sobra: { nome: 'Sobra de marmita', A: 'Meia marmita + salada', T: 'Marmita inteira + salada' },
}

// Índice pelo dia da semana: 0 = domingo
export const CARDAPIO = {
  1: { almoco: 'macarrao', jantar: 'cuscuz' },
  2: { almoco: 'strogonoff', jantar: 'tapioca' },
  3: { almoco: 'frango_batata', jantar: 'omelete' },
  4: { almoco: 'escondidinho', jantar: 'cuscuz' },
  5: { almoco: 'tilapia', jantar: 'tapioca' },
  6: { almoco: 'carne_panela', jantar: null, jantarTexto: 'Livre, com moderação' },
  0: { almoco: null, almocoTexto: 'Refeição livre', jantar: 'sobra', obs: 'Dia de preparar as marmitas da semana' },
}

export const REFEICOES_FIXAS = {
  cafe: {
    nome: 'Café da manhã',
    A: ['1 banana + 1 iogurte natural'],
    T: ['1 banana + sanduíche de pão integral com requeijão light'],
    compras: { A: [['Banana', 1, 'un'], ['Iogurte natural', 1, 'un']], T: [['Banana', 1, 'un'], ['Pão integral', 2, 'fatia']], extras: ['Requeijão light'] },
  },
  pos: {
    nome: 'Pós-treino',
    nomeSemTreino: 'Lanche da manhã',
    A: [
      '1 dose de whey + sanduíche de pão integral com 70 g de patê de frango',
      '1 dose de whey + 2 ovos cozidos + 1 fruta',
      '1 dose e meia de whey + 1 fruta',
    ],
    T: [
      '1 dose de whey + 3 ovos cozidos + 1 fruta',
      '1 dose de whey + sanduíche com 90 g de frango desfiado',
      '2 doses de whey + 1 fruta',
    ],
    // Pela primeira opção de cada um; o patê usa 60 g de frango por porção.
    compras: { A: [['Whey', 1, 'dose'], ['Pão integral', 2, 'fatia'], ['Peito de frango', 60, 'g']], T: [['Whey', 1, 'dose'], ['Ovos', 3, 'un'], ['Frutas', 1, 'un']] },
  },
  lanche: {
    nome: 'Lanche da tarde',
    A: ['Iogurte natural + 20 g de aveia + 1 fruta'],
    T: ['Iogurte natural + 30 g de aveia + 1 dose de whey'],
    compras: { A: [['Iogurte natural', 1, 'un'], ['Aveia', 20, 'g'], ['Frutas', 1, 'un']], T: [['Iogurte natural', 1, 'un'], ['Aveia', 30, 'g'], ['Whey', 1, 'dose']] },
  },
}

export const PATE_FRANGO = {
  nome: 'Patê de frango',
  rende: 'Cerca de 5 porções de 70 g',
  preparo:
    'Misture 300 g de peito de frango cozido e desfiado com 3 colheres de sopa de requeijão light (ou iogurte natural), cebola e alho refogados, cheiro-verde, sal e um pouco de limão. Para ficar mais cremoso, bata rápido no processador. Cenoura ralada ou milho ajudam a variar.',
  conservacao: 'Dura de 3 a 4 dias na geladeira em pote fechado. Guarde o pão separado e monte o sanduíche na noite anterior.',
}

export const DICAS = [
  'No domingo, faça 2 ou 3 tipos de marmita e alterne durante a semana. Rotule com o nome de cada um, porque as porções são diferentes.',
  'Ovos cozidos: esfrie em água fria e leve à geladeira em até 2 horas. Com casca, duram até 5 dias. Descasque só na hora de comer.',
  'Fora da geladeira, ovos, patê e iogurte não devem passar de 2 horas. Use bolsa térmica com gelo.',
  'Uma refeição livre por semana ajuda a manter o plano; o cuidado é não virar o fim de semana inteiro.',
]
