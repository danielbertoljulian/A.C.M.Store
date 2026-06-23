import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

function WholesaleBudget({ mobile }) {
  const [products, setProducts] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientStore, setClientStore] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCNPJ, setClientCNPJ] = useState('');
  const [selected, setSelected] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [sizeSelections, setSizeSelections] = useState({});
  const [priceOverrides, setPriceOverrides] = useState({});
  const [discount, setDiscount] = useState('');
  const [freight, setFreight] = useState('');
  const [freeFreight, setFreeFreight] = useState(false);
  const [notes, setNotes] = useState('');
  const [validity, setValidity] = useState('7');
  const [generating, setGenerating] = useState(false);
  const [budgetCounter, setBudgetCounter] = useState(0);
  const [budgetLoaded, setBudgetLoaded] = useState(false);
  const [sendVia, setSendVia] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const canvasRef = useRef(null);

  const PWD_KEY = 'acm_admin_pwd';
  const PWD_RAW_KEY = 'acm_admin_raw';
  const getAuthHeaders = () => ({
    'x-session-token': localStorage.getItem(PWD_KEY) || '',
    'x-admin-password': localStorage.getItem(PWD_RAW_KEY) || ''
  });

  useEffect(() => {
    fetch('/api/settings?key=wholesale_budget_counter')
      .then(r => r.ok ? r.json() : { value: '0' })
      .then(data => { setBudgetCounter(parseInt(data.value || '0')); setBudgetLoaded(true); })
      .catch(() => setBudgetLoaded(true));
  }, []);

  useEffect(() => {
    fetch('/api/wholesale_products')
      .then(r => r.ok ? r.json() : [])
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const budgetNumber = String(budgetCounter + 1).padStart(5, '0');

  const categories = [...new Set(products.flatMap(p => (p.categories || '').split(',').map(s => s.trim())).filter(Boolean))].sort();

  const parseCurrency = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const getUnitPrice = (p) => {
    if (priceOverrides[p.id]) return parseCurrency(priceOverrides[p.id]);
    if (p.price_wholesale) return parseCurrency(p.price_wholesale.replace(/R\$\s*/i, ''));
    return 0;
  };

  const toggleProduct = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(i => i !== id);
        setQuantities(v => { const n = { ...v }; delete n[id]; return n; });
        setPriceOverrides(v => { const n = { ...v }; delete n[id]; return n; });
        setSizeSelections(v => { const n = { ...v }; delete n[id]; return n; });
        return next;
      }
      setQuantities(v => ({ ...v, [id]: 1 }));
      return [...prev, id];
    });
  };

  const filtered = products.filter(p => {
    if (filterCat && !(p.categories || '').includes(filterCat)) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const selectedProducts = products.filter(p => selected.includes(p.id)).map(p => {
    const unitPrice = getUnitPrice(p);
    const qty = quantities[p.id] || 1;
    return { ...p, unitPrice, qty, total: unitPrice * qty };
  });

  const subtotal = selectedProducts.reduce((sum, p) => sum + p.total, 0);
  const discountValue = discount ? (subtotal * parseCurrency(discount) / 100) : 0;
  const freightValue = freeFreight ? 0 : (parseCurrency(freight) || 0);
  const grandTotal = subtotal - discountValue + freightValue;

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const generateWhatsApp = () => {
    if (!clientName.trim()) { alert('Preencha o nome do cliente.'); return; }
    if (selectedProducts.length === 0) { alert('Selecione pelo menos um produto.'); return; }

    let msg = `*ORÇAMENTO ATACADO #${budgetNumber}*\n`;
    msg += `*A.C.M Store*\n\n`;
    msg += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    msg += `📅 Validade: ${validity} dia(s)\n\n`;
    msg += `*CLIENTE*\n`;
    msg += `👤 ${clientName}\n`;
    if (clientStore) msg += `🏪 ${clientStore}\n`;
    if (clientPhone) msg += `📱 ${clientPhone}\n`;
    if (clientCNPJ) msg += `📋 CNPJ: ${clientCNPJ}\n`;
    msg += `\n*PRODUTOS*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    selectedProducts.forEach(p => {
      msg += `▸ ${p.name}\n`;
      if (p.brand) msg += `  Marca: ${p.brand}\n`;
      msg += `  Qtd: ${p.qty}x | Unit: ${formatCurrency(p.unitPrice)} | Total: ${formatCurrency(p.total)}\n\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*Subtotal: ${formatCurrency(subtotal)}*\n`;
    if (discountValue > 0) msg += `Desconto (${discount}%): -${formatCurrency(discountValue)}\n`;
    if (freightValue > 0) msg += `Frete: ${formatCurrency(freightValue)}\n`;
    if (freeFreight) msg += `Frete: GRATIS\n`;
    msg += `*TOTAL: ${formatCurrency(grandTotal)}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (notes) msg += `\n📝 *Observações:* ${notes}\n`;
    msg += `\n_Aguardamos seu retorno!_\n`;
    msg += `\n📞 (51) 98545-8900`;

    const url = `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleGenerateImage = async () => {
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
      link.download = `orcamento-atacado-${clientName.replace(/\s+/g, '-').toLowerCase()}-${budgetNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      const newCount = budgetCounter + 1;
      setBudgetCounter(newCount);
      fetch('/api/settings', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'wholesale_budget_counter', value: String(newCount) })
      }).catch(() => {});
    } catch (e) { console.error('Erro ao gerar imagem:', e); }
    setGenerating(false);
  };

  const today = new Date().toLocaleDateString('pt-BR');
  const validityDate = new Date(Date.now() + parseInt(validity || 7) * 86400000).toLocaleDateString('pt-BR');

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ color: '#D6B56D', fontSize: mobile ? '1rem' : '1.2rem', margin: 0 }}>
          Orçamento Atacado #{budgetNumber}
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem' }}>Validade:</label>
          <select value={validity} onChange={e => setValidity(e.target.value)} style={{
            background: '#15181C', border: '1px solid #2A2D33', padding: '6px 12px',
            color: '#F5F5F0', borderRadius: '6px', fontSize: '0.85rem'
          }}>
            <option value="3">3 dias</option>
            <option value="7">7 dias</option>
            <option value="15">15 dias</option>
            <option value="30">30 dias</option>
          </select>
        </div>
      </div>

      <div className="glass" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
        <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '12px' }}>Dados do Cliente</h4>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Nome / Loja *</label>
            <input type="text" placeholder="Nome do cliente ou loja" value={clientName} onChange={e => setClientName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Nome da Loja</label>
            <input type="text" placeholder="Razão social ou nome fantasia" value={clientStore} onChange={e => setClientStore(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Telefone / WhatsApp</label>
            <input type="text" placeholder="(51) 99999-0000" value={clientPhone} onChange={e => setClientPhone(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>CNPJ</label>
            <input type="text" placeholder="00.000.000/0001-00" value={clientCNPJ} onChange={e => setClientCNPJ(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
        <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '12px' }}>Condições</h4>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Desconto (%)</label>
            <input type="text" placeholder="Ex: 10" value={discount} onChange={e => setDiscount(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Frete (R$)</label>
            <input type="text" placeholder="0,00" value={freight} onChange={e => setFreight(e.target.value)} style={inputStyle} disabled={freeFreight} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A7A7A0', fontSize: '0.85rem', cursor: 'pointer', paddingBottom: '8px' }}>
              <input type="checkbox" checked={freeFreight} onChange={e => { setFreeFreight(e.target.checked); if (e.target.checked) setFreight(''); }}
                style={{ accentColor: '#D6B56D', width: '18px', height: '18px' }} />
              Frete Grátis
            </label>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Observações</label>
          <textarea placeholder="Ex: Pagamento à vista, prazo de entrega, etc." value={notes} onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Buscar produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '150px' }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
          background: '#15181C', border: '1px solid #2A2D33', padding: '8px 12px',
          color: '#F5F5F0', borderRadius: '6px', fontSize: '0.85rem'
        }}>
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', marginBottom: '1.5rem' }}>
        {filtered.map(p => (
          <div key={p.id} style={{
            display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px',
            background: selected.includes(p.id) ? 'rgba(214,181,109,0.15)' : '#15181C',
            border: `1px solid ${selected.includes(p.id) ? '#D6B56D' : '#2A2D33'}`,
            borderRadius: '8px', transition: 'all 0.2s ease'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleProduct(p.id)}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleProduct(p.id)}
                style={{ accentColor: '#D6B56D', flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <img src={getFirstImage(p)} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#111315', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <span style={{ color: '#F5F5F0', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.name}</span>
                  {p.price_wholesale && <span style={{ color: '#D6B56D', fontSize: '0.7rem' }}>{p.price_wholesale}</span>}
                </div>
              </div>
            </label>
            {selected.includes(p.id) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px' }}>
                <div>
                  <label style={{ color: '#A7A7A0', fontSize: '0.65rem', display: 'block' }}>Preço Unit.</label>
                  <input type="text" placeholder={p.price_wholesale || 'R$ 0,00'}
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
        <div className="glass" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
          <h4 style={{ color: '#D6B56D', marginBottom: '12px', fontSize: '0.95rem' }}>Resumo do Orçamento</h4>
          {selectedProducts.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #2A2D33' }}>
              <img src={getFirstImage(p)} alt="" style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '4px', background: '#111315', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#F5F5F0', fontSize: '0.8rem' }}>{p.name}</div>
                <div style={{ color: '#A7A7A0', fontSize: '0.7rem' }}>{p.qty}x {formatCurrency(p.unitPrice)}</div>
              </div>
              <div style={{ color: '#D6B56D', fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(p.total)}</div>
            </div>
          ))}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #D6B56D' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#A7A7A0', fontSize: '0.85rem' }}>Subtotal:</span>
              <span style={{ color: '#A7A7A0', fontSize: '0.85rem' }}>{formatCurrency(subtotal)}</span>
            </div>
            {discountValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#27ae60', fontSize: '0.85rem' }}>Desconto ({discount}%):</span>
                <span style={{ color: '#27ae60', fontSize: '0.85rem' }}>-{formatCurrency(discountValue)}</span>
              </div>
            )}
            {freightValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#A7A7A0', fontSize: '0.85rem' }}>Frete:</span>
                <span style={{ color: '#A7A7A0', fontSize: '0.85rem' }}>{formatCurrency(freightValue)}</span>
              </div>
            )}
            {freeFreight && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#27ae60', fontSize: '0.85rem' }}>Frete:</span>
                <span style={{ color: '#27ae60', fontSize: '0.85rem', fontWeight: 600 }}>GRÁTIS</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ color: '#D6B56D', fontSize: '1.1rem', fontWeight: 700 }}>TOTAL:</span>
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
              <div style={{ color: '#D6B56D', fontSize: '22px', fontWeight: 700 }}>ORÇAMENTO ATACADO</div>
              <div style={{ color: '#A7A7A0', fontSize: '14px' }}>Nº {budgetNumber}</div>
              <div style={{ color: '#A7A7A0', fontSize: '14px' }}>{today}</div>
              <div style={{ color: '#D6B56D', fontSize: '12px', marginTop: '4px' }}>Válido até: {validityDate}</div>
            </div>
          </div>

          <div style={{ width: '920px', zIndex: 1, marginBottom: '20px', padding: '15px 20px',
            background: 'rgba(214,181,109,0.08)', borderRadius: '8px', border: '1px solid #2A2D33' }}>
            <div style={{ color: '#D6B56D', fontSize: '14px', fontWeight: 600, marginBottom: '5px', letterSpacing: '2px', textTransform: 'uppercase' }}>CLIENTE</div>
            <div style={{ color: '#F5F5F0', fontSize: '18px', fontWeight: 600 }}>{clientName || '-'}</div>
            {clientStore && <div style={{ color: '#D6B56D', fontSize: '14px', marginTop: '3px' }}>{clientStore}</div>}
            {clientPhone && <div style={{ color: '#A7A7A0', fontSize: '14px', marginTop: '3px' }}>{clientPhone}</div>}
            {clientCNPJ && <div style={{ color: '#A7A7A0', fontSize: '14px', marginTop: '3px' }}>CNPJ: {clientCNPJ}</div>}
          </div>

          <div style={{ width: '920px', zIndex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2A2D33' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '55px' }}></th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>PRODUTO</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '50px' }}>QTD</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '110px' }}>UNITÁRIO</th>
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
              <div style={{ textAlign: 'right', minWidth: '250px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#A7A7A0', fontSize: '13px' }}>SUBTOTAL</span>
                  <span style={{ color: '#A7A7A0', fontSize: '13px' }}>{formatCurrency(subtotal)}</span>
                </div>
                {discountValue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#27ae60', fontSize: '13px' }}>DESCONTO ({discount}%)</span>
                    <span style={{ color: '#27ae60', fontSize: '13px' }}>-{formatCurrency(discountValue)}</span>
                  </div>
                )}
                {freightValue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#A7A7A0', fontSize: '13px' }}>FRETE</span>
                    <span style={{ color: '#A7A7A0', fontSize: '13px' }}>{formatCurrency(freightValue)}</span>
                  </div>
                )}
                {freeFreight && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#27ae60', fontSize: '13px' }}>FRETE</span>
                    <span style={{ color: '#27ae60', fontSize: '13px', fontWeight: 600 }}>GRÁTIS</span>
                  </div>
                )}
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2A2D33' }}>
                  <div style={{ color: '#A7A7A0', fontSize: '13px', marginBottom: '2px' }}>VALOR TOTAL</div>
                  <div style={{ color: '#D6B56D', fontSize: '28px', fontWeight: 700 }}>{formatCurrency(grandTotal)}</div>
                </div>
              </div>
            </div>
          </div>

          {notes && (
            <div style={{ width: '920px', zIndex: 1, marginTop: '15px', padding: '12px 20px',
              background: 'rgba(214,181,109,0.05)', borderRadius: '8px', border: '1px solid #2A2D33' }}>
              <div style={{ color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', marginBottom: '4px' }}>OBSERVAÇÕES</div>
              <div style={{ color: '#A7A7A0', fontSize: '13px', lineHeight: 1.5 }}>{notes}</div>
            </div>
          )}

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
              <span style={{ display: 'block', color: '#D6B56D', fontSize: '11px', marginTop: '4px' }}>https://a-c-m-store.vercel.app/atacado</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn-premium" onClick={handleGenerateImage}
          disabled={selectedProducts.length === 0 || !clientName.trim() || generating}
          style={{ flex: 1, padding: '0.8rem 1.5rem', fontSize: '0.95rem', opacity: (selectedProducts.length === 0 || !clientName.trim()) ? 0.5 : 1, minWidth: '200px' }}>
          {generating ? 'Gerando...' : 'Baixar Imagem'}
        </button>
        <button className="btn-premium" onClick={generateWhatsApp}
          disabled={selectedProducts.length === 0 || !clientName.trim()}
          style={{ flex: 1, padding: '0.8rem 1.5rem', fontSize: '0.95rem', background: '#25D366', minWidth: '200px', opacity: (selectedProducts.length === 0 || !clientName.trim()) ? 0.5 : 1 }}>
          Enviar via WhatsApp
        </button>
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
  color: '#D6B56D', fontSize: '0.7rem', padding: '0.25rem',
  borderRadius: '4px', boxSizing: 'border-box', fontWeight: 600
};

export default WholesaleBudget;
