// "little text format" do campo commentary da Posts API.
// Todo caractere reservado precisa de barra invertida, mesmo fora de menções e hashtags.
const RESERVED = /[|{}@[\]()<>#\\*_~]/g;
const HASHTAG = /(^|\s)#([\p{L}\p{N}_]+)/gu;

export function escapeLittle(text: string): string {
  return text.replace(RESERVED, (ch) => `\\${ch}`);
}

// Escapa o texto e mantém clicáveis as hashtags escritas como #palavra.
export function toCommentary(text: string): string {
  let out = "";
  let last = 0;
  for (const match of text.matchAll(HASHTAG)) {
    const [whole, lead, tag] = match;
    const start = match.index!;
    out += escapeLittle(text.slice(last, start)) + lead + `{hashtag|\\#|${escapeLittle(tag)}}`;
    last = start + whole.length;
  }
  return out + escapeLittle(text.slice(last));
}
