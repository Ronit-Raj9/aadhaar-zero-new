'use client';

import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  Share2,
  Eye,
  Lock,
  Zap,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      credential_issued: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      verification_request: <Clock className="w-5 h-5 text-blue-600" />,
      proof_shared: <Share2 className="w-5 h-5 text-purple-600" />,
      credential_viewed: <Eye className="w-5 h-5 text-gray-600" />,
      credential_revoked: <Lock className="w-5 h-5 text-red-600" />,
      blockchain_confirmed: <Zap className="w-5 h-5 text-amber-600" />,
      document_uploaded: <FileText className="w-5 h-5 text-blue-600" />,
      liveness_verified: <TrendingUp className="w-5 h-5 text-green-600" />,
    };
    return icons[type] || <Clock className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'text-green-600 dark:text-green-400',
      pending: 'text-amber-600 dark:text-amber-400',
      approved: 'text-blue-600 dark:text-blue-400',
      failed: 'text-red-600 dark:text-red-400',
    };
    return colors[status] || 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <Card key={activity.id} className="p-4 border-border">
          <div className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-full bg-muted">{getActivityIcon(activity.type)}</div>
              {index < activities.length - 1 && (
                <div className="w-1 h-12 bg-border mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1 pb-2">
              <div className="flex justify-between items-start gap-4 mb-1">
                <p className="font-medium">{activity.description}</p>
                <span
                  className={`text-xs font-semibold uppercase whitespace-nowrap ${getStatusColor(
                    activity.status
                  )}`}
                >
                  {activity.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
