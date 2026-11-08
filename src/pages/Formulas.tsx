import { Link } from "react-router-dom";
import { PageMeta } from "../components/PageMeta";
import { Tex } from "../components/Tex";
import {
  ACTIVITY_NOTE,
  ACTIVITY_SERIES,
  CONSTANTS,
  FORMULA_SECTIONS,
  SOLUBILITY_RULES,
} from "../data/formulas";

export default function Formulas() {
  return (
    <div className="ref-page formulas-page">
      <PageMeta
        title="Formula sheet"
        description="A printable PNCO formula sheet: constants, measurement and error, stoichiometry, gases, thermochemistry, quantum, equilibrium, electrochemistry, solutions, and lab calculations."
        path="/formulas"
      />

      <header className="ref-head">
        <p className="page-eyebrow">Reference</p>
        <h1>Formula sheet</h1>
        <p className="ref-lede">
          The working set for PNCO papers: constants, the equations worth
          internalising, solubility rules, and the activity series. Every card
          renders the same expression you would write by hand.
        </p>
        <div className="ref-actions">
          <button
            className="home-button home-button-secondary"
            type="button"
            onClick={() => window.print()}
          >
            Print this sheet
          </button>
          <span className="ref-note ref-note-inline">
            Check units before substituting. A correct equation with mismatched
            units still loses the mark.
          </span>
        </div>
      </header>

      <nav className="formula-toc" aria-label="Formula sheet sections">
        {FORMULA_SECTIONS.map((section) => (
          <a key={section.slug} href={`#${section.slug}`}>
            {section.title}
          </a>
        ))}
        <a href="#constants">Constants</a>
        <a href="#solubility">Solubility</a>
        <a href="#activity">Activity series</a>
      </nav>

      <section className="ref-section" id="constants" aria-labelledby="constants-title">
        <h2 id="constants-title">Constants and conversion factors</h2>
        <div className="formula-table-wrap">
          <table className="formula-table">
            <caption className="sr-only">
              Physical constants used in ChemBank calculations
            </caption>
            <thead>
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Quantity</th>
                <th scope="col">Value</th>
                <th scope="col">Unit</th>
              </tr>
            </thead>
            <tbody>
              {CONSTANTS.map((constant) => (
                <tr key={constant.symbol}>
                  <th scope="row">
                    <span className="formula-symbol">{constant.symbol}</span>
                  </th>
                  <td>
                    {constant.name}
                    {constant.note ? (
                      <span className="formula-table-note">{constant.note}</span>
                    ) : null}
                  </td>
                  <td className="formula-value">{constant.value}</td>
                  <td className="formula-unit">{constant.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {FORMULA_SECTIONS.map((section) => (
        <section
          className="ref-section formula-section"
          id={section.slug}
          key={section.slug}
          aria-labelledby={`${section.slug}-title`}
        >
          <div className="formula-section-head">
            <h2 id={`${section.slug}-title`}>{section.title}</h2>
            {section.chapter ? (
              <Link className="badge" to={`/notes`}>
                Chapter {section.chapter} notes
              </Link>
            ) : null}
          </div>
          <p className="ref-prose">{section.summary}</p>
          <div className="formula-grid">
            {section.formulas.map((formula) => (
              <article className="formula-card" key={`${section.slug}-${formula.name}`}>
                <h3>{formula.name}</h3>
                <div className="formula-expression">
                  <Tex display>{formula.tex}</Tex>
                </div>
                {formula.note ? <p>{formula.note}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="ref-section" id="solubility" aria-labelledby="solubility-title">
        <h2 id="solubility-title">Solubility rules</h2>
        <p className="ref-prose">
          Use these as a fast first pass. A precipitate can still form from a
          “soluble” salt when concentrations are high enough to exceed K<sub>sp</sub>.
        </p>
        <div className="rule-grid">
          {SOLUBILITY_RULES.map((group) => (
            <article className="rule-card" key={group.heading}>
              <h3>{group.heading}</h3>
              <ul className="ref-list">
                {group.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="ref-section" id="activity" aria-labelledby="activity-title">
        <h2 id="activity-title">Activity series</h2>
        <p className="ref-prose">{ACTIVITY_NOTE}</p>
        <ol className="activity-list">
          {ACTIVITY_SERIES.map((couple) => (
            <li key={couple}>{couple}</li>
          ))}
        </ol>
        <p className="ref-note">
          The series runs from the most easily oxidised metal at the top to the
          least at the bottom. Hydrogen is the reference couple.
        </p>
      </section>
    </div>
  );
}
