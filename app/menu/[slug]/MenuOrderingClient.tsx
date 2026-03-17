"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  available: boolean;
  position: number;
}

interface MenuCategory {
  id: string;
  name: string;
  position: number;
  items: MenuItem[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface Props {
  restaurant: { id: string; name: string; description: string | null; slug: string };
  categories: MenuCategory[];
  initialTable: string;
}

type OrderStatus = "idle" | "submitting" | "success" | "error";

export default function MenuOrderingClient({ restaurant, categories, initialTable }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(initialTable);
  const [customerNotes, setCustomerNotes] = useState("");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((item: MenuItem) => {
    if (!item.available || item.price === null) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price!, quantity: 1, image_url: item.image_url }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.id !== id);
      return prev.map((c) => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }, []);

  const getQuantity = (id: string) => cart.find((c) => c.id === id)?.quantity ?? 0;

  async function handleOrder() {
    if (!tableNumber.trim() || cart.length === 0) return;
    setOrderStatus("submitting");
    try {
      const supabase = createClient();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({ restaurant_id: restaurant.id, table_number: tableNumber.trim(), status: "pending", total_amount: cartTotal, customer_notes: customerNotes.trim() || null })
        .select("id").single();

      if (orderError || !order) throw orderError;

      await supabase.from("order_items").insert(
        cart.map((item) => ({ order_id: order.id, item_id: item.id, item_name: item.name, item_price: item.price, quantity: item.quantity }))
      );

      setOrderId(order.id);
      setOrderStatus("success");
      setCart([]);
      setCartOpen(false);
    } catch (err) {
      console.error("Order error:", err);
      setOrderStatus("error");
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveCategory(e.target.id.replace("cat-", "")); }); },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    categories.forEach((cat) => { const el = document.getElementById(`cat-${cat.id}`); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [categories]);

  if (orderStatus === "success") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Commande envoyée !</h1>
          <p className="text-sm text-slate-500 mb-1">Table <strong>{tableNumber}</strong> — Réf. <span className="font-mono text-xs">{orderId?.slice(0, 8).toUpperCase()}</span></p>
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-sm text-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-teal-500 status-pulse" />
              <span className="font-medium text-slate-800">Votre commande est en cours de préparation</span>
            </div>
            <p className="text-slate-500 text-xs">Restez à votre table, notre équipe s&apos;en occupe.</p>
          </div>
          <button
            onClick={() => setOrderStatus("idle")}
            className="mt-6 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Commander autre chose
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 truncate">{restaurant.name}</h1>
              {restaurant.description && <p className="text-xs text-slate-400 truncate">{restaurant.description}</p>}
            </div>
            {tableNumber && (
              <div className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Table {tableNumber}
              </div>
            )}
          </div>

          {/* Category tabs */}
          {categories.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat.id
                      ? "bg-teal-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-8 pb-32">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 font-medium">Menu en cours de préparation</p>
            <p className="text-sm text-slate-300 mt-1">Revenez bientôt !</p>
          </div>
        ) : (
          categories.map((category) => (
            <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-32">
              <h2 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">{category.name}</h2>
              <div className="space-y-2">
                {category.items.map((item) => {
                  const qty = getQuantity(item.id);
                  const unavailable = !item.available;
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-lg border border-slate-200 overflow-hidden flex transition-all ${unavailable ? "opacity-50" : "hover:border-slate-300 hover:shadow-card"}`}
                    >
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{item.name}</h3>
                            {unavailable && (
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex-shrink-0">Indisponible</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2.5">
                          {item.price !== null ? (
                            <span className="font-bold text-slate-900 text-sm">{Number(item.price).toFixed(2)} €</span>
                          ) : (
                            <span className="text-slate-400 text-xs">Prix sur demande</span>
                          )}
                          {!unavailable && item.price !== null && (
                            <div className="flex items-center gap-1.5">
                              {qty > 0 ? (
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-6 h-6 rounded-md text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <span className="text-xs font-bold text-slate-800 min-w-[14px] text-center">{qty}</span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-6 h-6 rounded-md bg-teal-500 text-white hover:bg-teal-600 flex items-center justify-center transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-7 h-7 rounded-lg bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Floating cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-5 inset-x-4 max-w-sm mx-auto z-40 animate-fade-in">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-lg transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">
                {cartCount} article{cartCount > 1 ? "s" : ""}
              </span>
            </div>
            <span className="font-bold text-sm">{cartTotal.toFixed(2)} €</span>
          </button>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl animate-slide-in-bottom max-h-[90vh] flex flex-col sm:max-w-sm sm:right-0 sm:left-auto sm:bottom-0 sm:top-0 sm:rounded-l-2xl sm:rounded-tr-none sm:max-h-full sm:animate-slide-in-right">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-8 h-1 rounded-full bg-slate-200" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sm:pt-6">
              <h2 className="font-bold text-slate-900">Panier <span className="text-slate-400 font-normal text-sm">({cartCount})</span></h2>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.price.toFixed(2)} € / unité</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-sm font-bold text-slate-800 min-w-[18px] text-center">{item.quantity}</span>
                    <button onClick={() => {
                      const menuItem = categories.flatMap(c => c.items).find(i => i.id === item.id);
                      if (menuItem) addToCart(menuItem);
                    }} className="w-6 h-6 rounded-md bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <span className="text-xs font-semibold text-slate-700 min-w-[42px] text-right">{(item.price * item.quantity).toFixed(2)} €</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-5 space-y-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className="text-lg font-bold text-slate-900">{cartTotal.toFixed(2)} €</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Numéro de table <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ex : 5, Terrasse 2…"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Note pour la cuisine <span className="text-slate-400 font-normal">(optionnel)</span></label>
                <textarea
                  placeholder="Sans oignons, allergie noix…"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {orderStatus === "error" && (
                <p className="text-xs text-red-500 text-center">Une erreur est survenue. Veuillez réessayer.</p>
              )}

              <button
                onClick={handleOrder}
                disabled={!tableNumber.trim() || cart.length === 0 || orderStatus === "submitting"}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orderStatus === "submitting" ? "Envoi en cours…" : `Envoyer la commande — ${cartTotal.toFixed(2)} €`}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center py-5 text-xs text-slate-300">
        Propulsé par <span className="text-slate-400 font-medium">MenuQR Pro</span>
      </p>
    </div>
  );
}
