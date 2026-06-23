import React from 'react';
import { motion } from 'framer-motion';
import InstagramCarousel from './InstagramCarousel';

const About = () => {
  return (
    <section id="sobre" className="section-padding" style={{ background: '#111315' }}>
      <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
        <InstagramCarousel />
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <span>Nossa Historia</span>
          A A.C.M Store
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: '1.1rem', color: '#A7A7A0', lineHeight: '2', marginBottom: '2rem' }}
        >
          A A.C.M Store e uma loja especializada em moda masculina premium,
          trazendo as melhores marcas internacionais para quem busca qualidade
          e estilo incomparaveis. ®️ Somente produtos originais.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ fontSize: '1.1rem', color: '#A7A7A0', lineHeight: '2' }}
        >
          Trabalhamos com marcas como Mizuno, Tommy Hilfiger, Lacoste, Quiksilver, Oakley, Reserva e Ellus,
          oferecendo pecas que combinam conforto, elegancia e sofisticacao
          para o homem moderno. 📦 Envio para todo o Brasil. 🛒 Parcelamento em ate 6x sem juros.
        </motion.p>
      </div>
    </section>
  );
};

export default About;
