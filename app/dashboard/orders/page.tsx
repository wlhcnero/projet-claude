import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!restaurant) redirect("/dashboard");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <OrdersClient
      restaurantId={restaurant.id}
      initialOrders={orders ?? []}
    />
  );
}
