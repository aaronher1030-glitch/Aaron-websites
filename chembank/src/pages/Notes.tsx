import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import { CHAPTER_NOTES } from "../data/notes";

export default function Notes() {
  return (
    <div className="ref-page">
      <PageMeta
        title="Chapter notes"
        description="Seven original chapter briefings for PNCO chemistry: the big idea, the formulas that matter, the traps, and a short checklist."
        path="/notes"
      />

      <header className="ref-head">
        <p className="page-eyebrow">Chapter notes</p>
        <h1>Chapter notes</h1>
        <p className="ref-lede">
          Seven short briefings that follow the supplied chapter papers. Each
          note gives you the big idea, the formulas worth memorising, the traps
          that cost marks, and a checklist for the last five minutes before a
          drill.
        </p>
        <p className="ref-note">
          These notes are original study prose, not an official PNCO syllabus.
          Work the matching chapter drill after reading.
        </p>
      </header>

      <div className="ref-grid ref-grid-notes">
        {CHAPTER_NOTES.map((note) => (
          <Link className="ref-card note-card" key={note.slug} to={`/notes/${note.slug}`}>
            <span className="ref-card-kicker">Chapter {note.chapter}</span>
            <h2>{note.title}</h2>
            <p>{note.summary}</p>
            <span className="ref-card-meta">
              {note.formulas.length} formulas · {note.traps.length} traps ·{" "}
              {note.checklist.length} checks
            </span>
            <span className="ref-card-go">
              Read the note <Icon name="chevron-right" size={15} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
