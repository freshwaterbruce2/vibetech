
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification, useNotifications } from "@/context/NotificationsContext";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications 
  } = useNotifications();

  const getIconByType = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-12 right-0 w-80 sm:w-96 bg-aura-backgroundLight border border-aura-accent/20 rounded-lg shadow-xl z-50"
    >
      <div className="flex justify-between items-center p-4 border-b border-aura-accent/10">
        <h3 className="font-semibold text-aura-text">Notifications</h3>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-aura-textSecondary"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-aura-textSecondary"
                onClick={clearAllNotifications}
              >
                Clear all
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-aura-textSecondary">
            <Info className="h-12 w-12 mb-2 opacity-20" />
            <p>No notifications yet</p>
            <p className="text-sm mt-1">When you receive notifications, they'll appear here</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`p-4 border-b border-aura-accent/10 cursor-pointer hover:bg-aura-accent/5 transition-colors ${notification.read ? 'opacity-70' : 'bg-aura-accent/10'}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIconByType(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-medium ${notification.read ? 'text-aura-textSecondary' : 'text-aura-text'}`}>
                        {notification.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 -mt-1 -mr-1 text-aura-textSecondary opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-aura-textSecondary mb-1">{notification.message}</p>
                    <p className="text-xs opacity-60">
                      {format(notification.timestamp, 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default NotificationsPanel;
