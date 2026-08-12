import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Firebase Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'admin' | 'order-done'
  
  // Product Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrlsText, setImageUrlsText] = useState('');
  
  // Order Form State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Active Image Index for each product slider
  const [sliderIndices, setSliderIndices] = useState({});

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setProducts(list);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto Slide Effect for product images
  useEffect(() => {
    const interval = setInterval(() => {
      setSliderIndices((prev) => {
        const next = { ...prev };
        products.forEach((p) => {
          const imgs = p.images && p.images.length > 0 ? p.images : [p.image || 'https://via.placeholder.com/400'];
          const currentIndex = prev[p.id] || 0;
          next[p.id] = (currentIndex + 1) % imgs.length;
        });
        return next;
      });
    }, 3500); // changes image every 3.5 seconds

    return () => clearInterval(interval);
  }, [products]);

  // Admin Login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passcode === '2lsbazar') {
      setIsAdmin(true);
      alert('এডমিন প্যানেলে স্বাগতম!');
    } else {
      alert('ভুল পাসকোড!');
    }
  };

  // Add New Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!title || !price) {
      alert('অনুগ্রহ করে পণ্যের নাম এবং দাম লিখুন।');
      return;
    }

    // Process multiple image links (separated by newline or comma)
    const urls = imageUrlsText
      .split(/[
,]+/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const newProduct = {
      title,
      price: Number(price),
      description,
      images: urls.length > 0 ? urls : ['https://via.placeholder.com/400'],
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'products'), newProduct);
      alert('প্রোডাক্ট সফলভাবে যুক্ত হয়েছে!');
      setTitle('');
      setPrice('');
      setDescription('');
      setImageUrlsText('');
      fetchProducts();
    } catch (err) {
      alert('প্রোডাক্ট যুক্ত করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (window.confirm('আপনি কি এই প্রোডাক্টটি ডিলিট করতে চান?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (err) {
        alert('ডিলিট করা যায়নি!');
      }
    }
  };

  // Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert('সকল সঠিক তথ্য দিন!');
      return;
    }

    const orderId = '2LS' + Math.floor(100000 + Math.random() * 900000);
    const orderData = {
      orderId,
      product: selectedProduct,
      customerName,
      customerPhone,
      customerAddress,
      status: 'Pending',
      createdAt: new Date().toLocaleString('bn-BD'),
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      setPlacedOrder(orderData);
      setActiveTab('order-done');
      setSelectedProduct(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    } catch (err) {
      alert('অর্ডার করা সম্ভব হয়নি!');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '50px' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1e293b', color: '#fff', padding: '15px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '1px' }}>🛒 2LS Bazar</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>সহজ ও নির্ভরযোগ্য কেনাকাটা</p>
      </header>

      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '12px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('shop')} 
          style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', backgroundColor: activeTab === 'shop' ? '#2563eb' : '#e2e8f0', color: activeTab === 'shop' ? '#fff' : '#334155', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🛍️ শপ
        </button>
        <button 
          onClick={() => setActiveTab('admin')} 
          style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', backgroundColor: activeTab === 'admin' ? '#2563eb' : '#e2e8f0', color: activeTab === 'admin' ? '#fff' : '#334155', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ⚙️ এডমিন প্যানেল
        </button>
      </nav>

      <main style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
        
        {/* SHOP VIEW */}
        {activeTab === 'shop' && (
          <div>
            <h2 style={{ color: '#0f172a', textAlign: 'center', marginBottom: '20px' }}>আমাদের প্রোডাক্টসমূহ</h2>

            {loading ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>প্রোডাক্ট লোড হচ্ছে...</p>
            ) : products.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>কোনো প্রোডাক্ট পাওয়া যায়নি!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {products.map((p) => {
                  const imgs = p.images && p.images.length > 0 ? p.images : [p.image || 'https://via.placeholder.com/400'];
                  const currentIndex = sliderIndices[p.id] || 0;

                  return (
                    <div key={p.id} style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                      
                      {/* Image Slider */}
                      <div style={{ position: 'relative', width: '100%', height: '260px', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                        <img 
                          src={imgs[currentIndex]} 
                          alt={p.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.5s ease-in-out' }} 
                        />
                        
                        {/* Dots Indicator */}
                        {imgs.length > 1 && (
                          <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px' }}>
                            {imgs.map((_, idx) => (
                              <span 
                                key={idx} 
                                onClick={() => setSliderIndices({ ...sliderIndices, [p.id]: idx })}
                                style={{ 
                                  width: idx === currentIndex ? '12px' : '8px', 
                                  height: '8px', 
                                  borderRadius: '4px', 
                                  backgroundColor: idx === currentIndex ? '#2563eb' : 'rgba(255,255,255,0.7)', 
                                  cursor: 'pointer',
                                  transition: 'all 0.3s'
                                }} 
                              />
                            ))}
                          </div>
                        )}

                        {/* Image Counter Badge */}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 8px', borderRadius: '10px', fontSize: '11px' }}>
                          {currentIndex + 1} / {imgs.length}
                        </div>
                      </div>

                      {/* Details */}
                      <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>{p.title}</h3>
                          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b', whiteSpace: 'pre-line' }}>{p.description}</p>
                        </div>
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb', marginBottom: '12px' }}>৳ {p.price}</div>
                          <button 
                            onClick={() => setSelectedProduct(p)} 
                            style={{ width: '100%', padding: '10px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                          >
                            অর্ডার করুন
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ORDER MODAL / FORM */}
        {selectedProduct && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>অর্ডার বিবরণী</h3>
              <p style={{ color: '#2563eb', fontWeight: 'bold' }}>পণ্য: {selectedProduct.title} (৳ {selectedProduct.price})</p>
              
              <form onSubmit={handlePlaceOrder}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>আপনার নাম:</label>
                  <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="সম্পূর্ণ নাম লিখুন" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>মোবাইল নম্বর:</label>
                  <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="017xxxxxxxx" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>সম্পূর্ণ ঠিকানা:</label>
                  <textarea required value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="গ্রাম/রাস্তা, থানা, জেলা..." rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}></textarea>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>কনফার্ম করুন</button>
                  <button type="button" onClick={() => setSelectedProduct(null)} style={{ padding: '10px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>বাতিল</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ORDER SUCCESS VIEW */}
        {activeTab === 'order-done' && placedOrder && (
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#16a34a' }}>🎉 আপনার অর্ডারটি সফল হয়েছে!</h2>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>অর্ডার আইডি: #{placedOrder.orderId}</p>
            <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', margin: '20px 0', fontSize: '14px' }}>
              <p style={{ margin: '5px 0' }}><strong>পণ্য:</strong> {placedOrder.product.title}</p>
              <p style={{ margin: '5px 0' }}><strong>মূল্য:</strong> ৳ {placedOrder.product.price}</p>
              <p style={{ margin: '5px 0' }}><strong>গ্রাহকের নাম:</strong> {placedOrder.customerName}</p>
              <p style={{ margin: '5px 0' }}><strong>মোবাইল:</strong> {placedOrder.customerPhone}</p>
              <p style={{ margin: '5px 0' }}><strong>ঠিকানা:</strong> {placedOrder.customerAddress}</p>
            </div>
            <button onClick={() => setActiveTab('shop')} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              আরও কেনাকাটা করুন
            </button>
          </div>
        )}

        {/* ADMIN PANEL */}
        {activeTab === 'admin' && (
          <div>
            {!isAdmin ? (
              <div style={{ maxWidth: '350px', margin: '40px auto', backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a' }}>এডমিন লগইন</h3>
                <form onSubmit={handleAdminLogin}>
                  <input 
                    type="password" 
                    placeholder="পাসকোড লিখুন (ডিফল্ট: 2lsbazar)" 
                    value={passcode} 
                    onChange={(e) => setPasscode(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                  />
                  <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>লগইন করুন</button>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ marginTop: 0, color: '#0f172a' }}>নতুন প্রোডাক্ট যোগ করুন (১০+ ছবি সাপোর্ট)</h3>
                  <form onSubmit={handleAddProduct}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>পণ্যের নাম:</label>
                      <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: Baby Dress" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>মূল্য (টাকা):</label>
                      <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="যেমন: 500" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>বিবরণ:</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="পণ্যের বিবরণ..." rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}></textarea>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>ছবির লিংকসমূহ (প্রতি লাইনে একটি করে অথবা কমা দিয়ে লিখুন - ১০+ ছবি):</label>
                      <textarea 
                        required 
                        value={imageUrlsText} 
                        onChange={(e) => setImageUrlsText(e.target.value)} 
                        placeholder="https://image1.jpg&#10;https://image2.jpg&#10;https://image3.jpg" 
                        rows="5" 
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '12px' }}
                      ></textarea>
                      <small style={{ color: '#64748b' }}>* যেকোনো ইমেজের ডিরেক্ট লিংক (ImgBB, Firebase, Drive ইত্যাদি) এখানে লাইন বাই লাইন পেস্ট করতে পারবেন।</small>
                    </div>
                    <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>প্রোডাক্ট যোগ করুন</button>
                  </form>
                </div>

                <h3 style={{ color: '#0f172a' }}>বর্তমান প্রোডাক্টসমূহ</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {products.map((p) => (
                    <div key={p.id} style={{ backgroundColor: '#fff', padding: '12px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                      <div>
                        <strong>{p.title}</strong> — ৳{p.price} ({p.images ? p.images.length : 1}টি ছবি)
                      </div>
                      <button onClick={() => handleDeleteProduct(p.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>ডিলিট</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
