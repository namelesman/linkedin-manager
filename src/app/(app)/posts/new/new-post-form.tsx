"use client";

import { useActionState } from "react";
import { createDraft } from "@/app/actions/posts";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";

export function NewPostForm() {
  const [state, action] = useActionState(createDraft, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="briefing" className="font-medium">Tema ou briefing</label>
      <textarea
        id="briefing"
        name="briefing"
        rows={8}
        required
        minLength={10}
        maxLength={5000}
        placeholder="Sobre o que é o post, para quem, qual a mensagem principal, algum exemplo ou dado seu."
        className="rounded border border-neutral-300 bg-transparent p-3 dark:border-neutral-700"
      />
      <p className="text-xs text-neutral-500">
        O briefing é enviado à Claude API (Anthropic, EUA) para gerar o rascunho. Não inclua dados pessoais de terceiros.
      </p>
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Gerando rascunho...">Gerar rascunho</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
