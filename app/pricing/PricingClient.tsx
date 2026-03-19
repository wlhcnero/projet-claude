"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    name: "Gratuit",
    price: "0 €",
    period: "pour toujours",
    description: "Pour tester l'outil",
    features: [
      "1 restaurant",
      "Menu en ligne illimité",
      "Commandes en temps réel",
      "QR Code",
    ],
    cta: "Commencer gratuitement",
    priceId: null,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "29 €",
    period: "/ mois",
    description: "Pour les professionnels",
    features: [
      "Tout le plan Gratuit",
      "Upload d'images",
      "Statistiques avancées",
      "Variantes & options",
      "Export CSV",
      "Support prioritaire",
    ],
    cta: "Démarrer l'essai Pro",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    highlighted: true,
  },
];

interface Props {
  isLoggedIn: boolean;
  isPro: boolean;
}

export default function PricingClient({ isLoggedIn, isPro }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(priceId: string | null | undefined) {
    if (!priceId) {
      router.push(isLoggedIn ? "/dashboard" : "/signup");
      return;
    }
    if (!isLoggedIn) {
      router.push("/signup");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v7z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-sm">MenuQR Pro</span>
          </Link>
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
            {isLoggedIn ? "Dashboard" : "Connexion"}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Tarifs simples et transparents</h1>
          <p className="text-slate-500 text-lg">Commencez gratuitement, passez Pro quand vous en avez besoin.</p>
        </div>

        {error && (
          <div className="mb-6 max-w-sm mx-auto bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-teal-500 bg-white shadow-lg ring-1 ring-teal-500/20"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full w-fit mb-3">
                  Recommandé
                </div>
              )}
              <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
              </div>
              <p className="text-sm text-slate-500 mb-5">{plan.description}</p>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isPro && plan.highlighted ? (
                <div className="w-full text-center py-2.5 rounded-xl text-sm font-medium bg-teal-50 text-teal-700 border border-teal-200">
                  Abonnement actif
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loading}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                    plan.highlighted
                      ? "bg-teal-500 hover:bg-teal-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {loading && plan.highlighted ? "Redirection…" : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Paiement sécurisé par Stripe · Résiliable à tout moment
        </p>
      </main>
    </div>
  );
}
