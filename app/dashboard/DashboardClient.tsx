"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

interface Props {
  user: User;
  restaurant: Restaurant | null;
  stats: Stats;
}

export default function DashboardClient({ user, restaurant, stats }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateRestaurant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const slug = slugify(name);
      const { error: insertError } = await supabase
        .from("restaurants")
        .insert({ user_id: user.id, name, slug, description: description || null });
      if (insertError) {
        setError(insertError.code === "23505" ? "Ce nom est déjà utilisé. Essayez un autre nom." : insertError.message);
        return;
      }
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const menuUrl = typeof window !== "undefined"
    ? `${window.location.origin}/menu/${restaurant?.slug}`
    : `/menu/${restaurant?.slug}`;

  // No restaurant yet
  if (!restaurant) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Configurer votre restaurant</h1>
            <p className="text-sm text-slate-500 mt-1">Bienvenue {user.email?.split("@")[0]} ! Commencez par créer votre espace.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nom du restaurant <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ex : Le Bistrot Parisien"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optionnel)</span></label>
                <textarea
                  placeholder="Courte description de votre établissement…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              {name && (
                <p className="text-xs text-slate-400">
                  URL du menu : <span className="font-mono text-slate-600">/menu/{slugify(name)}</span>
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {loading ? "Création…" : "Créer mon restaurant"}
              </button>
            </form>
          </div>

          <div className="mt-4 text-center">
            <button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{restaurant.name}</h1>
          {restaurant.description && <p className="text-sm text-slate-500 mt-0.5">{restaurant.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/menu/${restaurant.slug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-md"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Voir le menu
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Aujourd'hui", value: stats.todayOrders, unit: "commandes", alert: false },
          { label: "Revenus du jour", value: `${stats.todayRevenue.toFixed(2)} €`, unit: "", alert: false },
          { label: "En attente", value: stats.pendingOrders, unit: "à traiter", alert: stats.pendingOrders > 0 },
          { label: "Total", value: stats.totalOrders, unit: "commandes", alert: false },
        ].map((s, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl border p-4 shadow-card ${s.alert ? "border-amber-200 bg-amber-50" : "border-slate-200"}`}
          >
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.alert ? "text-amber-600" : "text-slate-900"}`}>{s.value}</p>
            {s.unit && <p className="text-xs text-slate-400 mt-0.5">{s.unit}</p>}
            {s.alert && stats.pendingOrders > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 status-pulse" />
                <span className="text-xs text-amber-600 font-medium">Action requise</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Commandes en direct", desc: "Gérez les commandes en temps réel", href: "/dashboard/orders", color: "text-teal-600", bg: "bg-teal-50 border-teal-200" },
          { label: "Éditeur de menu", desc: "Modifiez vos plats et catégories", href: "/dashboard/editor", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
          { label: "QR Code", desc: "Téléchargez votre QR code", href: "/dashboard/qrcode", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover p-4 flex items-center gap-3 transition-all group hover:border-slate-300"
          >
            <div className={`flex-1 min-w-0`}>
              <p className={`text-sm font-semibold ${a.color}`}>{a.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
            </div>
            <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Menu URL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Lien public du menu</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-500 font-mono truncate">
            {menuUrl}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(menuUrl)}
            className="flex-shrink-0 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-md transition-all"
          >
            Copier
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2.5">
          Ajoutez <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">?table=1</code> pour pré-remplir le numéro de table dans l&apos;URL du QR code.
        </p>
      </div>
    </div>
  );
}
