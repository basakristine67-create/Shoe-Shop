// =========================================================
// STRIDE CO. — Shoe Shop
// =========================================================

// ---------- Product catalog ----------
const PRODUCTS = [
  { id: 1, name: "Trailhead Runner", category: "Running", price: 98, color: "#c1512f", styleNo: "RN-014", sizes: [7,8,9,10,11,12], stock: 14, isNew: false },
  { id: 2, name: "Marathon Pro", category: "Running", price: 124, color: "#3c5b42", styleNo: "RN-027", sizes: [8,9,10,11,12,13], stock: 4, isNew: true },
  { id: 3, name: "Boulevard Low", category: "Casual", price: 76, color: "#4a6fa5", styleNo: "CS-002", sizes: [6,7,8,9,10,11], stock: 22, isNew: false },
  { id: 4, name: "Cloudstep Slip-On", category: "Casual", price: 64, color: "#d9a441", styleNo: "CS-018", sizes: [6,7,8,9,10], stock: 3, isNew: false },
  { id: 5, name: "Court Classic", category: "Basketball", price: 110, color: "#8a3b5e", styleNo: "BB-009", sizes: [8,9,10,11,12,13], stock: 9, isNew: true },
  { id: 6, name: "Rimshot High", category: "Basketball", price: 132, color: "#403627", styleNo: "BB-031", sizes: [9,10,11,12,13], stock: 11, isNew: false },
  { id: 7, name: "Ridge Hiker", category: "Hiking", price: 145, color: "#5c4a32", styleNo: "HK-005", sizes: [7,8,9,10,11,12], stock: 17, isNew: false },
  { id: 8, name: "Alley Cat Skate", category: "Skate", price: 70, color: "#2f6f6a", styleNo: "SK-011", sizes: [7,8,9,10,11], stock: 5, isNew: false }
];

// give each product a small fixed tilt so the tag-wall feels hand-hung, not random on every re-render
PRODUCTS.forEach(p => { p.tilt = (Math.random() * 3 - 1.5).toFixed(2) + 'deg'; });

// ---------- State ----------
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'featured';
const wishlist = new Set();
const selectedSize = {}; // { productId: size }
const cart = {}; // { "id-size": { id, size, qty } }

const FREE_SHIPPING_THRESHOLD = 75;
const PROMO_CODES = { STRIDE10: 0.10, FIRSTLACE: 0.15 };
let appliedPromo = null;

// ---------- Shoe icon ----------
function shoeSVG(color) {
  return `
  <svg viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shoe illustration">
    <path d="M14 88 C14 70, 30 66, 46 62 C60 58, 66 46, 82 40 C100 33, 118 34, 134 40 C150 46, 158 54, 176 56 C192 58, 204 64, 206 78 C207 84, 202 88, 194 88 Z"
          fill="${color}" stroke="#2a241c" stroke-width="3" stroke-linejoin="round"/>
    <rect x="10" y="86" width="200" height="14" rx="7" fill="#2a241c"/>
    <line x1="70" y1="52" x2="92" y2="40" stroke="#2a241c" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="82" y1="58" x2="104" y2="46" stroke="#2a241c" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="94" y1="64" x2="116" y2="52" stroke="#2a241c" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="188" cy="64" r="5" fill="#2a241c"/>
  </svg>`;
}

// ---------- Rendering: product grid ----------
const gridEl = document.getElementById('product-grid');
const emptyStateEl = document.getElementById('empty-state');

function getFilteredProducts() {
  let list = PRODUCTS.filter(p => {
    if (currentCategory === 'favorites') return wishlist.has(p.id);
    const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.styleNo.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  if (currentSort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  else if (currentSort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  else if (currentSort === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  return list;
}

function renderGrid() {
  const list = getFilteredProducts();
  emptyStateEl.hidden = list.length > 0;
  emptyStateEl.textContent = currentCategory === 'favorites' && list.length === 0
    ? 'No favorites tagged yet — tap the ♡ on a pair to save it here.'
    : 'Nothing on this shelf yet — try another lane.';

  gridEl.innerHTML = list.map(p => {
    const isFav = wishlist.has(p.id);
    const chosenSize = selectedSize[p.id];
    const lowStock = p.stock <= 5;
    return `
    <article class="product-card" style="--tilt:${p.tilt}">
      ${p.isNew ? '<div class="ribbon-new">NEW</div>' : ''}
      <button class="wish-btn ${isFav ? 'active' : ''}" data-wish="${p.id}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}" aria-pressed="${isFav}">${isFav ? '♥' : '♡'}</button>
      <div class="product-visual">${shoeSVG(p.color)}</div>
      <div class="product-tag-line"></div>
      <div class="product-category">${p.category}</div>
      <h3 class="product-name">${p.name}</h3>
      <div class="product-style-no">STYLE NO. ${p.styleNo}${lowStock ? ` · <span class="low-stock">ONLY ${p.stock} LEFT</span>` : ''}</div>

      <div class="size-row" role="group" aria-label="Select size for ${p.name}">
        ${p.sizes.map(s => `<button class="size-chip ${chosenSize === s ? 'selected' : ''}" data-size-for="${p.id}" data-size="${s}">${s}</button>`).join('')}
      </div>

      <div class="product-footer">
        <span class="product-price">$${p.price}</span>
        <button class="add-btn" data-id="${p.id}" ${chosenSize ? '' : 'disabled'}>${chosenSize ? 'ADD TO BAG' : 'SELECT SIZE'}</button>
      </div>
    </article>
  `;
  }).join('');

  gridEl.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => addToCart(Number(btn.dataset.id), btn));
  });
  gridEl.querySelectorAll('.wish-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleWishlist(Number(btn.dataset.wish)));
  });
  gridEl.querySelectorAll('.size-chip').forEach(btn => {
    btn.addEventListener('click', () => pickSize(Number(btn.dataset.sizeFor), Number(btn.dataset.size)));
  });
}

function pickSize(productId, size) {
  selectedSize[productId] = size;
  renderGrid();
}

function toggleWishlist(productId) {
  if (wishlist.has(productId)) wishlist.delete(productId);
  else wishlist.add(productId);
  updateWishlistCount();
  renderGrid();
}

function updateWishlistCount() {
  const el = document.getElementById('wish-nav-count');
  if (el) el.textContent = wishlist.size > 0 ? ` (${wishlist.size})` : '';
}

// ---------- Category tabs ----------
document.getElementById('category-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-tab');
  if (!btn) return;
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCategory = btn.dataset.category;
  renderGrid();
});

// ---------- Search & Sort ----------
document.getElementById('search-input').addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderGrid();
});
document.getElementById('sort-select').addEventListener('change', (e) => {
  currentSort = e.target.value;
  renderGrid();
});

// ---------- Cart ----------
const cartCountEl = document.getElementById('cart-count');
const cartToggleEl = document.getElementById('cart-toggle');
const drawerBodyEl = document.getElementById('drawer-body');
const drawerSubtotalEl = document.getElementById('drawer-subtotal');
const drawerTotalEl = document.getElementById('drawer-total');
const drawerDiscountRow = document.getElementById('drawer-discount-row');
const drawerDiscountEl = document.getElementById('drawer-discount');
const shippingBarFill = document.getElementById('shipping-bar-fill');
const shippingNote = document.getElementById('shipping-note');

function cartItemCount() {
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return Object.values(cart).reduce((sum, item) => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function addToCart(id, btnEl) {
  const size = selectedSize[id];
  if (!size) return;
  const key = `${id}-${size}`;
  if (cart[key]) cart[key].qty += 1;
  else cart[key] = { id, size, qty: 1 };

  const product = PRODUCTS.find(p => p.id === id);
  updateCartUI();
  showToast(`ADDED “${product.name.toUpperCase()}” (SIZE ${size}) TO BAG`);
  bumpCartIcon();

  if (btnEl) {
    btnEl.classList.add('added');
    btnEl.textContent = 'ADDED ✓';
    setTimeout(() => {
      btnEl.classList.remove('added');
      btnEl.textContent = 'ADD TO BAG';
    }, 900);
  }
}

function bumpCartIcon() {
  cartToggleEl.classList.remove('bump');
  void cartToggleEl.offsetWidth; // restart animation
  cartToggleEl.classList.add('bump');
}

function changeQty(key, delta) {
  if (!cart[key]) return;
  cart[key].qty += delta;
  if (cart[key].qty <= 0) delete cart[key];
  updateCartUI();
}

function removeFromCart(key) {
  delete cart[key];
  updateCartUI();
}

function applyPromo() {
  const input = document.getElementById('promo-input');
  const code = input.value.trim().toUpperCase();
  const promoMsg = document.getElementById('promo-message');
  if (!code) return;
  if (PROMO_CODES[code]) {
    appliedPromo = code;
    promoMsg.textContent = `✓ CODE "${code}" APPLIED — ${PROMO_CODES[code] * 100}% OFF`;
    promoMsg.classList.add('success');
    showToast('PROMO CODE APPLIED');
  } else {
    appliedPromo = null;
    promoMsg.textContent = `✕ "${code}" ISN'T A VALID CODE`;
    promoMsg.classList.remove('success');
  }
  updateCartUI();
}

function updateCartUI() {
  const count = cartItemCount();
  cartCountEl.textContent = count;

  const entries = Object.entries(cart);
  if (entries.length === 0) {
    drawerBodyEl.innerHTML = `<p class="drawer-empty">Your bag is empty. Go pick a pair off the rack.</p>`;
  } else {
    drawerBodyEl.innerHTML = entries.map(([key, item]) => {
      const p = PRODUCTS.find(pr => pr.id === item.id);
      if (!p) return '';
      return `
        <div class="cart-item">
          <div class="cart-item-visual">${shoeSVG(p.color)}</div>
          <div>
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-price">$${p.price} each · SIZE ${item.size}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" data-action="dec" data-key="${key}" aria-label="Decrease quantity">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" data-action="inc" data-key="${key}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="remove-btn" data-action="remove" data-key="${key}">REMOVE</button>
        </div>
      `;
    }).join('');

    drawerBodyEl.querySelectorAll('[data-action]').forEach(btn => {
      const key = btn.dataset.key;
      const action = btn.dataset.action;
      btn.addEventListener('click', () => {
        if (action === 'inc') changeQty(key, 1);
        else if (action === 'dec') changeQty(key, -1);
        else if (action === 'remove') removeFromCart(key);
      });
    });
  }

  const subtotal = cartSubtotal();
  const discountRate = appliedPromo ? PROMO_CODES[appliedPromo] : 0;
  const discountAmount = subtotal * discountRate;
  const shippingCost = (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) ? 0 : 6.95;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  drawerSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (discountAmount > 0) {
    drawerDiscountRow.hidden = false;
    drawerDiscountEl.textContent = `−$${discountAmount.toFixed(2)}`;
  } else {
    drawerDiscountRow.hidden = true;
  }
  const shippingLabelEl = document.getElementById('drawer-shipping-label');
  shippingLabelEl.textContent = shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`;
  drawerTotalEl.textContent = `$${total.toFixed(2)}`;

  // free shipping progress
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  shippingBarFill.style.width = `${pct}%`;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingNote.textContent = '✓ FREE SHIPPING UNLOCKED';
    shippingNote.classList.add('unlocked');
  } else {
    const remaining = (FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2);
    shippingNote.textContent = `ADD $${remaining} MORE FOR FREE SHIPPING`;
    shippingNote.classList.remove('unlocked');
  }
}

// ---------- Drawer open/close ----------
const drawerEl = document.getElementById('cart-drawer');
const overlayEl = document.getElementById('drawer-overlay');

function openDrawer() {
  drawerEl.classList.add('open');
  overlayEl.classList.add('show');
}
function closeDrawer() {
  drawerEl.classList.remove('open');
  overlayEl.classList.remove('show');
}

cartToggleEl.addEventListener('click', openDrawer);
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
overlayEl.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawerEl.classList.contains('open')) closeDrawer();
});
document.getElementById('promo-apply').addEventListener('click', applyPromo);
document.getElementById('promo-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyPromo();
});

// ---------- Checkout ----------
document.getElementById('checkout-btn').addEventListener('click', () => {
  if (cartItemCount() === 0) {
    showToast('YOUR BAG IS EMPTY');
    return;
  }
  const subtotal = cartSubtotal();
  const discountRate = appliedPromo ? PROMO_CODES[appliedPromo] : 0;
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6.95;
  const total = Math.max(0, subtotal - subtotal * discountRate + shippingCost).toFixed(2);

  drawerBodyEl.innerHTML = `
    <div class="drawer-empty" style="margin-top:50px;">
      <div style="font-family:var(--font-stamp); font-size:2rem; color:var(--forest); letter-spacing:2px;">ORDER STAMPED ✓</div>
      <p style="margin-top:10px;">Thanks for shopping the rack. Your $${total} order is packed and ready for the (imaginary) truck.</p>
    </div>
  `;
  Object.keys(cart).forEach(key => delete cart[key]);
  appliedPromo = null;
  document.getElementById('promo-input').value = '';
  document.getElementById('promo-message').textContent = '';
  cartCountEl.textContent = '0';
  drawerSubtotalEl.textContent = '$0.00';
  drawerTotalEl.textContent = '$0.00';
  drawerDiscountRow.hidden = true;
  document.getElementById('drawer-shipping-label').textContent = 'FREE';
  shippingBarFill.style.width = '0%';
  shippingNote.textContent = `ADD $${FREE_SHIPPING_THRESHOLD.toFixed(2)} MORE FOR FREE SHIPPING`;
  shippingNote.classList.remove('unlocked');
  showToast('ORDER STAMPED — THANK YOU!');
});

// ---------- Toast ----------
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------- Init ----------
document.getElementById('hero-qty-total').textContent = String(PRODUCTS.length).padStart(2, '0');
renderGrid();
updateCartUI();
updateWishlistCount();
