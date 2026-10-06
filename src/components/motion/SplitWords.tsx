/**
 * Splits a heading into masked words for the word-by-word reveal. The text
 * stays real text (readable, selectable, indexed); spaces stay text nodes.
 */
export function SplitWords({ text, start = 0 }: { text: string; start?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="word">
            <span style={{ "--i": start + i } as React.CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}
