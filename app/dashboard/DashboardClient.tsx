"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

interface Props {
  user: User;
  restaurant: Restaurant | null;
}

export default function DashboardClient({ user, restaurant }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateRestaurant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const slug = slugify(name);

      const { error: insertError } = await supabase
        .from("restaurants")
        .insert({
          user_id: user.id,
          name,
          slug,
          description: description || null,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          setError(
            "Ce nom de restaurant est déjà pris. Essayez un autre nom."
          );
        } else {
          setError(insertError.message);
        }
        return;
      }

      router.refresh();
    } catch {
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${restaurant?.slug}`
      : `/menu/${restaurant?.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">MenuQR Pro</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:inline">
            {user.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {restaurant ? (
          /* Restaurant exists — show dashboard */
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {restaurant.name}
              </h2>
              {restaurant.description && (
                <p className="text-gray-500 mt-1">{restaurant.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Éditeur de menu</CardTitle>
                  <CardDescription>
                    Gérez vos catégories et plats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/editor">Modifier le menu</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">QR Code</CardTitle>
                  <CardDescription>
                    Votre QR code pointant vers votre menu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/qrcode">Voir mon QR code</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lien public de votre menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={menuUrl} readOnly className="text-sm" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(menuUrl);
                    }}
                  >
                    Copier
                  </Button>
                </div>
                <Button asChild variant="secondary" className="w-full sm:w-auto">
                  <Link
                    href={`/menu/${restaurant.slug}`}
                    target="_blank"
                  >
                    Voir le menu public →
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* No restaurant yet — creation form */
          <div className="max-w-lg mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Créez votre restaurant</CardTitle>
                <CardDescription>
                  Commencez par configurer votre établissement pour créer votre
                  menu digital.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateRestaurant}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du restaurant *</Label>
                    <Input
                      id="name"
                      placeholder="Ex : La Brasserie du Coin"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      placeholder="Une courte description de votre établissement…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  {name && (
                    <p className="text-xs text-muted-foreground">
                      Votre menu sera accessible à :{" "}
                      <code className="bg-gray-100 px-1 py-0.5 rounded">
                        /menu/{slugify(name)}
                      </code>
                    </p>
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Création en cours…" : "Créer mon restaurant"}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
