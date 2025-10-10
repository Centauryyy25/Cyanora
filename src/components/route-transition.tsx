"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import * as React from "react";
import { slideUp } from "@/utils/motion";

type Props = {
  children: React.ReactNode;
};

export default function RouteTransition({ children }: Props) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const variants = React.useMemo(() => {
    if (reduce) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      };
    }
    return slideUp(0, 14);
  }, [reduce]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

