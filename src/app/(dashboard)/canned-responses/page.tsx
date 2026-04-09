"use client";

import { Header } from "@/components/layout/header";
import {
  Zap,
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  Hash,
  BarChart3,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CannedResponseData {
  id: string;
  title: string;
  content: string;
  category: string;
  shortcut: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const defaultForm = {
  title: "",
  content: "",
  category: "General",
  shortcut: "",
  isActive: true,
};

export default function CannedResponsesPage() {
  const [responses, setResponses] = useState<CannedResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResponse, setEditingResponse] =
    useState<CannedResponseData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchResponses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/canned-responses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResponses(data.data ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch canned responses:", error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const categories = Array.from(
    new Set(responses.map((r) => r.category))
  ).sort();

  const filteredResponses = responses.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q) ||
      r.shortcut.toLowerCase().includes(q)
    );
  });

  const openCreateModal = () => {
    setEditingResponse(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (response: CannedResponseData) => {
    setEditingResponse(response);
    setForm({
      title: response.title,
      content: response.content,
      category: response.category,
      shortcut: response.shortcut,
      isActive: response.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const url = editingResponse
        ? `/api/canned-responses/${editingResponse.id}`
        : "/api/canned-responses";
      const method = editingResponse ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingResponse(null);
        setForm(defaultForm);
        fetchResponses();
      }
    } catch (error) {
      console.error("Failed to save canned response:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/canned-responses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchResponses();
      }
    } catch (error) {
      console.error("Failed to delete canned response:", error);
    }
  };

  const handleToggleActive = async (response: CannedResponseData) => {
    try {
      const res = await fetch(`/api/canned-responses/${response.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !response.isActive }),
      });
      if (res.ok) {
        fetchResponses();
      }
    } catch (error) {
      console.error("Failed to toggle canned response:", error);
    }
  };

  return (
    <>
      <Header
        title="Canned Responses"
        description="Pre-written replies for quick customer support"
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-owly-primary text-white rounded-lg hover:bg-owly-primary-dark transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Response
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Filter Bar */}
        <div className="bg-owly-surface rounded-xl border border-owly-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-owly-text-light" />
              <input
                type="text"
                placeholder="Search responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm px-3 py-2 border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 text-owly-text"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Responses Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-owly-text-light">Loading...</div>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="bg-owly-surface rounded-xl border border-owly-border">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="p-4 rounded-full bg-owly-primary-50 mb-4">
                <Zap className="h-8 w-8 text-owly-primary" />
              </div>
              <p className="font-medium text-owly-text">
                {searchQuery ? "No matching responses" : "No canned responses yet"}
              </p>
              <p className="text-sm text-owly-text-light mt-1">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Create pre-written replies for faster support"}
              </p>
              {!searchQuery && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-owly-primary text-white rounded-lg hover:bg-owly-primary-dark transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Response
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredResponses.map((response) => (
              <div
                key={response.id}
                className={cn(
                  "bg-owly-surface rounded-xl border border-owly-border p-5 transition-colors",
                  !response.isActive && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-owly-text truncate flex-1 mr-2">
                    {response.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(response)}
                      className="p-1.5 hover:bg-owly-primary-50 rounded-lg transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-owly-text-light" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(response.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-owly-text-light" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-owly-primary-50 text-owly-primary">
                    {response.category}
                  </span>
                  {response.shortcut && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      <Hash className="h-3 w-3" />
                      {response.shortcut}
                    </span>
                  )}
                </div>

                <p className="text-sm text-owly-text-light line-clamp-3 mb-4 min-h-[3.75rem]">
                  {response.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-owly-border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-owly-text-light">
                      <BarChart3 className="h-3 w-3" />
                      {response.usageCount} uses
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        response.isActive
                          ? "text-owly-success"
                          : "text-owly-text-light"
                      )}
                    >
                      {response.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleActive(response)}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      response.isActive ? "bg-owly-success" : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                        response.isActive
                          ? "translate-x-4.5"
                          : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-owly-surface rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-owly-border">
              <h3 className="font-semibold text-owly-text text-lg">
                {editingResponse
                  ? "Edit Canned Response"
                  : "Create Canned Response"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-owly-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-owly-text-light" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-owly-text mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Welcome Greeting"
                  className="w-full text-sm px-3 py-2 border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-owly-text mb-1">
                  Content
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="Write the response content..."
                  rows={5}
                  className="w-full text-sm px-3 py-2 border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-owly-text mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    placeholder="e.g., General"
                    className="w-full text-sm px-3 py-2 border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-owly-text mb-1">
                    Shortcut
                  </label>
                  <input
                    type="text"
                    value={form.shortcut}
                    onChange={(e) =>
                      setForm({ ...form, shortcut: e.target.value })
                    }
                    placeholder="e.g., /greeting"
                    className="w-full text-sm px-3 py-2 border border-owly-border rounded-lg bg-owly-bg focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-owly-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !form.title.trim() || !form.content.trim() || saving
                }
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  form.title.trim() && form.content.trim() && !saving
                    ? "bg-owly-primary text-white hover:bg-owly-primary-dark"
                    : "bg-owly-border text-owly-text-light cursor-not-allowed"
                )}
              >
                {saving
                  ? "Saving..."
                  : editingResponse
                  ? "Update Response"
                  : "Create Response"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-sm mx-4 bg-owly-surface rounded-xl shadow-xl p-5">
            <h3 className="font-semibold text-owly-text text-lg mb-2">
              Delete Canned Response
            </h3>
            <p className="text-sm text-owly-text-light mb-4">
              Are you sure you want to delete this canned response? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-owly-text hover:bg-owly-primary-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium bg-owly-danger text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
