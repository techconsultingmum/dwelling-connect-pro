import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// ---- Mocks ------------------------------------------------------------------

type Partner = { user_id: string; name: string; flat_no: string; role: 'manager' | 'user' };

const state: {
  currentUser: { userId: string } | null;
  rpcImpl: (name: string) => Promise<{ data: Partner[] | null; error: { message: string } | null }>;
} = {
  currentUser: { userId: 'me-id' },
  rpcImpl: async () => ({ data: [], error: null }),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: state.currentUser, role: 'user' }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const messagesQuery = {
    select: () => messagesQuery,
    eq: () => messagesQuery,
    then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
      resolve({ data: [], error: null }),
  };
  return {
    supabase: {
      rpc: (name: string) => state.rpcImpl(name),
      from: (_table: string) => messagesQuery,
      channel: () => {
        const ch = {
          on: () => ch,
          subscribe: () => ch,
        };
        return ch;
      },
      removeChannel: () => {},
    },
  };
});

// Import after mocks are set up.
import { useChatPartners } from '@/hooks/useRealtimeChat';

beforeEach(() => {
  state.currentUser = { userId: 'me-id' };
  state.rpcImpl = async () => ({ data: [], error: null });
});

describe('useChatPartners visibility rules', () => {
  it('surfaces every non-self member returned for a manager caller', async () => {
    const managerView: Partner[] = [
      { user_id: 'u1', name: 'Amit', flat_no: 'A-101', role: 'user' },
      { user_id: 'u2', name: 'Priya', flat_no: 'B-202', role: 'user' },
      { user_id: 'm2', name: 'Other Manager', flat_no: '', role: 'manager' },
    ];
    state.rpcImpl = async (name) => {
      expect(name).toBe('get_chat_partners');
      return { data: managerView, error: null };
    };

    const { result } = renderHook(() => useChatPartners());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.partners.map((p) => p.userId).sort()).toEqual(['m2', 'u1', 'u2']);
    // The caller must never appear in their own contact list.
    expect(result.current.partners.some((p) => p.userId === 'me-id')).toBe(false);
  });

  it('exposes only manager profiles to a regular member caller', async () => {
    const memberView: Partner[] = [
      { user_id: 'mgr-1', name: 'Manager One', flat_no: 'M-1', role: 'manager' },
    ];
    state.rpcImpl = async () => ({ data: memberView, error: null });

    const { result } = renderHook(() => useChatPartners());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.partners).toHaveLength(1);
    expect(result.current.partners[0].role).toBe('manager');
    expect(result.current.partners.every((p) => p.role === 'manager')).toBe(true);
  });

  it('reports an error and allows retry when the RPC fails', async () => {
    let calls = 0;
    state.rpcImpl = async () => {
      calls += 1;
      if (calls === 1) return { data: null, error: { message: 'permission denied' } };
      return {
        data: [{ user_id: 'mgr-1', name: 'Manager', flat_no: '', role: 'manager' }],
        error: null,
      };
    };

    const { result } = renderHook(() => useChatPartners());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('permission denied');
    expect(result.current.partners).toEqual([]);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.partners).toHaveLength(1);
  });
});
