import React, { useState, useEffect, useCallback, useRef } from 'react';
import ArtGenerator from './ArtGenerator';
import BudgetGenerator from './BudgetGenerator';

const API = '/api/products';
const CATEGORIES_API = '/api/categories';
const PWD_KEY = 'acm_admin_pwd';
const PWD_RAW_KEY = 'acm_admin_raw';
const defaultCategories = ['camisetas', 'polos', 'calcas', 'acessorios', 'tenis', 'esportivo'];

const selectStyle = {
  background: '#15181C', border: '1px solid #2A2D33',
  padding: '0.5rem 1rem', color: '#F5F5F0', borderRadius: '8px', fontSize: '0.85rem'
};

function Admin() {
  const [mobile, setMobile] = useState(window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem(PWD_KEY));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dragIdx, setDragIdx] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [tab, setTab] = useState('produtos');
  const [sharedId, setSharedId] = useState(null);
  const [bgHue, setBgHue] = useState(43);
  const [bgSat, setBgSat] = useState(55);
  const [bgLight, setBgLight] = useState(8);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const brandList = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const categoryList = categories.length > 0 ? categories.map(c => c.name) : defaultCategories;

  const fetchCategories = useCallback(async () => {
    try {
      const r = await fetch(CATEGORIES_API);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      }
    } catch {}
  }, []);

  useEffect(() => { if (loggedIn) fetchCategories(); }, [loggedIn, fetchCategories]);

  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/settings', { headers })
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        if (data.bgHue !== undefined) setBgHue(parseInt(data.bgHue));
        if (data.bgSat !== undefined) setBgSat(parseInt(data.bgSat));
        if (data.bgLight !== undefined) setBgLight(parseInt(data.bgLight));
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, [loggedIn]);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim().toLowerCase();
    if (!name) { setCategoryError('Digite um nome'); return; }
    if (categoryList.includes(name)) { setCategoryError('Categoria ja existe'); return; }
    try {
      const r = await fetch(CATEGORIES_API, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      });
      if (r.ok) {
        setNewCategoryName('');
        setCategoryError('');
        fetchCategories();
      } else {
        const data = await r.json();
        setCategoryError(data.error || 'Erro ao adicionar');
      }
    } catch (e) { setCategoryError('Erro ao adicionar: ' + e.message); }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Excluir categoria "${cat}"?`)) return;
    if (categories.length === 0) return;
    const catObj = categories.find(c => c.name === cat);
    if (!catObj) return;
    try {
      const r = await fetch(`${CATEGORIES_API}?id=${catObj.id}`, { method: 'DELETE', headers });
      if (r.ok) fetchCategories();
    } catch (e) { alert('Erro: ' + e.message); }
  };

  const handleUpdateCategoryImage = async (catObj, imageUrl) => {
    try {
      const r = await fetch(CATEGORIES_API, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: catObj.id, image: imageUrl, description: catObj.description || '' })
      });
      if (r.ok) fetchCategories();
    } catch (e) { alert('Erro ao atualizar imagem: ' + e.message); }
  };

  const handleUploadCategoryImage = async (catObj, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        handleUpdateCategoryImage(catObj, dataUrl);
        resolve(dataUrl);
      };
      reader.onerror = () => reject(new Error('Falha ao ler imagem'));
      reader.readAsDataURL(file);
    });
  };

  const handleDragStart = (idx) => { setDragIdx(idx); setDragOverIdx(null); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDragOverItem = (idx) => { setDragOverIdx(idx); };
  const handleDragLeaveItem = () => { setDragOverIdx(null); };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };
  const handleDrop = async (idx) => {
    setDragOverIdx(null);
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); return; }
    const reordered = [...filtered];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setDragIdx(null);
    const orders = reordered.map((p, i) => ({ id: p.id, sort_order: i + 1 }));
    try {
      const r = await fetch('/api/reorder', { method: 'POST', headers: { 'x-session-token': localStorage.getItem(PWD_KEY), 'x-admin-password': localStorage.getItem(PWD_RAW_KEY) || '', 'Content-Type': 'application/json' }, body: JSON.stringify({ orders }) });
      if (!r.ok) throw new Error('Falha ao reordenar');
      setSuccess('Ordem atualizada!');
      fetchProducts();
    } catch (e) { setError(e.message); }
  };

  const pwd = loggedIn ? localStorage.getItem(PWD_KEY) : '';
  const rawPwd = loggedIn ? localStorage.getItem(PWD_RAW_KEY) : '';
  const headers = { 'x-session-token': pwd, 'x-admin-password': rawPwd, 'Content-Type': 'application/json' };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(API);
      if (!r.ok) throw new Error('Failed to load');
      const data = await r.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (loggedIn) fetchProducts(); }, [loggedIn, fetchProducts]);

  const handleLogin = async () => {
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (r.ok) {
        const data = await r.json();
        localStorage.setItem(PWD_KEY, data.token);
        localStorage.setItem(PWD_RAW_KEY, password);
        setLoggedIn(true);
        setError('');
      } else {
        setError('Senha incorreta');
      }
    } catch { setError('Erro ao conectar'); }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem(PWD_KEY);
    if (token) {
      await fetch('/api/auth', {
        method: 'DELETE',
        headers: { 'x-session-token': token }
      });
    }
    localStorage.removeItem(PWD_KEY);
    localStorage.removeItem(PWD_RAW_KEY);
    setLoggedIn(false);
    setPassword('');
    setProducts([]);
  };

  const handleSave = async (product) => {
    try {
      const isNew = !product.id;
      const r = await fetch(API, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(product) });
      if (!r.ok) { const body = await r.json().catch(() => ({ error: 'Failed to save' })); throw new Error(body.error); }
      setSuccess(isNew ? 'Produto criado!' : 'Produto atualizado!');
      setEditing(null);
      fetchProducts();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este produto?')) return;
    try {
      const r = await fetch(`${API}?id=${id}`, { method: 'DELETE', headers });
      if (!r.ok) { const b = await r.json().catch(() => ({ error: 'Failed to delete' })); throw new Error(b.error); }
      setSuccess('Produto excluido!');
      fetchProducts();
    } catch (e) { setError(e.message); }
  };

  const handleUploadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Falha ao ler imagem'));
      reader.readAsDataURL(file);
    });
  };

  const filtered = products.filter(p => {
    if (filterCat && !(p.categories || '').includes(filterCat)) return false;
    if (filterBrand && p.brand !== filterBrand) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070707' }}>
        <div className="glass" style={{ padding: '3rem', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
          <h2 style={{ color: 'var(--color-gold)', marginBottom: '2rem', textAlign: 'center' }}>Admin A.C.M Store</h2>
          {error && <p style={{ color: '#e74c3c', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
          <input type="password" placeholder="Senha de administrador" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #2A2D33', background: '#15181C', color: '#F5F5F0', fontSize: '1rem' }} />
          <button className="btn-premium" onClick={handleLogin} style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: `hsl(${bgHue}, ${bgSat}%, ${bgLight}%)`, padding: mobile ? '1rem' : '2rem', overflowX: 'hidden', transition: 'background 0.3s ease' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
            <h1 style={{ color: 'var(--color-gold)', fontSize: mobile ? '1.2rem' : '1.8rem', margin: 0 }}>Painel Admin</h1>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{products.length} prod.</span>
              <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Sair</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'produtos', label: 'Produtos' },
              { key: 'relatorios', label: 'Relatorios' },
              { key: 'arte', label: 'Criar Arte' },
              { key: 'orcamento', label: 'Orcamento' },
              { key: 'ajustes', label: 'Ajustes' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: mobile ? '1' : 'unset', background: tab === t.key ? '#D6B56D' : 'transparent', border: '1px solid #D6B56D', color: tab === t.key ? '#070707' : '#D6B56D', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>{t.label}</button>
            ))}
          </div>
        </div>

        {tab === 'relatorios' ? (
          <ReportView mobile={mobile} />
        ) : tab === 'arte' ? (
          <ArtGenerator mobile={mobile} products={products} />
        ) : tab === 'orcamento' ? (
          <BudgetGenerator mobile={mobile} products={products} />
        ) : tab === 'ajustes' ? (
          <SettingsView bgHue={bgHue} setBgHue={setBgHue} bgSat={bgSat} setBgSat={setBgSat} bgLight={bgLight} setBgLight={setBgLight} mobile={mobile} headers={headers} />
        ) : (
          <>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={selectStyle}>
                  <option value="" style={{ color: 'white', background: '#15181C' }}>Todas as Categorias</option>
                  {categoryList.map(c => (
                    <option key={c} value={c} style={{ color: 'white', background: '#15181C' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <button onClick={() => setShowCategoryManager(!showCategoryManager)} style={{ background: showCategoryManager ? '#D6B56D' : 'transparent', border: '1px solid #D6B56D', color: showCategoryManager ? '#070707' : '#D6B56D', padding: '0.5rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  GERENCIAR CATEGORIAS
                </button>
              </div>
              <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} style={selectStyle}>
                <option value="" style={{ color: 'white', background: '#15181C' }}>Todas as Marcas</option>
                {brandList.map(b => (
                  <option key={b} value={b} style={{ color: 'white', background: '#15181C' }}>{b}</option>
                ))}
              </select>
              <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
                background: '#15181C', border: '1px solid #2A2D33',
                padding: '0.5rem 1rem', color: 'white', borderRadius: '8px', fontSize: '0.85rem', minWidth: '200px'
              }} />
              <button className="btn-premium" onClick={() => setEditing({})} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>+ Novo Produto</button>
            </div>

            {showCategoryManager && (
              <div className="glass" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
                <h3 style={{ color: 'var(--color-gold)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>Gerenciar Categorias</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input type="text" placeholder="Nova categoria..." value={newCategoryName} onChange={e => { setNewCategoryName(e.target.value); setCategoryError(''); }} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                  <button className="btn-premium" onClick={handleAddCategory} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Adicionar</button>
                </div>
                {categoryError && <p style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{categoryError}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {categories.map(cat => {
                    const catData = categories.find(c => c.id === cat.id) || cat;
                    return (
                      <div key={cat.id} style={{ background: '#1a1d21', padding: '0.75rem', borderRadius: '8px', border: '1px solid #2A2D33' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#F5F5F0', fontSize: '0.85rem', fontWeight: 600 }}>{cat.name}</span>
                          <button onClick={() => handleDeleteCategory(cat.name)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.85rem', padding: '0 0.3rem' }} title="Excluir">×</button>
                        </div>
                        <div style={{ position: 'relative', width: '100%', height: '120px', background: '#111315', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: '#666', fontSize: '0.75rem' }}>Sem foto</span>
                          )}
                          <label style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#D6B56D', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', border: '1px solid #D6B56D' }}>
                            Foto
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) await handleUploadCategoryImage(catData, file);
                            }} />
                          </label>
                          {cat.image && (
                            <button onClick={() => handleUpdateCategoryImage(catData, '')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#e74c3c', padding: '0.15rem 0.4rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem', border: '1px solid #e74c3c' }}>
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', margin: 0 }}>Clique em "Foto" para definir a imagem de capa de cada categoria.</p>
                  <button className="btn-premium" onClick={() => { fetchCategories(); setSuccess('Categorias salvas!'); }} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>Salvar</button>
                </div>
              </div>
            )}

            {success && <div style={{ background: '#27ae60', color: 'white', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{success} <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button></div>}
            {error && <div style={{ background: '#e74c3c', color: 'white', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{error} <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button></div>}

            {editing && (
              <ProductForm product={editing} onSave={handleSave} onUpload={handleUploadImage} onCancel={() => setEditing(null)} mobile={mobile} categories={categoryList} />
            )}

            {loading ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Carregando...</p>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Nenhum produto no banco de dados.</p>
                <button className="btn-premium" onClick={async () => {
                  setSeeding(true);
                  try {
                    const r = await fetch('/api/seed', { method: 'POST', headers });
                    const data = await r.json();
                    setSuccess(`${data.imported} produtos importados!`);
                    fetchProducts();
                  } catch (e) { setError('Erro ao importar: ' + e.message); }
                  finally { setSeeding(false); }
                }} disabled={seeding} style={{ padding: '1rem 2rem' }}>
                  {seeding ? 'Importando...' : 'Importar Produtos'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
                {filtered.map((p, idx) => (
                  <div key={p.id} className="glass"
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => { handleDragOver(e); handleDragOverItem(idx); }}
                    onDragLeave={handleDragLeaveItem}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      borderRadius: '8px', overflow: 'hidden', cursor: dragIdx !== null ? 'grabbing' : 'grab',
                      transition: 'var(--transition-smooth)',
                      opacity: dragIdx === idx ? 0.4 : 1,
                      border: dragIdx === idx ? '2px dashed var(--color-gold)' : '1px solid var(--glass-border)',
                      borderTop: dragOverIdx === idx ? '3px solid var(--color-gold)' : 'none',
                      display: 'flex', flexDirection: 'column'
                    }}>
                    <div style={{ height: '150px', overflow: 'hidden', background: '#111315', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                      <img src={getFirstImage(p)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ padding: '0.8rem', textAlign: 'center', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: 'white', fontSize: '0.8rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</strong>
                        <small style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{p.brand}</small>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', margin: '0.2rem 0' }}>
                          {p.price && p.price.trim() && (
                            <span style={{ color: 'var(--color-gold)', fontSize: '0.8rem', fontWeight: 600 }}>
                              R$ {p.price.replace(/^R\$\s*/i, '').trim()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                        <button onClick={() => setEditing(p)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Editar</button>
                        <button onClick={() => handleDelete(p.id)} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Excluir</button>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>Nenhum produto encontrado para este filtro.</p>
                )}
              </div>
            )}
          </>
        )}
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

function getImageList(p) {
  if (p.images) {
    try {
      const arr = JSON.parse(p.images);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}
  }
  return p.image ? [p.image] : [];
}

const categoryCheckboxes = defaultCategories;

function ProductForm({ product, onSave, onUpload, onCancel, mobile, categories }) {
  const [form, setForm] = useState(product);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef(null);
  useEffect(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);

  const imageList = getImageList(form);
  const categoryOpts = categories && categories.length > 0 ? categories : categoryCheckboxes;

  const handleFilesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => onUpload(f)));
      const current = getImageList(form);
      const merged = [...current, ...urls];
      setForm(f => ({ ...f, images: JSON.stringify(merged), image: f.image || merged[0] || '' }));
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (idx) => {
    const current = getImageList(form);
    current.splice(idx, 1);
    setForm(f => ({ ...f, images: JSON.stringify(current) }));
  };

  const handleAddUrl = () => {
    const url = prompt('URL da imagem:');
    if (!url) return;
    const current = getImageList(form);
    setForm(f => ({ ...f, images: JSON.stringify([...current, url]) }));
  };

  return (
    <div ref={formRef} className="glass" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
      <h3 style={{ color: 'var(--color-gold)', marginBottom: '1rem' }}>{product.id ? 'Editar Produto' : 'Novo Produto'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        <input placeholder="Nome *" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <input placeholder="Slug (url amigavel)" value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={inputStyle} />
        <input placeholder="Marca" value={form.brand || ''} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} style={inputStyle} />
        <div>
          <label style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Categorias</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categoryOpts.map(cat => {
              const selected = (form.categories || '').split(',').map(s => s.trim()).includes(cat);
              return (
                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected} onChange={() => {
                    const current = (form.categories || '').split(',').map(s => s.trim()).filter(Boolean);
                    const next = selected ? current.filter(c => c !== cat) : [...current, cat];
                    setForm(f => ({ ...f, categories: next.join(', ') }));
                  }} />
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </label>
              );
            })}
          </div>
        </div>
        <input placeholder="Tamanho (ex: P, M, G)" value={form.width || ''} onChange={e => setForm(f => ({ ...f, width: e.target.value }))} style={inputStyle} />
        <input placeholder="Cores (separadas por virgula)" value={form.colors || ''} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} style={inputStyle} />
        <input placeholder="Preco (ex: 299,00)" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={inputStyle} />
        <input placeholder="OFF (%)" value={form.off || ''} onChange={e => setForm(f => ({ ...f, off: e.target.value }))} style={inputStyle} />
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>Fotos do Produto</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" multiple onChange={handleFilesUpload} disabled={uploading} style={{ color: '#F5F5F0', fontSize: '0.85rem' }} />
            <button onClick={handleAddUrl} style={{ background: 'transparent', border: '1px solid #2A2D33', color: '#F5F5F0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>+ URL</button>
            {uploading && <span style={{ color: 'var(--color-gold)', fontSize: '0.85rem' }}>Enviando...</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-muted)', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
        <button className="btn-premium" onClick={() => {
          const categories = (form.categories || '').split(',').map(s => s.trim()).filter(Boolean);
          if (categories.length === 0) {
            alert('Selecione pelo menos uma categoria antes de salvar.');
            return;
          }
          const imgs = getImageList(form);
          onSave({ ...form, image: imgs[0] || '', images: JSON.stringify(imgs) });
        }} disabled={!form.name} style={{ padding: '0.6rem 1.5rem' }}>Salvar</button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.7rem', borderRadius: '8px',
  border: '1px solid #2A2D33', background: '#15181C',
  color: '#F5F5F0', fontSize: '0.9rem', boxSizing: 'border-box',
};

function ReportView({ mobile }) {
  const getAuthHeaders = () => ({ 'x-session-token': localStorage.getItem(PWD_KEY), 'x-admin-password': localStorage.getItem(PWD_RAW_KEY) || '' });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [archived, setArchived] = useState([]);
  const [archLoading, setArchLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [modalReport, setModalReport] = useState(null);

  const fetchDayData = useCallback(async (date) => {
    try {
      const r = await fetch(`/api/report?date=${date}`, { headers: getAuthHeaders() });
      if (r.ok) return r.json();
    } catch {}
    return null;
  }, []);

  const fetchArchived = useCallback(async () => {
    setArchLoading(true);
    try {
      const r = await fetch('/api/report?all=true', { headers: getAuthHeaders() });
      if (r.ok) setArchived(await r.json());
    } catch {}
    finally { setArchLoading(false); }
  }, []);

  const handleArchive = async () => {
    if (!window.confirm('Arquivar relatorio de hoje e resetar dados?')) return;
    try {
      const r = await fetch('/api/report', { method: 'POST', headers: getAuthHeaders() });
      if (r.ok) {
        setActionMsg('Relatorio arquivado e dados resetados!');
        setReport(null);
        fetchArchived();
      }
    } catch (e) { setActionMsg('Erro: ' + e.message); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleResetDay = async (date) => {
    if (!window.confirm(`Resetar dados de ${date}?`)) return;
    try {
      const r = await fetch(`/api/report?date=${date}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (r.ok) {
        setActionMsg(`Relatorio de ${date} excluido!`);
        fetchArchived();
      }
    } catch (e) { setActionMsg('Erro: ' + e.message); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleViewArchived = (date) => {
    const entry = archived.find(a => a.date === date);
    if (!entry) return;
    let topProducts = [];
    try { topProducts = JSON.parse(entry.top_products || '[]'); } catch {}
    setModalReport({
      date: entry.date,
      visits: { total: entry.visits_total || 0 },
      clicks: { total: entry.clicks_total || 0, topProducts }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setReportLoading(true);
      try {
        const r = await fetch(`/api/report?date=${selectedDate}`, { headers: getAuthHeaders() });
        if (r.ok) { setReport(await r.json()); } else { setReport(null); }
      } catch { setReport(null); }
      finally { setReportLoading(false); }
    };
    fetchData();
  }, [selectedDate]);
  useEffect(() => { fetchArchived(); }, []);

  const card = (title, value) => (
    <div className="glass" style={{ padding: mobile ? '1rem' : '1.5rem', borderRadius: '8px', textAlign: 'center', background: '#15181C', border: '1px solid #2A2D33' }}>
      <h4 style={{ color: '#A7A7A0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{title}</h4>
      <p style={{ color: '#D6B56D', fontSize: mobile ? '1.5rem' : '2rem', fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  );

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {actionMsg && <div style={{ background: '#27ae60', color: 'white', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{actionMsg}</div>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{
          background: '#15181C', border: '1px solid #2A2D33',
          padding: '0.5rem 0.75rem', color: '#F5F5F0', borderRadius: '8px', fontSize: '0.9rem'
        }} />
        <button className="btn-premium" onClick={handleArchive} style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          Arquivar Hoje + Reset
        </button>
      </div>

      {reportLoading ? (
        <p style={{ color: '#A7A7A0', textAlign: 'center', marginBottom: '2rem' }}>Carregando relatorio...</p>
      ) : report ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {card('Visitas', report.visits.total)}
            {card('Cliques', report.clicks.total)}
            {card('Top Produtos', report.clicks.topProducts.length)}
            {card('Data', new Date(report.date + 'T00:00:00').toLocaleDateString('pt-BR'))}
          </div>

          <h3 style={{ color: '#D6B56D', marginBottom: '0.75rem', fontSize: mobile ? '1rem' : '1.17rem' }}>Produtos Mais Clicados</h3>
          <div className="glass" style={{ borderRadius: '8px', overflowX: 'auto', marginBottom: '2rem', background: '#15181C', border: '1px solid #2A2D33' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '260px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2D33' }}>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#A7A7A0', fontSize: '0.75rem', width: '2rem' }}>#</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#A7A7A0', fontSize: '0.75rem' }}>Produto</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: '#A7A7A0', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Cliques</th>
                </tr>
              </thead>
              <tbody>
                {report.clicks.topProducts.map((p, i) => (
                  <tr key={p.product_id} style={{ borderBottom: '1px solid #2A2D33' }}>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#A7A7A0', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#F5F5F0', fontSize: '0.8rem' }}>{p.product_name}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#D6B56D', textAlign: 'right', fontWeight: 600, fontSize: '0.8rem' }}>{p.clicks}</td>
                  </tr>
                ))}
                {!report.clicks.topProducts.length && (
                  <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#A7A7A0' }}>Sem dados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="glass" style={{ borderRadius: '8px', padding: '1rem', textAlign: 'center', color: '#A7A7A0', marginBottom: '2rem', background: '#15181C', border: '1px solid #2A2D33' }}>
          Nenhum dado para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}.
        </div>
      )}

      <h3 style={{ color: '#D6B56D', marginBottom: '0.75rem', fontSize: mobile ? '1rem' : '1.17rem' }}>Relatorios Arquivados</h3>
      {archLoading ? (
        <p style={{ color: '#A7A7A0' }}>Carregando arquivados...</p>
      ) : archived.length === 0 ? (
        <div className="glass" style={{ borderRadius: '8px', padding: '1rem', textAlign: 'center', color: '#A7A7A0', background: '#15181C', border: '1px solid #2A2D33' }}>Nenhum relatorio arquivado.</div>
      ) : (
        Object.entries(
          archived.reduce((groups, a) => {
            const month = a.date.slice(0, 7);
            if (!groups[month]) groups[month] = [];
            groups[month].push(a);
            return groups;
          }, {})
        ).sort(([a], [b]) => b.localeCompare(a)).map(([month, reports]) => (
          <div key={month} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#D6B56D', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {new Date(month + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="glass" style={{ borderRadius: '8px', overflowX: 'auto', background: '#15181C', border: '1px solid #2A2D33' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '280px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A2D33' }}>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', color: '#A7A7A0', fontSize: '0.75rem' }}>Data</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: '#A7A7A0', fontSize: '0.75rem' }}>Visitas</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: '#A7A7A0', fontSize: '0.75rem' }}>Cliques</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', color: '#A7A7A0', fontSize: '0.75rem' }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(a => (
                    <tr key={a.date} style={{ borderBottom: '1px solid #2A2D33' }}>
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        <button onClick={() => handleViewArchived(a.date)} style={{ background: 'none', border: 'none', color: '#D6B56D', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem', padding: 0 }}>
                          {new Date(a.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </button>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: '#D6B56D', textAlign: 'right', fontSize: '0.8rem' }}>{a.visits_total}</td>
                      <td style={{ padding: '0.55rem 0.75rem', color: '#D6B56D', textAlign: 'right', fontSize: '0.8rem' }}>{a.clicks_total}</td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                        <button onClick={() => handleResetDay(a.date)} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '0.2rem 0.4rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {modalReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setModalReport(null)}>
          <div className="glass" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', borderRadius: '12px', padding: '2rem', background: '#15181C', border: '1px solid #2A2D33' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#D6B56D', margin: 0 }}>Relatorio - {new Date(modalReport.date + 'T00:00:00').toLocaleDateString('pt-BR')}</h2>
              <button onClick={() => setModalReport(null)} style={{ background: 'none', border: 'none', color: '#F5F5F0', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              {card('Visitas', modalReport.visits.total)}
              {card('Cliques', modalReport.clicks.total)}
            </div>
            <h3 style={{ color: '#D6B56D', marginBottom: '1rem' }}>Produtos Mais Clicados</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2D33' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', color: '#A7A7A0' }}>#</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', color: '#A7A7A0' }}>Produto</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right', color: '#A7A7A0' }}>Cliques</th>
                </tr>
              </thead>
              <tbody>
                {modalReport.clicks.topProducts.map((p, i) => (
                  <tr key={p.product_id} style={{ borderBottom: '1px solid #2A2D33' }}>
                    <td style={{ padding: '0.5rem', color: '#A7A7A0' }}>{i + 1}</td>
                    <td style={{ padding: '0.5rem', color: '#F5F5F0' }}>{p.product_name}</td>
                    <td style={{ padding: '0.5rem', color: '#D6B56D', textAlign: 'right', fontWeight: 600 }}>{p.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ bgHue, setBgHue, bgSat, setBgSat, bgLight, setBgLight, mobile, headers }) {
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bgHue: String(bgHue), bgSat: String(bgSat), bgLight: String(bgLight) })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert('Erro ao salvar: ' + e.message); }
  };

  const handleReset = async () => {
    setBgHue(43);
    setBgSat(55);
    setBgLight(8);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bgHue: '43', bgSat: '55', bgLight: '8' })
      });
    } catch {}
  };

        const sliderStyle = {
    WebkitAppearance: 'none',
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    outline: 'none',
    cursor: 'pointer',
    flex: 1,
    background: '#2A2D33'
  };

  const labelStyle = {
    color: '#A7A7A0',
    fontSize: '0.8rem',
    width: '100px',
    flexShrink: 0,
  };

  const valueStyle = {
    color: '#D6B56D',
    fontSize: '0.85rem',
    fontWeight: 600,
    width: '50px',
    textAlign: 'right',
    flexShrink: 0,
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 0',
    borderBottom: '1px solid #2A2D33',
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ color: 'var(--color-gold)', marginBottom: '1.5rem', fontSize: mobile ? '1rem' : '1.2rem' }}>
        Ajustes do Painel
      </h3>

      <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', background: '#15181C', border: '1px solid #2A2D33' }}>
        <h4 style={{ color: '#D6B56D', marginBottom: '1rem', fontSize: '1rem' }}>Cor de Fundo</h4>

        <div style={rowStyle}>
          <span style={labelStyle}>Matiz (Hue)</span>
          <input type="range" min="0" max="360" value={bgHue}
            onChange={(e) => setBgHue(parseInt(e.target.value))}
            style={{ ...sliderStyle, background: `linear-gradient(to right, hsl(0,${bgSat}%,${bgLight}%), hsl(60,${bgSat}%,${bgLight}%), hsl(120,${bgSat}%,${bgLight}%), hsl(180,${bgSat}%,${bgLight}%), hsl(240,${bgSat}%,${bgLight}%), hsl(300,${bgSat}%,${bgLight}%), hsl(360,${bgSat}%,${bgLight}%))` }} />
          <span style={valueStyle}>{bgHue}°</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Saturacao</span>
          <input type="range" min="0" max="100" value={bgSat}
            onChange={(e) => setBgSat(parseInt(e.target.value))}
            style={{ ...sliderStyle, background: `linear-gradient(to right, hsl(${bgHue},0%,${bgLight}%), hsl(${bgHue},100%,${bgLight}%))` }} />
          <span style={valueStyle}>{bgSat}%</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Luminosidade</span>
          <input type="range" min="0" max="50" value={bgLight}
            onChange={(e) => setBgLight(parseInt(e.target.value))}
            style={{ ...sliderStyle, background: `linear-gradient(to right, hsl(${bgHue},${bgSat}%,0%), hsl(${bgHue},${bgSat}%,25%), hsl(${bgHue},${bgSat}%,50%))` }} />
          <span style={valueStyle}>{bgLight}%</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn-premium" onClick={handleSave} style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
            {saved ? '✓ Salvo!' : 'Salvar'}
          </button>
          <button onClick={handleReset} style={{
            background: 'transparent', border: '1px solid #2A2D33',
            color: '#A7A7A0', padding: '0.6rem 1.5rem',
            borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
          }}>
            Padrao
          </button>
        </div>
      </div>

      <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', background: '#15181C', border: '1px solid #2A2D33' }}>
        <h4 style={{ color: '#D6B56D', marginBottom: '0.75rem', fontSize: '1rem' }}>Presets Rapidos</h4>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {[
            { name: 'Dourado', h: 43, s: 55, l: 8 },
            { name: 'Escuro', h: 220, s: 30, l: 5 },
            { name: 'Azul', h: 210, s: 70, l: 12 },
            { name: 'Verde', h: 150, s: 50, l: 8 },
            { name: 'Vermelho', h: 0, s: 60, l: 8 },
            { name: 'Roxo', h: 270, s: 55, l: 10 },
            { name: 'Marrom', h: 25, s: 40, l: 8 },
            { name: 'Cinza', h: 210, s: 10, l: 10 },
          ].map(preset => (
            <button key={preset.name} onClick={() => { setBgHue(preset.h); setBgSat(preset.s); setBgLight(preset.l); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem', borderRadius: '8px',
                background: `hsl(${preset.h}, ${preset.s}%, ${preset.l}%)`,
                border: `2px solid ${bgHue === preset.h && bgSat === preset.s && bgLight === preset.l ? '#D6B56D' : '#2A2D33'}`,
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: `hsl(${preset.h}, ${preset.s}%, ${preset.l + 10}%)`,
                border: '1px solid #2A2D33',
              }} />
              <span style={{ color: '#F5F5F0', fontSize: '0.8rem', fontWeight: 600 }}>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;
