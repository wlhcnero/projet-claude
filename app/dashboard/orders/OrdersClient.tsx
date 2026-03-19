"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.start(ctx.currentTime + i * 0.16);
      osc.stop(ctx.currentTime + i * 0.16 + 0.14);
    });
  } catch {
    // AudioContext non supporté
  }
}

function exportCSV(orders: Order[]) {
  const headers = ["Réf.", "Table", "Statut", "Total (€)", "Notes", "Date", "Articles"];
  const rows = orders.map((o) => [
    o.id.slice(0, 8).toUpperCase(),
    o.table_number,
    STATUS_CONFIG[o.status].label,
    Number(o.total_amount).toFixed(2),
    o.customer_notes ?? "",
    new Date(o.created_at).toLocaleString("fr-FR"),
    o.order_items.map((i) => `${i.quantity}x ${i.item_name} (${Number(i.item_price).toFixed(2)}€)`).join(" | "),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type OrderStatus = "pending" | "preparing" | "ready" | "served";

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  item_notes: string | null;
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

interface Props {
  restaurantId: string;
  initialOrders: Order[];
}

const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  dot: string;
  badge: string;
  nextLabel: string;
  next: OrderStatus | null;
  btnClass: string;
}> = {
  pending: {
    label: "En attente",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    next: "preparing",
    nextLabel: "Prendre en charge",
    btnClass: "bg-slate-900 hover:bg-slate-800 text-white",
  },
  preparing: {
    label: "En préparation",
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    next: "ready",
    nextLabel: "Marquer prêt",
    btnClass: "bg-teal-500 hover:bg-teal-600 text-white",
  },
  ready: {
    label: "Prêt à servir",
    dot: "bg-teal-400",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    next: "served",
    nextLabel: "Marquer servi",
    btnClass: "bg-teal-500 hover:bg-teal-600 text-white",
  },
  served: {
    label: "Servi",
    dot: "bg-slate-300",
    badge: "bg-slate-50 text-slate-500 border-slate-200",
    next: null,
    nextLabel: "",
    btnClass: "",
  },
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  return `${Math.floor(diff / 3600)} h`;
}

function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, status: OrderStatus) => void }) {
  const config = STATUS_CONFIG[order.status];
  const [updating, setUpdating] = useState(false);

  async function handleAdvance() {
    if (!config.next || updating) return;
    setUpdating(true);
    await onStatusChange(order.id, config.next);
    setUpdating(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
      <div className="px-4 py-3 flex items-center justify-between gap-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">Table {order.table_number}</span>
          <span className="text-xs text-slate-400">— {timeAgo(order.created_at)}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.badge}`}>
          {config.label}
        </span>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
              {item.quantity}
            </span>
            <span className="text-slate-700 flex-1 truncate">{item.item_name}</span>
            <span className="text-slate-400 text-xs">{(item.item_price * item.quantity).toFixed(2)} €</span>
          </div>
        ))}
        {order.customer_notes && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-500">
            <svg className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>{order.customer_notes}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100">
        <span className="text-sm font-bold text-slate-900">{Number(order.total_amount).toFixed(2)} €</span>
        {config.next && (
          <button
            onClick={handleAdvance}
            disabled={updating}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${config.btnClass}`}
          >
            {updating ? "…" : config.nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrdersClient({ restaurantId, initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [newAlert, setNewAlert] = useState(false);
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);

  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      const supabase = createClient();
      await supabase.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", payload.new.id).single();
          if (data) {
            setOrders((prev) => [data as Order, ...prev]);
            setNewAlert(true);
            setTimeout(() => setNewAlert(false), 4000);
            if (soundEnabledRef.current) playNotificationSound();
          }
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => setOrders((prev) => prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new as Partial<Order> } : o))
      )
      .subscribe((s) => setConnected(s === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  const activeCount = byStatus("pending").length + byStatus("preparing").length;
  const columns: { status: OrderStatus }[] = [{ status: "pending" }, { status: "preparing" }, { status: "ready" }, { status: "served" }];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Commandes</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-teal-500 status-pulse" : "bg-red-400"}`} />
            <span className="text-xs text-slate-400">{connected ? "Temps réel" : "Reconnexion…"}</span>
            {activeCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-200">
                {activeCount} en cours
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? "Désactiver le son" : "Activer le son"}
            className={`text-xs border px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${soundEnabled ? "text-teal-600 border-teal-200 bg-teal-50 hover:bg-teal-100" : "text-slate-400 border-slate-200 hover:border-slate-300"}`}
          >
            {soundEnabled ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9 12H3" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
            Son
          </button>
          <button
            onClick={() => exportCSV(orders)}
            disabled={orders.length === 0}
            className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
          <button
            onClick={async () => {
              const supabase = createClient();
              const { data } = await supabase.from("orders").select("*, order_items(*)").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(50);
              if (data) setOrders(data as Order[]);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* New order alert */}
      {newAlert && (
        <div className="animate-fade-in bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-teal-800">
          <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="font-medium">Nouvelle commande reçue</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium text-sm">Aucune commande pour l&apos;instant</p>
          <p className="text-xs text-slate-400 mt-1">Les commandes apparaîtront ici en temps réel</p>
        </div>
      ) : (
        <>
          {/* Mobile tabs */}
          <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {([["all", "Toutes"] as const, ...columns.map((c) => [c.status, STATUS_CONFIG[c.status].label] as const)]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                  filter === val
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop Kanban */}
          <div className="hidden lg:grid grid-cols-4 gap-4">
            {columns.map((col) => {
              const colOrders = byStatus(col.status);
              const config = STATUS_CONFIG[col.status];
              return (
                <div key={col.status} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{config.label}</span>
                    {colOrders.length > 0 && (
                      <span className="ml-auto text-xs font-bold text-slate-400">{colOrders.length}</span>
                    )}
                  </div>
                  {colOrders.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl h-20 flex items-center justify-center">
                      <p className="text-xs text-slate-300">—</p>
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile list */}
          <div className="lg:hidden space-y-3">
            {orders
              .filter((o) => filter === "all" || o.status === filter)
              .map((order) => (
                <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
