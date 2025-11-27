import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend: string;
  previousMonth: number;
  currentMonth: number;
  isPositive: boolean;
  link?: string;
  bgColor?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  previousMonth,
  currentMonth,
  isPositive,
  link,
  bgColor,
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardStyle = {
    backgroundColor: bgColor || "#FFFFFF",
  };
  const content = (
    <Card
      className="relative w-auto  h-[112px] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={cardStyle}
    >
      <CardContent className="p-0 relative z-10">
        <div>
          <p className="text-md font-medium text-[#000000]">{title}</p>
          <div className="flex items-center justify-between gap-2 mt-2">
            <p className="text-4xl font-bold text-gray-900">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <div
              className={`flex items-center text-sm font-semibold ${
                isPositive ? "text-[#000000]" : "text-[#000000"
              }`}
            >
              <span className="mr-1">
                {isPositive ? `+${trend}%` : `${trend}%`}
              </span>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
            </div>
          </div>
        </div>
        {isHovered && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg p-3 z-20 mt-2">
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  Previous Month:
                </span>
                <span className="font-bold text-gray-900">
                  {previousMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  Current Month:
                </span>
                <span className="font-bold text-gray-900">
                  {currentMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="text-gray-600 font-medium">Change:</span>
                <span
                  className={`font-bold text-sm ${
                    currentMonth >= previousMonth
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {currentMonth >= previousMonth ? "+" : ""}
                  {(
                    ((currentMonth - previousMonth) / (previousMonth || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
  return link ? <a href={link}>{content}</a> : content;
}