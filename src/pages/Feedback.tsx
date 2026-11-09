import { Band } from "../components/Band";
import { PageHero } from "../components/Hero";
import { PageMeta } from "../components/PageMeta";
import { FEEDBACK_FORM_URL } from "../config";

/**
 * The official feedback form, embedded in place. The iframe is never wrapped
 * in a link; the fallback line below it opens the same form in a new tab for
 * browsers or networks that refuse the embed.
 */
export default function Feedback() {
  return (
    <section className="page page--feedback">
      <PageMeta
        title="Feedback"
        description="Share feedback with the SSLG through the official BSANHS SSLG feedback form, with an anonymous option for learners who prefer not to give their name."
        path="/feedback"
      />
      <PageHero title="Feedback" />

      <Band variant="mint">
        <div className="feedback-card">
          <h2>Share feedback with the SSLG</h2>
          <p className="feedback-card__intro">
            Tell the SSLG what is working and what is not. Your responses go
            straight to the official BSANHS SSLG feedback form read by the
            officers, and the form offers an anonymous option — you can raise
            a concern without giving your name.
          </p>
          <iframe
            className="feedback-frame"
            src={`${FEEDBACK_FORM_URL}?embedded=true`}
            title="BSANHS SSLG feedback form"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <p className="feedback-fallback">
            Form not loading? <a href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer">Open it in a new tab</a>.
          </p>
        </div>
      </Band>
    </section>
  );
}
