import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Home from "./pages/Home";
import Photos from "./pages/Photos";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="photos" element={<Photos />} />
        {/* Remaining routes are added in Tasks 6–9. */}
      </Route>
    </Routes>
  );
}
