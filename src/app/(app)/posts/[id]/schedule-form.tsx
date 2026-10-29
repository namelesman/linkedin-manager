"use client";

import { useActionState } from "react";
import { schedulePost } from "@/app/actions/posts";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";

export function ScheduleForm({ id, initial }: { id: string; initial?: string }) {
  const [state, action] = useActionState(schedulePost.bind(null, id), {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <label htmlFor="scheduledAt" className="text-sm">Agendar para</label>
      <input
        id="scheduledAt"
        type="datetime-local"
        name="scheduledAt"
        defaultValue={initial}
        required
        className="rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
      />
      <span className="text-xs text-neutral-500">horário de Brasília</span>
      <SubmitButton pendingText="Agendando...">{initial ? "Reagendar" : "Agendar"}</SubmitButton>
      <FormMessage state={state} okText="Agendado." />
    </form>
  );
}
