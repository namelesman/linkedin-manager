# Brief: LinkedIn Manager

Painel pessoal para o Thiago gerenciar o próprio LinkedIn usando **só a API oficial**.

## MVP
1. **Login com LinkedIn** via OAuth 2.0 / OIDC (produto "Sign In with LinkedIn using OpenID Connect"; escopos `openid profile email w_member_social`). Access token criptografado no banco; avisar quando estiver perto de expirar (~60 dias).
2. **Rascunhos com IA**: gerar posts com a Claude API (modelo mais recente, ex. `claude-sonnet-5-5`) a partir de um tema/briefing + tom de voz salvo nas configurações. Ler a skill `claude-api` antes de escrever esse código.
3. **Fila de aprovação**: rascunho -> editar -> aprovar. Nada é publicado sem aprovação manual.
4. **Publicação** de texto + imagens no perfil via `POST https://api.linkedin.com/rest/posts` (headers `LinkedIn-Version` atual e `X-Restli-Protocol-Version: 2.0.0`), com upload pela Images API (`initializeUpload`).
5. **Agendamento**: data/hora por post + cron que publica os aprovados vencidos (idempotente, nunca publica duas vezes).
6. **Histórico** com status (rascunho, aprovado, agendado, publicado, erro) e link do post.

## Fora do escopo
Proibido pelo Contrato do Usuário do LinkedIn (seção 8.2): scraping, automação de navegador, mensagens/DMs, convites, curtidas automáticas.

## Stack
Next.js 16 (App Router) + TypeScript + Tailwind 4 + Prisma + Postgres (Neon); deploy Vercel ou Netlify.
Antes de codar Next.js, ler a doc em `node_modules/next/dist/docs/`.
Uso pessoal (um usuário): restringir acesso ao e-mail em `ALLOWED_EMAIL`.

## Conformidade
Usar a skill `leis-brasil` (LGPD: dados mínimos, tokens criptografados, opção de apagar conta e dados). Segredos só em `.env`; criar `.env.example`.

## Como trabalhar
1. Fazer um plano curto e mostrar ao Thiago antes de implementar.
2. Implementar em commits pequenos.
3. No fim, passo a passo para criar o app em developer.linkedin.com (Client ID/Secret, redirect URI, produtos a ativar).
