/**
 * A pure-CSS document sheet: 4:5 white card, three grey rules, a gold tab,
 * a 13px caps label and an optional navy "Read here" pill. No image request,
 * so it renders identically offline and as the 56px row fallback. Decorative
 * everywhere it is used — the real label is adjacent text (the card label or
 * the file name) — so the whole plate is hidden from assistive tech.
 */
export function DocumentPlate({
  label,
  readHere = false,
  className = "",
}: {
  label: string;
  readHere?: boolean;
  className?: string;
}) {
  return (
    <span className={`doc-plate ${className}`.trim()} aria-hidden="true">
      <span className="doc-plate__tab" />
      <span className="doc-plate__rules">
        <span className="doc-plate__rule" />
        <span className="doc-plate__rule" />
        <span className="doc-plate__rule" />
      </span>
      {readHere ? <span className="doc-plate__pill">Read here</span> : null}
      <span className="doc-plate__label">{label}</span>
    </span>
  );
}
