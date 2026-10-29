import Link from "next/link";

export const metadata = { title: "Privacidade · LinkedIn Manager" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Privacidade</h1>
      <p>
        Este painel é de uso pessoal: só o titular da conta configurada consegue entrar. Mesmo assim, segue as boas práticas
        da Lei Geral de Proteção de Dados (Lei 13.709/2018).
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">O que é guardado</h2>
        <ul className="list-disc pl-5">
          <li>Do login no LinkedIn: nome, e-mail e identificador da conta (OpenID Connect).</li>
          <li>O token de acesso do LinkedIn, criptografado (AES-256-GCM), e a data em que expira.</li>
          <li>Tom de voz, briefings, textos dos posts, agendamentos e status de publicação.</li>
          <li>Imagens anexadas, só até a publicação. Depois fica apenas o identificador da imagem no LinkedIn.</li>
          <li>Registro de cada login (endereço IP, data e hora), apagado automaticamente após 6 meses.</li>
        </ul>
        <p>Não há cookies de rastreamento nem analytics. Os cookies usados são só os de sessão e de segurança do login.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Para que serve</h2>
        <p>Entrar no painel, gerar rascunhos, publicar no seu perfil do LinkedIn quando você aprova e manter o histórico.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Quem processa os dados</h2>
        <ul className="list-disc pl-5">
          <li>LinkedIn: login e publicação dos posts aprovados.</li>
          <li>
            Anthropic (EUA): recebe o briefing e o tom de voz para gerar o rascunho. É uma transferência internacional de
            dados (LGPD art. 33); não coloque dados pessoais de terceiros nos briefings.
          </li>
          <li>Vercel (hospedagem) e Neon (banco de dados).</li>
          <li>GitHub Actions: só dispara a verificação de posts agendados, sem acesso aos dados.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Seus direitos</h2>
        <p>
          Em Configurações você pode baixar todos os seus dados em JSON (acesso e portabilidade, art. 18, II e V) e apagar a
          conta com todos os dados guardados aqui (eliminação, art. 18, VI). Posts já publicados ficam no LinkedIn e são
          gerenciados por lá. A permissão do app pode ser removida em{" "}
          <a href="https://www.linkedin.com/psettings/permitted-services" target="_blank" rel="noreferrer" className="underline">
            linkedin.com/psettings/permitted-services
          </a>
          .
        </p>
      </section>

      <Link href="/" className="underline">Voltar</Link>
    </main>
  );
}
