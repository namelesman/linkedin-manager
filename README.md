# LinkedIn Manager

Painel pessoal para gerar, aprovar, agendar e publicar posts no seu perfil do LinkedIn usando só a API oficial (Sign In with LinkedIn using OpenID Connect + Share on LinkedIn) e a Claude API.

Nada é publicado sem aprovação manual. Fora do escopo, por violar o Contrato do Usuário do LinkedIn (seção 8.2): scraping, automação de navegador, mensagens, convites e curtidas automáticas.

## Como funciona

- **Login**: OAuth 2.0/OIDC com os escopos `openid profile email w_member_social`. Só entra o e-mail definido em `ALLOWED_EMAIL`. O token do LinkedIn fica criptografado (AES-256-GCM) e dura cerca de 60 dias. Apps comuns não recebem refresh token, então o painel avisa 7 dias antes de expirar e você entra de novo.
- **Rascunho**: tema/briefing mais o tom de voz salvo em Configurações, gerado com `claude-sonnet-5-5`.
- **Fluxo**: rascunho, edição, aprovação, depois publicar agora ou agendar. Editar texto ou imagens de um post aprovado o devolve para rascunho.
- **Publicação**: Images API (`initializeUpload` + PUT) e `POST /rest/posts` com `LinkedIn-Version` e `X-Restli-Protocol-Version: 2.0.0`.
- **Agendamento**: o GitHub Actions chama `/api/cron/publish` a cada 5 min. Cada publicação faz um claim atômico no banco, então o mesmo post nunca sai duas vezes. Se a resposta do LinkedIn for incerta (timeout, 5xx), o post vira **Erro** e não é repetido automaticamente: confira no seu perfil antes de aprovar de novo.
- **LGPD**: exportar dados (JSON), apagar conta e todos os dados, página `/privacidade`, registros de acesso apagados após 6 meses.

## 1. Criar o app no LinkedIn

1. Acesse [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) e clique em **Create app**.
2. Preencha nome, logo e aceite os termos. O campo **LinkedIn Page** é obrigatório: associe uma página da qual você é administrador, ou crie uma página simples para isso. O admin da página precisa verificar a associação (aba **Settings** > **Verify**).
3. Na aba **Products**, adicione os dois produtos (ambos self-serve):
   - **Sign In with LinkedIn using OpenID Connect**: dá `openid`, `profile` e `email`.
   - **Share on LinkedIn**: dá `w_member_social`.
4. Na aba **Auth**:
   - Copie o **Client ID** e o **Primary Client Secret**. Eles vão para `AUTH_LINKEDIN_ID` e `AUTH_LINKEDIN_SECRET`.
   - Em **Authorized redirect URLs for your app**, adicione:
     - `http://localhost:3000/api/auth/callback` (desenvolvimento)
     - `https://SEU-DOMINIO/api/auth/callback` (produção, igual a `APP_URL` + `/api/auth/callback`)
   - Confira em **OAuth 2.0 scopes** se aparecem `openid`, `profile`, `email` e `w_member_social`.

A versão da API (`LINKEDIN_VERSION`, formato `YYYYMM`) é suportada por pelo menos 1 ano. Atualize pelo menos uma vez por ano; a lista fica em [versioning](https://learn.microsoft.com/en-us/linkedin/marketing/versioning).

## 2. Banco de dados (Neon)

1. Crie um projeto no [Neon](https://console.neon.tech), ou pela Vercel em **Storage** > **Neon** (Marketplace).
2. Copie a connection string para `DATABASE_URL`.
3. Aplique as migrations:

   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

## 3. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha. Para gerar as chaves:

```bash
openssl rand -base64 32   # TOKEN_ENC_KEY e CRON_SECRET (um valor diferente para cada)
```

| Variável | O que é |
| --- | --- |
| `DATABASE_URL` | Postgres (Neon em produção) |
| `AUTH_LINKEDIN_ID` / `AUTH_LINKEDIN_SECRET` | Client ID e Secret do app do LinkedIn |
| `ALLOWED_EMAIL` | Único e-mail que pode entrar (o e-mail principal da sua conta LinkedIn) |
| `TOKEN_ENC_KEY` | 32 bytes em base64 para criptografar o token do LinkedIn. Se trocar, é preciso entrar de novo |
| `ANTHROPIC_API_KEY` | Chave da [Claude API](https://console.anthropic.com) |
| `LINKEDIN_VERSION` | Versão da API REST do LinkedIn (`YYYYMM`) |
| `CRON_SECRET` | Segredo compartilhado com o GitHub Actions |
| `APP_URL` | URL pública sem barra no final |

## 4. Deploy na Vercel

1. Importe o repositório em [vercel.com/new](https://vercel.com/new).
2. Em **Settings** > **Environment Variables**, cadastre todas as variáveis acima, com `APP_URL` igual ao domínio de produção.
3. Faça o deploy e adicione `https://SEU-DOMINIO/api/auth/callback` nas redirect URLs do app no LinkedIn.

## 5. Agendamento (GitHub Actions)

No repositório do GitHub, vá em **Settings** > **Secrets and variables** > **Actions** e crie:

- `APP_URL`: a mesma URL de produção.
- `CRON_SECRET`: o mesmo valor configurado na Vercel.

O workflow `.github/workflows/publish.yml` roda a cada 5 minutos. Também dá para disparar manualmente em **Actions** > **Publicar posts agendados** > **Run workflow**. Observações:

- O cron do GitHub pode atrasar alguns minutos em horários de pico.
- O GitHub desativa workflows agendados de repositórios públicos após 60 dias sem commits. Se acontecer, reative na aba **Actions**.

## Desenvolvimento local

```bash
npm install
npx prisma dev -n linkedin-manager --db-port 51214 --detach   # Postgres local
# .env: DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
#       DATABASE_POOL_MAX="1"   (o prisma dev aceita uma conexão por vez)
npx prisma migrate deploy
npm run dev
```

Testes:

```bash
npm test                                    # unitários
TEST_DATABASE_URL="postgres://..." npm test # inclui integração (idempotência da publicação, exclusão de conta)
```

Os testes de integração apagam e criam dados: use um banco de teste, nunca o de produção.
