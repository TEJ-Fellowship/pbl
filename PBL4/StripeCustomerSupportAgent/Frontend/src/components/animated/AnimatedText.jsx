import { motion } from "framer-motion";

export default function AnimatedText({ text, className = "" }) {
  // Split the string into parts, keeping <br /> tags as markers
  const parts = text.split(/(<br\s*\/?>)/i);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // controls delay between letters
        delayChildren: 0.2,
      },
    },
  };

  const child = {
    hidden: { opacity: 0, y: `1.2em` }, // start clearly below
    visible: {
      opacity: 1,
      y: `0em`,
      transition: {
        duration: 0.6, // slightly slower for fluidity
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
              className="inline-block overflow-hidden align-bottom"
              style={{
                verticalAlign: "baseline",
                lineHeight: "1em",
                height: "1em",
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
