"use client";

interface DayStat {
  date: string;
  orders: number;
  revenue: number;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface Props {
  restaurantName: string;
  dailyStats: DayStat[];
  topItems: TopItem[];
  summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

export default function StatsClient({ restaurantName, dailyStats, topItems, summary }: Props) {
  const maxRevenue = Math.max(...dailyStats.map((d) => d.revenue), 1);
  const maxQty = Math.max(...topItems.map((i) => i.quantity), 1);

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Statistiques</h1>
        <p className="text-sm text-slate-400 mt-0.5">{restaurantName} — 7 derniers jours</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "CA (7j)", value: `${summary.totalRevenue.toFixed(2)} €`, sub: "chiffre d'affaires" },
          { label: "Commandes", value: summary.totalOrders, sub: "sur 7 jours" },
          { label: "Panier moyen", value: `${summary.avgOrderValue.toFixed(2)} €`, sub: "par commande" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <p className="text-sm font-semibold text-slate-700 mb-4">Revenus par jour</p>
        <div className="flex items-end gap-2 h-36">
          {dailyStats.map((d) => {
            const height = maxRevenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 4 : 0) : 0;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex items-end justify-center" style={{ height: "112px" }}>
                  {d.revenue > 0 && (
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                      {d.revenue.toFixed(2)} € · {d.orders} cmd
                    </div>
                  )}
                  <div
                    className="w-full rounded-t-md bg-teal-500 hover:bg-teal-600 transition-colors"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{formatDate(d.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <p className="text-sm font-semibold text-slate-700 mb-4">Commandes par jour</p>
        <div className="flex items-end gap-2 h-24">
          {dailyStats.map((d) => {
            const maxOrd = Math.max(...dailyStats.map((x) => x.orders), 1);
            const height = maxOrd > 0 ? Math.max((d.orders / maxOrd) * 100, d.orders > 0 ? 6 : 0) : 0;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex items-end justify-center" style={{ height: "80px" }}>
                  {d.orders > 0 && (
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                      {d.orders} commande{d.orders > 1 ? "s" : ""}
                    </div>
                  )}
                  <div
                    className="w-full rounded-t-md bg-slate-700 hover:bg-slate-600 transition-colors"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{formatDate(d.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top items */}
      {topItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <p className="text-sm font-semibold text-slate-700 mb-4">Articles les plus commandés</p>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-slate-300 text-right flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{item.quantity}x · {item.revenue.toFixed(2)} €</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(item.quantity / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topItems.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-card">
          <p className="text-slate-400 text-sm">Aucune donnée disponible pour cette période.</p>
          <p className="text-slate-300 text-xs mt-1">Les statistiques apparaîtront dès que des commandes seront passées.</p>
        </div>
      )}
    </div>
  );
}
