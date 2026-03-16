import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-teal-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v7z" />
              </svg>
            </div>
            <span className="font-semibold text-white">MenuQR Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded-md transition-colors">
              Connexion
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-md transition-colors">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded-full px-3 py-1.5 mb-8 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 status-pulse inline-block" />
          Commandes en temps réel — Zéro commission
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight text-white mb-6">
          Le menu digital qui<br />
          <span className="text-teal-400">simplifie votre service</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Vos clients scannent, commandent et se font servir à table.
          Vous gérez tout depuis un tableau de bord simple et efficace.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-7 py-3 rounded-md transition-colors text-sm">
            Créer mon menu gratuit
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center text-slate-400 hover:text-white px-7 py-3 rounded-md transition-colors text-sm border border-white/10 hover:border-white/20">
            Se connecter
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-600">Aucune carte bancaire requise · Opérationnel en 5 minutes</p>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v7z" />
                  </svg>
                ),
                title: "QR Code par table",
                desc: "Un QR code unique par table. Vos clients accèdent au menu instantanément, sans téléchargement.",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "Commande directe",
                desc: "Les clients ajoutent les plats au panier et passent commande. La commande arrive directement en cuisine.",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Tableau de bord",
                desc: "Gérez les commandes en temps réel, suivez les statuts et visualisez les performances de la journée.",
              },
            ].map((f, i) => (
              <div key={i} className="space-y-3">
                <div className="w-9 h-9 rounded-md bg-teal-500/15 text-teal-400 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-xl font-semibold text-white mb-10 text-center">Opérationnel en 4 étapes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: "1", t: "Créez votre compte", d: "Gratuit, sans CB" },
            { n: "2", t: "Configurez le menu", d: "Plats, prix, catégories" },
            { n: "3", t: "Imprimez le QR code", d: "Sur chaque table" },
            { n: "4", t: "Recevez les commandes", d: "En temps réel" },
          ].map((s) => (
            <div key={s.n} className="text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-sm font-bold flex items-center justify-center mx-auto">
                {s.n}
              </div>
              <p className="text-sm font-medium text-white">{s.t}</p>
              <p className="text-xs text-slate-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Prêt à moderniser votre service ?</h2>
          <p className="text-slate-400 mb-8 text-sm">Rejoignez les restaurants qui ont simplifié leur prise de commande.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 py-3 rounded-md transition-colors text-sm">
            Démarrer gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>MenuQR Pro</span>
          <span>© 2026 — Tous droits réservés</span>
        </div>
      </footer>
    </div>
  );
}
