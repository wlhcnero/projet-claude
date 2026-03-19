import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!restaurant) redirect("/dashboard");

  // Last 7 days revenue + orders
  const since7 = new Date();
  since7.setDate(since7.getDate() - 6);
  since7.setHours(0, 0, 0, 0);

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, total_amount, created_at, status")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", since7.toISOString())
    .order("created_at", { ascending: true });

  // Top items
  const { data: topItemsRaw } = await supabase
    .from("order_items")
    .select("item_name, item_price, quantity, order_id, orders!inner(restaurant_id)")
    .eq("orders.restaurant_id", restaurant.id);

  // Aggregate top items
  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const row of topItemsRaw ?? []) {
    const existing = itemMap.get(row.item_name) ?? { name: row.item_name, quantity: 0, revenue: 0 };
    existing.quantity += row.quantity;
    existing.revenue += Number(row.item_price) * row.quantity;
    itemMap.set(row.item_name, existing);
  }
  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Daily breakdown last 7 days
  const dailyMap = new Map<string, { orders: number; revenue: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { orders: 0, revenue: 0 });
  }
  for (const o of recentOrders ?? []) {
    const key = o.created_at.slice(0, 10);
    const existing = dailyMap.get(key);
    if (existing) {
      existing.orders += 1;
      existing.revenue += Number(o.total_amount);
    }
  }
  const dailyStats = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v }));

  const totalRevenue = (recentOrders ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  const totalOrdersCount = recentOrders?.length ?? 0;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  return (
    <StatsClient
      restaurantName={restaurant.name}
      dailyStats={dailyStats}
      topItems={topItems}
      summary={{ totalRevenue, totalOrders: totalOrdersCount, avgOrderValue }}
    />
  );
}
