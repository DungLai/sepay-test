// SePay Webhook Data Types
export interface SePayWebhookData {
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string;
  transferType: 'in' | 'out';
  transferAmount: number;
  accumulated: number;
  code?: string; // Optional - may not always be provided by SePay
  content: string;
  referenceCode?: string; // Optional - may not always be provided
  description?: string; // Optional - may not always be provided
}

// Order Types
export interface Order {
  id: number;
  total: number;
  name: string;
  payment_status: 'Unpaid' | 'Paid';
  created_at?: string;
}

export interface Transaction {
  id?: number;
  gateway: string;
  transaction_date: string;
  account_number: string;
  sub_account?: string;
  amount_in: number;
  amount_out: number;
  accumulated: number;
  code: string;
  transaction_content: string;
  reference_number: string;
  body: string;
  created_at?: string;
}

