import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { headers } from "next/headers";

export default async function QRCodePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!restaurant) {
    redirect("/dashboard");
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const menuUrl = `${protocol}://${host}/menu/${restaurant.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">← Retour</Link>
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">
          QR Code — {restaurant.name}
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Votre QR Code</h2>
          <p className="text-gray-500 mt-2">
            Imprimez ce QR code et placez-le sur vos tables pour que vos clients
            accèdent instantanément à votre menu.
          </p>
        </div>

        <QRCodeDisplay url={menuUrl} restaurantName={restaurant.name} />
      </main>
    </div>
  );
}
