/**
 * Telegram Mini App integration service
 * Safely wraps window.Telegram.WebApp APIs with fallbacks for standard web browsers.
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          auth_date?: string;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData);
}

export function getTelegramWebApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
}

export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
  } catch (err) {
    console.warn('Could not initialize Telegram WebApp view:', err);
  }
}

export function closeTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.close();
    } catch {
      // Ignore
    }
  }
}

export function openTelegramLink(url: string): void {
  const tg = getTelegramWebApp();
  const cleanUrl = url.startsWith('http') ? url : `https://t.me/${url.replace(/^@/, '')}`;
  if (tg && typeof tg.openTelegramLink === 'function') {
    try {
      tg.openTelegramLink(cleanUrl);
      return;
    } catch {
      // Fallback below
    }
  }
  if (typeof window !== 'undefined') {
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  }
}

export function openExternalLink(url: string): void {
  const tg = getTelegramWebApp();
  if (tg && typeof tg.openLink === 'function') {
    try {
      tg.openLink(url);
      return;
    } catch {
      // Fallback
    }
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.impactOccurred(style);
    } catch {
      // Ignored if not supported
    }
  }
}

export function hapticNotification(type: 'error' | 'success' | 'warning'): void {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.notificationOccurred(type);
    } catch {
      // Ignored if not supported
    }
  }
}

export function getTelegramUser() {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

/**
 * Attaches a callback to Telegram's native BackButton in Telegram Mini Apps.
 * Returns a cleanup function to hide the button when component unmounts.
 */
export function setupTelegramBackButton(onBack: () => void): () => void {
  const tg = getTelegramWebApp();
  if (!tg?.BackButton) {
    return () => {};
  }

  try {
    tg.BackButton.show();
    tg.BackButton.onClick(onBack);
  } catch (err) {
    console.warn('Could not attach Telegram BackButton:', err);
  }

  return () => {
    try {
      tg.BackButton.offClick(onBack);
      tg.BackButton.hide();
    } catch {
      // Ignore
    }
  };
}

