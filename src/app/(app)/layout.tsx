import Link from "next/link";
import { requireUser } from "@/lib/session";
import { tokenStatus } from "@/lib/token-expiry";
import { logout } from "@/app/actions/auth";

// Todas as telas dependem da sessão e de dados privados: renderiza no servidor a cada request.
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const token = tokenStatus(user.linkedinAccount?.expiresAt);

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
          <Link href="/" className="font-semibold">LinkedIn Manager</Link>
          <Link href="/posts/new">Novo post</Link>
          <Link href="/historico">Histórico</Link>
          <Link href="/configuracoes">Configurações</Link>
          <form action={logout} className="ml-auto">
            <button type="submit" className="text-neutral-500 hover:underline">Sair</button>
          </form>
        </nav>
      </header>

      {token.state !== "ok" && (
        <div role="alert" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {token.state === "expiring"
            ? `O acesso ao LinkedIn expira em ${token.days} dia(s). `
            : "O acesso ao LinkedIn expirou: posts agendados não serão publicados. "}
          <a href="/api/auth/login" className="font-medium underline">Entrar de novo</a>
        </div>
      )}

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
