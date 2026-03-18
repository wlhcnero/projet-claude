"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ItemForm from "@/components/ItemForm";
import VariantsEditor from "@/components/VariantsEditor";

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  available: boolean;
}

interface Props {
  item: Item;
  restaurantId: string;
  onUpdate: (
    data: Partial<Omit<Item, "id">>
  ) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function ItemCard({ item, restaurantId, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Supprimer "${item.name}" ?`)) return;
    setDeleting(true);
    await onDelete();
  }

  async function handleToggleAvailable() {
    await onUpdate({ available: !item.available });
  }

  if (editing) {
    return (
      <div>
        <ItemForm
          initialData={item}
          restaurantId={restaurantId}
          onSubmit={async (data) => {
            await onUpdate(data);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
        <div className="mt-2 px-1">
          <VariantsEditor itemId={item.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border">
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{item.name}</span>
          {!item.available && (
            <Badge variant="secondary" className="text-xs">
              Indisponible
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.price !== null && (
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {Number(item.price).toFixed(2)} €
          </p>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={handleToggleAvailable}
        >
          {item.available ? "Désactiver" : "Activer"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={() => setEditing(true)}
        >
          Modifier
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-red-500 hover:text-red-700"
          onClick={handleDelete}
          disabled={deleting}
        >
          Suppr.
        </Button>
      </div>
    </div>
  );
}
