import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Filter,
  Search,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  File,
  Image,
  Video,
  FileText,
  Upload,
  Folder,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { CustomerFile } from "@shared/schema";

interface FilesDocumentsTableProps {
  customerId: string;
}

const fileTypeIcons = {
  image: Image,
  video: Video,
  document: FileText,
  file: File,
};

const fileTypeColors = {
  image: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  video: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  document: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  file: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

const fileTypeFilters = [
  { value: "all", label: "All Files", icon: File },
  { value: "image", label: "Images", icon: Image },
  { value: "video", label: "Videos", icon: Video },
  { value: "document", label: "Documents", icon: FileText },
  { value: "file", label: "Other Files", icon: File },
];

export default function FilesDocumentsTable({ customerId }: FilesDocumentsTableProps) {
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Array<{file: File; fileName: string; description: string}>>([]);
  const [editingFile, setEditingFile] = useState<{id: number; fileName: string; description: string} | null>(null);

  // Query to fetch customer files
  const { data: filesData, isLoading } = useQuery({
    queryKey: ["customer-files", customerId, tenant?.id],
    enabled: !!customerId && !!tenant?.id,
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/customer-files?customerId=${customerId}&tenantId=${tenant?.id}`
      );
      const data = await response.json();
      return data.success ? data.files : [];
    },
  });

  const files = filesData || [];

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, fileName, description }: { fileId: number; fileName: string; description: string }) => {
      await apiRequest(
        "PUT",
        `/api/customer-files/${fileId}`,
        {
          tenantId: tenant?.id,
          fileName,
          description: description || null,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-files", customerId, tenant?.id] });
      setEditingFile(null);
      toast({
        title: "Success",
        description: "File updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update file",
        variant: "destructive",
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest(
        "DELETE",
        `/api/customer-files/${fileId}?tenantId=${tenant?.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-files", customerId, tenant?.id] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  // Handle file selection - open dialog for name/description
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log("📎 No files selected");
      return;
    }

    // Create pending files with default names
    const newPendingFiles = Array.from(files).map(file => ({
      file,
      fileName: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for display name
      description: "",
    }));

    setPendingFiles(newPendingFiles);
    setUploadDialogOpen(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload file handler using the same flow as email attachments
  const handleFileUpload = async () => {
    if (pendingFiles.length === 0) {
      return;
    }

    console.log(`📎 Uploading ${pendingFiles.length} file(s)...`);
    setIsUploading(true);
    setUploadDialogOpen(false);
    
    try {
      const formData = new FormData();
      pendingFiles.forEach((pendingFile) => {
        formData.append('attachments', pendingFile.file);
      });

      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const response = await fetch('/api/email-attachments/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload files' }));
        throw new Error(errorData.message || 'Failed to upload files');
      }

      const result = await response.json();
      const uploadedFiles = result.files || [];
      
      if (uploadedFiles.length === 0) {
        throw new Error('No files were uploaded');
      }
      
      console.log(`✅ Successfully uploaded ${uploadedFiles.length} file(s):`, uploadedFiles.map(f => f.filename));
      
      // Save each uploaded file to customer-files
      for (let i = 0; i < uploadedFiles.length; i++) {
        const uploadedFile = uploadedFiles[i];
        const pendingFile = pendingFiles[i];
        // Determine file type based on MIME type or filename
        let fileType = "file";
        const mimeType = uploadedFile.mimetype || '';
        const filename = uploadedFile.filename || '';
        
        if (mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename)) {
          fileType = "image";
        } else if (mimeType.startsWith("video/") || /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(filename)) {
          fileType = "video";
        } else if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text") || 
                   /\.(pdf|doc|docx|txt|csv)$/i.test(filename)) {
          fileType = "document";
        }

        try {
          await apiRequest(
            "POST",
            "/api/customer-files",
            {
              customerId: parseInt(customerId),
              tenantId: tenant?.id,
              fileName: pendingFile?.fileName || uploadedFile.filename, // Use custom name if provided
              fileType,
              mimeType: uploadedFile.mimetype || 'application/octet-stream',
              fileSize: uploadedFile.size || 0,
              objectPath: uploadedFile.path,
              uploadedBy: user?.id,
              isPublic: false,
              description: pendingFile?.description || null,
            }
          );
        } catch (error: any) {
          console.error(`Error saving file metadata for ${uploadedFile.filename}:`, error);
          toast({
            title: "Warning",
            description: `File ${uploadedFile.filename} uploaded but failed to save metadata: ${error.message}`,
            variant: "destructive",
          });
        }
      }

      // Clear pending files
      setPendingFiles([]);

      // Also invalidate customer activities to show the new file upload activity
      queryClient.invalidateQueries({ queryKey: ["customer-activities", customerId, tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ["customer-files", customerId, tenant?.id] });
      toast({
        title: "Success",
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Filter files based on search term and file type
  const filteredFiles = files.filter((file: CustomerFile) => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = fileTypeFilter === "all" || file.fileType === fileTypeFilter;
    return matchesSearch && matchesFilter;
  });

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle file download
  const handleDownload = async (file: CustomerFile) => {
    try {
      // Ensure the path is properly formatted - if it's relative, make it absolute
      let fileUrl = file.objectPath;
      if (fileUrl && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        // If it's a relative path, convert to absolute URL
        if (fileUrl.startsWith('/')) {
          fileUrl = `${window.location.origin}${fileUrl}`;
        } else {
          fileUrl = `${window.location.origin}/${fileUrl}`;
        }
      }
      // URL encode the path properly if it contains special characters
      try {
        const url = new URL(fileUrl);
        // Reconstruct with properly encoded pathname
        fileUrl = `${url.protocol}//${url.host}${encodeURI(url.pathname)}${url.search}${url.hash}`;
      } catch (e) {
        // If URL parsing fails, just encode the whole thing
        fileUrl = encodeURI(fileUrl);
      }
      window.open(fileUrl, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  // Handle file preview
  const handlePreview = async (file: CustomerFile) => {
    try {
      // Ensure the path is properly formatted - if it's relative, make it absolute
      let fileUrl = file.objectPath;
      if (fileUrl && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        // If it's a relative path, convert to absolute URL
        if (fileUrl.startsWith('/')) {
          fileUrl = `${window.location.origin}${fileUrl}`;
        } else {
          fileUrl = `${window.location.origin}/${fileUrl}`;
        }
      }
      // URL encode the path properly if it contains special characters
      try {
        const url = new URL(fileUrl);
        // Reconstruct with properly encoded pathname
        fileUrl = `${url.protocol}//${url.host}${encodeURI(url.pathname)}${url.search}${url.hash}`;
      } catch (e) {
        // If URL parsing fails, just encode the whole thing
        fileUrl = encodeURI(fileUrl);
      }
      window.open(fileUrl, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to preview file",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading files...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Files & Documents
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* File Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {fileTypeFilters.find(f => f.value === fileTypeFilter)?.label || "All Files"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {fileTypeFilters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <DropdownMenuItem
                      key={filter.value}
                      onClick={() => setFileTypeFilter(filter.value)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {filter.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov"
                disabled={isUploading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Files"}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">
              {searchTerm || fileTypeFilter !== "all" 
                ? "No files found matching your criteria" 
                : "No files uploaded for this customer"}
            </p>
            <div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload First File"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file: CustomerFile) => {
                  const Icon = fileTypeIcons[file.fileType as keyof typeof fileTypeIcons] || File;
                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        {editingFile?.id === file.id ? (
                          <Input
                            value={editingFile.fileName}
                            onChange={(e) => setEditingFile({ ...editingFile, fileName: e.target.value })}
                            className="w-full"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {file.fileName}
                              </p>
                              <p className="text-sm text-gray-500">{file.mimeType}</p>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={fileTypeColors[file.fileType as keyof typeof fileTypeColors]}>
                          {file.fileType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatFileSize(file.fileSize)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs">
                        {editingFile?.id === file.id ? (
                          <Textarea
                            value={editingFile.description}
                            onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                            className="w-full min-h-[60px]"
                            placeholder="Add description..."
                          />
                        ) : (
                          <span className="truncate block">{file.description || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {editingFile?.id === file.id ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (editingFile) {
                                      updateFileMutation.mutate({
                                        fileId: editingFile.id,
                                        fileName: editingFile.fileName,
                                        description: editingFile.description,
                                      });
                                    }
                                  }}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setEditingFile(null)}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => setEditingFile({ id: file.id, fileName: file.fileName, description: file.description || "" })}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePreview(file)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(file)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              </>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete File</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{file.fileName}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteFileMutation.mutate(file.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {pendingFiles.map((pendingFile, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <File className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">{pendingFile.file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(pendingFile.file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`fileName-${index}`}>File Name *</Label>
                  <Input
                    id={`fileName-${index}`}
                    value={pendingFile.fileName}
                    onChange={(e) => {
                      const newPendingFiles = [...pendingFiles];
                      newPendingFiles[index].fileName = e.target.value;
                      setPendingFiles(newPendingFiles);
                    }}
                    placeholder="e.g., Aadhar Card, PAN Card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={pendingFile.description}
                    onChange={(e) => {
                      const newPendingFiles = [...pendingFiles];
                      newPendingFiles[index].description = e.target.value;
                      setPendingFiles(newPendingFiles);
                    }}
                    placeholder="Add a description for this file..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setPendingFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={isUploading || pendingFiles.some(pf => !pf.fileName.trim())}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}