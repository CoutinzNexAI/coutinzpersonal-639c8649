import { useEffect, useRef } from 'react';

export function useOutsideClick<T extends HTMLElement>(
  callback: () => void,
  enabled: boolean = true
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: Event) => {
      // Ensure we have a target element
      const target = event.target as Node;
      if (!target) return;

      // Check if the click is outside the referenced element
      if (ref.current && !ref.current.contains(target)) {
        // Additional check: make sure it's not a descendant that was dynamically added
        if (target instanceof Element && !target.closest(`[data-cart-container="true"]`)) {
          callback();
        } else if (!(target instanceof Element)) {
          // If it's not an Element (e.g., text node), call callback anyway
          callback();
        }
      }
    };

    // Use capture phase to catch the event before it bubbles
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [callback, enabled]);

  return ref;
} 