import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  Send, 
  User,
  Circle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeChat, useChatPartners } from '@/hooks/useRealtimeChat';

export default function Chat() {
  const { user, role } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isManager = role === 'manager';
  const { partners, isLoading: partnersLoading } = useChatPartners();
  
  // For regular users, find the manager to chat with
  const managerPartner = useMemo(() => {
    if (!isManager && partners.length > 0) {
      // In a real scenario, we'd identify managers differently
      // For now, let the user select from available people
      return partners[0];
    }
    return null;
  }, [isManager, partners]);

  // Auto-select first partner for non-managers or use selected
  const chatPartnerId = isManager ? selectedChat : (selectedChat || managerPartner?.userId || null);
  
  const { messages, isLoading: messagesLoading, sendMessage, markAsRead } = useRealtimeChat(chatPartnerId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (chatPartnerId) {
      markAsRead();
    }
  }, [chatPartnerId, markAsRead, messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatPartnerId) return;

    setIsSending(true);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get partner name for display
  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.userId === partnerId);
    return partner?.name || 'Unknown';
  };

  const getPartnerFlat = (partnerId: string) => {
    const partner = partners.find(p => p.userId === partnerId);
    return partner?.flatNo || '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Chat
          </h1>
          <p className="text-muted-foreground mt-1">
            {isManager 
              ? 'Communicate with society members'
              : 'Chat with society members and management'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
          {/* Chat List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {isManager ? 'Members' : 'Contacts'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-340px)]">
                <div className="p-2 space-y-1">
                  {partnersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))
                  ) : partners.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No contacts available</p>
                    </div>
                  ) : (
                    partners.map((partner) => {
                      const isSelected = chatPartnerId === partner.userId;
                      
                      return (
                        <button
                          key={partner.userId}
                          onClick={() => setSelectedChat(partner.userId)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          )}
                        >
                          <div className="relative">
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              isSelected ? 'bg-primary-foreground/20' : 'bg-primary/10'
                            )}>
                              <span className={cn(
                                'font-semibold',
                                isSelected ? 'text-primary-foreground' : 'text-primary'
                              )}>
                                {partner.name.charAt(0)}
                              </span>
                            </div>
                            {partner.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                                {partner.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{partner.name}</p>
                            <p className={cn(
                              'text-xs truncate',
                              isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>
                              {partner.flatNo || 'No flat assigned'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-3 flex flex-col">
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b">
              {chatPartnerId ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {getPartnerName(chatPartnerId)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-success text-success" />
                      {getPartnerFlat(chatPartnerId) || 'Online'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Select a contact to start chatting</p>
                </div>
              )}
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-420px)] p-4">
                {chatPartnerId ? (
                  <div className="space-y-4">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start a conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isOwn = msg.sender_id === user?.userId;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex animate-scale-in',
                              isOwn ? 'justify-end' : 'justify-start'
                            )}
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <div className={cn(
                              'max-w-[70%] px-4 py-2 rounded-2xl',
                              isOwn 
                                ? 'bg-primary text-primary-foreground rounded-br-md' 
                                : 'bg-muted rounded-bl-md'
                            )}>
                              <p>{msg.message}</p>
                              <p className={cn(
                                'text-xs mt-1 opacity-70',
                                isOwn ? 'text-right' : 'text-left'
                              )}>
                                {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm">Choose a contact from the list to start chatting</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            {chatPartnerId && (
              <div className="p-4 border-t">
                <div className="flex gap-3">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSending}
                  />
                  <Button 
                    variant="gradient" 
                    size="icon"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending}
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}