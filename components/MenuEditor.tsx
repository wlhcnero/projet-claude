"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CategoryCard from "@/components/CategoryCard";
import { useToast } from "@/hooks/use-toast";

interface Item {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  available: boolean;
  position: number;
}

interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  position: number;
  items: Item[];
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  restaurant: Restaurant;
  initialCategories: Category[];
}

export default function MenuEditor({ restaurant, initialCategories }: Props) {
  const supabase = createClient();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);

    try {
      const position = categories.length;
      const { data, error } = await supabase
        .from("categories")
        .insert({
          restaurant_id: restaurant.id,
          name: newCategoryName.trim(),
          position,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, { ...data, items: [] }]);
      setNewCategoryName("");
      toast({ title: "Catégorie ajoutée" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la catégorie.",
        variant: "destructive",
      });
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      setCategories(categories.filter((c) => c.id !== categoryId));
      toast({ title: "Catégorie supprimée" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie.",
        variant: "destructive",
      });
    }
  }

  async function handleUpdateCategory(categoryId: string, name: string) {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ name })
        .eq("id", categoryId);

      if (error) throw error;

      setCategories(
        categories.map((c) => (c.id === categoryId ? { ...c, name } : c))
      );
      toast({ title: "Catégorie mise à jour" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la catégorie.",
        variant: "destructive",
      });
    }
  }

  async function handleAddItem(
    categoryId: string,
    itemData: Omit<Item, "id" | "category_id" | "position">
  ) {
    try {
      const category = categories.find((c) => c.id === categoryId);
      const position = category?.items.length ?? 0;

      const { data, error } = await supabase
        .from("items")
        .insert({
          category_id: categoryId,
          ...itemData,
          position,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(
        categories.map((c) =>
          c.id === categoryId ? { ...c, items: [...c.items, data] } : c
        )
      );
      toast({ title: "Plat ajouté" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le plat.",
        variant: "destructive",
      });
    }
  }

  async function handleUpdateItem(
    categoryId: string,
    itemId: string,
    itemData: Partial<Omit<Item, "id" | "category_id" | "position">>
  ) {
    try {
      const { error } = await supabase
        .from("items")
        .update(itemData)
        .eq("id", itemId);

      if (error) throw error;

      setCategories(
        categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                items: c.items.map((item) =>
                  item.id === itemId ? { ...item, ...itemData } : item
                ),
              }
            : c
        )
      );
      toast({ title: "Plat mis à jour" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le plat.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteItem(categoryId: string, itemId: string) {
    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setCategories(
        categories.map((c) =>
          c.id === categoryId
            ? { ...c, items: c.items.filter((item) => item.id !== itemId) }
            : c
        )
      );
      toast({ title: "Plat supprimé" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le plat.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">← Retour</Link>
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">
            Éditeur — {restaurant.name}
          </h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/menu/${restaurant.slug}`} target="_blank">
            Voir le menu →
          </Link>
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Add category form */}
        <form
          onSubmit={handleAddCategory}
          className="flex gap-2 items-end"
        >
          <div className="flex-1 space-y-1">
            <Label htmlFor="categoryName">Nouvelle catégorie</Label>
            <Input
              id="categoryName"
              placeholder="Ex : Entrées, Plats, Desserts…"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={addingCategory || !newCategoryName.trim()}>
            Ajouter
          </Button>
        </form>

        {/* Categories list */}
        {categories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Aucune catégorie pour l&apos;instant.</p>
            <p className="text-sm mt-1">
              Créez votre première catégorie pour commencer à ajouter des plats.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                restaurantId={restaurant.id}
                onDeleteCategory={handleDeleteCategory}
                onUpdateCategory={handleUpdateCategory}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
