import React, { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';

const API = '/api/wholesale_requests';
const PWD_KEY = 'acm_admin_pwd';
const PWD_RAW_KEY = 'acm_admin_raw';
const getAuthHeaders = () => ({
  'x-session-token': localStorage.getItem(PWD_KEY) || '',
  'x-admin-password': localStorage.getItem(PWD_RAW_KEY) || '',
  'Content-Type': 'application/json'
});

const statusColors = {
  pendente: { bg: '#f39c12', label: 'Pendente' },
  aprovado: { bg: '#27ae60', label: 'Aprovado' },
  recusado: { bg: '#e74c3c', label: 'Recusado' },
  enviado: { bg: '#3498db', label: 'Enviado' },
  concluido: { bg: '#8e44ad', label: 'Concluido' }
};

function WholesaleRequestsAdmin({ mobile }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [success, setSuccess] = useState('');
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);
  const [editPrices, setEditPrices] = useState({});
  const [editQtys, setEditQtys] = useState({});
  const [discount, setDiscount] = useState('');
  const [freight, setFreight] = useState('');
  const [freeFreight, setFreeFreight] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [validity, setValidity] = useState('7');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?_=${Date.now()}`, { headers: getAuthHeaders() });
      if (r.ok) {
        const data = await r.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateStatus = async (id, status) => {
    try {
      const r = await fetch(API, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id, status }) });
      if (r.ok) { setSuccess('Status atualizado!'); fetchRequests(); }
    } catch {}
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta solicitacao?')) return;
    try {
      const r = await fetch(`${API}?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (r.ok) { setSuccess('Solicitacao excluida!'); fetchRequests(); setSelectedReq(null); }
    } catch {}
  };

  const generateArt = async () => {
    if (!canvasRef.current) return;
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
      link.download = `orcamento-${selectedReq.client_name.replace(/\s+/g, '-').toLowerCase()}-${selectedReq.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('Erro ao gerar arte:', e); }
    setGenerating(false);
  };

  const sendArtWhatsApp = async () => {
    if (!canvasRef.current) return;
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
      canvas.toBlob(async (blob) => {
        if (!blob) { setGenerating(false); return; }
        const file = new File([blob], `orcamento-${selectedReq.id}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `Orcamento ${selectedReq.id}` });
          } catch {}
        } else {
          const link = document.createElement('a');
          link.download = `orcamento-${selectedReq.client_name.replace(/\s+/g, '-').toLowerCase()}-${selectedReq.id}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
        const phone = (selectedReq.client_phone || '').replace(/\D/g, '');
        const msg = encodeURIComponent(`Ola ${selectedReq.client_name}! Segue o orcamento #${selectedReq.id} em anexo.`);
        window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
        setGenerating(false);
      }, 'image/png');
    } catch (e) { console.error('Erro ao gerar arte:', e); setGenerating(false); }
  };

  const copyToClipboard = async () => {
    if (!canvasRef.current) return;
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
      canvas.toBlob(async (blob) => {
        if (!blob) { setGenerating(false); return; }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setSuccess('Imagem copiada! Cole no WhatsApp (Ctrl+V)');
        } catch {
          const link = document.createElement('a');
          link.download = `orcamento-${selectedReq.client_name.replace(/\s+/g, '-').toLowerCase()}-${selectedReq.id}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setSuccess('Imagem baixada. Cole no WhatsApp (Ctrl+V)');
        }
        setGenerating(false);
      }, 'image/png');
    } catch (e) { console.error('Erro ao copiar:', e); setGenerating(false); }
  };

  const parseProducts = (productsStr) => {
    try { const p = JSON.parse(productsStr); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR') + ' ' + new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const calcSubtotal = () => {
    if (!selectedReq) return 0;
    return parseProducts(selectedReq.products).reduce((sum, p, i) => {
      const qty = editQtys[i] !== undefined ? editQtys[i] : (p.qty || 1);
      const priceStr = editPrices[i] !== undefined ? editPrices[i] : (p.price_wholesale || '');
      return sum + (parseCurrency(priceStr) * qty);
    }, 0);
  };

  const calcTotal = () => {
    const sub = calcSubtotal();
    const discVal = discount ? (sub * parseCurrency(discount) / 100) : 0;
    const freightVal = freeFreight ? 0 : (parseCurrency(freight) || 0);
    return sub - discVal + freightVal;
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ color: '#D6B56D', fontSize: mobile ? '1rem' : '1.2rem', marginBottom: '1rem' }}>
        Solicitacoes de Orcamento ({requests.length})
      </h3>

      {success && <div style={{ background: '#27ae60', color: 'white', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

      {loading ? (
        <p style={{ color: '#A7A7A0', textAlign: 'center' }}>Carregando...</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#A7A7A0' }}>
          <p>Nenhuma solicitacao de orcamento ainda.</p>
        </div>
      ) : selectedReq ? (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', background: '#15181C', border: '1px solid #2A2D33' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button onClick={() => setSelectedReq(null)} style={{ background: 'transparent', border: '1px solid #2A2D33', color: '#A7A7A0', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              ← Voltar
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Object.entries(statusColors).map(([key, val]) => (
                <button key={key} onClick={() => updateStatus(selectedReq.id, key)} style={{
                  background: selectedReq.status === key ? val.bg : 'transparent',
                  border: `1px solid ${val.bg}`,
                  color: selectedReq.status === key ? 'white' : val.bg,
                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                }}>{val.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '8px' }}>Dados do Cliente</h4>
              <div style={{ background: '#070707', padding: '12px', borderRadius: '8px', border: '1px solid #2A2D33' }}>
                <p style={{ color: '#F5F5F0', fontSize: '0.9rem', margin: '0 0 4px' }}><strong>{selectedReq.client_name}</strong></p>
                {selectedReq.client_store && <p style={{ color: '#D6B56D', fontSize: '0.8rem', margin: '0 0 4px' }}>{selectedReq.client_store}</p>}
                {selectedReq.client_phone && <p style={{ color: '#A7A7A0', fontSize: '0.8rem', margin: '0 0 4px' }}>📱 {selectedReq.client_phone}</p>}
                {selectedReq.client_email && <p style={{ color: '#A7A7A0', fontSize: '0.8rem', margin: '0 0 4px' }}>✉️ {selectedReq.client_email}</p>}
                {selectedReq.client_cnpj && <p style={{ color: '#A7A7A0', fontSize: '0.8rem', margin: '0 0 4px' }}>📋 CNPJ: {selectedReq.client_cnpj}</p>}
              </div>
            </div>
            <div>
              <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '8px' }}>Info</h4>
              <div style={{ background: '#070707', padding: '12px', borderRadius: '8px', border: '1px solid #2A2D33' }}>
                <p style={{ color: '#A7A7A0', fontSize: '0.8rem', margin: '0 0 4px' }}>Data: {formatDate(selectedReq.created_at)}</p>
                <p style={{ color: '#A7A7A0', fontSize: '0.8rem', margin: '0 0 4px' }}>ID: {selectedReq.id}</p>
                <p style={{ margin: '8px 0 0' }}>
                  <span style={{ background: statusColors[selectedReq.status]?.bg || '#666', color: 'white', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {statusColors[selectedReq.status]?.label || selectedReq.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '8px' }}>Produtos Solicitados</h4>
          <div style={{ background: '#070707', padding: '12px', borderRadius: '8px', border: '1px solid #2A2D33', marginBottom: '1rem' }}>
            {parseProducts(selectedReq.products).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < parseProducts(selectedReq.products).length - 1 ? '1px solid #2A2D33' : 'none' }}>
                {p.image && <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#15181C' }} />}
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#F5F5F0', fontSize: '0.85rem' }}>{p.name}</span>
                  {p.brand && <span style={{ color: '#D6B56D', fontSize: '0.75rem', marginLeft: '8px' }}>{p.brand}</span>}
                </div>
                <span style={{ color: '#A7A7A0', fontSize: '0.8rem' }}>Qtd: {p.qty || '-'}</span>
                {p.size && <span style={{ color: '#D6B56D', fontSize: '0.8rem' }}>Tam: {p.size}</span>}
              </div>
            ))}
          </div>

          {selectedReq.notes && (
            <div style={{ background: '#070707', padding: '12px', borderRadius: '8px', border: '1px solid #2A2D33', marginBottom: '1rem' }}>
              <h4 style={{ color: '#D6B56D', fontSize: '0.85rem', marginBottom: '6px' }}>Observacoes</h4>
              <p style={{ color: '#A7A7A0', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{selectedReq.notes}</p>
            </div>
          )}

          <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '8px' }}>Editar Orcamento</h4>
          <div className="glass" style={{ padding: '1rem', borderRadius: '12px', background: '#15181C', border: '1px solid #2A2D33', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Desconto (%)</label>
                <input type="text" placeholder="0" value={discount} onChange={e => setDiscount(e.target.value)}
                  style={editInput} />
              </div>
              <div>
                <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Frete (R$)</label>
                <input type="text" placeholder="0,00" value={freight} onChange={e => setFreight(e.target.value)}
                  style={editInput} disabled={freeFreight} />
              </div>
              <div>
                <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Validade</label>
                <select value={validity} onChange={e => setValidity(e.target.value)} style={editInput}>
                  <option value="3">3 dias</option>
                  <option value="7">7 dias</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A7A7A0', fontSize: '0.8rem', cursor: 'pointer', paddingBottom: '8px' }}>
                  <input type="checkbox" checked={freeFreight} onChange={e => { setFreeFreight(e.target.checked); if (e.target.checked) setFreight(''); }}
                    style={{ accentColor: '#D6B56D', width: '16px', height: '16px' }} />
                  Frete Gratis
                </label>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#A7A7A0', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Observacoes do Orcamento</label>
              <textarea placeholder="Ex: Pagamento a vista, prazo de entrega..." value={editNotes} onChange={e => setEditNotes(e.target.value)}
                style={{ ...editInput, minHeight: '50px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '60px 1fr 80px 80px 80px', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: '#D6B56D', fontSize: '0.7rem', fontWeight: 600 }}>FOTO</span>
                <span style={{ color: '#D6B56D', fontSize: '0.7rem', fontWeight: 600 }}>PRODUTO</span>
                <span style={{ color: '#D6B56D', fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>QTD</span>
                <span style={{ color: '#D6B56D', fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>TAM</span>
                <span style={{ color: '#D6B56D', fontSize: '0.7rem', fontWeight: 600, textAlign: 'right' }}>PRECO UNIT.</span>
              </div>
              {parseProducts(selectedReq.products).map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '60px 1fr 80px 80px 80px', gap: '8px', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #2A2D33' }}>
                  {p.image && <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#111315' }} />}
                  <div>
                    <span style={{ color: '#F5F5F0', fontSize: '0.8rem' }}>{p.name}</span>
                    {p.brand && <span style={{ color: '#D6B56D', fontSize: '0.7rem', marginLeft: '6px' }}>{p.brand}</span>}
                  </div>
                  <input type="number" min="1" value={editQtys[i] !== undefined ? editQtys[i] : (p.qty || 1)}
                    onChange={e => setEditQtys(v => ({ ...v, [i]: Math.max(1, parseInt(e.target.value) || 1) }))}
                    style={{ ...editInput, textAlign: 'center' }} />
                  <span style={{ color: '#D6B56D', fontSize: '0.8rem', textAlign: 'center', fontWeight: 600 }}>{p.size || '-'}</span>
                  <input type="text" placeholder="R$ 0,00" value={editPrices[i] !== undefined ? editPrices[i] : (p.price_wholesale || '')}
                    onChange={e => setEditPrices(v => ({ ...v, [i]: e.target.value }))}
                    style={{ ...editInput, textAlign: 'right' }} />
                </div>
              ))}
            </div>
          </div>

          <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '8px' }}>Preview do Orcamento</h4>
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
                <img src="/LOGO_1_TRNSP.png" alt="A.C.M Store" style={{ height: '65px', width: 'auto', filter: 'drop-shadow(0 4px 20px rgba(214,181,109,0.3))' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#D6B56D', fontSize: '22px', fontWeight: 700 }}>ORCAMENTO ATACADO</div>
                  <div style={{ color: '#A7A7A0', fontSize: '14px' }}>N. {selectedReq.id}</div>
                  <div style={{ color: '#A7A7A0', fontSize: '14px' }}>{formatDate(selectedReq.created_at)}</div>
                  <div style={{ color: '#D6B56D', fontSize: '12px', marginTop: '4px' }}>Valido por {validity} dia(s)</div>
                </div>
              </div>

              <div style={{ width: '920px', zIndex: 1, marginBottom: '20px', padding: '15px 20px',
                background: 'rgba(214,181,109,0.08)', borderRadius: '8px', border: '1px solid #2A2D33' }}>
                <div style={{ color: '#D6B56D', fontSize: '14px', fontWeight: 600, marginBottom: '5px', letterSpacing: '2px', textTransform: 'uppercase' }}>CLIENTE</div>
                <div style={{ color: '#F5F5F0', fontSize: '18px', fontWeight: 600 }}>{selectedReq.client_name}</div>
                {selectedReq.client_store && <div style={{ color: '#D6B56D', fontSize: '14px', marginTop: '3px' }}>{selectedReq.client_store}</div>}
                {selectedReq.client_phone && <div style={{ color: '#A7A7A0', fontSize: '14px', marginTop: '3px' }}>{selectedReq.client_phone}</div>}
                {selectedReq.client_cnpj && <div style={{ color: '#A7A7A0', fontSize: '14px', marginTop: '3px' }}>CNPJ: {selectedReq.client_cnpj}</div>}
              </div>

              <div style={{ width: '920px', zIndex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #2A2D33' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '55px' }}></th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>PRODUTO</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '50px' }}>QTD</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '50px' }}>TAM</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '110px' }}>UNITARIO</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', width: '120px' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseProducts(selectedReq.products).map((p, i) => {
                      const qty = editQtys[i] !== undefined ? editQtys[i] : (p.qty || 1);
                      const priceStr = editPrices[i] !== undefined ? editPrices[i] : (p.price_wholesale || '');
                      const priceNum = parseCurrency(priceStr);
                      const lineTotal = priceNum * qty;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #2A2D33' }}>
                          <td style={{ padding: '10px 12px' }}>
                            {p.image && <img src={p.image} alt="" style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '4px', background: '#111315' }} />}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ color: '#F5F5F0', fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
                            {p.brand && <div style={{ color: '#D6B56D', fontSize: '11px', marginTop: '2px' }}>{p.brand}</div>}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#F5F5F0', fontSize: '14px' }}>{qty}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#D6B56D', fontSize: '13px', fontWeight: 600 }}>{p.size || '-'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#A7A7A0', fontSize: '13px' }}>{priceNum > 0 ? formatCurrency(priceNum) : '-'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#D6B56D', fontSize: '15px', fontWeight: 700 }}>{lineTotal > 0 ? formatCurrency(lineTotal) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ width: '920px', zIndex: 1, marginTop: '20px', padding: '15px 20px',
                background: 'rgba(214,181,109,0.1)', borderRadius: '8px', border: '1px solid #2A2D33' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right', minWidth: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#A7A7A0', fontSize: '13px' }}>SUBTOTAL</span>
                      <span style={{ color: '#A7A7A0', fontSize: '13px' }}>{formatCurrency(calcSubtotal())}</span>
                    </div>
                    {discount && parseCurrency(discount) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#27ae60', fontSize: '13px' }}>DESCONTO ({discount}%)</span>
                        <span style={{ color: '#27ae60', fontSize: '13px' }}>-{formatCurrency(calcSubtotal() * parseCurrency(discount) / 100)}</span>
                      </div>
                    )}
                    {freeFreight && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#27ae60', fontSize: '13px' }}>FRETE</span>
                        <span style={{ color: '#27ae60', fontSize: '13px', fontWeight: 600 }}>GRATIS</span>
                      </div>
                    )}
                    {!freeFreight && freight && parseCurrency(freight) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#A7A7A0', fontSize: '13px' }}>FRETE</span>
                        <span style={{ color: '#A7A7A0', fontSize: '13px' }}>{formatCurrency(parseCurrency(freight))}</span>
                      </div>
                    )}
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2A2D33' }}>
                      <div style={{ color: '#A7A7A0', fontSize: '13px', marginBottom: '2px' }}>VALOR TOTAL</div>
                      <div style={{ color: '#D6B56D', fontSize: '28px', fontWeight: 700 }}>{formatCurrency(calcTotal())}</div>
                    </div>
                  </div>
                </div>
              </div>

              {editNotes && (
                <div style={{ width: '920px', zIndex: 1, marginTop: '15px', padding: '12px 20px',
                  background: 'rgba(214,181,109,0.05)', borderRadius: '8px', border: '1px solid #2A2D33' }}>
                  <div style={{ color: '#D6B56D', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', marginBottom: '4px' }}>OBSERVACOES</div>
                  <div style={{ color: '#A7A7A0', fontSize: '13px', lineHeight: 1.5 }}>{editNotes}</div>
                </div>
              )}

              <div style={{ width: '920px', textAlign: 'center', zIndex: 1, marginTop: '30px',
                borderTop: '1px solid #2A2D33', paddingTop: '15px' }}>
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

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={generateArt} disabled={generating}
              style={{ background: '#D6B56D', color: '#070707', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: generating ? 0.6 : 1 }}>
              {generating ? 'Gerando...' : 'Baixar Imagem'}
            </button>
            <button onClick={copyToClipboard} disabled={generating}
              style={{ background: 'transparent', border: '1px solid #D6B56D', color: '#D6B56D', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: generating ? 0.6 : 1 }}>
              {generating ? 'Gerando...' : 'Copiar Imagem'}
            </button>
            <button onClick={sendArtWhatsApp} disabled={generating}
              style={{ background: '#25D366', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: generating ? 0.6 : 1 }}>
              {generating ? 'Gerando...' : 'Enviar via WhatsApp'}
            </button>
            <a href={`https://wa.me/55${(selectedReq.client_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Ola ${selectedReq.client_name}! Recebemos sua solicitacao de orcamento #${selectedReq.id}. Em breve entraremos em contato!`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ background: 'transparent', border: '1px solid #25D366', color: '#25D366', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              Mensagem
            </a>
            <button onClick={() => handleDelete(selectedReq.id)} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Excluir
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {requests.map(req => {
            const prods = parseProducts(req.products);
            return (
              <div key={req.id} onClick={() => { setSelectedReq(req); setEditPrices({}); setEditQtys({}); setDiscount(''); setFreight(''); setFreeFreight(false); setEditNotes(req.notes || ''); setValidity('7'); }} className="glass"
                style={{ padding: '1rem', borderRadius: '12px', background: '#15181C', border: '1px solid #2A2D33', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#D6B56D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2D33'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ color: '#F5F5F0', fontSize: '0.9rem' }}>{req.client_name}</strong>
                      <span style={{ background: statusColors[req.status]?.bg || '#666', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {statusColors[req.status]?.label || req.status}
                      </span>
                    </div>
                    {req.client_store && <span style={{ color: '#D6B56D', fontSize: '0.8rem' }}>{req.client_store}</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#A7A7A0', fontSize: '0.75rem' }}>{formatDate(req.created_at)}</span>
                    <div style={{ color: '#D6B56D', fontSize: '0.8rem', marginTop: '2px' }}>{prods.length} produto(s)</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WholesaleRequestsAdmin;

const parseCurrency = (str) => {
  if (!str) return 0;
  return parseFloat(String(str).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
};

const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const editInput = {
  width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2A2D33',
  background: '#070707', color: '#F5F5F0', fontSize: '0.85rem', boxSizing: 'border-box'
};
