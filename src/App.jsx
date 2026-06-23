import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Products from './components/Products'
import ProductDetail from './components/ProductDetail'
import Categories from './components/Categories'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Admin from './components/Admin'
import CartModal from './components/CartModal'
import WholesaleShowcase from './components/WholesaleShowcase'
import './App.css'

function App() {
  const isAdmin = window.location.pathname.toLowerCase() === '/admin';
  const isWholesale = window.location.pathname.toLowerCase() === '/atacado';

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const getSessionId = () => {
    let sid = sessionStorage.getItem('acm_session_id');
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem('acm_session_id', sid);
    }
    return sid;
  };

  useEffect(() => {
    fetch('/api/cart', { headers: { 'x-session-id': getSessionId() } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCart(data); setCartLoaded(true); })
      .catch(() => setCartLoaded(true));
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
      body: JSON.stringify(cart)
    }).catch(() => {});
  }, [cart, cartLoaded]);

  useEffect(() => {
    if (isAdmin) return;
    fetch('/api/analytics?type=visit', { method: 'POST' }).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('p');
    if (!pid) return;

    const openProduct = (product) => {
      const tryOpen = (attempt = 0) => {
        if (attempt > 30) return;
        const section = document.getElementById('produtos');
        const card = document.querySelector(`[data-pid="${pid}"]`);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          setSelectedProduct(product);
          if (card) {
            card.style.borderColor = 'var(--color-gold)';
            card.style.boxShadow = '0 0 24px rgba(214,181,109,0.3)';
          }
        } else {
          setTimeout(() => tryOpen(attempt + 1), 300);
        }
      };
      setTimeout(() => tryOpen(), 300);
    };

    fetch(`/api/products`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.length) return;
        const foundDb = data.find(p => p.id === pid);
        if (foundDb) openProduct(foundDb);
      })
      .catch(err => console.error('Erro ao buscar produto da API:', err));
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id);
      if (exists) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const decrementCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id);
      if (!exists) return prev;
      if (exists.quantity <= 1) return prev.filter(i => i.product.id !== product.id);
      return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const clearCart = () => setCart([]);

  const handleCategoryClick = (category) => setFilterCategory(category);

  if (isAdmin) return <Admin />;
  if (isWholesale) return <WholesaleShowcase addToCart={addToCart} />;

  return (
    <div className="App">
      <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} onCartClick={() => setShowCart(true)} />
      <main>
        <Hero />
        <Products onSelectProduct={setSelectedProduct} filterCategory={filterCategory} addToCart={addToCart} />
        <Categories onCategoryClick={handleCategoryClick} />
        <About />
        <Contact />
      </main>
      <Footer />
      <AnimatePresence>
        {selectedProduct && !showCart && (
          <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} addToCart={addToCart} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCart && (
          <CartModal cart={cart} onClose={() => setShowCart(false)} onRemove={removeFromCart} onClear={clearCart} addToCart={addToCart} decrementCart={decrementCart} />
        )}
      </AnimatePresence>
      <motion.a
        href={"https://wa.me/5551985458900?text=" + encodeURIComponent('Ola! Vim pelo site A.C.M Store e gostaria de mais informacoes.')}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1, boxShadow: '0 10px 30px rgba(37,211,102,0.5)' }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{
          position: 'fixed', bottom: '30px', right: '30px', background: '#25D366',
          color: 'white', width: '60px', height: '60px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 1001,
          transition: 'var(--transition-smooth)'
        }}
      >
        <span role="img" aria-label="whatsapp">💬</span>
      </motion.a>
    </div>
  )
}

export default App
