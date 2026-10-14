import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getChatWidgetUrl } from '../TabTestChatbot';

/**
 * Tests for getChatWidgetUrl.
 *
 * Behaviour contract:
 *  - Returns the value of NEXT_PUBLIC_CHAT_WIDGET_URL when it is a non-blank string.
 *  - Returns null when the variable is missing or blank.
 *
 * There is intentionally NO hostname-detection logic and NO hardcoded fallback URL.
 * The caller (TabTestChatbot) is responsible for rendering an error UI when null is returned.
 */
describe('getChatWidgetUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns the configured URL when NEXT_PUBLIC_CHAT_WIDGET_URL is set', () => {
    process.env.NEXT_PUBLIC_CHAT_WIDGET_URL = 'https://widget.intern2026.zodinet.tech';

    expect(getChatWidgetUrl()).toBe('https://widget.intern2026.zodinet.tech');
  });

  it('returns null when NEXT_PUBLIC_CHAT_WIDGET_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_CHAT_WIDGET_URL;

    expect(getChatWidgetUrl()).toBeNull();
  });

  it('returns null when NEXT_PUBLIC_CHAT_WIDGET_URL is an empty string', () => {
    process.env.NEXT_PUBLIC_CHAT_WIDGET_URL = '';

    expect(getChatWidgetUrl()).toBeNull();
  });

  it('returns null when NEXT_PUBLIC_CHAT_WIDGET_URL is only whitespace', () => {
    process.env.NEXT_PUBLIC_CHAT_WIDGET_URL = '   ';

    expect(getChatWidgetUrl()).toBeNull();
  });

  it('trims surrounding whitespace from the configured URL', () => {
    process.env.NEXT_PUBLIC_CHAT_WIDGET_URL = '  https://widget.example.com  ';

    expect(getChatWidgetUrl()).toBe('https://widget.example.com');
  });

  it('works correctly with a localhost URL for local development', () => {
    process.env.NEXT_PUBLIC_CHAT_WIDGET_URL = 'http://localhost:5173';

    expect(getChatWidgetUrl()).toBe('http://localhost:5173');
  });
});
