
import { useEffect, useState } from "react";
import "./App.css";

const products = [
  { id: 1, name: "Classic White Sneakers", category: "Shoes", price: 1499, oldPrice: 1999, image: "/images/sneakers.svg", color: "#eef2ff", shop: "Urban Street" },
  { id: 2, name: "Oversized Black T-Shirt", category: "Men", price: 599, oldPrice: 899, image: "/images/tshirt.svg", color: "#f1f1f1", shop: "Style Hub" },
  { id: 3, name: "Women's Casual Dress", category: "Women", price: 1299, oldPrice: 1799, image: "/images/dress.svg", color: "#fff0f5", shop: "Fashion Point" },
  { id: 4, name: "Everyday Backpack", category: "Accessories", price: 899, oldPrice: 1199, image: "/images/backpack.svg", color: "#fff3df", shop: "City Collection" },
  { id: 5, name: "Casual Denim Jacket", category: "Men", price: 1799, oldPrice: 2299, image: "/images/jacket.svg", color: "#eaf5ff", shop: "Urban Street" },
  { id: 6, name: "Women's Handbag", category: "Accessories", price: 999, oldPrice: 1499, image: "/images/handbag.svg", color: "#fff0e7", shop: "Fashion Point" },
  { id: 7, name: "Running Sports Shoes", category: "Shoes", price: 1899, oldPrice: 2499, image: "/images/running-shoes.svg", color: "#edfff4", shop: "Sports Corner" },
  { id: 8, name: "Women's Casual Top", category: "Women", price: 699, oldPrice: 999, image: "/images/top.svg", color: "#f8efff", shop: "Style Hub" },
];

const categories = ["All", "Men", "Women", "Shoes", "Accessories"];

function formatPrice(price) {
  return `₹${price.toLocaleString("en-IN")}`;
}

function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("quickdoor-cart")) || [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [adminOrders, setAdminOrders] = useState([]);
const [adminOrdersLoading, setAdminOrdersLoading] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(() => {
  const savedUser = localStorage.getItem("quickdoor-user");
  return savedUser ? JSON.parse(savedUser) : null;
});
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);

  const [orders, setOrders] = useState(() => {
  try {
    const savedOrders = JSON.parse(
      localStorage.getItem("quickdoor-orders") || "[]"
    );

    return Array.isArray(savedOrders) ? savedOrders : [];
  } catch {
    return [];
  }
});

useEffect(() => {
  if (!loggedInUser?.id) {
    setOrders([]);
    return;
  }

  async function fetchOrders() {
    try {
      const token = localStorage.getItem("quickdoor-token");

const response = await fetch(
  `http://127.0.0.1:5000/api/orders/${loggedInUser.id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      const result = await response.json();

      if (response.ok && result.success) {
        setOrders(result.orders);

        localStorage.setItem(
          "quickdoor-orders",
          JSON.stringify(result.orders)
        );
      } else {
        console.error("Unable to fetch orders:", result.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }

  fetchOrders();
}, [loggedInUser]);
  

const fetchAdminOrders = async () => {
  const token = localStorage.getItem("quickdoor-token");
  console.log("Admin token exists:", !!token);
console.log("Fetching admin orders...");

  if (!token) {
    alert("Please login again.");
    return;
  }

  setAdminOrdersLoading(true);

  try {
    const response = await fetch(
      "http://127.0.0.1:5000/api/admin/orders",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    console.log("Admin API status:", response.status);
console.log("Admin API response:", result);

    if (!response.ok) {
      alert(result.message || "Failed to fetch orders.");
      return;
    }

    setAdminOrders(result.orders || []);
  } catch (error) {
    console.error("Admin orders error:", error);
    alert("Could not connect to the backend.");
  } finally {
    setAdminOrdersLoading(false);
  }
};


  useEffect(() => {
    localStorage.setItem("quickdoor-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") setCartOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      product.name.toLowerCase().includes(searchText) ||
      product.shop.toLowerCase().includes(searchText) ||
      product.category.toLowerCase().includes(searchText);

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Demo delivery policy: free delivery on orders of ₹999 or more.
  const deliveryCharge =
    subtotal === 0 || subtotal >= 999 ? 0 : 49;

  const grandTotal = subtotal + deliveryCharge;

  function addToCart(product) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(productId, change) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

async function placeOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
    if (!loggedInUser?.id) {
    alert("Please login before placing an order.");
    return;
  }

  const orderId = "QD" + Date.now().toString().slice(-6);
  const formData = new FormData(event.currentTarget);

  const newOrder = {
    orderId: orderId,
    userId: loggedInUser?.id,
    status: "Placed",
    items: cart.map((item) => ({ ...item })),
    subtotal: subtotal,
    deliveryCharge: deliveryCharge,
    total: grandTotal,
    date: new Date().toISOString(),
    customer: {
      name: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      pincode: formData.get("pincode"),
    },
  };

    const backendOrder = {
    order_id: newOrder.orderId,
    user_id: loggedInUser.id,
    status: newOrder.status,
    items: newOrder.items,
    subtotal: newOrder.subtotal,
    delivery_charge: newOrder.deliveryCharge,
    total: newOrder.total,
    order_date: newOrder.date,
    customer_name: newOrder.customer.name,
    customer_phone: newOrder.customer.phone,
    customer_address: newOrder.customer.address,
    customer_city: newOrder.customer.city,
    customer_pincode: newOrder.customer.pincode,
  };
  
    let backendResult;

  try {
    const response = await fetch("http://127.0.0.1:5000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendOrder),
    });

    backendResult = await response.json();

    if (!response.ok || !backendResult.success) {
      alert(backendResult.message || "Unable to save order to backend.");
      return;
    }
  } catch (error) {
    alert("Backend connection failed. Please try again.");
    return;
  }


  try {
    const savedOrders = JSON.parse(
      localStorage.getItem("quickdoor-orders") || "[]"
    );

    if (!Array.isArray(savedOrders)) {
      throw new Error("Invalid order history data");
    }

    localStorage.setItem(
      "quickdoor-orders",
      JSON.stringify([newOrder, ...savedOrders])
    );
    setOrders([newOrder, ...savedOrders]);
  } catch (error) {
    alert("Unable to save your order. Please try again.");
    return;
  }

  setCart([]);
  setCheckoutOpen(false);

  alert(`Order placed successfully! Your order ID is ${orderId}`);
}


async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log("Status update function called:", orderId, newStatus);
    const response = await fetch(
      `http://127.0.0.1:5000/api/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const result = await response.json();
    console.log("Response status:", response.status);
console.log("Response data:", result);

    if (!response.ok || !result.success) {
      alert(result.message || "Unable to update order status.");
      return;
    }

    const updatedOrders = orders.map((order) => {
      if (order.orderId === orderId) {
        return {
          ...order,
          status: newStatus,
        };
      }

      return order;
    });

    setOrders(updatedOrders);

    localStorage.setItem(
      "quickdoor-orders",
      JSON.stringify(updatedOrders)
    );

    alert("Order status updated successfully!");
  } catch (error) {
    console.error("Error updating order status:", error);
    alert("Backend connection failed. Please try again.");
  }
}



  function scrollToProducts() {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
    });
  }
    
  const userOrders = loggedInUser
    ? orders.filter((order) => order.userId === loggedInUser.id)
    : [];




  return (
    <div className="app">
      <nav className="navbar">
        <h1 className="logo">
          Quick<span>door.</span>
        </h1>

        <div className="location">
          <span>Deliver to</span>
          <strong>Greater Noida ▼</strong>
        </div>

        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clothes, shoes, brands..."
            aria-label="Search products"
          />
        </div>


<div className="nav-actions">
  {loggedInUser ? (
    <>
      <span className="user-greeting">
        Hi, {loggedInUser.name}
      </span>

      <button
        className="login-btn"
        onClick={() => {
          localStorage.removeItem("quickdoor-user");
          setLoggedInUser(null);
        }}
      >
        Logout
      </button>
    </>
  ) : (
    <button
      className="login-btn"
      onClick={() => {
        setLoginOpen(true);
        setSignupMode(false);
      }}
    >
      Login
    </button>
  )}

  <button
    className="cart-btn"
    onClick={() => setCartOpen(true)}
    aria-label={`Open cart with ${cartCount} items`}
  >
    🛒 Cart ({cartCount})
  </button>
</div>

<button
  className="order-history-btn"
  onClick={() => setOrderHistoryOpen(true)}
>
  📦 My Orders
</button>
    {loggedInUser?.role === "admin" && (
  <button
    className="admin-dashboard-btn"
   onClick={() => {
  console.log("Admin Dashboard clicked");
  fetchAdminOrders();
  setAdminDashboardOpen(true);
}}
  >
    🛠️ Admin Dashboard
  </button>
)}




      </nav>

      <main>

        {adminDashboardOpen && loggedInUser?.role === "admin" && (
  <section className="admin-dashboard">
    <div className="admin-dashboard-header">
      <h2>🛠️ Quickdoor Admin Dashboard</h2>

      <button
        onClick={() => setAdminDashboardOpen(false)}
      >
        ✕ Close
      </button>
    </div>

    <p>Welcome, {loggedInUser.name}!</p>

  <div className="admin-stats">
      
<div className="admin-stat-card">
  <h3>Total Sales</h3>
  <p>
    ₹{adminOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    ).toLocaleString("en-IN")}
  </p>
</div>
</div>

<div className="admin-orders">
  <h3>All Customer Orders</h3>

  {adminOrdersLoading ? (
    <p>Loading orders...</p>
  ) : adminOrders.length === 0 ? (
    <p>No customer orders found.</p>
  ) : (
    adminOrders.map((order) => (
      <div className="admin-order-card" key={order.orderId}>
        <h4>Order ID: {order.orderId}</h4>

        <p>
          <strong>Customer:</strong>{" "}
          {order.customer?.name || "N/A"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {order.customer?.phone || "N/A"}
        </p>

        <p>
          <strong>Address:</strong>{" "}
          {order.customer?.address || "N/A"},{" "}
          {order.customer?.city || ""}
        </p>

        <p>
          <strong>Date:</strong>{" "}
          {order.date
            ? new Date(order.date).toLocaleString("en-IN")
            : "N/A"}
        </p>

        <p>
          <strong>Status:</strong> {order.status}
        </p>

        <p>
          <strong>Total:</strong> ₹
          {Number(order.total || 0).toLocaleString("en-IN")}
        </p>

        <h5>Products</h5>

        {order.items?.map((item, index) => (
          <p key={item.id || index}>
            {item.name || item.title || "Product"} ×{" "}
            {item.quantity || 1}
          </p>
        ))}
      </div>
    ))
  )}
</div>
</section>
)}

 
        <section className="hero">
          <div className="hero-content">
            <p className="tagline">
              YOUR STYLE. YOUR CITY. YOUR SPEED.
            </p>

            <h2>
              Fashion delivered
              <br />
              <span>to your door.</span>
            </h2>

            <p className="hero-description">
              Discover clothes, sneakers and accessories from your favourite
              local stores.
            </p>

            <button className="shop-btn" onClick={scrollToProducts}>
              Explore Fashion →
            </button>

            <p className="delivery-note">
              ⚡ Local fashion, delivered faster.
            </p>
          </div>

          <div className="hero-visual">
            <div className="fashion-icon">👟</div>
            <div className="fashion-label">YOUR NEXT LOOK AWAITS</div>
            <div className="fashion-emoji">👕 🧥 👜</div>
          </div>
        </section>

        <section className="categories">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIND YOUR STYLE</p>
              <h2>Shop by category</h2>
            </div>
            <p>Explore the latest trends →</p>
          </div>

          <div className="category-grid">
            {[
              {
                name: "Men",
                title: "Men's Wear",
                emoji: "👔",
                desc: "Everyday to extraordinary",
                style: "men",
              },
              {
                name: "Women",
                title: "Women's Wear",
                emoji: "👗",
                desc: "Find your perfect look",
                style: "women",
              },
              {
                name: "Shoes",
                title: "Shoes",
                emoji: "👟",
                desc: "Step up your game",
                style: "shoes",
              },
              {
                name: "Accessories",
                title: "Accessories",
                emoji: "👜",
                desc: "Complete your style",
                style: "accessories",
              },
            ].map((item) => (
              <button
                className={`category-card ${item.style}`}
                key={item.name}
                onClick={() => {
                  setCategory(item.name);
                  scrollToProducts();
                }}
              >
                <span>{item.emoji}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CURATED FOR YOU</p>
              <h2>Trending products</h2>
            </div>
            <p>{filteredProducts.length} products found</p>
          </div>

          <div className="filter-list">
            {categories.map((item) => (
              <button
                key={item}
                className={`filter-btn ${
                  category === item ? "active" : ""
                }`}
                onClick={() => setCategory(item)}
              >
                {item === "Men"
                  ? "Men's Wear"
                  : item === "Women"
                    ? "Women's Wear"
                    : item}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.id === product.id);

              return (
                <article className="product-card" key={product.id}>
                  <div
                    className="product-image"
                    style={{ backgroundColor: product.color }}
                  >
                    <img src={product.image} alt={product.name} />
                    <span className="product-discount">
                      {Math.round(
                        ((product.oldPrice - product.price) /
                          product.oldPrice) *
                          100
                      )}
                      % OFF
                    </span>
                  </div>

                  <div className="product-info">
                    <p className="product-shop">{product.shop}</p>
                    <h3>{product.name}</h3>

                    <div className="product-prices">
                      <strong>{formatPrice(product.price)}</strong>
                      <del>{formatPrice(product.oldPrice)}</del>
                    </div>

                    <button
                      className="add-cart-btn"
                      onClick={() => addToCart(product)}
                    >
                      {cartItem ? `+ Add More (${cartItem.quantity})` : "+ Add to Cart"}
                    </button>

                    {cartItem && (
                      <p className="added-message">
                        ✓ {cartItem.quantity} in your cart
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <p className="empty-products">
              No products found. Try another search.
            </p>
          )}
        </section>
      </main>

      <footer className="footer">
        <h2>Quickdoor.</h2>
        <p>Local stores. Latest fashion. At your doorstep.</p>
        <p>© 2026 Quickdoor. All rights reserved.</p>
      </footer>

      {cartOpen && (
        <div
          className="cart-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCartOpen(false);
            }
          }}
        >
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            <div className="cart-drawer-header">
              <div>
                <h2>Your Cart</h2>
                <p>{cartCount} item(s) in your bag</p>
              </div>

              <button
                className="cart-close-btn"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🛍️</div>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added anything yet.</p>
                <button
                  className="shop-btn"
                  onClick={() => {
                    setCartOpen(false);
                    scrollToProducts();
                  }}
                >
                  Explore Fashion →
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <div
                        className="cart-item-image"
                        style={{ backgroundColor: item.color }}
                      >
                        <img src={item.image} alt={item.name} />
                      </div>

                      <div className="cart-item-details">
                        <p className="product-shop">{item.shop}</p>
                        <h3>{item.name}</h3>
                        <strong>{formatPrice(item.price)}</strong>

                        <div className="cart-item-bottom">
                          <div
                            className="quantity-control"
                            aria-label={`Quantity for ${item.name}`}
                          >
                            <button
                              onClick={() => changeQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => changeQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <button
                            className="remove-item-btn"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <strong className="cart-line-total">
                        {formatPrice(item.price * item.quantity)}
                      </strong>
                    </article>
                  ))}
                </div>

                <div className="cart-delivery-note">
                  {subtotal >= 999
                    ? "🎉 You qualify for free delivery!"
                    : `Add ${formatPrice(999 - subtotal)} more for free delivery.`}
                </div>

                <div className="cart-bill">
                  <div>
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div>
                    <span>Delivery charge</span>
                    <span>
                      {deliveryCharge === 0 ? "FREE" : formatPrice(deliveryCharge)}
                    </span>
                  </div>
                  <div className="cart-grand-total">
                    <strong>Total</strong>
                    <strong>{formatPrice(grandTotal)}</strong>
                  </div>

                  <button
  className="checkout-btn"
  onClick={() => {
    setCartOpen(false);
    setCheckoutOpen(true);
  }}
>
  Proceed to Checkout →
</button>

                  <button
                    className="continue-shopping-btn"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue Shopping
                  </button>
                  <p className="cart-demo-note">
                    Demo prices and delivery charges. Payment is not enabled yet.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
           {checkoutOpen && (
        <div className="checkout-overlay">
          <section className="checkout-page">
            <div className="checkout-header">
              <div>
                <p className="eyebrow">QUICKDOOR CHECKOUT</p>
                <h2>Complete your order</h2>
                <p>Almost there! Where should we deliver your fashion?</p>
              </div>

              <button
                type="button"
                className="cart-close-btn"
                onClick={() => setCheckoutOpen(false)}
                aria-label="Close checkout"
              >
                ✕
              </button>
            </div>

            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={placeOrder}>
                <h3>Delivery address</h3>

                <label>
                  Full name
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    required
                  />
                </label>

                <label>
                  Mobile number
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                  />
                </label>

                <label>
                  House number and street
                  <textarea
                    name="address"
                    placeholder="Enter your complete address"
                    rows={3}
                    required
                  />
                </label>

                <div className="checkout-fields-row">
                  <label>
                    City
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Greater Noida"
                      required
                    />
                  </label>

                  <label>
                    PIN code
                    <input
                      type="text"
                      name="pincode"
                      placeholder="6-digit PIN"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                    />
                  </label>
                </div>

                <div className="checkout-payment-note">
                  <strong>Payment method</strong>
                  <p>Demo checkout — payment is not enabled yet.</p>
                  <span>Cash on delivery simulation</span>
                </div>

                <button type="submit" className="checkout-btn">
                  Place Demo Order · {formatPrice(grandTotal)}
                </button>

                <button
                  type="button"
                  className="continue-shopping-btn"
                  onClick={() => setCheckoutOpen(false)}
                >
                  Back to shopping
                </button>
              </form>

              <aside className="checkout-summary">
                <h3>Order summary</h3>

                {cart.map((item) => (
                  <div className="checkout-summary-item" key={item.id}>
                    <img src={item.image} alt={item.name} />

                    <div>
                      <strong>{item.name}</strong>
                      <p>Qty: {item.quantity}</p>
                    </div>

                    <strong>
                      {formatPrice(item.price * item.quantity)}
                    </strong>
                  </div>
                ))}

                <div className="checkout-summary-total">
                  <p>
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </p>

                  <p>
                    <span>Delivery</span>
                    <span>
                      {deliveryCharge === 0
                        ? "FREE"
                        : formatPrice(deliveryCharge)}
                    </span>
                  </p>

                  <p className="checkout-final-total">
                    <strong>Total</strong>
                    <strong>{formatPrice(grandTotal)}</strong>
                  </p>
                </div>
              </aside>
            </div>
                   </section>
        </div>
      )}

      {orderHistoryOpen && (
        
        <div
          className="cart-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOrderHistoryOpen(false);
            }
          }}
        >
          <section
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="My Orders"
          >
            <div className="cart-drawer-header">
              <h2>📦 My Orders</h2>

              <button
                className="cart-close-btn"
                onClick={() => setOrderHistoryOpen(false)}
              >
                ✕
              </button>
            </div>

          {userOrders.length === 0 ? (
              <div className="cart-empty">
                <h3>No orders yet</h3>
                <p>Your placed orders will appear here.</p>
              </div>
            ) : (
              <div className="order-history-list">
                {userOrders.map((order) => (
                  <article
                    key={order.orderId}
                    className="order-history-card"
                  >
                    <h3>Order ID: {order.orderId}</h3>

                  


<div className="order-status-row">
  <strong>Status:</strong>

  <select
    value={order.status || "Placed"}
    onChange={(event) =>
      updateOrderStatus(order.orderId, event.target.value)
    }
  >
    <option value="Placed">Placed</option>
    <option value="Processing">Processing</option>
    <option value="Shipped">Shipped</option>
    <option value="Delivered">Delivered</option>
    <option value="Cancelled">Cancelled</option>
  </select>
</div>





                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(order.date).toLocaleString("en-IN")}
                    </p>

                    <p>
                      <strong>Customer:</strong>{" "}
                      {order.customer?.name}
                    </p>

                    <div>
                      <strong>Products:</strong>

                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.name} × {item.quantity} —{" "}
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      ))}
                    </div>

                    <h3>Total: {formatPrice(order.total)}</h3>
                    <hr />
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
     
{loginOpen && (
  <div
    className="cart-overlay"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setLoginOpen(false);
      }
    }}
  >
    <section
      className="cart-drawer login-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Login"
    >
      <div className="cart-drawer-header">
        
<h2>
  {signupMode ? "Create Your Account" : "Welcome to Quickdoor"}
</h2>
 
        <button
          className="cart-close-btn"
          onClick={() => setLoginOpen(false)}
        >
          ✕
        </button>
      </div>

   
<form
  className="login-form"
  onSubmit={async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (signupMode && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (signupMode && password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    try {
      const endpoint = signupMode
        ? "http://127.0.0.1:5000/api/register"
        : "http://127.0.0.1:5000/api/login";

      const payload = signupMode
        ? { name, email, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Something went wrong.");
        return;
      }

      alert(result.message);

   if (!signupMode) {
  console.log("Logged-in user:", result.user);

  setLoggedInUser(result.user);

  localStorage.setItem(
    "quickdoor-user",
    JSON.stringify(result.user)
  );
localStorage.setItem("quickdoor-token", result.access_token);
  setLoginOpen(false);
}

    } catch (error) {
      alert(
        "Cannot connect to Quickdoor backend. Please check if Flask is running."
      );
      console.error(error);
    }
  }}
>
  {signupMode && (
    <>
      <label htmlFor="signup-name">Full Name</label>
      <input
        id="signup-name"
        type="text"
        name="name"
        placeholder="Enter your full name"
        required
      />
    </>
  )}

  <label htmlFor="login-email">Email address</label>
  <input
    id="login-email"
    type="email"
    name="email"
    placeholder="Enter your email"
    required
  />

  {signupMode && (
    <>
      <label htmlFor="confirm-password">Confirm Password</label>
      <input
        id="confirm-password"
        type="password"
        name="confirmPassword"
        placeholder="Re-enter your password"
        required
      />
    </>
  )}

  <label htmlFor="login-password">Password</label>
  <input
    id="login-password"
    type="password"
    name="password"
    placeholder="Enter your password"
    required
  />

  <button type="submit" className="shop-btn">
    {signupMode ? "Create Account" : "Login"}
  </button>

  <p>
    {signupMode
      ? "Already have an account?"
      : "New to Quickdoor?"}{" "}

    <button
      type="button"
      className="signup-toggle-btn"
      onClick={() => setSignupMode(!signupMode)}
    >
      {signupMode ? "Login" : "Sign Up"}
    </button>
  </p>
</form>

    </section>
  </div>
)}



    </div>
  );
}

export default App;
