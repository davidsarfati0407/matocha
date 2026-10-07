import { renderShareCard } from "./opengraph-image";

export const alt = "MATOCHA - Matcha. Made simple. Un stick Matocha de 2 g tenu devant un matcha latte glacé (visuel de concept).";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Same card as Open Graph, declared explicitly for X / Twitter. */
export default function TwitterImage() {
  return renderShareCard();
}
