import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopItemsCardProps {
  products: Array<{
    id: number;
    name: string;
    sold: number;
  }>;
}

export function TopItemsCard({ products }: TopItemsCardProps) {
  // Find the maximum sold value to calculate relative progress bar widths
  const maxSold = products.length > 0 ? Math.max(...products.map(p => p.sold)) : 1;

  return (
    <Card className="lg:col-span-5 bg-white shadow-sm border border-gray-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#202939] text-base sm:text-lg font-semibold">
          Top Selling Items
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[320px]">
        <div className="space-y-5">
          {products.map((product, index) => {
            const widthPercentage = (product.sold / maxSold) * 100;
            
            return (
              <div key={product.id || index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-gray-400 font-bold w-6 text-xs uppercase">
                    #{index + 1}
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 truncate leading-tight" title={product.name}>
                      {product.name}
                    </span>
                    <div className="flex-1 bg-gray-100 h-2 rounded-full mt-2 overflow-hidden w-full">
                      <div
                        className="bg-[#0A64A0] h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${widthPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-4 min-w-[40px]">
                  <span className="font-bold text-[#202939]">{product.sold}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Units</span>
                </div>
              </div>
            );
          })}
          
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm">No sales data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
