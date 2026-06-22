import React, { useState, useEffect } from 'react';

const mq = window.matchMedia('(max-width: 768px)');

const Navbar = ({ cartCount, onCartClick }) => {
  const [mobile, setMobile] = useState(mq.matches);

  useEffect(() => {
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const CartButton = () => (
    <button onClick={onCartClick} style={{
      background: 'transparent', border: '1px solid var(--color-gold)',
      color: 'var(--color-gold)', padding: mobile ? '0.33rem 0.55rem' : '0.66rem 1.32rem',
      borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      position: 'relative', fontSize: mobile ? '1.1rem' : '0.99rem', flexShrink: 0,
      lineHeight: 1
    }}>
      🛒
      {cartCount > 0 && (
        <span style={{
          background: 'var(--color-gold)', color: 'var(--color-navy)', borderRadius: '50%',
          width: mobile ? '18px' : '22px', height: mobile ? '18px' : '22px',
          fontSize: mobile ? '0.6rem' : '0.77rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700
        }}>{cartCount}</span>
      )}
    </button>
  );

  return (
    <nav className="glass" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
      padding: mobile ? '0.34rem 0' : '0.85rem 0', transition: 'var(--transition-smooth)',
      background: '#070707',
      overflowX: mobile ? 'hidden' : 'visible'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: mobile ? '0.5rem' : '1rem',
        maxWidth: mobile ? '100%' : '1200px',
        margin: '0 auto',
        padding: mobile ? '0 0.5rem' : '0 2rem',
        boxSizing: 'border-box'
      }}>

        {mobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <img src="/LOGO_3_NAV.png" alt="A.C.M Store" style={{ height: '3.75rem', width: 'auto', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <div style={{ marginLeft: '0.4rem' }}>
              <CartButton />
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
              <img src="/LOGO_3_NAV.png" alt="A.C.M Store" style={{ height: '5.25rem', width: 'auto', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            </div>
            <ul style={{
              display: 'flex', gap: '2.5rem', listStyle: 'none',
              fontSize: '0.85rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '1px',
              margin: 0, padding: 0, whiteSpace: 'nowrap', marginLeft: 'auto'
            }}>
              {[
                { href: 'home', label: 'Home' },
                { href: 'produtos', label: 'Produtos' },
                { href: 'categorias', label: 'Categorias' },
                { href: 'sobre', label: 'Sobre Nos' },
                { href: 'contato', label: 'Contato' },
              ].map(item => (
                <li key={item.href}>
                  <a href={`#${item.href}`} className="nav-link">{item.label}</a>
                </li>
              ))}
            </ul>
            <CartButton />
          </>
        )}

      </div>
    </nav>
  );
};

export default Navbar;
