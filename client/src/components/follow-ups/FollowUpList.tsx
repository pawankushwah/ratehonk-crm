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
        {showAddButton && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-Up
          </Button>
        )}
        <div className="text-xs text-gray-400 text-center py-4">
          Loading follow-ups...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {showAddButton && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-Up
          </Button>
        )}

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
        <Link href="/follow-ups">
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            See More
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <CreateFollowUpDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}

