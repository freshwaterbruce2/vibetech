
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Initialize notifications from localStorage on component mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem("notifications");
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        
        // Convert string dates back to Date objects
        const formattedNotifications = parsedNotifications.map((notification: Notification) => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }));
        
        setNotifications(formattedNotifications);
      } catch (error) {
        console.error("Failed to parse notifications from localStorage:", error);
      }
    }
  }, []);

  // Update localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Add a new notification
  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show a toast for the new notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === "error" ? "destructive" : "default",
    });
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
