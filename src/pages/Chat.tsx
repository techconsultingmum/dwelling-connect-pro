import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  User,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';

export default function Chat() {
  const { user, role } = useAuth();
  const { messages, sendMessage, members, getUserMessages, markMessageAsRead } = useData();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isManager = role === 'manager';

  // For managers: show list of members they've chatted with or can chat with
  // For users: chat directly with manager
  const chatPartnerId = isManager ? selectedChat : 'MGR001';
  const chatMessages = chatPartnerId ? getUserMessages(isManager ? chatPartnerId : user?.memberId || '') : [];

  // Filter messages for the selected conversation
  const conversationMessages = chatMessages.filter(m => 
    (m.senderId === user?.memberId && m.receiverId === chatPartnerId) ||
    (m.senderId === chatPartnerId && m.receiverId === user?.memberId)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatPartnerId) return;

    setIsSending(true);
    await sendMessage({
      senderId: user?.memberId || '',
      senderName: user?.name || '',
      receiverId: chatPartnerId,
      message: newMessage.trim(),
      isRead: false,
    });
    setNewMessage('');
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get unique chat partners for manager
  const chatPartners = isManager 
    ? members.filter(m => m.role === 'user')
    : [];

  const getUnreadCount = (partnerId: string) => {
    return messages.filter(
      m => m.senderId === partnerId && m.receiverId === user?.memberId && !m.isRead
    ).length;
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
              : 'Chat with society management'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
          {/* Chat List (Manager only) */}
          {isManager && (
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Members</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-340px)]">
                  <div className="p-2 space-y-1">
                    {chatPartners.map((partner) => {
                      const unreadCount = getUnreadCount(partner.memberId);
                      const isSelected = selectedChat === partner.memberId;
                      
                      return (
                        <button
                          key={partner.memberId}
                          onClick={() => setSelectedChat(partner.memberId)}
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
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{partner.name}</p>
                            <p className={cn(
                              'text-xs truncate',
                              isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>
                              {partner.flatNo} • Wing {partner.wing}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Chat Window */}
          <Card className={cn(
            'flex flex-col',
            isManager ? 'lg:col-span-3' : 'lg:col-span-4'
          )}>
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b">
              {(isManager && selectedChat) || (!isManager) ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {isManager 
                        ? members.find(m => m.memberId === selectedChat)?.name 
                        : 'Society Manager'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-success text-success" />
                      Online
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Select a member to start chatting</p>
                </div>
              )}
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-420px)] p-4">
                {((isManager && selectedChat) || !isManager) ? (
                  <div className="space-y-4">
                    {conversationMessages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start a conversation!</p>
                      </div>
                    ) : (
                      conversationMessages.map((msg, index) => {
                        const isOwn = msg.senderId === user?.memberId;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex animate-scale-in',
                              isOwn ? 'justify-end' : 'justify-start'
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className={cn(
                              'max-w-[70%]',
                              isOwn ? 'chat-bubble-user' : 'chat-bubble-other'
                            )}>
                              <p>{msg.message}</p>
                              <p className={cn(
                                'text-xs mt-1 opacity-70',
                                isOwn ? 'text-right' : 'text-left'
                              )}>
                                {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
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
                      <p className="text-sm">Choose a member from the list to start chatting</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            {((isManager && selectedChat) || !isManager) && (
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
                    <Send className="w-5 h-5" />
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
