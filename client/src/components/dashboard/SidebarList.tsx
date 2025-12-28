import { ChevronRight, X, FileText, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { FollowUpList } from "@/components/follow-ups/FollowUpList";
import { format } from "date-fns";

interface SidebarListsProps {
  followUpsArray: any[];
  customersArray: any[];
  invoicesArray: any[];
  contactsArray: any[];
  consultationFormsArray?: any[];
  paymentsArray?: any[];
  canViewFollowUps?: boolean;
  canViewCustomers?: boolean;
  canViewInvoices?: boolean;
  canViewContacts?: boolean;
  canViewConsultationForms?: boolean;
  canViewPayments?: boolean;
}

export function SidebarLists({
  followUpsArray,
  customersArray,
  invoicesArray,
  contactsArray,
  consultationFormsArray = [],
  paymentsArray = [],
  canViewFollowUps = true,
  canViewCustomers = true,
  canViewInvoices = true,
  canViewContacts = true,
  canViewConsultationForms = true,
  canViewPayments = true,
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Follow Ups
              </h3>
              <Link href="/follow-ups">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  See more
                </button>
              </Link>
            </div>
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
        {canViewInvoices && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoices</h3>
            <div className="space-y-2">
              {invoicesArray.length > 0 ? (
                invoicesArray.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                      {item.customerName
                        ? item.customerName.charAt(0).toUpperCase()
                        : item.invoiceNumber
                        ? item.invoiceNumber.charAt(0).toUpperCase()
                        : "I"}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">
                        {item.invoiceNumber || `Invoice #${item.id}`}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.customerName || "No customer"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No invoices</p>
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
        {canViewConsultationForms && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Consultation Forms</h3>
              <Link href="/consultation-forms">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  See more
                </button>
              </Link>
            </div>
            <div className="space-y-2">
              {consultationFormsArray.length > 0 ? (
                consultationFormsArray.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {item.customerName || "Unknown Customer"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.formType === "payment" ? "Payment Form" : "Consultation Form"} • {format(new Date(item.sentAt || item.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No forms sent</p>
              )}
            </div>
          </div>
        )}
        {canViewPayments && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Payments</h3>
              <Link href="/payments">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  See more
                </button>
              </Link>
            </div>
            <div className="space-y-2">
              {paymentsArray.length > 0 ? (
                paymentsArray.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {item.customerName || "Unknown Customer"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Payment Form • {format(new Date(item.sentAt || item.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No payment forms sent</p>
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
