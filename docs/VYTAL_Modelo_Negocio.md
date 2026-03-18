# VYTAL - Documento de Negócio

## 1. O que é o VYTAL

VYTAL é uma plataforma PWA (Progressive Web App) de desafios fitness com apostas reais via Pix. Os usuários criam ou entram em desafios de saúde/fitness, depositam um valor de entrada e competem. O vencedor leva o prêmio. A plataforma cobra uma taxa de 10% sobre o pool de cada desafio.

---

## 2. Modelo de Receita

A única fonte de receita da plataforma é a **taxa de 10% sobre o pool total de cada desafio**.

### Exemplo com desafio de 2 participantes, entrada R$ 50 cada:

| Item | Valor |
|------|-------|
| Pool total (2 × R$ 50) | R$ 100,00 |
| Taxa da plataforma (10%) | R$ 10,00 |
| Prêmio do vencedor | R$ 90,00 |

### Exemplo com desafio de 5 participantes, entrada R$ 30 cada:

| Item | Valor |
|------|-------|
| Pool total (5 × R$ 30) | R$ 150,00 |
| Taxa da plataforma (10%) | R$ 15,00 |
| Prêmio do vencedor | R$ 135,00 |

---

## 3. Gateway de Pagamento - AbacatePay

O processamento financeiro é feito pelo **AbacatePay**, que cobra R$ 0,80 por transação Pix (entrada ou saída).

### 3.1 Fluxo de Depósito

```
Usuário paga R$ 30,00 via Pix
        ↓
AbacatePay recebe e cobra taxa de R$ 0,80
        ↓
R$ 29,20 fica disponível no gateway
        ↓
App credita R$ 30,00 na carteira do usuário
```

**Nota:** O app credita o valor cheio (R$ 30) na carteira. A diferença de R$ 0,80 fica como custo operacional coberto pela taxa de 10% dos desafios.

### 3.2 Fluxo de Saque

```
Usuário solicita saque de R$ 30,00
        ↓
App envia R$ 29,20 ao AbacatePay (valor - R$ 0,80 da taxa de depósito)
        ↓
AbacatePay cobra taxa de saque R$ 0,80
        ↓
Usuário recebe R$ 28,40 na conta
        ↓
App mostra taxa total de R$ 1,60 ao usuário
```

### 3.3 Taxas do AbacatePay por Operação

| Operação | Taxa | Quem paga |
|----------|------|-----------|
| Depósito (Pix recebido) | R$ 0,80 | Coberto pela taxa de 10% da plataforma |
| Saque (Pix enviado) | R$ 0,80 | Descontado do valor do saque do usuário |

### 3.4 Taxa Total para o Usuário no Saque

O usuário vê **R$ 1,60 de taxa** ao sacar, que cobre:
- R$ 0,80 → taxa do AbacatePay no depósito original (que a plataforma absorveu)
- R$ 0,80 → taxa do AbacatePay no saque

---

## 4. Fluxo Financeiro Completo de um Desafio

### Cenário: 2 jogadores, entrada R$ 50 cada

#### Etapa 1 - Depósitos
| Jogador | Paga via Pix | Taxa AbacatePay | Chega no Gateway | Creditado na Carteira |
|---------|-------------|-----------------|------------------|-----------------------|
| Jogador A | R$ 50,00 | R$ 0,80 | R$ 49,20 | R$ 50,00 |
| Jogador B | R$ 50,00 | R$ 0,80 | R$ 49,20 | R$ 50,00 |
| **Total** | **R$ 100,00** | **R$ 1,60** | **R$ 98,40** | **R$ 100,00** |

#### Etapa 2 - Resultado do Desafio
| Item | Valor |
|------|-------|
| Pool total | R$ 100,00 |
| Taxa plataforma (10%) | R$ 10,00 |
| Prêmio vencedor (Jogador A) | R$ 90,00 |
| Saldo Jogador B | R$ 0,00 |

#### Etapa 3 - Saque do Vencedor (R$ 90)
| Item | Valor |
|------|-------|
| Valor solicitado | R$ 90,00 |
| Enviado ao AbacatePay | R$ 89,20 (90 - 0,80 taxa depósito) |
| Taxa AbacatePay saque | R$ 0,80 |
| Vencedor recebe via Pix | R$ 88,40 |
| Taxa total mostrada ao usuário | R$ 1,60 |

#### Etapa 4 - Resultado no Gateway
| Item | Valor |
|------|-------|
| Entrou no gateway (2 depósitos) | R$ 98,40 |
| Saiu do gateway (saque vencedor) | R$ 89,20 |
| **Saldo restante no gateway** | **R$ 9,20** |

#### Etapa 5 - Lucro da Plataforma
| Item | Valor |
|------|-------|
| Receita bruta (10% do pool) | R$ 10,00 |
| Taxas AbacatePay depósitos (2 × R$ 0,80) | - R$ 1,60 |
| Taxa AbacatePay saque (seu saque) | - R$ 0,80 |
| **Lucro líquido sacável** | **R$ 7,60** |

O saldo de R$ 9,20 no gateway corresponde ao lucro líquido de R$ 7,60 + R$ 0,80 (taxa de quando você sacar para si) + R$ 0,80 de arredondamento. O gateway sempre tem saldo suficiente.

---

## 5. Autoequilíbrio do Gateway

O gateway é **autocontido** — o que entra sempre cobre o que sai:

1. Todo dinheiro que entra no gateway vem de depósitos reais via Pix
2. Todo saque é limitado ao saldo calculado pelas transações reais
3. O app nunca envia mais ao AbacatePay do que o que está disponível
4. O saldo é recalculado a partir das transações a cada consulta (proteção contra manipulação)

### Cenários de equilíbrio:

| Cenário | Gateway tem | Saque pedido | Enviado ao gateway | Resultado |
|---------|-------------|-------------|--------------------|---------:|
| Saque simples (R$ 30) | R$ 29,20 | R$ 30 | R$ 29,20 | OK |
| Saque de prêmio (R$ 90) | R$ 98,40 | R$ 90 | R$ 89,20 | OK |
| Saque maior que gateway | R$ 29,20 | R$ 60 | R$ 59,20 | FALHA - saldo insuficiente |

---

## 6. Regras de Negócio

### Depósitos
- Valor mínimo: **R$ 30,00**
- Método: Pix via QR Code gerado pelo AbacatePay
- Sem taxa visível para o usuário no depósito
- Status: Pendente → Processando → Concluído (confirmado por webhook)

### Saques
- Valor mínimo: **R$ 30,00**
- Taxa visível: **R$ 1,60**
- Métodos de chave Pix: CPF, CNPJ, E-mail, Telefone, Chave Aleatória
- Limite: 1 saque pendente por vez
- Status: Processando → Concluído (confirmado por webhook do AbacatePay)
- Saldo deduzido imediatamente (não fica como "bloqueado")

### Desafios
- Taxa da plataforma: **10% do pool total**
- O valor da entrada fica **bloqueado** na carteira até o resultado
- Saldo bloqueado aparece como "Em desafios" na carteira
- Ao finalizar: perdedores perdem a entrada, vencedor recebe o prêmio (pool - 10%)

### Carteira
- Saldo calculado em tempo real baseado nas transações (depósitos - saques - entradas + prêmios + reembolsos)
- Saldo bloqueado = soma das entradas em desafios ativos
- Saldo disponível = saldo total - saldo bloqueado
- Apenas saldo disponível pode ser sacado

---

## 7. Painel Administrativo

O painel admin mostra:

- **Receita da plataforma (10%)** - total bruto das taxas cobradas
- **Taxas AbacatePay** - custo por depósito (R$ 0,80 × qtd depósitos)
- **Taxa de saque** - R$ 0,80 para quando você sacar sua receita
- **Lucro líquido sacável** - quanto pode sacar para si (receita - taxas)
- **Depósitos** - total e quantidade confirmados
- **Saques** - total e quantidade (excluindo falhados)
- **Saldo em contas** - total e bloqueado dos usuários
- **Desafios** - ativos e total
- **Movimentação** - entradas, prêmios, depósitos, saques

---

## 8. Segurança Financeira

| Proteção | Como funciona |
|----------|---------------|
| Saldo à prova de manipulação | Calculado a partir das transações reais, não de um campo editável |
| Depósitos verificados | Só creditados após confirmação do AbacatePay via webhook |
| Saques protegidos | Gateway recusa se não tiver saldo real |
| Idempotência | Cada transação tem chave única, evita duplicação |
| Dedução imediata | Saque deduz saldo na hora, impossível sacar duas vezes |
| Locked balance real | Calculado pelos desafios ativos, não por valor armazenado |

---

## 9. Resumo de Custos

### Para o Usuário:
- Depósito: **sem taxa visível**
- Saque: **R$ 1,60** (descontado do valor sacado)
- Desafio: **10%** do pool total (descontado do prêmio)

### Para a Plataforma:
- AbacatePay depósito: **R$ 0,80 por depósito** (coberto pela taxa de 10%)
- AbacatePay saque do lucro: **R$ 0,80 por saque**

### Margem líquida por desafio (2 jogadores, R$ 50 cada):
- Receita: R$ 10,00 (10% de R$ 100)
- Custos: R$ 2,40 (2 × R$ 0,80 depósitos + R$ 0,80 saque)
- **Margem: R$ 7,60 (76% da receita)**

### Margem líquida por desafio (5 jogadores, R$ 30 cada):
- Receita: R$ 15,00 (10% de R$ 150)
- Custos: R$ 4,80 (5 × R$ 0,80 depósitos + R$ 0,80 saque)
- **Margem: R$ 10,20 (68% da receita)**

---

## 10. Stack Tecnológico

| Componente | Tecnologia |
|-----------|------------|
| Frontend | React + TypeScript (PWA) |
| Backend | Express.js + Node.js |
| Banco de dados | PostgreSQL + Drizzle ORM |
| Pagamentos | AbacatePay (API v1) |
| Autenticação | Session-based + Google OAuth |
| Hospedagem | Replit Deployments |
