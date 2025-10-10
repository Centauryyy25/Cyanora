import { Variants } from "framer-motion";

// Shared spring config kept soft and subtle
export const softSpring = {
  type: "spring" as const,
  stiffness: 50,
  damping: 20,
  mass: 0.8,
};

// Fade in
export const fadeIn = (delay = 0): Variants => ({
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { ...softSpring, delay } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
});

// Slide up with fade
export const slideUp = (delay = 0, offset = 12): Variants => ({
  initial: { opacity: 0, y: offset },
  animate: { opacity: 1, y: 0, transition: { ...softSpring, delay } },
  exit: { opacity: 0, y: -offset / 2, transition: { duration: 0.25 } },
});

// Pop in (subtle scale)
export const popIn = (delay = 0, from = 0.98): Variants => ({
  initial: { opacity: 0, scale: from },
  animate: { opacity: 1, scale: 1, transition: { ...softSpring, delay } },
  exit: { opacity: 0, scale: from, transition: { duration: 0.2 } },
});

// Stagger children for list/content reveals
export const staggerContainer = (stagger = 0.06, delayChildren = 0) => ({
  animate: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

