import { PageMeta } from "../components/PageMeta";
import { SectionHead } from "../components/SectionHead";

export default function Home() {
  return (
    <section className="page">
      <PageMeta
        title="Home"
        description="Supreme Secondary Learner Government of Benigno S. Aquino National High School."
        path="/"
      />
      <SectionHead
        eyebrow="Official record"
        title="Benigno S. Aquino National High School"
        lead="Supreme Secondary Learner Government — site migration in progress."
      />
    </section>
  );
}
