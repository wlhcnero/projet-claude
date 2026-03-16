import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import MenuEditor from "@/components/MenuEditor";

export default async function EditorPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: restaurant, error: restError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (restError || !restaurant) {
    redirect("/dashboard");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*, items(*)")
    .eq("restaurant_id", restaurant.id)
    .order("position");

  return (
    <MenuEditor
      restaurant={restaurant}
      initialCategories={categories ?? []}
    />
  );
}
