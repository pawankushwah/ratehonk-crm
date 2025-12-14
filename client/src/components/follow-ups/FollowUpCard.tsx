import { isToday, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { FollowUpDetailsPopover } from "./FollowUpDetailsPopover";

interface FollowUpCardProps {
  followUp: {
    id: number;
    title: string;
    description?: string;
    assignedUserId?: number;
    assignedUserName?: string;
    assignedUserEmail?: string;
    createdByName?: string;
    priority: string;
    status: string;
    dueDate: string;
    relatedTableName?: string;
    relatedTableId?: number;
    tags?: string[];
    previousAssignedUserName?: string;
  };
  onUpdate?: () => void;
}

export function FollowUpCard({ followUp, onUpdate }: FollowUpCardProps) {
  const priorityBadgeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    low: "secondary",
    medium: "default",
    high: "outline",
    urgent: "destructive",
  };

  const dueDateObj = new Date(followUp.dueDate);
  const isOverdue = isPast(dueDateObj) && followUp.status !== "completed";
  const isDueToday = isToday(dueDateObj);

  return (
    <>
      <FollowUpDetailsPopover followUp={followUp}>
        <div
          className={`p-3 rounded-lg border cursor-pointer ${
            isOverdue
              ? "border-red-300 bg-red-50"
              : isDueToday
              ? "border-orange-300 bg-orange-50"
              : "border-gray-200 bg-white"
          } hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm text-gray-900 flex-1 truncate">
              {followUp.title}
            </h4>
            <Badge
              variant={priorityBadgeColors[followUp.priority] || "default"}
              className="text-xs shrink-0"
            >
              {followUp.priority}
            </Badge>
          </div>
        </div>
      </FollowUpDetailsPopover>
    </>
  );
}

