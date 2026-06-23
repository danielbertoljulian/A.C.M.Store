import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import LightRays from './LightRays';

const BrandLogo = ({ brand, index, mobile }) => {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 1200 + index * 300));
      await controls.start({
        boxShadow: [
          '0 0 0px rgba(214,181,109,0)',
          '0 0 18px rgba(214,181,109,0.9), 0 0 36px rgba(214,181,109,0.5)',
          '0 0 0px rgba(214,181,109,0)'
        ],
        borderColor: [
          'rgba(214,181,109,0)',
          'rgba(214,181,109,1)',
          'rgba(214,181,109,0.3)'
        ],
        transition: { duration: 0.8, ease: 'easeInOut' }
      });
      controls.set({
        boxShadow: '0 0 12px rgba(214,181,109,0.35)',
        borderColor: 'rgba(214,181,109,0.35)'
      });
    };
    sequence();
  }, [controls, index]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.8 + index * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.img
        src={brand.src}
        alt={brand.alt}
        animate={controls}
        whileHover={{ scale: 1.12, boxShadow: '0 0 20px rgba(214,181,109,0.7)' }}
        style={{
          height: mobile ? '32px' : '42px',
          width: 'auto',
          display: 'block',
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(214,181,109,0)',
          background: 'rgba(214,181,109,0.05)',
          cursor: 'default'
        }}
      />
    </motion.div>
  );
};

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
              gap: mobile ? '0.8rem' : '1.2rem',
              flexWrap: 'wrap',
              marginBottom: '2rem'
            }}
          >
            {brands.map((brand, index) => (
              <BrandLogo key={brand.alt} brand={brand} index={index} mobile={mobile} />
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
