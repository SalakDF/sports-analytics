import { Outlet } from "react-router-dom";
import Header from "./Header";
import ScrollToTop from "../common/ScrollToTop";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Header />

      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
