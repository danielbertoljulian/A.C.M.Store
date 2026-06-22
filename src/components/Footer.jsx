import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      background: '#070707',
      padding: '5rem 0 2rem',
      borderTop: '1px solid var(--glass-border)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '4rem',
          marginBottom: '4rem'
        }}>
          <div>
            <h4 style={{ marginBottom: '1.5rem',             color: '#D6B56D' }}>Explorar</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <li><a href="#home">Home</a></li>
              <li><a href="#produtos">Produtos</a></li>
              <li><a href="#categorias">Categorias</a></li>
              <li><a href="#sobre">Sobre Nos</a></li>
              <li><a href="#contato">Contato</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginBottom: '1.5rem',             color: '#D6B56D' }}>Marcas</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <li>Mizuno</li>
              <li>Tommy Hilfiger</li>
              <li>Lacoste</li>
              <li>Quiksilver</li>
              <li>Oakley</li>
              <li>Reserva</li>
              <li>Ellus</li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginBottom: '1.5rem',             color: '#D6B56D' }}>Contato</h4>
            <ul style={{ listStyle: 'none', display: 'grid', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <li>Av Getulio Vargas 1157 Sala 1509</li>
              <li>(51) 98545-8900</li>
            </ul>
          </div>
        </div>

        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid #2A2D33',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#A7A7A0'
        }}>
          <p style={{ marginBottom: '0.5rem', color: '#D6B56D', letterSpacing: '0.1em', textTransform: 'uppercase' }}>®️ Somente produtos originais | 📦 Envio p/ todo Brasil | 🛒 6x sem juros</p>
          <p>© 2026 A.C.M Store. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
