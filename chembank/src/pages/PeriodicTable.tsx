import { useMemo, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import {
  ACTINIDES,
  CATEGORY_LABELS,
  ELEMENTS,
  LANTHANIDES,
  type Element,
} from "../data/periodic";

const GROUP_NUMBERS = Array.from({ length: 18 }, (_, index) => index + 1);

/** Every rendered element keyed by its visual row:column position. */
const CELL_BY_POSITION = new Map<string, Element>();

for (const element of ELEMENTS) {
  if (element.category === "lanthanide") {
    const index = LANTHANIDES.findIndex((entry) => entry.z === element.z);
    CELL_BY_POSITION.set(`${9}:${index + 3}`, element);
    continue;
  }
  if (element.category === "actinide") {
    const index = ACTINIDES.findIndex((entry) => entry.z === element.z);
    CELL_BY_POSITION.set(`${10}:${index + 3}`, element);
    continue;
  }
  if (element.group === null) continue;
  CELL_BY_POSITION.set(`${element.period + 1}:${element.group}`, element);
}

/** The group-3 marker in periods 6 and 7 opens the first f-block element. */
const POSITION_BY_Z = new Map<number, { row: number; column: number }>();
for (const [position, element] of CELL_BY_POSITION) {
  const [row, column] = position.split(":").map(Number);
  POSITION_BY_Z.set(element.z, { row, column });
}

CELL_BY_POSITION.set("7:3", LANTHANIDES[0]);
CELL_BY_POSITION.set("8:3", ACTINIDES[0]);

function categorySlug(category: Element["category"]): string {
  return category.replace(/\s+/g, "-");
}

function focusNeighbor(z: number, key: string) {
  const position = POSITION_BY_Z.get(z);
  if (!position) return;
  const delta =
    key === "ArrowLeft"
      ? { row: 0, column: -1 }
      : key === "ArrowRight"
        ? { row: 0, column: 1 }
        : key === "ArrowUp"
          ? { row: -1, column: 0 }
          : key === "ArrowDown"
            ? { row: 1, column: 0 }
            : null;
  if (!delta) return;
  const target = CELL_BY_POSITION.get(
    `${position.row + delta.row}:${position.column + delta.column}`,
  );
  if (target) document.getElementById(`pt-${target.z}`)?.focus();
}

function ElementButton({
  element,
  selected,
  onSelect,
}: {
  element: Element;
  selected: boolean;
  onSelect: (element: Element) => void;
}) {
  const position = POSITION_BY_Z.get(element.z);
  return (
    <button
      id={`pt-${element.z}`}
      type="button"
      className="element-cell"
      data-category={categorySlug(element.category)}
      data-selected={selected ? "true" : undefined}
      style={{
        gridColumn: position?.column,
        gridRow: position?.row,
      }}
      aria-pressed={selected}
      aria-label={`${element.name}, symbol ${element.symbol}, atomic number ${element.z}, relative atomic mass ${element.mass}`}
      onClick={() => onSelect(element)}
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key.startsWith("Arrow")) {
          event.preventDefault();
          focusNeighbor(element.z, event.key);
        }
      }}
    >
      <span className="element-z">{element.z}</span>
      <span className="element-symbol">{element.symbol}</span>
      <span className="element-mass">{element.mass}</span>
    </button>
  );
}

export default function PeriodicTable() {
  const [selected, setSelected] = useState<Element>(
    () => ELEMENTS.find((element) => element.z === 6) ?? ELEMENTS[0],
  );

  const detail = useMemo(() => {
    const group =
      selected.group === null
        ? selected.category === "lanthanide"
          ? "Lanthanide series"
          : "Actinide series"
        : `Group ${selected.group}`;
    return `${CATEGORY_LABELS[selected.category]} · ${group} · Period ${selected.period}`;
  }, [selected]);

  return (
    <div className="ref-page periodic-page">
      <PageMeta
        title="Periodic table"
        description="An interactive 118-element periodic table with atomic masses, categories, keyboard navigation, and links into the ChemBank question bank."
        path="/periodic-table"
      />

      <header className="ref-head">
        <p className="page-eyebrow">Reference</p>
        <h1>Periodic table</h1>
        <p className="ref-lede">
          Select an element for its mass, category, and a shortcut into the
          bank. Arrow keys move between cells; Enter opens the detail panel.
        </p>
      </header>

      <div className="periodic-layout">
        <div className="periodic-scroll">
          <div
            className="periodic-grid"
            role="group"
            aria-label="Periodic table of the elements"
          >
            {GROUP_NUMBERS.map((group) => (
              <span
                className="periodic-group-label"
                key={`group-${group}`}
                style={{ gridColumn: group, gridRow: 1 }}
                aria-hidden="true"
              >
                {group}
              </span>
            ))}

            {ELEMENTS.filter(
              (element) => element.group !== null && element.category !== "lanthanide" && element.category !== "actinide",
            ).map((element) => (
              <ElementButton
                key={element.z}
                element={element}
                selected={selected.z === element.z}
                onSelect={setSelected}
              />
            ))}

            <button
              type="button"
              className="periodic-series-marker"
              style={{ gridColumn: 3, gridRow: 7 }}
              onClick={() => setSelected(LANTHANIDES[0])}
            >
              57–71
            </button>
            <button
              type="button"
              className="periodic-series-marker"
              style={{ gridColumn: 3, gridRow: 8 }}
              onClick={() => setSelected(ACTINIDES[0])}
            >
              89–103
            </button>

            <button
              type="button"
              className="periodic-series-label"
              style={{ gridColumn: "1 / span 2", gridRow: 9 }}
              onClick={() => setSelected(LANTHANIDES[0])}
            >
              Lanthanides
            </button>
            {LANTHANIDES.map((element) => (
              <ElementButton
                key={element.z}
                element={element}
                selected={selected.z === element.z}
                onSelect={setSelected}
              />
            ))}

            <button
              type="button"
              className="periodic-series-label"
              style={{ gridColumn: "1 / span 2", gridRow: 10 }}
              onClick={() => setSelected(ACTINIDES[0])}
            >
              Actinides
            </button>
            {ACTINIDES.map((element) => (
              <ElementButton
                key={element.z}
                element={element}
                selected={selected.z === element.z}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>

        <aside className="element-panel" aria-label="Selected element">
          <div className="element-panel-head">
            <span className="element-panel-symbol" aria-hidden="true">
              {selected.symbol}
            </span>
            <div>
              <p className="element-panel-kicker">Element {selected.z}</p>
              <h2>{selected.name}</h2>
              <p className="element-panel-meta">{detail}</p>
            </div>
          </div>
          <dl className="element-facts">
            <div>
              <dt>Relative atomic mass</dt>
              <dd>{selected.mass}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{CATEGORY_LABELS[selected.category]}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>{selected.period}</dd>
            </div>
            <div>
              <dt>Group</dt>
              <dd>{selected.group ?? "f-block"}</dd>
            </div>
          </dl>
          <div className="element-panel-actions">
            <Link
              className="home-button home-button-primary"
              to="/bank?topic=Atomic%20structure"
            >
              <Icon name="search" size={15} /> Questions on atomic structure
            </Link>
            <Link
              className="home-button home-button-secondary"
              to="/practice?preset=chapter&chapter=2"
            >
              <Icon name="target" size={15} /> Drill chapter 2
            </Link>
          </div>
          <p className="element-panel-note">
            Masses are standard atomic weights rounded for exam work. Elements
            without a stable isotope use the mass number of a representative
            isotope.
          </p>
        </aside>
      </div>

      <ul className="periodic-legend" aria-label="Element categories">
        {(Object.keys(CATEGORY_LABELS) as Element["category"][]).map((category) => (
          <li key={category} data-category={categorySlug(category)}>
            <span className="periodic-legend-swatch" aria-hidden="true" />
            {CATEGORY_LABELS[category]}
          </li>
        ))}
      </ul>
    </div>
  );
}
