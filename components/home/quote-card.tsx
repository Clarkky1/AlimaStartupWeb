"use client"

import React, { useEffect, useState } from 'react';

// Define 4 designer-friendly color schemes
const colorSchemes = [
  {
    // Blue scheme
    background: "bg-blue-500",
    shadow: "shadow-blue-500/20",
    hoverShadow: "group-hover:shadow-blue-500/30",
    title: "text-blue-50",
    quoteIcon: "text-blue-100/80",
    quoteText: "text-blue-50",
    author: "text-blue-100",
    authorSpan: "text-blue-100/70",
    authorIcon: "text-blue-100/50"
  },
  {
    // Purple/Indigo scheme
    background: "bg-indigo-600",
    shadow: "shadow-indigo-600/20",
    hoverShadow: "group-hover:shadow-indigo-600/30",
    title: "text-indigo-50",
    quoteIcon: "text-indigo-100/80",
    quoteText: "text-indigo-50",
    author: "text-indigo-100",
    authorSpan: "text-indigo-100/70",
    authorIcon: "text-indigo-100/50"
  },
  {
    // Teal/Green scheme
    background: "bg-emerald-600",
    shadow: "shadow-emerald-600/20",
    hoverShadow: "group-hover:shadow-emerald-600/30",
    title: "text-emerald-50",
    quoteIcon: "text-emerald-100/80",
    quoteText: "text-emerald-50",
    author: "text-emerald-100",
    authorSpan: "text-emerald-100/70",
    authorIcon: "text-emerald-100/50"
  },
  {
    // Coral/Orange scheme
    background: "bg-rose-500",
    shadow: "shadow-rose-500/20",
    hoverShadow: "group-hover:shadow-rose-500/30",
    title: "text-rose-50",
    quoteIcon: "text-rose-100/80",
    quoteText: "text-rose-50",
    author: "text-rose-100",
    authorSpan: "text-rose-100/70",
    authorIcon: "text-rose-100/50"
  }
];

// Array of quotes that will rotate
const quotes = [
  {
    text: "Fortune favors the bold.",
    author: "Virgil",
    role: "Latin poet"
  },
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    role: "Greek philosopher"
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
    role: "Management consultant"
  },
  {
    text: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
    role: "Italian polymath"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    role: "Co-founder of Apple"
  },
  {
    text: "Coming together is a beginning, staying together is progress, and working together is success.",
    author: "Henry Ford",
    role: "Founder of Ford Motors"
  },
  {
    text: "Your most unhappy customers are your greatest source of learning.",
    author: "Bill Gates",
    role: "Co-founder of Microsoft"
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    role: "American writer"
  },
  {
    text: "The only place where success comes before work is in the dictionary.",
    author: "Vidal Sassoon",
    role: "Entrepreneur"
  },
  {
    text: "Success is not the key to happiness. Happiness is the key to success.",
    author: "Albert Schweitzer",
    role: "Philosopher"
  }
];

const QuoteCard = () => {
  // State to store the current quote and color scheme
  const [quote, setQuote] = useState(quotes[0]);
  const [colorScheme, setColorScheme] = useState(colorSchemes[0]);
  
  // Get a random quote and color scheme on component mount (page refresh)
  useEffect(() => {
    const randomQuoteIndex = Math.floor(Math.random() * quotes.length);
    const randomColorIndex = Math.floor(Math.random() * colorSchemes.length);
    
    setQuote(quotes[randomQuoteIndex]);
    setColorScheme(colorSchemes[randomColorIndex]);
  }, []);

  return (
    <div className="group">
      <div className={`w-[300px] min-h-[320px] ${colorScheme.background} relative rounded-lg shadow-lg ${colorScheme.shadow} transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-xl ${colorScheme.hoverShadow} flex flex-col`}>
        <div className={`uppercase font-bold ${colorScheme.title} p-[30px] leading-[23px]`}>
          Quote of the moment
        </div>
        <div className={`${colorScheme.quoteIcon} pl-[30px] relative`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 330 307" height={70} width={70} className="text-current">
            <path fill="currentColor" d="M302.258 176.221C320.678 176.221 329.889 185.432 329.889 203.853V278.764C329.889 297.185 320.678 306.395 302.258 306.395H231.031C212.61 306.395 203.399 297.185 203.399 278.764V203.853C203.399 160.871 207.902 123.415 216.908 91.4858C226.323 59.1472 244.539 30.902 271.556 6.75027C280.562 -1.02739 288.135 -2.05076 294.275 3.68014L321.906 29.4692C328.047 35.2001 326.614 42.1591 317.608 50.3461C303.69 62.6266 292.228 80.4334 283.223 103.766C274.626 126.69 270.328 150.842 270.328 176.221H302.258ZM99.629 176.221C118.05 176.221 127.26 185.432 127.26 203.853V278.764C127.26 297.185 118.05 306.395 99.629 306.395H28.402C9.98126 306.395 0.770874 297.185 0.770874 278.764V203.853C0.770874 160.871 5.27373 123.415 14.2794 91.4858C23.6945 59.1472 41.9106 30.902 68.9277 6.75027C77.9335 -1.02739 85.5064 -2.05076 91.6467 3.68014L119.278 29.4692C125.418 35.2001 123.985 42.1591 114.98 50.3461C101.062 62.6266 89.6 80.4334 80.5942 103.766C71.9979 126.69 67.6997 150.842 67.6997 176.221H99.629Z" />
          </svg>
        </div>
        <div className={`text-[20px] md:text-[24px] font-extrabold px-[30px] py-[10px] ${colorScheme.quoteText} flex-grow`}>
          {quote.text}
        </div>
        <div className={`mt-[15px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 font-bold ${colorScheme.author} px-[30px] py-[15px]`}>
          - by {quote.author} <br /> 
          <span className={`${colorScheme.authorSpan} text-[0.9em]`}>({quote.role})</span> 
          <svg height="18" width="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={`inline ${colorScheme.authorIcon} text-[12px]`}>
            <path d="M0 0H24V24H0z" fill="none" />
            <path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default QuoteCard; 