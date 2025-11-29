import React from "react";
import { Navigate, Route, Routes, Link } from "react-router-dom";
import ExpensesPage from "./pages/ExpensesPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div style={styles.home}>
            <h1>Pro Pipe Manager</h1>
            <p>Hoş geldin! Sol alttaki butonla giderler ekranına geçebilirsin.</p>
            <Link to="/expenses" style={styles.primaryButton}>
              Giderler
            </Link>
          </div>
        }
      />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const styles: Record<string, React.CSSProperties> = {
  home: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "radial-gradient(circle at 20% 20%, #e0f2fe, #f6f7fb 40%)",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 10,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
};

export default App;
