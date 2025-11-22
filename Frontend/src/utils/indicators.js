export function notifyIndicator(key, payload = {}) {
  window.dispatchEvent(
    new CustomEvent("app:indicator", { detail: { key, ...payload } })
  );
}

export function clearIndicator(key) {
  window.dispatchEvent(
    new CustomEvent("app:indicator:clear", { detail: { key } })
  );
}
