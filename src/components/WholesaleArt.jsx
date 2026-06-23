import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

const TEMPLATES = [
  { id: 'novidades', label: 'Novidades da Semana', defaultTitle: 'NOVIDADES NO ATACADO', defaultSubtitle: 'Produtos novos com preço especial para revenda' },
  { id: 'grade', label: 'Grade Disponível', defaultTitle: 'GRADE COMPLETA', defaultSubtitle: 'Confira todos os tamanhos e cores disponíveis' },
  { id: 'combo', label: 'Combo para Revenda', defaultTitle: 'COMBO ESPECIAL', defaultSubtitle: 'Leve mais pague menos - condições atacado' },
  { id: 'oferta', label: 'Oferta da Semana', defaultTitle: 'OFERTA DA SEMANA', defaultSubtitle: 'Condição especial por tempo limitado' },
  { id: 'reposicao', label: 'Reposição de Estoque', defaultTitle: 'REPOSIÇÃO DE ESTOQUE', defaultSubtitle: 'Estoque atualizado - garanta os seus' },
  { id: 'kit', label: 'Kit para Revenda', defaultTitle: 'KIT COMPLETO', defaultSubtitle: 'Tudo que você precisa para começar a revender' },
  { id: 'destaque', label: 'Produtos em Destaque', defaultTitle: 'PRODUTOS EM DESTAQUE', defaultSubtitle: 'Os mais vendidos do atacado' },
  { id: 'personalizado', label: 'Personalizado', defaultTitle: '', defaultSubtitle: '' }
];

function WholesaleArt({ mobile }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [template, setTemplate] = useState('novidades');
  const [artTitle, setArtTitle] = useState(TEMPLATES[0].defaultTitle);
  const [artSubtitle, setArtSubtitle] = useState(TEMPLATES[0].defaultSubtitle);
  const [offValues, setOffValues] = useState({});
  const [priceValues, setPriceValues] = useState({});
  const [globalOff, setGlobalOff] = useState('');
  const [artStyle, setArtStyle] = useState('dark');
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch('/api/wholesale_products')
      .then(r => r.ok ? r.json() : [])
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleTemplateChange = (t) => {
    setTemplate(t);
    const tpl = TEMPLATES.find(x => x.id === t);
    if (tpl) {
      setArtTitle(tpl.defaultTitle);
      setArtSubtitle(tpl.defaultSubtitle);
    }
  };

  const toggleProduct = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(i => i !== id);
        setOffValues(v => { const n = { ...v }; delete n[id]; return n; });
        return next;
      }
      return prev.length < 9 ? [...prev, id] : prev;
    });
  };

  const filtered = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const selectedProducts = products.filter(p => selected.includes(p.id)).map(p => ({
    ...p,
    off: offValues[p.id] || globalOff || p.off || '',
    price: priceValues[p.id] || p.price_wholesale || ''
  }));

  const bgStyles = {
    dark: 'linear-gradient(135deg, #070707 0%, #15181C 50%, #070707 100%)',
    gold: 'linear-gradient(135deg, #1a1508 0%, #2a2010 50%, #1a1508 100%)',
    clean: 'linear-gradient(135deg, #0f1012 0%, #1a1d21 50%, #0f1012 100%)'
  };

  const getLayoutStyle = () => {
    const count = selectedProducts.length;
    if (count <= 1) return { gridCols: '1fr', gap: '40px', maxWidth: '400px', cols: 1, rows: 1 };
    if (count === 2) return { gridCols: '1fr 1fr', gap: '50px', maxWidth: '900px', cols: 2, rows: 1 };
    if (count === 3) return { gridCols: '1fr 1fr 1fr', gap: '40px', maxWidth: '1050px', cols: 3, rows: 1 };
    if (count === 4) return { gridCols: '1fr 1fr', gap: '40px', maxWidth: '900px', cols: 2, rows: 2 };
    if (count <= 6) return { gridCols: '1fr 1fr 1fr', gap: '30px', maxWidth: '950px', cols: 3, rows: 2 };
    return { gridCols: '1fr 1fr 1fr', gap: '25px', maxWidth: '950px', cols: 3, rows: 3 };
  };

  const layout = getLayoutStyle();

  const handleGenerate = async () => {
    if (selectedProducts.length < 1) return;
    setGenerating(true);
    const images = canvasRef.current.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));
    await new Promise(r => setTimeout(r, 500));
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#070707', logging: false
      });
      const link = document.createElement('a');
      link.download = `acm-atacado-${template}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('Erro ao gerar arte:', e); }
    setGenerating(false);
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ color: '#D6B56D', marginBottom: '1rem', fontSize: mobile ? '1rem' : '1.2rem' }}>
        Arte Atacado
      </h3>

      <div className="glass" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
        <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '12px' }}>Template</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => handleTemplateChange(t.id)} style={{
              background: template === t.id ? '#D6B56D' : 'transparent',
              border: '1px solid #D6B56D',
              color: template === t.id ? '#070707' : '#D6B56D',
              padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="glass" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
        <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '12px' }}>Configurações da Arte</h4>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Título</label>
            <input type="text" placeholder="Ex: NOVIDADES NO ATACADO" value={artTitle} onChange={e => setArtTitle(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Subtítulo</label>
            <input type="text" placeholder="Ex: Preços especiais para revenda" value={artSubtitle} onChange={e => setArtSubtitle(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>OFF% Global</label>
            <input type="text" placeholder="Ex: 20" value={globalOff} onChange={e => setGlobalOff(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Estilo</label>
            <select value={artStyle} onChange={e => setArtStyle(e.target.value)} style={inputStyle}>
              <option value="dark">Escuro</option>
              <option value="gold">Dourado</option>
              <option value="clean">Clean</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', overflow: 'auto', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div ref={canvasRef} style={{
          width: '1080px',
          background: bgStyles[artStyle],
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
          paddingTop: '50px', paddingBottom: '50px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15,
            background: 'radial-gradient(ellipse at center, rgba(214,181,109,0.3) 0%, transparent 70%)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', zIndex: 1, marginBottom: '20px' }}>
            <img src="/LOGO_1_TRNSP.png" alt="A.C.M Store" style={{
              height: '75px', width: 'auto',
              filter: 'drop-shadow(0 4px 20px rgba(214,181,109,0.3))'
            }} />
          </div>

          {(artTitle || artSubtitle) && (
            <div style={{ textAlign: 'center', zIndex: 1, marginBottom: '30px' }}>
              {artTitle && <h2 style={{ color: '#D6B56D', fontSize: '36px', fontWeight: 700, margin: '0 0 10px', letterSpacing: '1px' }}>{artTitle}</h2>}
              {artSubtitle && <p style={{ color: '#A7A7A0', fontSize: '22px', margin: 0, fontWeight: 400, lineHeight: 1.4, maxWidth: '700px' }}>{artSubtitle}</p>}
            </div>
          )}

          {selectedProducts.length > 0 ? (
            <div style={{
              display: 'grid', gridTemplateColumns: layout.gridCols, gap: layout.gap,
              width: '100%', maxWidth: layout.maxWidth, zIndex: 1, flex: 1
            }}>
              {selectedProducts.map(p => (
                <div key={p.id} style={{
                  background: '#15181C', borderRadius: '10px',
                  border: '1px solid #2A2D33', padding: layout.rows > 2 ? '10px' : '12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden'
                }}>
                  {p.off && (
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'linear-gradient(135deg, #D6B56D, #F2D78A)', color: '#070707',
                      padding: '6px 12px', borderRadius: '20px', fontWeight: 700,
                      fontSize: layout.rows > 2 ? '12px' : '16px', zIndex: 2
                    }}>OFF {p.off}%</div>
                  )}
                  <div style={{
                    width: '100%', height: layout.rows > 2 ? '80px' : '120px', background: '#111315',
                    borderRadius: '8px', marginBottom: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '10px'
                  }}>
                    <img src={getFirstImage(p)} alt={p.name} style={{
                      maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'
                    }} />
                  </div>
                  <h4 style={{
                    color: '#F5F5F0', fontSize: layout.rows > 2 ? '14px' : (layout.cols > 2 ? '18px' : '22px'),
                    textAlign: 'center', margin: 0, fontWeight: 600, lineHeight: 1.3
                  }}>{p.name}</h4>
                  {p.brand && (
                    <p style={{
                      color: '#D6B56D', fontSize: layout.rows > 2 ? '11px' : '14px', margin: '6px 0 0', fontWeight: 500
                    }}>{p.brand}</p>
                  )}
                  {p.price_wholesale && (
                    <p style={{
                      color: '#F2D78A', fontSize: layout.rows > 2 ? '13px' : '16px', margin: '4px 0 0', fontWeight: 700
                    }}>R$ {p.price_wholesale}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#A7A7A0', fontSize: '1rem', textAlign: 'center', padding: '40px', zIndex: 1 }}>
              Selecione produtos abaixo para gerar a arte
            </div>
          )}

          <div style={{ textAlign: 'center', zIndex: 1, paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
              <div style={{ height: '1px', width: '80px', background: 'linear-gradient(to right, transparent, #D6B56D, transparent)' }} />
              <span style={{ color: '#D6B56D', fontSize: '20px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' }}>A.C.M STORE</span>
              <div style={{ height: '1px', width: '80px', background: 'linear-gradient(to right, transparent, #D6B56D, transparent)' }} />
            </div>
            <p style={{ color: '#A7A7A0', fontSize: '14px', margin: '0 0 8px', letterSpacing: '1px' }}>Qualidade e estilo para quem aprecia o melhor.</p>
            <div style={{ color: '#A7A7A0', fontSize: '13px', lineHeight: 1.6 }}>
              <span style={{ display: 'block' }}>Av Getulio Vargas 1157 Sala 1509</span>
              <span style={{ display: 'block', color: '#D6B56D' }}>(51) 98545-8900</span>
            </div>
          </div>
        </div>
      </div>

      <button className="btn-premium" onClick={handleGenerate}
        disabled={selectedProducts.length < 1 || generating}
        style={{ padding: '0.8rem 2rem', fontSize: '1rem', width: '100%', marginBottom: '1.5rem', opacity: selectedProducts.length < 1 ? 0.5 : 1 }}>
        {generating ? 'Gerando...' : `Baixar Arte (${selectedProducts.length} produtos)`}
      </button>

      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Buscar produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
        {filtered.map(p => (
          <div key={p.id} style={{
            display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px',
            background: selected.includes(p.id) ? 'rgba(214,181,109,0.15)' : '#15181C',
            border: `1px solid ${selected.includes(p.id) ? '#D6B56D' : '#2A2D33'}`,
            borderRadius: '6px', transition: 'all 0.2s ease'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleProduct(p.id)}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleProduct(p.id)}
                style={{ accentColor: '#D6B56D', flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <img src={getFirstImage(p)} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#111315', flexShrink: 0 }} />
                <span style={{ color: '#F5F5F0', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </div>
            </label>
            {selected.includes(p.id) && (
              <>
                <input type="text" placeholder="OFF%"
                  value={offValues[p.id] || ''}
                  onChange={(e) => setOffValues(v => ({ ...v, [p.id]: e.target.value }))}
                  style={smallInput} />
                <input type="text" placeholder="Preço"
                  value={priceValues[p.id] || ''}
                  onChange={(e) => setPriceValues(v => ({ ...v, [p.id]: e.target.value }))}
                  style={{ ...smallInput, marginTop: '2px' }} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getFirstImage(p) {
  if (p.images) {
    try {
      const arr = JSON.parse(p.images);
      if (Array.isArray(arr) && arr.length > 0) return arr[0];
    } catch {}
  }
  return p.image || '';
}

const inputStyle = {
  width: '100%', padding: '0.7rem', borderRadius: '4px',
  border: '1px solid #2A2D33', background: '#15181C',
  color: '#F5F5F0', fontSize: '0.9rem', boxSizing: 'border-box',
};

const smallInput = {
  width: '100%', background: '#070707', border: '1px solid #2A2D33',
  color: '#F5F5F0', fontSize: '0.7rem', padding: '0.25rem',
  borderRadius: '4px', boxSizing: 'border-box'
};

export default WholesaleArt;
