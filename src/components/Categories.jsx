import React from 'react';

const categories = [
  {
    id: 1,
    name: 'Camisetas',
    key: 'camisetas',
    desc: 'Conforto e Estilo Premium',
    count: 'Lacoste, Tommy, Quiksilver',
    img: '/Produtos_1/Produto_1.png'
  },
  {
    id: 2,
    name: 'Polos',
    key: 'polos',
    desc: 'Elegancia Classica',
    count: 'Lacoste, Tommy Hilfiger',
    img: '/Produtos_1/Produto_2.png'
  },
  {
    id: 3,
    name: 'Calcas',
    key: 'calcas',
    desc: 'Corte e Acabamento Superior',
    count: 'Reserva, Ellus, Tommy',
    img: '/Produtos_1/Produto_1.png'
  },
  {
    id: 4,
    name: 'Esportivo',
    key: 'esportivo',
    desc: 'Performance e Estilo',
    count: 'Mizuno, Quiksilver, Oakley',
    img: '/Produtos_1/Produto_2.png'
  }
];

const Categories = ({ onCategoryClick }) => {
  const handleClick = (key) => {
    onCategoryClick(key);
    const target = document.querySelector('#produtos');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="categorias" className="section-padding">
      <div className="container">
        <h2 className="section-title">
          <span>Explore Nossas</span>
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
                <img src={cat.img} alt={cat.name} style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.9,
                  transition: 'transform 0.3s ease'
                }} />
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.3rem', fontWeight: 700 }}>{cat.name}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>{cat.desc}</p>
                <small style={{ color: 'var(--color-gold)', fontSize: '0.8rem' }}>{cat.count}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
