/**
 * Feature Access Utility
 * Provides feature gating based on subscription tier
 */

export type SubscriptionTier = 'freemium' | 'pro';

export type Feature =
  | 'expenses'
  | 'income'
  | 'accounts'
  | 'snapshots'
  | 'ledger'
  | 'import'
  | 'export';

/**
 * Features available for each subscription tier
 */
const TIER_FEATURES: Record<SubscriptionTier, Feature[]> = {
  freemium: ['expenses', 'income', 'accounts', 'snapshots', 'ledger'],
  pro: ['expenses', 'income', 'accounts', 'snapshots', 'ledger', 'import', 'export'],
};

/**
 * Check if a subscription tier can access a specific feature
 */
export function canAccessFeature(tier: SubscriptionTier, feature: Feature): boolean {
  const features = TIER_FEATURES[tier] || TIER_FEATURES.freemium;
  return features.includes(feature);
}

/**
 * Get all features available for a subscription tier
 */
export function getTierFeatures(tier: SubscriptionTier): Feature[] {
  return TIER_FEATURES[tier] || TIER_FEATURES.freemium;
}

/**
 * Check if a tier has import capability
 */
export function canImport(tier: SubscriptionTier): boolean {
  return canAccessFeature(tier, 'import');
}

/**
 * Check if a tier has export capability
 */
export function canExport(tier: SubscriptionTier): boolean {
  return canAccessFeature(tier, 'export');
}

/**
 * Get upgrade message for a locked feature
 */
export function getUpgradeMessage(feature: Feature): string {
  const featureNames: Record<Feature, string> = {
    expenses: 'Expense Tracking',
    income: 'Income Tracking',
    accounts: 'Account Management',
    snapshots: 'Net Worth Snapshots',
    ledger: 'Ledger Accounts',
    import: 'Data Import',
    export: 'Data Export',
  };

  return `${featureNames[feature]} is a Pro feature. Upgrade to Pro to unlock this and other premium features.`;
}

/**
 * Hook for feature access - to be used with auth store
 * Returns feature access state based on user's subscription tier
 */
export function useFeatureAccessState(tier: SubscriptionTier) {
  return {
    tier,
    canImport: canImport(tier),
    canExport: canExport(tier),
    canAccessFeature: (feature: Feature) => canAccessFeature(tier, feature),
    features: getTierFeatures(tier),
  };
}
