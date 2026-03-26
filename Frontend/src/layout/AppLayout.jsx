import Header from "../components/navigation/Header";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <div className="content-wrap">
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

