import { Suspense } from "react";
import Link from "next/link";

const ERRORS: Record<string, string> = {
  cancelado: "Login cancelado no LinkedIn.",
  estado: "Sessão de login inválida ou expirada. Tente de novo.",
  linkedin: "Não foi possível falar com o LinkedIn. Tente de novo.",
  "nao-autorizado": "Esta conta não tem acesso a este painel.",
};

async function ErrorMessage({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { erro } = await searchParams;
  const message = typeof erro === "string" ? ERRORS[erro] : undefined;
  if (!message) return null;

  return (
    <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
      {message}
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">LinkedIn Manager</h1>
      <Suspense>
        <ErrorMessage searchParams={searchParams} />
      </Suspense>
      <a
        href="/api/auth/login"
        className="rounded bg-[#0a66c2] px-4 py-2 text-center font-medium text-white hover:bg-[#004182]"
      >
        Entrar com LinkedIn
      </a>
      <p className="text-xs text-neutral-500">
        Ao entrar, você autoriza o uso do seu nome, e-mail e permissão de publicação no LinkedIn.{" "}
        <Link href="/privacidade" className="underline">Privacidade</Link>
      </p>
    </main>
  );
}
