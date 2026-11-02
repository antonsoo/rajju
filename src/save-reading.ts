interface ReadingSave<T> {
  button: HTMLButtonElement;
  cancel: HTMLButtonElement;
  status: HTMLElement;
  capture: () => T;
  save: (snapshot: T, signal: AbortSignal) => Promise<void>;
  success: string;
}
export function readingSave<T>(options: ReadingSave<T>): void {
  let current: AbortController | undefined;
  options.cancel.addEventListener("click", () => current?.abort());
  window.addEventListener("pagehide", () => current?.abort());
  options.button.addEventListener("click", async () => {
    const snapshot = options.capture();
    const controller = new AbortController();
    current = controller;
    options.button.disabled = true;
    options.cancel.hidden = false;
    options.status.textContent =
      "Preparing the reading with verified source pages and local fonts…";
    try {
      await options.save(snapshot, controller.signal);
      options.status.textContent = options.success;
    } catch (error) {
      const cancelled = controller.signal.aborted;
      controller.abort();
      options.status.textContent = cancelled
        ? "Saving cancelled. Your work has not changed."
        : error instanceof Error
          ? error.message
          : "Reading could not be saved. Check the connection and retry.";
    } finally {
      if (current === controller) {
        current = undefined;
        const returnFocus = document.activeElement === options.cancel;
        options.button.disabled = false;
        options.cancel.hidden = true;
        if (returnFocus) options.button.focus();
      }
    }
  });
}
