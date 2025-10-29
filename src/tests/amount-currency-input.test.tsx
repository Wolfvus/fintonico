// @vitest-environment jsdom
import React from 'react';
import './setupLocalStorage';

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmountCurrencyInput } from '../components/Shared/AmountCurrencyInput';
import { useCurrencyStore } from '../stores/currencyStore';

const renderComponent = (props?: Partial<React.ComponentProps<typeof AmountCurrencyInput>>) => {
  return render(
    <AmountCurrencyInput
      displayAmount=""
      currency={props?.currency ?? 'MXN'}
      onAmountChange={props?.onAmountChange ?? (() => {})}
      onCurrencyChange={props?.onCurrencyChange ?? (() => {})}
      amountError={props?.amountError}
      className={props?.className ?? 'grid grid-cols-2 gap-3'}
    />
  );
};

describe('AmountCurrencyInput', () => {
  beforeEach(() => {
    localStorage.clear();
    const store = useCurrencyStore.getState();
    store.resetEnabledCurrencies();
  });

  it('only lists enabled currencies in the dropdown', async () => {
    const user = userEvent.setup();
    const { toggleCurrency } = useCurrencyStore.getState();

    // Disable USD so it should disappear from the picker
    toggleCurrency('USD');

    renderComponent();

    const select = screen.getByLabelText(/currency/i);
    await user.click(select);

    expect(screen.getByRole('option', { name: /MXN/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /USD/ })).toBeNull();
  });
});
