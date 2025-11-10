import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { invoiceTemplates, InvoiceData } from './invoice-templates';
import { generateInvoicePDF } from './pdf-generator';
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Eye, 
  Check,
  Palette,
  Building2,
  Sparkles,
  Scroll
} from "lucide-react";

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData;
}

const templateIcons = {
  modern: Palette,
  corporate: Building2,
  creative: Sparkles,
  classic: Scroll
};

const templateColors = {
  modern: "border-blue-200 hover:border-blue-400",
  corporate: "border-gray-200 hover:border-gray-400", 
  creative: "border-purple-200 hover:border-purple-400",
  classic: "border-amber-200 hover:border-amber-400"
};

const templateBadgeColors = {
  modern: "bg-blue-100 text-blue-800",
  corporate: "bg-gray-100 text-gray-800",
  creative: "bg-purple-100 text-purple-800", 
  classic: "bg-amber-100 text-amber-800"
};

export default function TemplateSelector({ isOpen, onClose, invoiceData }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select a template before generating the PDF.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateInvoicePDF(invoiceData, selectedTemplate);
      toast({
        title: "PDF Generated",
        description: "Invoice PDF has been generated successfully.",
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    // Show preview in a new tab
    try {
      generateInvoicePDF(invoiceData, templateKey);
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Unable to show preview. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Select Invoice Template</span>
          </DialogTitle>
          <DialogDescription>
            Choose a template design for invoice #{invoiceData.invoiceNumber}. You can preview each template before generating the final PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {Object.entries(invoiceTemplates).map(([key, template]) => {
            const IconComponent = templateIcons[key as keyof typeof templateIcons];
            const isSelected = selectedTemplate === key;
            
            return (
              <Card 
                key={key} 
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 border-blue-500' 
                    : `${templateColors[key as keyof typeof templateColors]}`
                }`}
                onClick={() => setSelectedTemplate(key)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Template Preview Info */}
                    <div className="flex items-center space-x-2">
                      <Badge className={templateBadgeColors[key as keyof typeof templateBadgeColors]}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Badge>
                    </div>

                    {/* Template Features */}
                    <div className="text-sm text-gray-600">
                      {key === 'modern' && (
                        <ul className="space-y-1">
                          <li>• Clean, minimalist design</li>
                          <li>• Blue color scheme</li>
                          <li>• Professional layout</li>
                        </ul>
                      )}
                      {key === 'corporate' && (
                        <ul className="space-y-1">
                          <li>• Traditional business format</li>
                          <li>• Dark header with logo</li>
                          <li>• Formal presentation</li>
                        </ul>
                      )}
                      {key === 'creative' && (
                        <ul className="space-y-1">
                          <li>• Colorful gradient design</li>
                          <li>• Rounded modern elements</li>
                          <li>• Eye-catching layout</li>
                        </ul>
                      )}
                      {key === 'classic' && (
                        <ul className="space-y-1">
                          <li>• Traditional invoice format</li>
                          <li>• Clean borders and tables</li>
                          <li>• Time-tested design</li>
                        </ul>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(key);
                        }}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Selected: <span className="font-medium">
              {selectedTemplate ? invoiceTemplates[selectedTemplate as keyof typeof invoiceTemplates].name : 'None'}
            </span>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleGeneratePDF}
              disabled={!selectedTemplate || isGenerating}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}