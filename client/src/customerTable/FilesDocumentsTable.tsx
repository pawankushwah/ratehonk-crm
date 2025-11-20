import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
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

  // Upload file handlers
  const handleGetUploadParameters = async (file: { name: string; type: string; size: number }) => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    
    // Include filename in URL as query parameter for PUT handler
    const uploadUrl = data.uploadURL || data.uploadUrl || "/api/objects/store";
    const urlWithFilename = `${uploadUrl}?filename=${encodeURIComponent(file.name)}`;
    
    return {
      method: "PUT" as const,
      url: urlWithFilename,
      headers: token ? {
        "Authorization": `Bearer ${token}`,
        "Content-Type": file.type || "application/octet-stream",
      } : {
        "Content-Type": file.type || "application/octet-stream",
      },
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const file = uploadedFile.data as File;
      
      // Determine file type based on MIME type
      let fileType = "file";
      if (file.type.startsWith("image/")) fileType = "image";
      else if (file.type.startsWith("video/")) fileType = "video";
      else if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text")) fileType = "document";

      // Get the object path from the upload response
      // The ObjectUploader should return the response from /api/objects/store
      const objectPath = (uploadedFile as any).response?.objectPath || 
                        (uploadedFile as any).response?.publicUrl ||
                        (uploadedFile as any).uploadURL ||
                        uploadedFile.id ||
                        `/uploads/${Date.now()}-${file.name}`;

      console.log("📁 Upload complete, saving file metadata:", {
        fileName: file.name,
        fileSize: file.size,
        fileType,
        objectPath,
      });

      try {
        await apiRequest(
          "POST",
          "/api/customer-files",
          {
            customerId: parseInt(customerId),
            tenantId: tenant?.id,
            fileName: file.name,
            fileType,
            mimeType: file.type,
            fileSize: file.size,
            objectPath: objectPath,
            uploadedBy: user?.id,
            isPublic: false,
          }
        );

        queryClient.invalidateQueries({ queryKey: ["customer-files", customerId, tenant?.id] });
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } catch (error) {
        console.error("Error saving file metadata:", error);
        toast({
          title: "Error",
          description: "Failed to save file metadata",
          variant: "destructive",
        });
      }
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
      window.open(file.objectPath, "_blank");
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
      window.open(file.objectPath, "_blank");
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
            <ObjectUploader
              maxNumberOfFiles={10}
              maxFileSize={50 * 1024 * 1024} // 50MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </ObjectUploader>
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
            <ObjectUploader
              maxNumberOfFiles={10}
              maxFileSize={50 * 1024 * 1024}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload First File
            </ObjectUploader>
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
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {file.fileName}
                            </p>
                            <p className="text-sm text-gray-500">{file.mimeType}</p>
                          </div>
                        </div>
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
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                        {file.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreview(file)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
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
    </Card>
  );
}