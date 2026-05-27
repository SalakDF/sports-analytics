import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Header />

      <main className="page-container">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}