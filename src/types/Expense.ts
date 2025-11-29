import { Timestamp } from "firebase/firestore";

export type ExpenseType = "COMPANY_OFFICIAL" | "PERSONAL" | "ADVANCE";
export type ExpenseStatus = "PAID" | "UNPAID";
export type Currency = "TRY" | "EUR";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: Timestamp;
  type: ExpenseType;
  status: ExpenseStatus;
  ownerId: string;
  receiptUrl?: string;
  currency: Currency;
  paymentMethod: PaymentMethod;
  projectId?: string;
  category?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
