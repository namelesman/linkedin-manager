import "server-only";

const API = "https://api.linkedin.com/rest";

// O LinkedIn sempre exige a versão; a mais nova é suportada por pelo menos 1 ano.
function headers(accessToken: string, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": process.env.LINKEDIN_VERSION || "202610",
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

export class LinkedInError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    // true quando não dá para saber se o LinkedIn processou o pedido (timeout, rede, 5xx).
    readonly ambiguous = false,
  ) {
    super(message);
  }
}

async function describe(res: Response): Promise<string> {
  const body = await res.text().catch(() => "");
  try {
    const json = JSON.parse(body);
    return json.message ?? json.serviceErrorCode ?? body.slice(0, 300);
  } catch {
    return body.slice(0, 300);
  }
}

export function personUrn(sub: string): string {
  return `urn:li:person:${sub}`;
}

export async function uploadImage(accessToken: string, owner: string, bytes: Uint8Array, mimeType: string): Promise<string> {
  const init = await fetch(`${API}/images?action=initializeUpload`, {
    method: "POST",
    headers: headers(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ initializeUploadRequest: { owner } }),
    cache: "no-store",
  });
  if (!init.ok) throw new LinkedInError(`initializeUpload falhou: ${await describe(init)}`, init.status);
  const { value } = (await init.json()) as { value: { uploadUrl: string; image: string } };

  const put = await fetch(value.uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": mimeType },
    body: Buffer.from(bytes),
    cache: "no-store",
  });
  if (!put.ok) throw new LinkedInError(`Upload da imagem falhou: ${await describe(put)}`, put.status);
  return value.image;
}

export type PostImageRef = { urn: string; altText: string };

export async function createPost(
  accessToken: string,
  author: string,
  commentary: string,
  images: PostImageRef[],
): Promise<string> {
  const body: Record<string, unknown> = {
    author,
    commentary,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  if (images.length === 1) {
    body.content = { media: { id: images[0].urn, altText: images[0].altText || undefined } };
  } else if (images.length > 1) {
    body.content = { multiImage: { images: images.map((i) => ({ id: i.urn, altText: i.altText || undefined })) } };
  }

  let res: Response;
  try {
    res = await fetch(`${API}/posts`, {
      method: "POST",
      headers: headers(accessToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new LinkedInError(`Sem resposta do LinkedIn (${(error as Error).name})`, undefined, true);
  }

  if (res.status !== 201) {
    throw new LinkedInError(`Publicação recusada: ${await describe(res)}`, res.status, res.status >= 500);
  }
  const urn = res.headers.get("x-restli-id");
  if (!urn) throw new LinkedInError("LinkedIn respondeu 201 sem o id do post", 201, true);
  return urn;
}

export function postUrl(urn: string): string {
  return `https://www.linkedin.com/feed/update/${urn}/`;
}
