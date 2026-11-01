import { e as usePage, f as useTheme, a as React, j as e, L as Link } from "./app-tgt1EkC5.js";

function AppLayout({ children, title }) {
  const page = usePage();
  const { auth, flash } = page.props;
  const user = auth?.user;
  const { toggleTheme, isDark } = useTheme();

  // Bottom dock open/collapsed state (persisted in localStorage)
  const [dockOpen, setDockOpen] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tilki_dock_open") !== "false";
    }
    return true;
  });

  // More / Management popover state
  const [moreOpen, setMoreOpen] = React.useState(false);

  // Flash message toast state
  const [showFlash, setShowFlash] = React.useState(false);

  // Blur transition trigger key on route change
  const [transitionKey, setTransitionKey] = React.useState(0);
  const [blurVeil, setBlurVeil] = React.useState(false);

  React.useEffect(() => {
    setMoreOpen(false);
    setTransitionKey((k) => k + 1);
    setBlurVeil(true);
    const t = setTimeout(() => setBlurVeil(false), 460);
    return () => clearTimeout(t);
  }, [page.url, title]);

  React.useEffect(() => {
    if (flash?.success || flash?.error) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const toggleDock = (val) => {
    const next = typeof val === "boolean" ? val : !dockOpen;
    setDockOpen(next);
    if (!next) setMoreOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("tilki_dock_open", String(next));
    }
  };

  // Primary Bottom Dock Links
  const primaryLinks = [
    {
      name: "Ana Sayfa",
      href: route("home"),
      emoji: "/images/emojis/king.png",
      show: true,
      active: route().current("home") || page.url?.startsWith("/anasayfa"),
    },
    {
      name: "Masalar",
      href: route("dashboard"),
      emoji: "/images/emojis/fire.png",
      show: true,
      active: route().current("dashboard"),
    },
    {
      name: "Adisyonlar",
      href: route("bills.index"),
      emoji: "/images/emojis/coffee.png",
      show: true,
      active: route().current("bills.index") || route().current("bills.show"),
    },
    {
      name: "Arşiv",
      href: route("bills.archive"),
      emoji: "/images/emojis/box.png",
      show: true,
      active: route().current("bills.archive"),
    },
    {
      name: "Mutfak",
      href: route("kitchen.index"),
      emoji: "/images/emojis/chef.png",
      show: true,
      active: route().current("kitchen.*"),
    },
    {
      name: "Raporlar",
      href: route("reports.index"),
      emoji: "/images/emojis/treasure.png",
      show: !!user?.can?.view_reports,
      active: route().current("reports.*"),
    },
  ].filter((item) => item.show);

  // Secondary / Management Links in the Popover Drawer
  const moreLinks = [
    {
      name: "Ürünler",
      desc: "Menü & stok yönetimi",
      href: route("products.index"),
      emoji: "/images/emojis/drink.png",
      show: !!user?.can?.manage_products,
      active: route().current("products.*"),
    },
    {
      name: "Kategoriler",
      desc: "Ürün grupları",
      href: route("categories.index"),
      emoji: "/images/emojis/star.png",
      show: !!user?.can?.manage_products,
      active: route().current("categories.*"),
    },
    {
      name: "Masa Yönetimi",
      desc: "Masa ekle & düzenle",
      href: route("tables.index"),
      emoji: "/images/emojis/thumbsup.png",
      show: !!user?.can?.manage_tables,
      active: route().current("tables.*"),
    },
    {
      name: "Bölgeler",
      desc: "Salon, bahçe & teras",
      href: route("areas.index"),
      emoji: "/images/emojis/astro.png",
      show: !!user?.can?.manage_tables,
      active: route().current("areas.*"),
    },
    {
      name: "Personeller",
      desc: "Yetki & kullanıcılar",
      href: route("users.index"),
      emoji: "/images/emojis/hero.png",
      show: !!user?.can?.manage_users,
      active: route().current("users.*"),
    },
    {
      name: "Giderler",
      desc: "Maliyet & gider takibi",
      href: route("expenses.index"),
      emoji: "/images/emojis/lightning.png",
      show: !!user?.can?.manage_expenses,
      active:
        route().current("expenses.*") || route().current("expense-categories.*"),
    },
    {
      name: "QR Menü Yönetimi",
      desc: "QR kod & dijital menü",
      href: route("qr-management.index"),
      emoji: "/images/emojis/cool.png",
      show: user?.role?.name === "owner",
      active: route().current("qr-management.*"),
    },
    {
      name: "Tanıtım & Hikaye",
      desc: "Tilki Lab Studios vizyonu",
      href: "/tanitim",
      emoji: "/images/emojis/kitsune.png",
      show: true,
      active: false,
    },
    {
      name: "Profil & Ayarlar",
      desc: "Hesap bilgileri",
      href: route("profile.edit"),
      emoji: "/images/emojis/coder.png",
      show: true,
      active: route().current("profile.*"),
    },
  ].filter((item) => item.show);

  const isAnyMoreActive = moreLinks.some((item) => item.active);

  return e.jsxs("div", {
    className: "min-h-screen flex flex-col relative",
    children: [
      // BLUR TRANSITION VEIL OVERLAY
      blurVeil &&
        e.jsx("div", {
          className:
            "fixed inset-0 pointer-events-none z-40 tilki-blur-veil-active",
        }),

      // ==================== TOP HEADER BAR ====================
      e.jsx("header", {
        className: "sticky top-0 z-30 h-16 tilki-top-header",
        children: e.jsxs("div", {
          className:
            "max-w-[1600px] mx-auto h-full px-4 lg:px-8 flex items-center justify-between gap-4",
          children: [
            // Sol: Logo + Marka + Aktif Sayfa Başlığı
            e.jsxs("div", {
              className: "flex items-center gap-3.5",
              children: [
                e.jsxs(Link, {
                  href: route("home"),
                  className: "flex items-center gap-2.5 group",
                  children: [
                    e.jsx("img", {
                      src: "/images/tilki-logo.jpg",
                      alt: "TilkiAdisyon",
                      className:
                        "w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform",
                    }),
                    e.jsxs("div", {
                      className: "hidden sm:block",
                      children: [
                        e.jsx("span", {
                          className:
                            "font-bold text-lg text-surface-900 dark:text-white",
                          children: "Tilki",
                        }),
                        e.jsx("span", {
                          className:
                            "font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent",
                          children: "Adisyon",
                        }),
                      ],
                    }),
                  ],
                }),

                title &&
                  e.jsxs(React.Fragment, {
                    children: [
                      e.jsx("div", {
                        className:
                          "h-5 w-px bg-surface-300 dark:bg-white/15 hidden sm:block",
                      }),
                      e.jsx("h1", {
                        className:
                          "text-base sm:text-lg font-bold text-surface-800 dark:text-zinc-100 truncate",
                        children: title,
                      }),
                    ],
                  }),
              ],
            }),

            // Sağ: Kar Efekti + Açık/Koyu Tema + Kullanıcı + Çıkış
            e.jsxs("div", {
              className: "flex items-center gap-2 sm:gap-2.5",
              children: [
                // Kar Efekti Butonu
                e.jsxs("button", {
                  onClick: () => {
                    window.toggleTilkiSnow && window.toggleTilkiSnow();
                  },
                  title: "Kar Efektini Aç/Kapat",
                  className:
                    "px-3 py-2 rounded-xl text-xs font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 hover:bg-purple-200 dark:hover:bg-purple-500/25 transition-all flex items-center gap-1.5",
                  children: [
                    e.jsx("span", { children: "❄️" }),
                    e.jsx("span", {
                      className: "hidden md:inline",
                      children: "Kar Efekti",
                    }),
                  ],
                }),

                // Açık / Koyu Tema Değiştirme Butonu
                e.jsx("button", {
                  onClick: toggleTheme,
                  title: isDark ? "Açık Temaya Geç" : "Koyu Temaya Geç",
                  className:
                    "p-2.5 rounded-xl bg-surface-100 dark:bg-white/5 hover:bg-surface-200 dark:hover:bg-white/10 border border-surface-200 dark:border-white/10 transition-all",
                  children: isDark
                    ? e.jsx("svg", {
                        className: "w-5 h-5 text-amber-400",
                        fill: "currentColor",
                        viewBox: "0 0 20 20",
                        children: e.jsx("path", {
                          fillRule: "evenodd",
                          d: "M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z",
                          clipRule: "evenodd",
                        }),
                      })
                    : e.jsx("svg", {
                        className: "w-5 h-5 text-purple-700",
                        fill: "currentColor",
                        viewBox: "0 0 20 20",
                        children: e.jsx("path", {
                          d: "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z",
                        }),
                      }),
                }),

                // Kullanıcı Bilgisi & Çıkış
                e.jsxs("div", {
                  className:
                    "flex items-center gap-2 pl-2 border-l border-surface-200 dark:border-white/10",
                  children: [
                    e.jsx("img", {
                      src: "/images/emojis/king.png",
                      alt: user?.name || "Kullanıcı",
                      className:
                        "w-9 h-9 rounded-xl object-cover ring-2 ring-purple-500/40",
                    }),
                    e.jsxs("div", {
                      className: "hidden lg:block leading-tight",
                      children: [
                        e.jsx("div", {
                          className:
                            "text-xs font-bold text-surface-900 dark:text-white",
                          children: user?.name,
                        }),
                        e.jsx("div", {
                          className:
                            "text-[10px] text-surface-500 dark:text-zinc-400",
                          children: user?.role?.display_name,
                        }),
                      ],
                    }),
                    e.jsx(Link, {
                      href: route("logout"),
                      method: "post",
                      as: "button",
                      title: "Çıkış Yap",
                      className:
                        "p-2 rounded-xl text-surface-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors",
                      children: e.jsx("svg", {
                        className: "w-5 h-5",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor",
                        children: e.jsx("path", {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 1.8,
                          d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),

      // ==================== FLASH TOAST NOTIFICATION ====================
      showFlash &&
        (flash?.success || flash?.error) &&
        e.jsx("div", {
          className: "fixed top-20 right-4 z-50 animate-slide-up",
          children: e.jsx("div", {
            className: `px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl ${
              flash?.success
                ? "bg-emerald-500/95 text-white"
                : "bg-red-500/95 text-white"
            }`,
            children: e.jsxs("div", {
              className: "flex items-center gap-3",
              children: [
                e.jsx("span", {
                  className: "font-semibold text-sm",
                  children: flash?.success || flash?.error,
                }),
                e.jsx("button", {
                  onClick: () => setShowFlash(false),
                  className: "ml-2 p-1 hover:bg-white/20 rounded-lg",
                  children: "✕",
                }),
              ],
            }),
          }),
        }),

      // ==================== MAIN CONTENT WITH BLUR TRANSITION ====================
      e.jsx(
        "main",
        {
          className:
            "flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 pb-32 tilki-page-transition",
          children: children,
        },
        transitionKey
      ),

      // ==================== POPOVER DRAWER FOR MANAGEMENT LINKS ====================
      moreOpen &&
        dockOpen &&
        e.jsxs(React.Fragment, {
          children: [
            e.jsx("div", {
              className: "fixed inset-0 z-80 bg-black/30 backdrop-blur-[2px]",
              onClick: () => setMoreOpen(false),
            }),
            e.jsxs("div", {
              className: "tilki-dock-popover",
              children: [
                e.jsxs("div", {
                  className:
                    "flex items-center justify-between mb-4 pb-3 border-b border-surface-200 dark:border-white/10",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center gap-2.5",
                      children: [
                        e.jsx("img", {
                          src: "/images/tilki-logo.jpg",
                          alt: "Menü",
                          className: "w-8 h-8 rounded-lg object-cover",
                        }),
                        e.jsx("span", {
                          className:
                            "font-bold text-sm text-surface-900 dark:text-white",
                          children: "Yönetim & Tüm Modüller",
                        }),
                      ],
                    }),
                    e.jsx("button", {
                      onClick: () => setMoreOpen(false),
                      className:
                        "w-8 h-8 rounded-xl bg-surface-100 dark:bg-white/10 text-surface-600 dark:text-zinc-300 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all text-xs font-bold",
                      children: "✕",
                    }),
                  ],
                }),

                e.jsx("div", {
                  className:
                    "grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto",
                  children: moreLinks.map((item) =>
                    e.jsxs(
                      Link,
                      {
                        href: item.href,
                        onClick: () => setMoreOpen(false),
                        className: `tilki-popover-item ${
                          item.active ? "tilki-popover-item-active" : ""
                        }`,
                        children: [
                          e.jsx("img", {
                            src: item.emoji,
                            alt: item.name,
                            className:
                              "w-11 h-11 rounded-xl object-cover ring-1 ring-purple-500/30 flex-shrink-0",
                          }),
                          e.jsxs("div", {
                            className: "min-w-0",
                            children: [
                              e.jsx("div", {
                                className: "tilki-popover-item-title truncate",
                                children: item.name,
                              }),
                              e.jsx("div", {
                                className: "tilki-popover-item-desc truncate",
                                children: item.desc,
                              }),
                            ],
                          }),
                        ],
                      },
                      item.name
                    )
                  ),
                }),
              ],
            }),
          ],
        }),

      // ==================== BOTTOM FLOATING COLLAPSIBLE NAVBAR ====================
      e.jsx("div", {
        className: "tilki-bottom-dock-wrap",
        children: dockOpen
          ? e.jsxs("nav", {
              className: "tilki-bottom-dock overflow-x-auto max-w-[95vw]",
              children: [
                // Ana Sekmeler
                primaryLinks.map((item) =>
                  e.jsxs(
                    Link,
                    {
                      href: item.href,
                      className: `tilki-dock-link ${
                        item.active
                          ? "tilki-dock-link-active"
                          : "tilki-dock-link-inactive"
                      }`,
                      children: [
                        e.jsx("img", {
                          src: item.emoji,
                          alt: item.name,
                          className:
                            "w-7 h-7 rounded-lg object-cover ring-1 ring-white/20 flex-shrink-0",
                        }),
                        e.jsx("span", {
                          className: "hidden sm:inline",
                          children: item.name,
                        }),
                      ],
                    },
                    item.name
                  )
                ),

                // Ayırıcı Çizgi
                e.jsx("div", {
                  className:
                    "h-7 w-px bg-surface-300 dark:bg-white/15 mx-1 flex-shrink-0",
                }),

                // Yönetim / Diğer Modüller Popover Butonu
                e.jsxs("button", {
                  onClick: () => setMoreOpen(!moreOpen),
                  className: `tilki-dock-link ${
                    moreOpen || isAnyMoreActive
                      ? "tilki-dock-link-active"
                      : "tilki-dock-link-inactive"
                  }`,
                  children: [
                    e.jsx("img", {
                      src: "/images/emojis/mystic.png",
                      alt: "Menü",
                      className:
                        "w-7 h-7 rounded-lg object-cover ring-1 ring-white/20 flex-shrink-0",
                    }),
                    e.jsx("span", {
                      className: "hidden sm:inline",
                      children: "Yönetim",
                    }),
                    e.jsx("span", {
                      className: "text-[10px] opacity-80",
                      children: moreOpen ? "▾" : "▴",
                    }),
                  ],
                }),

                // Navbar'ı Gizle / Küçült Butonu
                e.jsx("button", {
                  onClick: () => toggleDock(false),
                  title: "Alt Barı Gizle",
                  className:
                    "ml-1 p-2.5 rounded-2xl bg-surface-200/70 dark:bg-white/10 text-surface-700 dark:text-zinc-300 hover:bg-purple-500 hover:text-white transition-all flex-shrink-0",
                  children: e.jsx("svg", {
                    className: "w-4 h-4",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    stroke: "currentColor",
                    children: e.jsx("path", {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: 2.2,
                      d: "M19 9l-7 7-7-7",
                    }),
                  }),
                }),
              ],
            })
          : // KAPALI (KÜÇÜLTÜLMÜŞ) NAVBAR ROZETİ
            e.jsxs("button", {
              onClick: () => toggleDock(true),
              title: "Alt Navigasyon Barını Aç",
              className:
                "tilki-bottom-dock px-5 py-2.5 cursor-pointer hover:scale-105 transition-transform flex items-center gap-2.5",
              children: [
                e.jsx("img", {
                  src: "/images/tilki-logo.jpg",
                  alt: "TilkiAdisyon",
                  className:
                    "w-7 h-7 rounded-lg object-cover ring-1 ring-purple-400/50",
                }),
                e.jsx("span", {
                  className:
                    "text-xs font-bold text-surface-900 dark:text-white",
                  children: "Menüyü Aç",
                }),
                e.jsx("svg", {
                  className: "w-4 h-4 text-purple-500 animate-bounce",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  children: e.jsx("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2.2,
                    d: "M5 15l7-7 7 7",
                  }),
                }),
              ],
            }),
      }),
    ],
  });
}

export { AppLayout as A };
