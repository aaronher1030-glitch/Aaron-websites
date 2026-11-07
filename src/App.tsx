import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Bank from "./pages/Bank";
import Home from "./pages/Home";
import QuestionPage from "./pages/QuestionPage";
import { StoreProvider } from "./store";

function Placeholder({ name }: { name: string }) {
  return (
    <section className="page">
      <p className="page-eyebrow">Shell route</p>
      <h1>{name}</h1>
      <p className="page-lede">Coming online.</p>
      <p className="page-note">
        This bench is scaffolded but empty. Questions, drills, and notes arrive in
        the next build.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="bank" element={<Bank />} />
          <Route path="q/:id" element={<QuestionPage />} />
          <Route path="practice" element={<Placeholder name="Practice" />} />
          <Route path="drill/:id" element={<Placeholder name="Drill" />} />
          <Route path="drill/:id/results" element={<Placeholder name="Results" />} />
          <Route path="progress" element={<Placeholder name="Progress" />} />
          <Route path="review" element={<Placeholder name="Review" />} />
          <Route path="notes" element={<Placeholder name="Notes" />} />
          <Route path="notes/:slug" element={<Placeholder name="Note" />} />
          <Route path="lab" element={<Placeholder name="Lab bench" />} />
          <Route path="lab/:slug" element={<Placeholder name="Lab technique" />} />
          <Route path="formulas" element={<Placeholder name="Formula sheet" />} />
          <Route path="periodic-table" element={<Placeholder name="Periodic table" />} />
          <Route path="guide" element={<Placeholder name="PNCO guide" />} />
          <Route path="about" element={<Placeholder name="About" />} />
          <Route path="*" element={<Placeholder name="Not found" />} />
        </Route>
      </Routes>
    </StoreProvider>
  );
}
