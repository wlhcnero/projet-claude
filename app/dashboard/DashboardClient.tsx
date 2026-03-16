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

const quickActions = [
  { label: "Modifier le menu", href: "/dashboard/editor", icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ), color: "from-blue-500 to-blue-600" },
  { label: "Commandes live", href: "/dashboard/orders", icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ), color: "from-orange-500 to-amber-400" },
  { label: "Mon QR Code", href: "/dashboard/qrcode", icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v7z" />
    </svg>
  ), color: "from-purple-500 to-purple-600" },
];

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
        if (insertError.code === "23505") {
          setError("Ce nom de restaurant est déjà pris. Essayez un autre nom.");
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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const menuUrl = typeof window !== "undefined"
    ? `${window.location.origin}/menu/${restaurant?.slug}`
    : `/menu/${restaurant?.slug}`;

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-3xl mx-auto mb-4">
              🍽️
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Bienvenue sur MenuQR Pro !</h1>
            <p className="text-white/50">Configurez votre restaurant pour créer votre menu digital.</p>
          </div>

          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-8">
            <form onSubmit={handleCreateRestaurant} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">
                  Nom du restaurant <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex : La Brasserie du Coin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-orange-500/60 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">
                  Description <span className="text-white/30 font-normal">(optionnel)</span>
                </label>
                <textarea
                  placeholder="Une courte description de votre établissement…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-orange-500/60 transition-all text-sm resize-none"
                />
              </div>

              {name && (
                <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white/40">
                  <svg className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Accessible sur : <code className="text-orange-400 ml-1">/menu/{slugify(name)}</code>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-premium"
              >
                {loading ? "Création en cours…" : "Créer mon restaurant"}
              </button>
            </form>
          </div>

          <div className="mt-4 text-center">
            <button onClick={handleSignOut} className="text-sm text-white/25 hover:text-white/50 transition-colors">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="text-white/40 mt-0.5 text-sm">{restaurant.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/menu/${restaurant.slug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors bg-white/5 border border-white/8 px-3 py-2 rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Voir le menu
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Commandes aujourd'hui",
            value: stats.todayOrders,
            icon: "📦",
            color: "from-blue-500/15 to-blue-600/5",
            border: "border-blue-500/15",
          },
          {
            label: "Revenu aujourd'hui",
            value: `${stats.todayRevenue.toFixed(2)} €`,
            icon: "💶",
            color: "from-green-500/15 to-green-600/5",
            border: "border-green-500/15",
          },
          {
            label: "En attente",
            value: stats.pendingOrders,
            icon: "⏳",
            color: "from-orange-500/15 to-amber-400/5",
            border: "border-orange-500/20",
            highlight: stats.pendingOrders > 0,
          },
          {
            label: "Total commandes",
            value: stats.totalOrders,
            icon: "📊",
            color: "from-purple-500/15 to-purple-600/5",
            border: "border-purple-500/15",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 ${stat.highlight ? "ring-1 ring-orange-500/30" : ""}`}
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.highlight ? "text-orange-400" : "text-white"}`}>
              {stat.value}
            </div>
            <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
            {stat.highlight && stat.pendingOrders > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 status-pulse" />
                <span className="text-xs text-orange-400">Action requise</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 bg-white/[0.03] border border-white/8 rounded-2xl p-5 hover:bg-white/[0.06] transition-all hover:border-white/15"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{action.label}</p>
              </div>
              <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Menu URL */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Lien de votre menu</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/60 font-mono truncate">
            {menuUrl}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(menuUrl)}
            className="flex-shrink-0 flex items-center gap-2 bg-white/8 border border-white/10 hover:bg-white/12 transition-colors text-white/70 hover:text-white text-sm px-4 py-3 rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copier
          </button>
        </div>
        <p className="text-xs text-white/25 mt-3">
          Partagez ce lien ou générez un QR code depuis l&apos;onglet QR Code.
          Ajoutez <code className="text-orange-400">?table=1</code> pour pré-remplir le numéro de table.
        </p>
      </div>
    </div>
  );
}
