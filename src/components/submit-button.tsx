"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-[#0a66c2] px-4 py-2 font-medium text-white hover:bg-[#004182] disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}
