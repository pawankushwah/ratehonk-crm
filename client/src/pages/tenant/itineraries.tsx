import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  MapPin,
  Edit,
  Trash2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Itineraries() {
  const { tenant } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: itineraries = [], isLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/itineraries`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenant!.id}/itineraries`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("DELETE", `/api/tenants/${tenant!.id}/itineraries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/itineraries`] });
      toast({ title: "Itinerary deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const filtered = itineraries.filter(
    (i: any) =>
      !searchTerm ||
      (i.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.customerName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Itineraries</h1>
            <p className="text-gray-500 mt-1">Build and manage travel itineraries for your customers</p>
          </div>
          <Button onClick={() => navigate("/itineraries/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Itinerary
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search itineraries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No itineraries yet</h3>
              <p className="text-gray-500 text-center max-w-sm mb-6">
                Create your first customer itinerary in seconds. Add sections manually or import from quotes and confirmations.
              </p>
              <Button onClick={() => navigate("/itineraries/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Itinerary
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Client Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it: any) => (
                  <TableRow
                    key={it.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/itineraries/${it.id}`)}
                  >
                    <TableCell className="font-medium">{it.title || "Untitled"}</TableCell>
                    <TableCell>
                      {it.customerName ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {it.customerName}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{it.currency || "INR"} {(it.clientPrice || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{it.currency || "INR"} {(it.agentProfit || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/itineraries/${it.id}`)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteMutation.mutate(it.id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </Layout>
  );
}
