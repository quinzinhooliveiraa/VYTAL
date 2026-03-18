# RELATÓRIO TÉCNICO DESCRITIVO
## Registro de Programa de Computador — INPI

---

**Nome do Programa:** VYTAL  
**Natureza:** Plataforma digital de desafios esportivos com economia gamificada  
**Tipo de Registro:** Programa de Computador (Lei nº 9.609/1998 — Lei do Software)  
**Modalidade:** Aplicação Web Progressiva (PWA — Progressive Web Application)  
**Linguagem principal:** TypeScript  
**Ano de criação:** 2025  

---

## 1. IDENTIFICAÇÃO DO TITULAR

*(Preencher com nome completo / razão social, CPF / CNPJ, endereço e e-mail do(s) autor(es) / titular(es))*

---

## 2. DESCRIÇÃO GERAL DO PROGRAMA

O VYTAL é uma plataforma digital de desafios esportivos gamificados com sistema financeiro integrado. O programa permite que usuários criem ou ingressem em desafios físicos (corrida, musculação, ciclismo, natação e outros), realizem check-ins de presença por câmera e GPS em tempo real, e compitam por um prêmio em dinheiro formado pela soma das taxas de inscrição dos participantes.

O sistema combina, em uma única aplicação, os seguintes elementos inovadores:

1. **Desafio com depósito financeiro:** cada participante deposita um valor via Pix como "entrada" do desafio. O vencedor (ou os primeiros colocados) recebe o prêmio acumulado, descontada a taxa de plataforma de 10%.
2. **Check-in biométrico e georreferenciado:** o sistema registra a atividade física do usuário por meio de fotografia via câmera do dispositivo e coordenadas de GPS, com rastreamento contínuo de rota, distância percorrida em quilômetros, duração em minutos e calorias estimadas.
3. **Gamificação com medalhas:** usuários acumulam conquistas (medalhas) com base em comportamento dentro da plataforma (primeiro depósito, primeira vitória, frequência de check-ins, número de desafios criados, seguidores, entre outros).
4. **Ecossistema social:** seguir perfis, perfis públicos/privados, chat direto entre usuários com suporte a mensagens de voz, chat de grupo por desafio.
5. **Comunidades:** grupos temáticos por esporte que concentram desafios e membros com interesses comuns.
6. **Painel administrativo completo:** controle de usuários, transações financeiras, check-ins, tickets de suporte, gateway de pagamento e notificações em tempo real para administradores.

---

## 3. PROBLEMA RESOLVIDO / INOVAÇÃO

Aplicativos de condicionamento físico existentes (Strava, Nike Run Club, etc.) não possuem mecanismo financeiro de comprometimento com consequências reais para o cumprimento de metas. O VYTAL resolve esse problema ao introduzir o conceito de **"skin in the game" esportivo**: o participante deposita dinheiro real, e só recebe prêmio se cumprir os check-ins obrigatórios ao longo do período do desafio.

A combinação original de **desafio esportivo + depósito Pix + validação por câmera/GPS + prêmio automático distribuído ao vencedor** constitui a inovação central do programa.

---

## 4. ARQUITETURA DO SISTEMA

O VYTAL é uma aplicação cliente-servidor de camadas separadas:

### 4.1 Frontend (Cliente)

- **Framework:** React 18 com TypeScript
- **Roteamento:** Wouter
- **Gerenciamento de estado e cache:** TanStack Query (React Query)
- **Estilização:** Tailwind CSS com componentes Shadcn/UI (baseados em Radix UI)
- **Build:** Vite
- **Instalação PWA:** Service Worker com manifesto web para instalação em iOS e Android sem loja de aplicativos
- **Notificações push:** Web Push API (VAPID) para notificações nativas no dispositivo, mesmo com app fechado
- **Geolocalização:** Geolocation API nativa do navegador, com atualização contínua de posição durante o check-in
- **Câmera:** getUserMedia / MediaDevices API para captura de foto frontal e traseira
- **Áudio sintetizado:** Web Audio API para feedback sonoro em eventos financeiros

### 4.2 Backend (Servidor)

- **Runtime:** Node.js com Express.js em TypeScript (via tsx)
- **Autenticação:** Sessão segura por cookies (express-session + connect-pg-simple), com suporte adicional a OAuth via Replit Auth, Google OAuth e Apple Sign-In
- **Autenticação de dois fatores (2FA):** TOTP via speakeasy (compatível com Google Authenticator)
- **Armazenamento de arquivos:** Upload de imagens (fotos de check-in, banners de desafio, avatares) via Multer com armazenamento local
- **Gateway de pagamento:** AbacatePay — integração para geração de cobranças Pix, recebimento de webhooks de confirmação e processamento de saques via Pix
- **Notificações em tempo real:** Server-Sent Events (SSE) para entrega instantânea de notificações sem polling; Web Push (web-push) para notificações fora do app
- **E-mail transacional:** Nodemailer para envio de código de redefinição de senha
- **Porta padrão:** 5000

### 4.3 Banco de Dados

- **SGBD:** PostgreSQL
- **ORM:** Drizzle ORM com Drizzle-Zod para validação de esquemas

---

## 5. MODELO DE DADOS

O sistema é composto pelas seguintes entidades principais:

### 5.1 `users` — Usuários
Armazena dados de cadastro, perfil, autenticação, configurações de privacidade, device info e flags administrativos.

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| username | text | Nome de usuário único |
| email | text | E-mail único |
| password | text | Senha criptografada |
| name | text | Nome exibido |
| cpf | text | CPF (para saques) |
| phone | text | Telefone |
| goals | jsonb | Metas pessoais do usuário |
| isAdmin | boolean | Flag de administrador |
| twoFactorEnabled | boolean | 2FA ativado |
| pwaInstalled | boolean | App instalado como PWA |
| deviceInfo | text | Dispositivo e navegador detectados |
| isBanned | boolean | Conta banida |
| lastActiveAt | timestamp | Última atividade |

### 5.2 `challenges` — Desafios
Define os parâmetros de cada desafio esportivo.

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador único |
| title | text | Título |
| type | text | Tipo de desafio (individual/grupo) |
| sport | text | Esporte (corrida, musculação, etc.) |
| entryFee | decimal(10,2) | Taxa de entrada em R$ |
| duration | integer | Duração em dias |
| maxParticipants | integer | Limite de participantes |
| validationType | text | Tipo de validação (photo_gps, etc.) |
| goalTarget | integer | Meta numérica (km, reps) |
| maxMissedDays | integer | Dias de falta permitidos |
| skipWeekends | boolean | Pular fins de semana |
| restDays | text[] | Dias de descanso configurados |
| splitPrize | boolean | Premiação múltipla |
| splitPercentages | jsonb | % do prêmio por posição |
| status | text | Estado do desafio |
| isPrivate | boolean | Desafio privado |
| startDate | timestamp | Data de início |
| endDate | timestamp | Data de término |

### 5.3 `challengeParticipants` — Participantes por Desafio
Relaciona usuários a desafios e mantém pontuação individual.

| Campo | Tipo | Descrição |
|---|---|---|
| challengeId | UUID | FK desafio |
| userId | UUID | FK usuário |
| score | integer | Pontuação acumulada |
| totalDistanceKm | decimal(10,3) | Distância total percorrida |
| totalDurationMins | integer | Tempo total de atividade |
| missedDays | integer | Dias perdidos |
| lastCheckInDate | text | Data do último check-in |
| isActive | boolean | Participante ainda ativo |
| isAdmin | boolean | Moderador do desafio |

### 5.4 `checkIns` — Registros de Atividade
Cada check-in representa uma sessão de atividade física validada.

| Campo | Tipo | Descrição |
|---|---|---|
| challengeId | UUID | FK desafio |
| userId | UUID | FK usuário |
| photoUrl | text | Foto de início |
| backPhotoUrl | text | Foto traseira de início |
| endPhotoUrl | text | Foto de conclusão |
| latitude / longitude | decimal(10,7) | Coordenadas de início |
| endLatitude / endLongitude | decimal(10,7) | Coordenadas de fim |
| distanceKm | decimal(8,3) | Distância calculada |
| durationMins | integer | Duração da atividade |
| caloriesBurned | integer | Calorias estimadas |
| avgPace | text | Pace médio (min/km) |
| reps | integer | Repetições (para modalidades de ginástica) |
| isIndoor | boolean | Atividade indoor |
| approved | boolean | Aprovado por moderador |
| flagged | boolean | Marcado para revisão |

### 5.5 `wallets` — Carteiras
Uma carteira por usuário, com saldo disponível e bloqueado.

| Campo | Tipo | Descrição |
|---|---|---|
| userId | UUID | FK usuário (único) |
| balance | decimal(12,2) | Saldo disponível |
| lockedBalance | decimal(12,2) | Saldo bloqueado em desafios ativos |

### 5.6 `transactions` — Transações Financeiras
Registro auditável de todas as movimentações financeiras.

| Campo | Tipo | Descrição |
|---|---|---|
| userId | UUID | FK usuário |
| type | text | Tipo: deposit, challenge_entry, challenge_win, withdraw_request, platform_fee, refund |
| amount | decimal(12,2) | Valor em R$ |
| status | text | pending / processing / completed / failed |
| externalId | text | ID na AbacatePay |
| idempotencyKey | text | Chave de idempotência (evita duplicidade) |
| challengeId | UUID | FK desafio (quando aplicável) |
| metadata | jsonb | Dados adicionais do webhook |

### 5.7 Outras entidades

| Entidade | Finalidade |
|---|---|
| `messages` | Chat direto entre usuários (texto + áudio) |
| `follows` / `followRequests` | Sistema de seguidores com aprovação para perfis privados |
| `communities` | Grupos por esporte |
| `communityMembers` | Membros de cada comunidade |
| `challengeJoinRequests` | Solicitações de entrada em desafios privados |
| `challengeMessages` | Chat do grupo dentro do desafio |
| `notifications` | Notificações in-app (sino) |
| `pushSubscriptions` | Assinaturas de Web Push por dispositivo |
| `supportTickets` | Tickets de suporte ao usuário |

---

## 6. MÓDULOS FUNCIONAIS

### 6.1 Módulo de Autenticação
- Cadastro por e-mail/senha com validação de CPF opcional
- Login via OAuth: Replit Auth, Google, Apple
- Recuperação de senha por código enviado ao e-mail
- Autenticação de dois fatores (TOTP/QR Code)
- Detecção automática de dispositivo e navegador do usuário

### 6.2 Módulo de Desafios
- Criação de desafio com parâmetros configuráveis: esporte, duração, taxa de entrada, limite de participantes, dias de descanso, número máximo de faltas, tipo de validação
- Desafios públicos e privados (com solicitação de entrada)
- Transferência de moderação entre participantes
- Desafios vinculados a comunidades
- Premiação simples (único vencedor) ou múltipla (top 3 com percentuais configuráveis)
- Finalização automática: distribuição do prêmio, desconto da taxa de plataforma (10%), crédito na carteira dos vencedores
- Chat de grupo exclusivo por desafio (texto + áudio)

### 6.3 Módulo de Check-in
- **Início do check-in:** captura obrigatória de foto frontal + foto traseira com câmera do dispositivo; registro das coordenadas GPS de início
- **Rastreamento em tempo real:** atualização contínua de posição GPS, cálculo de distância percorrida e duração
- **Encerramento do check-in:** nova foto + coordenadas de fim; cálculo de calorias e pace médio
- **Atividade indoor:** opção de foto de prova alternativa sem GPS
- **Anti-fraude:** check-ins podem ser sinalizados (flagged) por moderadores ou automaticamente; suporte a invalidação de check-in por moderador; eliminação de participante por má conduta

### 6.4 Módulo Financeiro
- Depósito via Pix gerado dinamicamente via API AbacatePay
- Confirmação automática por webhook com crédito imediato na carteira
- Saldo bloqueado (locked) quando o usuário entra em desafio ativo
- Taxa de plataforma de 10% descontada automaticamente na finalização
- Saque via Pix com validação de CPF e valor mínimo de R$ 30,00
- Histórico completo de transações com status auditável
- Idempotência: chave única por transação evita cobranças duplicadas

### 6.5 Módulo Social
- Seguir usuários (follow/unfollow)
- Perfis privados com sistema de aprovação de seguidores
- Perfil público com medalhas, desafios e ranking visíveis
- Sugestão de usuários para seguir
- Chat direto com suporte a mensagens de voz gravadas no dispositivo
- Leitura de mensagem em tempo real

### 6.6 Módulo de Comunidades
- Criação de comunidades temáticas por esporte
- Comunidades públicas e privadas
- Taxa de comunidade configurável (% do prêmio destinado ao criador da comunidade)
- Desafios vinculados a comunidades

### 6.7 Módulo de Notificações
- **SSE (Server-Sent Events):** canal persistente entre cliente e servidor para entrega instantânea sem polling
- **Web Push:** notificações nativas no dispositivo com app fechado (protocolo VAPID)
- Tipos de evento notificados para administradores: novo usuário cadastrado, depósito confirmado, novo desafio criado
- Tipos de evento notificados para usuários: aprovação em desafio, nova mensagem, novo seguidor, desafio iniciado/encerrado, eliminação, check-out de atividade

### 6.8 Módulo de Gamificação — Medalhas
O sistema reconhece conquistas do usuário com 15 medalhas distintas:

| Medalha | Critério |
|---|---|
| Iniciante | Primeiro check-in realizado |
| Corredor | 10 km percorridos no total |
| Maratonista | 42 km percorridos |
| Consistente | 7 dias consecutivos de check-in |
| Campeão | Primeira vitória em desafio |
| Investidor | Primeiro depósito realizado |
| Primeiro Prêmio | Primeiro prêmio recebido |
| Dedicado | 30 check-ins realizados |
| Influente | 10 seguidores |
| Multitarefa | Participação em 3 desafios simultâneos |
| Estrela | 50 check-ins realizados |
| Diamante | R$ 500 acumulados em prêmios |
| Lenda | 100 check-ins realizados |
| GOAT | Todas as medalhas anteriores desbloqueadas |
| Fundador | Usuário dos primeiros dias da plataforma |

### 6.9 Painel Administrativo
- Visão geral de métricas: usuários, desafios, check-ins, volume financeiro
- Gerenciamento de usuários: ban, visualização de device info, histórico
- Monitoramento de check-ins com acesso às fotos e coordenadas GPS
- Controle de transações e gateway de pagamento (saldo disponível, saques)
- Gerenciamento de tickets de suporte
- Notificações em tempo real para eventos financeiros e de cadastro
- Atualização automática de estatísticas a cada 15 segundos

---

## 7. INTERFACES DE PROGRAMAÇÃO (API REST)

O sistema expõe as seguintes categorias de endpoints HTTP:

| Grupo | Endpoints principais |
|---|---|
| Autenticação | Registro, login, logout, OAuth (Google/Apple/Replit), 2FA, redefinição de senha |
| Usuários | Perfil, edição, busca, seguidores, seguindo, sugestões |
| Desafios | CRUD, participação, solicitações de entrada, moderação, finalização |
| Check-ins | Início, atualização de localização, encerramento, histórico, flagging |
| Financeiro | Saldo, depósito Pix, saque Pix, histórico de transações, status de depósito |
| Social | Chat direto, conversas, mensagens de áudio |
| Comunidades | CRUD, membros |
| Notificações | Stream SSE, listagem, marcar como lida, assinatura Web Push |
| Admin | Reset de carteiras, processamento de faltas, suporte |
| Webhooks | Recebimento de confirmação de pagamento e saque via AbacatePay |
| Upload | Fotos de check-in, banner de desafio, avatar, áudio |

---

## 8. TECNOLOGIAS E DEPENDÊNCIAS PRINCIPAIS

| Categoria | Tecnologia |
|---|---|
| Linguagem | TypeScript 5.x |
| Frontend framework | React 18 |
| Backend framework | Express.js 4.x |
| ORM | Drizzle ORM |
| Banco de dados | PostgreSQL 15+ |
| Build tool | Vite 5.x |
| UI Components | Shadcn/UI + Radix UI |
| CSS | Tailwind CSS |
| Autenticação | express-session, passport, speakeasy (2FA) |
| Pagamentos | AbacatePay (Pix) |
| Push Notifications | web-push (VAPID) |
| E-mail | Nodemailer |
| Upload | Multer |
| Validação | Zod + drizzle-zod |

---

## 9. ORIGINALIDADE E DISTINÇÃO

O VYTAL distingue-se de programas similares existentes pelos seguintes aspectos combinados e originais:

1. **Comprometimento financeiro via Pix integrado ao desafio esportivo:** o depósito não é assinatura ou taxa de serviço — é o próprio prêmio do desafio, retido em carteira bloqueada durante a competição e liberado automaticamente ao vencedor.

2. **Check-in dual-câmera com GPS ativo:** o registro de atividade exige foto frontal (selfie) + foto traseira (prova do ambiente) simultâneas, com coordenadas GPS de início e fim, distância calculada e rastreamento contínuo de rota — combinação que dificulta fraude.

3. **Arquitetura de notificações financeiras em tempo real:** administradores recebem alertas instantâneos (SSE + Web Push) com som sintetizado por Web Audio API para cada depósito Pix confirmado, sem dependência de arquivo de áudio externo.

4. **Sistema de saldo bloqueado:** o valor da taxa de inscrição do desafio permanece em `lockedBalance` até o encerramento, garantindo que o prêmio sempre exista para o vencedor, mesmo que o usuário realize outras transações durante o desafio.

5. **PWA multiplataforma sem loja de aplicativos:** instalável como app nativo em iOS e Android diretamente pelo navegador, eliminando a dependência de Apple App Store e Google Play Store para distribuição.

---

## 10. DECLARAÇÃO DE AUTORIA

Declaro(amos) que o programa VYTAL descrito neste relatório é de autoria exclusiva do(s) titular(es) abaixo identificado(s), criado de forma original, e que não infringe direitos de terceiros.

**Autor(es) / Titular(es):**

Nome: _______________________________________________  
CPF: _______________________________________________  
Endereço: _______________________________________________  
E-mail: _______________________________________________  
Data: _______________________________________________  
Assinatura: _______________________________________________  

---

*Documento elaborado para fins de Registro de Programa de Computador junto ao INPI — Instituto Nacional da Propriedade Industrial, nos termos da Lei nº 9.609/1998 e da Resolução INPI/PR nº 58/2013.*
