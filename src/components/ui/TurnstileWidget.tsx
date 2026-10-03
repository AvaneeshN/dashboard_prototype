'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          action?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

const DEFAULT_SITE_KEY = '0x4AAAAAAFM0qJe7JBMC1FLO';

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onSuccess,
  onError,
  onExpire,
  className = '',
  theme = 'light'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || DEFAULT_SITE_KEY;

  useEffect(() => {
    let isCancelled = false;

    // Load Turnstile script if not already present
    const SCRIPT_ID = 'cf-turnstile-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const renderWidget = () => {
      if (isCancelled || !containerRef.current || !window.turnstile) return;

      try {
        // Clear previous widget if any
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignore clean removal error
          }
          widgetIdRef.current = null;
        }

        const widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size: 'flexible',
          action: 'register',
          callback: (token: string) => {
            if (!isCancelled) {
              setLoadError(null);
              onSuccess(token);
            }
          },
          'error-callback': (code?: string) => {
            if (!isCancelled) {
              console.warn('Cloudflare Turnstile error code:', code);
              setLoadError('Security check encounter. Retrying...');
              onError?.(code);
            }
          },
          'expired-callback': () => {
            if (!isCancelled) {
              onExpire?.();
            }
          }
        });

        widgetIdRef.current = widgetId;
        setIsRendered(true);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to render Turnstile widget:', err);
          setLoadError('Unable to load security verification.');
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        renderWidget();
      };
      script.onerror = () => {
        if (!isCancelled) {
          setLoadError('Security verification failed to load (offline or blocked).');
        }
      };
      document.head.appendChild(script);
    } else {
      if (window.turnstile) {
        renderWidget();
      } else {
        script.addEventListener('load', renderWidget, { once: true });
      }
    }

    return () => {
      isCancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme]);

  return (
    <div className={`turnstile-wrapper my-2.5 ${className}`}>
      <div 
        ref={containerRef} 
        className="min-h-[65px] flex items-center justify-center rounded-2xl overflow-hidden bg-zinc-50/70 border border-zinc-200/80 p-1"
      />
      {loadError && (
        <div className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{loadError}</span>
        </div>
      )}
    </div>
  );
};
