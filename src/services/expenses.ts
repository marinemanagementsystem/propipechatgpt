import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase";
import { Expense } from "../types/Expense";
import { sampleExpenses } from "../data/sampleExpenses";

const expensesCol = collection(db, "expenses");

export interface CreateExpenseInput {
  expense: Omit<Expense, "id" | "receiptUrl" | "createdAt" | "updatedAt">;
  receiptFile?: File | null;
}

export interface UpdateExpenseInput {
  updates: Partial<Omit<Expense, "id" | "createdAt" | "updatedAt">>;
  receiptFile?: File | null;
}

export async function getExpenses(): Promise<Expense[]> {
  const q = query(expensesCol, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Expense) }));
}

export async function createExpense({
  expense,
  receiptFile,
}: CreateExpenseInput): Promise<Expense> {
  const now = Timestamp.now();
  const baseData = {
    ...expense,
    projectId: expense.projectId ?? null,
    category: expense.category ?? null,
    receiptUrl: "",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(expensesCol, baseData);
  let receiptUrl = "";

  if (receiptFile) {
    const fileRef = ref(storage, `receipts/${docRef.id}/${receiptFile.name}`);
    await uploadBytes(fileRef, receiptFile);
    receiptUrl = await getDownloadURL(fileRef);
    await updateDoc(docRef, { receiptUrl });
  }

  return {
    id: docRef.id,
    ...baseData,
    receiptUrl,
  };
}

export async function updateExpense(
  id: string,
  { updates, receiptFile }: UpdateExpenseInput
): Promise<Expense> {
  const docRef = doc(db, "expenses", id);
  const payload: Partial<Expense> = Object.fromEntries(
    Object.entries({
      ...updates,
      projectId: updates.projectId ?? null,
      category: updates.category ?? null,
      updatedAt: Timestamp.now(),
    }).filter(([, value]) => value !== undefined)
  ) as Partial<Expense>;

  if (receiptFile) {
    const fileRef = ref(storage, `receipts/${id}/${receiptFile.name}`);
    await uploadBytes(fileRef, receiptFile);
    const receiptUrl = await getDownloadURL(fileRef);
    payload.receiptUrl = receiptUrl;
  }

  await updateDoc(docRef, payload);
  const snap = await getDoc(docRef);
  return { id: snap.id, ...(snap.data() as Expense) };
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", id));
  // TODO: receiptUrl varsa Storage içinden de temizle
}

// Ekran görüntüsündeki örnek verileri Firestore'a basmak için yardımcı
export async function seedSampleExpenses(force = false): Promise<Expense[]> {
  // Koleksiyonda veri varsa ve force=false ise ekleme
  const existing = await getDocs(query(expensesCol, limit(1)));
  if (!force && !existing.empty) {
    return [];
  }

  const created: Expense[] = [];
  for (const item of sampleExpenses) {
    const exp = await createExpense({ expense: item, receiptFile: null });
    created.push(exp);
  }
  return created;
}
