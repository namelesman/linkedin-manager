"use client";

import { useActionState } from "react";
import { addImage, removeImage } from "@/app/actions/images";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";
import { MAX_IMAGES } from "@/lib/images";

type Image = { id: string; altText: string; hasData: boolean };

export function ImageManager({ postId, images, editable }: { postId: string; images: Image[]; editable: boolean }) {
  const [state, upload] = useActionState(addImage.bind(null, postId), {});

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">Imagens ({images.length}/{MAX_IMAGES})</h2>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <li key={image.id} className="flex flex-col gap-1">
              {image.hasData ? (
                // eslint-disable-next-line @next/next/no-img-element -- imagem privada servida pela própria API
                <img src={`/api/images/${image.id}`} alt={image.altText} className="aspect-square w-full rounded object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded bg-neutral-100 text-xs text-neutral-500 dark:bg-neutral-900">
                  Já enviada ao LinkedIn
                </div>
              )}
              {editable && (
                <form action={removeImage.bind(null, postId, image.id)}>
                  <button type="submit" className="text-xs text-red-700 hover:underline dark:text-red-400">Remover</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && images.length < MAX_IMAGES && (
        <form action={upload} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="file" name="image" accept="image/jpeg,image/png,image/gif" required className="text-sm" />
          <input
            type="text"
            name="altText"
            maxLength={300}
            placeholder="Texto alternativo (acessibilidade)"
            className="flex-1 rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
          />
          <SubmitButton pendingText="Enviando...">Adicionar</SubmitButton>
          <FormMessage state={state} />
        </form>
      )}
    </section>
  );
}
