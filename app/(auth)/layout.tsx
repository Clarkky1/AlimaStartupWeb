import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* You might want to add common layout elements for auth pages here */}
      {children}
    </div>
  );
} 