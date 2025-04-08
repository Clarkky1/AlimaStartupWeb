"use client";

import React from "react";

export const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 h-full w-full rounded-full border-4 border-primary border-t-transparent animate-spin-reverse" />
          <div className="absolute inset-0 h-full w-full rounded-full border-4 border-primary/50 border-t-transparent animate-spin" />
        </div>
        <div className="text-primary text-xl font-bold animate-bounce">
          Alima
        </div>
      </div>
    </div>
  );
};