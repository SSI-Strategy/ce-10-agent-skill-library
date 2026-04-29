import { Route, Routes } from "react-router-dom";
import AdminPage from "./screens/AdminPage";
import CataloguePage from "./screens/CataloguePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CataloguePage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
