import { Route, Routes } from "react-router-dom";
import { ScrollToTop, SiteLayout } from "./components/SiteLayout";
import { AboutPage } from "./pages/About";
import { AmoGuidePage } from "./pages/AmoGuide";
import { AmoPapersPage } from "./pages/AmoPapers";
import { BankPage } from "./pages/Bank";
import { DrillPage } from "./pages/Drill";
import { HomePage } from "./pages/Home";
import { NotFoundPage } from "./pages/NotFound";
import { PracticePage } from "./pages/Practice";
import { ProblemPage } from "./pages/ProblemPage";
import { ProgressPage } from "./pages/Progress";
import { ResultsPage } from "./pages/Results";
import { ReviewPage } from "./pages/Review";
import { TechniquePage } from "./pages/TechniquePage";
import { TechniquesPage } from "./pages/Techniques";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="bank" element={<BankPage />} />
          <Route path="problem/:id" element={<ProblemPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="drill/:id" element={<DrillPage />} />
          <Route path="drill/:id/results" element={<ResultsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="techniques" element={<TechniquesPage />} />
          <Route path="techniques/:slug" element={<TechniquePage />} />
          <Route path="amo-guide" element={<AmoGuidePage />} />
          <Route path="amo-papers" element={<AmoPapersPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
