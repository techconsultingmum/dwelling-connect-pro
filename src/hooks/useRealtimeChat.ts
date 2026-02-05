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

  // Subscribe to realtime updates
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
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if it's part of current conversation
          if (
            (newMessage.sender_id === user.userId && newMessage.receiver_id === partnerId) ||
            (newMessage.sender_id === partnerId && newMessage.receiver_id === user.userId)
          ) {
            setMessages((prev) => {
              // Prevent duplicates
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
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
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
  const [partners, setPartners] = useState<{ userId: string; name: string; flatNo: string; unreadCount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchPartners = async () => {
      setIsLoading(true);

      // Get all profiles (for manager view)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, flat_no')
        .neq('user_id', user.userId);

      if (profileError || !profiles) {
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

      const partnerList = profiles.map((profile) => ({
        userId: profile.user_id,
        name: profile.name || 'Unknown',
        flatNo: profile.flat_no || '',
        unreadCount: unreadCounts.get(profile.user_id) || 0,
      }));

      setPartners(partnerList);
      setIsLoading(false);
    };

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
        },
        () => {
          fetchPartners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.userId]);

  return { partners, isLoading };
}