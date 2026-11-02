import { verifiedAsset } from "./assets";

/** Display only the bytes checked for this caption; superseded reads cannot win. */
export class SourceViewer {
  private path = "";
  private alt = "";
  private generation = 0;
  private controller: AbortController | undefined;
  private url: string | undefined;
  private pan: HTMLElement;
  constructor(
    private image: HTMLImageElement,
    private link: HTMLAnchorElement,
    private status: HTMLElement,
    private retry: HTMLButtonElement,
    private reset: () => void,
  ) {
    const pan = image.closest<HTMLElement>(".source-pan");
    if (!pan) throw new Error("Source viewer needs a panning region.");
    this.pan = pan;
    retry.addEventListener("click", () => this.show(this.path, this.alt, true));
  }
  show(path: string, alt: string, force = false): void {
    if ((path === this.path && !force) || (force && this.image.dataset.sourceState === "loading"))
      return;
    this.path = path;
    this.alt = alt;
    const generation = ++this.generation;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = undefined;
    this.image.hidden = true;
    this.pan.hidden = true;
    this.image.removeAttribute("src");
    this.image.dataset.sourceState = "loading";
    this.image.dataset.sourcePath = path;
    this.link.removeAttribute("href");
    this.link.setAttribute("aria-disabled", "true");
    this.status.textContent = "Checking the complete source page…";
    this.retry.hidden = !force;
    this.retry.setAttribute("aria-disabled", "true");
    this.retry.textContent = "Checking selected page…";
    this.reset();
    void (async () => {
      let url: string | undefined;
      try {
        const bytes = await verifiedAsset(path, controller.signal);
        if (generation !== this.generation) return;
        url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
        const probe = new Image();
        probe.src = url;
        await probe.decode();
        if (generation !== this.generation) {
          URL.revokeObjectURL(url);
          return;
        }
        this.url = url;
        this.image.src = url;
        this.image.alt = alt;
        this.image.hidden = false;
        this.pan.hidden = false;
        this.image.dataset.sourceState = "ready";
        this.link.href = url;
        this.link.removeAttribute("aria-disabled");
        this.status.textContent = "Complete page verified for this reading.";
        if (document.activeElement === this.retry) this.link.focus();
        this.retry.hidden = true;
      } catch {
        if (url) URL.revokeObjectURL(url);
        if (generation !== this.generation) return;
        this.image.dataset.sourceState = "error";
        this.status.textContent =
          "The reading could not verify this source page. Check the connection and retry.";
        this.retry.hidden = false;
        this.retry.removeAttribute("aria-disabled");
        this.retry.textContent = "Retry selected page";
      }
    })();
  }
}
