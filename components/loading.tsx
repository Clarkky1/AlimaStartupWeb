"use client";

import React from "react";
import { motion } from "framer-motion";

export const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="relative h-24 w-24"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute inset-0 h-full w-full rounded-full border-4 border-primary border-t-transparent"
            animate={{ rotate: [0, -360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 h-full w-full rounded-full border-4 border-primary/50 border-t-transparent"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
        <motion.div
          className="text-primary text-xl font-bold"
          animate={{ y: [-10, 10] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          Alima
        </motion.div>
      </motion.div>
    </div>
  );
};