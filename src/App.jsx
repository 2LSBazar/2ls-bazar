import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { adminSignIn } from "./storageShim.js";
import {
  ShoppingBag, X, Plus, Minus, Check, ArrowLeft, Share2, Lock,
  Trash2, Pencil, Facebook, MessageCircle, Copy, LayoutDashboard, ClipboardList, Search, FileText
} from "lucide-react";

// ============= CONFIG =============
const PALETTE = {
  ink: "#0a0a0a",
  blue: "#1975B8",
  orange: "#E53935",
  navy: "#1F3A87",
  card: "#FFFFFF",
  border: "#E0E0E0",
  muted: "#999999",
  orangeSoft: "#FFE4D9",
};

const CLOUDINARY_CLOUD_NAME = "";
const CLOUDINARY_UPLOAD_PRESET = "";
const WHATSAPP_NUMBER = ""; // e.g., "8801700000000" (no +)

// ============= UTILS =============

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function Taka({ amount }) {
  const s = typeof amount === "string" ? amount : String(amount);
  const n = Math.round(Number(s));
  return <span>৳{n.toLocaleString("en-BD")}</span>;
}

function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Returns a product's category list. New products store an array in `cats`
// (so one product can appear in several categories). Older products only
// have a single `cat` string — fall back to that so nothing breaks.
function productCats(p) {
  if (p.cats && p.cats.length > 0) return p.cats;
  if (p.cat) return [p.cat];
  return [];
}

// ============= App =============

export default function App() {
  const [page, setPage] = useState("home");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promo, setPromo] = useState({ enabled: false, image: "", text: "", category: "" });

  const [cart, setCart] = useState([]);
  const [cartShown, setCartShown] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("admin_data") || "{}");
    if (data.products) setProducts(data.products);
    if (data.orders) setOrders(data.orders);
    if (data.banners) setBanners(data.banners);
    if (data.categories) setCategories(data.categories);
    if (data.promo) setPromo(data.promo);
    if (data.cart) setCart(data.cart);
  }, []);

  // Save to storage whenever data changes
  const saveAllData = useCallback(() => {
    localStorage.setItem(
      "admin_data",
      JSON.stringify({ products, orders, banners, categories, promo, cart })
    );
  }, [products, orders, banners, categories, promo, cart]);

  useEffect(() => {
    saveAllData();
  }, [products, orders, banners, categories, promo, cart, saveAllData]);

  const navigate = (path) => setPage(path.replace("#", ""));

  const copyLink = (path) => {
    const link = `${window.location.origin}${window.location.pathname}${path}`;
    navigator.clipboard.writeText(link);
    alert("লিংক কপি করা হয়েছে!");
  };

  const addToCart = (product) => {
    const sizes = (product.sizes || []).length > 0 ? product.sizes : ["One size"];
    const colors = (product.colors || []).length > 0 ? product.colors : [""];

    navigate("#/add-to-cart/" + product.id);
  };

  const removeFromCart = (i) => {
    setCart(cart.filter((_, idx) => idx !== i));
  };

  const renderPage = () => {
    if (page === "home" || page === "") {
      return <HomePage products={products} cart={cart} navigate={navigate} categories={categories} />;
    }
    if (page.startsWith("category/")) {
      const cat = page.replace("category/", "");
      return <CategoryView products={products} category={cat} cart={cart} navigate={navigate} />;
    }
    if (page.startsWith("product/")) {
      const id = page.replace("product/", "");
      const p = products.find((x) => x.id === id);
      return p ? (
        <ProductView product={p} addToCart={addToCart} navigate={navigate} copyLink={copyLink} />
      ) : (
        <div className="p-4">পণ্য পাওয়া যায়নি</div>
      );
    }
    if (page.startsWith("add-to-cart/")) {
      const id = page.replace("add-to-cart/", "");
      const p = products.find((x) => x.id === id);
      return p ? (
        <AddToCartView
          product={p}
          cart={cart}
          setCart={setCart}
          navigate={navigate}
        />
      ) : (
        <div className="p-4">পণ্য পাওয়া যায়নি</div>
      );
    }
    if (page === "cart") {
      return (
        <CartView
          cart={cart}
          removeFromCart={removeFromCart}
          products={products}
          navigate={navigate}
          setOrders={setOrders}
        />
      );
    }
    if (page.startsWith("track-order/")) {
      const id = page.replace("track-order/", "");
      return <TrackOrderView navigate={navigate} orders={orders} initialId={id} />;
    }
    if (page === "admin") {
      return (
        <AdminView
          products={products}
          orders={orders}
          banners={banners}
          categories={categories}
          promo={promo}
          setPromo={setPromo}
          saveProducts={setProducts}
          saveOrders={setOrders}
          saveBanners={setBanners}
          saveCategories={setCategories}
          navigate={navigate}
          copyLink={copyLink}
        />
      );
    }
    return <div className="p-4">পেজ পাওয়া যায়নি</div>;
  };

  return (
    <div style={{ background: PALETTE.card }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: ${PALETTE.card}; }
        input, select, textarea { font-family: inherit; }
        .max-w-md { max-width: 28rem; }
        .max-w-lg { max-width: 32rem; }
        .max-w-4xl { max-width: 56rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
        .p-1 { padding: 0.25rem; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-5 { margin-bottom: 1.25rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .flex { display: flex; }
        .flex-1 { flex: 1; }
        .flex-col { flex-direction: column; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .items-end { align-items: flex-end; }
        .justify-start { justify-content: flex-start; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .justify-end { justify-content: flex-end; }
        .gap-2 { gap: 0.5rem; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .col-span-2 { grid-column: span 2 / span 2; }
        .row-span-2 { grid-row: span 2; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .overflow-hidden { overflow: hidden; }
        .rounded { border-radius: 0.375rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .rounded-2xl { border-radius: 1rem; }
        .rounded-full { border-radius: 9999px; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .text-base { font-size: 1rem; }
        .text-lg { font-size: 1.125rem; }
        .text-xl { font-size: 1.25rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .border { border: 1px solid; }
        .border-t { border-top: 1px solid; }
        .border-b { border-bottom: 1px solid; }
        .w-3 { width: 0.75rem; }
        .w-5 { width: 1.25rem; }
        .w-10 { width: 2.5rem; }
        .w-16 { width: 4rem; }
        .w-24 { width: 6rem; }
        .w-full { width: 100%; }
        .h-3 { height: 0.75rem; }
        .h-8 { height: 2rem; }
        .h-10 { height: 2.5rem; }
        .h-12 { height: 3rem; }
        .h-16 { height: 4rem; }
        .h-48 { height: 12rem; }
        .h-full { height: 100%; }
        .min-w-0 { min-width: 0; }
        .flex-shrink-0 { flex-shrink: 0; }
        .flex-grow { flex-grow: 1; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-3 > * + * { margin-top: 0.75rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }
        .hidden { display: none; }
        .fixed { position: fixed; }
        .absolute { position: absolute; }
        .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        .top-2 { top: 0.5rem; }
        .right-5 { right: 1.25rem; }
        .bottom-5 { bottom: 1.25rem; }
        .z-40 { z-index: 40; }
        .z-50 { z-index: 50; }
        button { cursor: pointer; border: none; font-size: inherit; }
      `}</style>

      {renderPage()}

      {cartShown && (
        <div className="fixed inset-0 flex items-end z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setCartShown(false)}>
          <div
            className="w-full rounded-t-3xl p-4"
            style={{ background: PALETTE.card, maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontFamily: "'Baloo Da 2', sans-serif" }} className="text-xl font-bold">কার্ট</h2>
              <button onClick={() => setCartShown(false)} className="p-1 rounded-full" style={{ background: PALETTE.orangeSoft }}>
                <X size={20} color={PALETTE.orange} />
              </button>
            </div>

            {cart.length === 0 ? (
              <p style={{ color: PALETTE.muted }}>কার্ট খালি</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((it, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-lg" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
                      <img
                        src={it.image || `https://picsum.photos/seed/${it.productId}/60/70`}
                        className="w-12 h-16 object-cover rounded"
                        alt={it.title}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold truncate">{it.title}</p>
                        <p className="text-xs" style={{ color: PALETTE.muted }}>
                          {it.size}/{it.color}
                        </p>
                        <p className="text-xs font-semibold mt-1">
                          <Taka amount={it.price} /> × {it.qty} = <Taka amount={it.price * it.qty} />
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="p-1 rounded-full flex-shrink-0" style={{ background: "#FCE4E4" }}>
                        <Trash2 size={14} color="#C0392B" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-lg border-t py-3" style={{ borderColor: PALETTE.border }}>
                  <span>মোট</span>
                  <span style={{ color: PALETTE.orange }}>
                    <Taka amount={cart.reduce((sum, it) => sum + it.price * it.qty, 0)} />
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCartShown(false);
                    navigate("#/cart");
                  }}
                  className="w-full mt-3 py-3 rounded-full font-semibold text-white"
                  style={{ background: PALETTE.blue }}
                >
                  চেকআউট করুন
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {page !== "admin" && page !== "" && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-40 flex items-center justify-center rounded-full shadow-lg"
          style={{ width: 56, height: 56, background: "#25D366" }}
          title="WhatsApp-এ চ্যাট করুন"
        >
          <style>{`
            @keyframes wapulse {
              0% { box-shadow: 0 0 0 0 rgba(37,211,102,0.6); }
              70% { box-shadow: 0 0 0 12px rgba(37,211,102,0); }
              100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
            }
            .wa-pulse { animation: wapulse 2.2s infinite; }
          `}</style>
          <span className="wa-pulse" style={{ position: "absolute", width: 56, height: 56, borderRadius: "50%" }} />
          <MessageCircle size={28} color="#fff" fill="#fff" />
        </a>
      )}
    </div>
  );
}

function HomePage({ products, cart, navigate, categories }) {
  return (
    <section className="pb-20">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: PALETTE.card, borderBottom: `1px solid ${PALETTE.border}` }}>
        <h1 style={{ fontFamily: "'Baloo Da 2', sans-serif", fontSize: "1.25rem", fontWeight: 700 }}>আমাদের দোকান</h1>
        <button
          onClick={() => navigate("#/admin")}
          className="p-2 rounded-full"
          style={{ background: PALETTE.orangeSoft }}
          title="অ্যাডমিন"
        >
          <Lock size={16} color={PALETTE.orange} />
        </button>
      </div>

      <InfiniteCategoryStrip products={products} categories={categories} navigate={navigate} />

      {categories.map((cat) => {
        const catProducts = products.filter((p) => productCats(p).includes(cat.name));
        if (catProducts.length === 0) return null;
        return (
          <section key={cat.name} className="px-4 py-6">
            <h2 className="text-lg font-semibold mb-3">{cat.name}</h2>
            <div className="grid grid-cols-2 gap-3">
              {catProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`#/product/${p.id}`)}
                  className="rounded-xl overflow-hidden cursor-pointer"
                  style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}
                >
                  <img
                    src={p.images && p.images.length > 0 ? p.images[0] : `https://picsum.photos/seed/${p.seed || p.id}/200/250`}
                    alt={p.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2">
                    <p className="text-sm font-semibold truncate">{p.title}</p>
                    <p className="text-xs mt-1" style={{ color: PALETTE.muted }}>
                      <Taka amount={p.discount || p.price} />
                      {p.discount && p.price && (
                        <span className="ml-1">
                          <span style={{ textDecoration: "line-through", color: PALETTE.muted }}>
                            <Taka amount={p.price} />
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function CategoryView({ products, category, navigate }) {
  const decoded = decodeURIComponent(category);
  const catProducts = products.filter((p) => productCats(p).includes(decoded));

  return (
    <section className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate("#/")} className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: PALETTE.blue }}>
        <ArrowLeft size={16} /> ফিরে যান
      </button>
      <h1 className="text-xl font-bold mb-4">{decoded}</h1>
      {catProducts.length === 0 ? (
        <p style={{ color: PALETTE.muted }}>এই ক্যাটাগরিতে কোনো পণ্য নেই।</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {catProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`#/product/${p.id}`)}
              className="rounded-xl overflow-hidden cursor-pointer"
              style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}
            >
              <img
                src={p.images && p.images.length > 0 ? p.images[0] : `https://picsum.photos/seed/${p.seed || p.id}/200/250`}
                alt={p.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-2">
                <p className="text-sm font-semibold truncate">{p.title}</p>
                <p className="text-xs mt-1" style={{ color: PALETTE.muted }}>
                  <Taka amount={p.discount || p.price} />
                  {p.discount && p.price && (
                    <span className="ml-1">
                      <span style={{ textDecoration: "line-through", color: PALETTE.muted }}>
                        <Taka amount={p.price} />
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductView({ product, addToCart, navigate, copyLink }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = product.images && product.images.length > 0 ? product.images : [`https://picsum.photos/seed/${product.seed || product.id}/300/400`];

  return (
    <section className="max-w-md mx-auto px-4 pb-20">
      <button onClick={() => navigate("#/")} className="mt-3 flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: PALETTE.blue }}>
        <ArrowLeft size={16} /> ফিরে যান
      </button>
      <div className="rounded-2xl overflow-hidden bg-gray-100 mb-4 h-96 flex items-center justify-center">
        <img src={images[imgIdx]} alt={product.title} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mb-4">
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => setImgIdx(i)}
              className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer"
              style={{ border: imgIdx === i ? `2px solid ${PALETTE.orange}` : `1px solid ${PALETTE.border}` }}
            >
              <img src={images[i]} alt={`view-${i}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <h1 className="text-xl font-bold mb-2">{product.title}</h1>
      <div className="flex items-end gap-2 mb-4">
        <span className="text-2xl font-bold" style={{ color: PALETTE.orange }}>
          <Taka amount={product.discount || product.price} />
        </span>
        {product.discount && product.price && (
          <span className="text-sm" style={{ textDecoration: "line-through", color: PALETTE.muted }}>
            <Taka amount={product.price} />
          </span>
        )}
      </div>
      {product.desc && <p className="text-sm mb-4" style={{ color: PALETTE.muted }}>{product.desc}</p>}
      {product.videoUrl && (
        <div className="mb-4 rounded-xl overflow-hidden bg-gray-200">
          <iframe width="100%" height="250" src={product.videoUrl} title={product.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => copyLink(`#/product/${product.id}`)} className="flex-1 py-3 rounded-full font-semibold border" style={{ borderColor: PALETTE.border, color: PALETTE.blue }}>
          <Share2 size={16} className="inline mr-2" /> শেয়ার
        </button>
        <button
          onClick={() => addToCart(product)}
          className="flex-1 py-3 rounded-full font-semibold text-white"
          style={{ background: PALETTE.orange }}
          disabled={!product.inStock}
        >
          <ShoppingBag size={16} className="inline mr-2" /> {product.inStock ? "কেনো" : "স্টক নেই"}
        </button>
      </div>
    </section>
  );
}

function AddToCartView({ product, cart, setCart, navigate }) {
  const sizes = (product.sizes || []).length > 0 ? product.sizes : ["One size"];
  const colors = (product.colors || []).length > 0 ? product.colors : [""];

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const images = product.images && product.images.length > 0 ? product.images : [`https://picsum.photos/seed/${product.seed || product.id}/300/400`];

  const showColorImage = product.colorImages && product.colorImages[selectedColor];
  const displayImage = showColorImage ? product.colorImages[selectedColor] : images[imgIdx];

  const getPrice = () => {
    let price = product.discount || product.price;
    if (product.sizePricing && product.sizePricing[selectedSize] && product.sizePricing[selectedSize].discount) {
      price = product.sizePricing[selectedSize].discount;
    } else if (product.sizePricing && product.sizePricing[selectedSize] && product.sizePricing[selectedSize].price) {
      price = product.sizePricing[selectedSize].price;
    }
    if (product.colorAdjust && product.colorAdjust[selectedColor]) {
      price = Number(price) + Number(product.colorAdjust[selectedColor]);
    }
    return price;
  };

  const price = getPrice();

  const add = () => {
    const item = {
      productId: product.id,
      title: product.title,
      size: selectedSize,
      color: selectedColor,
      price: Number(price),
      qty,
      image: displayImage,
    };
    setCart([...cart, item]);
    alert("কার্টে যুক্ত করা হয়েছে!");
    navigate("#/");
  };

  return (
    <section className="max-w-md mx-auto px-4 py-6">
      <button onClick={() => navigate(`#/product/${product.id}`)} className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: PALETTE.blue }}>
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <div className="rounded-2xl overflow-hidden bg-gray-100 mb-4 h-80 flex items-center justify-center">
        <img src={displayImage} alt={product.title} className="w-full h-full object-cover" />
      </div>

      <h1 className="text-xl font-bold mb-1">{product.title}</h1>
      <p className="text-lg font-bold" style={{ color: PALETTE.orange }}>
        <Taka amount={price} /> × {qty} = <Taka amount={Number(price) * qty} />
      </p>

      {colors.length > 1 && (
        <div className="mt-4">
          <p className="text-xs font-semibold mb-2" style={{ color: PALETTE.muted }}>রঙ</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{
                  background: selectedColor === c ? PALETTE.orange : PALETTE.card,
                  color: selectedColor === c ? "#fff" : PALETTE.ink,
                  border: `1px solid ${selectedColor === c ? PALETTE.orange : PALETTE.border}`,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 1 && (
        <div className="mt-4">
          <p className="text-xs font-semibold mb-2" style={{ color: PALETTE.muted }}>সাইজ</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{
                  background: selectedSize === s ? PALETTE.blue : PALETTE.card,
                  color: selectedSize === s ? "#fff" : PALETTE.ink,
                  border: `1px solid ${selectedSize === s ? PALETTE.blue : PALETTE.border}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 p-3 rounded-lg" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
        <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 rounded-full" style={{ background: PALETTE.orangeSoft }}>
          <Minus size={16} color={PALETTE.orange} />
        </button>
        <span className="flex-1 text-center font-semibold">{qty}</span>
        <button onClick={() => setQty(qty + 1)} className="p-1 rounded-full" style={{ background: PALETTE.orangeSoft }}>
          <Plus size={16} color={PALETTE.orange} />
        </button>
      </div>

      <button
        onClick={add}
        className="w-full mt-6 py-3 rounded-full font-semibold text-white"
        style={{ background: PALETTE.orange }}
      >
        <ShoppingBag size={16} className="inline mr-2" /> কার্টে যোগ করুন
      </button>
    </section>
  );
}

function CartView({ cart, removeFromCart, products, navigate, setOrders }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("dhaka");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [bkashTrxId, setBkashTrxId] = useState("");
  const [processing, setProcessing] = useState(false);

  const total = cart.reduce((sum, it) => sum + it.price * it.qty, 0);

  const checkout = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert("সব তথ্য পূরণ করো");
      return;
    }
    if (paymentMethod === "bkash" && !bkashTrxId.trim()) {
      alert("বিকাশ ট্রানজ্যাকশন আইডি দাও");
      return;
    }
    setProcessing(true);

    const orderId = generateOrderId();
    const order = {
      id: orderId,
      time: new Date().toISOString(),
      name,
      phone,
      address,
      area,
      paymentMethod,
      trxId: bkashTrxId,
      items: cart,
      total,
      status: "পেন্ডিং",
      notes: "", // New: empty notes field
    };

    // Get existing orders
    const data = JSON.parse(localStorage.getItem("admin_data") || "{}");
    const existingOrders = data.orders || [];
    const updatedOrders = [...existingOrders, order];

    // Save updated orders
    data.orders = updatedOrders;
    localStorage.setItem("admin_data", JSON.stringify(data));
    setOrders(updatedOrders);

    setProcessing(false);
    alert(`অর্ডার সফল! আপনার অর্ডার আইডি: ${orderId}\n\nআমরা শীঘ্রই যোগাযোগ করব।`);
    navigate(`#/track-order/${orderId}`);
  };

  return (
    <section className="max-w-md mx-auto px-4 py-6 pb-20">
      <button onClick={() => navigate("#/")} className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: PALETTE.blue }}>
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      <h1 className="text-xl font-bold mb-4">চেকআউট</h1>

      {cart.length === 0 ? (
        <p style={{ color: PALETTE.muted }}>কার্ট খালি</p>
      ) : (
        <>
          <div className="mb-6 space-y-2">
            {cart.map((it, idx) => (
              <div key={idx} className="flex gap-3 p-2" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "0.5rem" }}>
                <img src={it.image} alt={it.title} className="w-10 h-12 object-cover rounded" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">{it.title}</p>
                  <p className="text-xs" style={{ color: PALETTE.muted }}>
                    {it.size}/{it.color} × {it.qty}
                  </p>
                  <p className="text-xs font-semibold mt-0.5">
                    <Taka amount={it.price * it.qty} />
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg p-3 mb-6" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
            <div className="flex justify-between mb-2">
              <span className="text-xs">মোট পণ্য</span>
              <span className="text-xs font-semibold">
                <Taka amount={total} />
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-xs">ডেলিভারি চার্জ</span>
              <span className="text-xs font-semibold">{area === "dhaka" ? "৳50" : "৳100"}</span>
            </div>
            <div className="flex justify-between font-bold" style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: "0.5rem" }}>
              <span className="text-sm">সর্বমোট</span>
              <span className="text-sm" style={{ color: PALETTE.orange }}>
                <Taka amount={total + (area === "dhaka" ? 50 : 100)} />
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <input placeholder="আপনার নাম" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
            <input placeholder="ফোন নম্বর" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
            <input placeholder="ঠিকানা" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
            <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }}>
              <option value="dhaka">ঢাকার ভেতরে (৳50)</option>
              <option value="outside">ঢাকার বাইরে (৳100)</option>
            </select>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }}>
              <option value="cod">ক্যাশ অন ডেলিভারি</option>
              <option value="bkash">বিকাশ পেমেন্ট</option>
            </select>
            {paymentMethod === "bkash" && (
              <input placeholder="বিকাশ ট্রানজ্যাকশন আইডি" value={bkashTrxId} onChange={(e) => setBkashTrxId(e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
            )}
          </div>

          <button
            onClick={checkout}
            disabled={processing}
            className="w-full mt-6 py-3 rounded-full font-semibold text-white"
            style={{ background: PALETTE.blue, opacity: processing ? 0.6 : 1 }}
          >
            {processing ? "অপেক্ষা করুন..." : "অর্ডার করুন"}
          </button>
        </>
      )}
    </section>
  );
}

function TrackOrderView({ navigate, orders, initialId }) {
  const [query, setQuery] = useState(initialId || "");
  const [searched, setSearched] = useState(!!initialId);

  const statusOptions = ["পেন্ডিং", "কনফার্ম হয়েছে", "ডেলিভারি হচ্ছে", "ডেলিভার হয়েছে", "বাতিল"];
  const statusColor = {
    "পেন্ডিং": PALETTE.orange,
    "কনফার্ম হয়েছে": PALETTE.blue,
    "ডেলিভারি হচ্ছে": PALETTE.navy,
    "ডেলিভার হয়েছে": "#1E8E5A",
    "বাতিল": "#C0392B",
  };
  const statusStep = { "পেন্ডিং": 0, "কনফার্ম হয়েছে": 1, "ডেলিভারি হচ্ছে": 2, "ডেলিভার হয়েছে": 3, "বাতিল": -1 };

  const found = searched ? orders.find((o) => o.id.trim().toLowerCase() === query.trim().toLowerCase()) : null;
  const status = found ? (found.status || "পেন্ডিং") : null;
  const step = status ? statusStep[status] : 0;

  return (
    <section className="max-w-md mx-auto px-4 py-10">
      <h2 style={{ fontFamily: "'Baloo Da 2', sans-serif" }} className="text-xl font-bold mb-4 text-center">অর্ডার ট্র্যাক করুন</h2>
      <div className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSearched(true)}
          placeholder="অর্ডার আইডি দিন"
          className="flex-1 px-3 py-2 rounded-lg border bg-white"
          style={{ borderColor: PALETTE.border }}
        />
        <button onClick={() => setSearched(true)} className="px-4 rounded-lg font-semibold text-sm" style={{ background: PALETTE.blue, color: "#fff" }}>
          খুঁজুন
        </button>
      </div>

      {searched && !found && (
        <p className="text-sm text-center" style={{ color: PALETTE.muted }}>এই আইডি দিয়ে কোনো অর্ডার পাওয়া যায়নি।</p>
      )}

      {found && (
        <div className="rounded-2xl p-4" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
          <div className="flex justify-between items-start mb-1">
            <p className="font-bold text-sm" style={{ color: PALETTE.blue }}>{found.id}</p>
            <p className="text-xs" style={{ color: PALETTE.muted }}>{new Date(found.time).toLocaleString("bn-BD")}</p>
          </div>
          <p className="text-sm mb-3">{found.name}</p>

          <div className="mb-4">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: statusColor[status] + "22", color: statusColor[status] }}>
              {status}
            </span>
          </div>

          {status !== "বাতিল" && (
            <div className="flex items-center mb-4">
              {statusOptions.slice(0, 4).map((s, i) => (
                <React.Fragment key={s}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: i <= step ? PALETTE.blue : PALETTE.border }} />
                  {i < 3 && <div className="flex-1 h-0.5" style={{ background: i < step ? PALETTE.blue : PALETTE.border }} />}
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="mt-4 mb-4">
            <p className="text-xs font-bold mb-2" style={{ color: PALETTE.muted }}>অর্ডারকৃত পণ্য:</p>
            {found.items.map((it, idx) => (
              <div key={idx} className="flex gap-2 mb-2 p-2 rounded-lg" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
                <img src={it.image} alt={it.title} className="w-10 h-12 object-cover rounded flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">{it.title}</p>
                  <p className="text-xs" style={{ color: PALETTE.muted }}>{it.size}/{it.color} × {it.qty}</p>
                  <p className="text-xs font-bold mt-0.5"><Taka amount={it.price * it.qty} /></p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold text-sm pt-2 border-t" style={{ borderColor: PALETTE.border }}>
            <span>সর্বমোট</span>
            <span style={{ color: PALETTE.orange }}><Taka amount={found.total} /></span>
          </div>
        </div>
      )}

      <button onClick={() => navigate("#/")} className="mt-6 text-sm font-medium block mx-auto" style={{ color: PALETTE.blue }}>← শপে ফিরে যান</button>
    </section>
  );
}

// ============= ADMIN VIEW =============

function AdminView({ products, orders, banners, categories, promo, setPromo, saveProducts, saveOrders, saveBanners, saveCategories, navigate, copyLink }) {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [checking, setChecking] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [tab, setTab] = useState("products");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [colorImages, setColorImages] = useState({});
  const [sizePriceForm, setSizePriceForm] = useState({});
  const [colorAdjustForm, setColorAdjustForm] = useState({});
  const [uploadingColor, setUploadingColor] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", icon: "", color: "#F5821F" });
  const [catEditing, setCatEditing] = useState(null);
  const [uploadingCatImage, setUploadingCatImage] = useState(false);
  const [editingOrderNotes, setEditingOrderNotes] = useState(null);
  const [orderNotesForm, setOrderNotesForm] = useState("");

  function emptyForm() {
    return { title: "", cats: categories[0] ? [categories[0].name] : [], price: "", discount: "", sizes: "", colors: "", desc: "", images: "", videoUrl: "", inStock: true };
  }

  const toggleFormCat = (name) => {
    setForm((f) => {
      const has = f.cats.includes(name);
      const cats = has ? f.cats.filter((c) => c !== name) : [...f.cats, name];
      return { ...f, cats };
    });
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ title: p.title, cats: productCats(p), price: p.price, discount: p.discount || "", sizes: p.sizes.join(", "), colors: p.colors.join(", "), desc: p.desc || "", images: (p.images || []).join(", "), videoUrl: p.videoUrl || "", inStock: p.inStock !== false });
    if (p.colorImages && Object.keys(p.colorImages).length > 0) {
      setColorImages(p.colorImages);
    } else if (p.images && p.colors && p.images.length === p.colors.length && p.colors.length > 1) {
      const map = {};
      p.colors.forEach((c, i) => { map[c] = p.images[i]; });
      setColorImages(map);
    } else {
      setColorImages({});
    }
    setSizePriceForm(
      p.sizePricing
        ? Object.fromEntries(
            Object.entries(p.sizePricing).map(([k, v]) => [
              k,
              { price: v.price ? String(v.price) : "", discount: v.discount ? String(v.discount) : "" },
            ])
          )
        : {}
    );
    setColorAdjustForm(p.colorAdjust ? Object.fromEntries(Object.entries(p.colorAdjust).map(([k, v]) => [k, String(v)])) : {});
  };

  const resetForm = () => { setEditing(null); setForm(emptyForm()); setColorImages({}); setSizePriceForm({}); setColorAdjustForm({}); };

  const uploadOneFile = async (file) => {
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body,
    });
    const data = await res.json();
    if (data && data.secure_url) return data.secure_url;
    throw new Error("upload failed");
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const url = await uploadOneFile(file);
        urls.push(url);
      }
      setForm({ ...form, images: form.images ? form.images + ", " + urls.join(", ") : urls.join(", ") });
    } catch (err) {
      alert("ছবি আপলোড করা যায়নি, আবার চেষ্টা করো।");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleColorFileUpload = async (color, file) => {
    if (!file) return;
    setUploadingColor(color);
    try {
      const url = await uploadOneFile(file);
      setColorImages({ ...colorImages, [color]: url });
    } catch (err) {
      alert("রঙের ছবি আপলোড করা যায়নি, আবার চেষ্টা করো।");
    }
    setUploadingColor(null);
  };

  const handleBannerUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingBanner(true);
    try {
      const urls = [];
      for (const file of files) {
        const url = await uploadOneFile(file);
        urls.push(url);
      }
      await saveBanners([...banners, ...urls]);
    } catch (err) {
      alert("ব্যানার আপলোড করা যায়নি, আবার চেষ্টা করো।");
    }
    setUploadingBanner(false);
    e.target.value = "";
  };

  const removeBanner = async (idx) => {
    const next = banners.filter((_, i) => i !== idx);
    await saveBanners(next);
  };

  const startCatEdit = (cat) => {
    setCatEditing(cat.name);
    setCatForm({ name: cat.name, icon: cat.icon || "", color: cat.color || "#F5821F" });
  };

  const resetCatForm = () => { setCatEditing(null); setCatForm({ name: "", icon: "", color: "#F5821F" }); };

  const submitCategory = async () => {
    if (!catForm.name.trim()) return;
    const existing = categories.find((c) => c.name === catEditing);
    const payload = { name: catForm.name.trim(), icon: catForm.icon.trim() || "🛍️", color: catForm.color || "#F5821F", image: existing ? existing.image : "" };
    let next;
    if (catEditing) next = categories.map((c) => (c.name === catEditing ? payload : c));
    else next = [...categories, payload];
    await saveCategories(next);
    resetCatForm();
  };

  const removeCategory = async (name) => {
    if (confirm(`ক্যাটাগরি "${name}" ডিলিট করবে?`)) {
      const next = categories.filter((c) => c.name !== name);
      await saveCategories(next);
    }
  };

  const handleCatImageUpload = async (catName, file) => {
    if (!file) return;
    setUploadingCatImage(true);
    try {
      const url = await uploadOneFile(file);
      const updated = categories.map((c) => (c.name === catName ? { ...c, image: url } : c));
      await saveCategories(updated);
    } catch (err) {
      alert("ছবি আপলোড করা যায়নি।");
    }
    setUploadingCatImage(false);
  };

  const removeCatImage = async (catName) => {
    const updated = categories.map((c) => (c.name === catName ? { ...c, image: "" } : c));
    await saveCategories(updated);
  };

  const submit = async () => {
    if (!form.title.trim() || form.cats.length === 0 || !form.price) {
      alert("শিরোনাম, ক্যাটাগরি এবং দাম দেও");
      return;
    }

    const sizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = form.colors.split(",").map((c) => c.trim()).filter(Boolean);
    const images = form.images.split(",").map((i) => i.trim()).filter(Boolean);

    const payload = {
      id: editing || "prod_" + Date.now(),
      title: form.title.trim(),
      cats: form.cats,
      price: Number(form.price),
      discount: form.discount ? Number(form.discount) : 0,
      sizes: sizes,
      colors: colors,
      desc: form.desc.trim(),
      images,
      videoUrl: form.videoUrl.trim(),
      inStock: form.inStock,
      colorImages,
      sizePricing: Object.keys(sizePriceForm).length > 0 ? sizePriceForm : {},
      colorAdjust: Object.keys(colorAdjustForm).length > 0 ? Object.fromEntries(Object.entries(colorAdjustForm).map(([k, v]) => [k, Number(v) || 0])) : {},
      seed: Math.random(),
    };

    if (editing) {
      const idx = products.findIndex((p) => p.id === editing);
      const updated = [...products];
      updated[idx] = payload;
      await saveProducts(updated);
    } else {
      await saveProducts([...products, payload]);
    }
    resetForm();
  };

  const remove = async (id) => {
    if (confirm("এই প্রোডাক্ট ডিলিট করবে?")) {
      await saveProducts(products.filter((p) => p.id !== id));
    }
  };

  const login = async () => {
    if (!pass.trim()) return;
    setChecking(true);
    setLoginError(false);
    try {
      const result = await adminSignIn(pass);
      if (result) {
        setAuthed(true);
        setPass("");
      } else {
        setLoginError(true);
      }
    } catch (err) {
      setLoginError(true);
    }
    setChecking(false);
  };

  if (!authed) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: PALETTE.card }}>
        <div className="w-80 rounded-2xl p-6" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
          <h2 className="text-lg font-bold mb-4 text-center">অ্যাডমিন লগইন</h2>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            type="password"
            placeholder="পাসওয়ার্ড"
            className="w-full px-3 py-2 rounded-lg border mb-3"
            style={{ borderColor: PALETTE.border }}
          />
          {loginError && <p className="text-xs mb-2" style={{ color: "#C0392B" }}>ভুল পাসওয়ার্ড</p>}
          <button onClick={login} disabled={checking} className="w-full py-2 rounded-lg font-semibold text-white" style={{ background: PALETTE.blue, opacity: checking ? 0.6 : 1 }}>
            {checking ? "চেক করছি..." : "লগইন"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 style={{ fontFamily: "'Baloo Da 2', sans-serif", fontSize: "1.25rem", fontWeight: 700 }}>অ্যাডমিন প্যানেল</h1>
        <button onClick={() => navigate("#/")} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: PALETTE.orangeSoft, color: PALETTE.orange }}>
          শপ দেখো
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: "products", label: "প্রোডাক্ট", icon: ShoppingBag },
          { id: "orders", label: "অর্ডার", icon: ClipboardList },
          { id: "banners", label: "ব্যানার", icon: "🖼️" },
          { id: "categories", label: "ক্যাটাগরি", icon: "📂" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm flex-shrink-0 whitespace-nowrap"
            style={{
              background: tab === t.id ? PALETTE.orange : PALETTE.card,
              color: tab === t.id ? "#fff" : PALETTE.ink,
              border: `1px solid ${tab === t.id ? PALETTE.orange : PALETTE.border}`,
            }}
          >
            {typeof t.icon === "string" ? <span>{t.icon}</span> : <t.icon size={16} />}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <>
          <div className="rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
            <input placeholder="পণ্যের নাম" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-2" style={{ color: PALETTE.muted }}>ক্যাটাগরি বাছাই করো</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const selected = form.cats.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      onClick={() => toggleFormCat(c.name)}
                      className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{
                        background: selected ? PALETTE.blue : PALETTE.card,
                        color: selected ? "#fff" : PALETTE.ink,
                        border: `1px solid ${selected ? PALETTE.blue : PALETTE.border}`,
                      }}
                    >
                      {selected && <Check size={12} />}
                      {c.icon || "🛍️"} {c.name}
                    </button>
                  );
                })}
              </div>
              {form.cats.length === 0 && (
                <p className="text-xs mt-2" style={{ color: PALETTE.orange }}>অন্তত একটি ক্যাটাগরি বাছাই করো</p>
              )}
            </div>
            <input placeholder="দাম (৳)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
            <div>
              <input placeholder="ডিসকাউন্ট প্রাইস (৳, না থাকলে খালি)" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-full px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
              {form.price && form.discount && Number(form.discount) > 0 && Number(form.discount) < Number(form.price) && (
                <p className="text-xs mt-1 font-semibold" style={{ color: PALETTE.orange }}>
                  {Math.round(((Number(form.price) - Number(form.discount)) / Number(form.price)) * 100)}% ছাড় দেখাবে
                </p>
              )}
            </div>
            <input placeholder="সাইজ (কমা দিয়ে, যেমন: S, M, L)" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
            <input placeholder="কালার (কমা দিয়ে)" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />

            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: PALETTE.muted }}>
                ফোন থেকে সরাসরি ছবি আপলোড করো (একাধিক বেছে নিতে পারো)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full text-sm"
              />
              {uploading && <p className="text-xs mt-1" style={{ color: PALETTE.orange }}>আপলোড হচ্ছে...</p>}
            </div>
            <textarea placeholder="অথবা ছবির লিংক এখানে (একাধিক হলে কমা (,) দিয়ে আলাদা করো)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border" rows={2} style={{ borderColor: PALETTE.border }} />
            <textarea placeholder="বিবরণ" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border" rows={2} style={{ borderColor: PALETTE.border }} />
            <input placeholder="YouTube ভিডিও লিংক (অপশনাল)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />

            <div className="col-span-2 flex items-center justify-between rounded-lg p-3" style={{ background: form.inStock ? "#E4F5E9" : "#FCE4E4" }}>
              <span className="text-sm font-semibold" style={{ color: form.inStock ? "#1E8E5A" : "#C0392B" }}>
                {form.inStock ? "স্টকে আছে" : "স্টক নেই"}
              </span>
              <button
                type="button"
                onClick={() => setForm({ ...form, inStock: !form.inStock })}
                className="rounded-full px-3 py-1.5 text-xs font-semibold flex-shrink-0"
                style={{ background: form.inStock ? "#1E8E5A" : "#C0392B", color: "#fff" }}
              >
                {form.inStock ? "স্টক আউট করো" : "স্টক ইন করো"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button onClick={submit} className="px-5 py-2 rounded-full font-semibold text-sm" style={{ background: PALETTE.orange, color: "#fff" }}>
              {editing ? "আপডেট করুন" : "যোগ করুন"}
            </button>
            {editing && <button onClick={resetForm} className="px-5 py-2 rounded-full font-semibold text-sm border" style={{ borderColor: PALETTE.border }}>বাতিল</button>}
          </div>

          <div className="space-y-2">
            {products.map((p) => {
              const outOfStock = p.inStock === false;
              const toggleStock = async () => {
                await saveProducts(products.map((x) => (x.id === p.id ? { ...x, inStock: !x.inStock } : x)));
              };
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
                  <img src={p.images && p.images.length > 0 ? p.images[0] : `https://picsum.photos/seed/${p.seed || p.id}/80/100`} className="w-10 h-12 object-cover rounded" alt={p.title} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.title}</p>
                    <p className="text-xs truncate" style={{ color: PALETTE.muted }}>{productCats(p).join(", ")} • <Taka amount={p.discount || p.price} /></p>
                  </div>
                  <button onClick={toggleStock} className="text-[10px] font-semibold px-2 py-1.5 rounded-full flex-shrink-0" style={{ background: outOfStock ? "#FCE4E4" : "#E4F5E9", color: outOfStock ? "#C0392B" : "#1E8E5A" }}>
                    {outOfStock ? "স্টক নেই" : "স্টকে আছে"}
                  </button>
                  <button onClick={() => copyLink(`#/product/${p.id}`)} className="p-2 rounded-full" style={{ background: PALETTE.orangeSoft }} title="লিংক কপি"><Copy size={14} color={PALETTE.orange} /></button>
                  <button onClick={() => startEdit(p)} className="p-2 rounded-full" style={{ background: "#E4EEF8" }} title="এডিট"><Pencil size={14} color={PALETTE.blue} /></button>
                  <button onClick={() => remove(p.id)} className="p-2 rounded-full" style={{ background: "#FCE4E4" }} title="ডিলিট"><Trash2 size={14} color="#C0392B" /></button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-sm" style={{ color: PALETTE.muted }}>এখনো কোনো অর্ডার আসেনি।</p>}
          {orders.map((o) => {
            const statusOptions = ["পেন্ডিং", "কনফার্ম হয়েছে", "ডেলিভারি হচ্ছে", "ডেলিভার হয়েছে", "বাতিল"];
            const statusColor = {
              "পেন্ডিং": PALETTE.orange,
              "কনফার্ম হয়েছে": PALETTE.blue,
              "ডেলিভারি হচ্ছে": PALETTE.navy,
              "ডেলিভার হয়েছে": "#1E8E5A",
              "বাতিল": "#C0392B",
            }[o.status || "পেন্ডিং"];
            const changeStatus = async (newStatus) => {
              const next = orders.map((x) => (x.id === o.id ? { ...x, status: newStatus } : x));
              await saveOrders(next);
            };
            const startEditNotes = () => {
              setEditingOrderNotes(o.id);
              setOrderNotesForm(o.notes || "");
            };
            const saveOrderNotes = async () => {
              const next = orders.map((x) => (x.id === o.id ? { ...x, notes: orderNotesForm } : x));
              await saveOrders(next);
              setEditingOrderNotes(null);
            };
            return (
              <div key={o.id} className="p-4 rounded-xl" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-sm" style={{ color: PALETTE.blue }}>{o.id}</p>
                  <p className="text-xs" style={{ color: PALETTE.muted }}>{new Date(o.time).toLocaleString("bn-BD")}</p>
                </div>
                <p className="text-sm">{o.name} • {o.phone}</p>
                <p className="text-xs" style={{ color: PALETTE.muted }}>{o.address} ({o.area === "dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"})</p>
                <p className="text-xs mt-1">
                  {o.paymentMethod === "bkash" ? (
                    <span style={{ color: "#E2136E", fontWeight: 600 }}>বিকাশ পেমেন্ট • TrxID: {o.trxId || "দেওয়া হয়নি"}</span>
                  ) : (
                    <span style={{ color: PALETTE.muted }}>ক্যাশ অন ডেলিভারি</span>
                  )}
                </p>

                {/* PRODUCT DETAILS WITH IMAGES */}
                <div className="mt-3 mb-3 p-3 rounded-lg" style={{ background: "#f9f9f9" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: PALETTE.muted }}>📦 অর্ডারকৃত পণ্য:</p>
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 pb-2" style={{ borderBottom: idx < o.items.length - 1 ? `1px solid ${PALETTE.border}` : "none" }}>
                      {it.image && (
                        <img src={it.image} alt={it.title} className="w-10 h-12 object-cover rounded flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{it.title}</p>
                        <p className="text-xs" style={{ color: PALETTE.muted }}>রঙ: {it.color} | সাইজ: {it.size}</p>
                        <p className="text-xs font-bold">
                          <Taka amount={it.price} /> × {it.qty} = <Taka amount={it.price * it.qty} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t" style={{ borderColor: PALETTE.border }}>
                  <span>মোট:</span>
                  <span style={{ color: PALETTE.orange }}><Taka amount={o.total} /></span>
                </div>

                {/* ORDER NOTES */}
                <div className="mt-3 p-2 rounded-lg" style={{ background: "#FFF9E6" }}>
                  {editingOrderNotes === o.id ? (
                    <>
                      <textarea
                        value={orderNotesForm}
                        onChange={(e) => setOrderNotesForm(e.target.value)}
                        placeholder="অর্ডার নোট (কাস্টমার স্পেশাল রিকোয়েস্ট, এডভাইস ইত্যাদি)"
                        className="w-full px-2 py-1 text-xs rounded border"
                        style={{ borderColor: PALETTE.border }}
                        rows={3}
                      />
                      <div className="flex gap-1 mt-1">
                        <button onClick={saveOrderNotes} className="px-2 py-1 text-xs rounded-full font-semibold" style={{ background: PALETTE.orange, color: "#fff" }}>সংরক্ষণ করো</button>
                        <button onClick={() => setEditingOrderNotes(null)} className="px-2 py-1 text-xs rounded-full border font-semibold" style={{ borderColor: PALETTE.border }}>বাতিল</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: PALETTE.orange }}>
                        <FileText size={12} /> নোট
                      </p>
                      <p className="text-xs whitespace-pre-wrap" style={{ color: PALETTE.muted, minHeight: "2rem" }}>
                        {o.notes || "(কোনো নোট নেই)"}
                      </p>
                      <button onClick={startEditNotes} className="text-xs mt-1 font-semibold" style={{ color: PALETTE.blue }}>✏️ এডিট করো</button>
                    </>
                  )}
                </div>

                <div className="mt-3">
                  <label className="text-xs font-medium block mb-1" style={{ color: PALETTE.muted }}>অর্ডার স্ট্যাটাস</label>
                  <select
                    value={o.status || "পেন্ডিং"}
                    onChange={(e) => changeStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm font-semibold"
                    style={{ borderColor: PALETTE.border, color: statusColor }}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "banners" && (
        <div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
            <label className="text-xs font-medium block mb-1" style={{ color: PALETTE.muted }}>নতুন ব্যানার ছবি আপলোড করো (একাধিক বেছে নিতে পারো)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleBannerUpload}
              disabled={uploadingBanner}
              className="w-full text-sm"
            />
            {uploadingBanner && <p className="text-xs mt-1" style={{ color: PALETTE.orange }}>আপলোড হচ্ছে...</p>}
          </div>
          <div className="space-y-3">
            {banners.map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
                <img src={b} alt={`banner-${i}`} className="w-24 h-12 object-cover rounded" />
                <span className="text-xs flex-1" style={{ color: PALETTE.muted }}>ব্যানার #{i + 1}</span>
                <button onClick={() => removeBanner(i)} className="p-2 rounded-full" style={{ background: "#FCE4E4" }} title="ডিলিট">
                  <Trash2 size={14} color="#C0392B" />
                </button>
              </div>
            ))}
            {banners.length === 0 && <p className="text-sm" style={{ color: PALETTE.muted }}>কোনো ব্যানার নেই — উপরে থেকে আপলোড করো।</p>}
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
            <h3 className="font-semibold mb-3">{catEditing ? "ক্যাটাগরি এডিট করুন" : "নতুন ক্যাটাগরি যোগ করুন"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="ক্যাটাগরির নাম" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
              <input placeholder="ইমোজি আইকন (অপশনাল, যেমন: 👕)" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border" style={{ borderColor: PALETTE.border }} />
              <div className="col-span-2 flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: PALETTE.muted }}>ক্যাটাগরির রঙ</label>
                <input type="color" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} className="w-10 h-8 rounded border" style={{ borderColor: PALETTE.border }} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={submitCategory} className="px-5 py-2 rounded-full font-semibold text-sm" style={{ background: PALETTE.orange, color: "#fff" }}>
                {catEditing ? "আপডেট করুন" : "যোগ করুন"}
              </button>
              {catEditing && <button onClick={resetCatForm} className="px-5 py-2 rounded-full font-semibold text-sm border" style={{ borderColor: PALETTE.border }}>বাতিল</button>}
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl overflow-hidden flex-shrink-0" style={{ background: PALETTE.orangeSoft }}>
                  {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" /> : (c.icon || "🛍️")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate flex items-center gap-2">
                    <span className="inline-block rounded-full flex-shrink-0" style={{ width: 10, height: 10, background: c.color || PALETTE.orange }} />
                    {c.name}
                  </p>
                  <label className="text-xs" style={{ color: PALETTE.blue }}>
                    ব্যানার ছবি বসাও (হোমপেজে ক্লিকযোগ্য ব্যানার হবে)
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCatImageUpload(c.name, e.target.files[0])} disabled={uploadingCatImage} />
                  </label>
                  {c.image && (
                    <button onClick={() => removeCatImage(c.name)} className="text-xs ml-2" style={{ color: "#C0392B" }}>
                      ব্যানার সরাও
                    </button>
                  )}
                  {uploadingCatImage && <span className="text-xs ml-2" style={{ color: PALETTE.orange }}>আপলোড হচ্ছে...</span>}
                </div>
                <button onClick={() => startCatEdit(c)} className="p-2 rounded-full" style={{ background: "#E4EEF8" }} title="এডিট"><Pencil size={14} color={PALETTE.blue} /></button>
                <button onClick={() => removeCategory(c.name)} className="p-2 rounded-full" style={{ background: "#FCE4E4" }} title="ডিলিট"><Trash2 size={14} color="#C0392B" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============= CATEGORIES STRIP =============

function InfiniteCategoryStrip({ products, categories, navigate }) {
  const [items, setItems] = useState(categories);
  const pausedRef = useRef(false);
  const [phase, setPhase] = useState(0);
  const [instantJump, setInstantJump] = useState(false);
  const dragStartX = useRef(null);
  const draggingRef = useRef(false);

  const CARD_WIDTH = 76;
  const GAP = 16;
  const STEP = CARD_WIDTH + GAP;

  useEffect(() => { setItems(categories); }, [categories]);

  const stepForward = () => {
    if (items.length < 2) return;
    setInstantJump(false);
    setPhase(1);
  };
  const stepBackward = () => {
    if (items.length < 2) return;
    setInstantJump(false);
    setPhase(-1);
  };

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      stepForward();
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (phase === 0) return;
    const t = setTimeout(() => {
      setInstantJump(true);
      setItems((prev) => {
        if (prev.length < 2) return prev;
        return phase === 1 ? [...prev.slice(1), prev[0]] : [prev[prev.length - 1], ...prev.slice(0, -1)];
      });
      setPhase(0);
    }, 400);
    return () => clearTimeout(t);
  }, [phase]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const onTouchStart = (e) => {
    pause();
    draggingRef.current = true;
    dragStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (draggingRef.current && dragStartX.current !== null) {
      const delta = e.changedTouches[0].clientX - dragStartX.current;
      if (delta < -30) stepForward();
      else if (delta > 30) stepBackward();
    }
    draggingRef.current = false;
    dragStartX.current = null;
    resume();
  };

  const extended = items.length > 0 ? [items[items.length - 1], ...items, items[0]] : items;
  const restingIndex = 1;
  const targetIndex = restingIndex + phase;

  return (
    <div
      className="py-4 overflow-hidden"
      style={{ background: PALETTE.card }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={pause}
      onMouseUp={resume}
      onMouseLeave={resume}
    >
      <div
        className="flex gap-4"
        style={{
          transform: `translateX(-${targetIndex * STEP}px)`,
          transition: instantJump ? "none" : "transform 0.4s ease",
        }}
      >
        {extended.map((cat, i) => {
          const count = products.filter((p) => productCats(p).includes(cat.name)).length;
          const isActive = i === restingIndex;
          return (
            <button
              key={cat.name + i}
              onClick={() => navigate(`#/category/${slugify(cat.name)}`)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
              style={{ width: CARD_WIDTH }}
            >
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shadow-sm overflow-hidden"
                style={{
                  background: cat.color ? `${cat.color}33` : PALETTE.orangeSoft,
                  border: isActive ? "2px solid #E53935" : "2px solid transparent",
                  transition: instantJump ? "none" : "border-color 0.3s ease",
                }}
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  cat.icon || "🛍️"
                )}
              </div>
              <span className="text-[11px] text-center leading-tight" style={{ color: PALETTE.ink }}>
                {cat.name}
              </span>
              <span className="text-[10px]" style={{ color: PALETTE.muted }}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
