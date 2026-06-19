export function isLiveCpmMode(): boolean {
  return process.env.CATBOX_LIVE_CPM === "1";
}
