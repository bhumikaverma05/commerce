declare module '@headlessui/react';
declare module '@heroicons/react/*';
declare module 'clsx';
declare module 'next/image';
declare module 'next/link';

// Razorpay checkout global (loaded dynamically)
declare global {
  interface Window {
    Razorpay?: any;
  }
}

export { };

