import React, { useEffect, useState } from "react";
import {
  Currency,
  Expense,
  ExpenseStatus,
  ExpenseType,
  PaymentMethod,
} from "../types/Expense";

export interface ExpenseFormValues {
  amount: number;
  currency: Currency;
  description: string;
  date: string; // YYYY-MM-DD
  type: ExpenseType;
  status: ExpenseStatus;
  ownerId: string;
  paymentMethod: PaymentMethod;
  projectId?: string;
  category?: string;
  receiptFile?: File | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => void;
  initialData?: Expense | null;
  loading?: boolean;
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

const ExpenseFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const [formValues, setFormValues] = useState<ExpenseFormValues>({
    amount: 0,
    currency: "TRY",
    description: "",
    date: defaultDate(),
    type: "COMPANY_OFFICIAL",
    status: "UNPAID",
    ownerId: "",
    paymentMethod: "CASH",
    projectId: "",
    category: "",
    receiptFile: null,
  });

  useEffect(() => {
    if (initialData) {
      setFormValues({
        amount: initialData.amount,
        currency: initialData.currency,
        description: initialData.description,
        date: initialData.date.toDate().toISOString().slice(0, 10),
        type: initialData.type,
        status: initialData.status,
        ownerId: initialData.ownerId,
        paymentMethod: initialData.paymentMethod,
        projectId: initialData.projectId ?? "",
        category: initialData.category ?? "",
        receiptFile: null,
      });
    } else {
      setFormValues({
        amount: 0,
        currency: "TRY",
        description: "",
        date: defaultDate(),
        type: "COMPANY_OFFICIAL",
        status: "UNPAID",
        ownerId: "",
        paymentMethod: "CASH",
        projectId: "",
        category: "",
        receiptFile: null,
      });
    }
  }, [initialData]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormValues((prev) => ({ ...prev, receiptFile: file }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <h2>{initialData ? "Gideri Düzenle" : "Yeni Gider Ekle"}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Tutar
            <input
              type="number"
              name="amount"
              value={formValues.amount}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Para Birimi
            <select name="currency" value={formValues.currency} onChange={handleChange} style={styles.input}>
              <option value="TRY">TRY</option>
              <option value="EUR">EUR</option>
            </select>
          </label>

          <label style={styles.label}>
            Açıklama
            <input
              type="text"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Tarih
            <input
              type="date"
              name="date"
              value={formValues.date}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Tür
            <select name="type" value={formValues.type} onChange={handleChange} style={styles.input}>
              <option value="COMPANY_OFFICIAL">Şirket Resmi</option>
              <option value="PERSONAL">Kişisel</option>
              <option value="ADVANCE">Avans</option>
            </select>
          </label>

          <label style={styles.label}>
            Durum
            <select name="status" value={formValues.status} onChange={handleChange} style={styles.input}>
              <option value="PAID">Ödendi</option>
              <option value="UNPAID">Ödenmedi</option>
            </select>
          </label>

          <label style={styles.label}>
            Gider Sahibi (ownerId)
            <input
              type="text"
              name="ownerId"
              value={formValues.ownerId}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Ödeme Şekli
            <select
              name="paymentMethod"
              value={formValues.paymentMethod}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="CASH">Nakit</option>
              <option value="CARD">Kart</option>
              <option value="TRANSFER">Havale/EFT</option>
            </select>
          </label>

          <label style={styles.label}>
            Proje ID (opsiyonel)
            <input
              type="text"
              name="projectId"
              value={formValues.projectId}
              onChange={handleChange}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Kategori (opsiyonel)
            <input
              type="text"
              name="category"
              value={formValues.category}
              onChange={handleChange}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Dekont (opsiyonel)
            <input type="file" accept="image/*" onChange={handleFileChange} style={styles.input} />
            {initialData?.receiptUrl && (
              <small>
                Mevcut dekont:{" "}
                <a href={initialData.receiptUrl} target="_blank" rel="noreferrer">
                  Görüntüle
                </a>
              </small>
            )}
          </label>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.secondaryButton} disabled={loading}>
              İptal
            </button>
            <button type="submit" style={styles.primaryButton} disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "min(560px, 94vw)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: { display: "flex", flexDirection: "column", fontWeight: 600, color: "#222" },
  input: {
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d5dd",
    fontSize: 14,
  },
  actions: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#e5e7eb",
    color: "#111",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
  },
};

export default ExpenseFormModal;
