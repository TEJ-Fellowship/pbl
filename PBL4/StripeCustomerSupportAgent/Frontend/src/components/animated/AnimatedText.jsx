import { motion } from "framer-motion";

export default function AnimatedText({ text, className = "" }) {
  // Split the string into parts, keeping <br /> tags as markers
  const parts = text.split(/(<br\s*\/?>)/i);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // much faster stagger
        delayChildren: 0.1,
      },
    },
  };

  const child = {
    hidden: { opacity: 0, y: `0.5em` }, // reduced movement for better flow
    visible: {
      opacity: 1,
      y: `0em`,
      transition: {
        duration: 0.3, // much faster animation
        ease: [0.16, 1, 0.3, 1], // smooth cubic bezier
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={`inline-block text-center leading-tight ${className}`}
    >
      {parts.map((part, i) =>
        /<br\s*\/?>/i.test(part) ? (
          <br key={i} />
        ) : (
          part.split("").map((char, index) => (
            <span
              key={`${i}-${index}`}
              className="inline-block overflow-hidden"
              style={{
                verticalAlign: "baseline",
                lineHeight: "inherit",
                height: "auto",
              }}
            >
              <motion.span
                variants={child}
                className="inline-block will-change-transform"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            </span>
          ))
        )
      )}
    </motion.div>
  );
}
