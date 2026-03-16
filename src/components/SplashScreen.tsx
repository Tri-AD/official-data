import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { TriadLogo } from './TriadLogo';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3000;
    const interval = 30;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 100));
      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(onComplete, 500);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#050505] z-40"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="relative flex flex-col items-center w-full max-w-2xl px-8">
        {/* Logo Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative w-full"
        >
          <TriadLogo className="w-full h-auto drop-shadow-[0_0_15px_rgba(0,243,255,0.3)]" />
          
          {/* Ambient Glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.15)_0%,transparent_60%)] blur-2xl -z-10"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Loading Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 w-64 flex flex-col items-center gap-4"
        >
          <div className="w-full h-[2px] bg-white/10 overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between w-full text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">
            <span>Boot_Sequence</span>
            <span className="text-[#00f3ff]">{Math.round(progress)}%</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
