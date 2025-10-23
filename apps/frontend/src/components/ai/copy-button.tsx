'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import copy from 'copy-to-clipboard';

/**
 * Copy Button Component
 * A button that copies text to clipboard and shows confirmation
 */
interface CopyButtonProps {
  /** Text to copy */
  text: string;
  /** Button size variant */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Button style variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Additional CSS classes */
  className?: string;
}

export function CopyButton({
  text,
  size = 'sm',
  variant = 'ghost',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = () => {
    copy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopy}
      title={copied ? '已複製' : '複製'}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
