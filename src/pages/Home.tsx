import { Band, CtaBar, SectionTitle } from "../components/Band";
import { HomeHero } from "../components/Hero";
import { PageMeta } from "../components/PageMeta";
import { SmartImage } from "../components/SmartImage";
import { ACTIVITIES } from "../content/activities";
import { ABOUT_INTRO, MANDATE } from "../content/site";

/* The three doorway cards on the closing navy band. The artwork is
 * decorative; the white bar carries the label and the destination. */
const DESTINATIONS = [
  { href: "/accomplishments", label: "Accomplishments", art: "/media/destination-accomplishments.webp" },
  { href: "/transparency", label: "Transparency", art: "/media/destination-transparency.webp" },
  { href: "/finance", label: "Financial Reports", art: "/media/destination-finance.webp" },
] as const;

export default function Home() {
  const featured = ACTIVITIES.find((activity) => activity.featured) ?? ACTIVITIES[0];

  return (
    <section className="page page--home">
      <PageMeta
        title="Home"
        description="Official website of the Supreme Secondary Learner Government of Benigno S. Aquino National High School."
        path="/"
      />
      <HomeHero />
      <Band variant="deep" id="latest">
        <SectionTitle title="Latest" lead="Stay Updated with Current SSLG Affairs Here" />
        <div className="home-latest" data-reveal-group>
          {featured.cover.kind === "image" ? (
            <SmartImage
              className="home-latest__media"
              ratio="16 / 9"
              src={featured.cover.src}
              alt={featured.cover.alt ?? featured.title}
              priority
            />
          ) : null}
          <div>
            <h2>{featured.title}</h2>
            <p>{featured.caption}</p>
            <CtaBar href={`/accomplishments/${featured.slug}`}>Read more</CtaBar>
          </div>
        </div>
      </Band>
      <Band variant="mint">
        <SectionTitle title="About us" lead="Get to know your student leaders here" />
        <div className="home-about" data-reveal-group>
          <figure>
            <img
              src="/media/induction-2026.webp"
              alt="SSLG officers at the Onto the Next Leaders induction ceremony"
              decoding="async"
            />
            <figcaption>Onto the Next Leaders Induction Ceremony</figcaption>
          </figure>
          <div>
            <h3>The Supreme Secondary Learner Government</h3>
            <p>{ABOUT_INTRO}</p>
            <CtaBar href="/about-us">Read more</CtaBar>
          </div>
          <div>
            <h3>Our Mandate</h3>
            <p>{MANDATE}</p>
            <CtaBar href="/about-us#mandate">Read more</CtaBar>
          </div>
        </div>
      </Band>
      <Band variant="navy">
        <div className="home-destinations" data-reveal-group>
          {DESTINATIONS.map((destination) => (
            <article key={destination.href}>
              <img src={destination.art} alt="" decoding="async" />
              <CtaBar href={destination.href}>{destination.label}</CtaBar>
            </article>
          ))}
        </div>
      </Band>
    </section>
  );
}
