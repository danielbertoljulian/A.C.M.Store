import React, { useState, useEffect } from 'react';

const defaultCategoryData = [
  { name: 'Camisetas', key: 'camisetas', desc: 'Conforto e Estilo Premium', img: '/Produtos_1/Produto_1.png' },
  { name: 'Polos', key: 'polos', desc: 'Elegancia Classica', img: '/Produtos_1/Produto_2.png' },
  { name: 'Calcas', key: 'calcas', desc: 'Corte e Acabamento Superior', img: '/Produtos_1/Produto_1.png' },
  { name: 'Acessorios', key: 'acessorios', desc: 'Completo seu Look', img: '/Produtos_1/Produto_2.png' },
  { name: 'Tenis', key: 'tenis', desc: 'Estilo e Conforto', img: '/Produtos_1/Produto_1.png' },
  { name: 'Esportivo', key: 'esportivo', desc: 'Performance e Estilo', img: '/Produtos_1/Produto_2.png' },
];

const Categories = ({ onCategoryClick }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.ok ? r.json() : []),
      fetch('/api/categories').then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(([products, catList]) => {
      if (!products || !products.length) { setCategories([]); return; }
      const catCounts = {};
      products.forEach(p => {
        (p.categories || '').split(',').map(s => s.trim()).filter(Boolean).forEach(cat => {
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
      });
      const dbCategoryKeys = Array.isArray(catList) && catList.length > 0
        ? catList.map(c => c.name)
        : defaultCategoryData.map(c => c.key);
      const categoryMap = {};
      defaultCategoryData.forEach(c => { categoryMap[c.key] = c; });
      const dbCategoryMap = {};
      if (Array.isArray(catList)) {
        catList.forEach(c => {
          dbCategoryMap[c.name] = c;
          if (!categoryMap[c.name]) {
            categoryMap[c.name] = { name: c.name.charAt(0).toUpperCase() + c.name.slice(1), key: c.name, desc: c.description || '', img: '' };
          }
        });
      }
      const active = dbCategoryKeys
        .filter(key => catCounts[key])
        .map((key, i) => {
          const dbCat = dbCategoryMap[key];
          const defaultCat = categoryMap[key];
          const img = (dbCat && dbCat.image) ? dbCat.image : (defaultCat ? defaultCat.img : '');
          const desc = (dbCat && dbCat.description) ? dbCat.description : (defaultCat ? defaultCat.desc : '');
          return {
            ...defaultCat,
            id: i + 1,
            key: key,
            name: defaultCat ? defaultCat.name : key.charAt(0).toUpperCase() + key.slice(1),
            img: img,
            desc: desc,
            count: `${catCounts[key]} produtos`
          };
        });
      setCategories(active);
    }).catch(() => setCategories([]));
  }, []);

  const handleClick = (key) => {
    onCategoryClick(key);
    const target = document.querySelector('#produtos');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  if (categories.length === 0) return null;

  return (
    <section id="categorias" className="section-padding">
      <div className="container">
        <h2 className="section-title">
          <span></span>
          Categorias
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem'
        }}>
          {categories.map(cat => (
            <div key={cat.id} className="glass" style={{
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              border: '1px solid transparent'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.borderColor = 'var(--color-gold)';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(214,181,109,0.2)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }} onClick={() => handleClick(cat.key)}>
              <div style={{ height: '280px', overflow: 'hidden', background: '#111315' }}>
                {cat.img ? (
                  <img src={cat.img} alt={cat.name} style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.9,
                    transition: 'transform 0.3s ease'
                  }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1d21' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>{cat.name}</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.3rem', fontWeight: 700 }}>{cat.name}</h3>
                {cat.desc && <p style={{ color: '#A7A7A0', fontSize: '0.9rem', marginBottom: '0.3rem' }}>{cat.desc}</p>}
                <small style={{ color: '#D6B56D', fontSize: '0.8rem' }}>{cat.count}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
