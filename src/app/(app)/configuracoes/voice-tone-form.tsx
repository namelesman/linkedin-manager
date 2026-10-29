"use client";

import { useActionState } from "react";
import { saveVoiceTone } from "@/app/actions/settings";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";

export function VoiceToneForm({ initial }: { initial: string }) {
  const [state, action] = useActionState(saveVoiceTone, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="voiceTone" className="font-medium">Tom de voz</label>
      <textarea
        id="voiceTone"
        name="voiceTone"
        defaultValue={initial}
        rows={6}
        maxLength={2000}
        placeholder="Ex.: direto, didático, com exemplos práticos de engenharia de software; evita clichês de coach."
        className="rounded border border-neutral-300 bg-transparent p-3 dark:border-neutral-700"
      />
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Salvando...">Salvar</SubmitButton>
        <FormMessage state={state} okText="Salvo." />
      </div>
    </form>
  );
}
