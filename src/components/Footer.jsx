import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <footer style={{
      background: '#070707',
      padding: '5rem 0 2rem',
      borderTop: '1px solid var(--glass-border)'
    }}>
      <div className="container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '4rem',
            marginBottom: '4rem'
          }}
        >
          <motion.div variants={itemVariants}>
            <h4 style={{ marginBottom: '1.5rem', color: '#D6B56D' }}>Explorar</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {['Home', 'Produtos', 'Categorias', 'Sobre Nos', 'Contato'].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <a href={`#${item.toLowerCase().replace(' ', '')}`} className="nav-link">{item}</a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 style={{ marginBottom: '1.5rem', color: '#D6B56D' }}>Marcas</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {['Mizuno', 'Tommy Hilfiger', 'Lacoste', 'Quiksilver', 'Oakley', 'Reserva', 'Ellus'].map((brand, i) => (
                <motion.li
                  key={brand}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {brand}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 style={{ marginBottom: '1.5rem', color: '#D6B56D' }}>Contato</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <li>Av Getulio Vargas 1157 Sala 1509</li>
              <li>(51) 98545-8900</li>
            </ul>
            <motion.a
              href="https://fractalsys.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, opacity: 1 }}
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              <img src="/powered_fractalsys.png" alt="Powered by FractalSys" style={{ maxWidth: '140px', height: 'auto', opacity: 0.7, transition: 'opacity 0.3s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              />
            </motion.a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid #2A2D33',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#A7A7A0'
          }}
        >
          <p style={{ marginBottom: '0.5rem', color: '#D6B56D', letterSpacing: '0.1em', textTransform: 'uppercase' }}>®️ Somente produtos originais | 📦 Envio p/ todo Brasil | 🛒 6x sem juros</p>
          <p>© 2026 A.C.M Store. Todos os direitos reservados.</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
