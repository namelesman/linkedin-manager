"use client";

import { useActionState, useState } from "react";
import { regeneratePost, savePostText } from "@/app/actions/posts";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";
import { LINKEDIN_MAX_CHARS } from "@/lib/limits";

export function PostEditor({ id, text, editable }: { id: string; text: string; editable: boolean }) {
  const [value, setValue] = useState(text);
  const [saveState, save] = useActionState(savePostText.bind(null, id), {});
  const [regenState, regenerate] = useActionState(regeneratePost.bind(null, id), {});
  const over = value.length > LINKEDIN_MAX_CHARS;

  return (
    <div className="flex flex-col gap-3">
      <form action={save} className="flex flex-col gap-3">
        <textarea
          name="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={!editable}
          rows={16}
          aria-label="Texto do post"
          className="rounded border border-neutral-300 bg-transparent p-3 leading-relaxed dark:border-neutral-700"
        />
        <div className="flex flex-wrap items-center gap-3">
          <span className={`text-xs ${over ? "text-red-700 dark:text-red-400" : "text-neutral-500"}`}>
            {value.length}/{LINKEDIN_MAX_CHARS}
          </span>
          {editable && (
            <>
              <SubmitButton pendingText="Salvando...">Salvar texto</SubmitButton>
              <FormMessage state={saveState} okText="Salvo." />
            </>
          )}
        </div>
      </form>
      {editable && (
        <form action={regenerate} className="flex items-center gap-3">
          <SubmitButton pendingText="Gerando...">Gerar de novo</SubmitButton>
          <FormMessage state={regenState} />
        </form>
      )}
    </div>
  );
}
