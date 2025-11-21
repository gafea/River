import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Mock fetch
global.fetch = vi.fn();

// Mock WebAuthn browser functions
vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: vi.fn(),
  startAuthentication: vi.fn(),
}));

// Mock window.alert
global.alert = vi.fn();

const mockedStartRegistration = vi.mocked(startRegistration);
const mockedStartAuthentication = vi.mocked(startAuthentication);

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock initial status check
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({ authenticated: false }),
    });
  });

  it('should initialize with unauthenticated state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const mockOptions = { challenge: 'mock-challenge', rp: { name: 'Test' } };
      const mockAttestationResponse = {
        id: 'mock-id',
        rawId: 'mock-raw-id',
        type: 'public-key' as const,
        response: {
          clientDataJSON: 'mock-client-data',
          attestationObject: 'mock-attestation-object',
        },
        clientExtensionResults: {},
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOptions),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, userId: 'user-123' }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ authenticated: true, userId: 'user-123' }),
        });

      mockedStartRegistration.mockResolvedValue(mockAttestationResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register();
      });

      expect(mockedStartRegistration).toHaveBeenCalledWith(mockOptions);
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register/start', { method: 'POST' });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockAttestationResponse),
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/status');
    });

    it('should handle registration failure', async () => {
      const mockOptions = { challenge: 'mock-challenge' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOptions),
      });

      mockedStartRegistration.mockRejectedValue(new Error('User cancelled'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register();
      });

      expect(global.alert).toHaveBeenCalledWith('Registration failed: User cancelled');
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockOptions = { challenge: 'mock-challenge' };
      const mockAssertionResponse = {
        id: 'mock-id',
        rawId: 'mock-raw-id',
        type: 'public-key' as const,
        response: {
          clientDataJSON: 'mock-client-data',
          authenticatorData: 'mock-authenticator-data',
          signature: 'mock-signature',
          userHandle: undefined,
        },
        clientExtensionResults: {},
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOptions),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, userId: 'user-123' }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ authenticated: true, userId: 'user-123' }),
        });

      mockedStartAuthentication.mockResolvedValue(mockAssertionResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login();
      });

      expect(mockedStartAuthentication).toHaveBeenCalledWith(mockOptions);
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login/start', { method: 'POST' });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockAssertionResponse),
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/status');
    });

    it('should handle login failure', async () => {
      const mockOptions = { challenge: 'mock-challenge' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOptions),
      });

      mockedStartAuthentication.mockRejectedValue(new Error('Authentication failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login();
      });

      expect(global.alert).toHaveBeenCalledWith('Login failed: Authentication failed');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ authenticated: true, userId: 'user-123' }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ authenticated: false }),
        });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 0));

      await act(async () => {
        await result.current.logout();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/status');
    });
  });

  describe('authenticate', () => {
    it('should attempt login then register if login fails', async () => {
      const mockLoginOptions = { challenge: 'login-challenge' };
      const mockRegisterOptions = { challenge: 'register-challenge' };
      const mockAssertionResponse = {
        id: 'cred-id',
        rawId: 'raw-id',
        type: 'public-key' as const,
        response: { clientDataJSON: 'x', authenticatorData: 'y', signature: 'z', userHandle: undefined },
        clientExtensionResults: {},
      };
      const mockAttestationResponse = {
        id: 'cred-id-new',
        rawId: 'raw-id-new',
        type: 'public-key' as const,
        response: { clientDataJSON: 'x', attestationObject: 'ao' },
        clientExtensionResults: {},
      };

      // Initial status unauthenticated
      (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve({ authenticated: false }) });
      // login start
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockLoginOptions) });
      // login finish fails
      (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ error: 'Invalid' }) });
      // register start
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRegisterOptions) });
      // register finish ok
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, userId: 'user-abc' }) });
      // status after register
      (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve({ authenticated: true, userId: 'user-abc' }) });

      mockedStartAuthentication.mockResolvedValue(mockAssertionResponse);
      mockedStartRegistration.mockResolvedValue(mockAttestationResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await result.current.authenticate();
      });

      // Fallback should invoke registration path
      // Ensure both login and register start endpoints were attempted (fallback behavior)
      const fetchCalls = (global.fetch as any).mock.calls.map((c: any[]) => c[0]);
      expect(fetchCalls).toContain('/api/auth/login/start');
      expect(fetchCalls).toContain('/api/auth/register/start');
    });
  });
});