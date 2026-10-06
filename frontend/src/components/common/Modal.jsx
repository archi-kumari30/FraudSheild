import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#17211D]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] shadow-xl text-[#17211D] z-10 overflow-hidden transform transition-all my-8`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4E2DC] bg-[#F4F8F5]">
          <h3 className="text-base font-semibold text-[#17211D] tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#5A6E65] hover:text-[#17211D] hover:bg-[#DCEBE4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto text-[#17211D]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
