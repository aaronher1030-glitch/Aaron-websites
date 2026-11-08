import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import About from "./pages/About";
import Bank from "./pages/Bank";
import Drill from "./pages/Drill";
import Formulas from "./pages/Formulas";
import Guide from "./pages/Guide";
import Home from "./pages/Home";
import Lab from "./pages/Lab";
import LabPage from "./pages/LabPage";
import NotePage from "./pages/NotePage";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";
import PeriodicTable from "./pages/PeriodicTable";
import Practice from "./pages/Practice";
import Progress from "./pages/Progress";
import QuestionPage from "./pages/QuestionPage";
import Results from "./pages/Results";
import Review from "./pages/Review";
import { StoreProvider } from "./store";

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="bank" element={<Bank />} />
          <Route path="q/:id" element={<QuestionPage />} />
          <Route path="practice" element={<Practice />} />
          <Route path="drill/:id" element={<Drill />} />
          <Route path="drill/:id/results" element={<Results />} />
          <Route path="progress" element={<Progress />} />
          <Route path="review" element={<Review />} />
          <Route path="notes" element={<Notes />} />
          <Route path="notes/:slug" element={<NotePage />} />
          <Route path="lab" element={<Lab />} />
          <Route path="lab/:slug" element={<LabPage />} />
          <Route path="formulas" element={<Formulas />} />
          <Route path="periodic-table" element={<PeriodicTable />} />
          <Route path="guide" element={<Guide />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </StoreProvider>
  );
}
