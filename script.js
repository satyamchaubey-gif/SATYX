/* ==========================================================================
   SATYX STREETWEAR - GLOBAL JS STATE & CONTROLLER
   ========================================================================== */

const API_BASE_URL = "http://localhost:8000/api";

// Local Storage Keys
const CART_STORAGE_KEY = "satyx_cart_v1";
const AUTH_TOKEN_KEY = "satyx_auth_token";
const USER_DATA_KEY = "satyx_user_data";

// Application State
let cartState = [];
let currentUser = null;

// Initialize Web App State
document.addEventListener("DOMContentLoaded", () => {
  initCart();
  initAuth();
  initMobileNav();
  updateCartBadge();
  
  // Page specific execution routing
  const pagePath = window.location.pathname;
  if (pagePath.includes("shop.html")) initShopPage();
  if (pagePath.includes("product.html")) initProductPage();
  if (pagePath.includes("cart.html")) renderCartPage();
  if (pagePath.includes("checkout.html")) initCheckoutPage();
  if (pagePath.includes("account.html")) initAccountPage();
  if (pagePath.includes("admin.html")) initAdminPage();
  if (pagePath.includes("drop-001.html")) initDropPage();
  if (pagePath.endsWith("/") || pagePath.includes("index.html")) initHomePage();
});

/* --- UI NOTIFICATIONS --- */

function showNotification(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

/* --- CART ENGINE --- */

function initCart() {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (savedCart) {
    try {
      cartState = JSON.parse(savedCart);
    } catch (e) {
      cartState = [];
    }
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
  updateCartBadge();
}

function addToCart(product, size, quantity = 1) {
  if (!size) {
    showNotification("PLEASE SELECT A SIZE FIRST", "error");
    return;
  }

  const existingIndex = cartState.findIndex(
    item => item.id === product.id && item.size === size
  );

  if (existingIndex > -1) {
    cartState[existingIndex].quantity += quantity;
  } else {
    cartState.push({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.images[0] || "arc-core.jpg",
      size: size,
      quantity: quantity
    });
  }

  saveCart();
  showNotification(`ADDED ${product.name} [${size}] TO CART`);
}

function removeFromCart(productId, size) {
  cartState = cartState.filter(item => !(item.id === productId && item.size === size));
  saveCart();
  renderCartPage();
}

function updateCartQuantity(productId, size, change) {
  const item = cartState.find(item => item.id === productId && item.size === size);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(productId, size);
    } else {
      saveCart();
      renderCartPage();
    }
  }
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge-count");
  if (badge) {
    const totalCount = cartState.reduce((sum, item) => sum + item.quantity, 0);
    badge.innerText = totalCount;
  }
}

/* --- AUTHENTICATION ENGINE --- */

function initAuth() {
  const savedUser = localStorage.getItem(USER_DATA_KEY);
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (e) {
      currentUser = null;
    }
  }
}

function getAuthHeader() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

function logoutUser() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  currentUser = null;
  showNotification("LOGGED OUT SUCCESSFULLY");
  window.location.href = "account.html";
}

/* --- MOBILE NAV TOGGLE --- */

function initMobileNav() {
  const toggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }
}

/* --- RENDERING HELPERS --- */

function createProductCardMarkup(product) {
  return `
    <div class="product-card">
      <div class="product-image-wrap">
        <span class="drop-tag text-mono">${product.collection}</span>
        <a href="product.html?id=${product.id}">
          <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
        </a>
      </div>
      <div class="product-details">
        <h3 class="product-title">${product.name}</h3>
        <div class="product-price-row">
          <span class="price-current">₹${product.price}</span>
          ${product.mrp ? `<span class="price-mrp">₹${product.mrp}</span>` : ''}
        </div>
        <a href="product.html?id=${product.id}" class="btn btn-outline btn-full" style="margin-top:1rem;">VIEW ITEM</a>
      </div>
    </div>
  `;
}

/* --- PAGE IMPLEMENTATIONS --- */

async function initHomePage() {
  const grid = document.getElementById("featured-products-grid");
  if (!grid) return;
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    const products = await res.json();
    grid.innerHTML = products.slice(0, 3).map(createProductCardMarkup).join("");
  } catch (err) {
    grid.innerHTML = `<p class="text-mono">FAILED TO LOAD DROP ITEMS.</p>`;
  }
}

async function initShopPage() {
  const grid = document.getElementById("shop-products-grid");
  if (!grid) return;
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    const products = await res.json();
    grid.innerHTML = products.map(createProductCardMarkup).join("");
  } catch (err) {
    grid.innerHTML = `<p class="text-mono">UNABLE TO REACH SATYX SERVERS.</p>`;
  }
}

async function initDropPage() {
  const grid = document.getElementById("drop-products-grid");
  if (!grid) return;
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    const products = await res.json();
    const dropItems = products.filter(p => p.collection === "Drop 001");
    grid.innerHTML = dropItems.map(createProductCardMarkup).join("");
  } catch (err) {
    grid.innerHTML = `<p class="text-mono">UNABLE TO REACH SATYX SERVERS.</p>`;
  }
}

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "arc-core";
  
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!res.ok) throw new Error("Product Not Found");
    const product = await res.json();
    
    document.getElementById("p-name").innerText = product.name;
    document.getElementById("p-price").innerText = `₹${product.price}`;
    document.getElementById("p-mrp").innerText = product.mrp ? `₹${product.mrp}` : "";
    document.getElementById("p-desc").innerText = product.description;
    document.getElementById("p-img").src = product.images[0] || "arc-core.jpg";
    document.getElementById("p-collection").innerText = product.collection;

    const sizeContainer = document.getElementById("size-selector");
    sizeContainer.innerHTML = product.sizes.map(s => 
      `<button class="btn btn-outline size-btn" data-size="${s}">${s}</button>`
    ).join("");

    let selectedSize = null;
    sizeContainer.querySelectorAll(".size-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        sizeContainer.querySelectorAll(".size-btn").forEach(b => b.style.borderColor = "var(--bg-border)");
        e.target.style.borderColor = "var(--text-main)";
        selectedSize = e.target.getAttribute("data-size");
      });
    });

    document.getElementById("add-cart-btn").onclick = () => {
      addToCart(product, selectedSize);
    };

    document.getElementById("buy-now-btn").onclick = () => {
      if(!selectedSize) {
        showNotification("PLEASE SELECT A SIZE FIRST", "error");
        return;
      }
      addToCart(product, selectedSize);
      window.location.href = "checkout.html";
    };

  } catch (e) {
    document.getElementById("product-container").innerHTML = `<p class="text-mono">PRODUCT IDENTIFIER NOT FOUND.</p>`;
  }
}

function renderCartPage() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;

  if (cartState.length === 0) {
    container.innerHTML = `
      <div style="padding: 4rem 0; text-align: center;">
        <p class="text-mono" style="margin-bottom: 2rem;">YOUR CART IS CURRENTLY EMPTY.</p>
        <a href="shop.html" class="btn btn-primary">EXPLORE COLLECTION</a>
      </div>
    `;
    document.getElementById("cart-summary").style.display = "none";
    return;
  }

  document.getElementById("cart-summary").style.display = "block";
  container.innerHTML = cartState.map(item => `
    <div style="display:flex; gap:1.5rem; padding: 1.5rem 0; border-bottom:1px solid var(--bg-border); align-items:center;">
      <img src="${item.image}" style="width:90px; height:110px; object-fit:cover;">
      <div style="flex-grow:1;">
        <h4 style="font-size:1.1rem; text-transform:uppercase;">${item.name}</h4>
        <p class="text-mono" style="color:var(--text-muted); font-size:0.8rem;">SIZE: ${item.size}</p>
        <p style="font-weight:700; margin-top:0.5rem;">₹${item.price}</p>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem; border:1px solid var(--bg-border);">
        <button onclick="updateCartQuantity('${item.id}', '${item.size}', -1)" style="padding:0.5rem 1rem;">-</button>
        <span class="text-mono">${item.quantity}</span>
        <button onclick="updateCartQuantity('${item.id}', '${item.size}', 1)" style="padding:0.5rem 1rem;">+</button>
      </div>
      <button onclick="removeFromCart('${item.id}', '${item.size}')" class="text-mono" style="color:var(--accent-red); margin-left:1rem;">REMOVE</button>
    </div>
  `).join("");

  const subtotal = cartState.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 2000 || subtotal === 0 ? 0 : 150;
  const total = subtotal + shipping;

  document.getElementById("cart-subtotal").innerText = `₹${subtotal}`;
  document.getElementById("cart-shipping").innerText = shipping === 0 ? "FREE" : `₹${shipping}`;
  document.getElementById("cart-total").innerText = `₹${total}`;
}

function initCheckoutPage() {
  if (cartState.length === 0) {
    window.location.href = "cart.html";
    return;
  }

  const subtotal = cartState.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 2000 ? 0 : 150;
  const total = subtotal + shipping;

  document.getElementById("checkout-total").innerText = `₹${total}`;

  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const payload = {
      customer_name: document.getElementById("c-name").value,
      customer_email: document.getElementById("c-email").value,
      customer_mobile: document.getElementById("c-mobile").value,
      shipping_address: document.getElementById("c-address").value,
      city: document.getElementById("c-city").value,
      state: document.getElementById("c-state").value,
      pincode: document.getElementById("c-pincode").value,
      payment_method: document.getElementById("c-payment").value,
      items: cartState.map(i => ({ product_id: i.id, size: i.size, quantity: i.quantity }))
    };

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Order Placement Failed");

      cartState = [];
      saveCart();

      alert(`ORDER PLACED SUCCESSFULLY. ORDER ID: ${data.order_id}`);
      window.location.href = "index.html";

    } catch (err) {
      showNotification(err.message, "error");
    }
  });
}

function initAccountPage() {
  const authSection = document.getElementById("account-auth");
  const dashboardSection = document.getElementById("account-dashboard");

  if (currentUser) {
    authSection.style.display = "none";
    dashboardSection.style.display = "block";
    document.getElementById("user-name-display").innerText = currentUser.name;
    document.getElementById("user-email-display").innerText = currentUser.email;
    document.getElementById("user-mobile-display").innerText = currentUser.mobile;
    loadOrderHistory();
  } else {
    authSection.style.display = "grid";
    dashboardSection.style.display = "none";
  }

  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      currentUser = data.user;
      window.location.reload();
    } catch (err) {
      showNotification(err.message, "error");
    }
  });

  document.getElementById("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("reg-name").value,
      email: document.getElementById("reg-email").value,
      mobile: document.getElementById("reg-mobile").value,
      password: document.getElementById("reg-password").value
    };

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      showNotification("ACCOUNT CREATED. PLEASE LOGIN.");
    } catch (err) {
      showNotification(err.message, "error");
    }
  });
}

async function loadOrderHistory() {
  const container = document.getElementById("orders-history-container");
  try {
    const res = await fetch(`${API_BASE_URL}/orders/my-orders`, {
      headers: getAuthHeader()
    });
    const orders = await res.json();
    
    if (orders.length === 0) {
      container.innerHTML = `<p class="text-mono">NO PRIOR ORDERS FOUND.</p>`;
      return;
    }

    container.innerHTML = orders.map(o => `
      <div style="background-color:var(--bg-surface); border:1px solid var(--bg-border); padding:1.5rem; margin-bottom:1rem;">
        <div style="display:flex; justify-style:space-between; margin-bottom:1rem;" class="text-mono">
          <span>ID: ${o.order_id}</span>
          <span>STATUS: ${o.order_status}</span>
        </div>
        <p>Total: ₹${o.total}</p>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<p class="text-mono">UNABLE TO FETCH ORDER HISTORY.</p>`;
  }
}

async function initAdminPage() {
  const loginView = document.getElementById("admin-login-view");
  const dashboardView = document.getElementById("admin-dashboard-view");
  const token = localStorage.getItem("satyx_admin_token");

  if (token) {
    loginView.style.display = "none";
    dashboardView.style.display = "block";
    loadAdminDashboard(token);
  } else {
    loginView.style.display = "block";
    dashboardView.style.display = "none";
  }

  document.getElementById("admin-login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      localStorage.setItem("satyx_admin_token", data.access_token);
      window.location.reload();
    } catch (err) {
      showNotification(err.message, "error");
    }
  });
}

async function loadAdminDashboard(token) {
  const headers = { "Authorization": `Bearer ${token}` };

  try {
    const [ordersRes, productsRes, customersRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/orders`, { headers }),
      fetch(`${API_BASE_URL}/admin/products`, { headers }),
      fetch(`${API_BASE_URL}/admin/customers`, { headers })
    ]);

    const orders = await ordersRes.json();
    const products = await productsRes.json();
    const customers = await customersRes.json();

    document.getElementById("metric-revenue").innerText = `₹${orders.reduce((sum, o) => sum + o.total, 0)}`;
    document.getElementById("metric-orders").innerText = orders.length;
    document.getElementById("metric-products").innerText = products.length;
    document.getElementById("metric-customers").innerText = customers.length;

  } catch (err) {
    showNotification("SESSION EXPIRED. PLEASE RE-AUTHENTICATE.", "error");
    localStorage.removeItem("satyx_admin_token");
    window.location.reload();
  }
}
