"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ImageUpload";

interface ItemData {
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  available: boolean;
}

interface Props {
  initialData?: Partial<ItemData>;
  restaurantId: string;
  onSubmit: (data: ItemData) => Promise<void>;
  onCancel: () => void;
}

export default function ItemForm({ initialData, restaurantId, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [price, setPrice] = useState(
    initialData?.price != null ? String(initialData.price) : ""
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url ?? null);
  const [available, setAvailable] = useState(initialData?.available ?? true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        price: price !== "" ? parseFloat(price) : null,
        image_url: imageUrl,
        available,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg border bg-white space-y-3">
      <div className="space-y-1">
        <Label htmlFor="itemName">Nom du plat *</Label>
        <Input
          id="itemName"
          placeholder="Ex : Salade César"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="itemDesc">Description (optionnel)</Label>
        <Textarea
          id="itemDesc"
          placeholder="Ingrédients, allergènes…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="itemPrice">Prix (€)</Label>
          <Input
            id="itemPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="12.90"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="itemAvailable">Disponibilité</Label>
          <select
            id="itemAvailable"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={available ? "true" : "false"}
            onChange={(e) => setAvailable(e.target.value === "true")}
          >
            <option value="true">Disponible</option>
            <option value="false">Indisponible</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Image</Label>
        <ImageUpload value={imageUrl} onChange={setImageUrl} restaurantId={restaurantId} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={submitting || !name.trim()}>
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
