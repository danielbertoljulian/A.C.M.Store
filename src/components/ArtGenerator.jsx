import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

function ArtGenerator({ mobile, products }) {
  const [selected, setSelected] = useState([]);
  const [offValues, setOffValues] = useState({});
  const [priceValues, setPriceValues] = useState({});
  const [globalOff, setGlobalOff] = useState('');
  const [artTitle, setArtTitle] = useState('');
  const [artSubtitle, setArtSubtitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

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

  const selectedProducts = products.filter(p => selected.includes(p.id)).map(p => ({
    ...p,
    off: offValues[p.id] || globalOff || p.off || '',
    price: priceValues[p.id] || p.price || ''
  }));

  const handleGenerate = async () => {
    if (selectedProducts.length < 2) return;
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
      link.download = `acm-store-arte-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Erro ao gerar imagem:', e);
    }
    setGenerating(false);
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

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ color: '#D6B56D', marginBottom: '1rem', fontSize: mobile ? '1rem' : '1.2rem' }}>
        Selecionar Produtos ({selected.length}/9)
      </h3>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <label style={{ color: '#D6B56D', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>OFF% Global:</label>
        <input type="text" placeholder="Ex: 20" value={globalOff} onChange={(e) => setGlobalOff(e.target.value)}
          style={{ width: '80px', background: '#15181C', border: '1px solid #2A2D33', color: '#F5F5F0', fontSize: '0.85rem', padding: '0.4rem', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <label style={{ color: '#D6B56D', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Titulo:</label>
        <input type="text" placeholder="Ex: Colecao de Verao" value={artTitle} onChange={(e) => setArtTitle(e.target.value)}
          style={{ flex: 1, background: '#15181C', border: '1px solid #2A2D33', color: '#F5F5F0', fontSize: '0.85rem', padding: '0.4rem', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <label style={{ color: '#D6B56D', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Texto:</label>
        <input type="text" placeholder="Ex: Marcas originais com desconto" value={artSubtitle} onChange={(e) => setArtSubtitle(e.target.value)}
          style={{ flex: 1, background: '#15181C', border: '1px solid #2A2D33', color: '#F5F5F0', fontSize: '0.85rem', padding: '0.4rem', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{
          width: '100%', overflow: 'auto', maxHeight: '500px', borderRadius: '12px', border: '2px solid #2A2D33',
          background: '#111315', padding: '0.5rem', boxSizing: 'border-box'
        }}>
          <div ref={canvasRef} style={{
            width: '1080px',
            background: 'linear-gradient(135deg, #070707 0%, #15181C 50%, #070707 100%)',
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
                      color: '#D6B56D', fontSize: layout.rows > 2 ? '11px' : '14px', margin: '6px 0 0',
                      fontWeight: 500
                    }}>{p.brand}</p>
                  )}
                  {p.price && (
                    <p style={{
                      color: '#F2D78A', fontSize: layout.rows > 2 ? '13px' : '16px', margin: '4px 0 0',
                      fontWeight: 700
                    }}>R$ {p.price}</p>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              textAlign: 'center', zIndex: 1, paddingTop: '20px'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
                marginBottom: '10px'
              }}>
                <div style={{ height: '1px', width: '80px', background: 'linear-gradient(to right, transparent, #D6B56D, transparent)' }} />
                <span style={{
                  color: '#D6B56D', fontSize: '20px', fontWeight: 600,
                  letterSpacing: '3px', textTransform: 'uppercase'
                }}>A.C.M STORE</span>
                <div style={{ height: '1px', width: '80px', background: 'linear-gradient(to right, transparent, #D6B56D, transparent)' }} />
              </div>
              <p style={{
                color: '#A7A7A0', fontSize: '14px', margin: '0 0 8px', letterSpacing: '1px'
              }}>Qualidade e estilo para quem aprecia o melhor.</p>
              <div style={{
                color: '#A7A7A0', fontSize: '13px', lineHeight: 1.6
              }}>
                <span style={{ display: 'block' }}>Av Getulio Vargas 1157 Sala 1509</span>
                <span style={{ display: 'block', color: '#D6B56D' }}>(51) 99731-9858</span>
              </div>
            </div>
          </div>
        </div>

        <button className="btn-premium" onClick={handleGenerate}
          disabled={selectedProducts.length < 2 || generating}
          style={{ padding: '0.8rem 2rem', fontSize: '1rem', width: '100%', marginBottom: '0', opacity: selectedProducts.length < 2 ? 0.5 : 1 }}>
          {generating ? 'Gerando...' : `Criar Arte (${selectedProducts.length} produtos)`}
        </button>

        <div style={{ width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
            {products.map(p => (
              <div key={p.id} style={{
                display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.5rem',
                background: selected.includes(p.id) ? 'rgba(214,181,109,0.15)' : '#15181C',
                border: `1px solid ${selected.includes(p.id) ? '#D6B56D' : '#2A2D33'}`,
                borderRadius: '6px', transition: 'all 0.2s ease'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => toggleProduct(p.id)}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleProduct(p.id)}
                    style={{ accentColor: '#D6B56D', flexShrink: 0 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <img src={getFirstImage(p)} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#111315', flexShrink: 0 }} />
                    <span style={{ color: '#F5F5F0', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                </label>
                {selected.includes(p.id) && (
                  <>
                    <input type="text" placeholder="OFF%"
                      value={offValues[p.id] || ''}
                      onChange={(e) => setOffValues(v => ({ ...v, [p.id]: e.target.value }))}
                      style={{ width: '100%', background: '#070707', border: '1px solid #2A2D33', color: '#F5F5F0', fontSize: '0.7rem', padding: '0.25rem', borderRadius: '4px', boxSizing: 'border-box' }} />
                    <input type="text" placeholder="Preco"
                      value={priceValues[p.id] || ''}
                      onChange={(e) => setPriceValues(v => ({ ...v, [p.id]: e.target.value }))}
                      style={{ width: '100%', background: '#070707', border: '1px solid #2A2D33', color: '#F5F5F0', fontSize: '0.7rem', padding: '0.25rem', borderRadius: '4px', boxSizing: 'border-box', marginTop: '0.25rem' }} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
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

export default ArtGenerator;
