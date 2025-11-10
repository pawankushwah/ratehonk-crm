import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ChevronDown, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient"; // Assuming this is your API request utility
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CallTableProps {
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export default function CallTable({ customerId, customerEmail, customerPhone, customerName }: CallTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false); // Modal state
  const [formData, setFormData] = useState<any>({
    call_type: "outgoing",
    duration: "",
    status: "completed",
    notes: "",
    date: "",
    customer_name: customerName || "",
    customer_email: customerEmail || "",
    customer_phone: customerPhone || "",
  });
  const pageSize = 5;

  const queryClient = useQueryClient();

  // Fetch call records filtered by customer
  const { data: calls = [], isLoading, error } = useQuery({
    queryKey: [`/api/customers/${customerId}/call-logs`],
    enabled: !!customerId,
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/customers/${customerId}/call-logs`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching call logs:', error);
        return [];
      }
    },
  });

  const totalPages = Math.ceil(calls.length / pageSize);
  const paginatedData = calls.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "missed":
        return "bg-red-100 text-red-700";
      case "voicemail":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Handle input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Create call log mutation
  const createCallLogMutation = useMutation({
    mutationFn: async (callLogData: any) => {
      const response = await apiRequest("POST", "/api/call-logs", {
        customerId: parseInt(customerId || "0"),
        callType: callLogData.call_type,
        status: callLogData.status,
        duration: callLogData.duration ? parseInt(callLogData.duration) * 60 : null, // Convert minutes to seconds
        notes: callLogData.notes,
        startedAt: callLogData.date || new Date().toISOString(),
        endedAt: callLogData.date || new Date().toISOString()
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/call-logs`] });
      setOpenModal(false);
      // Reset form
      setFormData({
        call_type: "outgoing",
        duration: "",
        status: "completed",
        notes: "",
        date: "",
        customer_name: customerName || "",
        customer_email: customerEmail || "",
        customer_phone: customerPhone || "",
      });
    },
    onError: (error: any) => {
      console.error("Error creating call log:", error);
    },
  });

  // Handle adding new call log
  const handleAddCall = () => {
    createCallLogMutation.mutate(formData);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Call Logs</h3>
            <Button
              onClick={() => setOpenModal(true)}
              className="bg-[#0E76BC] hover:bg-[#0B5C94] text-white px-4 py-2 rounded-md font-semibold text-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Call
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#EEF2F6] border-b-2">
              <tr>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px]">
                  <div className="flex items-center space-x-1">
                    <span>Call Type</span>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </th>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px]">
                  Duration
                </th>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px]">
                  Status
                </th>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px] hidden md:table-cell">
                  Notes
                </th>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px]">
                  Date
                </th>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading call logs...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No call logs found for this customer.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-3 sm:py-4">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{item.callType || 'outgoing'}</div>
                      <div className="text-gray-500 text-xs sm:text-sm">{customerPhone}</div>
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-gray-900 text-sm sm:text-base">
                      {item.duration ? `${Math.floor(item.duration / 60)} min` : 'N/A'}
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-gray-900 text-sm sm:text-base truncate max-w-xs hidden md:table-cell">
                      {item.notes || 'No notes'}
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-gray-900 text-xs sm:text-sm">
                      {item.startedAt ? new Date(item.startedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {calls.length > 0 && (
          <div className="px-3 sm:px-6 py-3 bg-[#EEF2F6] border-t-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, calls.length)} of{" "}
                {calls.length} records
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="text-xs sm:text-sm"
                >
                  Previous
                </Button>
                <span className="text-xs sm:text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="text-xs sm:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Log Call with {customerName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Call Type</Label>
              <select
                name="call_type"
                value={formData.call_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="outgoing">Outgoing</option>
                <option value="incoming">Incoming</option>
                <option value="missed">Missed</option>
              </select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 15"
                type="number"
              />
            </div>
            <div>
              <Label>Call Status</Label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="voicemail">Voicemail</option>
              </select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Call summary, outcomes, next steps..."
                rows={4}
              />
            </div>
            <div>
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCall}
              disabled={createCallLogMutation.isPending}
              className="bg-[#0E76BC] hover:bg-[#0B5C94] text-white"
            >
              {createCallLogMutation.isPending ? "Logging..." : "Log Call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}