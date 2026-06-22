import React, { useState, useEffect } from 'react';

function getImageList(product) {
  if (product.images) {
    try {
      const arr = JSON.parse(product.images);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}
  }
  return product.image ? [product.image] : [];
}

function isValidSrc(src) {
  if (!src) return false;
  return src.startsWith('data:image/') || src.startsWith('http') || src.startsWith('/');
}

const ProductDetail = ({ product, onClose, addToCart }) => {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  const [qty, setQty] = useState(1);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
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

  const [imgIdx, setImgIdx] = useState(0);
  const touchStartX = React.useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') setImgIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setImgIdx(i => Math.min((getImageList(product).length - 1), i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const images = getImageList(product);
  const specs = [
    { label: 'Tamanho', value: product.width },
    { label: 'Cor', value: product.colors },
  ].filter(s => s.value && s.value.trim());
  const colors = product.colors ? product.colors.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.95)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', boxSizing: 'border-box',
      overflowY: 'auto',
    }} onClick={onClose}>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>

      <div className="glass" style={{
        width: '100%',
        maxWidth: mobile ? '360px' : '600px',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        animation: 'modalIn 0.3s ease',
        flexShrink: 0,
      }} onClick={e => e.stopPropagation()}>

        <button onClick={onClose} style={{
          position: 'absolute', top: '10px', right: '15px',
          background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
          fontSize: '1.5rem', cursor: 'pointer', width: '35px', height: '35px',
          borderRadius: '50%', zIndex: 2
        }}>×</button>

        <div style={{ position: 'relative' }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
              if (diff > 0) setImgIdx(i => Math.min(images.length - 1, i + 1));
              else setImgIdx(i => Math.max(0, i - 1));
            }
            touchStartX.current = null;
          }}
        >
          <div style={{ height: mobile ? '250px' : '350px', background: '#111315', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
            <img
              src={isValidSrc(images[imgIdx]) ? images[imgIdx] : ''}
              alt={product.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            {product.off && parseInt(product.off) > 0 && (
              <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#D6B56D', color: '#070707', padding: '4px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', zIndex: 2 }}>{product.off}%OFF</span>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)} style={{
                  width: '10px', height: '10px', borderRadius: '50%', border: 'none',
                  background: i === imgIdx ? '#D6B56D' : '#2A2D33',
                  cursor: 'pointer', padding: 0
                }} />
              ))}
            </div>
          )}
          {images.length > 1 && imgIdx > 0 && (
            <button onClick={() => setImgIdx(i => i - 1)} style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '30px',
              height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem'
            }}>‹</button>
          )}
          {images.length > 1 && imgIdx < images.length - 1 && (
            <button onClick={() => setImgIdx(i => i + 1)} style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '30px',
              height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem'
            }}>›</button>
          )}
        </div>

        <div style={{ padding: mobile ? '1rem' : '2rem' }}>
          <small style={{ color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}>
            {product.brand}
          </small>
          <h2 style={{ fontSize: mobile ? '1.3rem' : '1.8rem', margin: '0.5rem 0 1rem' }}>{product.name}</h2>

          {product.price && product.price.trim() && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ color: 'var(--color-gold)', fontSize: '1.5rem', fontWeight: 700 }}>R$ {product.price}</span>
            </div>
          )}

          {specs.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Detalhes</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {specs.map(s => (
                  <span key={s.label} style={{ background: '#15181C', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: '#F5F5F0', border: '1px solid #2A2D33' }}>{s.label}: {s.value}</span>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Cores Disponiveis</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {colors.map((c, i) => (
                  <span key={i} style={{ background: '#15181C', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: '#F5F5F0', border: '1px solid #2A2D33' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={onClose} style={{
              background: 'transparent', border: '1px solid var(--color-gold)',
              color: 'var(--color-gold)', padding: mobile ? '0.7rem' : '1rem', borderRadius: '8px',
              fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: mobile ? '0.75rem' : '0.9rem'
            }}>Voltar</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#15181C', borderRadius: '8px', padding: '0.3rem' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', color: 'white', fontSize: mobile ? '1rem' : '1.3rem', cursor: 'pointer', width: mobile ? '1.5rem' : '2rem', height: mobile ? '1.5rem' : '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ minWidth: mobile ? '1.5rem' : '2rem', textAlign: 'center', fontWeight: 700, fontSize: mobile ? '0.85rem' : '1rem' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: mobile ? '1rem' : '1.3rem', cursor: 'pointer', width: mobile ? '1.5rem' : '2rem', height: mobile ? '1.5rem' : '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <button className="btn-premium" onClick={() => { for (let i = 0; i < qty; i++) addToCart(product); onClose(); }}
              style={{ flex: 1, textAlign: 'center', textDecoration: 'none', border: 'none', cursor: 'pointer', padding: mobile ? '0.7rem' : '1rem', fontSize: mobile ? '0.8rem' : '1rem' }}>
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
