import type {
  DashboardOverview,
  DashboardShop,
} from "@/types/dashboard";
import {
  getMockOverview,
  isMockShopId,
  MOCK_SHOPS,
  PILOT_DEMO_SHOP_ID,
} from "@/lib/mock-data";
import { getUserShops } from "@/lib/supabase/shops";

function emptyOverview(shop: DashboardShop): DashboardOverview {
  return {
    shop,
    stats: {
      totalScans: 0,
      highRiskListings: 0,
      openViolations: 0,
      pendingAppeals: 0,
    },
    recentScans: [],
    openViolations: [],
    upcomingDeadlines: [],
  };
}

export function isEmptyOverview(overview: DashboardOverview) {
  return (
    overview.stats.totalScans === 0 &&
    overview.openViolations.length === 0 &&
    overview.recentScans.length === 0
  );
}

/**
 * Picks the best default shop for the pilot experience.
 * Demo shop is preferred when available so first-time users see realistic data.
 */
export function resolveDefaultShopId(
  shops: DashboardShop[],
  requestedId?: string,
): string | undefined {
  if (requestedId && shops.some((shop) => shop.id === requestedId)) {
    return requestedId;
  }

  const demoShop = shops.find((shop) => shop.id === PILOT_DEMO_SHOP_ID);
  return demoShop?.id ?? shops[0]?.id;
}

/**
 * Loads dashboard overview for a shop. Mock shops return fixture data;
 * real shops return empty shells until Supabase queries are wired.
 */
export async function getDashboardOverview(
  shopId: string,
): Promise<DashboardOverview | null> {
  if (isMockShopId(shopId)) {
    return getMockOverview(shopId);
  }

  const shops = await getDashboardShops();
  const shop = shops.find((entry) => entry.id === shopId);
  if (!shop) return null;

  return emptyOverview(shop);
}

export async function getDashboardShops(): Promise<DashboardShop[]> {
  const realShops = await getUserShops();
  const mapped: DashboardShop[] = realShops.map((shop) => ({
    id: shop.id,
    name: shop.name,
    platform: shop.platform,
  }));

  const mockIds = new Set(MOCK_SHOPS.map((shop) => shop.id));
  const uniqueReal = mapped.filter((shop) => !mockIds.has(shop.id));

  return [...uniqueReal, ...MOCK_SHOPS];
}
