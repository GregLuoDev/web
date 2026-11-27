export type PreviewDataState = "data" | "loading" | "empty" | "error";

export function getPreviewDataState(): PreviewDataState {
  if (typeof window === "undefined") return "data";
  const params = new URLSearchParams(window.location.search);
  const queryState = params.get("previewState");
  if (queryState === "data" || queryState === "loading" || queryState === "empty" || queryState === "error") {
    window.localStorage.setItem("previewState", queryState);
    return queryState;
  }
  const stored = window.localStorage.getItem("previewState");
  if (stored === "data" || stored === "loading" || stored === "empty" || stored === "error") return stored;
  return "data";
}
