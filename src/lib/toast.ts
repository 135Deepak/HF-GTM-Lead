let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(msg: string) {
  if (typeof document === "undefined") return;
  const toastEl = document.getElementById("toast");
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}
