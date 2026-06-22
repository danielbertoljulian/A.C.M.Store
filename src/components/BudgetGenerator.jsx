import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

function BudgetGenerator({ mobile, products }) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selected, setSelected] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [priceOverrides, setPriceOverrides] = useState({});
  const [generating, setGenerating] = useState(false);
  const [budgetCounter, setBudgetCounter] = useState(0);
  const [budgetLoaded, setBudgetLoaded] = useState(false);
  const canvasRef = useRef(null);

  const PWD_KEY = 'acm_admin_pwd';
  const PWD_RAW_KEY = 'acm_admin_raw';
  const getAuthHeaders = () => ({ 'x-session-token': localStorage.getItem(PWD_KEY) || '', 'x-admin-password': localStorage.getItem(PWD_RAW_KEY) || '' });

  useEffect(() => {
    fetch('/api/settings?key=budget_counter')
      .then(r => r.ok ? r.json() : { value: '0' })
      .then(data => { setBudgetCounter(parseInt(data.value || '0')); setBudgetLoaded(true); })
      .catch(() => setBudgetLoaded(true));
  }, []);

  const budgetNumber = String(budgetCounter + 1).padStart(5, '0');

  const toggleProduct = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(i => i !== id);
        setQuantities(v => { const n = { ...v }; delete n[id]; return n; });
        setPriceOverrides(v => { const n = { ...v }; delete n[id]; return n; });
        return next;
      }
      setQuantities(v => ({ ...v, [id]: 1 }));
      return [...prev, id];
    });
  };

  const parseCurrency = (str) => {
    if (!str) return 0;
    const val = str.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(val) || 0;
  };

  const getUnitPrice = (p) => {
    if (priceOverrides[p.id]) return parseCurrency(priceOverrides[p.id]);
    if (p.price) return parseCurrency(p.price.replace(/R\$\s*/i, ''));
    return 0;
  };

  const selectedProducts = products.filter(p => selected.includes(p.id)).map(p => {
    const unitPrice = getUnitPrice(p);
    const qty = quantities[p.id] || 1;
    return { ...p, unitPrice, qty, total: unitPrice * qty };
  });

  const grandTotal = selectedProducts.reduce((sum, p) => sum + p.total, 0);

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleGenerate = async () => {
    if (!clientName.trim()) { alert('Preencha o nome do cliente.'); return; }
    if (selectedProducts.length === 0) { alert('Selecione pelo menos um produto.'); return; }
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
      link.download = `orcamento-${clientName.replace(/\s+/g, '-').toLowerCase()}-${budgetNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      const newCount = budgetCounter + 1;
      setBudgetCounter(newCount);
      fetch('/api/settings', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'budget_counter', value: String(newCount) })
      }).catch(() => {});
    } catch (e) { console.error('Erro ao gerar orcamento:', e); }
    setGenerating(false);
  };

  const today = new Date().toLocaleDateString('pt-BR');

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ color: '#D6B56D', marginBottom: '1rem', fontSize: mobile ? '1rem' : '1.2rem' }}>Novo Orcamento</h3>

      <div className="glass" style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Cliente *</label>
            <input type="text" placeholder="Nome do cliente" value={clientName} onChange={e => setClientName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Telefone</label>
            <input type="text" placeholder="(51) 99999-0000" value={clientPhone} onChange={e => setClientPhone(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>E-mail</label>
            <input type="email" placeholder="cliente@email.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      <h4 style={{ color: '#D6B56D', marginBottom: '0.75rem', fontSize: '0.95rem' }}>Selecionar Produtos ({selected.length})</h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', marginBottom: '1.5rem' }}>
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
                <div style={{ minWidth: 0 }}>
                  <span style={{ color: '#F5F5F0', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.name}</span>
                  {p.price && <span style={{ color: '#D6B56D', fontSize: '0.7rem' }}>{p.price}</span>}
                </div>
              </div>
            </label>
            {selected.includes(p.id) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.25rem' }}>
                <div>
                  <label style={{ color: '#A7A7A0', fontSize: '0.65rem', display: 'block' }}>Preco Unit.</label>
                  <input type="text" placeholder={p.price || 'R$ 0,00'}
                    value={priceOverrides[p.id] || ''}
                    onChange={(e) => setPriceOverrides(v => ({ ...v, [p.id]: e.target.value }))}
                    style={smallInput} />
                </div>
                <div>
                  <label style={{ color: '#A7A7A0', fontSize: '0.65rem', display: 'block' }}>Qtd.</label>
                  <input type="number" min="1" value={quantities[p.id] || 1}
                    onChange={(e) => setQuantities(v => ({ ...v, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                    style={{ ...smallInput, textAlign: 'center' }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <div className="glass" style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
          <h4 style={{ color: '#D6B56D', marginBottom: '0.75rem', fontSize: '0.95rem' }}>Resumo do Orcamento</h4>
          {selectedProducts.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #2A2D33' }}>
              <img src={getFirstImage(p)} alt="" style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '4px', background: '#111315', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#F5F5F0', fontSize: '0.8rem' }}>{p.name}</div>
                <div style={{ color: '#A7A7A0', fontSize: '0.7rem' }}>{p.qty}x {formatCurrency(p.unitPrice)}</div>
              </div>
              <div style={{ color: '#D6B56D', fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(p.total)}</div>
            </div>
          ))}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid #D6B56D' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#D6B56D', fontSize: '1.1rem', fontWeight: 700 }}>Total:</span>
              <span style={{ color: '#D6B56D', fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: '100%', overflow: 'auto', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
        <div ref={canvasRef} style={{
          width: '1080px',
          background: 'linear-gradient(135deg, #070707 0%, #15181C 50%, #070707 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: '40px', paddingBottom: '30px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15,
            background: 'radial-gradient(ellipse at center, rgba(214,181,109,0.3) 0%, transparent 70%)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', zIndex: 1, marginBottom: '15px', width: '920px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <img src="/LOGO_1_TRNSP.png" alt="A.C.M Store" style={{ height: '65px', width: 'auto', filter: 'drop-shadow(0 4px 20px rgba(214,181,109,0.3))' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#D6B56D', fontSize: '22px', fontWeight: 700 }}>ORCAMENTO</div>
              <div style={{ color: '#A7A7A0', fontSize: '14px' }}>No {budgetNumber}</div>
              <div style={{ color: '#A7A7A0', fontSize: '14px' }}>{today}</div>
            </div>
          </div>

          <div style={{ width: '920px', zIndex: 1, marginBottom: '20px', padding: '15px 20px',
            background: 'rgba(214,181,109,0.08)', borderRadius: '8px', border: '1px solid #2A2D33' }}>
            <div style={{ color: '#D6B56D', fontSize: '14px', fontWeight: 600, marginBottom: '5px', letterSpacing: '2px', textTransform: 'uppercase' }}>CLIENTE</div>
            <div style={{ color: '#F5F5F0', fontSize: '18px', fontWeight: 600 }}>{clientName}</div>
            {clientPhone && <div style={{ color: '#A7A7A0', fontSize: '14px', marginTop: '3px' }}>{clientPhone}</div>}
            {clientEmail && <div style={{ color: '#A7A7A0', fontSize: '14px', marginTop: '3px' }}>{clientEmail}</div>}
          </div>

          <div style={{ width: '920px', zIndex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2A2D33' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '55px' }}></th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>PRODUTO</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '50px' }}>QTD</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '110px' }}>UNITARIO</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '120px' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #2A2D33' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <img src={getFirstImage(p)} alt="" style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '4px', background: '#111315' }} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ color: '#F5F5F0', fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
                      {p.brand && <div style={{ color: '#D6B56D', fontSize: '11px', marginTop: '2px' }}>{p.brand}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#F5F5F0', fontSize: '14px' }}>{p.qty}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#A7A7A0', fontSize: '13px' }}>{formatCurrency(p.unitPrice)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#D6B56D', fontSize: '15px', fontWeight: 700 }}>{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ width: '920px', zIndex: 1, marginTop: '20px', padding: '15px 20px',
            background: 'rgba(214,181,109,0.1)', borderRadius: '8px', border: '1px solid #2A2D33' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#A7A7A0', fontSize: '13px', marginBottom: '2px' }}>VALOR TOTAL</div>
                <div style={{ color: '#D6B56D', fontSize: '28px', fontWeight: 700 }}>{formatCurrency(grandTotal)}</div>
              </div>
            </div>
          </div>

          <div style={{
            width: '920px', textAlign: 'center', zIndex: 1, marginTop: '30px',
            borderTop: '1px solid #2A2D33', paddingTop: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '8px' }}>
              <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to right, transparent, #D6B56D, transparent)' }} />
              <span style={{ color: '#D6B56D', fontSize: '16px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' }}>A.C.M STORE</span>
              <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to right, transparent, #D6B56D, transparent)' }} />
            </div>
            <p style={{ color: '#A7A7A0', fontSize: '12px', margin: '0 0 6px', letterSpacing: '1px' }}>Qualidade e estilo para quem aprecia o melhor.</p>
            <div style={{ color: '#A7A7A0', fontSize: '12px', lineHeight: 1.5 }}>
              <span style={{ display: 'block' }}>Av Getulio Vargas 1157 Sala 1509</span>
              <span style={{ display: 'block', color: '#D6B56D' }}>(51) 98545-8900</span>
            </div>
          </div>
        </div>
      </div>

      <button className="btn-premium" onClick={handleGenerate}
        disabled={selectedProducts.length === 0 || !clientName.trim() || generating}
        style={{ padding: '0.8rem 2rem', fontSize: '1rem', width: '100%', marginBottom: '0', opacity: (selectedProducts.length === 0 || !clientName.trim()) ? 0.5 : 1 }}>
        {generating ? 'Gerando...' : `Gerar Orcamento (${selectedProducts.length} itens) - ${formatCurrency(grandTotal)}`}
      </button>
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
  color: '#D6B56D', fontSize: '0.7rem', padding: '0.25rem',
  borderRadius: '4px', boxSizing: 'border-box', fontWeight: 600
};

export default BudgetGenerator;
