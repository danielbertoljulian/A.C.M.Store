import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } })
};

const stockLabels = {
  pronta_entrega: { label: 'Pronta Entrega', color: '#27ae60' },
  sob_encomenda: { label: 'Sob Encomenda', color: '#f39c12' },
  em_estoque: { label: 'Em Estoque', color: '#3498db' },
  sem_estoque: { label: 'Sem Estoque', color: '#e74c3c' }
};

function WholesaleShowcase() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [sizeSelections, setSizeSelections] = useState({});
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientStore, setClientStore] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCNPJ, setClientCNPJ] = useState('');
  const [notes, setNotes] = useState('');
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailImgIdx, setDetailImgIdx] = useState(0);

  useEffect(() => {
    fetch('/api/wholesale_products')
      .then(r => r.ok ? r.json() : [])
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const categories = [...new Set(products.flatMap(p => (p.categories || '').split(',').map(s => s.trim())).filter(Boolean))].sort();

  const filtered = products.filter(p => {
    if (filter && !(p.categories || '').includes(filter) && p.brand !== filter) return false;
    return true;
  });

  const getFirstImage = (p) => {
    if (p.images) { try { const a = JSON.parse(p.images); if (a.length > 0) return a[0]; } catch {} }
    return p.image || '';
  };

  const parseSizes = (sizes) => {
    if (!sizes) return {};
    if (typeof sizes === 'object') return sizes;
    try { return JSON.parse(sizes); } catch { return {}; }
  };

  const toggleProduct = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(i => i !== id);
        setQuantities(v => { const n = { ...v }; delete n[id]; return n; });
        setSizeSelections(v => { const n = { ...v }; delete n[id]; return n; });
        return next;
      }
      setQuantities(v => ({ ...v, [id]: 1 }));
      return [...prev, id];
    });
  };

  const selectedProducts = products.filter(p => selected.includes(p.id));

  const generateWhatsApp = () => {
    if (selectedProducts.length === 0) return;
    let msg = `*SOLICITACAO DE ORCAMENTO ATACADO*\n*A.C.M Store*\n\n`;
    msg += `Produtos selecionados:\n`;
    selectedProducts.forEach(p => {
      const qty = quantities[p.id] || 1;
      const size = sizeSelections[p.id] || '';
      msg += `\n▸ *${p.name}*`;
      if (p.brand) msg += ` (${p.brand})`;
      msg += `\n   Qtd: ${qty}x`;
      if (size) msg += ` | Tam: ${size}`;
      if (p.price_wholesale) msg += ` | Preco: R$ ${p.price_wholesale}`;
    });
    msg += `\n\nTotal de itens: ${selectedProducts.length}`;
    msg += `\n\nGostaria de solicitar um orcamento para esses produtos!`;
    const url = `https://wa.me/5551985458900?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const submitRequest = async () => {
    if (!clientName.trim()) { alert('Preencha seu nome.'); return; }
    if (selectedProducts.length === 0) { alert('Selecione pelo menos um produto.'); return; }
    setSending(true);
    try {
      const productsData = selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand || '',
        image: getFirstImage(p),
        qty: quantities[p.id] || 1,
        size: sizeSelections[p.id] || '',
        price_wholesale: p.price_wholesale || ''
      }));
      const r = await fetch('/api/wholesale_requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_store: clientStore,
          client_phone: clientPhone,
          client_email: clientEmail,
          client_cnpj: clientCNPJ,
          products: productsData,
          notes
        })
      });
      if (r.ok) {
        setRequestSent(true);
        setSelected([]);
        setQuantities({});
        setSizeSelections({});
        setClientName(''); setClientStore(''); setClientPhone('');
        setClientEmail(''); setClientCNPJ(''); setNotes('');
      } else {
        alert('Erro ao enviar solicitacao.');
      }
    } catch { alert('Erro ao enviar solicitacao.'); }
    setSending(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070707', color: '#F5F5F0' }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #070707 0%, #15181C 50%, #070707 100%)',
        padding: '80px 20px 60px', textAlign: 'center'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15,
          background: 'radial-gradient(ellipse at center, rgba(214,181,109,0.3) 0%, transparent 70%)' }} />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
          <img src="/LOGO_1_TRNSP.png" alt="A.C.M Store" style={{ height: '80px', marginBottom: '20px', filter: 'drop-shadow(0 4px 20px rgba(214,181,109,0.3))' }} />
          <motion.h1 variants={fadeUp} custom={1} style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#D6B56D', fontWeight: 700,
            marginBottom: '16px', letterSpacing: '2px', textTransform: 'uppercase'
          }}>Area Atacado</motion.h1>
          <motion.p variants={fadeUp} custom={2} style={{
            fontSize: '1.1rem', color: '#A7A7A0', maxWidth: '600px', margin: '0 auto 30px', lineHeight: 1.6
          }}>Parceiro comercial da A.C.M Store. Marcas originais com os melhores precos para revenda.</motion.p>

          <motion.div variants={fadeUp} custom={3} style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={generateWhatsApp}
              style={{ background: '#25D366', color: 'white', padding: '14px 32px', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,211,102,0.3)' }}>
              Falar no WhatsApp
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('catalogo-atacado')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', color: '#D6B56D', padding: '14px 32px', borderRadius: '8px', border: '2px solid #D6B56D', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
              Ver Catalogo
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '50px' }}>
          {[
            { icon: '🏷️', title: 'Precos Exclusivos', desc: 'Condicoes especiais para compra por atacado' },
            { icon: '📦', title: 'Pronta Entrega', desc: 'Estoque disponivel para envio imediato' },
            { icon: '🚚', title: 'Frete Facilitado', desc: 'Logistica otimizada para grandes pedidos' },
            { icon: '🤝', title: 'Suporte Dedicado', desc: 'Atendimento personalizado para revendedores' }
          ].map((item, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="glass" style={{ padding: '24px', borderRadius: '12px', background: '#15181C', border: '1px solid #2A2D33', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{ color: '#D6B56D', fontSize: '1rem', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ color: '#A7A7A0', fontSize: '0.85rem', lineHeight: 1.5 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ color: '#D6B56D', fontSize: '1.5rem', marginBottom: '8px' }}>Marcas Disponiveis</h2>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {brands.map(b => (
              <span key={b} className="glass" style={{ padding: '8px 20px', borderRadius: '20px', color: '#F5F5F0', fontSize: '0.9rem', fontWeight: 600, background: '#15181C', border: '1px solid #2A2D33' }}>{b}</span>
            ))}
          </div>
        </motion.div>

        <div id="catalogo-atacado">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ color: '#D6B56D', fontSize: '1.5rem', margin: 0 }}>Catalogo Atacado</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: '#15181C', border: '1px solid #2A2D33', padding: '8px 16px', color: '#F5F5F0', borderRadius: '8px', fontSize: '0.85rem' }}>
                <option value="">Todas</option>
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} style={{ background: '#15181C', border: '1px solid #2A2D33', color: '#D6B56D', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                {viewMode === 'grid' ? 'Lista' : 'Grade'}
              </button>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(214,181,109,0.1)', border: '1px solid #D6B56D', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ color: '#D6B56D', fontWeight: 600 }}>{selectedProducts.length} produto(s) selecionado(s)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setSelected([]); setQuantities({}); setSizeSelections({}); }} style={{ background: 'transparent', border: '1px solid #2A2D33', color: '#A7A7A0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Limpar</button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowRequestForm(true)} style={{ background: '#D6B56D', color: '#070707', padding: '8px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  Solicitar Orcamento
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={generateWhatsApp} style={{ background: '#25D366', color: 'white', padding: '8px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  WhatsApp
                </motion.button>
              </div>
            </motion.div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', gap: '16px' }}>
            {filtered.map(p => {
              const sizes = parseSizes(p.sizes);
              const hasSizes = Object.keys(sizes).length > 0;
              const stockInfo = stockLabels[p.stock_status] || stockLabels.pronta_entrega;
              return (
                <motion.div key={p.id} whileHover={{ scale: 1.01 }}
                  style={{ background: '#15181C', border: `1px solid ${selected.includes(p.id) ? '#D6B56D' : '#2A2D33'}`, borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s ease', display: 'flex', flexDirection: viewMode === 'list' ? 'row' : 'column' }}>
                  <div onClick={() => { setDetailProduct(p); setDetailImgIdx(0); }} style={{ height: viewMode === 'list' ? '100px' : '200px', width: viewMode === 'list' ? '100px' : '100%', background: '#111315', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', flexShrink: 0, position: 'relative', cursor: 'zoom-in' }}>
                    <img src={getFirstImage(p)} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: stockInfo.color, color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>{stockInfo.label}</span>
                    {p.off && <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'linear-gradient(135deg, #D6B56D, #F2D78A)', color: '#070707', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>-{p.off}%</span>}
                  </div>
                  <div style={{ padding: '14px', flex: 1 }}>
                    <h4 style={{ color: '#F5F5F0', fontSize: '0.9rem', margin: '0 0 4px', lineHeight: 1.3 }}>{p.name}</h4>
                    {p.brand && <span style={{ color: '#D6B56D', fontSize: '0.75rem' }}>{p.brand}</span>}
                    {p.description && <p style={{ color: '#A7A7A0', fontSize: '0.75rem', margin: '6px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline', marginTop: '8px' }}>
                      {p.price_wholesale && <span style={{ color: '#D6B56D', fontWeight: 700, fontSize: '1rem' }}>R$ {p.price_wholesale}</span>}
                      {p.price_varejo && <span style={{ color: '#A7A7A0', fontSize: '0.75rem', textDecoration: 'line-through' }}>R$ {p.price_varejo}</span>}
                    </div>

                    {p.min_quantity > 1 && (
                      <span style={{ display: 'inline-block', marginTop: '4px', background: 'rgba(52,152,219,0.15)', color: '#3498db', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                        Min. {p.min_quantity} pecas
                      </span>
                    )}

                    {hasSizes && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {Object.entries(sizes).map(([size, qty]) => (
                          <span key={size} style={{ background: '#070707', border: '1px solid #2A2D33', color: qty ? '#D6B56D' : '#555', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>
                            {size}{qty ? ` (${qty})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.grade_info && <p style={{ color: '#A7A7A0', fontSize: '0.7rem', margin: '6px 0 0', fontStyle: 'italic' }}>{p.grade_info}</p>}
                    {p.colors && <p style={{ color: '#A7A7A0', fontSize: '0.7rem', margin: '4px 0 0' }}>Cores: {p.colors}</p>}

                    {selected.includes(p.id) && (
                      <div style={{ marginTop: '10px', padding: '8px', background: '#070707', borderRadius: '6px', border: '1px solid #2A2D33' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <div>
                            <label style={{ color: '#A7A7A0', fontSize: '0.65rem', display: 'block' }}>Qtd.</label>
                            <input type="number" min={p.min_quantity || 1} value={quantities[p.id] || 1}
                              onChange={e => setQuantities(v => ({ ...v, [p.id]: Math.max(p.min_quantity || 1, parseInt(e.target.value) || 1) }))}
                              style={{ width: '100%', background: '#15181C', border: '1px solid #2A2D33', color: '#D6B56D', fontSize: '0.8rem', padding: '4px', borderRadius: '4px', textAlign: 'center', boxSizing: 'border-box', fontWeight: 600 }} />
                          </div>
                          {hasSizes && (
                            <div>
                              <label style={{ color: '#A7A7A0', fontSize: '0.65rem', display: 'block' }}>Tamanho</label>
                              <select value={sizeSelections[p.id] || ''} onChange={e => setSizeSelections(v => ({ ...v, [p.id]: e.target.value }))}
                                style={{ width: '100%', background: '#15181C', border: '1px solid #2A2D33', color: '#D6B56D', fontSize: '0.8rem', padding: '4px', borderRadius: '4px', boxSizing: 'border-box' }}>
                                <option value="">Selecione</option>
                                {Object.keys(sizes).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => toggleProduct(p.id)}
                      style={{ width: '100%', marginTop: '10px', padding: '8px', background: selected.includes(p.id) ? '#D6B56D' : 'transparent', color: selected.includes(p.id) ? '#070707' : '#D6B56D', border: `1px solid #D6B56D`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      {selected.includes(p.id) ? '✓ Selecionado' : 'Selecionar'}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          style={{ marginTop: '60px', padding: '40px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #15181C 0%, #070707 100%)', borderRadius: '16px', border: '1px solid #2A2D33' }}>
          <h2 style={{ color: '#D6B56D', fontSize: '1.3rem', marginBottom: '12px' }}>Pronto para revender?</h2>
          <p style={{ color: '#A7A7A0', fontSize: '0.9rem', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>Entre em contato e receba condicoes especiais para seu negocio.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              href="https://wa.me/5551985458900?text=Ola! Vim pelo site e gostaria de informacoes sobre o atacado."
              target="_blank" rel="noopener noreferrer"
              style={{ background: '#25D366', color: 'white', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>WhatsApp</motion.a>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {detailProduct && (() => {
          const sizes = parseSizes(detailProduct.sizes);
          const hasSizes = Object.keys(sizes).length > 0;
          const allImages = (() => { try { const a = JSON.parse(detailProduct.images); return Array.isArray(a) && a.length > 0 ? a : [detailProduct.image].filter(Boolean); } catch { return [detailProduct.image].filter(Boolean); } })();
          const colors = (detailProduct.colors || '').split(',').map(s => s.trim()).filter(Boolean);
          const stockInfo = stockLabels[detailProduct.stock_status] || stockLabels.pronta_entrega;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
              onClick={(e) => { if (e.target === e.currentTarget) setDetailProduct(null); }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="glass" style={{ background: '#15181C', border: '1px solid #2A2D33', borderRadius: '16px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                <button onClick={() => setDetailProduct(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#A7A7A0', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                  <div style={{ background: '#0a0a0a', borderRadius: '16px 0 0 16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <img src={allImages[detailImgIdx] || allImages[0]} alt={detailProduct.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    {allImages.length > 1 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {allImages.map((img, idx) => (
                          <div key={idx} onClick={() => setDetailImgIdx(idx)}
                            style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: detailImgIdx === idx ? '2px solid #D6B56D' : '1px solid #2A2D33', cursor: 'pointer', background: '#111315', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ background: stockInfo.color, color: 'white', padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{stockInfo.label}</span>
                        {detailProduct.off && <span style={{ background: 'linear-gradient(135deg, #D6B56D, #F2D78A)', color: '#070707', padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>-{detailProduct.off}%</span>}
                      </div>
                      <h2 style={{ color: '#F5F5F0', fontSize: '1.3rem', margin: '0 0 4px' }}>{detailProduct.name}</h2>
                      {detailProduct.brand && <span style={{ color: '#D6B56D', fontSize: '0.85rem', fontWeight: 600 }}>{detailProduct.brand}</span>}
                    </div>

                    {detailProduct.description && (
                      <p style={{ color: '#A7A7A0', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{detailProduct.description}</p>
                    )}

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
                      {detailProduct.price_wholesale && <span style={{ color: '#D6B56D', fontWeight: 700, fontSize: '1.4rem' }}>R$ {detailProduct.price_wholesale}</span>}
                      {detailProduct.price_varejo && <span style={{ color: '#A7A7A0', fontSize: '0.85rem', textDecoration: 'line-through' }}>R$ {detailProduct.price_varejo}</span>}
                    </div>

                    {detailProduct.min_quantity > 1 && (
                      <div style={{ background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                        <span style={{ color: '#3498db', fontSize: '0.8rem', fontWeight: 600 }}>Pedido minimo: {detailProduct.min_quantity} pecas</span>
                      </div>
                    )}

                    {colors.length > 0 && (
                      <div>
                        <label style={{ color: '#D6B56D', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Cores Disponiveis</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {colors.map(c => (
                            <span key={c} style={{ background: '#070707', border: '1px solid #2A2D33', color: '#F5F5F0', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem' }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasSizes && (
                      <div>
                        <label style={{ color: '#D6B56D', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Grade / Tamanhos</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px' }}>
                          {Object.entries(sizes).map(([size, qty]) => {
                            const qtd = parseInt(qty) || 0;
                            return (
                              <div key={size} style={{ background: '#070707', border: `1px solid ${qtd > 0 ? '#2A2D33' : '#3a2020'}`, borderRadius: '6px', padding: '10px 6px', textAlign: 'center' }}>
                                <div style={{ color: '#D6B56D', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{size}</div>
                                <div style={{ color: qtd > 0 ? '#F5F5F0' : '#e74c3c', fontSize: '1.1rem', fontWeight: 700 }}>{qtd}</div>
                                <div style={{ color: '#A7A7A0', fontSize: '0.6rem', marginTop: '2px' }}>{qtd > 0 ? 'pecas' : 'indisponivel'}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {detailProduct.grade_info && (
                      <div style={{ background: '#070707', padding: '10px 12px', borderRadius: '6px', border: '1px solid #2A2D33' }}>
                        <span style={{ color: '#A7A7A0', fontSize: '0.8rem', fontStyle: 'italic' }}>{detailProduct.grade_info}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '12px' }}>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { toggleProduct(detailProduct.id); setDetailProduct(null); }}
                        style={{ flex: 1, padding: '12px', background: selected.includes(detailProduct.id) ? '#D6B56D' : 'transparent', color: selected.includes(detailProduct.id) ? '#070707' : '#D6B56D', border: '1px solid #D6B56D', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        {selected.includes(detailProduct.id) ? '✓ Selecionado' : 'Selecionar para Orcamento'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {showRequestForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowRequestForm(false); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass" style={{ background: '#15181C', border: '1px solid #2A2D33', borderRadius: '16px', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              {requestSent ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ color: '#D6B56D', fontSize: '1.2rem', marginBottom: '8px' }}>Solicitacao Enviada!</h3>
                  <p style={{ color: '#A7A7A0', fontSize: '0.9rem', marginBottom: '24px' }}>Recebemos sua solicitacao. Em breve entraremos em contato!</p>
                  <button onClick={() => { setShowRequestForm(false); setRequestSent(false); }} className="btn-premium" style={{ padding: '10px 30px' }}>Fechar</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#D6B56D', fontSize: '1.1rem', margin: 0 }}>Solicitar Orcamento</h3>
                    <button onClick={() => setShowRequestForm(false)} style={{ background: 'none', border: 'none', color: '#A7A7A0', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                  </div>

                  <div style={{ background: '#070707', padding: '12px', borderRadius: '8px', border: '1px solid #2A2D33', marginBottom: '1.5rem' }}>
                    <span style={{ color: '#D6B56D', fontSize: '0.85rem', fontWeight: 600 }}>{selectedProducts.length} produto(s) selecionado(s)</span>
                    {selectedProducts.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2A2D33', fontSize: '0.8rem' }}>
                        <span style={{ color: '#F5F5F0' }}>{p.name} {sizeSelections[p.id] ? `(${sizeSelections[p.id]})` : ''}</span>
                        <span style={{ color: '#A7A7A0' }}>{quantities[p.id] || 1}x</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Nome *</label>
                      <input type="text" placeholder="Seu nome" value={clientName} onChange={e => setClientName(e.target.value)} style={modalInput} />
                    </div>
                    <div>
                      <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Loja</label>
                      <input type="text" placeholder="Nome da loja" value={clientStore} onChange={e => setClientStore(e.target.value)} style={modalInput} />
                    </div>
                    <div>
                      <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Telefone</label>
                      <input type="text" placeholder="(51) 99999-0000" value={clientPhone} onChange={e => setClientPhone(e.target.value)} style={modalInput} />
                    </div>
                    <div>
                      <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Email</label>
                      <input type="email" placeholder="email@email.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} style={modalInput} />
                    </div>
                    <div>
                      <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>CNPJ</label>
                      <input type="text" placeholder="00.000.000/0001-00" value={clientCNPJ} onChange={e => setClientCNPJ(e.target.value)} style={modalInput} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Observacoes</label>
                    <textarea placeholder="Ex: Preciso de 50 pecas de cada tamanho..." value={notes} onChange={e => setNotes(e.target.value)}
                      style={{ ...modalInput, minHeight: '60px', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowRequestForm(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #2A2D33', color: '#A7A7A0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>Cancelar</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submitRequest} disabled={sending}
                      className="btn-premium" style={{ flex: 2, padding: '12px', fontSize: '0.9rem', opacity: sending ? 0.6 : 1 }}>
                      {sending ? 'Enviando...' : 'Enviar Solicitacao'}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const modalInput = {
  width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2A2D33',
  background: '#070707', color: '#F5F5F0', fontSize: '0.9rem', boxSizing: 'border-box'
};

export default WholesaleShowcase;
