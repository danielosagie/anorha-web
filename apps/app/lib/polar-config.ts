// Polar configuration - works in both client and server components
export const POLAR_CONFIG = {
  GROWTH_PRODUCT_ID: process.env.NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID,
  TEAMS_PRODUCT_ID: process.env.NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.anorha.app',
};

export function getPolarProductIds() {
  return {
    growth: POLAR_CONFIG.GROWTH_PRODUCT_ID,
    teams: POLAR_CONFIG.TEAMS_PRODUCT_ID,
  };
}

