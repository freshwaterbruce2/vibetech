/**
 * StatusIcons
 * Utility functions for status icons
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Loader2, XCircle } from 'lucide-react';

import type { TaskStatus } from '../../../types';

export const getStatusIcon = (status: TaskStatus): React.ReactNode => {
    switch (status) {
        case 'planning':
            return (
                <motion.div animate= {{ rotate: 360 }
    } transition = {{ duration: 2, repeat: Infinity, ease: 'linear' }
}>
    <Loader2 />
    </motion.div>
      );
    case 'in_progress':
return (
    <motion.div animate= {{ rotate: 360 }} transition = {{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
        <Activity />
        </motion.div>
      );
    case 'completed':
return <CheckCircle2 />;
    case 'failed':
return <XCircle />;
    default:
return null;
  }
};
