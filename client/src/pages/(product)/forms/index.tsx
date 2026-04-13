import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  FileText,
  Eye,
  Edit3,
  Table2,
  Clock,
  Loader2,
  List
} from 'lucide-react';
import Button from '@/components/products/Button';
import GlassCard from '@/components/products/GlassCard';
import { getTemplates } from '@/lib/forms';
import { Layout } from '@/components/layout/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button as UIButton } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
  resource_type: string;
  updatedAt: string;
}

const FormsListPage = () => {
  const [, setLocation] = useLocation();
  const isProduction = import.meta.env.PROD;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   setTitle('Form Builder');
  // }, [setTitle]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await getTemplates();
        setTemplates(response || []);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <Layout>
      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-text-main">Custom Forms</h1>
            <p className="text-text-muted">Create and manage custom templates for your data entry</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              icon={List}
              onClick={() => setLocation('/forms/dropdowns')}
              className="bg-white border-slate-200 hover:bg-slate-50"
            >
              Manage Dropdowns
            </Button>
            {!isProduction && (
              // <Button 
              //   icon={Plus} 
              //   onClick={() => navigate('/dashboard/forms/builder')}
              //   className="shadow-xl shadow-primary/20"
              // >
              //   Create New Form
              // </Button>
              <></>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-text-muted/30">
              <FileText size={40} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-text-main">No template found</h3>
              <p className="text-sm text-text-muted">There are no form templates available at the moment.</p>
            </div>
            {!isProduction && (
              // <Button 
              //   icon={Plus} 
              //   onClick={() => navigate('/dashboard/forms/builder')}
              //   className="mt-4"
              // >
              //   Create First Template
              // </Button>
              <></>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="group relative overflow-hidden border-glass-border bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer flex flex-col"
                onClick={() => setLocation(`/forms/builder?id=${template.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl font-bold text-text-main truncate group-hover:text-primary transition-colors">
                      {template.name}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-slate-100 text-text-muted hover:bg-slate-200 transition-colors uppercase text-[10px] tracking-widest font-black shrink-0">
                      {template.resource_type}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-text-muted line-clamp-2 min-h-[40px]">
                    Custom dynamic template for {template.resource_type} tracking.
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4 flex-grow">
                  <div className="flex items-center gap-6 py-3 border-y border-glass-border">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                      <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
                        <Table2 size={14} />
                      </div>
                      Dynamic Fields
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Clock size={14} />
                      </div>
                      {template.updatedAt}
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="relative z-10 flex justify-end gap-2 pt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <UIButton
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/forms/builder?id=${template.id}&tab=preview`);
                          }}
                        >
                          <Eye size={18} />
                        </UIButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Preview Form</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <UIButton
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-text-muted hover:text-secondary hover:bg-secondary/10 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/forms/builder?id=${template.id}`);
                          }}
                        >
                          <Edit3 size={18} />
                        </UIButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Template</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            ))}

            {/* Create New Card */}
            {!isProduction && (
              <></>
              // <button 
              //   onClick={() => setLocation('/forms/builder')}
              //   className="h-full min-h-[280px] rounded-3xl border-2 border-dashed border-glass-border hover:border-primary/50 bg-white/5 hover:bg-primary/5 transition-all group flex flex-col items-center justify-center gap-4 text-text-muted hover:text-primary"
              // >
              //   <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center transition-transform group-hover:scale-110">
              //     <Plus size={32} />
              //   </div>
              //   <span className="text-lg font-bold">New Form Template</span>
              // </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FormsListPage;
