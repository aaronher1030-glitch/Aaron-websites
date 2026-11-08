import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        {/* Remaining routes are added in Tasks 5–9. */}
      </Route>
    </Routes>
  );
}
