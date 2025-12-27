"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Gift, CheckCircle2, Sparkles, Award, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrationVariantsProps {
  variant?: number; // Optional: specify which variant to show, otherwise random
  onComplete?: () => void;
}

export function CelebrationVariants({ variant, onComplete }: CelebrationVariantsProps) {
  const [show, setShow] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(variant ?? Math.floor(Math.random() * 4));

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Variant 0: Fireworks Celebration
  const FireworksCelebration = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Fireworks Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = (i * 360) / 30;
          const distance = 200 + Math.random() * 150;
          const x = Math.cos((angle * Math.PI) / 180) * distance;
          const y = Math.sin((angle * Math.PI) / 180) * distance;
          const colors = ["#fbbf24", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#f59e0b"];
          const color = colors[Math.floor(Math.random() * colors.length)];

          return (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: "50%",
                top: "50%",
                backgroundColor: color,
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: x,
                y: y,
                scale: [1, 1.5, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.2,
                delay: Math.random() * 0.3,
                ease: "easeOut",
              }}
            />
          );
        })}
      </div>

      {/* Main Message */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl text-center relative z-10"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          🎆 Amazing Work! 🎆
        </motion.div>
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted-foreground"
        >
          You've completed this lesson!
        </motion.p>
      </motion.div>
    </div>
  );

  // Variant 1: Flowers Celebration
  const FlowersCelebration = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Floating Flowers */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => {
          const startX = Math.random() * 100;
          const startY = 100;
          const endY = -20;
          const colors = ["#f472b6", "#ec4899", "#fbbf24", "#10b981", "#3b82f6"];
          const color = colors[Math.floor(Math.random() * colors.length)];

          return (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{
                left: `${startX}%`,
                top: `${startY}%`,
              }}
              initial={{ y: 0, rotate: 0, opacity: 0 }}
              animate={{
                y: endY - startY,
                rotate: [0, 180, 360],
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1, 1, 0.5],
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 1.5,
                ease: "easeOut",
              }}
            >
              🌸
            </motion.div>
          );
        })}
      </div>

      {/* Main Message */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl text-center relative z-10"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
        >
          🌺 Fantastic! 🌺
        </motion.div>
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted-foreground"
        >
          Great job completing this lesson!
        </motion.p>
      </motion.div>
    </div>
  );

  // Variant 2: Stars & Sparkles
  const StarsCelebration = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Sparkles Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1.5,
              delay: Math.random() * 1,
              repeat: 1,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-6 w-6 text-yellow-400" />
          </motion.div>
        ))}
      </div>

      {/* Main Message */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl text-center relative z-10"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
        >
          ⭐ Excellent! ⭐
        </motion.div>
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted-foreground"
        >
          You're making great progress!
        </motion.p>
      </motion.div>
    </div>
  );

  // Variant 3: Confetti & Gifts (Original enhanced)
  const ConfettiCelebration = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Confetti Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
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
                "#f59e0b",
              ][Math.floor(Math.random() * 6)],
            }}
            initial={{ y: -100, opacity: 0, scale: 0 }}
            animate={{
              y: window.innerHeight + 100,
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2.5,
              delay: Math.random() * 0.8,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Main Message */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl text-center relative z-10"
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

        {/* Popping Icons */}
        <div className="flex justify-center gap-4">
          {[
            { icon: Trophy, delay: 0, color: "text-yellow-500" },
            { icon: Star, delay: 0.2, color: "text-blue-500" },
            { icon: Gift, delay: 0.4, color: "text-pink-500" },
            { icon: CheckCircle2, delay: 0.6, color: "text-green-500" },
          ].map((item, index) => {
            const Icon = item.icon;
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
                  delay: item.delay,
                  duration: 0.6,
                  type: "tween",
                  ease: "easeOut",
                }}
                className="relative"
              >
                <Icon className={`h-12 w-12 ${item.color}`} />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 0] }}
                  transition={{
                    delay: item.delay + 0.3,
                    duration: 0.4,
                    type: "tween",
                    ease: "easeOut",
                  }}
                  className={`absolute inset-0 rounded-full ${item.color.replace("text-", "bg-")} opacity-20`}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );

  const variants = [
    FireworksCelebration,
    FlowersCelebration,
    StarsCelebration,
    ConfettiCelebration,
  ];

  const SelectedVariant = variants[selectedVariant % variants.length];

  return (
    <AnimatePresence>
      {show && <SelectedVariant />}
    </AnimatePresence>
  );
}

