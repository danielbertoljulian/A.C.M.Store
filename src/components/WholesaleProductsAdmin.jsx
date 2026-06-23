import React, { useState, useEffect, useCallback } from 'react';

const API = '/api/wholesale_products';
const PWD_KEY = 'acm_admin_pwd';
const PWD_RAW_KEY = 'acm_admin_raw';
const getAuthHeaders = () => ({
  'x-session-token': localStorage.getItem(PWD_KEY) || '',
  'x-admin-password': localStorage.getItem(PWD_RAW_KEY) || '',
  'Content-Type': 'application/json'
});

const defaultSizes = { P: '', M: '', G: '', GG: '', XG: '' };

function WholesaleProductsAdmin({ mobile }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?_=${Date.now()}`, { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const categories = [...new Set(products.flatMap(p => (p.categories || '').split(',').map(s => s.trim())).filter(Boolean))].sort();

  const filtered = products.filter(p => {
    if (filterCat && !(p.categories || '').includes(filterCat)) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleSave = async (product) => {
    try {
      const isNew = !product.id;
      const r = await fetch(API, { method: isNew ? 'POST' : 'PUT', headers: getAuthHeaders(), body: JSON.stringify(product) });
      if (!r.ok) { const b = await r.json().catch(() => ({ error: 'Erro ao salvar' })); throw new Error(b.error); }
      setSuccess(isNew ? 'Produto criado!' : 'Produto atualizado!');
      setEditing(null);
      fetchProducts();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este produto atacado?')) return;
    try {
      const r = await fetch(`${API}?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (r.ok) { setSuccess('Produto excluido!'); fetchProducts(); }
    } catch (e) { setError(e.message); }
  };

  const toggleExport = async (product) => {
    try {
      const r = await fetch(API, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...product, export_to_retail: !product.export_to_retail })
      });
      if (r.ok) {
        setSuccess(product.export_to_retail ? 'Removido do varejo' : 'Exportado para varejo!');
        fetchProducts();
      }
    } catch (e) { setError(e.message); }
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUploadImage = async (file) => {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Falha ao ler imagem'));
      reader.readAsDataURL(file);
    });
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': localStorage.getItem(PWD_KEY) || '', 'x-admin-password': localStorage.getItem(PWD_RAW_KEY) || '' },
      body: JSON.stringify({ name: file.name, type: file.type, dataUrl })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Falha ao enviar imagem');
    if (!data.dataUrl) throw new Error('Upload nao retornou dados');
    return data.dataUrl;
  };

  const getFirstImage = (p) => {
    if (p.images) { try { const a = JSON.parse(p.images); if (a.length > 0) return a[0]; } catch {} }
    return p.image || '';
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ color: '#D6B56D', fontSize: mobile ? '1rem' : '1.2rem', margin: 0 }}>Produtos Atacado ({products.length})</h3>
        <button className="btn-premium" onClick={() => setEditing({})} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>+ Novo Produto</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={selectStyle}>
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '150px' }} />
      </div>

      {success && <div style={{ background: '#27ae60', color: 'white', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{success} <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button></div>}
      {error && <div style={{ background: '#e74c3c', color: 'white', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{error} <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button></div>}

      {editing !== null && (
        <WholesaleProductForm product={editing} onSave={handleSave} onUpload={handleUploadImage} onCancel={() => setEditing(null)} mobile={mobile} />
      )}

      {loading ? (
        <p style={{ color: '#A7A7A0', textAlign: 'center' }}>Carregando...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
          {filtered.map(p => (
            <div key={p.id} className="glass" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #2A2D33', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '140px', overflow: 'hidden', background: '#111315', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                <img src={getFirstImage(p)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ padding: '0.75rem', flex: 1 }}>
                <strong style={{ color: 'white', fontSize: '0.8rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</strong>
                <small style={{ color: '#A7A7A0', fontSize: '0.7rem' }}>{p.brand}</small>
                {p.price_wholesale && (
                  <div style={{ color: '#D6B56D', fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>
                    Atacado: R$ {p.price_wholesale}
                  </div>
                )}
                {p.price_varejo && (
                  <div style={{ color: '#A7A7A0', fontSize: '0.7rem', textDecoration: 'line-through' }}>
                    Varejo: R$ {p.price_varejo}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setEditing(p)} style={smallBtn}>Editar</button>
                  <button onClick={() => toggleExport(p)} style={{
                    ...smallBtn,
                    background: p.export_to_retail ? '#25D366' : 'transparent',
                    borderColor: '#25D366',
                    color: p.export_to_retail ? '#070707' : '#25D366'
                  }}>{p.export_to_retail ? '✓ No Varejo' : 'Exportar'}</button>
                  <button onClick={() => handleDelete(p.id)} style={{ ...smallBtn, borderColor: '#e74c3c', color: '#e74c3c' }}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WholesaleProductForm({ product, onSave, onUpload, onCancel, mobile }) {
  const parseSizesInit = (p) => {
    const raw = p.sizes || { P: '', M: '', G: '', GG: '', XG: '' };
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return { P: '', M: '', G: '', GG: '', XG: '' }; } }
    return raw || { P: '', M: '', G: '', GG: '', XG: '' };
  };
  const parseImagesInit = (p) => {
    if (Array.isArray(p.images)) return JSON.stringify(p.images);
    if (typeof p.images === 'string') { try { const a = JSON.parse(p.images); return Array.isArray(a) ? JSON.stringify(a) : '[]'; } catch { return '[]'; } }
    return '[]';
  };
  const [form, setForm] = useState({
    name: '', slug: '', brand: '', categories: '', image: '', images: '[]',
    description: '', sizes: { P: '', M: '', G: '', GG: '', XG: '' },
    colors: '', min_quantity: 1, grade_info: '', price_wholesale: '', price_varejo: '',
    off: '', stock_status: 'pronta_entrega', ...product,
    sizes: parseSizesInit(product),
    images: parseImagesInit(product)
  });
  const [uploading, setUploading] = useState(false);

  const parsedSizes = typeof form.sizes === 'string' ? (() => { try { return JSON.parse(form.sizes); } catch { return {}; } })() : (form.sizes || {});

  const imageList = (() => { try { const a = JSON.parse(form.images); return Array.isArray(a) ? a : []; } catch { return []; } })();
  const categoryOpts = ['camisetas', 'polos', 'calcas', 'acessorios', 'tenis', 'esportivo', 'moletom', 'jaquetas'];

  const handleFilesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => onUpload(f)));
      const merged = [...imageList, ...urls];
      setForm(f => ({ ...f, images: JSON.stringify(merged), image: f.image || merged[0] || '' }));
    } catch (err) { alert('Erro no upload: ' + err.message); }
    finally { setUploading(false); }
  };

  const handleRemoveImage = (idx) => {
    const imgs = [...imageList];
    imgs.splice(idx, 1);
    setForm(f => ({ ...f, images: JSON.stringify(imgs) }));
  };

  const handleSizeChange = (size, value) => {
    setForm(f => ({ ...f, sizes: { ...parsedSizes, [size]: value } }));
  };

  const addSize = () => {
    const name = prompt('Nome do tamanho (ex: XGG, PP):');
    if (name && !parsedSizes[name]) {
      handleSizeChange(name, '');
    }
  };

  const removeSize = (size) => {
    const newSizes = { ...parsedSizes };
    delete newSizes[size];
    setForm(f => ({ ...f, sizes: newSizes }));
  };

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
      <h3 style={{ color: '#D6B56D', marginBottom: '1rem' }}>{product.id ? 'Editar Produto Atacado' : 'Novo Produto Atacado'}</h3>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        <input placeholder="Nome *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <input placeholder="Marca" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} style={inputStyle} />
        <input placeholder="Slug (url)" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={inputStyle} />

        <div>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Categorias</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categoryOpts.map(cat => {
              const selected = (form.categories || '').split(',').map(s => s.trim()).includes(cat);
              return (
                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected} onChange={() => {
                    const current = (form.categories || '').split(',').map(s => s.trim()).filter(Boolean);
                    const next = selected ? current.filter(c => c !== cat) : [...current, cat];
                    setForm(f => ({ ...f, categories: next.join(', ') }));
                  }} style={{ accentColor: '#D6B56D' }} />
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Descricao do Produto</label>
          <textarea placeholder="Descricao detalhada para lojistas..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: '#D6B56D', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Grade / Tamanhos</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {Object.entries(parsedSizes).map(([size, qty]) => (
              <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#070707', padding: '6px 10px', borderRadius: '6px', border: '1px solid #2A2D33' }}>
                <span style={{ color: '#D6B56D', fontSize: '0.8rem', fontWeight: 600, minWidth: '24px' }}>{size}</span>
                <input type="number" min="0" placeholder="Qtd" value={qty} onChange={e => handleSizeChange(size, e.target.value)}
                  style={{ width: '60px', background: '#15181C', border: '1px solid #2A2D33', color: '#F5F5F0', fontSize: '0.8rem', padding: '4px', borderRadius: '4px', textAlign: 'center' }} />
                <button onClick={() => removeSize(size)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px' }}>×</button>
              </div>
            ))}
            <button onClick={addSize} style={{ background: 'transparent', border: '1px dashed #D6B56D', color: '#D6B56D', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Tamanho</button>
          </div>
          <input placeholder="Info da grade (ex: Disponivel P a XGG)" value={form.grade_info} onChange={e => setForm(f => ({ ...f, grade_info: e.target.value }))}
            style={{ ...inputStyle, fontSize: '0.85rem' }} />
        </div>

        <div>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Preco Atacado (R$)</label>
          <input placeholder="Ex: 39,90" value={form.price_wholesale} onChange={e => setForm(f => ({ ...f, price_wholesale: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Preco Varejo (R$)</label>
          <input placeholder="Ex: 59,90" value={form.price_varejo} onChange={e => setForm(f => ({ ...f, price_varejo: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>OFF (%)</label>
          <input placeholder="Ex: 15" value={form.off} onChange={e => setForm(f => ({ ...f, off: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Qtd. Minima Pedido</label>
          <input type="number" min="1" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: parseInt(e.target.value) || 1 }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Cores</label>
          <input placeholder="Ex: Preto, Branco, Azul" value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Status</label>
          <select value={form.stock_status} onChange={e => setForm(f => ({ ...f, stock_status: e.target.value }))} style={inputStyle}>
            <option value="pronta_entrega">Pronta Entrega</option>
            <option value="sob_encomenda">Sob Encomenda</option>
            <option value="em_estoque">Em Estoque</option>
            <option value="sem_estoque">Sem Estoque</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: '#A7A7A0', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Fotos do Produto</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {imageList.map((url, idx) => (
              <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px', background: '#111315' }} />
                <button onClick={() => handleRemoveImage(idx)} style={{
                  position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px',
                  background: '#e74c3c', border: 'none', borderRadius: '50%', color: 'white',
                  fontSize: '0.7rem', cursor: 'pointer', lineHeight: '20px', textAlign: 'center', padding: 0
                }}>×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" multiple onChange={handleFilesUpload} disabled={uploading} style={{ color: '#F5F5F0', fontSize: '0.85rem' }} />
          {uploading && <span style={{ color: '#D6B56D', fontSize: '0.85rem', marginLeft: '8px' }}>Enviando...</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid #2A2D33', color: '#A7A7A0', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
        <button className="btn-premium" onClick={() => onSave({ ...form, sizes: parsedSizes })} disabled={!form.name} style={{ padding: '0.6rem 1.5rem' }}>Salvar</button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.7rem', borderRadius: '8px',
  border: '1px solid #2A2D33', background: '#15181C',
  color: '#F5F5F0', fontSize: '0.9rem', boxSizing: 'border-box',
};

const selectStyle = {
  background: '#15181C', border: '1px solid #2A2D33',
  padding: '0.5rem 1rem', color: '#F5F5F0', borderRadius: '8px', fontSize: '0.85rem'
};

const smallBtn = {
  background: 'transparent', border: '1px solid #2A2D33', color: 'white',
  padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem'
};

export default WholesaleProductsAdmin;
