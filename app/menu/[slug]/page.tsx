import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";

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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!restaurant) {
    return { title: "Menu introuvable" };
  }

  return {
    title: `${restaurant.name} — Menu`,
    description: restaurant.description ?? `Consultez le menu de ${restaurant.name}`,
  };
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!restaurant) {
    notFound();
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*, items(*)")
    .eq("restaurant_id", restaurant.id)
    .order("position");

  const sortedCategories = (categories as MenuCategory[] ?? []).map((cat) => ({
    ...cat,
    items: [...(cat.items ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    ),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant header */}
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-gray-500 mt-2">{restaurant.description}</p>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {sortedCategories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Le menu est en cours de préparation.</p>
            <p className="text-sm mt-1">Revenez bientôt !</p>
          </div>
        ) : (
          sortedCategories.map((category) => (
            <section key={category.id}>
              <h2 className="text-xl font-bold text-gray-800 pb-3 border-b mb-4">
                {category.name}
              </h2>
              <div className="space-y-3">
                {category.items
                  .filter((item) => item.available)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 bg-white rounded-lg p-4 shadow-sm"
                    >
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {item.name}
                          </h3>
                          {item.price !== null && (
                            <span className="font-bold text-gray-900 whitespace-nowrap">
                              {Number(item.price).toFixed(2)} €
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                {category.items.filter((i) => !i.available).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 bg-white rounded-lg p-4 shadow-sm opacity-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-700">
                            {item.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            Indisponible
                          </Badge>
                        </div>
                        {item.price !== null && (
                          <span className="font-bold text-gray-700 whitespace-nowrap">
                            {Number(item.price).toFixed(2)} €
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-400 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Propulsé par MenuQR Pro
      </footer>
    </div>
  );
}
