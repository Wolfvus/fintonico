export interface TransactionVM {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  recurring?: boolean;
  formattedAmount: string;
}