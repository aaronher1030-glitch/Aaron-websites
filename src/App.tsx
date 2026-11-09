import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Accomplishments from "./pages/Accomplishments";
import ActivityPage from "./pages/ActivityPage";
import Finance from "./pages/Finance";
import Home from "./pages/Home";
import Photos from "./pages/Photos";
import Transparency from "./pages/Transparency";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="accomplishments" element={<Accomplishments />} />
        <Route path="accomplishments/:slug" element={<ActivityPage />} />
        <Route path="finance" element={<Finance />} />
        <Route path="photos" element={<Photos />} />
        <Route path="transparency" element={<Transparency />} />
        {/* Remaining routes are added in Tasks 8–9. */}
      </Route>
    </Routes>
  );
}
