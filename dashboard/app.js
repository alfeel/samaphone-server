const root = document.getElementById("app");
const toast = document.getElementById("toast");
const ASSET_BASE =
  window.location.protocol === "file:" ? "../assets" : "/assets";

const ICONS = {
  headphones: "🎧",
  monitor: "💻",
  package: "📦",
  smartphone: "📱",
  star: "✦",
  sun: "☀️",
  tool: "🛠️",
  tv: "🖥️",
  zap: "⚡",
};

const WORK_TYPE_CONFIG = {
  maintenance: {
    icon: "🛠️",
    label: "صيانة",
    color: "#1B8EF8",
    bg: "#EBF3FE",
  },
  other: {
    icon: "✦",
    label: "أخرى",
    color: "#059669",
    bg: "#D1FAE5",
  },
  programming: {
    icon: "⌘",
    label: "برمجة",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
};

const BANNERS = [
  {
    image: `${ASSET_BASE}/images/banner1.png`,
    eyebrow: "أحدث العروض",
    title: "هواتف وإكسسوارات وخدمة مباشرة على واتساب",
  },
  {
    image: `${ASSET_BASE}/images/banner2.png`,
    eyebrow: "صيانة وبرمجة",
    title: "نماذج أعمال حقيقية في الصيانة والبرمجة والطاقة",
  },
];

const state = {
  activeSubcategory: "",
  categorySearch: "",
  data: null,
  homeSearch: "",
  orders: loadOrders(),
  route: parseRoute(),
};

let toastTimer = null;

document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
window.addEventListener("hashchange", handleHashChange);

bootstrap();

async function bootstrap() {
  if (window.__SAMA_DATA__) {
    state.data = window.__SAMA_DATA__;
    render();
    return;
  }

  try {
    const response = await fetch("/api/data", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.data = await response.json();
    render();
  } catch (error) {
    renderError(
      error instanceof Error
        ? `تعذر تحميل بيانات التطبيق: ${error.message}`
        : "تعذر تحميل بيانات التطبيق.",
    );
  }
}

function handleHashChange() {
  const previous = state.route;
  state.route = parseRoute();

  if (
    previous.page !== "category" ||
    state.route.page !== "category" ||
    previous.id !== state.route.id
  ) {
    state.categorySearch = "";
    state.activeSubcategory = "";
  }

  render();
  window.scrollTo({ top: 0, left: 0 });
}

function handleInput(event) {
  const element = event.target.closest("[data-model]");
  if (!element) return;

  const value = element.value || "";
  if (element.dataset.model === "home-search") {
    state.homeSearch = value;
  }

  if (element.dataset.model === "category-search") {
    state.categorySearch = value;
  }

  render();
}

function handleClick(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;

  const { action } = actionElement.dataset;

  if (action === "set-subcategory") {
    state.activeSubcategory = actionElement.dataset.subcategory || "";
    render();
    return;
  }

  if (action === "open-whatsapp") {
    const productId = actionElement.dataset.productId;
    if (productId) {
      openProductWhatsApp(productId);
    } else {
      openGeneralWhatsApp();
    }
    return;
  }

  if (action === "save-order") {
    const productId = actionElement.dataset.productId;
    if (productId) {
      saveOrder(productId);
    }
    return;
  }

  if (action === "remove-order") {
    removeOrder(actionElement.dataset.orderId || "");
    return;
  }

  if (action === "clear-orders") {
    clearOrders();
  }
}

function render() {
  if (!state.data) {
    return;
  }

  const activeNav = getActiveNavPage(state.route);
  const page = renderCurrentPage();

  document.title = page.title;
  root.innerHTML = `
    <div class="app-shell">
      ${renderTopbar()}
      <main class="page">${page.content}</main>
      ${renderBottomNav(activeNav)}
    </div>
  `;
}

function renderCurrentPage() {
  switch (state.route.page) {
    case "sections":
      return renderSectionsPage();
    case "category":
      return renderCategoryPage(state.route.id);
    case "product":
      return renderProductPage(state.route.id);
    case "work":
      return renderWorkPage();
    case "orders":
      return renderOrdersPage();
    default:
      return renderHomePage();
  }
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="topbar__inner">
        <a class="brand" href="#/">
          <span class="brand__mark">س</span>
          <div>
            <span class="brand__eyebrow">نسخة محلية بدون Expo</span>
            <h1 class="brand__title">سما فون</h1>
          </div>
        </a>
        <div class="topbar__actions">
          <button class="pill-btn" type="button" data-action="open-whatsapp">
            واتساب
          </button>
          <a class="ghost-btn" href="#/orders">
            طلباتي ${state.orders.length ? `(${state.orders.length})` : ""}
          </a>
        </div>
      </div>
    </header>
  `;
}

function renderBottomNav(activePage) {
  const items = [
    { page: "home", label: "الرئيسية", route: "#/" },
    { page: "sections", label: "الأقسام", route: "#/sections" },
    { page: "work", label: "أعمالنا", route: "#/work" },
    { page: "orders", label: "طلباتي", route: "#/orders" },
  ];

  return `
    <nav class="bottom-nav">
      ${items
        .map(
          (item) => `
            <a
              class="bottom-nav__item ${activePage === item.page ? "is-active" : ""}"
              href="${item.route}"
            >
              <span>${item.label}</span>
            </a>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderHomePage() {
  const products = state.data.products || [];
  const searchValue = state.homeSearch.trim();
  const searchResults = searchValue
    ? products.filter((product) => matchesProduct(product, searchValue))
    : [];
  const featured = products.slice(0, 8);
  const workPreview = (state.data.workItems || []).slice(0, 2);

  return {
    title: "سما فون",
    content: `
      <section class="hero">
        <div class="hero__content">
          <p class="hero__eyebrow">محل وجوالات وصيانة وبرمجة</p>
          <h2 class="hero__title">واجهة محلية سريعة تعمل مباشرة من نفس المشروع</h2>
          <p class="hero__text">
            تصفح الأقسام، ابحث داخل المنتجات، افتح تفاصيل أي منتج، واحفظ الطلبات
            محليًا بدون تشغيل Expo أو Metro.
          </p>
          <div class="hero__actions">
            <a class="primary-btn" href="#/sections">استعراض الأقسام</a>
            <button class="outline-btn" type="button" data-action="open-whatsapp">
              تواصل واتساب
            </button>
          </div>
        </div>
      </section>

      <section class="banner-row">
        ${BANNERS.map(renderBannerCard).join("")}
      </section>

      <section class="panel panel--tight">
        <div class="section-head">
          <div>
            <h2>ابحث في المنتجات</h2>
            <p>نفس بيانات المنتجات التجريبية الموجودة داخل التطبيق الأصلي.</p>
          </div>
        </div>
        <label class="search-box">
          <span>🔎</span>
          <input
            type="search"
            placeholder="ابحث باسم المنتج أو المواصفات"
            value="${escapeAttribute(state.homeSearch)}"
            data-model="home-search"
          />
        </label>
      </section>

      ${
        searchValue
          ? `
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>نتائج البحث</h2>
                  <p>${searchResults.length} نتيجة لعبارة "${escapeHtml(searchValue)}"</p>
                </div>
              </div>
              ${
                searchResults.length
                  ? `<div class="product-grid">${searchResults
                      .map(renderProductCard)
                      .join("")}</div>`
                  : renderEmptyState(
                      "🔎",
                      "لا توجد نتائج",
                      "جرّب كلمة أخرى أو افتح الأقسام يدويًا.",
                    )
              }
            </section>
          `
          : `
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>إحصاءات سريعة</h2>
                  <p>لمحة سريعة من البيانات المحلية الحالية.</p>
                </div>
              </div>
              <div class="stats-row">
                <div class="stat">
                  <span class="muted">إجمالي المنتجات</span>
                  <strong>${products.length}</strong>
                </div>
                <div class="stat">
                  <span class="muted">عدد الأقسام</span>
                  <strong>${state.data.categories.length}</strong>
                </div>
                <div class="stat">
                  <span class="muted">نماذج الأعمال</span>
                  <strong>${state.data.workItems.length}</strong>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>الأقسام</h2>
                  <p>انتقل مباشرة إلى أي قسم أو افتح صفحة أعمالنا.</p>
                </div>
                <a class="link-inline" href="#/sections">عرض الكل</a>
              </div>
              <div class="category-grid">
                ${state.data.categories.map(renderCategoryCard).join("")}
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>منتجات مميزة</h2>
                  <p>أول مجموعة من المنتجات كما هي معرفة داخل بيانات التطبيق.</p>
                </div>
              </div>
              <div class="product-grid">
                ${featured.map(renderProductCard).join("")}
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>من أعمالنا</h2>
                  <p>نماذج صيانة وبرمجة معروضة من نفس البيانات المحلية.</p>
                </div>
                <a class="link-inline" href="#/work">عرض الكل</a>
              </div>
              <div class="work-grid">
                ${workPreview.map(renderWorkCard).join("")}
              </div>
            </section>
          `
      }
    `,
  };
}

function renderSectionsPage() {
  return {
    title: "الأقسام | سما فون",
    content: `
      <section class="panel">
        <div class="section-head">
          <div>
            <h1>الأقسام</h1>
            <p>كل قسم يفتح صفحة مستقلة للمنتجات مع بحث محلي وتصفية فرعية.</p>
          </div>
          <a class="link-inline" href="#/">العودة للرئيسية</a>
        </div>
        <div class="category-grid">
          ${state.data.categories.map(renderCategoryCard).join("")}
        </div>
      </section>
    `,
  };
}

function renderCategoryPage(categoryId) {
  const category = getCategoryById(categoryId);
  if (!category) {
    return {
      title: "قسم غير موجود | سما فون",
      content: renderEmptyState(
        "⚠️",
        "القسم غير موجود",
        "القسم المطلوب غير موجود في البيانات الحالية.",
      ),
    };
  }

  const products = getProductsByCategory(category.id, state.activeSubcategory);
  const filtered = state.categorySearch.trim()
    ? products.filter((product) => matchesProduct(product, state.categorySearch.trim()))
    : products;

  return {
    title: `${category.nameAr} | سما فون`,
    content: `
      <section class="panel">
        <div class="section-head">
          <div>
            <h1>${escapeHtml(category.nameAr)}</h1>
            <p>تصفح منتجات القسم وافتح أي منتج للتفاصيل أو الطلب.</p>
          </div>
          <a class="link-inline" href="#/sections">كل الأقسام</a>
        </div>

        <label class="search-box">
          <span>🔎</span>
          <input
            type="search"
            placeholder="ابحث داخل القسم"
            value="${escapeAttribute(state.categorySearch)}"
            data-model="category-search"
          />
        </label>

        ${
          category.hasSubcategories
            ? `
              <div class="chips-row" style="margin-top: 14px;">
                <button
                  class="chip ${state.activeSubcategory ? "" : "is-active"}"
                  type="button"
                  data-action="set-subcategory"
                  data-subcategory=""
                >
                  الكل
                </button>
                ${category.subcategories
                  .map(
                    (subcategory) => `
                      <button
                        class="chip ${state.activeSubcategory === subcategory.id ? "is-active" : ""}"
                        type="button"
                        data-action="set-subcategory"
                        data-subcategory="${escapeAttribute(subcategory.id)}"
                      >
                        ${escapeHtml(subcategory.nameAr)}
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            `
            : ""
        }
      </section>

      <section class="panel">
        <div class="section-head">
          <div>
            <h2>المنتجات</h2>
            <p>${filtered.length} منتج متاح حاليًا.</p>
          </div>
        </div>
        ${
          filtered.length
            ? `<div class="product-grid">${filtered.map(renderProductCard).join("")}</div>`
            : renderEmptyState(
                "📦",
                "لا توجد منتجات",
                state.categorySearch.trim()
                  ? "لا توجد نتائج مطابقة لعبارة البحث داخل هذا القسم."
                  : "لم يتم تعريف منتجات لهذا القسم في البيانات الحالية.",
              )
        }
      </section>
    `,
  };
}

function renderProductPage(productId) {
  const product = getProductById(productId);
  if (!product) {
    return {
      title: "منتج غير موجود | سما فون",
      content: renderEmptyState(
        "⚠️",
        "المنتج غير موجود",
        "المنتج المطلوب غير موجود في البيانات الحالية.",
      ),
    };
  }

  const category = getCategoryById(product.categoryId);
  const specs = splitSpecs(product.specs);

  return {
    title: `${product.nameAr} | سما فون`,
    content: `
      <section class="panel">
        <div class="section-head">
          <div>
            <h1>تفاصيل المنتج</h1>
            <p>صفحة محلية بديلة تعرض تفاصيل المنتج والطلب بدون Expo.</p>
          </div>
          <a class="link-inline" href="#/category/${encodeURIComponent(product.categoryId)}">
            العودة للقسم
          </a>
        </div>

        <div class="product-hero">
          <div class="product-hero__visual">
            ${renderVisual(product, category, true)}
          </div>
          <div class="product-hero__info">
            ${
              category
                ? `
                  <span
                    class="tag"
                    style="color:${category.color}; background:${category.bgColor};"
                  >
                    ${renderEmoji(category.icon)} ${escapeHtml(category.nameAr)}
                  </span>
                `
                : ""
            }
            <h2 style="margin:0;">${escapeHtml(product.nameAr)}</h2>
            <div class="price">${formatPrice(product.price)} ر.ي</div>
            <div
              class="stock-badge"
              style="
                color:${product.inStock ? "#059669" : "#b42318"};
                background:${product.inStock ? "#D1FAE5" : "#FEE2E2"};
              "
            >
              <span>${product.inStock ? "✓" : "×"}</span>
              <span>${product.inStock ? "متوفر في المخزون" : "غير متوفر"}</span>
            </div>
            <p class="muted" style="line-height:1.9; margin:0;">
              ${escapeHtml(product.descriptionAr)}
            </p>
            <div class="detail-actions">
              <button
                class="action-btn action-btn--primary"
                type="button"
                data-action="open-whatsapp"
                data-product-id="${escapeAttribute(product.id)}"
              >
                واتساب
              </button>
              <button
                class="action-btn action-btn--secondary"
                type="button"
                data-action="save-order"
                data-product-id="${escapeAttribute(product.id)}"
              >
                حفظ للطلب
              </button>
            </div>
          </div>
        </div>
      </section>

      ${
        specs.length
          ? `
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>المواصفات</h2>
                  <p>تفاصيل إضافية مقسمة كما هي معرفة داخل البيانات.</p>
                </div>
              </div>
              <div class="spec-list">
                ${specs
                  .map(
                    (spec) => `
                      <div class="spec-item">
                        <span>✓</span>
                        <span>${escapeHtml(spec)}</span>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
    `,
  };
}

function renderWorkPage() {
  return {
    title: "أعمالنا | سما فون",
    content: `
      <section class="panel">
        <div class="section-head">
          <div>
            <h1>أعمالنا</h1>
            <p>نماذج أعمال الصيانة والبرمجة المعروضة من نفس البيانات المحلية.</p>
          </div>
          <a class="link-inline" href="#/">العودة للرئيسية</a>
        </div>
        ${
          state.data.workItems.length
            ? `<div class="work-grid">${state.data.workItems.map(renderWorkCard).join("")}</div>`
            : renderEmptyState(
                "🖼️",
                "لا توجد أعمال",
                "سيتم عرض الأعمال هنا عند توفرها في البيانات.",
              )
        }
      </section>
    `,
  };
}

function renderOrdersPage() {
  const total = state.orders.reduce((sum, order) => sum + Number(order.price || 0), 0);

  return {
    title: "طلباتي | سما فون",
    content: `
      <section class="panel">
        <div class="section-head">
          <div>
            <h1>طلباتي المحلية</h1>
            <p>هذه قائمة محلية بسيطة محفوظة في المتصفح كبديل لصفحة الطلبات الأصلية.</p>
          </div>
          ${
            state.orders.length
              ? `
                <button class="ghost-btn" type="button" data-action="clear-orders">
                  مسح الكل
                </button>
              `
              : ""
          }
        </div>

        <div class="order-summary">
          <div class="summary-card">
            <span class="muted">عدد الطلبات</span>
            <div class="price">${state.orders.length}</div>
          </div>
          <div class="summary-card">
            <span class="muted">إجمالي تقريبي</span>
            <div class="price">${formatPrice(total)} ر.ي</div>
          </div>
        </div>
      </section>

      <section class="panel">
        ${
          state.orders.length
            ? state.orders.map(renderOrderCard).join("")
            : renderEmptyState(
                "🛍️",
                "لا توجد طلبات محفوظة",
                "افتح أي منتج ثم اضغط حفظ للطلب لإضافته هنا.",
              )
        }
      </section>
    `,
  };
}

function renderBannerCard(banner) {
  return `
    <article class="banner-card">
      <img src="${banner.image}" alt="${escapeAttribute(banner.title)}" />
      <div class="banner-card__content">
        <span class="banner-card__eyebrow">${escapeHtml(banner.eyebrow)}</span>
        <strong>${escapeHtml(banner.title)}</strong>
      </div>
    </article>
  `;
}

function renderCategoryCard(category) {
  const count =
    category.id === "our-work"
      ? state.data.workItems.length
      : state.data.products.filter((product) => product.categoryId === category.id).length;
  const route = category.id === "our-work" ? "#/work" : `#/category/${encodeURIComponent(category.id)}`;

  return `
    <a
      class="category-card"
      href="${route}"
      style="background: linear-gradient(180deg, ${category.bgColor}, #ffffff);"
    >
      <div class="category-card__icon" style="background:${category.color}; color:#ffffff;">
        ${renderEmoji(category.icon)}
      </div>
      <div>
        <h3 style="margin:0 0 6px;">${escapeHtml(category.nameAr)}</h3>
        <div class="category-card__count">${count} عنصر</div>
      </div>
    </a>
  `;
}

function renderProductCard(product) {
  const category = getCategoryById(product.categoryId);

  return `
    <article class="product-card">
      <a class="product-card__top" href="#/product/${encodeURIComponent(product.id)}">
        <div class="product-card__visual">
          ${renderVisual(product, category, false)}
        </div>
        <div>
          <h3 class="product-card__title">${escapeHtml(product.nameAr)}</h3>
          ${
            product.specs
              ? `<p class="muted" style="margin:8px 0 0;">${escapeHtml(product.specs)}</p>`
              : ""
          }
        </div>
      </a>
      <div class="price">${formatPrice(product.price)} ر.ي</div>
      <div class="product-card__actions">
        <button
          class="action-btn action-btn--primary"
          type="button"
          data-action="open-whatsapp"
          data-product-id="${escapeAttribute(product.id)}"
        >
          واتساب
        </button>
        <button
          class="action-btn action-btn--secondary"
          type="button"
          data-action="save-order"
          data-product-id="${escapeAttribute(product.id)}"
        >
          طلب
        </button>
      </div>
    </article>
  `;
}

function renderWorkCard(item) {
  const config = WORK_TYPE_CONFIG[item.type] || WORK_TYPE_CONFIG.other;

  return `
    <article class="work-card">
      <div class="work-card__visual">
        ${renderWorkVisual(item, config)}
      </div>
      <div class="work-card__meta">
        <span class="tag" style="color:${config.color}; background:${config.bg};">
          ${config.icon} ${config.label}
        </span>
        <span class="tag" style="color:#44506a; background:#eef3fb;">
          ${formatDate(item.date)}
        </span>
      </div>
      <div>
        <h3 class="work-card__title">${escapeHtml(item.titleAr)}</h3>
        <p class="muted" style="margin:8px 0 0; line-height:1.9;">
          ${escapeHtml(item.descriptionAr)}
        </p>
      </div>
    </article>
  `;
}

function renderOrderCard(order) {
  return `
    <article class="order-card">
      <div>
        <h3 class="order-card__title">${escapeHtml(order.productName)}</h3>
        <p class="muted" style="margin:6px 0 0;">
          ${formatDate(order.createdAt)}
        </p>
      </div>
      <div class="price">${formatPrice(order.price)} ر.ي</div>
      <div class="order-card__actions">
        <a class="action-btn action-btn--secondary" href="#/product/${encodeURIComponent(order.productId)}">
          فتح المنتج
        </a>
        <button
          class="action-btn"
          type="button"
          data-action="remove-order"
          data-order-id="${escapeAttribute(order.id)}"
        >
          حذف
        </button>
      </div>
    </article>
  `;
}

function renderVisual(product, category, large) {
  if (canUseImage(product.imageUri)) {
    return `<img src="${escapeAttribute(product.imageUri)}" alt="${escapeAttribute(product.nameAr)}" />`;
  }

  const color = category?.color || "#7a879d";
  const bg = category?.bgColor || "#edf2f8";
  const name = category?.nameAr || "منتج";

  return `
    <div class="visual-badge" style="background:${bg}; color:${color};">
      ${renderEmoji(category?.icon || "package")}
    </div>
    <strong style="margin-top:14px;">${large ? escapeHtml(product.nameAr) : escapeHtml(name)}</strong>
  `;
}

function renderWorkVisual(item, config) {
  if (canUseImage(item.imageUri)) {
    return `<img src="${escapeAttribute(item.imageUri)}" alt="${escapeAttribute(item.titleAr)}" />`;
  }

  return `
    <div class="visual-badge" style="background:${config.bg}; color:${config.color};">
      ${config.icon}
    </div>
    <strong style="margin-top:14px;">${escapeHtml(config.label)}</strong>
  `;
}

function renderEmptyState(icon, title, text) {
  return `
    <div class="empty-state panel">
      <div class="empty-state__icon">${icon}</div>
      <h3 style="margin:0;">${escapeHtml(title)}</h3>
      <p class="muted" style="margin:0; max-width:420px; line-height:1.9;">
        ${escapeHtml(text)}
      </p>
    </div>
  `;
}

function parseRoute() {
  const hash = (window.location.hash || "#/").slice(1);
  const parts = hash
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

  if (!parts.length) {
    return { page: "home" };
  }

  if (parts[0] === "sections") return { page: "sections" };
  if (parts[0] === "work") return { page: "work" };
  if (parts[0] === "orders") return { page: "orders" };
  if (parts[0] === "category" && parts[1]) {
    return { page: "category", id: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === "product" && parts[1]) {
    return { page: "product", id: decodeURIComponent(parts[1]) };
  }

  return { page: "home" };
}

function getActiveNavPage(route) {
  if (route.page === "category" || route.page === "product") {
    return "sections";
  }

  return route.page === "home" ? "home" : route.page;
}

function getCategoryById(categoryId) {
  return (state.data?.categories || []).find((category) => category.id === categoryId) || null;
}

function getProductById(productId) {
  return (state.data?.products || []).find((product) => product.id === productId) || null;
}

function getProductsByCategory(categoryId, subcategoryId) {
  return (state.data?.products || []).filter((product) => {
    if (product.categoryId !== categoryId) return false;
    if (subcategoryId) return product.subcategoryId === subcategoryId;
    return true;
  });
}

function matchesProduct(product, query) {
  const normalized = query.toLowerCase();
  return [product.nameAr, product.descriptionAr, product.specs || ""].some((value) =>
    String(value).toLowerCase().includes(normalized),
  );
}

function splitSpecs(specs) {
  return specs
    ? specs
        .split("|")
        .map((spec) => spec.trim())
        .filter(Boolean)
    : [];
}

function renderEmoji(iconKey) {
  return ICONS[iconKey] || "◻";
}

function canUseImage(imageUri) {
  return Boolean(
    imageUri &&
      (imageUri.startsWith("http://") ||
        imageUri.startsWith("https://") ||
        imageUri.startsWith("data:") ||
        imageUri.startsWith("/assets/") ||
        imageUri.startsWith("../assets/")),
  );
}

function openGeneralWhatsApp() {
  if (!state.data?.whatsappNumber) return;
  window.open(`https://wa.me/${state.data.whatsappNumber}`, "_blank", "noopener");
}

function openProductWhatsApp(productId) {
  const product = getProductById(productId);
  if (!product || !state.data?.whatsappNumber) return;

  const specs = splitSpecs(product.specs).join(" | ");
  const message = [
    "مرحبًا، أريد الاستفسار عن المنتج التالي:",
    product.nameAr,
    `السعر: ${formatPrice(product.price)} ر.ي`,
    specs ? `المواصفات: ${specs}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  window.open(
    `https://wa.me/${state.data.whatsappNumber}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener",
  );
}

function saveOrder(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const order = {
    createdAt: new Date().toISOString(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    price: product.price,
    productId: product.id,
    productName: product.nameAr,
  };

  state.orders = [order, ...state.orders];
  persistOrders();
  showToast("تم حفظ الطلب محليًا");
  window.location.hash = "#/orders";
}

function removeOrder(orderId) {
  state.orders = state.orders.filter((order) => order.id !== orderId);
  persistOrders();
  showToast("تم حذف الطلب");
  render();
}

function clearOrders() {
  state.orders = [];
  persistOrders();
  showToast("تم مسح الطلبات");
  render();
}

function loadOrders() {
  try {
    const raw = localStorage.getItem("sama_plain_orders");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistOrders() {
  localStorage.setItem("sama_plain_orders", JSON.stringify(state.orders));
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");

  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function renderError(message) {
  root.innerHTML = `
    <div class="loading-screen">
      <div class="loading-screen__mark">!</div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function formatPrice(value) {
  return new Intl.NumberFormat("ar-YE").format(Number(value || 0));
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("ar-YE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
