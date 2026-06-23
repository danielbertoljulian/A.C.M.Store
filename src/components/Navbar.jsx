import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const mq = window.matchMedia('(max-width: 768px)');

const Navbar = ({ cartCount, onCartClick }) => {
  const [mobile, setMobile] = useState(mq.matches);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const CartButton = () => (
    <motion.button
      onClick={onCartClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: 'transparent', border: '1px solid var(--color-gold)',
        color: 'var(--color-gold)', padding: mobile ? '0.33rem 0.55rem' : '0.66rem 1.32rem',
        borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        position: 'relative', fontSize: mobile ? '1.1rem' : '0.99rem', flexShrink: 0,
        lineHeight: 1
      }}
    >
      🛒
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{
              background: 'var(--color-gold)', color: 'var(--color-navy)', borderRadius: '50%',
              width: mobile ? '18px' : '22px', height: mobile ? '18px' : '22px',
              fontSize: mobile ? '0.6rem' : '0.77rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700
            }}
          >
            {cartCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );

  const navLinks = [
    { href: 'home', label: 'Home' },
    { href: 'produtos', label: 'Produtos' },
    { href: 'categorias', label: 'Categorias' },
    { href: 'sobre', label: 'Sobre Nos' },
    { href: 'contato', label: 'Contato' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass"
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
        padding: mobile ? '0.34rem 0' : '0.85rem 0',
        background: scrolled ? '#070707' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(214,181,109,0.1)' : 'none',
        overflowX: mobile ? 'hidden' : 'visible',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease'
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: mobile ? '0.5rem' : '1rem',
        maxWidth: mobile ? '100%' : '1200px',
        margin: '0 auto',
        padding: mobile ? '0 0.5rem' : '0 2rem',
        boxSizing: 'border-box'
      }}>

        {mobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <motion.img
              src="/LOGO_3_NAV.png"
              alt="A.C.M Store"
              whileHover={{ scale: 1.05 }}
              style={{ height: '3.75rem', width: 'auto', cursor: 'pointer' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <div style={{ marginLeft: '0.4rem' }}>
              <CartButton />
            </div>
          </div>
        ) : (
          <>
            <motion.img
              src="/LOGO_3_NAV.png"
              alt="A.C.M Store"
              whileHover={{ scale: 1.05 }}
              style={{ height: '5.25rem', width: 'auto', cursor: 'pointer' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <ul style={{
              display: 'flex', gap: '2.5rem', listStyle: 'none',
              fontSize: '0.85rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '1px',
              margin: 0, padding: 0, whiteSpace: 'nowrap', marginLeft: 'auto'
            }}>
              {navLinks.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  <a href={`#${item.href}`} className="nav-link">{item.label}</a>
                </motion.li>
              ))}
            </ul>
            <CartButton />
          </>
        )}

      </div>
    </motion.nav>
  );
};

export default Navbar;
