import { a as React, j as e, H as Head, L as Link, b as axios, r as router } from "./app-tgt1EkC5.js";
import { A as AppLayout } from "./AppLayout-ZHF-BB9p.js";

const MASCOT_AVATARS = [
  "/images/emojis/king.png",
  "/images/emojis/hero.png",
  "/images/emojis/cool.png",
  "/images/emojis/astro.png",
  "/images/emojis/chef.png",
  "/images/emojis/kitsune.png",
];

function formatMoney(kurus) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format((Number(kurus) || 0) / 100);
}

function formatMoneyShort(kurus) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format((Number(kurus) || 0) / 100);
}

export default function Home(initialProps) {
  const [period, setPeriod] = React.useState(initialProps.period || "all");
  const [data, setData] = React.useState({
    revenueStats: initialProps.revenueStats || {},
    topTables: initialProps.topTables || [],
    waiterStats: initialProps.waiterStats || [],
  });
  const [loading, setLoading] = React.useState(false);
  const [showAllTables, setShowAllTables] = React.useState(false);
  const [hoveredSlice, setHoveredSlice] = React.useState(null);

  const handlePeriodChange = async (newPeriod) => {
    setPeriod(newPeriod);
    setLoading(true);
    try {
      const res = await axios.get(`/api/home-stats?period=${newPeriod}`);
      if (res.data) {
        setData({
          revenueStats: res.data.revenueStats || {},
          topTables: res.data.topTables || [],
          waiterStats: res.data.waiterStats || [],
        });
      }
    } catch (err) {
      console.error("İstatistik yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const rev = data.revenueStats || {};
  const topTables = data.topTables || [];
  const waiterStats = data.waiterStats || [];
  const displayedTables = showAllTables ? topTables : topTables.slice(0, 8);

  // SVG Donut Chart Calculations
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const cashPct = Number(rev.cash_pct || 0);
  const cardPct = Number(rev.card_pct || 0);
  const cardArc = (cardPct / 100) * circumference;
  const cashArc = (cashPct / 100) * circumference;

  const periodOptions = [
    { key: "all", label: "Tüm Zamanlar" },
    { key: "month", label: "Bu Ay" },
    { key: "week", label: "Bu Hafta" },
    { key: "today", label: "Bugün" },
  ];

  return e.jsxs(AppLayout, {
    title: "Ana Sayfa & İstatistikler",
    children: [
      e.jsx(Head, { title: "Ana Sayfa" }),

      // ÜST KARŞILAMA & DÖNEM SEÇİCİ BAR
      e.jsxs("div", {
        className:
          "rounded-3xl p-6 mb-8 border border-purple-500/25 bg-white dark:bg-dark-card backdrop-blur-xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5",
        children: [
          e.jsxs("div", {
            className: "flex items-center gap-4",
            children: [
              e.jsx("img", {
                src: "/images/tilki-logo.jpg",
                alt: "TilkiAdisyon",
                className:
                  "w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-xl shadow-purple-500/30",
              }),
              e.jsxs("div", {
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-2.5 flex-wrap",
                    children: [
                      e.jsx("h1", {
                        className:
                          "text-2xl font-bold text-surface-900 dark:text-white tracking-tight",
                        children: "TilkiAdisyon Ana Sayfa",
                      }),
                      e.jsx("span", {
                        className:
                          "px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30",
                        children: "❄️ Kış Sürümü • Canlı Analiz",
                      }),
                    ],
                  }),
                  e.jsx("p", {
                    className: "text-sm text-surface-500 dark:text-zinc-400 mt-1",
                    children:
                      "Nakit & Kart gelir dağılımı, en yüksek ciro yapan masalar ve garson masa performansı",
                  }),
                ],
              }),
            ],
          }),

          e.jsxs("div", {
            className: "flex flex-wrap items-center gap-3",
            children: [
              e.jsx("div", {
                className:
                  "inline-flex p-1.5 rounded-2xl bg-surface-100 dark:bg-dark-elevated border border-surface-200 dark:border-dark-border",
                children: periodOptions.map((opt) =>
                  e.jsx(
                    "button",
                    {
                      onClick: () => handlePeriodChange(opt.key),
                      className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        period === opt.key
                          ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                          : "text-surface-600 dark:text-zinc-400 hover:text-surface-900 dark:hover:text-white"
                      }`,
                      children: opt.label,
                    },
                    opt.key
                  )
                ),
              }),
              e.jsxs(Link, {
                href: route("dashboard"),
                className:
                  "px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 transition-all flex items-center gap-2",
                children: [
                  e.jsx("span", { children: "🍽️" }),
                  e.jsx("span", { children: "Masalar Ekranı" }),
                ],
              }),
            ],
          }),
        ],
      }),

      // 4 HIZLI ÖZET KARTI (KPI STRIP)
      e.jsxs("div", {
        className: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-opacity ${
          loading ? "opacity-60" : "opacity-100"
        }`,
        children: [
          // KPI 1: Toplam Gelir
          e.jsx("div", {
            className:
              "rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/25 p-5",
            children: e.jsxs("div", {
              className: "flex items-center gap-3.5",
              children: [
                e.jsx("img", {
                  src: "/images/emojis/treasure.png",
                  alt: "Toplam Gelir",
                  className:
                    "w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500/40 shadow-md",
                }),
                e.jsxs("div", {
                  children: [
                    e.jsx("div", {
                      className:
                        "text-xs text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider",
                      children: "Toplam Tahsilat",
                    }),
                    e.jsx("div", {
                      className:
                        "text-2xl font-bold text-purple-800 dark:text-purple-300 mt-0.5",
                      children: formatMoneyShort(rev.total_revenue || 0),
                    }),
                    e.jsxs("div", {
                      className: "text-[11px] text-surface-600 dark:text-zinc-400 mt-0.5",
                      children: [
                        rev.total_paid_count || 0,
                        " ödenmiş adisyon",
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),

          // KPI 2: Kart Gelirleri
          e.jsx("div", {
            className:
              "rounded-2xl bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/25 p-5",
            children: e.jsxs("div", {
              className: "flex items-center gap-3.5",
              children: [
                e.jsx("img", {
                  src: "/images/emojis/star.png",
                  alt: "Kart Gelirleri",
                  className:
                    "w-12 h-12 rounded-xl object-cover ring-2 ring-pink-500/40 shadow-md",
                }),
                e.jsxs("div", {
                  children: [
                    e.jsx("div", {
                      className:
                        "text-xs text-pink-700 dark:text-pink-300 font-semibold uppercase tracking-wider",
                      children: "Kart Gelirleri",
                    }),
                    e.jsx("div", {
                      className:
                        "text-2xl font-bold text-pink-700 dark:text-pink-400 mt-0.5",
                      children: formatMoneyShort(rev.card_revenue || 0),
                    }),
                    e.jsxs("div", {
                      className: "text-[11px] text-surface-600 dark:text-zinc-400 mt-0.5",
                      children: [
                        "%",
                        cardPct,
                        " pay • ",
                        rev.card_count || 0,
                        " işlem",
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),

          // KPI 3: Nakit Gelirler
          e.jsx("div", {
            className:
              "rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 p-5",
            children: e.jsxs("div", {
              className: "flex items-center gap-3.5",
              children: [
                e.jsx("img", {
                  src: "/images/emojis/thumbsup.png",
                  alt: "Nakit Gelirler",
                  className:
                    "w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/40 shadow-md",
                }),
                e.jsxs("div", {
                  children: [
                    e.jsx("div", {
                      className:
                        "text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wider",
                      children: "Nakit Gelirler",
                    }),
                    e.jsx("div", {
                      className:
                        "text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5",
                      children: formatMoneyShort(rev.cash_revenue || 0),
                    }),
                    e.jsxs("div", {
                      className: "text-[11px] text-surface-600 dark:text-zinc-400 mt-0.5",
                      children: [
                        "%",
                        cashPct,
                        " pay • ",
                        rev.cash_count || 0,
                        " işlem",
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),

          // KPI 4: Açık Masalardaki Bekleyen Ciro
          e.jsx("div", {
            className:
              "rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 p-5",
            children: e.jsxs("div", {
              className: "flex items-center gap-3.5",
              children: [
                e.jsx("img", {
                  src: "/images/emojis/fire.png",
                  alt: "Açık Masalar",
                  className:
                    "w-12 h-12 rounded-xl object-cover ring-2 ring-amber-500/40 shadow-md",
                }),
                e.jsxs("div", {
                  children: [
                    e.jsx("div", {
                      className:
                        "text-xs text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider",
                      children: "Açık Masa Cirosu",
                    }),
                    e.jsx("div", {
                      className:
                        "text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5",
                      children: formatMoneyShort(rev.open_revenue || 0),
                    }),
                    e.jsxs("div", {
                      className: "text-[11px] text-surface-600 dark:text-zinc-400 mt-0.5",
                      children: [
                        rev.open_count || 0,
                        " aktif açık adisyon",
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),

      // ÜST İKİLİ BÖLÜM: 1) GELİRLER DAİRE GRAFİK KARTI + 2) GARSON MASA PERFORMANS KARTI
      e.jsxs("div", {
        className: "grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8",
        children: [
          // ==================== KART 1: GELİRLER KARTI (NAKİT & KART DAİRE GRAFİK) ====================
          e.jsxs("div", {
            className:
              "xl:col-span-5 rounded-3xl bg-white dark:bg-dark-card border border-surface-200 dark:border-dark-border p-6 flex flex-col justify-between shadow-xl",
            children: [
              e.jsxs("div", {
                children: [
                  e.jsxs("div", {
                    className: "flex items-center justify-between mb-6",
                    children: [
                      e.jsxs("div", {
                        className: "flex items-center gap-3",
                        children: [
                          e.jsx("img", {
                            src: "/images/emojis/treasure.png",
                            alt: "Gelirler",
                            className:
                              "w-11 h-11 rounded-xl object-cover ring-2 ring-purple-500/40",
                          }),
                          e.jsxs("div", {
                            children: [
                              e.jsx("h2", {
                                className:
                                  "text-lg font-bold text-surface-900 dark:text-white",
                                children: "Gelirler Dağılımı",
                              }),
                              e.jsx("p", {
                                className: "text-xs text-surface-500 dark:text-zinc-400",
                                children: "Nakit Gelirler ve Kart Gelirleri Daire Grafiği",
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsx("span", {
                        className:
                          "px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30",
                        children: "Canlı Grafik",
                      }),
                    ],
                  }),

                  // SVG DAİRE (DONUT) GRAFİK
                  e.jsxs("div", {
                    className: "relative flex items-center justify-center my-4",
                    children: [
                      e.jsxs("svg", {
                        width: "230",
                        height: "230",
                        viewBox: "0 0 220 220",
                        className: "transform -rotate-90 drop-shadow-xl text-slate-200 dark:text-zinc-800",
                        children: [
                          e.jsxs("defs", {
                            children: [
                              e.jsxs("linearGradient", {
                                id: "cardGrad",
                                x1: "0%",
                                y1: "0%",
                                x2: "100%",
                                y2: "100%",
                                children: [
                                  e.jsx("stop", { offset: "0%", stopColor: "#9333ea" }),
                                  e.jsx("stop", { offset: "100%", stopColor: "#ec4899" }),
                                ],
                              }),
                              e.jsxs("linearGradient", {
                                id: "cashGrad",
                                x1: "0%",
                                y1: "0%",
                                x2: "100%",
                                y2: "100%",
                                children: [
                                  e.jsx("stop", { offset: "0%", stopColor: "#059669" }),
                                  e.jsx("stop", { offset: "100%", stopColor: "#34d399" }),
                                ],
                              }),
                            ],
                          }),
                          // Arka Plan Halka
                          e.jsx("circle", {
                            cx: "110",
                            cy: "110",
                            r: radius,
                            fill: "transparent",
                            stroke: "currentColor",
                            strokeWidth: "24",
                          }),
                          // Kart Gelirleri Dilimi
                          cardArc > 0 &&
                            e.jsx("circle", {
                              cx: "110",
                              cy: "110",
                              r: radius,
                              fill: "transparent",
                              stroke: "url(#cardGrad)",
                              strokeWidth: hoveredSlice === "card" ? "28" : "24",
                              strokeDasharray: `${cardArc} ${circumference}`,
                              strokeDashoffset: "0",
                              strokeLinecap: "round",
                              className: "transition-all duration-500 cursor-pointer",
                              onMouseEnter: () => setHoveredSlice("card"),
                              onMouseLeave: () => setHoveredSlice(null),
                            }),
                          // Nakit Gelirler Dilimi
                          cashArc > 0 &&
                            e.jsx("circle", {
                              cx: "110",
                              cy: "110",
                              r: radius,
                              fill: "transparent",
                              stroke: "url(#cashGrad)",
                              strokeWidth: hoveredSlice === "cash" ? "28" : "24",
                              strokeDasharray: `${cashArc} ${circumference}`,
                              strokeDashoffset: `${-cardArc}`,
                              strokeLinecap: "round",
                              className: "transition-all duration-500 cursor-pointer",
                              onMouseEnter: () => setHoveredSlice("cash"),
                              onMouseLeave: () => setHoveredSlice(null),
                            }),
                        ],
                      }),

                      // Daire Ortası Bilgi Alanı
                      e.jsxs("div", {
                        className:
                          "absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6",
                        children: [
                          e.jsx("span", {
                            className:
                              "text-[11px] font-bold uppercase tracking-widest text-surface-500 dark:text-zinc-400",
                            children:
                              hoveredSlice === "card"
                                ? "💳 KART GELİRİ"
                                : hoveredSlice === "cash"
                                ? "💵 NAKİT GELİR"
                                : "TOPLAM GELİR",
                          }),
                          e.jsx("span", {
                            className:
                              "text-xl font-extrabold text-surface-900 dark:text-white mt-1",
                            children:
                              hoveredSlice === "card"
                                ? formatMoneyShort(rev.card_revenue || 0)
                                : hoveredSlice === "cash"
                                ? formatMoneyShort(rev.cash_revenue || 0)
                                : formatMoneyShort(rev.total_revenue || 0),
                          }),
                          e.jsx("span", {
                            className:
                              "text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5",
                            children:
                              hoveredSlice === "card"
                                ? `%${cardPct} Pay`
                                : hoveredSlice === "cash"
                                ? `%${cashPct} Pay`
                                : `${rev.total_paid_count || 0} Tahsilat`,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // ALT DETAY KUTULARI: KART vs NAKİT
              e.jsxs("div", {
                className: "space-y-3 mt-4",
                children: [
                  // Kart Gelirleri Satırı
                  e.jsxs("div", {
                    onMouseEnter: () => setHoveredSlice("card"),
                    onMouseLeave: () => setHoveredSlice(null),
                    className:
                      "p-4 rounded-2xl bg-surface-50 dark:bg-dark-elevated border border-pink-300 dark:border-pink-500/25 hover:border-pink-500 transition-all cursor-pointer",
                    children: [
                      e.jsxs("div", {
                        className: "flex items-center justify-between mb-2",
                        children: [
                          e.jsxs("div", {
                            className: "flex items-center gap-2.5",
                            children: [
                              e.jsx("span", {
                                className:
                                  "w-3.5 h-3.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm shadow-pink-500/50",
                              }),
                              e.jsx("span", {
                                className:
                                  "text-sm font-bold text-surface-900 dark:text-white",
                                children: "Kredi / Banka Kartı Gelirleri",
                              }),
                            ],
                          }),
                          e.jsxs("span", {
                            className:
                              "text-xs font-bold px-2.5 py-0.5 rounded-lg bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-400",
                            children: ["%", cardPct],
                          }),
                        ],
                      }),
                      e.jsxs("div", {
                        className: "flex items-baseline justify-between",
                        children: [
                          e.jsx("span", {
                            className: "text-lg font-extrabold text-pink-600 dark:text-pink-400",
                            children: formatMoney(rev.card_revenue || 0),
                          }),
                          e.jsxs("span", {
                            className: "text-xs text-surface-500 dark:text-zinc-400",
                            children: [
                              rev.card_count || 0,
                              " doğrudan kart",
                              rev.mixed_count > 0
                                ? ` + ${rev.mixed_count} parçalı`
                                : "",
                            ],
                          }),
                        ],
                      }),
                      e.jsx("div", {
                        className:
                          "w-full h-2 rounded-full bg-surface-200 dark:bg-zinc-800 mt-2.5 overflow-hidden",
                        children: e.jsx("div", {
                          className:
                            "h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500",
                          style: { width: `${Math.max(4, cardPct)}%` },
                        }),
                      }),
                    ],
                  }),

                  // Nakit Gelirler Satırı
                  e.jsxs("div", {
                    onMouseEnter: () => setHoveredSlice("cash"),
                    onMouseLeave: () => setHoveredSlice(null),
                    className:
                      "p-4 rounded-2xl bg-surface-50 dark:bg-dark-elevated border border-emerald-300 dark:border-emerald-500/25 hover:border-emerald-500 transition-all cursor-pointer",
                    children: [
                      e.jsxs("div", {
                        className: "flex items-center justify-between mb-2",
                        children: [
                          e.jsxs("div", {
                            className: "flex items-center gap-2.5",
                            children: [
                              e.jsx("span", {
                                className:
                                  "w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50",
                              }),
                              e.jsx("span", {
                                className:
                                  "text-sm font-bold text-surface-900 dark:text-white",
                                children: "Nakit Gelirler",
                              }),
                            ],
                          }),
                          e.jsxs("span", {
                            className:
                              "text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                            children: ["%", cashPct],
                          }),
                        ],
                      }),
                      e.jsxs("div", {
                        className: "flex items-baseline justify-between",
                        children: [
                          e.jsx("span", {
                            className: "text-lg font-extrabold text-emerald-600 dark:text-emerald-400",
                            children: formatMoney(rev.cash_revenue || 0),
                          }),
                          e.jsxs("span", {
                            className: "text-xs text-surface-500 dark:text-zinc-400",
                            children: [
                              rev.cash_count || 0,
                              " doğrudan nakit",
                              rev.mixed_count > 0
                                ? ` + ${rev.mixed_count} parçalı`
                                : "",
                            ],
                          }),
                        ],
                      }),
                      e.jsx("div", {
                        className:
                          "w-full h-2 rounded-full bg-surface-200 dark:bg-zinc-800 mt-2.5 overflow-hidden",
                        children: e.jsx("div", {
                          className:
                            "h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500",
                          style: { width: `${Math.max(4, cashPct)}%` },
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ==================== KART 3: HANGİ GARSONUN KAÇ MASA İLE İLGİLENDİĞİNİ GÖSTEREN KART ====================
          e.jsxs("div", {
            className:
              "xl:col-span-7 rounded-3xl bg-white dark:bg-dark-card border border-surface-200 dark:border-dark-border p-6 flex flex-col justify-between shadow-xl",
            children: [
              e.jsxs("div", {
                children: [
                  e.jsxs("div", {
                    className:
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6",
                    children: [
                      e.jsxs("div", {
                        className: "flex items-center gap-3",
                        children: [
                          e.jsx("img", {
                            src: "/images/emojis/wave.png",
                            alt: "Garson Performansı",
                            className:
                              "w-11 h-11 rounded-xl object-cover ring-2 ring-purple-500/40",
                          }),
                          e.jsxs("div", {
                            children: [
                              e.jsx("h2", {
                                className:
                                  "text-lg font-bold text-surface-900 dark:text-white",
                                children:
                                  "Garson & Personel Masa İlgilenme Kartı",
                              }),
                              e.jsx("p", {
                                className: "text-xs text-surface-500 dark:text-zinc-400",
                                children:
                                  "Hangi personelin kaç masa ile ilgilendiği, aktif masaları ve ciro katkısı",
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs("span", {
                        className:
                          "px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 self-start sm:self-auto",
                        children: [waiterStats.length, " Aktif Personel"],
                      }),
                    ],
                  }),

                  // Garson Listesi
                  e.jsx("div", {
                    className: "space-y-4",
                    children: waiterStats.map((w, idx) =>
                      e.jsxs(
                        "div",
                        {
                          className:
                            "p-5 rounded-2xl bg-surface-50 dark:bg-dark-elevated border border-surface-200 dark:border-dark-border hover:border-purple-500/40 transition-all",
                          children: [
                            // Üst Satır: Avatar + İsim + Toplam Masa Sayısı Rozeti
                            e.jsxs("div", {
                              className:
                                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4",
                              children: [
                                e.jsxs("div", {
                                  className: "flex items-center gap-3.5",
                                  children: [
                                    e.jsxs("div", {
                                      className: "relative",
                                      children: [
                                        e.jsx("img", {
                                          src:
                                            MASCOT_AVATARS[
                                              idx % MASCOT_AVATARS.length
                                            ],
                                          alt: w.name,
                                          className:
                                            "w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/40 shadow-lg",
                                        }),
                                        e.jsxs("span", {
                                          className:
                                            "absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[11px] font-extrabold flex items-center justify-center shadow",
                                          children: ["#", w.rank],
                                        }),
                                      ],
                                    }),
                                    e.jsxs("div", {
                                      children: [
                                        e.jsxs("div", {
                                          className: "flex items-center gap-2",
                                          children: [
                                            e.jsx("h3", {
                                              className:
                                                "text-base font-bold text-surface-900 dark:text-white",
                                              children: w.name,
                                            }),
                                            e.jsx("span", {
                                              className:
                                                "px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/25",
                                              children: w.role_name,
                                            }),
                                          ],
                                        }),
                                        e.jsxs("p", {
                                          className:
                                            "text-xs text-surface-500 dark:text-zinc-400 mt-0.5",
                                          children: [
                                            w.unique_tables_count,
                                            " farklı masada toplam ",
                                            w.items_added_count,
                                            " ürün servis etti",
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),

                                // Vurgulu Kaç Masa İle İlgilendi Rozeti
                                e.jsxs("div", {
                                  className:
                                    "flex items-center gap-3 self-start sm:self-center",
                                  children: [
                                    e.jsxs("div", {
                                      className:
                                        "px-4 py-2 rounded-2xl bg-purple-100 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-500/35 text-right",
                                      children: [
                                        e.jsxs("div", {
                                          className:
                                            "text-lg font-extrabold text-purple-700 dark:text-purple-300 leading-tight",
                                          children: [
                                            w.total_tables_served,
                                            " Masa",
                                          ],
                                        }),
                                        e.jsx("div", {
                                          className:
                                            "text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400",
                                          children: "İlgilenilen Adisyon",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),

                            // 3'lü Alt Metrik Kutusu
                            e.jsxs("div", {
                              className: "grid grid-cols-3 gap-2.5 mb-3",
                              children: [
                                e.jsxs("div", {
                                  className:
                                    "p-2.5 rounded-xl bg-white dark:bg-black/25 border border-surface-200 dark:border-white/5",
                                  children: [
                                    e.jsx("div", {
                                      className:
                                        "text-[11px] text-surface-500 dark:text-zinc-400",
                                      children: "Şu An Aktif Masa",
                                    }),
                                    e.jsxs("div", {
                                      className:
                                        "text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5",
                                      children: [
                                        w.active_tables_count,
                                        " Açık Masa",
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs("div", {
                                  className:
                                    "p-2.5 rounded-xl bg-white dark:bg-black/25 border border-surface-200 dark:border-white/5",
                                  children: [
                                    e.jsx("div", {
                                      className:
                                        "text-[11px] text-surface-500 dark:text-zinc-400",
                                      children: "Tamamlanan Masa",
                                    }),
                                    e.jsxs("div", {
                                      className:
                                        "text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-0.5",
                                      children: [
                                        w.closed_tables_count,
                                        " Adisyon",
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs("div", {
                                  className:
                                    "p-2.5 rounded-xl bg-white dark:bg-black/25 border border-surface-200 dark:border-white/5",
                                  children: [
                                    e.jsx("div", {
                                      className:
                                        "text-[11px] text-surface-500 dark:text-zinc-400",
                                      children: "Toplam Masa Cirosu",
                                    }),
                                    e.jsx("div", {
                                      className:
                                        "text-sm font-extrabold text-pink-600 dark:text-pink-400 mt-0.5",
                                      children: formatMoneyShort(
                                        w.total_revenue || 0
                                      ),
                                    }),
                                  ],
                                }),
                              ],
                            }),

                            // Şu An İlgilendiği Açık Masaların Etiketleri
                            w.active_tables &&
                              w.active_tables.length > 0 &&
                              e.jsxs("div", {
                                className: "mt-3 pt-3 border-t border-surface-200 dark:border-white/5",
                                children: [
                                  e.jsx("div", {
                                    className:
                                      "text-[11px] font-semibold text-surface-500 dark:text-zinc-400 mb-2",
                                    children:
                                      "🔥 Şu An İlgilendiği Açık Masalar (Adisyona gitmek için tıkla):",
                                  }),
                                  e.jsx("div", {
                                    className: "flex flex-wrap gap-1.5",
                                    children: w.active_tables.map((at) =>
                                      e.jsxs(
                                        Link,
                                        {
                                          href: route("bills.show", at.bill_id),
                                          className:
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-all",
                                          children: [
                                            e.jsx("span", {
                                              className:
                                                "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse",
                                            }),
                                            e.jsx("span", {
                                              children: at.table_name,
                                            }),
                                            e.jsxs("span", {
                                              className:
                                                "text-[10px] text-emerald-600 dark:text-emerald-400/80",
                                              children: [
                                                "(",
                                                formatMoneyShort(at.total),
                                                ")",
                                              ],
                                            }),
                                          ],
                                        },
                                        at.bill_id
                                      )
                                    ),
                                  }),
                                ],
                              }),

                            // İlgilenme Oranı Çubuğu
                            e.jsxs("div", {
                              className: "mt-3",
                              children: [
                                e.jsxs("div", {
                                  className:
                                    "flex justify-between text-[11px] text-surface-500 dark:text-zinc-400 mb-1",
                                  children: [
                                    e.jsx("span", {
                                      children: "Ekip İçi Masa İlgilenme Payı",
                                    }),
                                    e.jsxs("span", {
                                      className: "font-bold text-purple-600 dark:text-purple-400",
                                      children: ["%", w.share_pct],
                                    }),
                                  ],
                                }),
                                e.jsx("div", {
                                  className:
                                    "w-full h-2 rounded-full bg-surface-200 dark:bg-zinc-800 overflow-hidden",
                                  children: e.jsx("div", {
                                    className:
                                      "h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-500",
                                    style: { width: `${w.bar_pct}%` },
                                  }),
                                }),
                              ],
                            }),
                          ],
                        },
                        w.id
                      )
                    ),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // ==================== KART 2: EN YÜKSEK MASALARI SIRALAYACAK KART ====================
      e.jsxs("div", {
        className:
          "rounded-3xl bg-white dark:bg-dark-card border border-surface-200 dark:border-dark-border p-6 shadow-xl",
        children: [
          e.jsxs("div", {
            className:
              "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
            children: [
              e.jsxs("div", {
                className: "flex items-center gap-3.5",
                children: [
                  e.jsx("img", {
                    src: "/images/emojis/king.png",
                    alt: "En Yüksek Masalar",
                    className:
                      "w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-500/50 shadow-lg",
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("h2", {
                        className:
                          "text-xl font-bold text-surface-900 dark:text-white",
                        children: "En Yüksek Ciro Yapan Masalar Sıralaması",
                      }),
                      e.jsx("p", {
                        className: "text-xs text-surface-500 dark:text-zinc-400",
                        children:
                          "Masaların toplam cirosu, açılan adisyon sayısı ve ortalama masa hesabı liderlik tablosu",
                      }),
                    ],
                  }),
                ],
              }),

              topTables.length > 8 &&
                e.jsx("button", {
                  onClick: () => setShowAllTables(!showAllTables),
                  className:
                    "px-4 py-2 rounded-xl text-xs font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 hover:bg-purple-200 dark:hover:bg-purple-500/25 transition-all self-start sm:self-auto",
                  children: showAllTables
                    ? "Sadece İlk 8 Masayı Göster"
                    : `Tüm Masaları Göster (${topTables.length})`,
                }),
            ],
          }),

          e.jsx("div", {
            className:
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
            children: displayedTables.map((t) => {
              const isTop1 = t.rank === 1;
              const isTop2 = t.rank === 2;
              const isTop3 = t.rank === 3;
              const medal = isTop1
                ? "👑 #1"
                : isTop2
                ? "🥈 #2"
                : isTop3
                ? "🥉 #3"
                : `#${t.rank}`;

              return e.jsxs(
                "div",
                {
                  onClick: () => {
                    if (t.active_bill_id) {
                      router.visit(route("bills.show", t.active_bill_id));
                    } else {
                      router.visit(route("dashboard"));
                    }
                  },
                  className: `group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                    isTop1
                      ? "bg-amber-50/70 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/40 shadow-lg shadow-amber-500/10"
                      : isTop2
                      ? "bg-surface-50 dark:bg-dark-elevated border-purple-300 dark:border-purple-500/35"
                      : isTop3
                      ? "bg-surface-50 dark:bg-dark-elevated border-pink-300 dark:border-pink-500/30"
                      : "bg-surface-50 dark:bg-dark-elevated border-surface-200 dark:border-dark-border hover:border-purple-400 dark:hover:border-purple-500/35"
                  }`,
                  children: [
                    // Üst Satır: Sıra Rozeti + Anlık Durum
                    e.jsxs("div", {
                      className: "flex items-center justify-between mb-3",
                      children: [
                        e.jsx("span", {
                          className: `px-3 py-1 rounded-xl text-xs font-extrabold ${
                            isTop1
                              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30"
                              : isTop2
                              ? "bg-purple-100 dark:bg-purple-500/25 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-400/40"
                              : isTop3
                              ? "bg-pink-100 dark:bg-pink-500/25 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-400/40"
                              : "bg-surface-200 dark:bg-white/10 text-surface-700 dark:text-zinc-300"
                          }`,
                          children: medal,
                        }),
                        e.jsx("span", {
                          className: `px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.status === "occupied"
                              ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/35"
                              : t.status === "reserved"
                              ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/35"
                              : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/35"
                          }`,
                          children:
                            t.status === "occupied"
                              ? "Şu An Dolu"
                              : t.status === "reserved"
                              ? "Rezerve"
                              : "Müsait",
                        }),
                      ],
                    }),

                    // Masa Adı ve Bölge
                    e.jsxs("div", {
                      className: "mb-3",
                      children: [
                        e.jsx("h3", {
                          className:
                            "text-lg font-extrabold text-surface-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors",
                          children: t.name,
                        }),
                        e.jsxs("p", {
                          className: "text-xs text-surface-500 dark:text-zinc-400",
                          children: [
                            t.area_name,
                            " • ",
                            t.capacity,
                            " Kişilik",
                          ],
                        }),
                      ],
                    }),

                    // Toplam Ciro & Adisyon Sayısı
                    e.jsxs("div", {
                      className:
                        "p-3 rounded-xl bg-white dark:bg-black/25 border border-surface-200 dark:border-white/5 mb-3",
                      children: [
                        e.jsxs("div", {
                          className: "flex items-baseline justify-between",
                          children: [
                            e.jsx("span", {
                              className:
                                "text-[11px] text-surface-500 dark:text-zinc-400 font-medium",
                              children: "Toplam Ciro",
                            }),
                            e.jsxs("span", {
                              className:
                                "text-[11px] font-bold text-purple-600 dark:text-purple-400",
                              children: ["%", t.share_pct, " pay"],
                            }),
                          ],
                        }),
                        e.jsx("div", {
                          className:
                            "text-xl font-extrabold text-surface-900 dark:text-white mt-0.5",
                          children: formatMoney(t.total_revenue),
                        }),
                        e.jsxs("div", {
                          className:
                            "flex items-center justify-between text-[11px] text-surface-500 dark:text-zinc-400 mt-1.5 pt-1.5 border-t border-surface-100 dark:border-white/5",
                          children: [
                            e.jsxs("span", {
                              children: [t.bill_count, " Adisyon"],
                            }),
                            e.jsxs("span", {
                              children: ["Ort: ", formatMoneyShort(t.avg_bill)],
                            }),
                          ],
                        }),
                      ],
                    }),

                    // Performans Barı
                    e.jsx("div", {
                      className:
                        "w-full h-2 rounded-full bg-surface-200 dark:bg-zinc-800 overflow-hidden",
                      children: e.jsx("div", {
                        className: `h-full rounded-full transition-all duration-500 ${
                          isTop1
                            ? "bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`,
                        style: { width: `${t.bar_pct}%` },
                      }),
                    }),
                  ],
                },
                t.id
              );
            }),
          }),
        ],
      }),
    ],
  });
}
