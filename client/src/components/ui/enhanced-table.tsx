import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface EnhancedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  searchTerm?: string;
  onSearch?: (term: string) => void;
  className?: string;
  showPagination?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  isLoading?: boolean;
  externalSort?: {
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (columnKey: string) => void;
  };
}

export function EnhancedTable<T extends Record<string, any>>({
  data,
  columns,
  searchTerm = "",
  className,
  showPagination = true,
  pageSize = 10,
  emptyMessage = "No data available",
  isLoading = false,
  externalSort,
}: EnhancedTableProps<T>) {
  const [internalSortColumn, setInternalSortColumn] = useState<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);

  // Use external sort if provided, otherwise use internal sort
  const sortColumn = externalSort?.sortColumn ?? internalSortColumn;
  const sortDirection = externalSort?.sortDirection ?? internalSortDirection;

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortDirection === 'asc' ? result : -result;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return sortDirection === 'asc' ? result : -result;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        const result = aValue.getTime() - bValue.getTime();
        return sortDirection === 'asc' ? result : -result;
      }

      // Handle date strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          const result = aDate.getTime() - bDate.getTime();
          return sortDirection === 'asc' ? result : -result;
        }
      }

      // Fallback to string comparison
      const result = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, showPagination]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (externalSort) {
      // Use external sort handler
      externalSort.onSort(columnKey);
    } else {
      // Use internal sort state
      if (internalSortColumn === columnKey) {
        setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortColumn(columnKey);
        setInternalSortDirection('asc');
      }
    }
  };

  // Reset to first page when data changes
  useMemo(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  // Get value from nested object path
  const getValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-white rounded-2xl overflow-hidden">
        <Table className="">
          <TableHeader className="bg-[#EEF2F6] border-b-2 ">
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key as string}
                  className={cn(
                    "font-medium",
                    column.sortable && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key as string)}
                >
                  <div className="flex items-center space-x-2  text-[#364152] font-[500] text-[15px] ">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key as string)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 bg-white">
                  <div className="text-gray-500 dark:text-gray-400">
                    {emptyMessage}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {columns.map((column) => {
                    const value = getValue(row, column.key as string);
                    return (
                      <TableCell key={column.key as string} className={column.className}>
                        {column.render ? column.render(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && sortedData.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing{" "}
              <span className="font-medium">
                {Math.min((currentPage - 1) * itemsPerPage + 1, sortedData.length)}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, sortedData.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium">{sortedData.length}</span>{" "}
              results
            </p>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={!hasPreviousPage}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={!hasNextPage}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}