import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function getFirstImage(p) {
  if (p.images) {
    try { const arr = JSON.parse(p.images); if (Array.isArray(arr) && arr.length > 0) return arr[0]; } catch {}
  }
  return p.image || '';
}

const mq = window.matchMedia('(max-width: 768px)');

const CartModal = ({ cart, onClose, onRemove, onClear, addToCart, decrementCart }) => {
  const [mobile, setMobile] = useState(mq.matches);
  useEffect(() => {
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const scrollY = window.__modalScrollY !== undefined ? window.__modalScrollY : window.scrollY;
    window.__modalScrollY = undefined;
    window.__modalOpen = true;
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.width = '100vw';
    return () => {
      window.__modalOpen = false;
      document.documentElement.style.overflowY = '';
      document.body.style.width = '';
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    };
  }, []);

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handleQuote = () => {
    const lines = cart.map((item, idx) =>
      `${idx + 1}. ${item.product.name} — ${item.product.brand} (${item.quantity} unid.)\n   https://a-c-m-store.vercel.app/?p=${item.product.id}`
    );
    const msg = encodeURIComponent(
      `Ola! Vim pelo site A.C.M Store. Gostaria de solicitar orcamento para os seguintes produtos:\n\n${lines.join('\n')}\n\n📦 Envio para todo o Brasil\n🛒 Parcelamento em ate 6x sem juros`
    );
    window.open(`https://wa.me/5551985458900?text=${msg}`, '_blank');
    onClear();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.95)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}
      onClick={onClose}
    >
      <motion.div
        className="glass"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: mobile ? '92%' : '600px', width: '100%', borderRadius: '12px',
          padding: mobile ? '1rem' : '2rem', position: 'relative', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(214,181,109,0.2)' }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: 'absolute', top: '10px', right: '15px',
            background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
            fontSize: '1.5rem', cursor: 'pointer', width: '35px', height: '35px',
            borderRadius: '50%', zIndex: 1
          }}
        >
          ×
        </motion.button>

        <h2 style={{ color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Meu Carrinho ({totalItems})</h2>

        {cart.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>Nenhum produto adicionado.</p>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
            <AnimatePresence>
              {cart.map(item => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 0', borderBottom: '1px solid var(--glass-border)' }}
                >
                  <img src={getFirstImage(item.product)} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#111315', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ color: 'white', fontSize: '0.85rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</strong>
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{item.product.brand}</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#15181C', borderRadius: '6px', padding: '0.2rem' }}>
                    <motion.button
                      onClick={() => decrementCart(item.product)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{ background: 'none', border: 'none', color: 'white', fontSize: '1rem', cursor: 'pointer', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      −
                    </motion.button>
                    <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>{item.quantity}</span>
                    <motion.button
                      onClick={() => addToCart(item.product)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{ background: 'none', border: 'none', color: 'white', fontSize: '1rem', cursor: 'pointer', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      +
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={() => onRemove(item.product.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '0.2rem 0.4rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0 }}
                  >
                    Remover
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div style={{ display: 'flex', gap: mobile ? '0.5rem' : '1rem', justifyContent: 'space-between' }}>
          <motion.button
            className="btn-premium"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ padding: mobile ? '0.6rem 0.8rem' : '0.8rem 1.5rem', fontSize: mobile ? '0.75rem' : '0.9rem', background: 'transparent', border: '1px solid var(--color-gold)', color: 'var(--color-gold)' }}
          >
            ← Ver mais produtos
          </motion.button>
          <motion.button
            className="btn-premium"
            onClick={handleQuote}
            disabled={cart.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ padding: mobile ? '0.6rem 0.8rem' : '0.8rem 1.5rem', fontSize: mobile ? '0.75rem' : '0.9rem' }}
          >
            Solicitar Orcamento →
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CartModal;
