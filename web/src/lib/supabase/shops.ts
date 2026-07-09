import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type UserShop = {
  id: string;
  name: string;
  status: string;
  platform: string;
  role: string;
};

export async function getUserShops(): Promise<UserShop[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("shop_members")
    .select(
      `
      role,
      shops (
        id,
        name,
        status,
        platform
      )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !data) return [];

  const shops: UserShop[] = [];

  for (const row of data) {
    const shop = row.shops;
    if (!shop || Array.isArray(shop)) continue;

    shops.push({
      id: shop.id,
      name: shop.name,
      status: shop.status,
      platform: shop.platform,
      role: row.role,
    });
  }

  return shops;
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireShopAccess(shopId: string) {
  const user = await requireUser();
  const shops = await getUserShops();
  const shop = shops.find((entry) => entry.id === shopId);

  if (!shop) {
    redirect("/dashboard");
  }

  return { user, shop };
}
