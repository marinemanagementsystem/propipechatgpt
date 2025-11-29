import React, { useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  seedSampleExpenses,
  updateExpense,
} from "../services/expenses";
import { Expense, ExpenseStatus, ExpenseType } from "../types/Expense";
import ExpenseFormModal, { ExpenseFormValues } from "../components/ExpenseFormModal";

type FilterState = {
  startDate: string;
  endDate: string;
  type: "ALL" | ExpenseType;
  status: "ALL" | ExpenseStatus;
};

const typeLabel: Record<ExpenseType, string> = {
  COMPANY_OFFICIAL: "Şirket Resmi",
  PERSONAL: "Kişisel",
  ADVANCE: "Avans",
};

const typeIcon: Record<ExpenseType, string> = {
  COMPANY_OFFICIAL: "🏢",
  PERSONAL: "👤",
  ADVANCE: "💸",
};

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
    type: "ALL",
    status: "ALL",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getExpenses();
        setExpenses(data);
      } catch (err) {
        console.error("Giderler alınırken hata oluştu", err);
        setError("Gider listesi yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const dateStr = e.date.toDate().toISOString().slice(0, 10);
      const matchesStart = !filters.startDate || dateStr >= filters.startDate;
      const matchesEnd = !filters.endDate || dateStr <= filters.endDate;
      const matchesType = filters.type === "ALL" || e.type === filters.type;
      const matchesStatus = filters.status === "ALL" || e.status === filters.status;
      return matchesStart && matchesEnd && matchesType && matchesStatus;
    });
  }, [expenses, filters]);

  const toplamOdenmedi = useMemo(() => {
    return filteredExpenses
      .filter(
        (e) => e.status === "UNPAID" && (e.type === "PERSONAL" || e.type === "ADVANCE")
      )
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const buAyOdenen = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return expenses
      .filter((e) => {
        const d = e.date.toDate();
        return e.status === "PAID" && d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleOpenNew = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    setInfo(null);
    try {
      const created = await seedSampleExpenses(false);
      if (created.length === 0) {
        setInfo("Koleksiyonda zaten kayıt var, force etmek için seedSampleExpenses(true) kullan.");
      } else {
        setExpenses((prev) => [...created, ...prev]);
        setInfo(`${created.length} örnek gider eklendi.`);
      }
    } catch (err) {
      console.error("Seed hatası", err);
      setError("Örnek veriler eklenirken hata oluştu.");
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Bu gider kaydını silmek istediğinden emin misin?");
    if (!confirmed) return;
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Silme hatası", err);
      setError("Silme sırasında bir hata oluştu.");
    }
  };

  const handleSave = async (values: ExpenseFormValues) => {
    setSaving(true);
    setError(null);
    try {
      const expensePayload: Omit<
        Expense,
        "id" | "receiptUrl" | "createdAt" | "updatedAt"
      > = {
        amount: values.amount,
        currency: values.currency,
        description: values.description,
        date: Timestamp.fromDate(new Date(values.date)),
        type: values.type,
        status: values.status,
        ownerId: values.ownerId,
        paymentMethod: values.paymentMethod,
        projectId: values.projectId || null,
        category: values.category || null,
      };

      if (editingExpense) {
        const updated = await updateExpense(editingExpense.id, {
          updates: expensePayload,
          receiptFile: values.receiptFile,
        });
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await createExpense({
          expense: expensePayload,
          receiptFile: values.receiptFile,
        });
        setExpenses((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Kaydetme hatası", err);
      setError("Kaydetme sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Giderler</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={styles.segmented}>
            <button
              style={{
                ...styles.segmentButton,
                ...(viewMode === "card" ? styles.segmentButtonActive : {}),
              }}
              onClick={() => setViewMode("card")}
            >
              Kart Görünümü
            </button>
            <button
              style={{
                ...styles.segmentButton,
                ...(viewMode === "table" ? styles.segmentButtonActive : {}),
              }}
              onClick={() => setViewMode("table")}
            >
              Tablo Görünümü
            </button>
          </div>
          <button style={styles.secondaryButton} onClick={handleSeed} disabled={seeding}>
            {seeding ? "Eklenecek..." : "Örnek Verileri Yükle"}
          </button>
          <button style={styles.primaryButton} onClick={handleOpenNew}>
            Yeni Gider Ekle
          </button>
        </div>
      </header>

      <section style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label>
            Başlangıç Tarihi
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              style={styles.input}
            />
          </label>
          <label>
            Bitiş Tarihi
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.filterGroup}>
          <label>
            Tür
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value as FilterState["type"] }))
              }
              style={styles.input}
            >
              <option value="ALL">Tümü</option>
              <option value="COMPANY_OFFICIAL">Şirket Resmi</option>
              <option value="PERSONAL">Kişisel</option>
              <option value="ADVANCE">Avans</option>
            </select>
          </label>

          <label>
            Durum
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value as FilterState["status"] }))
              }
              style={styles.input}
            >
              <option value="ALL">Tümü</option>
              <option value="PAID">Ödendi</option>
              <option value="UNPAID">Ödenmedi</option>
            </select>
          </label>
        </div>
      </section>

      <section style={styles.summaryGrid}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Toplam ÖDENMEDİ (şirketin ortağa borcu)</p>
          <h3>{toplamOdenmedi.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TRY</h3>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Bu ay ödenen toplam</p>
          <h3>{buAyOdenen.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TRY</h3>
        </div>
      </section>

      {info && <div style={styles.info}>{info}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <p>Yükleniyor...</p>
      ) : viewMode === "card" ? (
        <div style={styles.cardList}>
          {filteredExpenses.map((expense) => (
            <div key={expense.id} style={styles.cardItem}>
              <div style={styles.cardIcon}>{typeIcon[expense.type]}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.cardTitleRow}>
                  <div>
                    <div style={styles.cardTitle}>{expense.description}</div>
                    <div style={styles.cardMeta}>
                      {expense.date.toDate().toLocaleDateString("tr-TR")} · Sahibi: {expense.ownerId}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.cardAmount}>
                      {expense.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                      {expense.currency}
                    </div>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: expense.status === "PAID" ? "#22c55e" : "#f97316",
                      }}
                    >
                      {expense.status === "PAID" ? "ÖDENDİ" : "ÖDENMEDİ"}
                    </span>
                  </div>
                </div>
                <div style={styles.cardActions}>
                  <span style={styles.cardTag}>{typeLabel[expense.type]}</span>
                  <span style={styles.cardTag}>Ödeme: {expense.paymentMethod}</span>
                  {expense.projectId ? <span style={styles.cardTag}>Proje: {expense.projectId}</span> : null}
                  {expense.category ? <span style={styles.cardTag}>Kategori: {expense.category}</span> : null}
                  {expense.receiptUrl ? (
                    <a href={expense.receiptUrl} target="_blank" rel="noreferrer" style={styles.cardLink}>
                      Dekontu Gör
                    </a>
                  ) : null}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button style={styles.linkButton} onClick={() => handleEdit(expense)}>
                      Düzenle
                    </button>
                    <button style={styles.linkButtonDanger} onClick={() => handleDelete(expense.id)}>
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!filteredExpenses.length && <div style={styles.emptyCard}>Kayıt bulunamadı.</div>}
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.tableHead}>
              <tr>
                {[
                  "Tarih",
                  "Açıklama",
                  "Tutar",
                  "Tür",
                  "Durum",
                  "Gider Sahibi",
                  "Ödeme Şekli",
                  "Proje",
                  "Kategori",
                  "Dekont",
                  "İşlemler",
                ].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense, idx) => (
                <tr key={expense.id} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>{expense.date.toDate().toLocaleDateString("tr-TR")}</td>
                  <td style={styles.td}>{expense.description}</td>
                  <td style={styles.td}>
                    {expense.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {expense.currency}
                  </td>
                  <td style={styles.td}>{typeLabel[expense.type]}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: expense.status === "PAID" ? "#22c55e" : "#f97316",
                      }}
                    >
                      {expense.status === "PAID" ? "ÖDENDİ" : "ÖDENMEDİ"}
                    </span>
                  </td>
                  <td style={styles.td}>{expense.ownerId}</td>
                  <td style={styles.td}>{expense.paymentMethod}</td>
                  <td style={styles.td}>{expense.projectId || "-"}</td>
                  <td style={styles.td}>{expense.category || "-"}</td>
                  <td style={styles.td}>
                    {expense.receiptUrl ? (
                      <a href={expense.receiptUrl} target="_blank" rel="noreferrer">
                        Görüntüle
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                    <button style={styles.linkButton} onClick={() => handleEdit(expense)}>
                      Düzenle
                    </button>
                    <button style={styles.linkButtonDanger} onClick={() => handleDelete(expense.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredExpenses.length && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 16 }}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ExpenseFormModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialData={editingExpense}
        loading={saving}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    background: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
  },
  filterGroup: { display: "flex", gap: 12, flexWrap: "wrap" },
  input: {
    marginLeft: 6,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  },
  cardLabel: { margin: 0, color: "#6b7280", fontWeight: 600 },
  error: {
    padding: 12,
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 8,
    border: "1px solid #fecdd3",
  },
  info: {
    padding: 12,
    background: "#ecfeff",
    color: "#0e7490",
    borderRadius: 8,
    border: "1px solid #99f6e4",
  },
  tableWrapper: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1100,
    fontSize: 14,
  },
  tableHead: {
    background: "#f1f5f9",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: 13,
    letterSpacing: 0.2,
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 700,
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #e2e8f0",
    color: "#111827",
  },
  trEven: { background: "#ffffff" },
  trOdd: { background: "#f8fafc" },
  badge: {
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  segmented: {
    display: "inline-flex",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    overflow: "hidden",
  },
  segmentButton: {
    border: "none",
    background: "transparent",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
    color: "#475569",
  },
  segmentButtonActive: {
    background: "#2563eb",
    color: "#fff",
  },
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#1d4ed8",
    cursor: "pointer",
    marginRight: 8,
  },
  linkButtonDanger: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    cursor: "pointer",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardItem: {
    display: "flex",
    gap: 12,
    padding: 12,
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 14px rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#e0f2fe",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
  },
  cardTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  cardTitle: { fontWeight: 700, fontSize: 16 },
  cardMeta: { color: "#6b7280", fontSize: 13 },
  cardAmount: { fontWeight: 800, fontSize: 16, marginBottom: 4 },
  cardActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 6,
  },
  cardTag: {
    background: "#f1f5f9",
    color: "#334155",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 12,
  },
  cardLink: {
    color: "#0ea5e9",
    fontWeight: 600,
  },
  emptyCard: {
    padding: 16,
    textAlign: "center",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    color: "#6b7280",
  },
  secondaryButton: {
    background: "#e2e8f0",
    color: "#111",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
};

export default ExpensesPage;
