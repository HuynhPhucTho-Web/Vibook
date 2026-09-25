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
import { auth } from "../../components/firebase";

// Helper to extract Google Drive / Presentation file ID if applicable
export const getGoogleDriveFileId = (url) => {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=download&)?id=)|docs\.google\.com\/[a-z]+\/d\/)([a-zA-Z0-9_-]+)/i
  );
  return match ? match[1] : null;
};

// Check if URL is Google Presentation / Slides
export const isGooglePresentation = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.includes("docs.google.com/presentation");
};

// Check if a document is a presentation (PPT/PPTX/Slide)
export const isPresentationDoc = (doc) => {
  if (!doc) return false;
  if (doc.type === "ppt" || doc.type === "pptx") return true;
  const name = (doc.name || "").toLowerCase();
  if (name.includes("ppt") || name.includes("slide") || name.includes("powerpoint")) return true;
  const url = doc.pdfUrl || doc.pptUrl || doc.url || "";
  return isGooglePresentation(url) || url.toLowerCase().includes(".ppt") || url.toLowerCase().includes(".pptx");
};

// Get the best URL for previewing inside an <iframe> (hiện y như PDF cũ để tránh lỗi Google Docs)
export const getDocumentPreviewUrl = (url) => {
  if (!url) return "";
  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    // Luôn sử dụng Google Drive preview vì hiển thị tốt như PDF cũ, tránh lỗi "Google Docs encountered an error"
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }
  return url.includes("#") ? url : `${url}#toolbar=0`;
};

// Get the URL for downloading
export const getDocumentDownloadUrl = (url, format = "auto") => {
  if (!url) return "";
  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
  }
  return url;
};

// Get the URL for viewing in a new tab / external view
export const getDocumentViewUrl = (url) => {
  if (!url) return "";
  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
  }
  return url;
};

export default function SourceDocDetail({ subject, isDark, language }) {
  const [docSearch, setDocSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);

  useEffect(() => {
    return auth.onAuthStateChanged((usr) => setCurrentUser(usr));
  }, []);

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
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-6 lg:h-[calc(100vh-280px)] lg:min-h-[600px] w-full">
      {/* Left side list of documents */}
      <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-2.5 sm:gap-4 lg:max-h-none">
        <div className="relative flex items-center mb-1">
          <FaSearch className={`absolute left-3 ${isDark ? "text-outline" : "text-slate-400"}`} size={14} />
          <input
            className={`w-full border rounded-lg py-1.5 sm:py-2 pl-9 pr-3 text-xs sm:text-sm transition-all ${
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
        <div className="flex-1 lg:overflow-y-auto pr-0 lg:pr-2 space-y-2 sm:space-y-3 custom-scrollbar">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            const isPpt = isPresentationDoc(doc);
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(isSelected ? null : doc)}
                className={`group p-2.5 sm:p-3.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? isDark
                      ? isPpt
                        ? "bg-gradient-to-br from-amber-500/15 to-orange-500/15 border-amber-500/45 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                        : "bg-gradient-to-br from-primary/15 to-electric-blue/15 border-primary/45 shadow-[0_0_15px_rgba(142,84,233,0.15)]"
                      : isPpt
                        ? "bg-amber-50/70 border-amber-500/50 shadow-sm"
                        : "bg-slate-50 border-primary/50 shadow-sm"
                    : isDark
                      ? "bg-glass-surface border-glass-border hover:bg-white/5"
                      : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div
                    className={`mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? isPpt
                          ? "bg-amber-500/20"
                          : "bg-primary/20"
                        : isDark
                          ? "bg-[#1e1f27] border border-glass-border"
                          : "bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <FaFileAlt className={`text-[13px] sm:text-[15px] ${
                      isSelected
                        ? isPpt
                          ? "text-amber-500"
                          : "text-primary"
                        : isDark ? "text-[#cdc3d6]" : "text-slate-500"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isPpt
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                      }`}>
                        {isPpt ? "PPT" : "PDF"}
                      </span>
                    </div>
                    <h3
                      className={`text-xs sm:text-sm truncate font-semibold ${
                        isSelected
                          ? isPpt
                            ? "text-amber-600 dark:text-amber-400 font-bold"
                            : "text-primary font-bold"
                          : isDark ? "text-on-surface" : "text-slate-800"
                      }`}
                    >
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] sm:text-xs text-outline">
                      <span>{doc.size}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="truncate">{doc.moduleName}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile action button */}
                <div className="lg:hidden flex items-center gap-2 mt-2 pt-2 border-t border-glass-border/30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoc(isSelected ? null : doc);
                    }}
                    className={`flex-1 py-1 rounded text-white text-xs font-medium hover:brightness-110 transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                      isSelected
                        ? "bg-slate-600 hover:bg-slate-700 text-slate-200"
                        : isPpt
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-primary"
                    }`}
                  >
                    <FaEye size={12} />
                    {isSelected
                      ? (language === "vi" ? "Thu gọn xem trước" : "Collapse Preview")
                      : language === "vi"
                        ? (isPpt ? "Xem tài liệu PPT" : "Xem tài liệu")
                        : (isPpt ? "View PPT" : "View Document")}
                  </button>
                </div>

                {/* Inline Mobile Document Viewer Bar and Frame */}
                {isSelected && (
                  <div className="lg:hidden mt-2 pt-2 border-t border-glass-border/30 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Document Header Details Bar */}
                    <div className={`py-1.5 px-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-1.5 ${
                      isDark ? "bg-[#12131a] border-white/10" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0 max-w-[55%] sm:max-w-none">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                          isPpt
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                        }`}>
                          {isPpt ? "PPT" : "PDF"}
                        </span>
                        <span className="text-xs truncate font-medium">
                          {doc.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        {currentUser && (
                          <>
                            {/* Download Button */}
                            <a
                              href={getDocumentDownloadUrl(doc.pdfUrl || doc.pptUrl)}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              title={language === "vi" ? (isPpt ? "Tải xuống PowerPoint (.ppt)" : "Tải xuống PDF") : "Download"}
                              className={`p-1 sm:p-1.5 rounded border transition-colors flex items-center justify-center gap-1 no-underline ${
                                isDark
                                  ? "hover:bg-white/10 border-white/10 text-on-surface-variant"
                                  : "hover:bg-black/5 border-slate-200 text-slate-600"
                              }`}
                            >
                              <FaDownload size={11} />
                              <span className="text-[10px] font-bold hidden sm:inline">
                                {isPpt ? "Tải PPT" : (language === "vi" ? "Tải" : "Download")}
                              </span>
                            </a>

                            {/* Open in New Tab Button */}
                            <a
                              href={getDocumentViewUrl(doc.pdfUrl || doc.pptUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={language === "vi" ? "Mở trong tab mới" : "Open in new tab"}
                              className={`p-1 sm:p-1.5 rounded border transition-colors flex items-center justify-center gap-1 no-underline ${
                                isDark
                                  ? "hover:bg-white/10 border-white/10 text-on-surface-variant"
                                  : "hover:bg-black/5 border-slate-200 text-slate-600"
                              }`}
                            >
                              <FaEye size={11} />
                              <span className="text-[10px] font-bold hidden sm:inline">
                                {language === "vi" ? "Mở tab" : "Open Tab"}
                              </span>
                            </a>

                            <div className={`w-px h-4 mx-0.5 ${isDark ? "bg-glass-border" : "bg-slate-200"}`}></div>

                            {/* Print Button */}
                            <a
                              href={getDocumentPreviewUrl(doc.pdfUrl || doc.pptUrl)}
                              target="_blank"
                              rel="noreferrer"
                              title={language === "vi" ? "In tài liệu" : "Print"}
                              className={`p-1 rounded transition-colors flex items-center justify-center ${
                                isDark ? "hover:bg-white/10 text-on-surface-variant" : "hover:bg-black/5 text-slate-600"
                              }`}
                            >
                              <FaPrint size={11} />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Small Document Preview Frame */}
                    <div className="w-full h-[250px] sm:h-[320px] rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900/5 relative shadow-inner">
                      {!currentUser ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gray-50/50 dark:bg-gray-900/50">
                          <FaFileAlt className="text-red-500 mb-2" size={20} />
                          <h5 className="text-xs font-bold mb-1 text-gray-800 dark:text-gray-100">
                            {language === "vi" ? "Tài liệu này yêu cầu đăng nhập" : "Authentication Required"}
                          </h5>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 max-w-xs">
                            {language === "vi" 
                              ? "Vui lòng đăng nhập tài khoản ThoDev để xem tài liệu này." 
                              : "Please sign in to view this document."}
                          </p>
                          <a
                            href={`/login?from=${encodeURIComponent(window.location.pathname)}`}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold no-underline"
                          >
                            {language === "vi" ? "Đăng nhập ngay" : "Login Now"}
                          </a>
                        </div>
                      ) : (
                        <iframe
                          key={doc.id}
                          src={getDocumentPreviewUrl(doc.pdfUrl || doc.pptUrl || doc.url)}
                          className="w-full h-full bg-white border-0"
                          title={doc.name}
                          allow="autoplay; fullscreen"
                          allowFullScreen
                        ></iframe>
                      )}
                    </div>
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

      {/* Right side PDF viewer panel (Desktop only) */}
      <div className={`hidden lg:flex flex-1 min-h-0 rounded-2xl border shadow-lg flex-col overflow-hidden relative ${
        isDark ? "bg-[#1e1f27]/50 border-white/10" : "bg-white border-slate-200"
      }`}>
        {selectedDoc ? (
          <>
            {/* Document header details */}
            <div className={`min-h-14 py-2 border-b flex flex-wrap items-center justify-between px-4 gap-2 ${
              isDark ? "bg-[#1e1f27]/85 border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-2.5 min-w-0 max-w-full">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                  isPresentationDoc(selectedDoc)
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                }`}>
                  {isPresentationDoc(selectedDoc) ? "PPT" : "PDF"}
                </span>
                <span className="font-body-md text-body-md truncate font-medium">
                  {selectedDoc.name}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {currentUser && (
                  <>
                    {/* Download Button */}
                    <a
                      href={getDocumentDownloadUrl(selectedDoc.pdfUrl || selectedDoc.pptUrl)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      title={language === "vi" ? (isPresentationDoc(selectedDoc) ? "Tải xuống PowerPoint (.ppt)" : "Tải xuống PDF") : "Download"}
                      className={`p-1.5 rounded border transition-colors flex items-center justify-center gap-1.5 no-underline ${
                        isDark
                          ? "hover:bg-white/10 border-white/10 text-on-surface-variant"
                          : "hover:bg-black/5 border-slate-200 text-slate-600"
                      }`}
                    >
                      <FaDownload size={14} />
                      <span className="text-[11px] font-bold hidden sm:inline">
                        {isPresentationDoc(selectedDoc) ? "Tải PPT" : (language === "vi" ? "Tải xuống" : "Download")}
                      </span>
                    </a>

                    {/* Open in New Tab Button */}
                    <a
                      href={getDocumentViewUrl(selectedDoc.pdfUrl || selectedDoc.pptUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={language === "vi" ? "Mở trong tab mới" : "Open in new tab"}
                      className={`p-1.5 rounded border transition-colors flex items-center justify-center gap-1.5 no-underline ${
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
                      href={getDocumentPreviewUrl(selectedDoc.pdfUrl || selectedDoc.pptUrl)}
                      target="_blank"
                      rel="noreferrer"
                      title={language === "vi" ? "In tài liệu" : "Print"}
                      className={`p-1.5 rounded transition-colors flex items-center justify-center ${
                        isDark ? "hover:bg-white/10 text-on-surface-variant" : "hover:bg-black/5 text-slate-600"
                      }`}
                    >
                      <FaPrint size={14} />
                    </a>
                  </>
                )}
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
              ) : !currentUser ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-700 rounded-xl relative z-10 m-4">
                  <div className="w-16 h-16 bg-red-500/10 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <FaFileAlt size={28} />
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">
                    {language === "vi" ? "Tài liệu này yêu cầu đăng nhập" : "Authentication Required"}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
                    {language === "vi" 
                      ? "Vui lòng đăng nhập tài khoản ThoDev để xem trước, in và tải xuống tài liệu này để bảo vệ bản quyền." 
                      : "Please sign in to ThoDev to preview, print and download this document to protect copyright."}
                  </p>
                  <a
                    href={`/login?from=${encodeURIComponent(window.location.pathname)}`}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition no-underline shadow-md shadow-blue-500/20"
                  >
                    {language === "vi" ? "Đăng nhập ngay" : "Login Now"}
                  </a>
                </div>
              ) : (
                /* Render live PDF or Slide embed preview using an iframe */
                <iframe
                  key={selectedDoc.id}
                  src={getDocumentPreviewUrl(selectedDoc.pdfUrl || selectedDoc.pptUrl || selectedDoc.url)}
                  className="w-full h-full rounded shadow-2xl border border-glass-border relative z-10 bg-white"
                  title={selectedDoc.name}
                  allow="autoplay; fullscreen"
                  allowFullScreen
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
