
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
}

const NotificationBadge = ({ count, onClick }: NotificationBadgeProps) => {
  if (count === 0) {
    return (
      <Bell className="h-5 w-5 text-aura-textSecondary" />
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className="relative cursor-pointer"
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
          >
            <Bell className="h-5 w-5 text-aura-text" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 10
              }}
            >
              <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center bg-cyan">
                {count > 9 ? "9+" : count}
              </Badge>
            </motion.div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>You have {count} new notification{count !== 1 ? 's' : ''}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NotificationBadge;
