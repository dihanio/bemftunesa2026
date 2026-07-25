import type { Variants } from "framer-motion";

// Shared easing curves
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  smooth: [0.25, 0.1, 0.25, 1] as const,
};

// Fade variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.8, delay, ease: ease.smooth },
  }),
};

// Scale reveal
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 1, delay, ease: ease.out },
  }),
};

// Slide from left
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, delay, ease: ease.out },
  }),
};

// Slide from right
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, delay, ease: ease.out },
  }),
};

// Stagger container
export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// Stagger child
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: ease.out },
  },
};
