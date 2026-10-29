import Link from "next/link";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { tokenStatus } from "@/lib/token-expiry";
import { VoiceToneForm } from "./voice-tone-form";
import { DeleteAccountForm } from "./delete-account-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const expiresAt = user.linkedinAccount?.expiresAt;
  const token = tokenStatus(expiresAt);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <section>
        <VoiceToneForm initial={user.voiceTone} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Conexão com o LinkedIn</h2>
        <p className="text-sm">
          {user.name ? `${user.name} · ` : ""}
          {user.email}
        </p>
        <p className="text-sm">
          {expiresAt
            ? token.state === "expired"
              ? `Acesso expirado em ${formatDateTime(expiresAt)}.`
              : `Acesso válido até ${formatDateTime(expiresAt)} (${token.days} dia(s)).`
            : "Sem acesso salvo."}{" "}
          <a href="/api/auth/login" className="underline">Renovar agora</a>
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Seus dados</h2>
        <p className="text-sm">
          <a href="/api/account/export" className="underline">Baixar meus dados (JSON)</a> ·{" "}
          <Link href="/privacidade" className="underline">Como os dados são tratados</Link>
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded border border-red-300 p-4 dark:border-red-900">
        <h2 className="font-medium text-red-800 dark:text-red-300">Apagar conta</h2>
        <DeleteAccountForm />
        <p className="text-xs text-neutral-500">
          Para remover também a permissão deste app no LinkedIn, acesse{" "}
          <a href="https://www.linkedin.com/psettings/permitted-services" target="_blank" rel="noreferrer" className="underline">
            linkedin.com/psettings/permitted-services
          </a>
          .
        </p>
      </section>
    </div>
  );
}
