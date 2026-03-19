"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { use } from "react";

type OrderStatus = "pending" | "preparing" | "ready" | "served";

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
}

interface Order {
  id: string;
  table_number: string;
  status: OrderStatus;
  total_amount: number;
  customer_notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "pending", label: "Commande reçue", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { key: "preparing", label: "En préparation", icon: "M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" },
  { key: "ready", label: "Prêt à servir", icon: "M5 13l4 4L19 7" },
  { key: "served", label: "Servi", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  preparing: 1,
  ready: 2,
  served: 3,
};

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadOrder() {
      try {
        const { data, error: fetchError } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", orderId)
          .single();
        if (fetchError) throw fetchError;
        setOrder(data as Order);
      } catch {
        setError("Commande introuvable.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, ...(payload.new as Partial<Order>) } : prev);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-600 font-medium">{error ?? "Commande introuvable"}</p>
          <Link href={`/menu/${slug}`} className="mt-4 inline-block text-sm text-teal-600 hover:text-teal-700 font-medium">
            Retour au menu
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_INDEX[order.status];
  const isServed = order.status === "served";
  const isReady = order.status === "ready";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Suivi commande</p>
            <p className="text-sm font-bold text-slate-900">Table {order.table_number} — Réf. {order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <Link href={`/menu/${slug}`} className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-md transition-colors">
            Menu
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Status banner */}
        <div className={`rounded-2xl p-5 text-center transition-all ${
          isReady ? "bg-teal-500 text-white" :
          isServed ? "bg-slate-100 text-slate-600" :
          "bg-white border border-slate-200"
        }`}>
          {isReady && (
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <p className={`text-lg font-bold mb-1 ${isReady ? "text-white" : isServed ? "text-slate-700" : "text-slate-900"}`}>
            {isReady ? "Votre commande est prête !" :
             isServed ? "Bon appétit !" :
             order.status === "preparing" ? "En cours de préparation…" :
             "Commande reçue"}
          </p>
          <p className={`text-sm ${isReady ? "text-white/80" : "text-slate-400"}`}>
            {isReady ? "Le serveur arrive avec votre commande." :
             isServed ? "Merci de votre visite." :
             order.status === "preparing" ? "Notre équipe prépare votre commande." :
             "Votre commande a bien été enregistrée."}
          </p>
          {!isServed && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full status-pulse ${isReady ? "bg-white" : "bg-teal-500"}`} />
              <span className={`text-xs font-medium ${isReady ? "text-white/80" : "text-teal-600"}`}>Mise à jour en temps réel</span>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              const last = i === STEPS.length - 1;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done ? (active ? "bg-teal-500" : "bg-teal-100") : "bg-slate-100"
                    }`}>
                      {done && !active ? (
                        <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className={`w-4 h-4 ${active ? "text-white" : "text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                        </svg>
                      )}
                    </div>
                    {!last && (
                      <div className={`w-0.5 h-6 mt-1 rounded-full transition-all ${i < currentStep ? "bg-teal-200" : "bg-slate-100"}`} />
                    )}
                  </div>
                  <div className="pb-5 flex-1">
                    <p className={`text-sm font-semibold mt-1 ${active ? "text-teal-600" : done ? "text-slate-700" : "text-slate-300"}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Récapitulatif</p>
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                  {item.quantity}
                </span>
                <span className="flex-1 text-slate-700">{item.item_name}</span>
                <span className="text-slate-400 text-xs">{(Number(item.item_price) * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
          </div>
          {order.customer_notes && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 italic">
              Note : {order.customer_notes}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="text-base font-bold text-slate-900">{Number(order.total_amount).toFixed(2)} €</span>
          </div>
        </div>
      </main>
    </div>
  );
}
