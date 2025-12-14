import { ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { FollowUpList } from "@/components/follow-ups/FollowUpList";

interface SidebarListsProps {
  followUpsArray: any[];
  customersArray: any[];
  activitiesArray: any[];
  contactsArray: any[];
  canViewFollowUps?: boolean;
  canViewCustomers?: boolean;
  canViewBookings?: boolean;
  canViewContacts?: boolean;
}

export function SidebarLists({
  followUpsArray,
  customersArray,
  activitiesArray,
  contactsArray,
  canViewFollowUps = true,
  canViewCustomers = true,
  canViewBookings = true,
  canViewContacts = true,
}: SidebarListsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-0 right-0 z-50 text-black py-5 px-1"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <div
        className={`fixed top-0 right-0 z-40 w-64 bg-white border-l border-gray-200 p-4 space-y-6 h-screen overflow-y-auto transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:block ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 left-4 text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        {canViewFollowUps && (
          <div className="mt-10 lg:mt-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Follow Ups
            </h3>
            <FollowUpList limit={5} showAddButton={true} />
          </div>
        )}
        {canViewCustomers && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Customers
            </h3>
            <div className="space-y-2">
              {customersArray.length > 0 ? (
                customersArray.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                      {item.firstName
                        ? item.firstName.charAt(0).toUpperCase()
                        : item.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">
                        {item.firstName
                          ? `${item.firstName} ${item.lastName}`
                          : item.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.email}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No customers</p>
              )}
            </div>
          </div>
        )}
        {canViewBookings && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Bookings</h3>
            <div className="space-y-2">
              {activitiesArray.length > 0 ? (
                activitiesArray.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                      {item.customerName
                        ? item.customerName.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">
                        {item.customerName || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        ₹{item.totalAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No activities</p>
              )}
            </div>
          </div>
        )}
        {canViewContacts && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Contacts</h3>
            <div className="space-y-2">
              {contactsArray.length > 0 ? (
                contactsArray.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                      {item.firstName
                        ? item.firstName.charAt(0).toUpperCase()
                        : item.name?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-medium text-gray-700">
                      {item.firstName
                        ? `${item.firstName} ${item.lastName}`
                        : item.name}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No contacts</p>
              )}
            </div>
          </div>
        )}
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
