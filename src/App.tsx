import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Accomplishments from "./pages/Accomplishments";
import ActivityPage from "./pages/ActivityPage";
import Home from "./pages/Home";
import Photos from "./pages/Photos";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="accomplishments" element={<Accomplishments />} />
        <Route path="accomplishments/:slug" element={<ActivityPage />} />
        <Route path="photos" element={<Photos />} />
        {/* Remaining routes are added in Tasks 7–9. */}
      </Route>
    </Routes>
  );
}
