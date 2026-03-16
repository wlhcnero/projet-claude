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
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
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
    if (!tableNumber.trim()) return;
    if (cart.length === 0) return;

    setOrderStatus("submitting");
    try {
      const supabase = createClient();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurant.id,
          table_number: tableNumber.trim(),
          status: "pending",
          total_amount: cartTotal,
          customer_notes: customerNotes.trim() || null,
        })
        .select("id")
        .single();

      if (orderError || !order) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        item_id: item.id,
        item_name: item.name,
        item_price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderId(order.id);
      setOrderStatus("success");
      setCart([]);
      setCartOpen(false);
    } catch {
      setOrderStatus("error");
    }
  }

  // Scroll-spy for active category
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace("cat-", ""));
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  if (orderStatus === "success") {
    return (
      <div className="min-h-screen bg-[#FAF6F1] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande envoyée !</h1>
          <p className="text-gray-500 mb-2">
            Votre commande pour la <strong>table {tableNumber}</strong> a été transmise.
          </p>
          <p className="text-sm text-gray-400 mb-8">Référence : <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{orderId?.slice(0, 8).toUpperCase()}</code></p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 status-pulse" />
              <span className="text-sm font-semibold text-amber-800">Votre commande est en préparation</span>
            </div>
            <p className="text-sm text-amber-700">Notre équipe a bien reçu votre commande et s&apos;en occupe. Restez à votre table !</p>
          </div>
          <button
            onClick={() => setOrderStatus("idle")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-all"
          >
            Commander autre chose
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-xs text-gray-400 truncate">{restaurant.description}</p>
              )}
            </div>
            {tableNumber && (
              <div className="flex-shrink-0 flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
                <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-semibold text-orange-700">Table {tableNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Menu */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-10 pb-32">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-gray-500 font-medium">Le menu est en cours de préparation</p>
            <p className="text-sm text-gray-400 mt-1">Revenez bientôt !</p>
          </div>
        ) : (
          categories.map((category) => (
            <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-36">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-1">{category.name}</span>
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {category.items.filter(i => i.available).length} plats
                </span>
              </h2>
              <div className="space-y-3">
                {category.items.map((item) => {
                  const qty = getQuantity(item.id);
                  const unavailable = !item.available;
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl overflow-hidden shadow-card transition-all ${unavailable ? "opacity-50" : "hover:shadow-md"}`}
                    >
                      <div className="flex gap-0">
                        {item.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-28 h-28 object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {item.name}
                              </h3>
                              {unavailable && (
                                <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                  Indisponible
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            {item.price !== null ? (
                              <span className="font-bold text-orange-600 text-base">
                                {Number(item.price).toFixed(2)} €
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">Prix non défini</span>
                            )}
                            {!unavailable && item.price !== null && (
                              <div className="flex items-center gap-2">
                                {qty > 0 ? (
                                  <div className="flex items-center gap-2 bg-orange-50 rounded-xl p-1">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-7 h-7 rounded-lg bg-white border border-orange-200 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                                      </svg>
                                    </button>
                                    <span className="text-sm font-bold text-orange-600 min-w-[16px] text-center">{qty}</span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all hover:scale-110 shadow-sm"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-40 animate-slide-up">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-premium hover:opacity-95 transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-semibold">
                Voir le panier
                <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">{cartCount} article{cartCount > 1 ? "s" : ""}</span>
              </span>
            </div>
            <span className="font-bold text-lg">{cartTotal.toFixed(2)} €</span>
          </button>
        </div>
      )}

      {/* Cart drawer overlay */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl animate-slide-in-bottom max-h-[90vh] flex flex-col sm:max-w-md sm:right-0 sm:left-auto sm:bottom-0 sm:top-0 sm:rounded-l-3xl sm:rounded-tr-none sm:max-h-full sm:animate-slide-in-right">
            {/* Drawer handle */}
            <div className="flex justify-center py-3 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-6 pb-4 sm:pt-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Votre panier</h2>
                <p className="text-sm text-gray-500">{cartCount} article{cartCount > 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-6 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-50">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1m20 0h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-orange-600 font-semibold text-sm">{(item.price * item.quantity).toFixed(2)} €</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-sm font-bold text-gray-800 min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => {
                      const menuItem = categories.flatMap(c => c.items).find(i => i.id === item.id);
                      if (menuItem) addToCart(menuItem);
                    }} className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order form */}
            <div className="px-6 pt-4 pb-6 space-y-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span className="text-orange-600 text-xl">{cartTotal.toFixed(2)} €</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Numéro de table <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5, Terrasse 2, Bar…"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Note pour la cuisine <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  placeholder="Ex: sans oignons, allergie arachides…"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>

              {orderStatus === "error" && (
                <p className="text-sm text-red-500 text-center">Une erreur s&apos;est produite. Veuillez réessayer.</p>
              )}

              <button
                onClick={handleOrder}
                disabled={!tableNumber.trim() || cart.length === 0 || orderStatus === "submitting"}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-premium text-base"
              >
                {orderStatus === "submitting" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Envoi en cours…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Commander — {cartTotal.toFixed(2)} €
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-4 text-xs text-gray-300">
        Propulsé par <span className="font-medium text-orange-400">MenuQR Pro</span>
      </div>
    </div>
  );
}
