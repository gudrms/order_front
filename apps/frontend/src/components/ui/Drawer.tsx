import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'left' | 'right';
  className?: string;
}

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  className,
}: DrawerProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const positionClasses = {
    left: 'left-0 top-0 h-full w-full sm:w-[400px] border-r',
    right: 'right-0 top-0 h-full w-full sm:w-[400px] border-l',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute flex flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out',
          positionClasses[position],
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="-mr-2 text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="relative flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="border-t border-gray-100 bg-gray-50 p-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export { Drawer };
