import React, { useState, useEffect } from 'react';
import LightRays from './LightRays';

const Hero = () => {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const openWhatsApp = () => {
    window.open('https://wa.me/5551985458900?text=Ola! Vim pelo site A.C.M Store e gostaria de mais informacoes.', '_blank');
  };

  return (
    <section id="home" style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '80px'
    }}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#D6B56D"
        raysSpeed={0.8}
        lightSpread={0.5}
        rayLength={3}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0}
        distortion={0}
        className="custom-rays"
        pulsating={false}
        fadeDistance={1}
        saturation={1}
      />

      <div className="container" style={{
        display: 'flex',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div data-aos="fade-up" style={{ maxWidth: '700px', margin: '0 auto' }}>

          <img src="/LOGO_1_TRNSP.png" alt="A.C.M Store" style={{
            height: mobile ? '240px' : '360px',
            width: 'auto',
            marginBottom: '2rem',
            filter: 'drop-shadow(0 4px 20px rgba(214,181,109,0.3))'
          }} />

          <p style={{
            fontSize: mobile ? '0.95rem' : '1.1rem',
            color: '#A7A7A0',
            marginBottom: '1rem',
            letterSpacing: '0.05em'
          }}>
            As melhores marcas, para quem tem estilo.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <span style={{ color: '#D6B56D', fontSize: '0.85rem', fontWeight: 600 }}>®️ Somente produtos originais</span>
            <span style={{ color: '#A7A7A0', fontSize: '0.85rem' }}>📦 Envio p/ todo Brasil</span>
            <span style={{ color: '#A7A7A0', fontSize: '0.85rem' }}>🛒 Parcelamento em até 6x sem juros</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#produtos" className="btn-premium btn-glow" style={{ textDecoration: 'none', display: 'inline-block' }}>Ver Colecao</a>
            {!mobile && (
              <button onClick={openWhatsApp} className="nav-link" style={{
                background: 'transparent',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-gold)',
                padding: '0.8rem 2rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>Contato</button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
