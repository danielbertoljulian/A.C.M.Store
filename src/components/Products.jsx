import React, { useState, useEffect, useRef } from 'react';

function getImageList(p) {
  if (p.images) {
    try {
      const arr = JSON.parse(p.images);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}
  }
  return p.image ? [p.image] : [];
}

function getFirstImage(p) {
  const list = getImageList(p);
  return list[0] || '';
}

function isValidSrc(src) {
  if (!src) return false;
  return src.startsWith('data:image/') || src.startsWith('http') || src.startsWith('/');
}

const Products = ({ onSelectProduct, filterCategory, addToCart }) => {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(filterCategory || 'all');
  const [brand, setBrand] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const fetched = useRef(false);
  const cardRefs = useRef({});
  const brandList = [...new Set(products.map(p => p.brand))];
  const perPage = 12;
  const filtered = products
    .filter(p => {
      const catMatch = category === 'all' || (p.categories || '').includes(category);
      const brandMatch = !brand || p.brand === brand;
      const searchMatch = p.name.toLowerCase().includes(search.toLowerCase());
      return catMatch && brandMatch && searchMatch;
    });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (!mobile) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        const img = el.querySelector('img');
        if (entry.intersectionRatio >= 0.4) {
          el.style.transform = 'translateY(-5px)';
          el.style.borderColor = 'var(--color-gold)';
          el.style.boxShadow = '0 0 24px rgba(214,181,109,0.25)';
          if (img) img.style.transform = 'scale(1.08)';
        } else {
          el.style.transform = 'translateY(0)';
          el.style.borderColor = 'var(--glass-border)';
          el.style.boxShadow = 'none';
          if (img) img.style.transform = 'scale(1)';
        }
      });
    }, { threshold: [0, 0.4], rootMargin: '0px 0px -20% 0px' });
    Object.values(cardRefs.current).forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [mobile, paginated]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch('/api/products')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && data.length) setProducts(data); })
      .catch(err => console.error('Erro ao carregar produtos:', err));
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        fetch('/api/products')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data && data.length) setProducts(data); })
          .catch(err => console.error('Erro ao recarregar produtos:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (filterCategory && filterCategory !== category) { setCategory(filterCategory); setPage(1); }
  }, [filterCategory]);

  const handleCategoryChange = (cat) => { setCategory(cat); setPage(1); };
  const handleBrandChange = (e) => { setBrand(e.target.value); setPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <section id="produtos" className="section-padding">
      <div className="container">
        <h2 className="section-title"><span>Nossa Colecao</span>Produtos</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries({ all: 'Todos', camisetas: 'Camisetas', polos: 'Polos', calcas: 'Calcas', acessorios: 'Acessorios', tenis: 'Tenis', esportivo: 'Esportivo' }).map(([key, label]) => (
              <button key={key} onClick={() => handleCategoryChange(key)}
                className={category === key ? 'btn-premium' : ''}
                style={category !== key ? { background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-muted)', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', transition: 'var(--transition-smooth)' } : { padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
              >{label}</button>
            ))}
          </div>
          <select value={brand} onChange={handleBrandChange} style={{ background: '#15181C', border: '1px solid #2A2D33', padding: '0.5rem 1rem', color: '#F5F5F0', borderRadius: '8px', fontSize: '0.85rem' }}>
            <option value="" style={{ color: 'white', background: '#15181C' }}>Todas as Marcas</option>
            {brandList.map(b => <option key={b} value={b} style={{ color: 'white', background: '#15181C' }}>{b}</option>)}
          </select>
          <input type="text" placeholder="Buscar produto..." value={search} onChange={handleSearch} style={{ background: '#15181C', border: '1px solid #2A2D33', padding: '0.5rem 1rem', color: '#F5F5F0', borderRadius: '8px', fontSize: '0.85rem', maxWidth: '250px' }} />
        </div>
        {paginated.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum produto encontrado.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {paginated.map(product => (
            <div key={product.id} ref={el => cardRefs.current[product.id] = el} data-pid={product.id} className="glass" onClick={() => { window.__modalScrollY = window.scrollY; onSelectProduct(product); fetch('/api/analytics?type=click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: product.id, product_name: product.name }) }).catch(() => {}); }}
              style={{ borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'var(--transition-smooth)', borderBottom: '3px solid transparent', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = 'var(--color-gold)';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(214,181,109,0.25)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              <div style={{ height: '280px', overflow: 'hidden', background: '#111315', position: 'relative' }}>
                {(() => {
                  const src = getFirstImage(product);
                  return isValidSrc(src)
                    ? <img src={src} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', background: '#111315' }}
                        loading="lazy"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    : <span style={{ color: '#aaa', fontSize: '0.75rem' }}>Sem imagem</span>;
                })()}
                {product.off && parseInt(product.off) > 0 && (
                  <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#D6B56D', color: '#070707', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>{product.off}%OFF</span>
                )}
              </div>
              <div style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <small style={{ color: 'var(--color-gold)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{product.brand}</small>
                  <h3 style={{ fontSize: '0.95rem', margin: '0.3rem 0', fontWeight: 600 }}>{product.name}</h3>
                  {product.price && product.price.trim() && (
                    <p style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginTop: '0.3rem' }}>R$ {product.price}</p>
                  )}
                </div>
                <button className="btn-premium" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem', marginTop: '0.5rem', alignSelf: 'center' }}
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }}>Adicionar ao Carrinho</button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = window.location.origin + '/?p=' + product.id;
                    const txt = `${product.name}\nMarca: ${product.brand}\n${url}`;

                    const fallback = (content) => {
                      const el = document.createElement('textarea');
                      el.value = content; el.style.position = 'fixed'; el.style.opacity = '0';
                      document.body.appendChild(el); el.select();
                      try { document.execCommand('copy'); } catch {}
                      document.body.removeChild(el);
                      setCopiedId(product.id);
                      setTimeout(() => setCopiedId(null), 2500);
                    };

                    const copyToClipboard = (content) => {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(content)
                          .then(() => { setCopiedId(product.id); setTimeout(() => setCopiedId(null), 2500); })
                          .catch(() => fallback(content));
                      } else {
                        fallback(content);
                      }
                    };

                    if (mobile && navigator.share) {
                      navigator.share({ title: product.name, text: txt })
                        .catch(() => copyToClipboard(txt));
                    } else {
                      copyToClipboard(txt);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedId === product.id ? 'var(--color-gold)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    marginTop: '0.3rem',
                    padding: 0,
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                    fontWeight: copiedId === product.id ? 'bold' : 'normal',
                    transition: 'color 0.2s ease',
                  }}>
                  {copiedId === product.id ? '✅ LINK COPIADO' : '🔗 Compartilhar'}
                </button>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn-premium' : ''}
                style={p !== page ? { background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-muted)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)' } : { padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >{p}</button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
