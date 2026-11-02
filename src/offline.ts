interface Inspection {
  type: string;
  complete?: boolean;
  edition: string;
  missing?: string[];
  damaged?: string[];
  error?: string;
}

export async function offlineStatus(element: HTMLElement) {
  if (!import.meta.env.PROD) {
    element.textContent = "Development preview";
    return;
  }
  if (!("serviceWorker" in navigator)) {
    element.textContent =
      "Offline editions are unavailable in this browser. Save an illustrated reading to keep your work.";
    return;
  }
  const status = document.createElement("span");
  const button = document.createElement("button");
  status.textContent = "Preparing offline reading…";
  button.type = "button";
  button.textContent = "Check & repair offline edition";
  button.hidden = true;
  element.replaceChildren(status, document.createTextNode(" "), button);
  let registration: ServiceWorkerRegistration;
  let inspection = 0;
  let failed = false;
  let busy = false;
  let editionMismatch = false;
  let progress: (() => void) | undefined;
  const pending = () => Boolean(registration?.installing || registration?.waiting);
  const apply = (saved: Inspection) => {
    editionMismatch = saved.edition !== __RAJJU_EDITION__;
    if (editionMismatch) {
      status.textContent =
        "A different offline edition controls this page. Keep your layout link, then reload online.";
      button.disabled = true;
      return;
    }
    if (saved.complete) status.textContent = "Reading & source saved offline";
    else if (saved.error) status.textContent = saved.error;
    else
      status.textContent = `Offline edition incomplete: ${saved.missing?.length ?? 0} missing, ${saved.damaged?.length ?? 0} damaged files. Reconnect and use Check & repair.`;
    button.hidden = false;
    button.disabled = busy || pending();
  };
  const inspect = async (repair = false) => {
    if (busy || editionMismatch) return;
    const attempt = ++inspection;
    if (pending()) {
      status.textContent = registration.active
        ? "Downloading the updated reading & sources…"
        : "Downloading reading & sources for offline use…";
      button.disabled = true;
      return;
    }
    const worker = navigator.serviceWorker.controller;
    if (!worker || worker !== registration.active || worker.state !== "activated") {
      status.textContent = failed
        ? "Offline download unavailable; reading still works online"
        : "Finishing the offline installation…";
      return;
    }
    busy = true;
    button.disabled = true;
    status.textContent = repair
      ? "Checking and repairing the saved reading…"
      : "Checking saved reading & source bytes…";
    const channel = new MessageChannel();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const saved = await new Promise<Inspection>((resolve, reject) => {
        progress = () => {
          clearTimeout(timer);
          timer = setTimeout(
            () =>
              reject(
                new Error("Offline verification stopped responding. Reconnect and try again."),
              ),
            30000,
          );
        };
        progress();
        channel.port1.onmessage = (event) => resolve(event.data);
        worker.postMessage(
          { type: repair ? "RAJJU_REPAIR" : "RAJJU_INSPECT", edition: __RAJJU_EDITION__ },
          [channel.port2],
        );
      });
      if (attempt !== inspection || worker !== navigator.serviceWorker.controller) return;
      busy = false;
      apply(saved);
    } catch (error) {
      if (attempt === inspection)
        status.textContent =
          error instanceof Error
            ? error.message
            : "Offline verification unavailable. Reconnect and retry.";
    } finally {
      clearTimeout(timer);
      if (attempt === inspection) {
        progress = undefined;
        busy = false;
        button.disabled = pending() || editionMismatch;
      }
      channel.port1.close();
      channel.port2.close();
    }
  };
  const watched = new WeakSet<ServiceWorker>();
  const watch = () => {
    // Invalidate a reply from the previous controller without changing the work.
    inspection++;
    busy = false;
    editionMismatch = false;
    for (const worker of [
      registration.installing,
      registration.waiting,
      registration.active,
      navigator.serviceWorker.controller,
    ]) {
      if (!worker) continue;
      if (worker.state === "installed") worker.postMessage({ type: "RAJJU_ACTIVATE" });
      if (watched.has(worker)) continue;
      watched.add(worker);
      let activated = worker.state === "activated";
      if (worker === registration.installing) failed = false;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") worker.postMessage({ type: "RAJJU_ACTIVATE" });
        if (worker.state === "activated") activated = true;
        if (worker.state === "redundant" && !activated) failed = true;
        void inspect();
      });
    }
    void inspect();
  };
  try {
    registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
    registration.addEventListener("updatefound", watch);
    navigator.serviceWorker.addEventListener("controllerchange", watch);
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.source !== navigator.serviceWorker.controller) return;
      const data = event.data as Inspection;
      if (data?.type === "RAJJU_REPAIR_PROGRESS" && data.edition === __RAJJU_EDITION__) {
        progress?.();
        status.textContent = "Repairing offline reading & sources…";
      } else if (data?.type === "RAJJU_EDITION") apply(data);
    });
    button.addEventListener("click", () => void inspect(true));
    window.addEventListener("focus", () => void inspect());
    window.addEventListener("online", () => void inspect());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void inspect();
    });
    watch();
  } catch {
    status.textContent = "Offline download unavailable; reading still works online";
  }
}
