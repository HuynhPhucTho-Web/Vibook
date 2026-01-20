import { motion, useSpring, useMotionValue } from "framer-motion";
import { useEffect } from "react";

export default function InteractiveBlob({ color, size, offset = { x: 0, y: 0 } }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - size / 2 + offset.x);
      mouseY.set(e.clientY - size / 2 + offset.y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [size, offset.x, offset.y, mouseX, mouseY]);

  return (
    <motion.div
      className="blob"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: x,
        top: y,
        opacity: 0.5,
      }}
    />
  );
}