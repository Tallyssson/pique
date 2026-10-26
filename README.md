# Pique: treino e alimentação

App do casal para acompanhar treino, alimentação e medidas. Cada pessoa entra com a própria conta e vê o próprio plano (porções, metas e cargas).

## O que tem

- **Hoje**: treino do dia (A ou B alternando sozinho), registro de carga por série com a carga da última vez, cronômetro de descanso entre séries, corrida da semana com cronômetro de intervalos (apita a cada troca) e registro de tempo e distância, natação na sexta, refeições do dia com as porções de cada um, refeição livre da semana e contador de água. A régua no topo mostra a semana inteira e o que já foi concluído. Também mostra quantos dias faltam para a prova e para a reavaliação, avisa quando o peso para de cair por 3 semanas e, com as contas vinculadas, o dia da outra pessoa.
- **Treinos**: constância das últimas 4 semanas, fichas A e B com última e maior carga, ritmo da corrida (gráfico e histórico), progressão da corrida e da natação.
- **Comida**: metas, cardápio da semana, lista de compras da semana, marmitas, jantares rápidos, café e pós-treino para levar, receita do patê de frango e dicas de conservação. Dá para ver as porções da outra pessoa.
- **Medidas**: registro das medições, IMC, cintura/altura, cintura/quadril, gordura estimada, gráfico de evolução e histórico.
- **Perfil**: dados da conta, vínculo do casal e exportação de medidas, cargas e treinos em CSV.
- **App no celular**: dá para instalar na tela inicial (no iPhone, Safari > Compartilhar > Adicionar à Tela de Início; no Android, menu do Chrome > Instalar app).

## 1. Supabase

1. Crie um projeto novo em https://supabase.com.
2. Abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode. Depois faça o mesmo com `supabase/migracao-02-corrida-casal.sql`.
3. Em **Authentication > Sign In / Providers > Email**, deixe o e-mail ativado. Se quiser entrar sem confirmar por e-mail, desative "Confirm email".
4. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.

## 2. Rodar no computador

```bash
cp .env.example .env   # preencha com a URL e a chave anon
npm install
npm run dev
```

## 3. Publicar na Vercel

1. Suba a pasta para um repositório no GitHub.
2. Na Vercel, **Add New > Project** e importe o repositório (o framework Vite é detectado sozinho).
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Clique em **Deploy**.
5. No Supabase, em **Authentication > URL Configuration**, coloque o endereço da Vercel em **Site URL** (para os links de confirmação de e-mail funcionarem).

## Primeiro acesso

Cada um cria a própria conta, escolhe quem é (Amanda ou Tallysson) e a data de início do plano. Marcando a opção na tela inicial, as medidas de 26/10/2026 já entram como ponto de partida.

## Onde mudar o plano

Todo o conteúdo do plano fica em `src/plan.js`: exercícios, séries, progressão da corrida e da natação, marmitas, porções, cardápio e metas. Ao ajustar o plano daqui a 4 semanas, basta editar esse arquivo e publicar de novo.

## Vincular as contas do casal

Depois que os dois tiverem conta, um abre **Perfil > Casal**, copia o código e manda para o outro, que cola no mesmo lugar e toca em **Vincular**. A partir daí cada um vê, na tela Hoje, o treino, as refeições e a água do outro. Medidas e cargas continuam visíveis só para o dono.

## Datas do concurso e meta de ritmo

Em `src/plan.js`, `DATAS` guarda a data da prova e a do TAF (preencha quando o edital sair) e `META_RITMO` guarda o ritmo de corrida que cada um quer alcançar, em minutos por km. Com a meta preenchida, a aba Treinos mostra quanto falta.
