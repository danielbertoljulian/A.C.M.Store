import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INSTAGRAM_PROFILE = 'https://www.instagram.com/a.c.m.store/';

function toInstagramEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('instagram.com')) return '';
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    if (!/^\/(p|reel|tv)\//.test(cleanPath)) return '';
    return `https://www.instagram.com${cleanPath}/embed`;
  } catch {
    return '';
  }
}

const InstagramCarousel = () => {
  const [links, setLinks] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch('/api/settings?key=instagram_videos')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.value) return;
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed)) setLinks(parsed.filter(Boolean));
      })
      .catch(() => {});
  }, []);

  const embeds = useMemo(() => links.map(toInstagramEmbedUrl).filter(Boolean), [links]);

  const goTo = (direction) => {
    if (embeds.length <= 1) return;
    setActive(current => (current + direction + embeds.length) % embeds.length);
  };

  if (!embeds.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="instagram-showcase"
      >
        <div>
          <span className="instagram-eyebrow">Instagram</span>
          <h3>Acompanhe nossos looks e novidades</h3>
        </div>
        <motion.a
          className="instagram-shortcut"
          href={INSTAGRAM_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Abrir @a.c.m.store
        </motion.a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="instagram-showcase"
    >
      <div className="instagram-header">
        <div>
          <span className="instagram-eyebrow">Instagram</span>
          <h3>Videos da A.C.M Store</h3>
        </div>
        <motion.a
          className="instagram-shortcut"
          href={INSTAGRAM_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Ver perfil
        </motion.a>
      </div>

      <div className="instagram-carousel">
        <motion.button
          type="button"
          className="instagram-nav"
          onClick={() => goTo(-1)}
          aria-label="Video anterior"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {'<'}
        </motion.button>
        <div className="instagram-frame-wrap">
          <AnimatePresence mode="wait">
            <motion.iframe
              key={embeds[active]}
              src={embeds[active]}
              title={`Video do Instagram ${active + 1}`}
              className="instagram-frame"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allowFullScreen
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
        </div>
        <motion.button
          type="button"
          className="instagram-nav"
          onClick={() => goTo(1)}
          aria-label="Proximo video"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {'>'}
        </motion.button>
      </div>

      {embeds.length > 1 && (
        <div className="instagram-dots" aria-label="Selecionar video">
          {embeds.map((_, index) => (
            <motion.button
              key={index}
              type="button"
              className={index === active ? 'active' : ''}
              onClick={() => setActive(index)}
              aria-label={`Abrir video ${index + 1}`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default InstagramCarousel;
