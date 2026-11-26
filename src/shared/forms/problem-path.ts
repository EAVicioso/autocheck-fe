export function formErrorPath(path: string) {
  return path.replace(/^\$\.?/, "").replace(/\[(\d+)\]/g, ".$1")
    .split(".").map((part) => part.replace(/^[A-Z]+(?=[A-Z][a-z]|[^a-zA-Z]|$)|^[A-Z]/, (prefix) => prefix.toLowerCase()))
    .join(".");
}
