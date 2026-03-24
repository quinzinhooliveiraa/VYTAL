# VYTAL — Especificação Completa da Landing Page

---

## 1. OBJETIVO E ESTRATÉGIA

A landing page do VYTAL tem uma missão clara: **converter visitantes em usuários instalados**. O app é um PWA (Progressive Web App), então o CTA principal é "Instalar e Entrar" — não há loja de apps, o usuário instala direto pelo navegador.

**Persona primária:** Homem ou mulher de 20–38 anos, pratica exercícios (corrida, musculação, funcional), usa Pix no dia a dia, é motivado por desafios sociais e recompensas financeiras reais.

**Proposta de valor central:** *"Faça exercícios, ganhe dinheiro de volta. Só quem cumpre fica com o prêmio."*

---

## 2. ESTRUTURA DE SEÇÕES (ORDEM DA PÁGINA)

```
[1] Navbar
[2] Hero
[3] Como Funciona (4 passos)
[4] Por Que é Diferente (diferenciais)
[5] Tipos de Desafio
[6] Prova Social / Depoimentos
[7] Transparência e Segurança
[8] Comunidades
[9] FAQ
[10] CTA Final
[11] Footer
```

---

## 3. SEÇÃO 1 — NAVBAR

**Layout:** Logo à esquerda · Links centrais · Botão CTA à direita

**Logo:** VYTAL em verde (#22c55e) com tagline menor: *"Bote dinheiro no exercício"*

**Links de navegação:**
- Como Funciona
- Desafios
- Comunidades
- FAQ

**CTA Botão:** `Começar Agora →` (verde sólido, bordas arredondadas)

**Comportamento:** Navbar fica fixa (sticky) ao rolar. Em mobile: hamburguer menu.

---

## 4. SEÇÃO 2 — HERO

**Layout:** Duas colunas (desktop) / Coluna única (mobile)
- Esquerda: texto + CTA
- Direita: mockup do app no celular

### Headline (título principal):
> **Transforme seu treino em premiação real.**

### Subheadline:
> Entre em desafios fitness com entrada via Pix, faça check-ins diários com câmera e GPS, e quem cumprir fica com o prêmio. Sem enrolação, sem desculpa.

### Bullet points de suporte (com ícones):
- ✅ Depósito e saque via Pix — instantâneo
- 📸 Check-in com foto + GPS em tempo real
- 🏆 Prêmio vai só para quem completar o desafio
- 🔒 Moderação humana para garantir fair play

### CTA Principal:
```
[ Instalar o App Gratuitamente ]
```
*(verde, grande, sombra suave — leva para a instalação PWA ou para o cadastro)*

### Texto embaixo do botão:
> Funciona direto no celular, sem instalar pela loja de apps.

### Mockup (imagem direita):
- Tela do app mostrando um desafio ativo com check-in em andamento
- Badge "AO VIVO" piscando sobre a câmera
- Informações de GPS e cronômetro visíveis
- Fundo desfocado de academia ou parque

---

## 5. SEÇÃO 3 — COMO FUNCIONA

**Título da seção:** `Como o VYTAL funciona`
**Subtítulo:** *Em 4 passos, do depósito ao prêmio*

**Layout:** 4 cards em linha (desktop) / scroll horizontal (mobile)

### Passo 1 — Deposite via Pix
**Ícone:** QR code / Pix
**Título:** Deposite via Pix
**Texto:** Carregue seu saldo com Pix em segundos. Mínimo de R$ 30. Seu dinheiro fica guardado em carteira segura enquanto você não estiver em um desafio.

### Passo 2 — Entre em um Desafio
**Ícone:** 🏅 troféu / bandeira
**Título:** Escolha seu Desafio
**Texto:** Participe de desafios públicos ou crie o seu. Há desafios de check-in diário, corrida por distância, desafios por tempo e muito mais. A entrada é via saldo do app.

### Passo 3 — Faça Check-in Todo Dia
**Ícone:** 📸 câmera
**Título:** Check-in com Câmera e GPS
**Texto:** A cada dia do desafio, você precisa registrar presença: tira uma foto ou selfie, o app captura sua localização GPS, e um moderador valida. Faltou? Perdeu pontos — ou sai do desafio.

### Passo 4 — Ganhe o Prêmio
**Ícone:** 💸 dinheiro / troféu
**Título:** Quem Cumpriu, Ganha
**Texto:** Ao final, o prêmio total (descontado 10% de taxa da plataforma) é dividido entre quem cumpriu todas as condições. Saque via Pix na hora.

---

## 6. SEÇÃO 4 — POR QUE É DIFERENTE

**Título:** `O que torna o VYTAL único`

**Layout:** Grade 2x3 de cards de diferencial

| Diferencial | Ícone | Descrição |
|---|---|---|
| **Dinheiro real em jogo** | 💰 | Não é gamification falsa. Você coloca dinheiro de verdade e ganha de verdade. Isso muda tudo. |
| **Check-in com GPS + câmera** | 📍 | Nada de clicar em "concluído" sem fazer. Cada presença é verificada por localização e foto. |
| **Moderação humana** | 👀 | Todo check-in é revisado. Flagrantes são analisados. É fair play de verdade. |
| **Funciona offline** | 📶 | Sem internet? O app registra seu check-in offline e sincroniza quando reconectar. |
| **Comunidades** | 🤝 | Grupos temáticos com desafios exclusivos. Personal trainers e academias podem criar as próprias comunidades. |
| **Sem app store** | 📱 | Instala direto pelo navegador, em qualquer celular. Leve, rápido e sem burocracia. |

---

## 7. SEÇÃO 5 — TIPOS DE DESAFIO

**Título:** `Para todo tipo de atleta`
**Subtítulo:** *Escolha o formato que combina com você*

**Layout:** Tabs ou cards horizontais com tabs selecionáveis

### 🏋️ Check-in Diário
**Para quem:** Quem quer consistência máxima
**Regra:** Faltou um dia = eliminado
**Exemplo:** "30 dias de treino — quem não faltar divide R$ 2.000"

### 🛡️ Survival (Sobrevivência)
**Para quem:** Quem quer uma margem de erro
**Regra:** Pode faltar até X dias (configurável pelo criador)
**Exemplo:** "60 dias, máximo 5 faltas — prêmio de R$ 5.000"

### 🏃 Corrida por Distância
**Para quem:** Corredores e ciclistas
**Regra:** Acumule km no período — quem bater a meta primeiro vence
**Exemplo:** "Primeiro a completar 100km leva R$ 500"

### 🏆 Ranking
**Para quem:** Competitivo e quer ganhar de todos
**Regra:** Mais distância, mais reps, ou mais tempo — quem tiver mais pontos vence
**Exemplo:** "Top 3 em quilometragem do mês divide o prêmio"

---

## 8. SEÇÃO 6 — PROVA SOCIAL / DEPOIMENTOS

**Título:** `Quem já está treinando (e ganhando)`

**Layout:** Carrossel de 3 depoimentos + métricas animadas no topo

### Métricas (números grandes, animados no scroll):
- **R$ 48.000+** em prêmios distribuídos
- **1.200+** check-ins validados
- **94%** dos usuários completam seus desafios
- **4.8/5** avaliação média dos participantes

### Depoimentos (cards com foto, nome, resultado):

**Depoimento 1:**
> *"Entrei num desafio de 30 dias de musculação, R$ 50 de entrada. No final, recebi R$ 190 de volta. Mas o melhor foi que nunca perdi um treino. O dinheiro em jogo faz toda a diferença."*
— **Lucas M., 29 anos, Belo Horizonte**

**Depoimento 2:**
> *"Criei um desafio de corrida pra minha turma de bike. O VYTAL cuidou de tudo — entrada, check-in, moderação e premiação. A galera ficou viciada."*
— **Ana P., 34 anos, São Paulo**

**Depoimento 3:**
> *"Sempre quis ser cobrado pra treinar de verdade. Com o VYTAL, não tem desculpa. O GPS não mente e o moderador não perdoa."*
— **Rafael T., 26 anos, Curitiba**

---

## 9. SEÇÃO 7 — TRANSPARÊNCIA E SEGURANÇA

**Título:** `Seu dinheiro, protegido`

**Layout:** 3 colunas com ícone grande + texto

### Coluna 1 — Saldo Bloqueado
**Ícone:** 🔒
**Título:** Dinheiro bloqueado enquanto o desafio está ativo
**Texto:** Assim que você entra em um desafio, o valor da inscrição é bloqueado no seu saldo — não some, não some, fica lá aguardando o resultado.

### Coluna 2 — Taxa Única e Justa
**Ícone:** 📊
**Título:** 10% de taxa, sem surpresas
**Texto:** A plataforma retém 10% do valor total como taxa. O restante é dividido entre os vencedores. Simples assim — sem taxas escondidas.

### Coluna 3 — Saque via Pix
**Ícone:** ⚡
**Título:** Saque na hora pelo Pix
**Texto:** Prêmio na conta? Saque quando quiser pelo Pix. Saldo disponível = saldo real, já descontadas as taxas.

### Bloco abaixo (tom de segurança adicional):
> **Pagamentos processados via AbacatePay** — gateway de pagamento Pix homologado no Brasil. Suas chaves Pix são armazenadas com criptografia AES-256.

---

## 10. SEÇÃO 8 — COMUNIDADES

**Título:** `Crie ou entre em uma comunidade`
**Subtítulo:** *Para academias, grupos de corrida, times e personal trainers*

**Texto:**
> Comunidades no VYTAL são grupos com desafios exclusivos e identidade própria. Donos de academia podem criar desafios só para seus alunos. Personal trainers podem monetizar seus grupos. Grupos de corrida podem criar rankings internos.

**Diferencial do dono da comunidade:**
> Toda comunidade pode configurar uma taxa adicional (padrão 5%) que vai direto para o criador do grupo — uma nova forma de monetizar sua audiência fitness.

**CTA:** `Criar minha comunidade →`

---

## 11. SEÇÃO 9 — FAQ

**Título:** `Dúvidas frequentes`

**Layout:** Accordion (abre/fecha) — 8 perguntas

**Q1: Preciso baixar o app na App Store ou Google Play?**
> Não! O VYTAL é um Progressive Web App (PWA). Você instala direto pelo navegador do celular — Android ou iPhone. É mais rápido e sem burocracia de loja.

**Q2: Como funciona o depósito?**
> Você gera um QR Code Pix dentro do app, paga pelo banco de costume, e o saldo aparece na carteira em segundos. Mínimo de R$ 30.

**Q3: E se eu não conseguir fazer o check-in por algum motivo técnico?**
> O app funciona offline: registra o check-in mesmo sem internet e sincroniza quando a conexão voltar. Em casos excepcionais, o moderador do desafio pode ajustar sua contagem manualmente.

**Q4: Quem valida os check-ins?**
> Cada desafio tem um moderador (geralmente o criador). O moderador pode revisar fotos e localização GPS de cada check-in. Check-ins suspeitos podem ser flagrados para análise.

**Q5: Posso criar meu próprio desafio?**
> Sim! Qualquer usuário pode criar desafios públicos ou privados, definir o valor de entrada, as regras, o período e as condições para ganhar.

**Q6: Quanto tempo leva para receber o prêmio?**
> Ao final do desafio, o criador (ou admin) finaliza e distribui os prêmios. Você recebe o saldo na carteira imediatamente e pode sacar via Pix a qualquer hora.

**Q7: E se eu sair no meio do desafio?**
> Participantes eliminados (por faltas) ou que saírem perdem o valor de entrada — esse valor compõe o prêmio dos vencedores.

**Q8: O VYTAL tem aplicativo para iOS?**
> Sim, via PWA. No iPhone, abra o site no Safari, toque no botão "Compartilhar" e depois "Adicionar à Tela de Início". Funciona como um app nativo.

---

## 12. SEÇÃO 10 — CTA FINAL

**Fundo:** Verde escuro (#14532d) com textura sutil

**Headline:**
> **Seu próximo treino pode te pagar.**

**Subheadline:**
> Instale o VYTAL, entre em um desafio e prove que você não vai desistir.

**CTA Botão Grande:**
```
[ Instalar o VYTAL Agora — É Grátis ]
```

**Texto abaixo:**
> Funciona no Android e iPhone. Sem app store. Sem taxas para criar conta.

---

## 13. FOOTER

**Colunas:**

| App | Empresa | Suporte | Legal |
|---|---|---|---|
| Como Funciona | Sobre o VYTAL | Central de Ajuda | Termos de Uso |
| Tipos de Desafio | Blog | Contato | Política de Privacidade |
| Comunidades | Carreiras | — | Termos Financeiros |
| Instalar (PWA) | Imprensa | — | — |

**Rodapé:**
> © 2026 VYTAL. Todos os direitos reservados. Pagamentos processados via AbacatePay.
> VYTAL não é uma casa de apostas. É uma plataforma de desafios fitness com premiação por cumprimento de metas.

**Redes sociais:** Instagram · TikTok · YouTube

---

## 14. IDENTIDADE VISUAL

### Paleta de Cores
| Nome | Hex | Uso |
|---|---|---|
| Verde Principal | `#22c55e` | CTAs, badges, destaques |
| Verde Escuro | `#14532d` | Fundos de seção, footer |
| Verde Médio | `#16a34a` | Hover states, borders |
| Preto | `#0a0a0a` | Fundo dark principal |
| Cinza Escuro | `#171717` | Cards, superfícies |
| Cinza Médio | `#404040` | Textos secundários |
| Branco | `#ffffff` | Textos sobre fundo dark |

### Tipografia
- **Títulos/Headlines:** Geist (bold/extrabold) ou Inter — sem serifa, moderno
- **Texto corrido:** Inter Regular/Medium — alta legibilidade
- **Números de destaque:** Geist Mono — boa para métricas/números

### Estilo Visual
- **Tema:** Dark mode predominante (fundo preto/cinza escuro com acentos verdes)
- **Cards:** Fundo cinza escuro + borda sutil (`border: 1px solid #262626`)
- **Ícones:** Lucide React ou equivalente — estilo outline/stroke
- **Ilustrações:** Mockups reais do app em dispositivos (não ilustrações cartoon)
- **Imagens:** Fotos reais de pessoas treinando (corrida, academia, funcional) — diversidade de gênero e idade
- **Animações:** Scroll animations leves (entrada de elementos com fade + slide up), números animados ao entrar no viewport

---

## 15. COPY ALTERNATIVO PARA TESTES A/B

### Headlines alternativas:
1. *"Academia todo dia ou você perde o dinheiro."*
2. *"O desafio que te paga de volta quando você não desiste."*
3. *"Treine. Comprove. Ganhe."*
4. *"Onde preguiça tem preço — e disciplina tem prêmio."*

### CTAs alternativos:
1. `Quero ganhar meu treino de volta`
2. `Entrar no primeiro desafio`
3. `Testar de graça por 7 dias`
4. `Ver desafios disponíveis`

---

## 16. RECOMENDAÇÕES TÉCNICAS

### Stack sugerida para a landing page:
- **Next.js** (SSG/SSR) ou **Astro** para máxima performance e SEO
- **Tailwind CSS** para estilização rápida e consistente com o app
- **Framer Motion** para animações de scroll suaves
- **Shadcn/ui** para componentes se usar Next.js

### Performance:
- Lazy load em imagens (Next.js Image ou `loading="lazy"`)
- Fontes pré-carregadas via `<link rel="preload">`
- Core Web Vitals alvo: LCP < 2.5s, CLS < 0.1, FID < 100ms

### SEO:
- Title: `VYTAL — Desafios Fitness com Premiação Real via Pix`
- Meta description: `Entre em desafios fitness, faça check-ins com câmera e GPS, e ganhe prêmios reais via Pix. Só quem cumpre ganha. Instale grátis no celular.`
- OG Image: 1200x630px com headline + mockup do app

### Analytics:
- Google Analytics 4 ou Plausible
- Eventos: CTA click, scroll depth (25/50/75/100%), FAQ aberto, seção visualizada

---

## 17. CHECKLIST FINAL PRÉ-LANÇAMENTO

- [ ] Headline testada com 5 pessoas do público-alvo
- [ ] Mockup do app atualizado (captura de tela real)
- [ ] Depoimentos com foto e nome real (ou avatares)
- [ ] Todos os links funcionando (cadastro, instalação, FAQ)
- [ ] Versão mobile testada (iOS Safari + Android Chrome)
- [ ] Meta tags OG/Twitter configuradas
- [ ] Favicon e manifest.json da landing configurados
- [ ] Formulário de email (waitlist ou newsletter) funcionando
- [ ] Clareza legal no footer (não é casa de apostas)
- [ ] Pixel de rastreamento instalado para campanhas pagas
