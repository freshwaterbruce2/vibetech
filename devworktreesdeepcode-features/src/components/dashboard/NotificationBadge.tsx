
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNotifications } from "@/context/NotificationsContext";
import NotificationsPanel from "./NotificationsPanel";

const NotificationBadge = () => {
  const { unreadCount } = useNotifications();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className="relative cursor-pointer"
              whileTap={{ scale: 0.95 }}
              onClick={togglePanel}
            >
              <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-aura-text' : 'text-aura-textSecondary'}`} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 10
                    }}
                  >
                    <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center bg-cyan">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You have {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <AnimatePresence>
        {isPanelOpen && (
          <NotificationsPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBadge;
