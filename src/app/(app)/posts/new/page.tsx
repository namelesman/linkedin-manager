import { NewPostForm } from "./new-post-form";

// A geração pela Claude API pode levar algumas dezenas de segundos.
export const maxDuration = 60;

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Novo post</h1>
      <NewPostForm />
    </div>
  );
}
