"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

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

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; next: OrderStatus | null; nextLabel: string }> = {
  pending: {
    label: "En attente",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    next: "preparing",
    nextLabel: "Prendre en charge",
  },
  preparing: {
    label: "En préparation",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    next: "ready",
    nextLabel: "Marquer prêt",
  },
  ready: {
    label: "Prêt à servir",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    next: "served",
    nextLabel: "Marquer servi",
  },
  served: {
    label: "Servi",
    color: "text-white/30",
    bg: "bg-white/[0.03]",
    border: "border-white/5",
    next: null,
    nextLabel: "",
  },
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
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
    <div className={`bg-[#1C2333] border ${config.border} rounded-2xl overflow-hidden transition-all hover:border-opacity-40`}>
      {/* Card header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center">
            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Table {order.table_number}</p>
            <p className="text-xs text-white/30">{timeAgo(order.created_at)} ago</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-white text-sm">{Number(order.total_amount).toFixed(2)} €</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-md bg-white/8 flex items-center justify-center text-xs font-bold text-white/60 flex-shrink-0">
              {item.quantity}
            </span>
            <span className="text-white/70 flex-1 truncate">{item.item_name}</span>
            <span className="text-white/30 text-xs flex-shrink-0">{(item.item_price * item.quantity).toFixed(2)} €</span>
          </div>
        ))}
        {order.customer_notes && (
          <div className="mt-2 pt-2 border-t border-white/5">
            <p className="text-xs text-amber-400/80 flex items-start gap-1.5">
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {order.customer_notes}
            </p>
          </div>
        )}
      </div>

      {/* Action button */}
      {config.next && (
        <div className="px-4 pb-4">
          <button
            onClick={handleAdvance}
            disabled={updating}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
              order.status === "pending"
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : order.status === "preparing"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {updating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mise à jour…
              </span>
            ) : config.nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrdersClient({ restaurantId, initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [connected, setConnected] = useState(false);

  const getOrdersByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  }, []);

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          // Fetch order with items
          const { data } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setOrders((prev) => [data as Order, ...prev]);
            setNewOrderAlert(true);
            setTimeout(() => setNewOrderAlert(false), 4000);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...payload.new as Partial<Order> } : o
            )
          );
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const pendingCount = getOrdersByStatus("pending").length;
  const preparingCount = getOrdersByStatus("preparing").length;
  const activeCount = pendingCount + preparingCount;

  const columns: { status: OrderStatus; label: string; count: number }[] = [
    { status: "pending", label: "En attente", count: pendingCount },
    { status: "preparing", label: "En préparation", count: preparingCount },
    { status: "ready", label: "Prêt à servir", count: getOrdersByStatus("ready").length },
    { status: "served", label: "Servi", count: getOrdersByStatus("served").length },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Commandes en direct</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 status-pulse" : "bg-red-400"}`} />
            <span className="text-xs text-white/40">{connected ? "Temps réel actif" : "Reconnexion…"}</span>
            {activeCount > 0 && (
              <span className="ml-2 bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full font-medium border border-orange-500/20">
                {activeCount} actif{activeCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={async () => {
            const supabase = createClient();
            const { data } = await supabase
              .from("orders")
              .select("*, order_items(*)")
              .eq("restaurant_id", restaurantId)
              .order("created_at", { ascending: false })
              .limit(50);
            if (data) setOrders(data as Order[]);
          }}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors bg-white/5 border border-white/8 px-4 py-2 rounded-xl"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* New order alert */}
      {newOrderAlert && (
        <div className="animate-slide-up bg-green-500/15 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-green-300 font-medium text-sm">Nouvelle commande reçue !</p>
        </div>
      )}

      {/* Mobile filter tabs */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setFilter("all")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filter === "all" ? "bg-white/15 text-white" : "bg-white/5 text-white/40"
          }`}
        >
          Tout ({orders.length})
        </button>
        {columns.map((col) => (
          <button
            key={col.status}
            onClick={() => setFilter(col.status)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === col.status ? "bg-white/15 text-white" : "bg-white/5 text-white/40"
            }`}
          >
            {col.label} {col.count > 0 && `(${col.count})`}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-white/40 font-medium">Aucune commande pour l&apos;instant</p>
          <p className="text-sm text-white/20 mt-1">Les commandes apparaîtront ici en temps réel</p>
        </div>
      ) : (
        <>
          {/* Desktop Kanban */}
          <div className="hidden lg:grid grid-cols-4 gap-4">
            {columns.map((col) => {
              const colOrders = getOrdersByStatus(col.status);
              const config = STATUS_CONFIG[col.status];
              return (
                <div key={col.status} className="space-y-3">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${config.bg} border ${config.border}`}>
                    <span className={`text-sm font-semibold ${config.color}`}>{col.label}</span>
                    {col.count > 0 && (
                      <span className={`w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold ${config.color}`}>
                        {col.count}
                      </span>
                    )}
                  </div>
                  {colOrders.length === 0 ? (
                    <div className="border border-dashed border-white/5 rounded-2xl h-24 flex items-center justify-center">
                      <p className="text-xs text-white/15">Vide</p>
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
