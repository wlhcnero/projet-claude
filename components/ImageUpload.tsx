"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  restaurantId: string;
}

export default function ImageUpload({ value, onChange, restaurantId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Fichier invalide. Choisissez une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde (max 5 Mo).");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${restaurantId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    onChange(null);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-200 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs bg-white text-slate-800 font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs bg-red-500 text-white font-medium px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg hover:border-teal-400 hover:bg-teal-50/50 transition-all flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-teal-600 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-xs">Upload en cours…</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Cliquer pour ajouter une image</span>
              <span className="text-xs">JPG, PNG, WebP — max 5 Mo</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
