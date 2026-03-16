# VYTAL — Termos de Uso, Política de Privacidade e Contrato Social

**Razão Social:** [Inserir razão social da empresa]
**CNPJ:** [Inserir CNPJ]
**Endereço:** [Inserir endereço comercial]
**E-mail de contato:** [Inserir e-mail]
**Website:** https://vytal.replit.app
**Data de vigência:** [Inserir data]

---

## 1. Descrição do Serviço

O VYTAL é uma plataforma digital (Progressive Web App) de desafios esportivos com accountability financeira. Os usuários depositam valores via Pix para participar de desafios de atividade física. Participantes que cumprem as metas do desafio dividem o pote formado pelos valores dos participantes que desistiram ou falharam.

**O VYTAL não é uma plataforma de apostas.** Trata-se de um sistema de comprometimento financeiro para incentivo à prática de atividades físicas, onde o participante aposta em si mesmo para cumprir metas saudáveis.

---

## 2. Modelo de Negócio e Fluxo Financeiro

### 2.1 Depósitos
- Os depósitos são realizados exclusivamente via Pix (transferência bancária instantânea).
- Os valores depositados são utilizados para formação do pote de prêmios dos desafios.
- Cada desafio possui um valor mínimo de entrada definido pelo criador.

### 2.2 Taxa Operacional
- O VYTAL cobra uma taxa operacional de **10% (dez por cento)** sobre o pote final de cada desafio encerrado.
- Esta taxa cobre custos de infraestrutura, processamento de pagamentos, suporte e manutenção da plataforma.

### 2.3 Distribuição de Prêmios
- Ao final de cada desafio, o pote (descontada a taxa de 10%) é dividido igualmente entre os participantes que completaram o desafio com sucesso.
- Participantes eliminados ou que desistirem perdem o valor depositado, que é redistribuído aos vencedores.

### 2.4 Saques
- Saques são processados via Pix em até **3 (três) dias úteis**.
- O valor mínimo para saque é de R$ 1,00 (um real).
- O usuário só pode sacar o saldo disponível (não comprometido em desafios ativos).
- Os dados bancários (chave Pix) são fornecidos pelo próprio usuário e são de sua responsabilidade.

### 2.5 Reembolsos
- Depósitos para desafios que ainda não iniciaram podem ser reembolsados mediante solicitação.
- Após o início do desafio, não há reembolso — o valor integra o pote e será distribuído conforme as regras do desafio.
- Reembolsos são processados via Pix em até 5 (cinco) dias úteis.

---

## 3. Regras de Participação

### 3.1 Elegibilidade
- O usuário deve ter no mínimo **18 (dezoito) anos de idade** para participar de desafios com valor financeiro.
- O usuário deve possuir uma conta ativa na plataforma com e-mail verificado.

### 3.2 Check-in de Atividades
- A verificação de atividades é feita através de **check-in duplo com câmera ao vivo**: selfie frontal + foto do ambiente com a câmera traseira.
- O sistema utiliza **geolocalização (GPS)** e **geocodificação reversa** para validar o local da atividade.
- **Não são aceitas fotos da galeria** — apenas capturas ao vivo no momento do check-in.
- Os check-ins ficam visíveis aos demais participantes do mesmo desafio para fins de validação comunitária.

### 3.3 Eliminação e Desistência
- Participantes que não cumprirem as metas do desafio (frequência mínima, distância, tempo, etc.) serão automaticamente eliminados.
- A desistência voluntária implica na perda do valor depositado.
- Valores de participantes eliminados ou desistentes são incorporados ao pote de prêmios.

### 3.4 Condutas Proibidas
- Uso de fotos da galeria ou imagens manipuladas para check-in.
- Falsificação de localização GPS (GPS spoofing).
- Utilização de bots, scripts ou qualquer artifício automatizado.
- Assédio, ofensas ou comportamentos tóxicos contra outros participantes.
- Criação de múltiplas contas para benefício próprio.

### 3.5 Penalidades
- Violações das regras resultam em:
  - Primeira infração: advertência e invalidação do check-in.
  - Reincidência: banimento do desafio com perda do depósito.
  - Infrações graves: banimento permanente da plataforma e perda de saldo.

---

## 4. Moderação e Validação

### 4.1 Sistema de Moderação
- A plataforma conta com moderação administrativa para análise de check-ins sinalizados.
- Participantes podem reportar check-ins suspeitos para revisão.
- Administradores têm autoridade final sobre disputas e validações.

### 4.2 Critérios de Validação
- Check-ins são validados automaticamente com base em: captura de câmera ao vivo, dados de GPS, horário e consistência visual.
- Check-ins sinalizados são revisados manualmente pela equipe de moderação.

---

## 5. Política de Privacidade e Proteção de Dados

### 5.1 Dados Coletados
A plataforma coleta e processa os seguintes dados pessoais:
- **Dados de cadastro:** nome, e-mail, senha (criptografada com bcrypt).
- **Dados de autenticação social:** informações do perfil Google (nome, e-mail, foto) quando utilizado o login social.
- **Dados de localização:** coordenadas GPS durante os check-ins de atividades.
- **Imagens:** fotos de selfie e ambiente capturadas durante os check-ins.
- **Dados financeiros:** chave Pix para processamento de saques (não armazenamos dados bancários completos).
- **Dados de uso:** logs de acesso, dispositivo, navegador.

### 5.2 Finalidade do Tratamento
Os dados coletados são utilizados exclusivamente para:
- Prestação do serviço (verificação de atividades, processamento financeiro).
- Moderação e prevenção de fraudes.
- Comunicação com o usuário (notificações push, e-mails transacionais).
- Melhoria contínua da plataforma.

### 5.3 Base Legal (LGPD)
- **Execução de contrato** (Art. 7º, V): para prestação do serviço contratado.
- **Consentimento** (Art. 7º, I): para uso de câmera, GPS e notificações push.
- **Legítimo interesse** (Art. 7º, IX): para prevenção de fraudes e segurança.

### 5.4 Compartilhamento de Dados
- **Fotos de check-in** são visíveis aos participantes do mesmo desafio para validação comunitária.
- **Dados financeiros** são compartilhados apenas com o gateway de pagamento para processamento de transações.
- **Não vendemos, alugamos ou compartilhamos** dados pessoais com terceiros para fins de marketing.

### 5.5 Armazenamento e Segurança
- Dados são armazenados em servidores seguros com criptografia em trânsito (TLS/HTTPS).
- Senhas são armazenadas com hash criptográfico (bcrypt).
- Sessões de autenticação utilizam tokens seguros.
- Acesso administrativo é restrito e protegido por autenticação de dois fatores (2FA).

### 5.6 Direitos do Titular (LGPD)
O usuário tem direito a:
- **Acesso:** consultar todos os dados pessoais armazenados.
- **Correção:** solicitar a atualização de dados incorretos.
- **Exclusão:** solicitar a eliminação dos dados pessoais da plataforma.
- **Portabilidade:** receber seus dados em formato estruturado.
- **Revogação do consentimento:** retirar o consentimento a qualquer momento.

Para exercer esses direitos, o usuário deve entrar em contato pelo e-mail: [inserir e-mail de privacidade].

### 5.7 Retenção de Dados
- Dados de conta são mantidos enquanto a conta estiver ativa.
- Após exclusão da conta, os dados pessoais são removidos em até 30 (trinta) dias.
- Registros financeiros são mantidos por 5 (cinco) anos conforme legislação fiscal brasileira.

---

## 6. Uso de Imagem

### 6.1 Autorização
Ao utilizar o VYTAL e realizar check-ins, o usuário autoriza:
- A captura de imagens via câmera frontal e traseira do dispositivo.
- O armazenamento dessas imagens nos servidores da plataforma.
- A exibição das imagens de check-in para outros participantes do mesmo desafio, para fins de validação.

### 6.2 Limitações
- As imagens **não serão utilizadas** para fins publicitários sem consentimento expresso adicional.
- As imagens **não serão vendidas** ou cedidas a terceiros.
- O usuário pode solicitar a exclusão de suas imagens a qualquer momento.

---

## 7. Propriedade Intelectual

- O VYTAL, incluindo sua marca, logotipo, design, código-fonte e conteúdo, é propriedade exclusiva de [inserir razão social].
- É proibida a reprodução, modificação ou distribuição de qualquer elemento da plataforma sem autorização prévia.

---

## 8. Limitação de Responsabilidade

- O VYTAL não se responsabiliza por:
  - Interrupções temporárias do serviço por manutenção ou falhas técnicas.
  - Erros no fornecimento de dados bancários pelo usuário (chave Pix incorreta).
  - Lesões físicas decorrentes da prática de atividades esportivas.
  - Falhas na conexão de internet do usuário que impeçam a realização de check-ins.

- O usuário declara estar ciente de que a prática de atividades físicas envolve riscos e que participar dos desafios é decisão exclusivamente sua.

---

## 9. Alterações nos Termos

- O VYTAL se reserva o direito de alterar estes termos a qualquer momento.
- Alterações serão comunicadas aos usuários com antecedência mínima de 15 (quinze) dias via notificação no app ou e-mail.
- O uso continuado da plataforma após as alterações implica na aceitação dos novos termos.

---

## 10. Foro e Legislação Aplicável

- Estes termos são regidos pelas leis da República Federativa do Brasil.
- Fica eleito o foro da comarca de [inserir cidade/estado] para dirimir quaisquer litígios.
- Aplica-se o Código de Defesa do Consumidor (Lei nº 8.078/90) e a Lei Geral de Proteção de Dados (Lei nº 13.709/18 — LGPD).

---

## 11. Contato

Para dúvidas, solicitações ou reclamações:
- **E-mail:** [inserir e-mail de suporte]
- **E-mail de privacidade/LGPD:** [inserir e-mail do DPO]
- **Website:** https://vytal.replit.app

---

*Ao utilizar o VYTAL, o usuário declara ter lido, compreendido e aceito integralmente estes Termos de Uso, Política de Privacidade e Contrato Social.*
