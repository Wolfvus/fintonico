export const generateTestExpenses = () => {
  const expenses = [
    { what: 'Grocery shopping at Walmart', rating: 'essential', amount: 125.50, currency: 'USD' },
    { what: 'Coffee at Starbucks', rating: 'non_essential', amount: 5.75, currency: 'USD' },
    { what: 'Gas station fill-up', rating: 'essential', amount: 45.00, currency: 'USD' },
    { what: 'Netflix subscription', rating: 'non_essential', amount: 15.99, currency: 'USD' },
    { what: 'Dinner at fancy restaurant', rating: 'luxury', amount: 85.00, currency: 'USD' },
    { what: 'Monthly rent payment', rating: 'essential', amount: 1250.00, currency: 'USD', recurring: true },
    { what: 'Internet bill', rating: 'essential', amount: 79.99, currency: 'USD', recurring: true },
    { what: 'Designer sneakers', rating: 'luxury', amount: 180.00, currency: 'USD' },
    { what: 'Uber ride to work', rating: 'non_essential', amount: 12.50, currency: 'USD' },
    { what: 'Pharmacy prescription', rating: 'essential', amount: 25.00, currency: 'USD' },
    { what: 'Movie tickets', rating: 'non_essential', amount: 24.00, currency: 'USD' },
    { what: 'Gym membership', rating: 'non_essential', amount: 39.99, currency: 'USD', recurring: true },
    { what: 'Electric bill', rating: 'essential', amount: 95.50, currency: 'USD', recurring: true },
    { what: 'Lunch at food truck', rating: 'non_essential', amount: 8.50, currency: 'USD' },
    { what: 'Car insurance', rating: 'essential', amount: 120.00, currency: 'USD', recurring: true },
    { what: 'Books from Amazon', rating: 'non_essential', amount: 32.99, currency: 'USD' },
    { what: 'Spa treatment', rating: 'luxury', amount: 150.00, currency: 'USD' },
    { what: 'Phone bill', rating: 'essential', amount: 65.00, currency: 'USD', recurring: true },
    { what: 'Concert tickets', rating: 'luxury', amount: 125.00, currency: 'USD' },
    { what: 'Takeout pizza', rating: 'non_essential', amount: 18.75, currency: 'USD' },
    { what: 'Car maintenance', rating: 'essential', amount: 250.00, currency: 'USD' },
    { what: 'Video game purchase', rating: 'luxury', amount: 59.99, currency: 'USD' },
    { what: 'Dentist appointment', rating: 'essential', amount: 180.00, currency: 'USD' },
    { what: 'Clothing shopping', rating: 'non_essential', amount: 75.50, currency: 'USD' },
    { what: 'Wine tasting event', rating: 'luxury', amount: 95.00, currency: 'USD' },
    { what: 'Home insurance', rating: 'essential', amount: 150.00, currency: 'USD', recurring: true },
    { what: 'Fast food lunch', rating: 'non_essential', amount: 9.99, currency: 'USD' },
    { what: 'Spotify premium', rating: 'non_essential', amount: 9.99, currency: 'USD', recurring: true },
    { what: 'Emergency vet visit', rating: 'essential', amount: 300.00, currency: 'USD' },
    { what: 'Weekend getaway hotel', rating: 'luxury', amount: 220.00, currency: 'USD' }
  ];

  const currencies = ['USD', 'MXN', 'EUR'];
  
  return expenses.map((expense, index) => ({
    id: `test-expense-${index + 1}`,
    what: expense.what,
    amount: expense.amount,
    currency: currencies[Math.floor(Math.random() * currencies.length)],
    rating: expense.rating as 'essential' | 'non_essential' | 'luxury',
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    recurring: expense.recurring || false
  }));
};

export const generateTestIncome = () => {
  const incomes = [
    { source: 'Monthly salary', amount: 4500.00, frequency: 'monthly' },
    { source: 'Freelance web design', amount: 800.00, frequency: 'one-time' },
    { source: 'Investment dividends', amount: 150.00, frequency: 'quarterly' },
    { source: 'Side hustle consulting', amount: 600.00, frequency: 'one-time' },
    { source: 'Rental property income', amount: 1200.00, frequency: 'monthly' },
    { source: 'Stock market gains', amount: 300.00, frequency: 'one-time' },
    { source: 'Part-time job', amount: 900.00, frequency: 'bi-weekly' },
    { source: 'Online course sales', amount: 250.00, frequency: 'one-time' },
    { source: 'Bonus payment', amount: 1000.00, frequency: 'one-time' },
    { source: 'Tax refund', amount: 750.00, frequency: 'yearly' },
    { source: 'Gift from family', amount: 200.00, frequency: 'one-time' },
    { source: 'Cashback rewards', amount: 45.00, frequency: 'monthly' },
    { source: 'Selling old electronics', amount: 180.00, frequency: 'one-time' },
    { source: 'Tutoring sessions', amount: 120.00, frequency: 'weekly' },
    { source: 'Affiliate marketing', amount: 85.00, frequency: 'monthly' }
  ];

  const currencies = ['USD', 'MXN', 'EUR'];
  
  return incomes.map((income, index) => ({
    id: `test-income-${index + 1}`,
    source: income.source,
    amount: income.amount,
    currency: currencies[Math.floor(Math.random() * currencies.length)],
    frequency: income.frequency as 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly',
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
};