"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ItemCard from "@/components/ItemCard";
import ItemForm from "@/components/ItemForm";

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
  name: string;
  items: Item[];
}

interface Props {
  category: Category;
  onDeleteCategory: (id: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onAddItem: (
    categoryId: string,
    data: Omit<Item, "id" | "category_id" | "position">
  ) => Promise<void>;
  onUpdateItem: (
    categoryId: string,
    itemId: string,
    data: Partial<Omit<Item, "id" | "category_id" | "position">>
  ) => Promise<void>;
  onDeleteItem: (categoryId: string, itemId: string) => Promise<void>;
}

export default function CategoryCard({
  category,
  onDeleteCategory,
  onUpdateCategory,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSaveName() {
    if (editName.trim() && editName !== category.name) {
      await onUpdateCategory(category.id, editName.trim());
    }
    setEditing(false);
  }

  async function handleDelete() {
    if (
      !confirm(
        `Supprimer la catégorie "${category.name}" et tous ses plats ?`
      )
    )
      return;
    setDeleting(true);
    await onDeleteCategory(category.id);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="flex-1 font-semibold"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName}>
                Enregistrer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Annuler
              </Button>
            </>
          ) : (
            <>
              <h3 className="flex-1 text-lg font-semibold">{category.name}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditName(category.name);
                  setEditing(true);
                }}
              >
                Renommer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                Supprimer
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {category.items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onUpdate={(data) => onUpdateItem(category.id, item.id, data)}
            onDelete={() => onDeleteItem(category.id, item.id)}
          />
        ))}

        {showAddItem ? (
          <ItemForm
            onSubmit={async (data) => {
              await onAddItem(category.id, data);
              setShowAddItem(false);
            }}
            onCancel={() => setShowAddItem(false)}
          />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAddItem(true)}
          >
            + Ajouter un plat
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
