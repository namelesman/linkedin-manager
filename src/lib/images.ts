// Limites aceitos pelo LinkedIn: JPG, PNG ou GIF, até 20 imagens por post.
// O tamanho máximo fica abaixo do limite de corpo do request (4 MB) para caber num upload só.
export const MAX_IMAGES = 20;
export const MAX_IMAGE_BYTES = 4_000_000;

const SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
];

// Detecta o tipo pelo conteúdo, não pela extensão nem pelo Content-Type enviado pelo navegador.
export function detectImageType(data: Uint8Array): string | null {
  for (const { mime, bytes } of SIGNATURES) {
    if (bytes.every((b, i) => data[i] === b)) return mime;
  }
  return null;
}
