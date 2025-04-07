"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface CategoryContextType {
  selectedGlobalCategory: string | null;
  setSelectedGlobalCategory: (category: string | null) => void;
  selectedLocalCategory: string | null;
  setSelectedLocalCategory: (category: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CategoryContext = createContext<CategoryContextType>({
  selectedGlobalCategory: null,
  setSelectedGlobalCategory: () => {},
  selectedLocalCategory: null,
  setSelectedLocalCategory: () => {},
  activeTab: "global",
  setActiveTab: () => {}
});

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [selectedGlobalCategory, setSelectedGlobalCategory] = useState<string | null>(null);
  const [selectedLocalCategory, setSelectedLocalCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("global");

  return (
    <CategoryContext.Provider 
      value={{ 
        selectedGlobalCategory, 
        setSelectedGlobalCategory,
        selectedLocalCategory,
        setSelectedLocalCategory,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export function useCategory() {
  return useContext(CategoryContext);
} 