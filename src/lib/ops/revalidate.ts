/** Refreshes the statically rendered site after a catalogue/settings change. */
export async function revalidateSite() {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");
  } catch {
    /* Outside a Next request (tests, scripts): nothing to revalidate. */
  }
}
