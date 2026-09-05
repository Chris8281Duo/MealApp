// Offline (file://) share-link encoding: gzip the board JSON and stuff it in the URL.

export async function encodeSharedPayload(payload) {
  const json = JSON.stringify(payload);
  const compressed = await gzipText(json);
  return bytesToBase64Url(compressed);
}

export async function decodeSharedPayload(value) {
  const bytes = base64UrlToBytes(value);
  const json = await gunzipBytes(bytes);
  return JSON.parse(json);
}

export async function gzipText(value) {
  if (typeof CompressionStream === "undefined") {
    return new TextEncoder().encode(value);
  }

  const stream = new Blob([value]).stream().pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

export async function gunzipBytes(bytes) {
  if (typeof DecompressionStream === "undefined") {
    return new TextDecoder().decode(bytes);
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

export function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
