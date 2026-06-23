import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

function toInstagramEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('instagram.com')) return '';
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    if (!/^\/(p|reel|tv)\//.test(cleanPath)) return '';
    return `https://www.instagram.com${cleanPath}/embed`;
  } catch {
    return '';
  }
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

  const [mediaIdx, setMediaIdx] = useState(0);
  const touchStartX = React.useRef(null);

  useEffect(() => {
    setMediaIdx(0);
  }, [product?.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      const total = getImageList(product).length + (toInstagramEmbedUrl(product.instagram_video || '') ? 1 : 0);
      if (e.key === 'ArrowLeft') setMediaIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setMediaIdx(i => Math.min(total - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const images = getImageList(product);
  const instagramEmbed = toInstagramEmbedUrl(product.instagram_video || '');
  const media = [
    ...images.map(src => ({ type: 'image', src })),
    ...(instagramEmbed ? [{ type: 'video', src: instagramEmbed }] : [])
  ];
  const currentMedia = media[mediaIdx];
  const specs = [
    { label: 'Tamanho', value: product.width },
    { label: 'Cor', value: product.colors },
  ].filter(s => s.value && s.value.trim());
  const colors = product.colors ? product.colors.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.95)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', boxSizing: 'border-box',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <motion.div
        className="glass"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxWidth: mobile ? '360px' : '600px',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
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
            borderRadius: '50%', zIndex: 2
          }}
        >
          ×
        </motion.button>

        <div style={{ position: 'relative' }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
              if (diff > 0) setMediaIdx(i => Math.min(media.length - 1, i + 1));
              else setMediaIdx(i => Math.max(0, i - 1));
            }
            touchStartX.current = null;
          }}
        >
          <div style={{ height: mobile ? '250px' : '350px', background: '#111315', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
            <AnimatePresence mode="wait">
              {currentMedia?.type === 'video' ? (
                <motion.div
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'relative',
                    height: '100%',
                    aspectRatio: '9 / 16',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #2A2D33',
                    background: '#000'
                  }}
                >
                  <iframe
                    src={currentMedia.src}
                    title={`Video do produto ${product.name}`}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: mobile ? '-48px' : '-58px',
                      width: '100%',
                      height: mobile ? 'calc(100% + 96px)' : 'calc(100% + 116px)',
                      border: 0,
                      display: 'block'
                    }}
                  />
                </motion.div>
              ) : (
                <motion.img
                  key="image"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  src={isValidSrc(currentMedia?.src) ? currentMedia.src : ''}
                  alt={product.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </AnimatePresence>
            {product.off && parseInt(product.off) > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ position: 'absolute', top: '10px', left: '10px', background: '#D6B56D', color: '#070707', padding: '4px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', zIndex: 2 }}
              >
                {product.off}%OFF
              </motion.span>
            )}
          </div>
          {media.length > 1 && (
            <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {media.map((item, i) => (
                <motion.button
                  key={`${item.type}-${i}`}
                  onClick={() => setMediaIdx(i)}
                  title={item.type === 'video' ? 'Video' : `Foto ${i + 1}`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '10px', height: '10px', borderRadius: '50%', border: 'none',
                    background: i === mediaIdx ? '#D6B56D' : '#2A2D33',
                    cursor: 'pointer', padding: 0
                  }}
                />
              ))}
            </div>
          )}
          {media.length > 1 && mediaIdx > 0 && (
            <motion.button
              onClick={() => setMediaIdx(i => i - 1)}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(214,181,109,0.2)' }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '30px',
                height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem'
              }}
            >
              ‹
            </motion.button>
          )}
          {media.length > 1 && mediaIdx < media.length - 1 && (
            <motion.button
              onClick={() => setMediaIdx(i => i + 1)}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(214,181,109,0.2)' }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '30px',
                height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem'
              }}
            >
              ›
            </motion.button>
          )}
        </div>

        <div style={{ padding: mobile ? '1rem' : '2rem' }}>
          <motion.small
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}
          >
            {product.brand}
          </motion.small>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: mobile ? '1.3rem' : '1.8rem', margin: '0.5rem 0 1rem' }}
          >
            {product.name}
          </motion.h2>

          {product.price && product.price.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ marginBottom: '1rem' }}
            >
              <span style={{ color: 'var(--color-gold)', fontSize: '1.5rem', fontWeight: 700 }}>R$ {product.price}</span>
            </motion.div>
          )}

          {specs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ marginBottom: '1rem' }}
            >
              <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Detalhes</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {specs.map(s => (
                  <span key={s.label} style={{ background: '#15181C', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: '#F5F5F0', border: '1px solid #2A2D33' }}>{s.label}: {s.value}</span>
                ))}
              </div>
            </motion.div>
          )}

          {colors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ marginBottom: '1rem' }}
            >
              <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Cores Disponiveis</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {colors.map((c, i) => (
                  <span key={i} style={{ background: '#15181C', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: '#F5F5F0', border: '1px solid #2A2D33' }}>{c}</span>
                ))}
              </div>
            </motion.div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'transparent', border: '1px solid var(--color-gold)',
                color: 'var(--color-gold)', padding: mobile ? '0.7rem' : '1rem', borderRadius: '8px',
                fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: mobile ? '0.75rem' : '0.9rem'
              }}
            >
              Voltar
            </motion.button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#15181C', borderRadius: '8px', padding: '0.3rem' }}>
              <motion.button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: mobile ? '1rem' : '1.3rem', cursor: 'pointer', width: mobile ? '1.5rem' : '2rem', height: mobile ? '1.5rem' : '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                −
              </motion.button>
              <span style={{ minWidth: mobile ? '1.5rem' : '2rem', textAlign: 'center', fontWeight: 700, fontSize: mobile ? '0.85rem' : '1rem' }}>{qty}</span>
              <motion.button
                onClick={() => setQty(q => q + 1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: mobile ? '1rem' : '1.3rem', cursor: 'pointer', width: mobile ? '1.5rem' : '2rem', height: mobile ? '1.5rem' : '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                +
              </motion.button>
            </div>
            <motion.button
              className="btn-premium"
              onClick={() => { for (let i = 0; i < qty; i++) addToCart(product); onClose(); }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(214,181,109,0.4)' }}
              whileTap={{ scale: 0.98 }}
              style={{ flex: 1, textAlign: 'center', textDecoration: 'none', border: 'none', cursor: 'pointer', padding: mobile ? '0.7rem' : '1rem', fontSize: mobile ? '0.8rem' : '1rem' }}
            >
              Adicionar ao Carrinho
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductDetail;
