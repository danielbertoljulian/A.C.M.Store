import React from 'react';
import InstagramCarousel from './InstagramCarousel';

const About = () => {
  return (
    <section id="sobre" className="section-padding" style={{ background: '#111315' }}>
      <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
        <InstagramCarousel />
        <h2 className="section-title">
          <span>Nossa Historia</span>
          A A.C.M Store
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#A7A7A0', lineHeight: '2', marginBottom: '2rem' }}>
          A A.C.M Store e uma loja especializada em moda masculina premium,
          trazendo as melhores marcas internacionais para quem busca qualidade
          e estilo incomparaveis. ®️ Somente produtos originais.
        </p>
        <p style={{ fontSize: '1.1rem', color: '#A7A7A0', lineHeight: '2' }}>
          Trabalhamos com marcas como Mizuno, Tommy Hilfiger, Lacoste, Quiksilver, Oakley, Reserva e Ellus,
          oferecendo pecas que combinam conforto, elegancia e sofisticacao
          para o homem moderno. 📦 Envio para todo o Brasil. 🛒 Parcelamento em ate 6x sem juros.
        </p>
      </div>
    </section>
  );
};

export default About;
