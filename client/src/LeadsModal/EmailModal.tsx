import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Pencil, Trash2, Mail } from "lucide-react";

const EmailModal = ({ isOpen, onClose, onSave, editableEmail }) => {
  const [subject, setSubject] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("draft");
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (editableEmail) {
      setSubject(editableEmail.subject || "");
      setToEmail(editableEmail.toEmail || "");
      setFromEmail(editableEmail.fromEmail || "");
      setBody(editableEmail.body || "");
      setStatus(editableEmail.status || "draft");
      setAttachments(editableEmail.attachments || []);
    } else {
      setSubject("");
      setToEmail("");
      setFromEmail("");
      setBody("");
      setStatus("draft");
      setAttachments([]);
    }
  }, [editableEmail]);

  const handleFileChange = (e) => {
    setAttachments([...e.target.files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newEmail = {
      id: editableEmail ? editableEmail.id : Date.now(),
      subject,
      toEmail,
      fromEmail,
      body,
      status,
      attachments,
      createdAt: editableEmail ? editableEmail.createdAt : new Date(),
    };

    onSave(newEmail, editableEmail ? "edit" : "add");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-6 relative">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold text-black mb-4">
          {editableEmail ? "Edit Email" : "Add Email"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-black">Subject</label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* To Email */}
          <div>
            <label className="block text-sm font-medium text-black">Recipient Email</label>
            <input
              type="email"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter recipient email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
            />
          </div>

          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-black">Sender Email</label>
            <input
              type="email"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter sender email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-black">Email Body</label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="4"
              placeholder="Write your email content..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            ></textarea>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-black">Attachments</label>
            <input
              type="file"
              multiple
              className="mt-1 w-full border border-gray-300 rounded-lg p-2"
              onChange={handleFileChange}
            />
            {attachments.length > 0 && (
              <ul className="mt-2 text-sm text-green-600">
                {attachments.map((file, idx) => (
                  <li key={idx}>{file.name || file}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-black">Status</label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Buttons */}
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {editableEmail ? "Update Email" : "Save Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ✅ EmailItem Component */
export const EmailItem = ({ email, isOpen, onToggle, onEdit, onDelete }) => {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-md transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-green-100">
            <Mail className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-black text-base">
              {email.subject || "No Subject"}
            </h4>
            <p className="text-xs text-gray-500">
              Sent: {new Date(email.createdAt).toLocaleString()}
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
          <p className="text-sm text-black leading-relaxed">{email.body}</p>
          <p className="text-sm text-black font-medium">To: {email.toEmail}</p>
          <p className="text-sm text-black font-medium">From: {email.fromEmail}</p>
          <p className="text-sm text-green-600 font-medium">
            Status: {email.status}
          </p>
          {email.attachments && email.attachments.length > 0 && (
            <div className="text-sm text-black">
              📎 Attachments:
              <ul className="list-disc ml-5">
                {email.attachments.map((file, idx) => (
                  <li key={idx}>{file.name || file}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Edit & Delete Buttons */}
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => onEdit(email)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-blue-600 text-xs"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(email.id)}
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

export default EmailModal;
