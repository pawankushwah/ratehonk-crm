import React, { useState } from "react";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profit & Loss */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700">PROFIT & LOSS</h3>
          <p className="text-xl font-bold mt-1 text-gray-800">$5,000</p>
          <p className="text-xs text-gray-500 mb-2">
            Net income for this month
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Income</p>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-green-500 rounded w-[70%]"></div>
              </div>
              <p className="text-xs text-right text-gray-500">$24,000</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Expenses</p>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-blue-400 rounded w-[55%]"></div>
              </div>
              <p className="text-xs text-right text-gray-500">$19,000</p>
            </div>
          </div>
        </div>

        {/* Expenses (Donut Style with Divs) */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700">EXPENSES</h3>
          <p className="text-xl font-bold mt-1 text-gray-800">$19,000</p>
          <p className="text-xs text-gray-500 mb-2">Business spending</p>
          <div className="relative w-32 h-32 mx-auto">
            <div className="w-full h-full rounded-full border-[10px] border-blue-400 border-t-green-400 border-r-yellow-400 border-b-red-400 rotate-[45deg]"></div>
            <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Cash Flow (Bar Chart Style) */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700">CASH FLOW</h3>
          <p className="text-xl font-bold mt-1 text-gray-800">$16,000</p>
          <p className="text-xs text-gray-500 mb-2">Current cash balance</p>
          <div className="flex items-end justify-between h-28 mt-4">
            {[60, 80, 50, 70, 30].map((h, idx) => (
              <div
                key={idx}
                className="w-6 bg-green-400 rounded-t"
                style={{ height: `${h}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700">INVOICES</h3>
          <p className="text-xs text-gray-500 mb-2">Upcoming payments</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <div
                className="w-full h-2 bg-red-400 rounded"
                style={{ width: "40%" }}
              ></div>
              <p className="text-xs text-right text-gray-500">$1,525</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Not Due Yet</p>
              <div
                className="w-full h-2 bg-orange-400 rounded"
                style={{ width: "60%" }}
              ></div>
              <p className="text-xs text-right text-gray-500">$3,756</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <div
                className="w-full h-2 bg-green-500 rounded"
                style={{ width: "70%" }}
              ></div>
              <p className="text-xs text-right text-gray-500">$2,062</p>
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700">BANK ACCOUNTS</h3>
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Checking</span>
              <span className="text-green-600 font-semibold">$12,435</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Credit Card</span>
              <span className="text-red-500 font-semibold">- $3,435</span>
            </div>
          </div>
        </div>

        {/* Sales (Fake Line Graph with divs) */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700">SALES</h3>
          <p className="text-xl font-bold mt-1 text-gray-800">$3.5K</p>
          <p className="text-xs text-gray-500 mb-2">Total profit</p>
          <div className="relative w-full h-24">
            <svg
              className="absolute top-0 left-0 w-full h-full"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                points="0,30 20,20 40,25 60,15 80,10 100,5"
              />
            </svg>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Q1</span>
            <span>Q2</span>
            <span>Q3</span>
            <span>Q4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
