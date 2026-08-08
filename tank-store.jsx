import React, { useState, useEffect, useCallback } from "react";
import { Lock, Unlock, Plus, Pencil, Trash2, X, Phone, Landmark, Wallet, Droplets, Check } from "lucide-react";

const CURRENCY = "KES";

const emptyProduct = {
  name: "",
  capacity: "",
  price: "",
  imageUrl: "",
  description: "",
};

const emptyPayment = {
  phone: "",
  bank: "",
  binance: "",
};

function fmtMoney(n) {
  const num = Number(n) || 0;
  return `${CURRENCY} ${num.toLocaleString()}`;
}

// Decorative capacity gauge — a filled tank silhouette with a liter readout.
function TankGauge({ capacityLabel }) {
  return (
    <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
      <svg viewBox="0 0 76 76" width="76" height="76">
        <circle cx="38" cy="38" r="34" fill="#EDE9E1" stroke="#4A5560" strokeWidth="2" />
        <circle cx="38" cy="38" r="34" fill="none" stroke="#1B4B66" strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
        <path d="M 38 12 A 26 26 0 1 1 12 38" fill="none" stroke="#E8590C" strokeWidth="4" strokeLinecap="round" />
        <foreignObject x="8" y="8" width="60" height="60">
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#1B1F23",
            }}
          >
            <Droplets size={14} color="#1B4B66" />
            <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, textAlign: "center" }}>
              {capacityLabel || "—"}
            </span>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}

export default function TankStore() {
  const [products, setProducts] = useState([]);
  const [payment, setPayment] = useState(emptyPayment);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(null); // null = unknown yet
  const [showLogin, setShowLogin] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginConfirm, setLoginConfirm] = useState("");
  const [loginError, setLoginError] = useState("");

  const [editingProduct, setEditingProduct] = useState(null); // product object or null
  const [showProductForm, setShowProductForm] = useState(false);
  const [form, setForm] = useState(emptyProduct);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const [orderProduct, setOrderProduct] = useState(null);
  const [toast, setToast] = useState("");

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, payRes, passRes] = await Promise.allSettled([
        window.storage.get("products", true),
        window.storage.get("payment-info", true),
        window.storage.get("admin-passcode", true),
      ]);
      if (pRes.status === "fulfilled" && pRes.value) {
        setProducts(JSON.parse(pRes.value.value));
      }
      if (payRes.status === "fulfilled" && payRes.value) {
        setPayment(JSON.parse(payRes.value.value));
      }
      if (passRes.status === "fulfilled" && passRes.value) {
        setHasPasscode(true);
      } else {
        setHasPasscode(false);
      }
    } catch (e) {
      console.error("Load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProducts = async (next) => {
    setProducts(next);
    try {
      await window.storage.set("products", JSON.stringify(next), true);
    } catch (e) {
      console.error("Save products failed", e);
      flash("Couldn't save — try again");
    }
  };

  const savePayment = async (next) => {
    setPayment(next);
    try {
      await window.storage.set("payment-info", JSON.stringify(next), true);
    } catch (e) {
      console.error("Save payment failed", e);
      flash("Couldn't save — try again");
    }
  };

  // --- Admin login / passcode setup ---
  const openLogin = () => {
    setLoginInput("");
    setLoginConfirm("");
    setLoginError("");
    setShowLogin(true);
  };

  const submitLogin = async () => {
    if (hasPasscode === false) {
      if (loginInput.length < 4) {
        setLoginError("Use at least 4 characters");
        return;
      }
      if (loginInput !== loginConfirm) {
        setLoginError("Codes don't match");
        return;
      }
      try {
        await window.storage.set("admin-passcode", loginInput, true);
        setHasPasscode(true);
        setIsAdmin(true);
        setShowLogin(false);
        flash("Admin code set — you're in");
      } catch (e) {
        setLoginError("Couldn't save the code — try again");
      }
      return;
    }
    try {
      const res = await window.storage.get("admin-passcode", true);
      if (res && res.value === loginInput) {
        setIsAdmin(true);
        setShowLogin(false);
      } else {
        setLoginError("That code isn't right");
      }
    } catch (e) {
      setLoginError("Couldn't check the code — try again");
    }
  };

  // --- Product form ---
  const openAddProduct = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setShowProductForm(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setForm(p);
    setShowProductForm(true);
  };

  const submitProduct = async () => {
    if (!form.name.trim() || !form.price) return;
    if (editingProduct) {
      const next = products.map((p) => (p.id === editingProduct.id ? { ...form, id: editingProduct.id } : p));
      await saveProducts(next);
      flash("Listing updated");
    } else {
      const next = [...products, { ...form, id: Date.now().toString() }];
      await saveProducts(next);
      flash("Listing added");
    }
    setShowProductForm(false);
  };

  const deleteProduct = async (id) => {
    const next = products.filter((p) => p.id !== id);
    await saveProducts(next);
    flash("Listing removed");
  };

  // --- Payment form ---
  const openPaymentForm = () => {
    setPaymentForm(payment);
    setShowPaymentForm(true);
  };

  const submitPayment = async () => {
    await savePayment(paymentForm);
    setShowPaymentForm(false);
    flash("Payment details updated");
  };

  const hasAnyPayment = payment.phone || payment.bank || payment.binance;

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#EDE9E1",
        color: "#1B1F23",
        minHeight: "100%",
        width: "100%",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        .ts-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1.5px solid #4A5560;
          border-radius: 4px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          background: #fff;
          color: #1B1F23;
        }
        .ts-input:focus { outline: 2px solid #2E86AB; outline-offset: 1px; }
        .ts-label { font-size: 12px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; color: #4A5560; display: block; margin-bottom: 4px; }
        .ts-btn { cursor: pointer; border: none; font-family: 'Inter', sans-serif; font-weight: 600; border-radius: 4px; transition: transform 0.08s ease, opacity 0.15s ease; }
        .ts-btn:active { transform: scale(0.97); }
        .ts-btn-primary { background: #E8590C; color: #fff; padding: 11px 20px; font-size: 14px; }
        .ts-btn-primary:hover { opacity: 0.92; }
        .ts-btn-outline { background: transparent; color: #1B4B66; border: 1.5px solid #1B4B66; padding: 9px 16px; font-size: 13px; }
        .ts-btn-outline:hover { background: rgba(27,75,102,0.06); }
        .ts-card-btn { background: #fff; border: 1px solid #d8d3c8; padding: 6px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .ts-card-btn:hover { background: #f4f1ea; }
      `}</style>

      {/* Header */}
      <header
        style={{
          background: "#1B4B66",
          color: "#fff",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Droplets size={26} color="#E8590C" />
          <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, letterSpacing: "0.01em" }}>
            TANKYARD
          </span>
        </div>
        <button
          className="ts-btn"
          onClick={() => (isAdmin ? setIsAdmin(false) : openLogin())}
          style={{
            background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.4)",
            color: "#fff",
            padding: "8px 14px",
            fontSize: 13,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
          {isAdmin ? "Admin mode" : "Seller login"}
        </button>
      </header>

      {/* Hero */}
      <section style={{ background: "#1B4B66", color: "#fff", padding: "40px 24px 56px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.12em", color: "#7FB3D5", margin: "0 0 10px", textTransform: "uppercase" }}>
            Water & storage tanks
          </p>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 1.1, margin: "0 0 14px", maxWidth: 640 }}>
            Built to hold. Priced to move.
          </h1>
          <p style={{ fontSize: 15, color: "#D6E4EC", maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
            Browse current stock and capacities below, then reach out directly to place an order.
          </p>
        </div>
      </section>

      {/* Products */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, margin: 0 }}>Available tanks</h2>
          {isAdmin && (
            <button className="ts-btn ts-btn-primary" onClick={openAddProduct} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={16} /> Add tank
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: "#4A5560", fontSize: 14 }}>Loading stock…</p>
        ) : products.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #4A5560", borderRadius: 8, padding: "36px 20px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 16, margin: "0 0 6px" }}>No tanks listed yet</p>
            <p style={{ color: "#4A5560", fontSize: 14, margin: 0 }}>
              {isAdmin ? "Add your first tank to get the yard open." : "Check back soon — new stock is on the way."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: "#fff", border: "1px solid #d8d3c8", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 150, background: "#DDD7C9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Droplets size={40} color="#B4B2A9" />
                  )}
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <TankGauge capacityLabel={p.capacity} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: "#E8590C", margin: 0 }}>
                        {fmtMoney(p.price)}
                      </p>
                    </div>
                  </div>
                  {p.description && (
                    <p style={{ fontSize: 13, color: "#4A5560", lineHeight: 1.5, margin: 0, flex: 1 }}>{p.description}</p>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button className="ts-btn ts-btn-primary" style={{ flex: 1 }} onClick={() => setOrderProduct(p)}>
                      Order
                    </button>
                    {isAdmin && (
                      <>
                        <button className="ts-card-btn" onClick={() => openEditProduct(p)} aria-label="Edit">
                          <Pencil size={16} color="#1B4B66" />
                        </button>
                        <button className="ts-card-btn" onClick={() => deleteProduct(p.id)} aria-label="Delete">
                          <Trash2 size={16} color="#993C1D" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payment info */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px 48px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18, margin: 0 }}>How to pay</h2>
          {isAdmin && (
            <button className="ts-btn ts-btn-outline" onClick={openPaymentForm}>
              Edit payment details
            </button>
          )}
        </div>
        {!hasAnyPayment ? (
          <p style={{ color: "#4A5560", fontSize: 14 }}>
            {isAdmin ? "Add a phone number, bank, or Binance account so buyers know how to pay." : "Payment details will appear here soon."}
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {payment.phone && (
              <div style={{ background: "#fff", border: "1px solid #d8d3c8", borderRadius: 8, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Phone size={18} color="#1B4B66" />
                <div>
                  <p style={{ fontSize: 12, color: "#4A5560", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Phone / mobile money</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, margin: 0 }}>{payment.phone}</p>
                </div>
              </div>
            )}
            {payment.bank && (
              <div style={{ background: "#fff", border: "1px solid #d8d3c8", borderRadius: 8, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Landmark size={18} color="#1B4B66" />
                <div>
                  <p style={{ fontSize: 12, color: "#4A5560", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Bank account</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, margin: 0, whiteSpace: "pre-line" }}>{payment.bank}</p>
                </div>
              </div>
            )}
            {payment.binance && (
              <div style={{ background: "#fff", border: "1px solid #d8d3c8", borderRadius: 8, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Wallet size={18} color="#1B4B66" />
                <div>
                  <p style={{ fontSize: 12, color: "#4A5560", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Binance</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, margin: 0 }}>{payment.binance}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- Order modal --- */}
      {orderProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(27,31,35,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 17, margin: 0 }}>{orderProduct.name}</h3>
              <button onClick={() => setOrderProduct(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#E8590C", margin: "0 0 14px" }}>
              {fmtMoney(orderProduct.price)}
            </p>
            {hasAnyPayment ? (
              <>
                <p style={{ fontSize: 13, color: "#4A5560", margin: "0 0 10px" }}>Reach out using any of the details below to place your order:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {payment.phone && (
                    <div style={{ fontSize: 14, display: "flex", gap: 8, alignItems: "center" }}>
                      <Phone size={15} color="#1B4B66" /> {payment.phone}
                    </div>
                  )}
                  {payment.bank && (
                    <div style={{ fontSize: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <Landmark size={15} color="#1B4B66" style={{ marginTop: 2 }} /> <span style={{ whiteSpace: "pre-line" }}>{payment.bank}</span>
                    </div>
                  )}
                  {payment.binance && (
                    <div style={{ fontSize: 14, display: "flex", gap: 8, alignItems: "center" }}>
                      <Wallet size={15} color="#1B4B66" /> {payment.binance}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: "#4A5560" }}>Payment details aren't set up yet — contact the seller directly.</p>
            )}
          </div>
        </div>
      )}

      {/* --- Login modal --- */}
      {showLogin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(27,31,35,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: "100%", maxWidth: 340 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 16, margin: 0 }}>
                {hasPasscode === false ? "Set your seller code" : "Seller login"}
              </h3>
              <button onClick={() => setShowLogin(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            {hasPasscode === false && (
              <p style={{ fontSize: 12, color: "#4A5560", margin: "0 0 12px", lineHeight: 1.5 }}>
                No code exists yet — the first one you enter becomes the code that unlocks editing from now on. Anyone with this code can edit the store, and it isn't strongly encrypted, so don't reuse a password you use elsewhere.
              </p>
            )}
            <label className="ts-label">{hasPasscode === false ? "New code" : "Seller code"}</label>
            <input
              className="ts-input"
              type="password"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              style={{ marginBottom: hasPasscode === false ? 10 : 14 }}
            />
            {hasPasscode === false && (
              <>
                <label className="ts-label">Confirm code</label>
                <input
                  className="ts-input"
                  type="password"
                  value={loginConfirm}
                  onChange={(e) => setLoginConfirm(e.target.value)}
                  style={{ marginBottom: 14 }}
                />
              </>
            )}
            {loginError && <p style={{ color: "#993C1D", fontSize: 13, margin: "0 0 10px" }}>{loginError}</p>}
            <button className="ts-btn ts-btn-primary" style={{ width: "100%" }} onClick={submitLogin}>
              {hasPasscode === false ? "Set code and enter" : "Enter"}
            </button>
          </div>
        </div>
      )}

      {/* --- Product form modal --- */}
      {showProductForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(27,31,35,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16, overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: "100%", maxWidth: 420, margin: "24px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 16, margin: 0 }}>
                {editingProduct ? "Edit tank" : "Add tank"}
              </h3>
              <button onClick={() => setShowProductForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="ts-label">Name</label>
                <input className="ts-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Poly water tank" />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="ts-label">Capacity</label>
                  <input className="ts-input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="5000 L" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="ts-label">Price ({CURRENCY})</label>
                  <input className="ts-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="45000" />
                </div>
              </div>
              <div>
                <label className="ts-label">Image URL (optional)</label>
                <input className="ts-input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="ts-label">Description (optional)</label>
                <textarea
                  className="ts-input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Condition, material, delivery notes..."
                />
              </div>
              <button className="ts-btn ts-btn-primary" style={{ marginTop: 4 }} onClick={submitProduct}>
                {editingProduct ? "Save changes" : "Add tank"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Payment form modal --- */}
      {showPaymentForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(27,31,35,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 16, margin: 0 }}>Payment details</h3>
              <button onClick={() => setShowPaymentForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="ts-label">Phone / mobile money number</label>
                <input className="ts-input" value={paymentForm.phone} onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })} placeholder="+254 7xx xxx xxx" />
              </div>
              <div>
                <label className="ts-label">Bank account</label>
                <textarea
                  className="ts-input"
                  rows={2}
                  value={paymentForm.bank}
                  onChange={(e) => setPaymentForm({ ...paymentForm, bank: e.target.value })}
                  placeholder="Bank name, account name, account number"
                />
              </div>
              <div>
                <label className="ts-label">Binance account / ID</label>
                <input className="ts-input" value={paymentForm.binance} onChange={(e) => setPaymentForm({ ...paymentForm, binance: e.target.value })} placeholder="Binance Pay ID or email" />
              </div>
              <button className="ts-btn ts-btn-primary" style={{ marginTop: 4 }} onClick={submitPayment}>
                Save payment details
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1B1F23", color: "#fff", padding: "10px 18px", borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center", gap: 8, zIndex: 60 }}>
          <Check size={14} /> {toast}
        </div>
      )}
    </div>
  );
}
