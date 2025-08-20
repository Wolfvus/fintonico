import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, AccountBalance } from '../types';

// Define the Store's State and Actions
interface AccountState {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  deleteAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updatedAccountData: Omit<Account, 'id'>) => void;
  updateAccountBalance: (accountId: string, currency: string, newAmount: number) => void;
}

// Implement the Zustand Store
export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      // Initial State
      accounts: [],

      // addAccount function
      addAccount: (newAccount) => {
        const completeAccount: Account = {
          ...newAccount,
          id: crypto.randomUUID(),
        };
        
        set((state) => ({
          accounts: [...state.accounts, completeAccount]
        }));
      },

      // deleteAccount function
      deleteAccount: (accountId) => {
        set((state) => ({
          accounts: state.accounts.filter(account => account.id !== accountId)
        }));
      },

      // updateAccount function
      updateAccount: (accountId, updatedAccountData) => {
        set((state) => ({
          accounts: state.accounts.map(account =>
            account.id === accountId
              ? { ...updatedAccountData, id: accountId }
              : account
          )
        }));
      },

      // updateAccountBalance function
      updateAccountBalance: (accountId, currency, newAmount) => {
        set((state) => ({
          accounts: state.accounts.map(account => {
            // Find the account that matches the accountId
            if (account.id === accountId) {
              // Look for existing balance with this currency
              const existingBalanceIndex = account.balances.findIndex(
                balance => balance.currency === currency
              );

              let updatedBalances: AccountBalance[];

              if (existingBalanceIndex !== -1) {
                // Currency exists - update the amount
                updatedBalances = account.balances.map((balance, index) => 
                  index === existingBalanceIndex 
                    ? { ...balance, amount: newAmount }
                    : balance
                );
              } else {
                // Currency doesn't exist - add new AccountBalance object
                updatedBalances = [
                  ...account.balances,
                  { currency, amount: newAmount }
                ];
              }

              return {
                ...account,
                balances: updatedBalances
              };
            }
            return account;
          })
        }));
      },
    }),
    {
      name: 'fintonico-accounts',
    }
  )
);