export function useSearchPalette() {
  const open = useState("search-palette-open", () => false);
  return { open };
}
