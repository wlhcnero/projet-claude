import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching restaurant:", error);
  }

  let stats = { totalOrders: 0, pendingOrders: 0, todayOrders: 0, todayRevenue: 0 };

  if (restaurant) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, pendingResult, todayResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id)
        .eq("status", "pending"),
      supabase
        .from("orders")
        .select("total_amount")
        .eq("restaurant_id", restaurant.id)
        .gte("created_at", today.toISOString()),
    ]);

    const todayRevenue = (todayResult.data ?? []).reduce(
      (sum, o) => sum + (Number(o.total_amount) || 0), 0
    );

    stats = {
      totalOrders: totalResult.count ?? 0,
      pendingOrders: pendingResult.count ?? 0,
      todayOrders: todayResult.data?.length ?? 0,
      todayRevenue,
    };
  }

  return (
    <DashboardClient
      user={user}
      restaurant={restaurant ?? null}
      stats={stats}
    />
  );
}
