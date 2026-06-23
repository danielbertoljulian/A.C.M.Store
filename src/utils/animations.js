import { motion, AnimatePresence } from 'framer-motion';

export const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const fadeInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export const slideInFromBottom = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
};

export const cardHover = {
  scale: 1.03,
  y: -8,
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
};

export const cardHoverSmall = {
  scale: 1.02,
  y: -4,
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
};

export const glowPulse = {
  boxShadow: [
    '0 0 8px rgba(214, 181, 109, 0.3)',
    '0 0 20px rgba(214, 181, 109, 0.6)',
    '0 0 8px rgba(214, 181, 109, 0.3)'
  ],
  transition: { duration: 1.5, repeat: Infinity }
};

export const shimmer = {
  background: [
    'linear-gradient(90deg, transparent 0%, rgba(214,181,109,0.1) 50%, transparent 100%)',
    'linear-gradient(90deg, transparent 0%, rgba(214,181,109,0.2) 50%, transparent 100%)',
    'linear-gradient(90deg, transparent 0%, rgba(214,181,109,0.1) 50%, transparent 100%)'
  ],
  transition: { duration: 2, repeat: Infinity }
};

export const useInView = (ref, options = {}) => {
  const { threshold = 0.2, rootMargin = '0px' } = options;
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

  return isInView;
};
