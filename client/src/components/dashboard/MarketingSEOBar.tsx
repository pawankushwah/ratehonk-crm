import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MarketingSEOBar() {
  return (
    <Card className="lg:col-span-12 bg-white shadow-md rounded-xl">
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-[#000000] font-medium mb-3 text-base sm:text-lg md:text-xl">
          Marketing & SEO
        </h2>
        <div className="relative h-40 sm:h-48 md:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { month: "Jan", value: 80 },
                { month: "Feb", value: 120 },
                { month: "Mar", value: 95 },
                { month: "Apr", value: 125 },
                { month: "May", value: 60 },
                { month: "Jun", value: 110 },
                { month: "Jul", value: 85 },
                { month: "Aug", value: 120 },
                { month: "Sep", value: 100 },
                { month: "Oct", value: 130 },
                { month: "Nov", value: 60 },
                { month: "Dec", value: 105 },
              ]}
              margin={{ top: 0, right: 0, left: 0, bottom: 20 }}
            >
              <YAxis
                domain={[0, "dataMax + 20"]}
                tickFormatter={(t) => `${t}K`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 10 }}
              />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                barSize={28}
                fill="#008080"
                className="transition-all hover:fill-[#007070]"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
