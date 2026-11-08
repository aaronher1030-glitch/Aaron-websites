import { Link, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import { RichText } from "../components/RichText";
import { CHAPTER_NOTES } from "../data/notes";
import NotFound from "./NotFound";

function NoteBody({ slug }: { slug: string }) {
  const note = CHAPTER_NOTES.find((entry) => entry.slug === slug);
  if (!note) return <NotFound />;

  const index = CHAPTER_NOTES.findIndex((entry) => entry.slug === slug);
  const previous = index > 0 ? CHAPTER_NOTES[index - 1] : null;
  const next = index < CHAPTER_NOTES.length - 1 ? CHAPTER_NOTES[index + 1] : null;

  return (
    <article className="ref-detail note-detail">
      <PageMeta
        title={note.title}
        description={note.summary}
        path={`/notes/${note.slug}`}
      />

      <Link className="ref-back" to="/notes">
        <Icon name="arrow-left" size={15} /> All chapter notes
      </Link>

      <header className="ref-head">
        <p className="page-eyebrow">Chapter {note.chapter}</p>
        <h1>{note.title}</h1>
        <p className="ref-lede">{note.summary}</p>
      </header>

      <section className="ref-section" aria-labelledby="big-idea">
        <h2 id="big-idea">The big idea</h2>
        <p className="ref-prose">{note.bigIdea}</p>
      </section>

      <section className="ref-section" aria-labelledby="formulas">
        <h2 id="formulas">Formulas to keep close</h2>
        <ul className="formula-list">
          {note.formulas.map((formula) => (
            <li key={formula}>
              <RichText text={`$$${formula}$$`} />
            </li>
          ))}
        </ul>
      </section>

      <div className="ref-two-col">
        <section className="ref-section" aria-labelledby="traps">
          <h2 id="traps">Traps</h2>
          <ul className="ref-list ref-list-traps">
            {note.traps.map((trap) => (
              <li key={trap}>{trap}</li>
            ))}
          </ul>
        </section>

        <section className="ref-section" aria-labelledby="checklist">
          <h2 id="checklist">Checklist</h2>
          <ul className="ref-list ref-list-check">
            {note.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ref-cta">
        <div>
          <h2>Turn the note into reps</h2>
          <p>Drill every bank item tagged to chapter {note.chapter}.</p>
        </div>
        <Link
          className="home-button home-button-primary"
          to={`/practice?preset=chapter&chapter=${note.chapter}`}
        >
          <Icon name="target" size={16} /> Drill chapter {note.chapter}
        </Link>
      </div>

      <nav className="ref-pager" aria-label="Chapter notes">
        {previous ? (
          <Link className="ref-pager-link" to={`/notes/${previous.slug}`}>
            <span className="ref-pager-label">Previous</span>
            <span>
              <Icon name="arrow-left" size={14} /> Chapter {previous.chapter}:{" "}
              {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="ref-pager-link ref-pager-next" to={`/notes/${next.slug}`}>
            <span className="ref-pager-label">Next</span>
            <span>
              Chapter {next.chapter}: {next.title}{" "}
              <Icon name="arrow-right" size={14} />
            </span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

export default function NotePage() {
  const { slug = "" } = useParams();
  return <NoteBody key={slug} slug={slug} />;
}
