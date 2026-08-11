import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaPrint,
  FaSearchPlus,
  FaSearchMinus
} from "react-icons/fa";

export default function SourceDocDetail({ subject, isDark, language }) {
  const [docSearch, setDocSearch] = useState("");

  // Get all documents across all modules of this subject
  const allDocs = subject.modules.flatMap((m) =>
    m.docs.map((d) => ({ ...d, moduleName: m.name }))
  );

  const filteredDocs = allDocs.filter((d) =>
    d.name.toLowerCase().includes(docSearch.toLowerCase())
  );

  const [selectedDoc, setSelectedDoc] = useState(() => {
    const savedDocId = localStorage.getItem(`vibook_selected_doc_id_${subject.id}`);
    if (savedDocId) {
      const doc = allDocs.find((d) => d.id === savedDocId);
      if (doc) return doc;
    }
    return allDocs[0] || null;
  });

  useEffect(() => {
    if (selectedDoc) {
      localStorage.setItem(`vibook_selected_doc_id_${subject.id}`, selectedDoc.id);
    } else {
      localStorage.removeItem(`vibook_selected_doc_id_${subject.id}`);
    }
  }, [selectedDoc, subject.id]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
      {/* Left side list of documents */}
      <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-4">
        <div className="relative flex items-center mb-1">
          <FaSearch className={`absolute left-3 ${isDark ? "text-outline" : "text-slate-400"}`} size={16} />
          <input
            className={`w-full border rounded-lg py-2 pl-10 pr-4 text-body-md transition-all ${
              isDark
                ? "bg-[#0c0d14] border-white/10 text-white placeholder:text-zinc-500 focus:border-electric-blue focus:bg-[#1e1f27]"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
            }`}
            placeholder={language === "vi" ? "Lọc tài liệu..." : "Filter documents..."}
            type="text"
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`group p-4 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? isDark
                      ? "bg-gradient-to-br from-primary/15 to-electric-blue/15 border-primary/45 shadow-[0_0_15px_rgba(142,84,233,0.15)]"
                      : "bg-slate-50 border-primary/50 shadow-sm"
                    : isDark
                      ? "bg-glass-surface border-glass-border hover:bg-white/5"
                      : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "bg-primary/20"
                        : isDark
                          ? "bg-[#1e1f27] border border-glass-border"
                          : "bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <FaFileAlt className={`text-[16px] ${isSelected ? "text-primary" : isDark ? "text-[#cdc3d6]" : "text-slate-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-body-md text-body-md truncate font-medium ${
                        isSelected ? "text-primary" : isDark ? "text-on-surface" : "text-slate-800"
                      }`}
                    >
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-label-sm font-label-sm text-outline">
                      <span>{doc.size}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="truncate">{doc.moduleName}</span>
                    </div>
                  </div>
                </div>

                {/* Selectable item actions */}
                {isSelected && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-glass-border">
                    <a
                      href={doc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 rounded bg-primary text-on-primary text-label-sm font-label-sm hover:brightness-110 transition-all flex items-center justify-center gap-1.5 font-bold text-center"
                    >
                      <FaEye size={13} />
                      {language === "vi" ? "Xem tab mới" : "Open Tab"}
                    </a>
                    <a
                      href={doc.pdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded border transition-all flex items-center justify-center ${
                        isDark
                          ? "bg-[#12131a] border-glass-border text-on-surface hover:text-primary hover:border-primary/50"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <FaDownload size={13} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}

          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant opacity-60">
              {language === "vi" ? "Không có tài liệu nào." : "No documents found."}
            </div>
          )}
        </div>
      </div>

      {/* Right side PDF viewer panel */}
      <div className={`flex-1 rounded-2xl border shadow-lg flex flex-col overflow-hidden relative ${
        isDark ? "bg-[#1e1f27]/50 border-white/10" : "bg-white border-slate-200"
      }`}>
        {selectedDoc ? (
          <>
            {/* PDF header details */}
            <div className={`h-14 border-b flex items-center justify-between px-4 ${
              isDark ? "bg-[#1e1f27]/85 border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-3">
                <FaFileAlt className="text-primary" size={16} />
                <span className="font-body-md text-body-md truncate font-medium">
                  {selectedDoc.name}.pdf
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Download Button */}
                <a
                  href={selectedDoc.pdfUrl}
                  download
                  title={language === "vi" ? "Tải xuống PDF" : "Download PDF"}
                  className={`p-1.5 rounded border transition-colors flex items-center justify-center gap-1.5 ${
                    isDark
                      ? "hover:bg-white/10 border-white/10 text-on-surface-variant"
                      : "hover:bg-black/5 border-slate-200 text-slate-600"
                  }`}
                >
                  <FaDownload size={14} />
                  <span className="text-[11px] font-bold hidden sm:inline">
                    {language === "vi" ? "Tải xuống" : "Download"}
                  </span>
                </a>

                {/* Open in New Tab Button */}
                <a
                  href={selectedDoc.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={language === "vi" ? "Mở trong tab mới" : "Open in new tab"}
                  className={`p-1.5 rounded border transition-colors flex items-center justify-center gap-1.5 ${
                    isDark
                      ? "hover:bg-white/10 border-white/10 text-on-surface-variant"
                      : "hover:bg-black/5 border-slate-200 text-slate-600"
                  }`}
                >
                  <FaEye size={14} />
                  <span className="text-[11px] font-bold hidden sm:inline">
                    {language === "vi" ? "Mở tab mới" : "Open Tab"}
                  </span>
                </a>

                <div className={`w-px h-6 mx-1 ${isDark ? "bg-glass-border" : "bg-slate-200"}`}></div>

                {/* Print Button */}
                <a
                  href={selectedDoc.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={language === "vi" ? "In tài liệu" : "Print"}
                  className={`p-1.5 rounded transition-colors flex items-center justify-center ${
                    isDark ? "hover:bg-white/10 text-on-surface-variant" : "hover:bg-black/5 text-slate-600"
                  }`}
                >
                  <FaPrint size={14} />
                </a>
              </div>
            </div>

            {/* Document Display frame */}
            <div className="flex-1 bg-bg-deep relative overflow-hidden flex items-center justify-center p-4 md:p-8 overflow-y-auto w-full h-full">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(142,84,233,0.05)_0%,transparent_70%)] pointer-events-none"></div>

              {selectedDoc.content && (!selectedDoc.pdfUrl || selectedDoc.pdfUrl.includes("dummy.pdf")) ? (
                <div className={`w-full max-w-3xl aspect-[1/1.4] rounded-2xl border relative z-10 flex flex-col overflow-hidden shadow-2xl ${
                  isDark ? "bg-[#1e1f27] border-white/10" : "bg-white border-slate-200/80"
                }`}>
                  <div className="p-8 md:p-12 border-b border-glass-border">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">
                      {selectedDoc.content.title}
                    </h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-neon-purple to-electric-blue rounded-full mb-6 md:mb-8"></div>
                    <p className={`text-body-md font-body-md leading-relaxed opacity-90 ${isDark ? "text-on-surface-variant" : "text-slate-600"}`}>
                      {selectedDoc.content.desc}
                    </p>
                  </div>
                  <div className={`flex-1 p-8 md:p-12 flex flex-col gap-6 overflow-y-auto custom-scrollbar ${
                    isDark ? "bg-[#1a1b22]/40" : "bg-slate-50/60"
                  }`}>
                    {selectedDoc.content.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className={`w-24 h-12 rounded-lg flex items-center justify-center border flex-shrink-0 ${
                          isDark ? "bg-[#12131a] border-white/10" : "bg-slate-100 border-slate-200"
                        }`}>
                          <span className="text-primary font-label-sm font-bold text-center px-1">
                            {item.badge}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className={`h-2 rounded-full w-full overflow-hidden ${
                            isDark ? "bg-[#12131a]" : "bg-slate-200"
                          }`}>
                            <div className={`h-full ${item.color} ${item.value}`}></div>
                          </div>
                          <span className="text-label-sm font-label-sm text-outline mt-1 block">
                            {item.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Render live PDF preview using an iframe */
                <iframe
                  src={`${selectedDoc.pdfUrl}#toolbar=0`}
                  className="w-full h-full rounded shadow-2xl border border-glass-border relative z-10 bg-white"
                  title={selectedDoc.name}
                ></iframe>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <FaFileAlt className="text-outline opacity-40" size={64} />
            <p className="text-on-surface-variant">
              {language === "vi" ? "Chọn tài liệu để xem" : "Select a document to view"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
