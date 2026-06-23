import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const brands = [
    { src: '/brands/LACOSTE.png', alt: 'Lacoste' },
    { src: '/brands/TOMMY HILFIGER.png', alt: 'Tommy Hilfiger' },
    { src: '/brands/MIZUNO.png', alt: 'Mizuno' },
    { src: '/brands/OAKLEY.png', alt: 'Oakley' },
    { src: '/brands/QUIKSILVER.png', alt: 'Quiksilver' },
    { src: '/brands/RESERVA.png', alt: 'Reserva' },
    { src: '/brands/ELLUS.png', alt: 'Ellus' },
  ];

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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}
        >
          <motion.img
            src="/LOGO_1_TRNSP.png"
            alt="A.C.M Store"
            variants={logoVariants}
            whileHover={{ scale: 1.05 }}
            style={{
              height: mobile ? '200px' : '300px',
              width: 'auto',
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 20px rgba(214,181,109,0.3))'
            }}
          />

          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: mobile ? '1.5rem' : '2.5rem',
              flexWrap: 'wrap',
              marginBottom: '2rem'
            }}
          >
            {brands.map((brand, index) => (
              <motion.img
                key={brand.alt}
                src={brand.src}
                alt={brand.alt}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
                style={{
                  height: mobile ? '28px' : '36px',
                  width: 'auto',
                  filter: 'grayscale(100%) brightness(0.7)',
                  transition: 'filter 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'grayscale(0%) brightness(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'grayscale(100%) brightness(0.7)';
                }}
              />
            ))}
          </motion.div>

          <motion.p
            variants={itemVariants}
            style={{
              fontSize: mobile ? '0.95rem' : '1.1rem',
              color: '#A7A7A0',
              marginBottom: '1rem',
              letterSpacing: '0.05em'
            }}
          >
            As melhores marcas, para quem tem estilo.
          </motion.p>

          <motion.div
            variants={itemVariants}
            style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}
          >
            <span style={{ color: '#D6B56D', fontSize: '0.85rem', fontWeight: 600 }}>®️ Somente produtos originais</span>
            <span style={{ color: '#A7A7A0', fontSize: '0.85rem' }}>📦 Envio p/ todo Brasil</span>
            <span style={{ color: '#A7A7A0', fontSize: '0.85rem' }}>🛒 Parcelamento em até 6x sem juros</span>
          </motion.div>

          <motion.div
            variants={itemVariants}
            style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.a
              href="#produtos"
              className="btn-premium btn-glow"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(214,181,109,0.6)' }}
              whileTap={{ scale: 0.98 }}
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Ver Coleção
            </motion.a>
            {!mobile && (
              <motion.button
                onClick={openWhatsApp}
                className="nav-link"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(214,181,109,0.1)' }}
                whileTap={{ scale: 0.98 }}
                style={{
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
                }}
              >
                Contato
              </motion.button>
            )}
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
