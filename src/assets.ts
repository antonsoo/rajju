export function download(body: Blob, name: string): void {
  const url = URL.createObjectURL(body);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function verifiedAsset(
  path: string,
  signal?: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> {
  const size = __ASSET_SIZES__[path];
  if (size === undefined || !__ASSET_HASHES__[path])
    throw new Error("This file is not part of the current reading.");
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.throwIfAborted();
  signal?.addEventListener("abort", abort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(
      () =>
        controller.abort(
          new Error(`The download of ${path} stopped arriving. Check the connection and retry.`),
        ),
      20000,
    );
  };
  reset();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
      signal: controller.signal,
    });
    if (!response.ok || !response.body) throw new Error(`Could not load ${path}. Retry online.`);
    reset();
    const reader = response.body.getReader();
    const bytes = new Uint8Array(size);
    let length = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      reset();
      if (length + part.value.byteLength > size) {
        await reader.cancel();
        throw new Error(`The saved edition could not verify ${path}. Reload online and retry.`);
      }
      bytes.set(part.value, length);
      length += part.value.byteLength;
    }
    if (length !== size)
      throw new Error(`The saved edition could not verify ${path}. Reload online and retry.`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const actual = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    if (actual !== __ASSET_HASHES__[path])
      throw new Error(`The saved edition could not verify ${path}. Reload online and retry.`);
    signal?.throwIfAborted();
    return bytes;
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timer);
    controller.abort();
    signal?.removeEventListener("abort", abort);
  }
}

export function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
}
