import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { FollowUpCard } from "./FollowUpCard";
import { CreateFollowUpDialog } from "./CreateFollowUpDialog";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface FollowUpListProps {
  limit?: number;
  showAddButton?: boolean;
}

export function FollowUpList({
  limit = 10,
  showAddButton = true,
}: FollowUpListProps) {
  const { tenant, user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: followUpsData, isLoading } = useQuery({
    queryKey: [
      `/api/tenants/${tenant?.id}/general-follow-ups`,
      { excludeStatus: "completed", limit, sort: "asc" },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        excludeStatus: "completed", // Exclude completed follow-ups
        limit: limit.toString(),
        sort: "asc",
      });

      const response = await fetch(
        `/api/tenants/${tenant?.id}/general-follow-ups?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch follow-ups");
      return response.json();
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const followUps = followUpsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-400 text-center py-4">
          Loading follow-ups...
        </div>
        {showAddButton && (
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => setCreateDialogOpen(true)}
              title="Add Follow-Up"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {followUps.length > 0 ? (
          <div className="space-y-2">
            {followUps.map((followUp: any) => (
              <FollowUpCard key={followUp.id} followUp={followUp} />
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-4">
            No follow-ups
          </div>
        )}
        {showAddButton && (
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => setCreateDialogOpen(true)}
              title="Add Follow-Up"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <CreateFollowUpDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}

