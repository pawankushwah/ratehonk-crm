import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ChevronDown, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EmailTableProps {
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export default function EmailTable({ customerId, customerEmail, customerPhone, customerName }: EmailTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    to: customerEmail || "",
    subject: "",
    message: "",
    priority: "normal",
    attachments: [],
  });
  const pageSize = 5;

  // Mock email data - replace with actual API call later
  const emailData = [
    {
      id: 1,
      to: customerEmail || "customer@example.com",
      subject: "Welcome to RateHonk Travel Services",
      status: "Sent",
      date: "2024-08-10",
      type: "Welcome",
      opened: true,
    },
    {
      id: 2,
      to: customerEmail || "customer@example.com", 
      subject: "Your Travel Package Quote",
      status: "Delivered",
      date: "2024-08-08",
      type: "Quote",
      opened: true,
    },
    {
      id: 3,
      to: customerEmail || "customer@example.com",
      subject: "Follow-up on Travel Inquiry",
      status: "Draft",
      date: "2024-08-05",
      type: "Follow-up",
      opened: false,
    },
  ];

  const totalPages = Math.ceil(emailData.length / pageSize);
  const paginatedData = emailData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "sent":
        return "bg-green-100 text-green-700";
      case "delivered":
        return "bg-blue-100 text-blue-700";
      case "opened":
        return "bg-purple-100 text-purple-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendEmail = () => {
    console.log("Email Data Submitted:", formData);
    // Here you would typically send the email via API
    setOpenModal(false);
    // Reset form
    setFormData({
      to: customerEmail || "",
      subject: "",
      message: "",
      priority: "normal",
      attachments: [],
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Email History</h3>
            <Button
              onClick={() => setOpenModal(true)}
              className="bg-[#0E76BC] hover:bg-[#0B5C94] text-white px-4 py-2 rounded-md font-semibold text-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Send Email
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
                    <span>Subject</span>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </th>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px]">
                  Status
                </th>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px]">
                  Type
                </th>
                <th className="text-left px-2 sm:px-6 py-3 text-[#364152] font-medium text-xs sm:text-[15px] hidden md:table-cell">
                  Opened
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
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-6 py-3 sm:py-4">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{item.subject}</div>
                    <div className="text-gray-500 text-xs sm:text-sm">{item.to}</div>
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
                  <td className="px-2 sm:px-6 py-3 sm:py-4 text-gray-900 text-sm sm:text-base">{item.type}</td>
                  <td className="px-2 sm:px-6 py-3 sm:py-4 text-gray-900 text-sm sm:text-base hidden md:table-cell">
                    {item.opened ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-6 py-3 sm:py-4 text-gray-900 text-xs sm:text-sm">{item.date}</td>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {emailData.length > 0 && (
          <div className="px-3 sm:px-6 py-3 bg-[#EEF2F6] border-t-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, emailData.length)} of{" "}
                {emailData.length} records
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

      {/* Send Email Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Send Email to {customerName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>To</Label>
              <Input
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                placeholder="Enter email address"
                type="email"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter email subject"
              />
            </div>
            <div>
              <Label>Priority</Label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Type your email message here..."
                rows={6}
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
              onClick={handleSendEmail}
              className="bg-[#0E76BC] hover:bg-[#0B5C94] text-white"
            >
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}