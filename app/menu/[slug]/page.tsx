import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import MenuOrderingClient from "./MenuOrderingClient";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  available: boolean;
  position: number;
}

interface MenuCategory {
  id: string;
  name: string;
  position: number;
  items: MenuItem[];
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!restaurant) return { title: "Menu introuvable" };

  return {
    title: `${restaurant.name} — Commander`,
    description: restaurant.description ?? `Consultez le menu et commandez chez ${restaurant.name}`,
  };
}

export default async function PublicMenuPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { table = "" } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!restaurant) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, items(*)")
    .eq("restaurant_id", restaurant.id)
    .order("position");

  const sortedCategories = (categories as MenuCategory[] ?? []).map((cat) => ({
    ...cat,
    items: [...(cat.items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }));

  return (
    <MenuOrderingClient
      restaurant={restaurant}
      categories={sortedCategories}
      initialTable={table}
    />
  );
}
