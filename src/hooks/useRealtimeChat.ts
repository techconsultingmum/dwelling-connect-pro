import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { sanitizeText } from '@/lib/validation';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_flat?: string;
}

export function useRealtimeChat(partnerId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!user?.userId || !partnerId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        message,
        is_read,
        created_at
      `)
      .or(`and(sender_id.eq.${user.userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.userId})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    
    setIsLoading(false);
  }, [user?.userId, partnerId]);

  // Subscribe to realtime updates - scope the channel to this conversation
  useEffect(() => {
    if (!user?.userId) {
      setIsLoading(false);
      return;
    }

    fetchMessages();

    // Only subscribe if we have a valid partner
    if (!partnerId) return;

    const channelName = `messages-${user.userId}-${partnerId}`;
    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.userId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Defense-in-depth: only accept messages that belong to *this* 1:1 conversation.
          if (
            newMessage.sender_id === partnerId &&
            newMessage.receiver_id === user.userId
          ) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.userId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (
            newMessage.receiver_id === partnerId &&
            newMessage.sender_id === user.userId
          ) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.userId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          // Only apply updates for messages in the currently-open conversation.
          const belongsToConversation =
            (updatedMessage.sender_id === user.userId && updatedMessage.receiver_id === partnerId) ||
            (updatedMessage.sender_id === partnerId && updatedMessage.receiver_id === user.userId);
          if (!belongsToConversation) return;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.userId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          const belongsToConversation =
            (updatedMessage.sender_id === user.userId && updatedMessage.receiver_id === partnerId) ||
            (updatedMessage.sender_id === partnerId && updatedMessage.receiver_id === user.userId);
          if (!belongsToConversation) return;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.userId, partnerId, fetchMessages]);

  // Send a message
  const sendMessage = useCallback(async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!user?.userId || !partnerId || !trimmedMessage) return false;

    // Sanitize message content for defense-in-depth against XSS
    const sanitizedMessage = sanitizeText(trimmedMessage);

    const { error } = await supabase.from('messages').insert({
      sender_id: user.userId,
      receiver_id: partnerId,
      message: sanitizedMessage,
    });

    return !error;
  }, [user?.userId, partnerId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!user?.userId || !partnerId) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.userId)
      .eq('sender_id', partnerId)
      .eq('is_read', false);
  }, [user?.userId, partnerId]);

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}

// Hook for getting all chat partners with unread counts
export function useChatPartners() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<{ userId: string; name: string; flatNo: string; unreadCount: number; role?: 'manager' | 'user' }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    if (!user?.userId) {
      setPartners([]);
      setIsLoading(false);
      return;
    }
      setIsLoading(true);
      setError(null);

      // Use SECURITY DEFINER RPC: managers see all members, members see managers.
      const { data: profiles, error: profileError } = await supabase
        .rpc('get_chat_partners');

      if (profileError || !profiles) {
        setError(profileError?.message || 'Unable to load contacts');
        setPartners([]);
        setIsLoading(false);
        return;
      }

      // Get unread counts
      const { data: unreadMessages, error: unreadError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.userId)
        .eq('is_read', false);

      const unreadCounts = new Map<string, number>();
      if (!unreadError && unreadMessages) {
        unreadMessages.forEach((msg) => {
          const count = unreadCounts.get(msg.sender_id) || 0;
          unreadCounts.set(msg.sender_id, count + 1);
        });
      }

      const partnerList = (profiles as Array<{ user_id: string; name: string | null; flat_no: string | null; role: 'manager' | 'user' }>).map((profile) => ({
        userId: profile.user_id,
        name: profile.name || 'Unknown',
        flatNo: profile.flat_no || '',
        unreadCount: unreadCounts.get(profile.user_id) || 0,
        role: profile.role,
      }));

      setPartners(partnerList);
      setIsLoading(false);
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;
    fetchPartners();

    // Subscribe to message changes for unread count updates
    const channel = supabase
      .channel('unread-counts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.userId}`,
        },
        () => {
          fetchPartners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.userId, fetchPartners]);

  return { partners, isLoading, error, refetch: fetchPartners };
}