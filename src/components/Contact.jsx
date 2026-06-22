import React, { useState, useEffect } from 'react';

const Contact = () => {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const openWhatsApp = (msg) => {
    window.open(`https://wa.me/5551985458900?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section id="contato" className="section-padding">
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'minmax(300px, 400px) 1fr',
        gap: mobile ? '2rem' : '4rem'
      }}>
        <div>
          <h2 className="section-title" style={{ textAlign: mobile ? 'center' : 'left', marginBottom: '2rem' }}>
            <span style={{ color: '#D6B56D' }}>Fale Conosco</span>
            Solicite um Orcamento Personalizado
          </h2>
          <p style={{ color: '#A7A7A0', marginBottom: '2.5rem', textAlign: mobile ? 'center' : 'left' }}>
            Nossa equipe esta pronta para ajudar voce a escolher as melhores pecas
            para o seu estilo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: mobile ? 'center' : 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#15181C', color: '#D6B56D', border: '1px solid #2A2D33' }}>
                📍
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem' }}>Endereco</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Av Getulio Vargas 1157 Sala 1509</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#15181C', color: '#D6B56D', border: '1px solid #2A2D33' }}>
                📱
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem' }}>WhatsApp / Telefone</h4>
                <p style={{ fontSize: '0.8rem', color: '#A7A7A0', cursor: mobile ? 'pointer' : 'default' }}
                  onClick={() => { if (mobile) openWhatsApp('Ola! Vim pelo site A.C.M Store e gostaria de mais informacoes.'); }}>
                  (51) 98545-8900
                </p>
              </div>
            </div>

            <a href="https://fractalsys.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.5rem' }}>
              <img src="/powered_fractalsys.png" alt="Powered by FractalSys" style={{ maxWidth: '180px', height: 'auto', opacity: 0.8, transition: 'opacity 0.3s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
              />
            </a>
          </div>
        </div>

        <div className="glass" style={{ padding: mobile ? '1.5rem' : '3rem', borderRadius: '12px', background: '#15181C', border: '1px solid #2A2D33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
            <p style={{ color: '#A7A7A0', textAlign: 'center', maxWidth: '360px' }}>
              Toque no botao abaixo para falar conosco pelo WhatsApp.
            </p>
            <button onClick={() => openWhatsApp('Ola! Vim pelo site A.C.M Store e gostaria de mais informacoes.')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                background: 'linear-gradient(135deg, #D6B56D, #F2D78A)',
                color: '#070707', border: 'none',
                padding: '1rem 2rem', borderRadius: '12px',
                fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 8px 24px rgba(214,181,109,0.35)',
                width: '100%', maxWidth: '320px',
                transition: 'var(--transition-smooth)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Fale pelo WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
