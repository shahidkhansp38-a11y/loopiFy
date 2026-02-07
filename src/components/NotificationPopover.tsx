import { Bell, CheckCheck, MessageSquare, HelpCircle, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';

const typeIcon: Record<string, typeof MessageSquare> = {
  new_question: HelpCircle,
  new_answer: MessageSquare,
  upvote: ThumbsUp,
};

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const Icon = typeIcon[notification.type] || Bell;

  return (
    <button
      onClick={() => onRead(notification.id)}
      className={`w-full text-left p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors rounded-lg ${
        !notification.is_read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        {notification.message && (
          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.is_read && (
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </button>
  );
}

interface NotificationPopoverProps {
  children: React.ReactNode;
}

export default function NotificationPopover({ children }: NotificationPopoverProps) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
