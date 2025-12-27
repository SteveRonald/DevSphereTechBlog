"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Gift, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CelebrationAnimation() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const gifts = [
    { icon: Trophy, delay: 0, color: "text-yellow-500" },
    { icon: Star, delay: 0.2, color: "text-blue-500" },
    { icon: Gift, delay: 0.4, color: "text-pink-500" },
    { icon: CheckCircle2, delay: 0.6, color: "text-green-500" },
  ];

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Confetti Effect */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: [
                    "#fbbf24",
                    "#3b82f6",
                    "#ec4899",
                    "#10b981",
                    "#8b5cf6",
                  ][Math.floor(Math.random() * 5)],
                }}
                initial={{ y: -100, opacity: 0, scale: 0 }}
                animate={{
                  y: window.innerHeight + 100,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Main Celebration Message */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl text-center"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
            >
              🎉 Congratulations! 🎉
            </motion.div>
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground mb-6"
            >
              You've completed this lesson!
            </motion.p>

            {/* Popping Gifts */}
            <div className="flex justify-center gap-4">
              {gifts.map((gift, index) => {
                const Icon = gift.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{
                      scale: [0, 1.2, 1],
                      rotate: [0, 360],
                      y: [0, -20, 0],
                    }}
                    transition={{
                      delay: gift.delay,
                      duration: 0.6,
                      type: "tween",
                      ease: "easeOut",
                    }}
                    className="relative"
                  >
                    <Icon className={`h-12 w-12 ${gift.color}`} />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.5, 0] }}
                      transition={{
                        delay: gift.delay + 0.3,
                        duration: 0.4,
                        type: "tween",
                        ease: "easeOut",
                      }}
                      className={`absolute inset-0 rounded-full ${gift.color.replace("text-", "bg-")} opacity-20`}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}









