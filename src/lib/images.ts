// fut.gg card renders are tall with transparent edges; cropping them to a 16:9 box cuts the card.
export function isCardArt(url: string | null | undefined): boolean {
  return !!url && url.includes("futgg-player-item-card");
}
