"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/actions/account";
import { FormMessage } from "@/components/form-message";
import { DELETE_CONFIRM_WORD } from "@/lib/limits";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm">
        Apaga sua conta neste painel e tudo o que está guardado aqui: token do LinkedIn, rascunhos, agendamentos, imagens e
        registros de acesso. Não dá para desfazer. Posts já publicados continuam no LinkedIn.
      </p>
      <label htmlFor="confirm" className="text-sm">
        Digite <strong>{DELETE_CONFIRM_WORD}</strong> para confirmar
      </label>
      <input
        id="confirm"
        name="confirm"
        autoComplete="off"
        className="w-48 rounded border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 disabled:opacity-60"
        >
          {pending ? "Apagando..." : "Apagar conta e dados"}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
