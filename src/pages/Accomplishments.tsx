import { useMemo } from "react";
import { ActivityCard } from "../components/ActivityCard";
import { Band, CtaBar, SectionTitle } from "../components/Band";
import { PageHero } from "../components/Hero";
import { PageMeta } from "../components/PageMeta";
import { ACCOMPLISHMENT_REPORTS_URL } from "../config";
import { ACTIVITIES } from "../content/activities";
import { useAlbums } from "../lib/useAlbums";

export default function Accomplishments() {
  // One subscription for the whole grid. The shared useAlbums promise means
  // this is also the only /api/albums request on the page; cards receive the
  // resolved lookup and fall back to their initials plate while it is empty
  // (loading, error, or an album without a cover).
  const { data } = useAlbums();
  const albumCovers = useMemo(() => {
    const covers = new Map<string, string | null>();
    for (const year of data?.years ?? []) {
      for (const term of year.terms) {
        for (const album of term.albums) covers.set(album.id, album.cover);
      }
    }
    return covers;
  }, [data]);

  return (
    <section className="page page--accomplishments">
      <PageMeta
        title="Accomplishments"
        description="Programmes, events and projects of the SSLG and LGCC, with photo albums and accomplishment reports from the public Drive vault."
        path="/accomplishments"
      />
      <PageHero
        title="Accomplishments"
        lead="The programmes, events and projects of the Supreme Secondary Learner Government and the LGCC, with their records in the public Drive vault."
      />
      <Band variant="navy">
        <SectionTitle
          title="Activity record"
          lead="Every activity opens its own record. Photo albums load from the PIO's public Drive; accomplishment reports open in the vault."
        />
        <div className="activity-grid">
          {ACTIVITIES.map((activity) => (
            <ActivityCard key={activity.slug} activity={activity} albumCovers={albumCovers} />
          ))}
        </div>
      </Band>
      <Band variant="deep">
        <CtaBar href={ACCOMPLISHMENT_REPORTS_URL} external>
          Read more accomplishment reports
        </CtaBar>
      </Band>
    </section>
  );
}
