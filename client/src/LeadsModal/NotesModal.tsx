import React, { useState, useEffect } from "react";
import {
  X,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";

type Note = {
  id: number;
  title: string;
  date: string;
  detail: string;
  type: string;
  attachment: File | null;
  reminder: boolean;
  reminderDate: string;
  email: string;
  createdAt: Date;
};

type NotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note, action: "add" | "edit") => void;
  editableNote?: Note | null;
};

type NoteItemProps = {
  note: Note;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
};

const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editableNote,
}) => {
  const [form, setForm] = useState({
    title: "",
    date: "",
    detail: "",
    type: "",
    attachment: null as File | null,
    reminder: false,
    reminderDate: "",
    email: "",
  });

  useEffect(() => {
    if (editableNote) {
      setForm({
        title: editableNote.title || "",
        date: editableNote.date || "",
        detail: editableNote.detail || "",
        type: editableNote.type || "",
        attachment: editableNote.attachment || null,
        reminder: editableNote.reminder || false,
        reminderDate: editableNote.reminderDate || "",
        email: editableNote.email || "",
      });
    } else {
      resetForm();
    }
  }, [editableNote]);

  const resetForm = () => {
    setForm({
      title: "",
      date: "",
      detail: "",
      type: "",
      attachment: null,
      reminder: false,
      reminderDate: "",
      email: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked, files } = e.target as any;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      if (name === "reminder" && !checked) {
        setForm((prev) => ({ ...prev, reminderDate: "" }));
      }
    } else if (type === "file") {
      setForm((prev) => ({ ...prev, attachment: files[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const scheduleReminder = () => {
    const delay = new Date(form.reminderDate).getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        new Notification("Reminder: Note", {
          body: `Don't forget: ${form.detail || "You have a reminder"}`,
          icon: "https://cdn-icons-png.flaticon.com/512/1827/1827272.png",
        });
      }, delay);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.reminder) await requestNotificationPermission();
    if (form.reminder) scheduleReminder();

    const newNote: Note = {
      id: editableNote ? editableNote.id : Date.now(),
      ...form,
      createdAt: editableNote ? editableNote.createdAt : new Date(),
    };

    onSave(newNote, editableNote ? "edit" : "add");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl shadow-lg p-6 relative">
        <button
          type="button"
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-black">
          {editableNote ? "Edit Note" : "Add Note"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <InputField
            label="Title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            required
          />

          {/* Date */}
          <InputField
            label="Date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />

          {/* Detail */}
          <div>
            <label className="block text-sm font-medium text-black">Detail</label>
            <textarea
              name="detail"
              rows={3}
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter note details"
              value={form.detail}
              onChange={handleChange}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-black">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Attachment */}
          <InputField
            label="Attachment"
            name="attachment"
            type="file"
            onChange={handleChange}
          />
          {form.attachment && (
            <p className="text-xs mt-1 text-gray-500">{form.attachment.name}</p>
          )}

          {/* Email */}
          <InputField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />

          {/* Reminder */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reminder"
              name="reminder"
              checked={form.reminder}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <label htmlFor="reminder" className="text-black text-sm">
              Set Reminder
            </label>
          </div>

          {form.reminder && (
            <InputField
              label="Reminder Date & Time"
              name="reminderDate"
              type="datetime-local"
              value={form.reminderDate || getCurrentDateTime()}
              onChange={handleChange}
            />
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editableNote ? "Update Note" : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reusable Input Component
type InputFieldProps = {
  label: string;
  name: string;
  type: string;
  value?: string;
  onChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  required?: boolean;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type,
  value,
  onChange,
  required = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-black">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

/* ✅ NoteItem Component with Edit & Delete */
export const NoteItem: React.FC<NoteItemProps> = ({ note, isOpen, onToggle, onEdit, onDelete }) => {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-md transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-blue-100">
            <StickyNote className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-black text-base flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                ✔
              </span>
              {note.title || "No Title"}
            </h4>
            <p className="text-xs text-gray-500">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-black" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pl-1 border-t pt-3 space-y-2">
          <p className="text-sm text-black leading-relaxed">
            {note.detail}
          </p>
          {note.type && (
            <p className="text-sm text-black font-medium">Type: {note.type}</p>
          )}
          {note.email && (
            <p className="text-sm text-black font-medium">📧 {note.email}</p>
          )}
          {note.attachment && (
            <p className="text-sm text-black font-medium">
              📎 {note.attachment.name}
            </p>
          )}
          {note.reminder && note.reminderDate && (
            <p className="text-sm text-black font-medium">
              ⏰ Reminder: {new Date(note.reminderDate).toLocaleString()}
            </p>
          )}

          {/* Edit & Delete Buttons */}
          <div className="flex justify-end gap-0 mt-3">
            <button
              onClick={() => onEdit(note)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-blue-700 text-xs"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-red-700 text-xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesModal;
