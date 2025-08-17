export const calculateInvestmentYields = (
  startDate: Date, 
  endDate: Date, 
  baseCurrency: string, 
  convertAmount: (amount: number, from: string, to: string) => number
): number => {
  const savedAssets = localStorage.getItem('fintonico-assets');
  const assets = savedAssets ? JSON.parse(savedAssets) : [];
  
  // Calculate how many months are in the selected period
  const timeDiff = endDate.getTime() - startDate.getTime();
  const monthsInPeriod = Math.max(1, Math.round(timeDiff / (1000 * 60 * 60 * 24 * 30.44))); // Average days per month
  
  return assets
    .filter((asset: any) => asset.type === 'investment' && asset.yield > 0)
    .reduce((total: number, asset: any) => {
      const monthlyYield = (asset.value * asset.yield / 100) / 12;
      const periodYield = monthlyYield * monthsInPeriod;
      return total + convertAmount(periodYield, asset.currency, baseCurrency);
    }, 0);
};

export const getAssetsByType = (type?: string) => {
  const savedAssets = localStorage.getItem('fintonico-assets');
  const assets = savedAssets ? JSON.parse(savedAssets) : [];
  
  if (type) {
    return assets.filter((asset: any) => asset.type === type);
  }
  
  return assets;
};

export const getLiabilitiesByType = (type?: string) => {
  const savedLiabilities = localStorage.getItem('fintonico-liabilities');
  const liabilities = savedLiabilities ? JSON.parse(savedLiabilities) : [];
  
  if (type) {
    return liabilities.filter((liability: any) => liability.type === type);
  }
  
  return liabilities;
};