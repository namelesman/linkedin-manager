import type { FormState } from "@/app/actions/settings";

export function FormMessage({ state, okText }: { state: FormState; okText?: string }) {
  if (state.error) {
    return <p role="alert" className="text-sm text-red-700 dark:text-red-400">{state.error}</p>;
  }
  if (state.ok && okText) return <p className="text-sm text-green-700 dark:text-green-400">{okText}</p>;
  return null;
}
