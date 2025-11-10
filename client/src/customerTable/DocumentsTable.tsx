import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ChevronDown, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function DocumentsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false); // Modal state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    notes: "",
    date: "",
  });

  const pageSize = 5;

  const dummyData = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      status: "Active",
      notes: "Important client",
      date: "2024-09-15",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "9876501234",
      status: "Inactive",
      notes: "Pending follow-up",
      date: "2024-09-18",
    },
    {
      id: 3,
      name: "Mark Johnson",
      email: "mark@example.com",
      phone: "9988776655",
      status: "Pending",
      notes: "Interested in upgrade",
      date: "2024-09-20",
    },
    {
      id: 4,
      name: "Sarah Lee",
      email: "sarah@example.com",
      phone: "9123456780",
      status: "Active",
      notes: "Frequent buyer",
      date: "2024-09-21",
    },
    {
      id: 5,
      name: "Tom Cruise",
      email: "tom@example.com",
      phone: "9988771122",
      status: "Previous",
      notes: "Switched provider",
      date: "2024-09-25",
    },
    {
      id: 6,
      name: "Emily Clark",
      email: "emily@example.com",
      phone: "9876123456",
      status: "Active",
      notes: "Premium customer",
      date: "2024-09-28",
    },
  ];

  const totalPages = Math.ceil(dummyData.length / pageSize);
  const paginatedData = dummyData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "previous":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddActivity = () => {
    console.log("Form Data Submitted:", formData);
    setOpenModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={() => setOpenModal(true)}
          className="bg-[#0E76BC] hover:bg-[#0B5C94] text-white px-4 py-2 rounded-md font-semibold text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 mr-2" />
          Documents
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#EEF2F6] border-b-2">
              <tr>
                <th className="text-left px-6 py-3 text-[#364152] font-medium text-[15px]">
                  <div className="flex items-center space-x-1">
                    <span>Customer Name</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-[#364152] font-medium text-[15px]">
                  Phone
                </th>
                <th className="text-left px-6 py-3 text-[#364152] font-medium text-[15px]">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-[#364152] font-medium text-[15px]">
                  Notes
                </th>
                <th className="text-left px-6 py-3 text-[#364152] font-medium text-[15px]">
                  Date Added
                </th>
                <th className="text-left px-6 py-3 text-[#364152] font-medium text-[15px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-gray-500 text-sm">{item.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{item.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 truncate max-w-xs">
                    {item.notes}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{item.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Trash2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {dummyData.length > 0 && (
            <div className="px-6 py-3 bg-[#EEF2F6] border-t-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, dummyData.length)} of{" "}
                  {dummyData.length} records
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
            Add Documents
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Input
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                placeholder="Enter status"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Enter notes"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAddActivity}
              className="bg-[#0E76BC] hover:bg-[#0B5C94] text-white"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
