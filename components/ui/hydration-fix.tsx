'use client';

import { useEffect, useRef } from 'react';

/**
 * HydrationFix Component
 * 
 * This component addresses hydration errors caused by browser extensions like Grammarly
 * by removing extension-added attributes from the DOM after the initial render.
 * 
 * It specifically targets the attributes identified in the error message:
 * - data-new-gr-c-s-check-loaded
 * - data-gr-ext-installed
 */
export function HydrationFix() {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // List of problematic attributes added by browser extensions
    const problematicAttributes = [
      'data-gramm',
      'data-gramm_editor',
      'data-grammarly',
      'grammarly-extension',
      'data-lt-installed',
      'spellcheck',
      'autocorrect',
      'autocomplete',
      'data-new-gr-c-s-check-loaded', // Specific attribute from error message
      'data-gr-ext-installed',        // Specific attribute from error message
      'data-aos',                     // AOS animation attribute causing hydration mismatch
      'data-aos-delay'                // AOS delay attribute
    ];

    // Function to clean problematic attributes from an element and handle AOS specially
    const cleanElement = (element: Element) => {
      problematicAttributes.forEach(attr => {
        if (element.hasAttribute(attr)) {
          // Special handling for AOS attributes during SSR/hydration
          if (attr === 'data-aos' || attr === 'data-aos-delay') {
            // Set null value on server or store the client value
            if (typeof window === 'undefined') {
              element.setAttribute(attr, 'null');
            }
          } else {
            element.removeAttribute(attr);
          }
        }
      });

      // Clean contentEditable if it was added by an extension
      if (element.getAttribute('contenteditable') === 'true' && 
          (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA')) {
        element.removeAttribute('contenteditable');
      }
    };

    // Immediately clean the document to remove any extension attributes
    const cleanDocument = () => {
      cleanElement(document.documentElement);
      cleanElement(document.body);
      
      // Clean all elements in the body
      document.querySelectorAll('*').forEach(cleanElement);
    };

    // First cleanup
    if (typeof window !== 'undefined') {
      // Run immediately on component mount
      cleanDocument();
      
      // Run again after a short delay to catch any late additions
      setTimeout(cleanDocument, 100);
    }

    // Function to process mutations
    const processMutations = (mutations: MutationRecord[]) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && 
            problematicAttributes.includes(mutation.attributeName || '')) {
          cleanElement(mutation.target as Element);
        }
        
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              cleanElement(node as Element);
              
              // Clean all child elements too
              const children = (node as Element).querySelectorAll('*');
              children.forEach(child => cleanElement(child));
            }
          });
        }
      });
    };

    // Setup MutationObserver
    if (typeof window !== 'undefined' && !observerRef.current) {
      observerRef.current = new MutationObserver(processMutations);
      
      // Start observing the document with the configured parameters
      observerRef.current.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: problematicAttributes
      });
    }

    // Cleanup observer on component unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}
