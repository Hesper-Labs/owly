"use client";

import { Header } from "@/components/layout/header";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  ShieldOff,
  ShieldAlert,
  MessageSquare,
  StickyNote,
  Send,
  Mail,
  Phone,
  MessageCircle,
  Contact,
  Clock,
  User,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn, formatDate, getStatusColor, getChannelLabel } from "@/lib/utils";

// ---------- Types ----------

interface CustomerNoteData {
  id: string;
  customerId: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface ConversationData {
  id: string;
  channel: string;
  customerName: string;
  customerContact: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  tags: string;
  isBlocked: boolean;
  notes: CustomerNoteData[];
  metadata: Record<string, unknown>;
  firstContact: string;
  lastContact: string;
  conversations?: ConversationData[];
  _count: { notes: number };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------- Tag colors ----------

const tagColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-yellow-100 text-yellow-700",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagColors[Math.abs(hash) % tagColors.length];
}

const channelIcons: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  email: Mail,
  phone: Phone,
};

const channelColors: Record<string, string> = {
  whatsapp: "text-green-600 bg-green-50",
  email: "text-blue-600 bg-blue-50",
  phone: "text-purple-600 bg-purple-50",
};

// ---------- Main Page ----------

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [blockedFilter, setBlockedFilter] = useState(false);

  // Detail panel
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    tags: "",
  });

  // Notes
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Add customer modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    tags: "",
  });
  const [addLoading, setAddLoading] = useState(false);

  // Detail tab
  const [detailTab, setDetailTab] = useState<"notes" | "conversations">(
    "notes"
  );

  // ---------- Fetch ----------

  const fetchCustomers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (blockedFilter) params.set("isBlocked", "true");

        const res = await fetch(`/api/customers?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.data ?? []);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, blockedFilter]
  );

  const fetchCustomerDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
        setEditForm({
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          tags: data.tags,
        });
      }
    } catch (error) {
      console.error("Failed to fetch customer detail:", error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ---------- Actions ----------

  const handleSelectCustomer = (customer: CustomerData) => {
    fetchCustomerDetail(customer.id);
    setEditMode(false);
    setNewNote("");
    setDetailTab("notes");
  };

  const handleCloseDetail = () => {
    setSelectedCustomer(null);
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditMode(false);
        fetchCustomerDetail(selectedCustomer.id);
        fetchCustomers(pagination.page);
      }
    } catch (error) {
      console.error("Failed to update customer:", error);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !selectedCustomer.isBlocked }),
      });
      if (res.ok) {
        fetchCustomerDetail(selectedCustomer.id);
        fetchCustomers(pagination.page);
      }
    } catch (error) {
      console.error("Failed to toggle block:", error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
        fetchCustomers(pagination.page);
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCustomer || !newNote.trim() || addingNote) return;
    setAddingNote(true);
    try {
      const res = await fetch(
        `/api/customers/${selectedCustomer.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newNote.trim() }),
        }
      );
      if (res.ok) {
        setNewNote("");
        fetchCustomerDetail(selectedCustomer.id);
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!addForm.name.trim() || addLoading) return;
    setAddLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ name: "", email: "", phone: "", whatsapp: "", tags: "" });
        fetchCustomers();
      }
    } catch (error) {
      console.error("Failed to add customer:", error);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedCustomer) return;
    const currentTags = editForm.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const newTags = currentTags.filter((t) => t !== tagToRemove);
    setEditForm({ ...editForm, tags: newTags.join(", ") });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const input = e.currentTarget;
    const value = input.value.trim();
    if (!value) return;
    const currentTags = editForm.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!currentTags.includes(value)) {
      currentTags.push(value);
      setEditForm({ ...editForm, tags: currentTags.join(", ") });
    }
    input.value = "";
  };

  // ---------- Render helpers ----------

  const renderTags = (tagsStr: string) => {
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              getTagColor(tag)
            )}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header
        title="Customers"
        description="Manage your customer profiles and history"
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-owly-primary text-white rounded-lg hover:bg-owly-primary-dark transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div
          className={cn(
            "flex-1 flex flex-col overflow-hidden",
            selectedCustomer && "hidden lg:flex"
          )}
        >
          {/* Search & Filters */}
          <div className="px-6 py-4 bg-owly-surface border-b border-owly-border">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-owly-text-light" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                />
              </div>
              <button
                onClick={() => setBlockedFilter(!blockedFilter)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
                  blockedFilter
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "border-owly-border text-owly-text-light hover:bg-owly-primary-50"
                )}
              >
                <ShieldAlert className="h-4 w-4" />
                Blocked
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-sm text-owly-text-light">Loading...</div>
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
                <div className="p-4 rounded-full bg-owly-primary-50 mb-4">
                  <Contact className="h-8 w-8 text-owly-primary" />
                </div>
                <p className="font-medium text-owly-text">
                  No customers found
                </p>
                <p className="text-sm text-owly-text-light mt-1">
                  {searchQuery || blockedFilter
                    ? "Try adjusting your search or filters"
                    : "Add your first customer to get started"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-owly-border bg-owly-surface/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-owly-text-light uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-owly-text-light uppercase tracking-wider hidden lg:table-cell">
                      Phone
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-owly-text-light uppercase tracking-wider hidden xl:table-cell">
                      Tags
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-owly-text-light uppercase tracking-wider hidden lg:table-cell">
                      First Contact
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-owly-text-light uppercase tracking-wider hidden md:table-cell">
                      Last Contact
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-owly-border">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={cn(
                        "hover:bg-owly-primary-50/50 cursor-pointer transition-colors",
                        selectedCustomer?.id === customer.id &&
                          "bg-owly-primary-50"
                      )}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-owly-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-owly-primary">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-owly-text truncate">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-owly-text-light truncate">
                          {customer.email || "--"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-owly-text-light">
                          {customer.phone || "--"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {renderTags(customer.tags) || (
                          <span className="text-sm text-owly-text-light">
                            --
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-owly-text-light">
                          {formatDate(customer.firstContact)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-owly-text-light">
                          {formatDate(customer.lastContact)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {customer.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <ShieldAlert className="h-3 w-3" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(customer.id);
                          }}
                          className="p-1.5 text-owly-text-light hover:text-owly-danger hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-owly-surface border-t border-owly-border">
              <span className="text-sm text-owly-text-light">
                Showing{" "}
                {Math.min(
                  (pagination.page - 1) * pagination.limit + 1,
                  pagination.total
                )}{" "}
                to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total} customers
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchCustomers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    pagination.page <= 1
                      ? "text-owly-text-light/40 cursor-not-allowed"
                      : "text-owly-text-light hover:bg-owly-primary-50 hover:text-owly-primary"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from(
                  { length: Math.min(pagination.totalPages, 5) },
                  (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.page >= pagination.totalPages - 2
                    ) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchCustomers(pageNum)}
                        className={cn(
                          "w-8 h-8 text-sm rounded-lg transition-colors",
                          pageNum === pagination.page
                            ? "bg-owly-primary text-white"
                            : "text-owly-text-light hover:bg-owly-primary-50 hover:text-owly-primary"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() => fetchCustomers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    pagination.page >= pagination.totalPages
                      ? "text-owly-text-light/40 cursor-not-allowed"
                      : "text-owly-text-light hover:bg-owly-primary-50 hover:text-owly-primary"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCustomer && (
          <div className="w-full lg:w-[480px] xl:w-[540px] border-l border-owly-border bg-owly-surface flex flex-col overflow-hidden">
            {/* Detail Header */}
            <div className="px-4 py-3 border-b border-owly-border flex items-center gap-3">
              <button
                onClick={handleCloseDetail}
                className="lg:hidden p-1.5 hover:bg-owly-primary-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-owly-text" />
              </button>
              <div className="w-10 h-10 rounded-full bg-owly-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-owly-primary">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {editMode ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="text-sm font-semibold text-owly-text bg-owly-bg border border-owly-border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-owly-primary/30"
                  />
                ) : (
                  <h3 className="font-semibold text-owly-text truncate">
                    {selectedCustomer.name}
                  </h3>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedCustomer.isBlocked && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      <ShieldAlert className="h-3 w-3" />
                      Blocked
                    </span>
                  )}
                  <span className="text-xs text-owly-text-light">
                    {selectedCustomer.notes?.length ?? 0} notes
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {editMode ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 text-xs font-medium bg-owly-primary text-white rounded-lg hover:bg-owly-primary-dark transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditForm({
                          name: selectedCustomer.name,
                          email: selectedCustomer.email,
                          phone: selectedCustomer.phone,
                          whatsapp: selectedCustomer.whatsapp,
                          tags: selectedCustomer.tags,
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-owly-text-light border border-owly-border rounded-lg hover:bg-owly-primary-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className="p-1.5 text-owly-text-light hover:text-owly-primary hover:bg-owly-primary-50 rounded-lg transition-colors"
                      title="Edit customer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleToggleBlock}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        selectedCustomer.isBlocked
                          ? "text-green-600 hover:bg-green-50"
                          : "text-owly-text-light hover:text-red-600 hover:bg-red-50"
                      )}
                      title={
                        selectedCustomer.isBlocked
                          ? "Unblock customer"
                          : "Block customer"
                      }
                    >
                      {selectedCustomer.isBlocked ? (
                        <ShieldOff className="h-4 w-4" />
                      ) : (
                        <ShieldAlert className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCloseDetail}
                      className="hidden lg:block p-1.5 text-owly-text-light hover:text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {detailLoading && !selectedCustomer.notes ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-sm text-owly-text-light">Loading...</div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {/* Contact Info */}
                <div className="px-4 py-3 border-b border-owly-border space-y-2">
                  {editMode ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-owly-text-light font-medium">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          className="w-full mt-0.5 text-sm bg-owly-bg border border-owly-border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-owly-primary/30"
                          placeholder="Email address"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-owly-text-light font-medium">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                          className="w-full mt-0.5 text-sm bg-owly-bg border border-owly-border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-owly-primary/30"
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-owly-text-light font-medium">
                          WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={editForm.whatsapp}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              whatsapp: e.target.value,
                            })
                          }
                          className="w-full mt-0.5 text-sm bg-owly-bg border border-owly-border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-owly-primary/30"
                          placeholder="WhatsApp number"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-owly-text-light flex-shrink-0" />
                          <span className="text-sm text-owly-text truncate">
                            {selectedCustomer.email}
                          </span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-owly-text-light flex-shrink-0" />
                          <span className="text-sm text-owly-text">
                            {selectedCustomer.phone}
                          </span>
                        </div>
                      )}
                      {selectedCustomer.whatsapp && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-3.5 w-3.5 text-owly-text-light flex-shrink-0" />
                          <span className="text-sm text-owly-text">
                            {selectedCustomer.whatsapp}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-owly-text-light flex-shrink-0" />
                        <span className="text-xs text-owly-text-light">
                          Since {formatDate(selectedCustomer.firstContact)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="px-4 py-3 border-b border-owly-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                      Tags
                    </span>
                  </div>
                  {editMode ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {editForm.tags
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((tag) => (
                            <span
                              key={tag}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                getTagColor(tag)
                              )}
                            >
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:opacity-70"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Type a tag and press Enter..."
                        onKeyDown={handleAddTag}
                        className="w-full text-sm bg-owly-bg border border-owly-border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-owly-primary/30"
                      />
                    </div>
                  ) : (
                    renderTags(selectedCustomer.tags) || (
                      <span className="text-sm text-owly-text-light">
                        No tags
                      </span>
                    )
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-owly-border">
                  <button
                    onClick={() => setDetailTab("notes")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                      detailTab === "notes"
                        ? "text-owly-primary border-b-2 border-owly-primary"
                        : "text-owly-text-light hover:text-owly-text"
                    )}
                  >
                    <StickyNote className="h-4 w-4" />
                    Notes
                  </button>
                  <button
                    onClick={() => setDetailTab("conversations")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                      detailTab === "conversations"
                        ? "text-owly-primary border-b-2 border-owly-primary"
                        : "text-owly-text-light hover:text-owly-text"
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Conversations
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                  {detailTab === "notes" ? (
                    <div className="p-4 space-y-3">
                      {/* Add Note */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a note..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddNote();
                          }}
                          className="flex-1 text-sm bg-owly-bg border border-owly-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                        />
                        <button
                          onClick={handleAddNote}
                          disabled={!newNote.trim() || addingNote}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            newNote.trim() && !addingNote
                              ? "bg-owly-primary text-white hover:bg-owly-primary-dark"
                              : "bg-owly-border text-owly-text-light cursor-not-allowed"
                          )}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Notes Timeline */}
                      {selectedCustomer.notes.length === 0 ? (
                        <div className="text-center py-8">
                          <StickyNote className="h-8 w-8 text-owly-text-light/40 mx-auto mb-2" />
                          <p className="text-sm text-owly-text-light">
                            No notes yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedCustomer.notes.map((note) => (
                            <div
                              key={note.id}
                              className="bg-owly-bg border border-owly-border rounded-lg p-3"
                            >
                              <p className="text-sm text-owly-text whitespace-pre-wrap">
                                {note.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <User className="h-3 w-3 text-owly-text-light" />
                                <span className="text-xs text-owly-text-light">
                                  {note.authorName}
                                </span>
                                <span className="text-xs text-owly-text-light">
                                  --
                                </span>
                                <span className="text-xs text-owly-text-light">
                                  {formatDate(note.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4">
                      {!selectedCustomer.conversations ||
                      selectedCustomer.conversations.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-8 w-8 text-owly-text-light/40 mx-auto mb-2" />
                          <p className="text-sm text-owly-text-light">
                            No conversations found
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedCustomer.conversations.map((conv) => {
                            const ChannelIcon =
                              channelIcons[conv.channel] || MessageSquare;
                            return (
                              <div
                                key={conv.id}
                                className="flex items-center gap-3 bg-owly-bg border border-owly-border rounded-lg p-3 hover:border-owly-primary/30 transition-colors"
                              >
                                <div
                                  className={cn(
                                    "p-2 rounded-lg flex-shrink-0",
                                    channelColors[conv.channel] ||
                                      "text-owly-primary bg-owly-primary-50"
                                  )}
                                >
                                  <ChannelIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-owly-text">
                                      {getChannelLabel(conv.channel)}
                                    </span>
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                        getStatusColor(conv.status)
                                      )}
                                    >
                                      {conv.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-owly-text-light">
                                      {formatDate(conv.createdAt)}
                                    </span>
                                    <span className="text-xs text-owly-text-light">
                                      --
                                    </span>
                                    <span className="text-xs text-owly-text-light">
                                      {conv._count.messages} messages
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-owly-surface rounded-xl shadow-xl border border-owly-border w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-owly-border">
              <h3 className="text-lg font-semibold text-owly-text">
                Add Customer
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-owly-text-light hover:text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-owly-text mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                  placeholder="Customer name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-owly-text mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-owly-text mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) =>
                    setAddForm({ ...addForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-owly-text mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={addForm.whatsapp}
                  onChange={(e) =>
                    setAddForm({ ...addForm, whatsapp: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                  placeholder="WhatsApp number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-owly-text mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={addForm.tags}
                  onChange={(e) =>
                    setAddForm({ ...addForm, tags: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                  placeholder="Comma-separated tags (e.g. VIP, Premium)"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-owly-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-owly-text-light border border-owly-border rounded-lg hover:bg-owly-primary-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={!addForm.name.trim() || addLoading}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  addForm.name.trim() && !addLoading
                    ? "bg-owly-primary text-white hover:bg-owly-primary-dark"
                    : "bg-owly-border text-owly-text-light cursor-not-allowed"
                )}
              >
                {addLoading ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
