import React, { useState, useEffect, useRef } from 'react';
import { getDirectoryHandle, saveDirectoryHandle } from '../lib/directoryFS';
import { Github, Trash2, Minus, Database, Upload, Download, File, FileDown, Plus, X, Maximize2, Calculator, Save, LogOut, Sun, Moon, FileText, Calendar, Search, Check, Square, ImagePlus, FolderDown, FolderUp, Lock, Unlock, Cloud, LogIn, Loader2, FileSpreadsheet, Sparkles, Mic, MicOff, Palette, Settings, RotateCcw, FileJson, UploadCloud, RefreshCw, Eraser, ImageMinus, Paintbrush, ArrowDownAZ, ArrowUpAZ, CalendarDays, Type, CaseSensitive, RemoveFormatting, Eye, Monitor, Tag, Archive, FolderPlus, Share2, FolderOpen, Terminal, Copy, CheckCheck, Folder, User, Key } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { useFirebase } from '../hooks/useFirebase';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, type User as FirebaseUser, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, writeBatch, doc, setDoc, getDocs, getDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { GoogleGenAI } from '@google/genai';

type GridRow = {
  id: string;
  status?: string;
  image?: string;
  [key: string]: any;
};

type GridDocument = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  headers: string[];
  columnWidths?: number[];
  rows: GridRow[];
  tags?: string[];
};

const COLOR_THEMES = {
   blue: { 50: '#eff6ff', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
   green: { 50: '#ecfdf5', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857' },
   purple: { 50: '#faf5ff', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce' },
   rose: { 50: '#fff1f2', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c' },
   indigo: { 50: '#eef2ff', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
   kontrast: { 50: '#f4f4f5', 400: '#d4d4d8', 500: '#71717a', 600: '#18181b', 700: '#000000' },
};

  const getActiveUid = () => {
     return localStorage.getItem('grid_notepad_custom_uid') || (auth.currentUser ? auth.currentUser.uid : null);
  };

export const TAG_COLORS = [
   { id: 'tag-red', color: '#ef4444', name: 'E Kuqe (Red)' },
   { id: 'tag-orange', color: '#f97316', name: 'Portokalli (Orange)' },
   { id: 'tag-amber', color: '#f59e0b', name: 'E Verdhë (Amber)' },
   { id: 'tag-green', color: '#22c55e', name: 'E Gjelbër (Green)' },
   { id: 'tag-emerald', color: '#10b981', name: 'Zmerald (Emerald)' },
   { id: 'tag-teal', color: '#14b8a6', name: 'E Kaltër e Gjelbër (Teal)' },
   { id: 'tag-cyan', color: '#06b6d4', name: 'Sian (Cyan)' },
   { id: 'tag-blue', color: '#3b82f6', name: 'Blu (Blue)' },
   { id: 'tag-indigo', color: '#6366f1', name: 'Indigo (Indigo)' },
   { id: 'tag-violet', color: '#8b5cf6', name: 'Vjollcë (Violet)' },
   { id: 'tag-purple', color: '#a855f7', name: 'Lejla (Purple)' },
   { id: 'tag-pink', color: '#ec4899', name: 'Rozë (Pink)' },
   { id: 'tag-rose', color: '#f43f5e', name: 'Trëndafil (Rose)' },
   { id: 'tag-slate', color: '#64748b', name: 'Gri e Hirtë (Slate)' },
];

const CellInput = React.memo(({
    initialValue,
    onChange,
    readOnly,
    startHold,
    stopHold,
    className,
    style,
}: any) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
            if (inputRef.current.value !== (initialValue || "")) {
                inputRef.current.value = initialValue || "";
            }
        }
    }, [initialValue]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
    };

    return (
        <textarea
            ref={inputRef}
            defaultValue={initialValue || ""}
            onChange={handleChange}
            onFocus={(e) => {
                setTimeout(() => {
                    const el = e.target;
                    const rect = el.getBoundingClientRect();
                    const viewHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                    if (rect.bottom > viewHeight || rect.top < 0) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }}
            placeholder="..."
            readOnly={readOnly}
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            onTouchCancel={stopHold}
            className={className}
            style={style}
            spellCheck={false}
        />
    );
});

const HeaderInput = React.memo(({ initialValue, onChange, className, placeholder }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
            if (inputRef.current.value !== (initialValue || "")) {
                inputRef.current.value = initialValue || "";
            }
        }
    }, [initialValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <input
            ref={inputRef}
            defaultValue={initialValue || ""}
            onChange={handleChange}
            onFocus={(e) => {
                setTimeout(() => {
                    const el = e.target;
                    const rect = el.getBoundingClientRect();
                    const viewHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                    if (rect.bottom > viewHeight || rect.top < 0) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }}
            className={className}
            placeholder={placeholder}
            spellCheck={false}
        />
    );
});

export function Notepad() {
  const [documents, setDocuments] = useState<GridDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const activeDocIdRef = useRef<string | null>(null);
  useEffect(() => { activeDocIdRef.current = activeDocId; }, [activeDocId]);
  const [isDark, setIsDark] = useState(true);
  
  const [viewportHeight, setViewportHeight] = useState('100dvh');

  const [accentColor, setAccentColor] = useState<keyof typeof COLOR_THEMES>('blue');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const [themeSync, setThemeSync] = useState(() => {
      return localStorage.getItem('grid_theme_sync') === 'true';
  });
  
  const [cloudSyncFrequency, setCloudSyncFrequency] = useState<number>(() => {
      const saved = localStorage.getItem('grid_cloud_sync_freq');
      return saved ? parseInt(saved, 10) : 5000;
  });
  
  const [language, setLanguage] = useState<'sq' | 'en'>(() => (localStorage.getItem('grid_lang') as any) || 'sq');
  const t = (sq: string, en: string) => language === 'en' ? en : sq;
  
  const [downloadMethod, setDownloadMethod] = useState<'auto'|'picker'|'share'|'direct'|'folder'>(() => {
      return (localStorage.getItem('grid_download_method') as any) || 'folder';
  });
  
  const [folderName, setFolderName] = useState<string>('');
  
  useEffect(() => {
     getDirectoryHandle().then(handle => {
         if (handle) {
             setFolderName(handle.name);
             localStorage.setItem('grid_mock_folder', handle.name);
         } else {
             const mock = localStorage.getItem('grid_mock_folder');
             if (mock) setFolderName(mock);
         }
     });
  }, []);

  const [textSize, setTextSize] = useState<number>(() => {
      const val = parseInt(localStorage.getItem('grid_text_size') || '12', 10);
      return isNaN(val) ? 12 : val;
  });
  const [textWeight, setTextWeight] = useState<number>(() => {
      const saved = localStorage.getItem('grid_text_weight');
      if (saved === 'bold') return 700;
      if (saved === 'normal') return 400;
      const val = parseInt(saved || '400', 10);
      return isNaN(val) ? 400 : val;
  });
  const [textColorMode, setTextColorMode] = useState<string>(() => localStorage.getItem('grid_text_color') || 'default');
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showTagColorMenu, setShowTagColorMenu] = useState(false);

  const updateTextSize = (val: number) => {
      setTextSize(val);
      localStorage.setItem('grid_text_size', val.toString());
  };
  const updateTextWeight = (val: number) => {
      setTextWeight(val);
      localStorage.setItem('grid_text_weight', val.toString());
  };
  const updateTextColorMode = (val: string) => {
      setTextColorMode(val);
      localStorage.setItem('grid_text_color', val);
  };

  const getActualTextColor = (colorId: string) => {
      if (colorId === 'default') return undefined;
      if (isDark && colorId === '#000000') return '#ffffff';
      if (!isDark && colorId === '#ffffff') return '#000000';
      return colorId;
  };

  const TEXT_COLORS = [
    { id: 'default', color: 'bg-zinc-500', name: t('Standard', 'Standard') },
    { id: '#000000', color: 'bg-black', name: t('E Zezë', 'Black') },
    { id: '#ffffff', color: 'bg-white', name: t('E Bardhë', 'White') },
    { id: '#ff0000', color: 'bg-red-600', name: t('E Kuqe', 'Red') },
    { id: '#0044ff', color: 'bg-blue-600', name: t('Blu', 'Blue') },
    { id: '#00cc44', color: 'bg-green-600', name: t('E Gjelbër', 'Green') },
    { id: '#ffcc00', color: 'bg-yellow-500', name: t('E Verdhë', 'Yellow') },
    { id: '#aa00ff', color: 'bg-purple-600', name: t('Vjollcë', 'Purple') },
    { id: '#ff5500', color: 'bg-orange-600', name: t('Portokalli', 'Orange') },
    { id: '#ff00aa', color: 'bg-pink-600', name: t('Rozë', 'Pink') },
  ];
  
  // Active document state
  const [title, setTitle] = useState(t('Shënim i Paemërtuar', 'Untitled Note'));
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [rows, setRows] = useState<GridRow[]>([]);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [headers, setHeaders] = useState([t('Kolona 1', 'Column 1'), t('Kolona 2', 'Column 2'), t('Kolona 3', 'Column 3'), t('Kolona 4', 'Column 4')]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showConfirmDeleteSelected, setShowConfirmDeleteSelected] = useState(false);
  
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
     if (activeDocId) {
         const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
         return () => clearInterval(timer);
     }
  }, [activeDocId]);

  const getAlbanianDateTime = () => {
      const d = currentDateTime;
      const dName = [t('E Diel', 'Sun'), t('E Hënë', 'Mon'), t('E Martë', 'Tue'), t('E Mërkurë', 'Wed'), t('E Enjte', 'Thu'), t('E Premte', 'Fri'), t('E Shtunë', 'Sat')][d.getDay()];
      const day = d.getDate().toString().padStart(2, '0');
      const month = [t('Jan', 'Jan'), t('Shk', 'Feb'), t('Mar', 'Mar'), t('Pri', 'Apr'), t('Maj', 'May'), t('Qer', 'Jun'), t('Korr', 'Jul'), t('Gus', 'Aug'), t('Sht', 'Sep'), t('Tet', 'Oct'), t('Nën', 'Nov'), t('Dhj', 'Dec')][d.getMonth()];
      const year = d.getFullYear();
      const time = d.toLocaleTimeString(language === 'en' ? 'en-US' : 'sq-AL', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${dName} ${day}-${month}-${year} ${time}`;
  };

  const [activeCell, setActiveCell] = useState<{rIndex: number, colKey: string} | null>(null);
  const [modalText, setModalText] = useState('');
  const [previewSelectedRows, setPreviewSelectedRows] = useState(false);

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcPos, setCalcPos] = useState({ x: 20, y: 120 });
  const [isDraggingCalc, setIsDraggingCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const dragRef = useRef<{startX: number, startY: number, initialX: number, initialY: number} | null>(null);

  const handleCalcInput = (key: string) => {
      if (key === 'C') {
          setCalcDisplay('0');
      } else if (key === '=') {
          try {
              const sanitized = calcDisplay.replace(/x/g, '*').replace(/÷/g, '/');
              const res = new Function(`return ${sanitized}`)();
              setCalcDisplay(String(Number(res.toFixed(4))));
          } catch {
              setCalcDisplay('Gabim');
          }
      } else {
          setCalcDisplay(prev => prev === '0' || prev === 'Gabim' ? key : prev + key);
      }
  };

  const handleCalcPointerDown = (e: React.PointerEvent) => {
      setIsDraggingCalc(true);
      dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialX: calcPos.x,
          initialY: calcPos.y
      };
      e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCalcPointerMove = (e: React.PointerEvent) => {
      if (!isDraggingCalc || !dragRef.current) return;
      e.preventDefault();
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setCalcPos({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy });
  };

  const handleCalcPointerUp = (e: React.PointerEvent) => {
      setIsDraggingCalc(false);
      dragRef.current = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err){}
  };
  
  const cellHoldRef = useRef<NodeJS.Timeout | null>(null);

  const handleCellHoldStart = (rIndex: number, colKey: string) => {
      if (cellHoldRef.current) clearTimeout(cellHoldRef.current);
      cellHoldRef.current = setTimeout(() => {
          openModal(rIndex, colKey);
          cellHoldRef.current = null;
      }, 3000); // 3 seconds per user request
  };
  const handleCellHoldCancel = () => {
      if (cellHoldRef.current) {
         clearTimeout(cellHoldRef.current);
         cellHoldRef.current = null;
      }
  };

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const pressTimers = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});
  const isLongPress = useRef<{ [key: number]: boolean }>({});
  
  const [toastMessage, setToastMessage] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const allAvailableTags = Array.from(new Set(documents.flatMap(doc => doc.tags || []))).sort();
  const [docSearch, setDocSearch] = useState('');
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  
  
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState('');
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const localSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const latestDocsRef = useRef<GridDocument[]>([]);
  const pendingLocalSaveRef = useRef<boolean>(false);

  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean; action: (() => void) | null; type: 'setup' | 'verify' }>({ isOpen: false, action: null, type: 'verify' });
  const [passwordInput, setPasswordInput] = useState('');
  
  const [appLocked, setAppLocked] = useState(false);
  const [appLockInput, setAppLockInput] = useState('');

  const [authModal, setAuthModal] = useState(false);
  const { user, loading, loginWithGoogle: hookGoogleLogin, loginWithEmail: hookEmailLogin, registerWithEmail: hookEmailRegister, loginAnonymously: hookAnonymousLogin, logout: hookLogout } = useFirebase();
  const [email, setEmail] = useState(() => localStorage.getItem('grid_notepad_saved_email') || '');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const [cloudModal, setCloudModal] = useState(false);
  const [cloudDocToDelete, setCloudDocToDelete] = useState<any>(null);
  const [backupModal, setBackupModal] = useState(false);
  const [gistToken, setGistToken] = useState(localStorage.getItem('grid_notepad_gist_token') || '');
  const [gistId, setGistId] = useState(localStorage.getItem('grid_notepad_gist_id') || '');
  const [gistViewerModal, setGistViewerModal] = useState(false);
  const [gistViewerContent, setGistViewerContent] = useState<string | null>(null);

  const saveToGist = async () => {
      if (!gistToken) return showToast("Ju lutem vendosni një GitHub Token");
      showToast("Duke ruajtur në GitHub Gist...");
      try {
          const content = JSON.stringify(documents);
          let method = 'POST';
          let url = 'https://api.github.com/gists';
          
          if (gistId) {
             method = 'PATCH';
             url = `https://api.github.com/gists/${gistId}`;
          }

          const res = await fetch(url, {
             method,
             headers: {
                'Authorization': `token ${gistToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
             },
             body: JSON.stringify({
                description: 'Grid Notepad Backup',
                public: false,
                files: {
                   'grid_notepad_backup.json': { content }
                }
             })
          });

          if (!res.ok) throw new Error("Gabim gjatë ruajtjes në Gist. Kontrolloni Token-in.");
          const data = await res.json();
          setGistId(data.id);
          localStorage.setItem('grid_notepad_gist_id', data.id);
          localStorage.setItem('grid_notepad_gist_token', gistToken);
          showToast("U ruajt me sukses në GitHub Gist!");
      } catch (err: any) {
          showToast(err.message);
      }
  };

  const viewGistContent = async () => {
      if (!gistId) return showToast("Nuk ka Gist ID. Ruani një herë dokumentet fillimisht.");
      showToast("Duke hapur dokumentin Gist...");
      try {
          const res = await fetch(`https://api.github.com/gists/${gistId}`, {
             headers: gistToken ? {
                'Authorization': `token ${gistToken}`,
                'Accept': 'application/vnd.github.v3+json'
             } : undefined
          });
          if (!res.ok) throw new Error("Gabim gjatë ngarkimit. Gist ID i pavlefshëm.");
          const data = await res.json();
          const file = data.files['grid_notepad_backup.json'];
          if (!file) throw new Error("Skedari nuk u gjet në këtë Gist.");
          
          const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
          setGistViewerContent(content);
          setGistViewerModal(true);
      } catch (err: any) {
          showToast(err.message);
      }
  };

  const loadFromGist = async () => {
      if (!gistToken) return showToast("Ju lutem vendosni një GitHub Token");
      if (!gistId) return showToast("Nuk ka asnjë Gist ID të ruajtur për t'u rikthyer.");
      showToast("Duke ngarkuar nga GitHub Gist...");
      try {
          const res = await fetch(`https://api.github.com/gists/${gistId}`, {
             headers: {
                'Authorization': `token ${gistToken}`,
                'Accept': 'application/vnd.github.v3+json'
             }
          });
          if (!res.ok) throw new Error("Gabim gjatë ngarkimit. Gist ID ose Token i pavlefshëm.");
          const data = await res.json();
          const file = data.files['grid_notepad_backup.json'];
          if (!file) throw new Error("Skedari nuk u gjet në këtë Gist.");
          
          const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
          const parsed = JSON.parse(content);
          
          setDocuments(parsed);
          localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(parsed));
          if (activeDocId) {
             const curr = parsed.find((d: any) => d.id === activeDocId);
             if (curr) {
                 setRows(curr.rows);
                 setHeaders(curr.headers);
             } else {
                 createNewDocument();
             }
          }
          showToast("Të dhënat u rikthyen me sukses nga Gist!");
      } catch (err: any) {
          showToast(err.message);
      }
  };
  const [blueModal, setBlueModal] = useState(false);
  const [blueText, setBlueText] = useState('');
  const [secretList, setSecretList] = useState<{id: string, text: string, done: boolean}[]>([]);
  const [cloudDocs, setCloudDocs] = useState<GridDocument[]>([]);
  const [isFetchingCloud, setIsFetchingCloud] = useState(false);

  const [selectedCloudDocIds, setSelectedCloudDocIds] = useState<string[]>([]);
  const [previewModalDoc, setPreviewModalDoc] = useState<GridDocument | null>(null);
  const [fullViewDoc, setFullViewDoc] = useState<GridDocument | null>(null);
  const fileInputBackupRef = useRef<HTMLInputElement | null>(null);

  const handleUnifiedCloudSync = async () => {
     const mail = (email || localStorage.getItem('grid_notepad_saved_email') || localStorage.getItem('grid_notepad_user_account') || 'genti8319@gmail.com').trim();
     localStorage.setItem('grid_notepad_saved_email', mail);
     localStorage.setItem('grid_notepad_user_account', mail);
     showToast("⚡ Po sinkronizohen dhe përditësohen të dhënat me Google Cloud...");
     const synced = await syncWithGoogleCloud(documents, true);
     await loadFromGoogleCloud(true);
     if (synced) {
        showToast("⚡ Sinkronizimi me Google Cloud u krye me sukses 100%!");
     } else {
        showToast("Të dhënat u ruajtën lokalisht në pajisje.");
     }
  };

  const handleSelectAllCloudDocs = () => {
     if (selectedCloudDocIds.length === documents.length && documents.length > 0) {
        setSelectedCloudDocIds([]);
     } else {
        setSelectedCloudDocIds(documents.map(d => d.id));
     }
  };

  const handleDeleteSelectedCloudDocs = async (docIdToDelete?: string) => {
     const idsToDelete = docIdToDelete ? [docIdToDelete] : selectedCloudDocIds;
     if (idsToDelete.length === 0) {
        showToast("Zgjidhni të paktën një dokument për ta fshirë.");
        return;
     }
     if (!confirm(`Jeni të sigurt që dëshironi të fshini ${idsToDelete.length} dokument(e) nga Cloud dhe notebook?`)) return;

     const newDocs = documents.filter(d => !idsToDelete.includes(d.id));
     setDocuments(newDocs);
     setSelectedCloudDocIds([]);
     localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));

     if (activeDocId && idsToDelete.includes(activeDocId)) {
        if (newDocs.length > 0) openDocument(newDocs[0]);
        else createNewDocument();
     }

     showToast("Dokumentet u fshinë. Po përditësohet Google Cloud...");
     await syncWithGoogleCloud(newDocs, false);
  };

  const handleExportBackup = (docToExport?: GridDocument) => {
     const exportData = docToExport ? [docToExport] : (selectedCloudDocIds.length > 0 ? documents.filter(d => selectedCloudDocIds.includes(d.id)) : documents);
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
     const downloadAnchor = document.createElement('a');
     downloadAnchor.setAttribute("href", dataStr);
     downloadAnchor.setAttribute("download", `notebook_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`);
     document.body.appendChild(downloadAnchor);
     downloadAnchor.click();
     downloadAnchor.remove();
     showToast("Eksportimi i backup-it u përfundua me sukses!");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (event) => {
        try {
           const content = event.target?.result as string;
           const parsed = JSON.parse(content);
           if (Array.isArray(parsed) && parsed.length > 0) {
              const mergedMap = new Map<string, GridDocument>();
              documents.forEach(d => mergedMap.set(d.id, d));
              parsed.forEach((d: any) => {
                 if (d && d.id) mergedMap.set(d.id, d);
              });
              const updated = Array.from(mergedMap.values());
              setDocuments(updated);
              localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(updated));
              showToast(`U importuan me sukses ${parsed.length} dokumente! Po sinkronizohen në Cloud...`);
              await syncWithGoogleCloud(updated, false);
           } else {
              showToast("Skedar backup i pavlefshëm.");
           }
        } catch (err) {
           showToast("Gabim gjatë leximit të skedarit backup.");
        }
     };
     reader.readAsText(file);
  };

  const [aiChatModal, setAiChatModal] = useState(false);
  const [aiChatInput, setAiChatInput] = useState(() => localStorage.getItem('grid_aichat_input') || '');
  const [aiChatResponse, setAiChatResponse] = useState('');
  const [debugLogsModal, setDebugLogsModal] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const appendDebugLog = (msg: string) => {
     const timestamp = new Date().toLocaleTimeString();
     const logEntry = `[${timestamp}] ${msg}`;
     console.log(logEntry);
     setDebugLogs(prev => {
        const updated = [...prev, logEntry].slice(-300);
        try {
           localStorage.setItem('grid_notepad_debug_logs', JSON.stringify(updated));
           window.dispatchEvent(new Event('debug-log-updated'));
        } catch(e) {}
        return updated;
     });
  };

  const getActiveUid = () => {
     return user?.uid || user?.email || localStorage.getItem('grid_notepad_saved_email') || localStorage.getItem('grid_notepad_user_account') || 'genti8319@gmail.com';
  };

  const getApiEndpoints = (path: string): string[] => {
     const savedCustomServer = (localStorage.getItem('grid_notepad_custom_server') || '').trim();
     const customEndpoint = savedCustomServer ? `${savedCustomServer.replace(/\/$/, '')}${path}` : '';

     if (Capacitor.isNativePlatform()) {
        const devOrigin = `https://ais-dev-dva77knoqcna5xt4l6qx7i-4359193177.europe-west1.run.app${path}`;
        const preOrigin = `https://ais-pre-dva77knoqcna5xt4l6qx7i-4359193177.europe-west1.run.app${path}`;
        return Array.from(new Set([customEndpoint, preOrigin, devOrigin].filter(Boolean)));
     }

     const currentOrigin = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')
       ? window.location.origin
       : '';

     const relativePath = path;
     const fullCurrentOrigin = currentOrigin ? `${currentOrigin}${path}` : '';
     return Array.from(new Set([customEndpoint, relativePath, fullCurrentOrigin].filter(Boolean)));
  };

  useEffect(() => {
     const updateLogs = () => {
         try {
             setDebugLogs(JSON.parse(localStorage.getItem('grid_notepad_debug_logs') || '[]'));
         } catch(e){}
     };
     window.addEventListener('debug-log-updated', updateLogs);
     updateLogs();
     return () => window.removeEventListener('debug-log-updated', updateLogs);
  }, []);
  const [userGeminiKey, setUserGeminiKey] = useState<string>(() => localStorage.getItem('grid_notepad_gemini_key') || '');
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiChatImage, setAiChatImage] = useState<string | null>(null);
  const [pendingAiChanges, setPendingAiChanges] = useState<{ documentId: string, newHeaders: string[], newColumnWidths?: number[], newRows: GridRow[] } | null>(null);
  const [aiChatAudio, setAiChatAudio] = useState<string | null>(null);
  const [isRecordingMime, setIsRecordingMime] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const [listeningCell, setListeningCell] = useState<{rIndex: number, colKey: string} | null>(null);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceRecording = (rIndex: number, colKey: string) => {
     if (listeningCell && listeningCell.rIndex === rIndex && listeningCell.colKey === colKey) {
        // Stop listening
        if (recognitionRef.current) recognitionRef.current.stop();
        setListeningCell(null);
        showToast("Dëgjimi u ndal");
        return;
     }

     if (recognitionRef.current) recognitionRef.current.stop();

     const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if (!SpeechRecognition) {
        showToast("Shfletuesi juaj nuk e suporton Voice-to-Text.");
        return;
     }

     const recognition = new SpeechRecognition();
     recognition.lang = 'sq-AL'; // Albanian or auto layout
     recognition.continuous = false;
     recognition.interimResults = false;

     recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Removed colMap, dynamic parsing used
        
        let newRows = [...rows];
        const currentVal = newRows[rIndex][colKey as keyof GridRow] as string;
        newRows[rIndex][colKey as keyof GridRow] = (currentVal + (currentVal ? ' ' : '') + transcript).trim();
        setRows(newRows);
        updateActiveDocumentState(title, newRows, headers);
        showToast("Teksti u shtua!");
        setListeningCell(null);
     };

     recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            console.error("Speech recognition error", event.error);
        }
        if (event.error === 'not-allowed') {
           showToast("Ju lutem lejoni përdorimin e mikrofonit.");
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
           showToast("Gabim në dëgjim.");
        }
        setListeningCell(null);
     };

     recognition.onend = () => {
        setListeningCell(null);
     };

     recognitionRef.current = recognition;
     recognition.start();
     setListeningCell({ rIndex, colKey });
     showToast("Po dëgjojmë... Flisni tani.");
  };


  const [listeningModal, setListeningModal] = useState(false);
  const recognitionModalRef = useRef<any>(null);

  const toggleModalVoiceRecording = () => {
     if (listeningModal) {
        if (recognitionModalRef.current) recognitionModalRef.current.stop();
        setListeningModal(false);
        showToast("Dëgjimi u ndal");
        return;
     }

     if (recognitionModalRef.current) recognitionModalRef.current.stop();

     const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if (!SpeechRecognition) {
        showToast("Shfletuesi juaj nuk e suporton Voice-to-Text.");
        return;
     }

     const recognition = new SpeechRecognition();
     recognition.lang = 'sq-AL';
     recognition.continuous = false;
     recognition.interimResults = false;

     recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setModalText(prev => (prev + (prev ? ' ' : '') + transcript).trim());
        showToast("Teksti u shtua!");
        setListeningModal(false);
     };

     recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            console.error("Speech recognition error", event.error);
        }
        if (event.error === 'not-allowed') {
           showToast("Ju lutem lejoni përdorimin e mikrofonit.");
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
           showToast("Gabim në dëgjim.");
        }
        setListeningModal(false);
     };

     recognition.onend = () => {
        setListeningModal(false);
     };

     recognitionModalRef.current = recognition;
     recognition.start();
     setListeningModal(true);
     showToast("Po dëgjojmë... Flisni tani.");
  };

  const askAi = async (overridePrompt?: string) => {
    const promptText = typeof overridePrompt === 'string' ? overridePrompt : aiChatInput;
    if (!promptText.trim()) return;
    setIsAiThinking(true);
    setAiChatResponse('');
    appendDebugLog(`🤖 [AI Gemini] Po dërgohet kërkesa: "${promptText.slice(0, 70)}..."`);

    try {
       const docsForAi = documents.map(docItem => ({
          ...docItem,
          rows: docItem.rows.map(r => {
             const { image, ...rest } = r;
             return rest;
          })
       }));
       
       const payload = JSON.stringify({ prompt: promptText, documents: docsForAi, activeDocId, image: aiChatImage, audio: aiChatAudio });
       
       const endpoints = getApiEndpoints('/api/ai/chat');

       let response: Response | null = null;
       let lastErrMessage = '';

       for (const ep of endpoints) {
          appendDebugLog(`📡 [AI Gemini] Po provohet lidhja me endpoint: ${ep}`);
          try {
             const res = await fetch(ep, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
             });
             const contentType = res.headers.get('content-type') || '';
             if (res.ok && contentType.includes('application/json')) {
                response = res;
                appendDebugLog(`✅ [AI Gemini] Lidhja me JSON u krye me sukses (HTTP ${res.status}) te: ${ep}`);
                break;
             } else if (res.ok) {
                lastErrMessage = `Endpoint ${ep} ktheu HTML (SPA Fallback) dhe jo JSON.`;
                appendDebugLog(`⚠️ [AI Gemini] Endpoint ${ep} ktheu HTML (SPA Fallback). Po provohet tjetri...`);
             } else {
                const errJson = await res.json().catch(() => ({}));
                lastErrMessage = errJson.error || res.statusText || `HTTP ${res.status}`;
                appendDebugLog(`⚠️ [AI Gemini] Status jo-ok (${res.status}) nga ${ep}: ${lastErrMessage}`);
                if (contentType.includes('application/json')) break;
             }
          } catch(e: any) {
             console.warn("AI chat endpoint error:", ep, e);
             if (!lastErrMessage) lastErrMessage = e.message || "Bllokim i rrjetit / CORS";
             appendDebugLog(`❌ [AI Gemini] Gabim lidhje me ${ep}: ${e.message || 'Gabim'}`);
          }
       }

       let data: any = null;
       let clientErrorMsg = '';

       if (response && response.ok) {
          data = await response.json();
       } else {
          // Direct Client-Side Gemini Call Fallback (for APK / Offline / HTML SPA fallback)
          let activeApiKey = userGeminiKey || localStorage.getItem('grid_notepad_gemini_key') || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

          if (activeApiKey) {
             appendDebugLog(`🔄 [AI Gemini REST Direct] Po përdoret çelësi API: ${activeApiKey.slice(0, 6)}...`);
             const systemInstruction = `Ti je një asistent AI për një aplikacion Bllok/Notepad, i jepur pas analizës inteligjente, matematikës dhe përmbledhjeve të çdo lloj blloku që përdoruesi krijon. Përdoruesi po të jep akses të plotë tek TË GJITHA DOKUMENTAT në PLATFORMË.
Këtu janë të dhënat e dokumenteve aktualë në formatin JSON:
${JSON.stringify(docsForAi, null, 2)}

Dokumenti aktual aktiv që përdoruesi po shikon është me ID: "${activeDocId}". Ofroni përgjigjen duke u bazuar plotësisht në KËTË DOKUMENT.

TI GJITHMONË DUHET TË KTHESH PËRGJIGJEN TËNDE NË FORMATIN JSON SI MË POSHTË:
{
  "text": "Teksti i përgjigjes tënde për përdoruesin dhe/ose raporti i llogaritjeve",
  "actions": [
    {
       "type": "PROPOSE_COLUMNS_CHANGE",
       "documentId": "id_e_dokumentit_qe_po_ndryshon",
       "newHeaders": ["Data", "Emri", "Sasia (kg)", "Cmimi", "Vlera"],
       "newColumnWidths": [120, 200, 100, 100, 150],
       "newRows": []
    },
    {
       "type": "UPDATE_DOCUMENT_ROWS",
       "documentId": "id_e_dokumentit_qe_po_ndryshon",
       "newRows": []
    }
  ]
}
Kthe VETËM JSON të vlefshëm pa koodblock markdown!`;

             const parts: any[] = [{ text: promptText || 'Analizo bllokun mun' }]; 
             if (aiChatImage && aiChatImage.includes(',')) { 
               const b = aiChatImage.split(',')[1]; 
               const m = aiChatImage.split(';')[0].split(':')[1]; 
               parts.push({ inlineData: { data: b, mimeType: m } }); 
             } 
             if (aiChatAudio && aiChatAudio.includes(',')) { 
               const b = aiChatAudio.split(',')[1]; 
               const m = aiChatAudio.split(';')[0].split(':')[1]; 
               parts.push({ inlineData: { data: b, mimeType: m } }); 
             } 

             const reqBody = {
                contents: [{ role: 'user', parts }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                   temperature: 0.2,
                   responseMimeType: 'application/json'
                }
             };

             const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];

             // First try official @google/genai Client SDK
             try {
                appendDebugLog(`📡 [AI Gemini Client SDK] Po startohet GoogleGenAI SDK...`);
                const aiClient = new GoogleGenAI({ apiKey: activeApiKey.trim() });
                for (const modelName of candidateModels) {
                   try {
                      appendDebugLog(`📡 [AI Gemini Client SDK] Po provohet model: ${modelName}`);
                      const responseGen = await aiClient.models.generateContent({
                         model: modelName,
                         contents: parts,
                         config: {
                            systemInstruction,
                            temperature: 0.2,
                            responseMimeType: 'application/json'
                         }
                      });

                      let rawText = responseGen.text || '{}';
                      rawText = rawText.trim();
                      if (rawText.startsWith('```')) {
                         rawText = rawText.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
                      }
                      try {
                         data = JSON.parse(rawText);
                      } catch(pe) {
                         data = { text: responseGen.text || 'Analiza u krye me sukses.' };
                      }
                      appendDebugLog(`✅ [AI Gemini Client SDK] Sukses me modelin: ${modelName}`);
                      break;
                   } catch(mErr: any) {
                      console.warn(`Client SDK model ${modelName} failed:`, mErr);
                      const rawMsg = mErr.message || String(mErr);
                      clientErrorMsg = rawMsg;
                      appendDebugLog(`⚠️ [AI Gemini Client SDK] Modeli ${modelName} dështoi: ${clientErrorMsg}`);
                      
                      const errStr = rawMsg.toLowerCase();
                      if (errStr.includes('api key') || errStr.includes('api_key') || errStr.includes('unauthenticated') || errStr.includes('invalid key') || errStr.includes('key not valid') || errStr.includes('not authorized')) {
                         clientErrorMsg = "Çelësi i API-t (API Key) që keni vendosur nuk është i vlefshëm ose nuk është aktivizuar akoma.";
                         appendDebugLog(`❌ [AI Gemini Client SDK] Gabim kritik me Çelësin API. Ndalohet kërkimi.`);
                         break;
                      }
                   }
                }
             } catch(sdkErr: any) {
                console.warn("SDK init failed:", sdkErr);
                clientErrorMsg = sdkErr.message || String(sdkErr);
             }

             if (!data && !(clientErrorMsg && (clientErrorMsg.includes("Çelësi") || clientErrorMsg.includes("vlefshëm")))) {
                for (const modelName of candidateModels) {
                try {
                   appendDebugLog(`📡 [AI Gemini Direct REST] Po dërgohet te model ${modelName}...`);
                   const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(activeApiKey.trim())}`;
                   const restRes = await fetch(directUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(reqBody)
                   });

                   if (restRes.ok) {
                      const restJson = await restRes.json();
                      const rawText = restJson?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                      let cleanText = rawText.trim();
                      if (cleanText.startsWith('```')) {
                         cleanText = cleanText.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
                      }
                      try {
                         data = JSON.parse(cleanText);
                      } catch(pe) {
                         data = { text: rawText || 'Analiza u krye me sukses.' };
                      }
                      appendDebugLog(`✅ [AI Gemini Direct REST] Sukses me modelin: ${modelName}`);
                      break;
                   } else {
                      const errObj = await restRes.json().catch(() => ({}));
                      const rawMsg = errObj?.error?.message || `HTTP ${restRes.status}`;
                      clientErrorMsg = rawMsg;
                      appendDebugLog(`⚠️ [AI Gemini Direct REST] Modeli ${modelName} ktheu gabim: ${clientErrorMsg}`);
                      
                      const errStr = rawMsg.toLowerCase();
                      if (errStr.includes('api key') || errStr.includes('api_key') || errStr.includes('unauthenticated') || errStr.includes('invalid key') || errStr.includes('key not valid') || restRes.status === 400 || restRes.status === 403 || restRes.status === 401) {
                         clientErrorMsg = "Çelësi i API-t (API Key) që keni vendosur nuk është i vlefshëm ose nuk është aktivizuar akoma.";
                         appendDebugLog(`❌ [AI Gemini Direct REST] Gabim kritik me Çelësin API. Ndalohet kërkimi.`);
                         break;
                      }
                   }
                } catch(e: any) {
                   console.warn(`Direct Gemini REST model ${modelName} failed:`, e);
                   clientErrorMsg = e.message || 'Gabim lidhje me Google API';
                }
             }

             }

             if (!data && clientErrorMsg) {
                appendDebugLog(`❌ [AI Gemini Direct REST] Të gjitha modelet dështuan: ${clientErrorMsg}`);
                if (clientErrorMsg.includes('API key') || clientErrorMsg.includes('UNAUTHENTICATED') || clientErrorMsg.includes('invalid') || clientErrorMsg.includes('vlefshëm')) {
                   setShowKeyConfig(true);
                   showToast("⚠️ Çelësi i Gemini API nuk është i vlefshëm. Ju lutem shkruani një çelës të ri.");
                }
             }
          }

          if (!data) {
             if (clientErrorMsg) {
                throw new Error(`Gabim nga Google Gemini API: ${clientErrorMsg}`);
             } else if (!activeApiKey) {
                setShowKeyConfig(true);
                throw new Error("⚠️ Nuk u arrit lidhja me serverin e AI (APK/Offline) dhe nuk keni vendosur një Gemini API Key personale. Ju lutem merrni një çelës falas në Google AI Studio dhe vendoseni te cilësimet (ikona ⚙️).");
             } else {
                throw new Error(lastErrMessage || "Nuk u arrit lidhja me AI Gemini. Ju lutem kontrolloni lidhjen tuaj.");
             }
          }
       }

       if (data) {
          setAiChatResponse(data.text || "Përgjigjja nga AI Gemini u mor me sukses.");
          appendDebugLog(`🎉 [AI Gemini] Marrë përgjigja me sukses. Teksti: ${data.text ? data.text.slice(0, 100) : 'Përgjigje pa tekst'}`);
          
          if (data.actions && Array.isArray(data.actions)) {
             data.actions.forEach((act: any) => {
                 if (act.type === 'PROPOSE_COLUMNS_CHANGE' && act.documentId) {
                     setDocuments(prevDocs => prevDocs.map(d => {
                         if (d.id === act.documentId) {
                             return {
                                 ...d,
                                 headers: act.newHeaders || d.headers,
                                 columnWidths: act.newColumnWidths || d.columnWidths,
                                 rows: act.newRows || d.rows,
                                 updatedAt: new Date().toISOString()
                             };
                         }
                         return d;
                     }));
                     if (act.documentId === activeDocIdRef.current) {
                         if (act.newHeaders) setHeaders(act.newHeaders);
                         if (act.newColumnWidths) setColumnWidths(act.newColumnWidths);
                         if (act.newRows) setRows(act.newRows);
                     }
                     showToast("Kolonat dhe rrjeshtat u përditësuan nga AI!");
                     appendDebugLog(`✏️ [AI Gemini] U përditësuan kolonat dhe rrjeshtat për dokumentin ID: ${act.documentId}`);
                 } else if (act.type === 'UPDATE_DOCUMENT_ROWS' && act.documentId) {
                     setDocuments(prevDocs => prevDocs.map(d => {
                         if (d.id === act.documentId) {
                             return {
                                 ...d,
                                 rows: act.newRows || d.rows,
                                 updatedAt: new Date().toISOString()
                             };
                         }
                         return d;
                     }));
                     if (act.documentId === activeDocIdRef.current && act.newRows) {
                         setRows(act.newRows);
                     }
                     showToast("Rrjeshtat u përditësuan nga AI Gemini!");
                     appendDebugLog(`✏️ [AI Gemini] U përditësuan rrjeshtat për dokumentin ID: ${act.documentId}`);
                 }
             });
          }
       } else {
          const errMsg = `Gabim gjatë komunikimit me AI Gemini: ${lastErrMessage || 'Sistemi nuk mund t\'i përgjigjej kërkesës.'}`;
          setAiChatResponse(errMsg);
          appendDebugLog(`❌ [AI Gemini] ${errMsg}`);
       }
    } catch (err: any) {
       const errMsg = "Gabim i papritur: " + err.message;
       setAiChatResponse(errMsg);
       appendDebugLog(`💥 [AI Gemini] ${errMsg}`);
    }
    setIsAiThinking(false);
    setAiChatInput('');
    setAiChatImage(null);
    setAiChatAudio(null);
  };


  const startRecordingAiAudio = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = e => {
           if(e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
           const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           const reader = new FileReader();
           reader.readAsDataURL(blob);
           reader.onloadend = () => {
              setAiChatAudio(reader.result as string);
           };
        };
        mediaRecorder.start();
        setIsRecordingMime(true);
    } catch(err) {
        showToast("Nuk mund të hapet mikrofoni.");
    }
  };

  const stopRecordingAiAudio = () => {
      if(mediaRecorderRef.current && isRecordingMime) {
           mediaRecorderRef.current.stop();
           mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
           setIsRecordingMime(false);
      }
  };

  const handleAiChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
         const reader = new FileReader();
         reader.onload = ev => setAiChatImage(ev.target?.result as string);
         reader.readAsDataURL(file);
      }
  };

   const syncWithGoogleCloud = async (docsToSync?: GridDocument[], silent = false) => {
    const docs = docsToSync || documents;
    const uid = getActiveUid() || 'genti8319@gmail.com';
    appendDebugLog(`☁️ [Google Cloud Sync] Po ngarkohen ${docs.length} dokumente për përdoruesin: ${uid}`);

    const payload = JSON.stringify({
      userId: uid,
      documents: docs,
      blueText,
      secretList,
      pin: localStorage.getItem('grid_notepad_pin') || null
    });

    const endpoints = getApiEndpoints('/api/cloud/sync');

    let success = false;
    for (const ep of endpoints) {
      appendDebugLog(`📡 [Google Cloud Sync] Po provohet lidhja me endpoint: ${ep}`);
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          success = true;
          appendDebugLog(`✅ [Google Cloud Sync] Ruajtja u krye me sukses në Google Cloud (HTTP ${res.status}) te: ${ep}`);
          break;
        } else if (res.ok) {
          appendDebugLog(`⚠️ [Google Cloud Sync] Endpoint ${ep} ktheu HTML (SPA Fallback) e jo JSON. Po provohet tjetri...`);
        } else {
          appendDebugLog(`⚠️ [Google Cloud Sync] Status jo-ok (${res.status}) nga ${ep}`);
        }
      } catch (e: any) {
        console.warn("Google Cloud sync error:", ep, e);
        appendDebugLog(`❌ [Google Cloud Sync] Gabim lidhje me ${ep}: ${e.message}`);
      }
    }

    if (!silent) {
       if (success) {
          showToast("⚡ Të dhënat u sinkronizuan me sukses në Google Cloud!");
       } else {
          showToast("U ruajtën lokalisht në pajisje.");
       }
    }
    return success;
  };

  const loadFromGoogleCloud = async (silent = false) => {
    setIsFetchingCloud(true);
    const uid = getActiveUid() || 'genti8319@gmail.com';
    appendDebugLog(`☁️ [Google Cloud Load] Po shkarkohen dokumentet nga serveri për: ${uid}`);

    const endpoints = getApiEndpoints(`/api/cloud/load?userId=${encodeURIComponent(uid)}`);

    let loadedData: any = null;
    for (const ep of endpoints) {
      appendDebugLog(`📡 [Google Cloud Load] Po kërkohet nga endpoint: ${ep}`);
      try {
        const res = await fetch(ep);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.documents && json.documents.length > 0) {
            loadedData = json;
            appendDebugLog(`✅ [Google Cloud Load] U morën ${json.documents.length} dokumente nga Google Cloud server!`);
            break;
          } else {
             appendDebugLog(`ℹ️ [Google Cloud Load] Përgjigje me sukses por nuk u gjetën dokumente për ${uid}`);
          }
        } else if (res.ok) {
           appendDebugLog(`⚠️ [Google Cloud Load] Endpoint ${ep} ktheu HTML e jo JSON. Po provohet tjetri...`);
        } else {
           appendDebugLog(`⚠️ [Google Cloud Load] Status jo-ok (${res.status}) nga ${ep}`);
        }
      } catch (e: any) {
        console.warn("Google Cloud load error:", ep, e);
        appendDebugLog(`❌ [Google Cloud Load] Gabim lidhje me ${ep}: ${e.message}`);
      }
    }

    if (loadedData && loadedData.documents) {
      setDocuments(loadedData.documents);
      setCloudDocs(loadedData.documents);
      localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(loadedData.documents));

      if (loadedData.blueText !== undefined) {
         setBlueText(loadedData.blueText);
         localStorage.setItem('grid_notepad_blue', loadedData.blueText);
      }
      if (loadedData.secretList) {
         setSecretList(loadedData.secretList);
         localStorage.setItem('grid_notepad_secret_list', JSON.stringify(loadedData.secretList));
      }
      if (loadedData.pin) {
         localStorage.setItem('grid_notepad_pin', loadedData.pin);
      }
      setIsFetchingCloud(false);
      if (!silent) showToast("⚡ Dokumentet u shkarkuan me sukses nga Google Cloud!");
      return true;
    }

    // Fallback to Firestore if custom cloud has no docs
    if (user) {
       try {
          const q = query(collection(db, 'documents'), where('userId', '==', user.uid));
          const snapshot = await getDocs(q);
          const cloudData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as GridDocument));
          if (cloudData.length > 0) {
              setDocuments(cloudData);
              setCloudDocs(cloudData);
              localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(cloudData));
              setIsFetchingCloud(false);
              if (!silent) showToast("Dokumentet u rikthyen nga Firestore!");
              return true;
          }
       } catch (e) {}
    }

    setIsFetchingCloud(false);
    if (!silent) showToast("Nuk u gjet asnjë dokument në Cloud.");
    return false;
  };

  const fetchCloudDocs = async (uid: string) => {
     await loadFromGoogleCloud(true);
  };

  const confirmDeleteCloudDoc = async () => {
     if (!cloudDocToDelete) return;
     try {
        await deleteDoc(doc(db, 'documents', cloudDocToDelete.id));
        setCloudDocs(prev => prev.filter(d => d.id !== cloudDocToDelete.id));
        setDocuments(prev => {
            const updated = prev.filter(d => d.id !== cloudDocToDelete.id);
            localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(updated));
            return updated;
        });
        if (activeDocId === cloudDocToDelete.id) {
            createNewDocument();
        }
        showToast("Dokumenti u fshi përgjithmonë nga Cloud dhe pajisja.");
     } catch (e) {
        showToast("Gabim gjatë fshirjes nga Cloud.");
     }
     setCloudDocToDelete(null);
  };

  const openCloudModal = () => {
     executeProtectedAction(() => {
        setCloudModal(true);
        const currentUser = auth.currentUser;
        if (currentUser) {
           fetchCloudDocs(getActiveUid()!);
        }
     });
  };

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
        if (result && result.user) {
            localStorage.setItem('grid_cloud_sync_freq', '5000');
            setCloudSyncFrequency(5000);
            localStorage.removeItem('grid_notepad_custom_uid');
            showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua automatikisht!");
            setTimeout(() => forceCloudBackup(), 1500);
        }
    }).catch(console.error);

    // Auto-login fallback for Capacitor environments that might wipe IndexedDB
    const savedEmail = localStorage.getItem('grid_notepad_saved_email');
    const savedPwd = localStorage.getItem('grid_notepad_saved_pwd');
    if (savedEmail && savedPwd && !auth.currentUser) {
        signInWithEmailAndPassword(auth, savedEmail, savedPwd).catch(() => {});
    }

    const savedPassword = localStorage.getItem('grid_notepad_pin');
    if (savedPassword) {
       setAppLocked(true);
    }
    const savedOrange = localStorage.getItem('grid_notepad_blue');
    if (savedOrange) {
       setBlueText(savedOrange);
    }
    const savedSecretList = localStorage.getItem('grid_notepad_secret_list');
    if (savedSecretList) {
       try { setSecretList(JSON.parse(savedSecretList)); } catch(e){}
    }





// Auth data fetching now driven by useFirebase hook user state
  }, []);

  useEffect(() => {
     if (user) {
         const fetchCloudData = async () => {
           try {
               const q = query(collection(db, 'documents'), where('userId', '==', localStorage.getItem('grid_notepad_custom_uid') || user.uid));
               const snaps = await getDocs(q);
               const fetched: GridDocument[] = [];
               snaps.forEach(s => {
                  const data = s.data();
                  if (data) fetched.push(data as GridDocument);
               });
               
               setDocuments(prevLocal => {
                   const mergedMap = new Map<string, GridDocument>();
                   prevLocal.forEach(d => mergedMap.set(d.id, d));
                   
                   fetched.forEach(d => {
                       const existing = mergedMap.get(d.id);
                       if (!existing || new Date(d.updatedAt) > new Date(existing.updatedAt)) {
                           mergedMap.set(d.id, d);
                       }
                   });
                   
                   const newMerged = Array.from(mergedMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                   localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newMerged));
                   
                   
                 // Nese kemi nje dokument hapur, e perditesojme nese erdhi i ri nga cloud
                 const currActiveId = activeDocIdRef.current;
                 if (currActiveId) {
                     const currentViewingDoc = newMerged.find(x => x.id === currActiveId);
                     const oldViewingDoc = prevLocal.find(x => x.id === currActiveId);
                     if (currentViewingDoc && oldViewingDoc && currentViewingDoc.updatedAt !== oldViewingDoc.updatedAt) {
                         // We use a custom event or a setState callback workaround, but React states inside prevLocal setter 
                         // shouldn't trigger other state updates directly if possible, or they can.
                         // P.sh.:
                         setTimeout(() => {
                             window.dispatchEvent(new CustomEvent('cloud-doc-updated', { detail: currentViewingDoc }));
                         }, 10);
                     }
                 }

                 // Push any newer local docs to cloud silently
                   newMerged.forEach(async (docObj) => {
                       const cloudVersion = fetched.find(c => c.id === docObj.id);
                       if (!cloudVersion || new Date(docObj.updatedAt) > new Date(cloudVersion.updatedAt)) {
                           try {
                               await setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: localStorage.getItem('grid_notepad_custom_uid') || user.uid });
                           } catch (e) { console.error("Auto sync push error", e); }
                       }
                   });
                   
                   return newMerged;
               });
           } catch (err) {
               console.error("Auto sync fetch error", err);
           }
         };
         fetchCloudData();
     }
  }, [user]);

  // Periodic Auto-Backup to LocalStorage
  useEffect(() => {
     const interval = setInterval(() => {
         if (documents.length > 0) {
             localStorage.setItem('grid_notepad_documents_v2_backup_interval', JSON.stringify(documents));
             if (blueText) {
                 localStorage.setItem('grid_notepad_blue_backup_interval', blueText);
             }
             
             setIsSaving(true);
             setAutoSaveMsg(t('Ruajtur lokalisht (Backup)', 'Saved locally (Backup)'));
             
             
             setTimeout(() => {
                 setIsSaving(false);
                 setAutoSaveMsg('');
             }, 3000);
         }
     }, 60000); // every 60 seconds
     return () => clearInterval(interval);
  }, [documents, blueText]);



  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isSignUp) {
              await hookEmailRegister(email, password);
              showToast("Llogaria u krijua me sukses! Sinkronizimi Cloud u aktivizua.");
          } else {
              await hookEmailLogin(email, password);
              showToast("Hyrje e suksesshme! Sinkronizimi Cloud u aktivizua.");
              // Auto-restore if local docs are empty (e.g. new phone)
              if (documents.length === 0 || (documents.length === 1 && documents[0].rows.length === 0)) {
                  setTimeout(() => handleFullCloudRestore(), 1000);
              }
          }
          
          localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);
          localStorage.removeItem('grid_notepad_custom_uid'); 
          
          localStorage.setItem('grid_cloud_sync_freq', '5000');
          setCloudSyncFrequency(5000);
          
          setAuthModal(false);
          setPassword('');
          
          setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
          console.error("Email auth err:", err);
          let msg = "Gabim: " + err.message;
          if (err.code === 'auth/email-already-in-use') {
             try {
                 showToast("Kjo llogari ekziston! Po kyçeni automatikisht...");
                 await hookEmailLogin(email, password);
                 showToast("Hyrje e suksesshme me llogarinë tuaj!");
                 localStorage.setItem('grid_notepad_saved_email', email);
                 localStorage.setItem('grid_notepad_saved_pwd', password);
                 localStorage.removeItem('grid_notepad_custom_uid'); 
                 localStorage.setItem('grid_cloud_sync_freq', '5000');
                 setCloudSyncFrequency(5000);
                 setAuthModal(false);
                 setPassword('');
                 if (documents.length === 0 || (documents.length === 1 && documents[0].rows.length === 0)) {
                    setTimeout(() => handleFullCloudRestore(), 1000);
                 } else {
                    setTimeout(() => forceCloudBackup(), 1500);
                 }
                 return;
             } catch (loginErr: any) {
                 setIsSignUp(false);
                 alert("Kjo llogari ekziston tashmë! Paneli kaloi automatikisht tek 'Login' (Hyrje). Ju lutem vendosni fjalëkalimin tuaj për t'u kyçur.");
                 return;
             }
          }
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi duhet të ketë të paktën 6 karaktere.";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
             msg = "Kredenciale të gabuara! Nëse jeni regjistruar me Google, klikoni butonin Google.";
          }
          if (err.code === 'auth/operation-not-allowed') {
             msg = "Kujdes: Hyrja me Email/Password nuk është e aktivizuar!\n\nJu lutem shkoni tek Firebase Console:\n1. Authentication\n2. Sign-in method\n3. Aktivizoni 'Email/Password'";
             alert(msg);
             return;
          }
          if (err.code === 'auth/network-request-failed') {
             msg = "Nuk ka lidhje interneti ose u bllokua kërkesa! Sigurohuni që pajisja ka akses.";
          }
          
          showToast(msg);
      }
  };

  const loginWithGoogle = async () => {
      try {
         const googleUser = await hookGoogleLogin();
         if (googleUser === null) {
            // This means a redirect was started! So we wait.
            showToast("Po ju ridrejtojmë tek Google për hyrje...");
            return;
         }
         localStorage.setItem('grid_cloud_sync_freq', '5000');
         setCloudSyncFrequency(5000);
         localStorage.removeItem('grid_notepad_custom_uid'); 
         setAuthModal(false);
         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua.");
         if (documents.length === 0 || (documents.length === 1 && documents[0].rows.length === 0)) {
            setTimeout(() => handleFullCloudRestore(), 1000);
         } else {
            setTimeout(() => forceCloudBackup(), 1500);
         }
      } catch (err: any) {
         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
             showToast("Dritarja u mbyll! Provoni përsëri ose përdorni hyrjen me Email/Password.");
         } else if (err.code === 'auth/operation-not-allowed') {
             alert("Kujdes: Hyrja me Google nuk është e aktivizuar në Firebase!\n\nJu lutem shkoni tek Firebase Console -> Authentication -> Sign-in method dhe aktivizoni 'Google'.");
         } else {
             alert("Gabim gjatë hyrjes me Google:\n" + err.message + "\n\nNëse jeni në APK/Android, përdorni 'Aktivizo Cloud Menjëherë (Fast Cloud)' ose Email/Password për të qëndruar brenda aplikacionit APK!");
         }
      }
  };

  const handleAnonymousAuth = async () => {
      try {
          showToast("Po lidhemi me Cloud...");
          await hookAnonymousLogin();
          showToast("Hyrje e shpejtë e suksesshme! Llogaria Cloud u aktivizua.");
          localStorage.setItem('grid_cloud_sync_freq', '5000');
          setCloudSyncFrequency(5000);
          localStorage.removeItem('grid_notepad_custom_uid');
          setAuthModal(false);
          if (documents.length === 0 || (documents.length === 1 && documents[0].rows.length === 0)) {
             setTimeout(() => handleFullCloudRestore(), 1000);
          } else {
             setTimeout(() => forceCloudBackup(), 1500);
          }
      } catch (err: any) {
          showToast("Gabim gjatë lidhjes me Cloud: " + err.message);
      }
  };
  



  const executeProtectedAction = (action: () => void) => {
      const savedPassword = localStorage.getItem('grid_notepad_pin');
      if (!savedPassword) {
          setPasswordModal({ isOpen: true, action, type: 'setup' });
      } else {
          setPasswordModal({ isOpen: true, action, type: 'verify' });
      }
  };

  const handlePinSubmit = () => {
      const savedPassword = localStorage.getItem('grid_notepad_pin');
      if (passwordModal.type === 'setup') {
         if (passwordInput.length < 4) {
             alert('Kodi Password duhet të jetë të paktën 4 shifra!');
             return;
         }
         localStorage.setItem('grid_notepad_pin', passwordInput);
         setPasswordModal({ isOpen: false, action: null, type: 'verify' });
         setPasswordInput('');
         if (passwordModal.action) passwordModal.action();
         showToast('Password u krijua me sukses!');
      } else {
         if (passwordInput === savedPassword) {
             setPasswordModal({ isOpen: false, action: null, type: 'verify' });
             setPasswordInput('');
             if (passwordModal.action) passwordModal.action();
         } else {
             alert('Password i gabuar!');
             setPasswordInput('');
         }
      }
  };

  const handleForgotPassword = () => {
       const savedPassword = localStorage.getItem('grid_notepad_pin');
       if (!savedPassword) return;
       const email = user?.email || 'kutinë tuaj të postës';
       showToast(`Sistem: Email me Password-in tuaj u dërgua në ${email} fshehurazi me siguri të plotë. Kontrolloni inbox-in.`);
  };

  useEffect(() => {
      const closeAll = () => {
          setCloudModal(false);
          setAuthModal(false);
          setBackupModal(false);
          setPasswordModal(prev => ({...prev, isOpen: false}));
          setActiveCell(null);
          setBlueModal(false);
      };
      window.addEventListener('close-all-modals', closeAll);
      return () => window.removeEventListener('close-all-modals', closeAll);
  }, []);
  
  useEffect(() => {
     if (auth.currentUser && navigator.onLine) {
        const t = setTimeout(() => {
           const blueRef = doc(db, 'settings', getActiveUid()!);
           setDoc(blueRef, { 
               blueText, 
               secretList,
               userId: getActiveUid()!, 
               pin: localStorage.getItem('grid_notepad_pin') || null 
           }, { merge: true }).catch(()=>{});
        }, 1500);
        return () => clearTimeout(t);
     }
  }, [blueText, secretList]);



  const triggerAutoSave = (updatedDocs: GridDocument[]) => {
      latestDocsRef.current = updatedDocs;
      pendingLocalSaveRef.current = true;
      
      setAutoSaveMsg('Duke u ruajtur...');
      
      if (localSaveTimeout.current) clearTimeout(localSaveTimeout.current);
      localSaveTimeout.current = setTimeout(() => {
          localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(updatedDocs));
          pendingLocalSaveRef.current = false;
          
          const freq = parseInt(localStorage.getItem('grid_cloud_sync_freq') || '3000', 10);
          if (freq === -1 || !navigator.onLine) {
             setAutoSaveMsg('U ruajt lokalisht');
             setTimeout(() => setAutoSaveMsg(''), 1500);
          }
      }, 300);

      const freq = parseInt(localStorage.getItem('grid_cloud_sync_freq') || '3000', 10);
      if (freq === -1) return; // Off

      setIsSaving(true);
      
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = setTimeout(async () => {
         if (navigator.onLine) {
            await syncWithGoogleCloud(updatedDocs, true);
         }
         setIsSaving(false);
         setAutoSaveMsg('Ruajtur në Cloud');
         setTimeout(() => setAutoSaveMsg(''), 2000);
      }, freq);
  };

  useEffect(() => {
     latestDocsRef.current = documents;
  }, [documents]);

  useEffect(() => {
     const handleCloudUpdate = (e: any) => {
         const docObj = e.detail;
         if (docObj && docObj.id === activeDocIdRef.current) {
             setRows(docObj.rows);
             setHeaders(docObj.headers);
             setTitle(docObj.title);
             if (docObj.columnWidths) setColumnWidths(docObj.columnWidths);
             if (docObj.tags) setActiveTags(docObj.tags);
             showToast("Dokumenti u përditësua nga Cloud.");
         }
     };
     window.addEventListener('cloud-doc-updated', handleCloudUpdate);
     return () => window.removeEventListener('cloud-doc-updated', handleCloudUpdate);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
       if (pendingLocalSaveRef.current) {
           localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(latestDocsRef.current));
       }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
     const handleOnline = () => {
        showToast("📶 Lidhja me Internet u rikthye! Po sinkronizohen dokumentet me Google Cloud...");
        syncWithGoogleCloud(documents, true);
     };
     window.addEventListener('online', handleOnline);
     return () => window.removeEventListener('online', handleOnline);
  }, [documents]);

  useEffect(() => {
     if (activeDocId) {
        localStorage.setItem('grid_notepad_active_doc_id', activeDocId);
     } else {
        localStorage.removeItem('grid_notepad_active_doc_id');
     }
  }, [activeDocId]);

  useEffect(() => {
    const savedDocs = localStorage.getItem('grid_notepad_documents_v2');
    const savedTheme = localStorage.getItem('grid_notepad_theme');
    const savedAccent = localStorage.getItem('grid_notepad_accent') as keyof typeof COLOR_THEMES;
    
    if (savedAccent && COLOR_THEMES[savedAccent]) {
       setAccentColor(savedAccent);
    }
    
    // Initial theme setup handled by the new themeSync useEffect
    
    if (savedDocs) {
       const parsedDocs = JSON.parse(savedDocs);
       setDocuments(parsedDocs);
       
       const lastActiveDocId = localStorage.getItem('grid_notepad_active_doc_id');
       if (lastActiveDocId) {
          const matchedDoc = parsedDocs.find((d: any) => d.id === lastActiveDocId);
          if (matchedDoc) {
             setActiveDocId(matchedDoc.id);
             setTitle(matchedDoc.title);
             setActiveTags(matchedDoc.tags || []);
             setHeaders(matchedDoc.headers);
             setColumnWidths(matchedDoc.columnWidths || []);
             
             const newRows = [...matchedDoc.rows];
             const hasContent = (r: GridRow) => (matchedDoc.headers.some((_, i) => (r[`col${i+1}`] || '').toString().trim()) || r.image) ? true : false;
             if (newRows.length > 0) {
                 const firstRowIsUsed = hasContent(newRows[0]) || (newRows[0].status && newRows[0].status !== 'none');
                 if (firstRowIsUsed) {
                     const firstEmptyIndex = newRows.findIndex(r => !hasContent(r) && r.status === 'none' && !r.image);
                     if (firstEmptyIndex !== -1) {
                         const emptyRow = newRows.splice(firstEmptyIndex, 1)[0];
                         newRows.unshift(emptyRow);
                     } else {
                         newRows.unshift({ id: `row-${Date.now()}-first`, status: 'none', image: '' });
                     }
                 }
             }
             setRows(newRows);
          }
       }
    } else {
       // Migrate from older version if exists
       const oldRows = localStorage.getItem('grid_notepad_rows');
       const oldHeaders = localStorage.getItem('grid_notepad_headers');
       if (oldRows) {
          const doc: GridDocument = {
             id: `doc-${Date.now()}`,
             title: 'Struktura e Vjetër',
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString(),
             headers: oldHeaders ? JSON.parse(oldHeaders) : ['Kolona 1', 'Kolona 2', 'Kolona 3', 'Kolona 4'],
             rows: JSON.parse(oldRows)
          };
          setDocuments([doc]);
          localStorage.setItem('grid_notepad_documents_v2', JSON.stringify([doc]));
       }
    }
  }, []);

  // Auto-restore docs if empty on login (e.g. fresh phone install)
  useEffect(() => {
    if (user && !loading) {
       const docs = JSON.parse(localStorage.getItem('grid_notepad_documents_v2') || '[]');
       if (docs.length === 0 || (docs.length === 1 && docs[0].rows.length === 0)) {
           // We are empty and logged in. Wait for online status.
           if (navigator.onLine) {
               console.log("Auto-restoring from cloud since local docs are empty...");
               handleFullCloudRestore();
           }
       }
    }
  }, [user, loading]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = COLOR_THEMES[accentColor];
    root.style.setProperty('--accent-50', theme[50]);
    root.style.setProperty('--accent-400', theme[400]);
    root.style.setProperty('--accent-500', theme[500]);
    root.style.setProperty('--accent-600', theme[600]);
    root.style.setProperty('--accent-700', theme[700]);
    localStorage.setItem('grid_notepad_accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (themeSync) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mediaQuery.matches);
        if (mediaQuery.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        
        const handleChange = (e: MediaQueryListEvent) => {
            setIsDark(e.matches);
            if (e.matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
        const savedTheme = localStorage.getItem('grid_notepad_theme');
        if (savedTheme === 'light') {
          setIsDark(false);
          document.documentElement.classList.remove('dark');
        } else {
          setIsDark(true);
          document.documentElement.classList.add('dark');
        }
    }
  }, [themeSync]);

  const toggleTheme = () => {
    if (themeSync) {
        setThemeSync(false);
        localStorage.setItem('grid_theme_sync', 'false');
    }
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('grid_notepad_theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const safeFormatDate = (dateVal: any, fmt: string) => {
    try {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return format(d, fmt);
    } catch (e) {
      return '';
    }
  };

  const getEmptyRows = () => {
    return Array.from({length: 90}, (_, i) => ({ 
      id: `row-${i}`, status: 'none' as const, image: '' 
    }));
  };

  const updateActiveDocumentState = (newTitle: string, newRows: GridRow[], newHeaders: string[], newWidths: number[] = columnWidths, newTags: string[] = activeTags) => {
     let updatedDocs = [...documents];
     const existingDocIndex = updatedDocs.findIndex(d => d.id === activeDocId);
     
     const updatedDoc = {
        id: activeDocId!,
        title: newTitle,
        createdAt: existingDocIndex >= 0 ? updatedDocs[existingDocIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        headers: newHeaders,
        columnWidths: newWidths,
        rows: newRows,
        tags: newTags
     };

     if (existingDocIndex >= 0) {
        updatedDocs[existingDocIndex] = updatedDoc;
     } else {
        updatedDocs.unshift(updatedDoc);
     }
     
     setDocuments(updatedDocs);
     triggerAutoSave(updatedDocs);
  };

  const createNewDocument = () => {
    const newId = `doc-${Date.now()}`;
    const newTitle = t('Shënim i Paemërtuar', 'Untitled Note');
    const newHeaders = [t('Kolona 1', 'Column 1'), t('Kolona 2', 'Column 2'), t('Kolona 3', 'Column 3'), t('Kolona 4', 'Column 4')];
    const newRows = getEmptyRows();
    
    setActiveDocId(newId);
    setTitle(newTitle);
    setActiveTags([]);
    setRows(newRows);
    setHeaders(newHeaders);
    setSelectedRows(new Set());
    
    const newDocObj: GridDocument = {
       id: newId,
       title: newTitle,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
       headers: newHeaders,
       columnWidths: [],
       rows: newRows,
       tags: []
    };
    const updatedDocs = [newDocObj, ...documents];
    setDocuments(updatedDocs);
    triggerAutoSave(updatedDocs);
  };

  const openDocument = (doc: GridDocument) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    setActiveTags(doc.tags || []);
    setActiveTags(doc.tags || []);
    
    const newRows = [...doc.rows];
    const hasContent = (r: GridRow) => (doc.headers.some((_, i) => (r[`col${i+1}`] || '').toString().trim()) || r.image) ? true : false;
    if (newRows.length > 0) {
        const firstRowIsUsed = hasContent(newRows[0]) || (newRows[0].status && newRows[0].status !== 'none');
        if (firstRowIsUsed) {
            const firstEmptyIndex = newRows.findIndex(r => !hasContent(r) && r.status === 'none' && !r.image);
            if (firstEmptyIndex !== -1) {
                const emptyRow = newRows.splice(firstEmptyIndex, 1)[0];
                newRows.unshift(emptyRow);
            } else {
                newRows.unshift({ id: `row-${Date.now()}-first`, status: 'none', image: '' });
            }
        }
    }
    setRows(newRows);
    
    setHeaders(doc.headers);
    setColumnWidths(doc.columnWidths || []);
    setSelectedRows(new Set());
  };

  const deleteDocument = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    executeProtectedAction(async () => {
       const updatedDocs = documents.filter(d => d.id !== id);
       setDocuments(updatedDocs);
       localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(updatedDocs));
       if (user) {
          try { await deleteDoc(doc(db, 'documents', id)); } catch(e) {}
       }
       showToast('Dokumenti u fshi!');
    });
  };

  const saveCurrentDocument = () => {
     updateActiveDocumentState(title, rows, headers);
     showToast("U ruajt me sukses!");
  };

  const updateCell = (rIndex: number, colKey: string, value: string) => {
     const newRows = [...rows];
     newRows[rIndex] = { ...newRows[rIndex], [colKey]: value };
     setRows(newRows);
     updateActiveDocumentState(title, newRows, headers);
  };

  const updateSelectedRowsStatus = (newStatus: string) => {
     if (selectedRows.size === 0) {
         showToast("Zgjidhni rrjeshta (klikoni numrat majtas) për të ndryshuar statusin!");
         return;
     }

     executeProtectedAction(() => {
         const newRows = [...rows];
         
         const hasContent = (r: GridRow) => (headers.some((_, i) => (r[`col${i+1}`] || '').toString().trim()) || r.image) ? true : false;
         
         selectedRows.forEach(rIndex => {
             newRows[rIndex].status = newStatus;
         });

         newRows.sort((a, b) => {
             const getOrder = (row: GridRow) => {
                 if (row.status === 'ok') return 1;
                 if (row.status === 'blue') return 2;
                 if (row.status?.startsWith('tag-')) return 3;
                 if (row.status === 'none' && hasContent(row)) return 4;
                 if (row.status === 'x') return 5;
                 return 6;
             };
             
             const orderA = getOrder(a);
             const orderB = getOrder(b);
             return orderA - orderB;
         });
         
         // Siguro që rrjeshti i parë të jetë gjithmonë bosh për shënim (Rule applied: always keep first row empty)
         const firstRowIsUsed = hasContent(newRows[0]) || (newRows[0].status && newRows[0].status !== 'none');
         if (firstRowIsUsed) {
             const firstEmptyIndex = newRows.findIndex(r => !hasContent(r) && r.status === 'none' && !r.image);
             if (firstEmptyIndex !== -1) {
                 const emptyRow = newRows.splice(firstEmptyIndex, 1)[0];
                 newRows.unshift(emptyRow);
             } else {
                 newRows.unshift({
                     id: `row-${Date.now()}-first`,
                     status: 'none',
                     image: ''
                 });
             }
         }
         
         setRows(newRows);
         updateActiveDocumentState(title, newRows, headers);
         setSelectedRows(new Set());
     });
  };

  const handleImageUpload = (rIndex: number, file: File) => {
     const reader = new FileReader();
     reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas');
           const MAX_WIDTH = 800; // Resize to save memory
           const MAX_HEIGHT = 800;
           let width = img.width;
           let height = img.height;
           if (width > height) {
              if (width > MAX_WIDTH) {
                 height *= MAX_WIDTH / width;
                 width = MAX_WIDTH;
              }
           } else {
              if (height > MAX_HEIGHT) {
                 width *= MAX_HEIGHT / height;
                 height = MAX_HEIGHT;
              }
           }
           canvas.width = width;
           canvas.height = height;
           const ctx = canvas.getContext('2d');
           if (ctx) {
               ctx.drawImage(img, 0, 0, width, height);
               const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress
               const newRows = [...rows];
               newRows[rIndex].image = dataUrl;
               setRows(newRows);
               updateActiveDocumentState(title, newRows, headers);
           }
        };
        img.src = e.target?.result as string;
     };
     reader.readAsDataURL(file);
  };

  const removeImage = (rIndex: number) => {
     const newRows = [...rows];
     newRows[rIndex].image = '';
     setRows(newRows);
     updateActiveDocumentState(title, newRows, headers);
  };

  const generatePlaceholderImage = async (rIndex: number) => {
      showToast("Duke gjeneruar imazhin...");
      try {
          const seed = Math.random().toString(36).substring(7);
          const url = `https://picsum.photos/seed/${seed}/200/200`;
          const res = await fetch(url);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              const newRows = [...rows];
              newRows[rIndex].image = dataUrl;
              setRows(newRows);
              updateActiveDocumentState(title, newRows, headers);
              showToast("Imazhi u gjenerua!");
          };
          reader.readAsDataURL(blob);
      } catch (err) {
          showToast("Gabim gjatë gjenerimit të imazhit!");
      }
  };

  const toggleRowSelection = (rIndex: number) => {
    const newSel = new Set(selectedRows);
    if (newSel.has(rIndex)) {
      newSel.delete(rIndex);
    } else {
      newSel.add(rIndex);
    }
    setSelectedRows(newSel);
  };
  
  const toggleAllSelection = () => {
     if (selectedRows.size === rows.length) {
       setSelectedRows(new Set());
     } else {
       setSelectedRows(new Set(rows.map((_, i) => i)));
     }
  };

  const handleClearAll = () => {
     const empty = getEmptyRows();
     setRows(empty);
     setSelectedRows(new Set());
     setShowConfirmClear(false);
     updateActiveDocumentState(title, empty, headers);
     showToast("Të gjitha 90 rrjeshtat u boshatisën!");
  };

  const handleDeleteSelected = () => {
     const newRows = rows.map((r, index) => {
         if (selectedRows.has(index)) {
             return { id: r.id, status: 'none' as const, image: '' };
         }
         return r;
     });
     
     setRows(newRows);
     setSelectedRows(new Set());
     setShowConfirmDeleteSelected(false);
     updateActiveDocumentState(title, newRows, headers);
     showToast("Rrjeshtat u boshatisën (struktura u ruajt)!");
  };



  const handleDownload = async (blob: Blob, filename: string, mimeType: string, shareTitle: string) => {
      try {
          if (Capacitor.isNativePlatform()) {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = async () => {
                  const base64data = reader.result?.toString().split(',')[1];
                  if (base64data) {
                      try {
                          // Request permission first to ensure we can write to memory
                          try {
                             await Filesystem.requestPermissions();
                          } catch(permErr) {}

                          // Get folder name from state/localStorage
                          const manualFolder = localStorage.getItem('grid_mock_folder') || folderName;
                          const sanitizedFolder = manualFolder ? manualFolder.replace(/[^a-zA-Z0-9_\s-]/g, '').trim() : '';
                          const fullPath = sanitizedFolder ? `${sanitizedFolder}/${filename}` : filename;
                          
                          // Write to a cache directory first so we can share it if needed
                          const writeResult = await Filesystem.writeFile({
                              path: filename,
                              data: base64data,
                              directory: Directory.Cache,
                              recursive: true
                          });
                          
                          if (downloadMethod === 'share' || downloadMethod === 'picker') {
                             await Share.share({
                                 title: shareTitle,
                                 url: writeResult.uri,
                                 dialogTitle: 'Zgjidh ku do të ruash dokumentin (Save to...)'
                             });
                             showToast("Hapëm menunë për të zgjedhur dosjen!");
                          } else {
                             // Save to documents by default
                             await Filesystem.writeFile({
                                 path: fullPath,
                                 data: base64data,
                                 directory: Directory.Documents,
                                 recursive: true
                             });
                             showToast(t(`Skedari u ruajt me sukses në Documents/${fullPath}`, `Saved to Documents/${fullPath}`));
                          }
                      } catch (e: any) {
                          console.error("Capacitor save error:", e);
                          showToast("Gabim gjatë ruajtjes: " + (e.message || "E panjohur"));
                      }
                  }
              };
              return;
          }

          if (downloadMethod === 'folder') {
              let rootHandle = await getDirectoryHandle();
              
              if (!rootHandle && typeof (window as any).showDirectoryPicker === 'function' && window.self === window.top) {
                  try {
                      rootHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                      await saveDirectoryHandle(rootHandle);
                  } catch(e) {
                      console.error(e);
                  }
              }
              
              if (rootHandle) {
                  try {
                      const fileHandle = await rootHandle.getFileHandle(filename, { create: true });
                      const writable = await fileHandle.createWritable();
                      await writable.write(blob);
                      await writable.close();
                      showToast(`U ruajt drejtpërdrejt në dosjen: ${rootHandle.name}`);
                      return;
                  } catch (e: any) {
                      console.error(e);
                      showToast("Gabim gjatë ruajtjes në dosje. Riprovoni ose rregulloni lejet.");
                  }
              } else {
                  let savedFolder = localStorage.getItem('grid_mock_folder') || folderName;
                  
                  if (savedFolder) {
                      showToast(`U sinkronizua automatikisht drejt dosjes: '${savedFolder}'`);
                      const sanitizedFolder = savedFolder.replace(/[^a-zA-Z0-9_\s-]/g, '').trim();
                      const finalFilename = sanitizedFolder ? `${sanitizedFolder}_${filename}` : filename;
                      
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = finalFilename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      return;
                  } else {
                      showToast("Dosja nuk është zgjedhur! Shkoni tek Settings për ta zgjedhur.");
                  }
                  
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  return;
              }
          }
          
          if (downloadMethod === 'picker') {
              if ('showSaveFilePicker' in window && window.self === window.top) {
                  try {
                      const handle = await (window as any).showSaveFilePicker({
                          suggestedName: filename,
                          types: [{ description: 'File', accept: { [mimeType]: [`.${filename.split('.').pop()}`] } }]
                      });
                      const writable = await handle.createWritable();
                      await writable.write(blob);
                      await writable.close();
                      showToast(t("Skedari u ruajt me sukses në dosjen e zgjedhur!", "File saved successfully!"));
                      return;
                  } catch (err: any) {
                      if (err.name === 'AbortError') return;
                      showToast("Nuk mund të hapet File Manager direkt. Provoni opsionin 'Filemanager Internal/Folder'.");
                      return;
                  }
              } else {
                  showToast("Hapja direkte kërkon PC. Në celular përdorni opsionin 'Filemanager Internal/Folder'.");
                  return;
              }
          }
          
          if (downloadMethod === 'auto') {
               if ('showSaveFilePicker' in window && window.self === window.top && !/Mobi/i.test(navigator.userAgent)) {
                   try {
                       const handle = await (window as any).showSaveFilePicker({
                           suggestedName: filename,
                           types: [{ description: 'File', accept: { [mimeType]: [`.${filename.split('.').pop()}`] } }]
                       });
                       const writable = await handle.createWritable();
                       await writable.write(blob);
                       await writable.close();
                       showToast(t("Skedari u ruajt me sukses në dosjen e zgjedhur!", "File saved successfully!"));
                       return;
                   } catch (err: any) {
                        if (err.name === 'AbortError') return;
                   }
               }
               try {
                   const file = new File([blob], filename, { type: mimeType });
                   if (navigator.canShare && navigator.canShare({ files: [file] })) {
                       await navigator.share({
                           files: [file],
                           title: shareTitle,
                       });
                       showToast(t("Zgjidhni 'Save to Files' në menunë e shfaqur.", "Select 'Save to Files' from the menu."));
                       return;
                   }
               } catch (err: any) {
                   if (err.name === 'AbortError') return;
               }
          }

          if (downloadMethod === 'share') {
              try {
                  if ('showSaveFilePicker' in window && window.self === window.top) {
                      try {
                          const handle = await (window as any).showSaveFilePicker({
                              suggestedName: filename,
                              types: [{ description: 'File', accept: { [mimeType]: [`.${filename.split('.').pop()}`] } }]
                          });
                          const writable = await handle.createWritable();
                          await writable.write(blob);
                          await writable.close();
                          showToast("U ruajt në dosjen e zgjedhur!");
                          return;
                      } catch(ex: any) {
                          if (ex.name === 'AbortError') return;
                      }
                  }

                  const file = new File([blob], filename, { type: mimeType });
                  if (navigator.canShare && navigator.canShare({ files: [file] })) {
                      try {
                          await navigator.share({
                              files: [file],
                              title: shareTitle,
                          });
                          showToast(t("Tani zgjidhni File Manager / 'Save to Files' në ekran.", "Now choose File Manager / 'Save to Files'."));
                          return;
                      } catch (e: any) {
                          if (e.name === 'AbortError') return;
                          console.error("Share error:", e);
                          showToast(t("Dritarja e ndarjes nuk mbështetet këtu, po shkarkohet direkt.", "Share not supported here, downloading directly."));
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = filename;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          return;
                      }
                  } else {
                      showToast("Ndarja nuk mbështetet. Po shkarkojmë direkt sekondar.");
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      return;
                  }
              } catch (err: any) {
                  if (err.name !== 'AbortError') showToast("Dështoi hapja e File Manager.");
                  return;
              }
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(t("Skedari u ruajt direkt në 'Downloads'!", "File saved directly to 'Downloads'!"));
      } catch (err) {
          showToast("Gabim gjatë shkarkimit!");
      }
  };


  const exportTxt = async () => {
    let txt = `${title.toUpperCase()} (90 Rrjeshta)\n\n`;
    rows.forEach((r, i) => {
       let hasAny = headers.some((_, c) => (r[`col${c+1}`] || '').toString().trim());
       if (hasAny) {
          txt += `--- Rrjeshti ${i+1} ---\n`;
          headers.forEach((h, c) => {
             const val = (r[`col${c+1}`] || '').toString().trim();
             if (val) txt += `${h}: ${val}\n`;
          });
          txt += "\n";
       }
    });

    const blob = new Blob([txt], { type: 'text/plain' });
    const filename = `${title.replace(/\s+/g, '_')}.txt`;
    
    await handleDownload(blob, filename, 'text/plain', 'Eksport TXT');
  };

  const exportCsv = async () => {
    let hasContent = false;
    rows.forEach(r => {
       if (headers.some((_, i) => (r[`col${i+1}`] || '').toString().trim()) || r.image) hasContent = true;
    });

    if (!hasContent) {
       showToast("Blloku është bosh!");
       return;
    }

    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

    rows.forEach(r => {
      let hasAny = headers.some((_, c) => (r[`col${c+1}`] || '').toString().trim()) || r.image;
      if (hasAny) {
         csvRows.push(headers.map((_, c) => `"${(r[`col${c+1}`] || '').toString().trim().replace(/"/g, '""')}"`).join(','));
      }
    });

    const csvContent = csvRows.join("\n");
    const filename = `${title.replace(/\s+/g, '_')}.csv`;
    
    const performSave = async () => {
       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
       await handleDownload(blob, filename, 'text/csv', 'Eksport CSV');
    };

    performSave();
  };

  const exportPdf = () => {
    let hasContent = false;
    rows.forEach(r => {
       if (headers.some((_, i) => (r[`col${i+1}`] || '').toString().trim()) || r.image) hasContent = true;
    });

    if (!hasContent) {
       showToast("Blloku është bosh!");
       return;
    }

    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text(title, 20, y);
    y += 10;
    doc.setFontSize(10);
    
    rows.forEach((r, i) => {
       let hasAny = headers.some((_, c) => (r[`col${c+1}`] || '').toString().trim()) || r.image;
       if (hasAny) {
          let rowText = `Rrjeshti ${i+1}:`;
          headers.forEach((h, c) => {
             const val = (r[`col${c+1}`] || '').toString().trim();
             if (val) rowText += `\n- ${h}: ${val.replace(/\n/g, ' ')}`;
          });
          
          if (rowText.trim() !== `Rrjeshti ${i+1}:`) {
              const split = doc.splitTextToSize(rowText, 170);
              if (y + split.length * 5 > 280) {
                 doc.addPage();
                 y = 20;
              }
              doc.text(split, 20, y);
              y += split.length * 5 + 5;
          }

          if (r.image) {
              if (y + 45 > 280) {
                 doc.addPage();
                 y = 20;
              }
              // Add image. Format assumed JPEG/PNG. Data url usually has metadata.
              try {
                  doc.addImage(r.image, 'JPEG', 30, y, 40, 40);
                  y += 45;
              } catch (e) {
                  // Fallback if image type unsupported by jspd
                  doc.text('[Imazhi nuk mund të renderizohej]', 30, y);
                  y += 10;
              }
          }
          y += 5;
       }
    });

    const performSave = async (docObj: jsPDF, filename: string) => {
       const blob = docObj.output('blob');
       await handleDownload(blob, filename, 'application/pdf', 'Eksport PDF');
    };

    performSave(doc, `${title.replace(/\s+/g, '_')}.pdf`);
  };

  const openModal = (rIndex: number, colKey: string) => {
     setActiveCell({ rIndex, colKey });
     setModalText(rows[rIndex][colKey as keyof GridRow] as string);
  };

  const closeModal = () => {
     setActiveCell(null);
  };

  const saveModal = () => {
     if (activeCell) {
        updateCell(activeCell.rIndex, activeCell.colKey, modalText);
        closeModal();
     }
  };

  const baseBg = isDark ? "bg-[#09090b]" : "bg-zinc-50";
  const borderColor = isDark ? "border-zinc-800" : "border-zinc-200";
  const textColor = isDark ? "text-zinc-50" : "text-zinc-900";
  const toolbarBg = isDark ? "bg-[#18181b]" : "bg-white";
  const inputBgDark = "bg-[#18181b] border border-[#27272a] focus:bg-[#27272a]";
  const inputBgLight = "bg-white border border-zinc-200 shadow-sm focus:bg-zinc-50";

  const exportAllPdf = async () => {
     if (documents.length === 0) {
        showToast("Nuk ka asnjë dokument për të ruajtur.");
        return;
     }
     
     const doc = new jsPDF();
     let y = 20;
     const filename = `Bllok_Arkiva_Plote_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

     doc.setFontSize(20);
     doc.text("Arkiva e Plotë e Bllokut", 20, y);
     y += 15;

     documents.forEach((dItem, index) => {
         if (index > 0) {
             doc.addPage();
             y = 20;
         }
         doc.setFontSize(16);
         doc.text(`Dokumenti: ${dItem.title}`, 20, y);
         y += 10;
         doc.setFontSize(10);
         
         dItem.rows.forEach((r, i) => {
             let hasAny = dItem.headers.some((_, c) => (r[`col${c+1}`] || '').toString().trim()) || r.image;
             if (hasAny) {
                 let rowText = `Rrjeshti ${i+1}:`;
                 dItem.headers.forEach((h: string, c: number) => {
                    const val = (r[`col${c+1}`] || '').toString().trim();
                    if (val) rowText += `\n- ${h}: ${val.replace(/\n/g, ' ')}`;
                 });
                 
                 if (rowText.trim() !== `Rrjeshti ${i+1}:`) {
                     const split = doc.splitTextToSize(rowText, 170);
                     if (y + split.length * 5 > 280) { doc.addPage(); y = 20; }
                     doc.text(split, 20, y);
                     y += split.length * 5 + 5;
                 }
                 
                 if (r.image) {
                     if (y + 45 > 280) { doc.addPage(); y = 20; }
                     try {
                         doc.addImage(r.image, 'JPEG', 30, y, 40, 40);
                         y += 45;
                     } catch(e) {
                         doc.text('[Imazhi nuk mund të renderizohej]', 30, y);
                         y += 10;
                     }
                 }
                 y += 5;
             }
         });
     });

     await handleDownload(doc.output('blob'), filename, 'application/pdf', 'Arkiva PDF');
  };



  const exportAllTxt = async () => {
     if (documents.length === 0) {
        showToast("Nuk ka asnjë dokument për të ruajtur.");
        return;
     }

     let txtContent = "Arkiva e Plotë e Bllokut\n\n";
     documents.forEach((dItem, index) => {
         if (index > 0) txtContent += "\n============================================\n\n";
         txtContent += `Dokumenti: ${dItem.title}\n`;
         txtContent += `Krijuar: ${safeFormatDate(dItem.createdAt, 'dd.MM.yyyy HH:mm')}\n\n`;

         dItem.rows.forEach((r, i) => {
              let hasAny = dItem.headers.some((_, c) => (r[`col${c+1}`] || '').toString().trim());
              if (hasAny) {
                  txtContent += `Rrjeshti ${i+1}:\n`;
                  dItem.headers.forEach((h: string, c: number) => {
                     const val = (r[`col${c+1}`] || '').toString().trim();
                     if (val) txtContent += `- ${h}: ${val}\n`;
                  });
                  txtContent += "\n";
              }
         });
     });

     const dataBlob = new Blob([txtContent], { type: 'text/plain' });
     const filename = `Bllok_Arkiva_Plote_${format(new Date(), 'yyyy-MM-dd')}.txt`;
     
     await handleDownload(dataBlob, filename, 'text/plain', 'Arkiva TXT');
  };

  const exportAllCsv = async () => {
     if (documents.length === 0) {
        showToast("Nuk ka asnjë dokument për të ruajtur.");
        return;
     }

     let csvContent = "";
     documents.forEach((dItem, index) => {
         if (index > 0) csvContent += "\n\n";
         csvContent += `"${dItem.title.replace(/"/g, '""')}"\n`;
         
         const csvHeaders = ["Rrjeshti", ...dItem.headers];
         csvContent += csvHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
         
         dItem.rows.forEach((r, i) => {
             let hasAny = dItem.headers.some((_, c) => (r[`col${c+1}`] || '').toString().trim());
             if (hasAny) {
                const rowCsv = [(i+1).toString(), ...dItem.headers.map((_, c) => (r[`col${c+1}`] || '').toString())];
                csvContent += rowCsv.map(c => `"${c.replace(/"/g, '""')}"`).join(",") + "\n";
             }
         });
     });

     const dataBlob = new Blob([csvContent], { type: 'text/csv' });
     const filename = `Bllok_Arkiva_Plote_${format(new Date(), 'yyyy-MM-dd')}.csv`;
     
     await handleDownload(dataBlob, filename, 'text/csv', 'Arkiva CSV');
  };

  const exportLocalBackup = async () => {
    try {
       const dataStr = JSON.stringify(documents, null, 2);
       const dataBlob = new Blob([dataStr], { type: 'application/json' });
       const filename = `GridNotepad_Backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
       
       await handleDownload(dataBlob, filename, 'application/json', 'Backup për Notepad');
    } catch(err: any) {
       showToast("Gabim gjatë ruajtjes së kopjes rezervë.");
    }
  };

  const importLocalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     
     const reader = new FileReader();
     reader.onload = (event) => {
        try {
           const content = event.target?.result as string;
           const parsed = JSON.parse(content) as GridDocument[];
           
           if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].rows) {
              setDocuments(parsed);
              triggerAutoSave(parsed);
              showToast("Të dhënat u rikthyen me sukses nga pajisja!");
              setBackupModal(false);
           } else {
              showToast("Skedari nuk është i vlefshëm për këtë aplikacion.");
           }
        } catch(err) {
           showToast("Skedari i dëmtuar ose i pavlefshëm.");
        }
     };
     reader.readAsText(file);
     e.target.value = ''; // reset
  };

  const forceCloudBackup = async (silent = false) => {
    setIsSaving(true);
    if (!silent) setAutoSaveMsg('Po ngarkon në Google Cloud...');
    
    const success = await syncWithGoogleCloud(documents, silent);
    
    setIsSaving(false);
    if (success) {
        setAutoSaveMsg('Ngarkuar!');
    } else {
        setAutoSaveMsg('Lokal!');
    }
    setTimeout(() => setAutoSaveMsg(''), 3000);
  };

  const handleFullCloudRestore = async () => {
      setIsFetchingCloud(true);
      const res = await loadFromGoogleCloud(false);
      setIsFetchingCloud(false);
      if (res) {
          setBackupModal(false);
      }
  };

  const handleForceChangePassword = () => {
       const savedPassword = localStorage.getItem('grid_notepad_pin');
       if (!savedPassword) {
           setPasswordModal({ isOpen: true, action: null, type: 'setup' });
       } else {
           executeProtectedAction(() => {
               setTimeout(() => {
                  setPasswordModal({ isOpen: true, action: null, type: 'setup' });
               }, 10);
           });
       }
       setShowOptionsMenu(false);
  };

  const handleForceRemovePassword = () => {
       const savedPassword = localStorage.getItem('grid_notepad_pin');
       if (!savedPassword) {
           showToast('Nuk keni asnjë Password të vendosur.');
           setShowOptionsMenu(false);
           return;
       }
       executeProtectedAction(() => {
           localStorage.removeItem('grid_notepad_pin');
           showToast('Password u fshi me sukses nga pajisja.');
       });
       setShowOptionsMenu(false);
  };

  const handleResetApp = () => {
       executeProtectedAction(async () => {
            if(window.confirm('Kujdes! A jeni i sigurt që doni të FSHINI TË GJITHA të dhënat dhe dokumentet? Ky veprim NUK kthehet mbrapsht!')) {
                 localStorage.removeItem('grid_notepad_documents_v2');
                 localStorage.removeItem('grid_notepad_blue');
                 
                 if (auth.currentUser && navigator.onLine) {
                     for (const d of documents) {
                         deleteDoc(doc(db, 'documents', d.id)).catch(() => {});
                     }
                     setDoc(doc(db, 'settings', getActiveUid()!), { blueText: '', userId: getActiveUid()! }, { merge: false }).catch(() => {});
                     setCloudDocs([]);
                 }

                 setDocuments([]);
                 setBlueText('');
                 showToast('Të gjitha të dhënat u fshinë nga pajisja dhe Cloud.');
            }
       });
       setShowOptionsMenu(false);
  };

  const handleExportDataJson = () => {
       executeProtectedAction(async () => {
           const data = {
               documents,
               blueText,
               pin: localStorage.getItem('grid_notepad_pin') || null
           };
           const dataStr = JSON.stringify(data, null, 2);
           const dataBlob = new Blob([dataStr], { type: 'application/json' });
           const filename = `app_data_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
           
           await handleDownload(dataBlob, filename, 'application/json', 'Backup JSON');
       });
       setShowOptionsMenu(false);
  };

  const handleImportDataJson = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const jsonData = JSON.parse(event.target?.result as string);
              if (window.confirm('Kujdes! Importimi i këtyre të dhënave do të mbishkruajë të dhënat ekzistuese. Të vazhdojmë?')) {
                  if (jsonData.documents) {
                      localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(jsonData.documents));
                      setDocuments(jsonData.documents);
                  }
                  if (jsonData.blueText !== undefined) {
                      localStorage.setItem('grid_notepad_blue', jsonData.blueText);
                      setBlueText(jsonData.blueText);
                  }
                  if (jsonData.pin !== undefined) {
                      if (jsonData.pin) {
                          localStorage.setItem('grid_notepad_pin', jsonData.pin);
                      } else {
                          localStorage.removeItem('grid_notepad_pin');
                      }
                  }
                  showToast('Të dhënat u importuan me sukses!');
              }
          } catch (err) {
              showToast('Gabim gjatë importimit të skedarit JSON.');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
      setShowOptionsMenu(false);
  };

  const handleSortDocsAZ = () => {
       executeProtectedAction(() => {
           const newDocs = [...documents].sort((a, b) => a.title.localeCompare(b.title));
           setDocuments(newDocs);
           localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
           showToast("Dokumentet u renditën A-Z.");
       });
       setShowOptionsMenu(false);
  };

  const handleSortDocsZA = () => {
       executeProtectedAction(() => {
           const newDocs = [...documents].sort((a, b) => b.title.localeCompare(a.title));
           setDocuments(newDocs);
           localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
           showToast("Dokumentet u renditën Z-A.");
       });
       setShowOptionsMenu(false);
  };

  const handleSortDocsNewest = () => {
       executeProtectedAction(() => {
           const newDocs = [...documents].sort((a, b) => b.createdAt - a.createdAt);
           setDocuments(newDocs);
           localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
           showToast("Dokumentet u renditën më të rejat të parat.");
       });
       setShowOptionsMenu(false);
  };

  const handleSortDocsOldest = () => {
       executeProtectedAction(() => {
           const newDocs = [...documents].sort((a, b) => a.createdAt - b.createdAt);
           setDocuments(newDocs);
           localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
           showToast("Dokumentet u renditën më të vjetrat të parat.");
       });
       setShowOptionsMenu(false);
  };

  const handleCapitalizeTitles = () => {
       executeProtectedAction(() => {
           const newDocs = documents.map(doc => {
               const title = doc.title;
               const newTitle = title.charAt(0).toUpperCase() + title.slice(1);
               return { ...doc, title: newTitle };
           });
           setDocuments(newDocs);
           localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
           showToast("Titujt u kapitalizuan me sukses.");
       });
       setShowOptionsMenu(false);
  };

  const handleRemoveAllRowStatuses = () => {
       executeProtectedAction(() => {
           let statusesRemoved = 0;
           const newDocs = documents.map(doc => {
               const cleanRows = doc.rows.map(r => {
                   if (r.status !== 'none' && r.status !== 'lock') {
                       statusesRemoved++;
                       return { ...r, status: 'none' };
                   }
                   return r;
               });
               return { ...doc, rows: cleanRows };
           });
           if (statusesRemoved > 0) {
               setDocuments(newDocs);
               localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
               showToast(`U fshinë ${statusesRemoved} statuse ngjyrash nga rrjeshtat.`);
           } else {
               showToast("Nuk kishte asnjë status rrjeshti për të fshirë.");
           }
       });
       setShowOptionsMenu(false);
  };

  const handleDeleteEmptyDocs = () => {
       executeProtectedAction(async () => {
           let emptyCount = 0;
           const emptyDocIds: string[] = [];
           const newDocs = documents.filter(doc => {
               const hasData = doc.rows.some(r => doc.headers.some((_, c) => (r[`col${c+1}`] || '').toString().trim()) || r.image);
               if (!hasData) {
                   emptyCount++;
                   emptyDocIds.push(doc.id);
               }
               return hasData;
           });
           if (emptyCount > 0) {
               setDocuments(newDocs);
               localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
               
               if (auth.currentUser && navigator.onLine) {
                   for (const id of emptyDocIds) {
                       deleteDoc(doc(db, 'documents', id)).catch(() => {});
                   }
                   setCloudDocs(prev => prev.filter(d => !emptyDocIds.includes(d.id)));
               }

               showToast(`U fshinë me sukses ${emptyCount} dokumente bosh (dhe nga Cloud).`);
           } else {
               showToast("Nuk u gjetën dokumente bosh.");
           }
       });
       setShowOptionsMenu(false);
  };

  const handleCleanupEmptyRowsAll = () => {
       executeProtectedAction(async () => {
           let totalCleaned = 0;
           const newDocs = documents.map(doc => {
               const originalLen = doc.rows.length;
               const cleanRows = doc.rows.filter(r => doc.headers.some((_, c) => (r[`col${c+1}`] || '').toString().trim()) || r.image);
               totalCleaned += (originalLen - cleanRows.length);
               return { ...doc, rows: cleanRows };
           });
           if (totalCleaned > 0) {
               setDocuments(newDocs);
               localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));

               if (auth.currentUser && navigator.onLine) {
                   for (const docObj of newDocs) {
                       setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: getActiveUid()! }).catch(() => {});
                   }
                   setCloudDocs(prev => prev.map(c => {
                       const local = newDocs.find(l => l.id === c.id);
                       return local ? { ...c, rows: local.rows } : c;
                   }));
               }

               showToast(`U pastruan ${totalCleaned} rrjeshta bosh kudo.`);
           } else {
               showToast("Nuk kishte asnjë rrjesht bosh për t'u pastruar.");
           }
       });
       setShowOptionsMenu(false);
  };

  const handleStripAllImages = () => {
       executeProtectedAction(async () => {
           if(window.confirm('Kujdes! Dëshironi të fshini të gjitha imazhet nga aplikacioni për të kursyer hapësirën (Storage)? Kjo nuk zhbëhet!')) {
               let imagesRemoved = 0;
               const newDocs = documents.map(doc => {
                   const cleanRows = doc.rows.map(r => {
                       if (r.image) imagesRemoved++;
                       return { ...r, image: null };
                   });
                   return { ...doc, rows: cleanRows };
               });
               if (imagesRemoved > 0) {
                   setDocuments(newDocs);
                   localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));

                   if (auth.currentUser && navigator.onLine) {
                       for (const docObj of newDocs) {
                           setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: getActiveUid()! }).catch(() => {});
                       }
                       setCloudDocs(prev => prev.map(c => {
                           const local = newDocs.find(l => l.id === c.id);
                           return local ? { ...c, rows: local.rows } : c;
                       }));
                   }

                   showToast(`U fshinë me sukses ${imagesRemoved} imazhe.`);
               } else {
                   showToast("Asnjë imazh nuk u gjet.");
               }
           }
       });
       setShowOptionsMenu(false);
  };

  const handleResetVisualSettings = () => {
       setIsDark(true);
       setAccentColor('blue');
       showToast("Parametrat vizualë u kthyen në vlerat fillestare!");
       setShowOptionsMenu(false);
  };

  const handleRefreshCache = () => {
      showToast('Po pastrohet cache...');
      setTimeout(() => {
          window.location.reload();
      }, 1000);
      setShowOptionsMenu(false);
  };

  const filteredDocs = documents.filter(doc => {
     if (selectedTag && !(doc.tags || []).includes(selectedTag)) return false;
     if (!catalogSearch.trim()) return true;
     const q = catalogSearch.toLowerCase();
     if (doc.title.toLowerCase().includes(q)) return true;
     return doc.rows.some(r => 
        headers.some((_, c) => (r[`col${c+1}`] || '').toString().toLowerCase().includes(q))
     );
  });

  // LOCK SCREEN VIEW
  const handleAppUnlock = () => {
      const savedPassword = localStorage.getItem('grid_notepad_pin');
      if (appLockInput === savedPassword) {
          setAppLocked(false);
          setAppLockInput('');
      } else {
          showToast('Password i gabuar!');
          setAppLockInput('');
      }
  };

  const renderSharedModals = () => (
    <>
      {/* CONFIRMATION MODAL - DELETE DOC */}
      {docToDelete && (
         <div className="fixed inset-0 z-[200] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 p-4 animate-in fade-in">
            <div className={`max-w-md w-full p-6 mb-20 md:mb-0 rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
               <h3 className={`text-xl font-bold mb-3 text-red-500`}>{t('Kujdes!', 'Warning!')}</h3>
               <p className={`mb-6 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {t('Jeni i sigurt që doni ta fshini listën: ', 'Are you sure you want to delete the list: ')}
                  <strong className={isDark ? "text-zinc-200" : "text-zinc-800"}>
                     "{documents.find(d => d.id === docToDelete)?.title || t('Pa titull', 'Untitled')}"
                  </strong>
                  {t('? Ky veprim nuk mund të kthehet mbrapsht.', '? This action cannot be undone.')}
                  <br /><br />
                  <span className="text-sm font-medium">Informacion: Ky veprim do të fshijë vetëm këtë listë. Struktura e aplikacionit dhe listat e tjera nuk do të ndryshojnë.</span>
               </p>
               <div className="flex justify-end gap-3">
                  <button onClick={() => setDocToDelete(null)} className={`px-4 py-2 font-medium rounded-lg transition-colors ${isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>
                     {t('Anulo', 'Cancel')}
                  </button>
                  <button onClick={() => {
                     const id = docToDelete;
                     setDocToDelete(null);
                     const updatedDocs = documents.filter(d => d.id !== id);
                     setDocuments(updatedDocs);
                     localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(updatedDocs));
                     if (user) {
                        deleteDoc(doc(db, 'documents', id)).catch(() => {});
                     }
                     setCloudDocs(prev => prev.filter(d => d.id !== id));
                     if (activeDocId === id) {
                         createNewDocument();
                     }
                     showToast(t('Dokumenti u fshi!', 'Document deleted!'));
                  }} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors">
                     {t('Po, Fshijë', 'Yes, Delete')}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* CONFIRMATION MODAL - DELETE CLOUD DOC */}
      {cloudDocToDelete && (
         <div className="fixed inset-0 z-[200] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 p-4 animate-in fade-in">
            <div className={`max-w-md w-full p-6 mb-20 md:mb-0 rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
               <h3 className={`text-xl font-bold mb-3 text-red-500`}>{t('Kujdes!', 'Warning!')}</h3>
               <p className={`mb-6 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {t('Jeni i sigurt që doni ta fshini listën përgjithmonë nga Cloud: ', 'Are you sure you want to permanently delete from Cloud: ')}
                  <strong className={isDark ? "text-zinc-200" : "text-zinc-800"}>
                     "{cloudDocToDelete.title || t('Pa titull', 'Untitled')}"
                  </strong>
                  {t('? Kjo do ta fshijë atë nga cloud-i dhe nga të gjitha pajisjet e lidhura.', '? This will delete it from cloud and all synced devices.')}
               </p>
               <div className="flex justify-end gap-3">
                  <button onClick={() => setCloudDocToDelete(null)} className={`px-4 py-2 font-medium rounded-lg transition-colors ${isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>
                     {t('Anulo', 'Cancel')}
                  </button>
                  <button onClick={confirmDeleteCloudDoc} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20">
                     {t('Po, Fshijë nga Cloud', 'Yes, Delete from Cloud')}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* ORANGE NOTES MODAL */}
      {blueModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 sm:p-4 animate-in fade-in">
             <div className={`w-full h-[100dvh] sm:max-w-2xl sm:h-[80vh] flex flex-col sm:rounded-2xl shadow-2xl border-0 sm:border ${isDark ? "bg-zinc-900 sm:border-blue-500/30" : "bg-white sm:border-blue-300"}`}>
                <div className={`flex justify-between items-center p-4 border-b shrink-0 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-blue-500" : "text-blue-600"}`}>
                      <Lock className="w-5 h-5" /> Shënime Sekrete
                   </h3>
                   <button onClick={() => setBlueModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                
                <div className={`flex-1 p-5 ${isDark ? "bg-zinc-950" : "bg-blue-50/30"}`}>

                   <div className="flex flex-col h-full gap-4">
                     {/* Lista e Sekreteve */}
                     <div className={`flex-1 rounded-xl p-3 flex flex-col ${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-3">
                           <h4 className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>Lista e Sekreteve</h4>
                           <button 
                             onClick={() => {
                                const newItem = { id: Date.now().toString(), text: '', done: false };
                                const updated = [...secretList, newItem];
                                setSecretList(updated);
                                localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                             }}
                             className={`p-1.5 rounded-lg ${isDark ? "hover:bg-zinc-800 text-blue-400" : "hover:bg-blue-50 text-blue-600"}`}
                           >
                             <Plus className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-2">
                           {secretList.length === 0 && (
                              <p className={`text-xs text-center mt-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Nuk ka asnjë element në listë.</p>
                           )}
                           {secretList.map((item, idx) => (
                              <div key={item.id} className="flex items-start gap-2 group">
                                 <button 
                                   onClick={() => {
                                      const updated = [...secretList];
                                      updated[idx].done = !updated[idx].done;
                                      setSecretList(updated);
                                      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                   }}
                                   className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                     item.done 
                                      ? "bg-blue-500 border-blue-500 text-white" 
                                      : (isDark ? "border-zinc-600 text-transparent" : "border-zinc-400 text-transparent")
                                   }`}
                                 >
                                    <Check className="w-3 h-3" />
                                 </button>
                                 <input
                                   type="text"
                                   value={item.text}
                                   onChange={(e) => {
                                      const updated = [...secretList];
                                      updated[idx].text = e.target.value;
                                      setSecretList(updated);
                                      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                   }}
                                   placeholder="Shkruaj diçka..."
                                   className={`flex-1 bg-transparent border-none outline-none text-sm ${
                                      item.done ? (isDark ? "text-zinc-500 line-through" : "text-zinc-400 line-through") : (isDark ? "text-zinc-200" : "text-zinc-800")
                                   }`}
                                 />
                                 <button
                                   onClick={() => {
                                      const updated = secretList.filter(i => i.id !== item.id);
                                      setSecretList(updated);
                                      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                   }}
                                   className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                                 >
                                    <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Hartim Text (Text Drafting) */}
                     <div className={`flex-1 rounded-xl p-3 flex flex-col ${isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"}`}>
                        <h4 className={`text-sm font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>Hartim Tekst</h4>
                        <textarea
                           autoFocus
                           value={blueText}
                           onChange={(e) => {
                               const val = e.target.value;
                               setBlueText(val);
                               localStorage.setItem('grid_notepad_blue', val);
                           }}
                           placeholder="Këtu mund të mbani shënime të rëndësishme ose sekrete të mbrojtura me Password..."
                           className={`w-full h-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed scrollbar-hide ${
                             isDark ? "text-zinc-200 placeholder-zinc-700" : "text-zinc-800 placeholder-zinc-400"
                           }`}
                           spellCheck={false}
                        />
                     </div>
                   </div>

                </div>
                
                <div className={`p-4 flex items-center justify-between border-t shrink-0 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? "text-green-500" : "text-green-600"}`}>
                     <Check className="w-3.5 h-3.5" /> Ruhet automatikisht
                   </span>
                   <button onClick={() => {
                       setBlueModal(false);
                   }} className={`px-5 py-2 font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20`}>
                      Mbyll
                   </button>
                </div>
             </div>
          </div>
      )}

      {/* Password MODAL */}
      {passwordModal.isOpen && (
          <div className="fixed inset-0 z-[80] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 p-4 animate-in fade-in">
            <div className={`max-w-sm w-full p-6 rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
               <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl ${passwordModal.type === 'setup' ? 'bg-accent-500/10 text-accent-500' : 'bg-blue-500/10 text-blue-500'}`}>
                     {passwordModal.type === 'setup' ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                  </div>
                  <h3 className={`text-xl font-bold ${textColor}`}>
                     {passwordModal.type === 'setup' ? 'Krijo Password Sigurie' : 'Futni Password'}
                  </h3>
               </div>
               
               <p className={`mb-5 text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {passwordModal.type === 'setup' ? 'Ky veprim kërkon një kod Password. Krijoni një kod për të mbrojtur dokumentet dhe fshirjet gabim.' : 'Për të fshirë dokumentet apo ndryshuar statuset X, ju lutem futni kodin Password.'}
               </p>
               
               <input 
                 type="password"
                 value={passwordInput}
                 onChange={(e) => setPasswordInput(e.target.value)}
                 pattern="[0-9]*"
                 inputMode="numeric"
                 autoFocus
                 className={`w-full text-center text-xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl mb-4 border outline-none transition-colors ${
                    isDark ? "bg-zinc-950 border-zinc-700 text-white focus:border-accent-500" : "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-accent-500"
                 }`}
                 onKeyDown={(e) => { if (e.key === 'Enter') handlePinSubmit(); }}
               />
               {passwordModal.type === 'verify' && (
                  <button onClick={handleForgotPassword} className={`w-full text-center text-sm font-medium mb-4 hover:underline ${isDark ? "text-accent-400" : "text-accent-600"}`}>
                      Harruat Password? (Dërgo në Email)
                  </button>
               )}

               <div className="flex justify-end gap-3">
                  <button onClick={() => setPasswordModal({ isOpen: false, action: null, type: 'verify' })} className={`px-4 py-2.5 font-medium rounded-lg transition-colors ${isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>
                     Anulo
                  </button>
                  <button onClick={handlePinSubmit} className="px-4 py-2.5 bg-accent-600 hover:bg-accent-500 text-white font-medium rounded-lg transition-colors shadow-lg">
                     Vazhdo
                  </button>
               </div>
            </div>
          </div>
      )}

      {/* GOOGLE CLOUD ACCOUNT & DOCUMENT MANAGER MODAL */}
      {authModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-4 pb-12 md:items-center justify-center bg-black/75 p-3 sm:p-4 animate-in fade-in overflow-y-auto">
             <div className={`max-w-3xl w-full p-4 sm:p-6 mb-16 md:mb-0 rounded-2xl shadow-2xl border flex flex-col gap-4 ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100" : "bg-white border-zinc-300 text-zinc-900"}`} style={{ maxHeight: '92vh' }}>
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                   <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                         <Cloud className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                         <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            Platforma Google Cloud Online
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                               ONLINE 24/7
                            </span>
                         </h3>
                         <p className="text-xs text-zinc-400">Menaxhimi i Llogarisë Google dhe Dokumenteve tuaja në Re</p>
                      </div>
                   </div>
                   <button onClick={() => setAuthModal(false)} className="p-2 rounded-lg bg-transparent text-zinc-400 hover:text-red-500 hover:bg-zinc-800 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>

                <div className="overflow-y-auto pr-1 space-y-4 scrollbar-hide">
                   {/* Status Banner & Unified Single Sync Button */}
                   <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isDark ? "bg-emerald-950/30 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
                      <div className="flex items-start gap-3">
                         <span className="relative flex h-3 w-3 mt-1 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                         </span>
                         <div>
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                               Statusi: I Lidhur me Google Cloud Server
                            </p>
                            <p className="text-xs text-zinc-300 opacity-90 mt-0.5">
                               Llogaria juaj është e lidhur përgjithmonë. Të gjitha fletët, shënimet, sekretet dhe kodi PIN ruhen automatikisht edhe offline!
                            </p>
                         </div>
                      </div>

                      {/* Unified Single Master Button */}
                      <button
                         type="button"
                         onClick={handleUnifiedCloudSync}
                         className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                      >
                         <RefreshCw className="w-4 h-4 animate-spin-slow" /> ⚡ Sinkronizo & Rifresko Tani (Cloud Sync)
                      </button>
                   </div>

                   {/* Google Account Connection Input */}
                   <div className={`p-4 rounded-xl border space-y-3 ${isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                         <User className="w-4 h-4" /> Llogaria Google me Akses në Cloud
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                         <input
                            type="email"
                            value={email || localStorage.getItem('grid_notepad_saved_email') || 'genti8319@gmail.com'}
                            onChange={(e) => {
                               const val = e.target.value;
                               setEmail(val);
                               localStorage.setItem('grid_notepad_saved_email', val);
                               localStorage.setItem('grid_notepad_user_account', val);
                            }}
                            placeholder="Adresa e-mail Google (p.sh. genti8319@gmail.com)"
                            className={`flex-1 px-3.5 py-2 rounded-xl border text-sm font-semibold outline-none transition-colors ${
                                isDark ? "bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500" : "bg-white border-zinc-300 text-zinc-900 focus:border-emerald-500"
                            }`}
                         />
                         <button
                            type="button"
                            onClick={async () => {
                               const mail = (email || localStorage.getItem('grid_notepad_saved_email') || 'genti8319@gmail.com').trim();
                               localStorage.setItem('grid_notepad_saved_email', mail);
                               localStorage.setItem('grid_notepad_user_account', mail);
                               showToast("Llogaria u ruajt përgjithmonë! Po sinkronizohen të dhënat...");
                               await handleUnifiedCloudSync();
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                         >
                            <Check className="w-4 h-4" /> Ruaj Llogarinë & Lidhu
                         </button>
                      </div>
                   </div>

                   {/* Document Action Control Bar - EDITOR, SAVE, PREVIEW, FULLVIEW, IMPORTBACKUP, EXPORT, SELECT ALL ONE, DELETE */}
                   <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                         <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            Menaxhimi i Dokumenteve Online ({documents.length})
                         </span>
                         <span className="text-[11px] text-zinc-400 font-mono">
                            Zgjedhur: {selectedCloudDocIds.length} / {documents.length}
                         </span>
                      </div>

                      {/* Toolbar Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                         <button
                            type="button"
                            onClick={handleSelectAllCloudDocs}
                            className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                               selectedCloudDocIds.length === documents.length && documents.length > 0
                                  ? "bg-emerald-600 text-white border-emerald-500"
                                  : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700" : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100")
                            }`}
                         >
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            {selectedCloudDocIds.length === documents.length && documents.length > 0 ? "DESELECT ALL" : "SELECT ALL ONE"}
                         </button>

                         <button
                            type="button"
                            onClick={() => {
                               if (selectedCloudDocIds.length === 1) {
                                  const docToOpen = documents.find(d => d.id === selectedCloudDocIds[0]);
                                  if (docToOpen) {
                                     openDocument(docToOpen);
                                     showToast(`U hap në Editor: "${docToOpen.title}"`);
                                     setAuthModal(false);
                                  }
                               } else if (documents.length > 0) {
                                  const docToOpen = documents.find(d => d.id === activeDocId) || documents[0];
                                  openDocument(docToOpen);
                                  showToast(`U hap në Editor: "${docToOpen.title}"`);
                                  setAuthModal(false);
                               } else {
                                  showToast("Nuk ka asnjë dokument për të hapur.");
                               }
                            }}
                            className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                         >
                            <FileText className="w-3.5 h-3.5" /> EDITOR
                         </button>

                         <button
                            type="button"
                            onClick={async () => {
                               showToast("Po ruhet dokumenti aktual në Cloud...");
                               await syncWithGoogleCloud(documents, false);
                            }}
                            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                         >
                            <Save className="w-3.5 h-3.5" /> SAVE
                         </button>

                         <button
                            type="button"
                            onClick={() => {
                               const docToPreview = selectedCloudDocIds.length > 0 ? documents.find(d => d.id === selectedCloudDocIds[0]) : (documents.find(d => d.id === activeDocId) || documents[0]);
                               if (docToPreview) setPreviewModalDoc(docToPreview);
                               else showToast("Nuk ka dokument për PREVIEW");
                            }}
                            className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                         >
                            <Eye className="w-3.5 h-3.5" /> PREVIEW
                         </button>

                         <button
                            type="button"
                            onClick={() => {
                               const docToFull = selectedCloudDocIds.length > 0 ? documents.find(d => d.id === selectedCloudDocIds[0]) : (documents.find(d => d.id === activeDocId) || documents[0]);
                               if (docToFull) setFullViewDoc(docToFull);
                               else showToast("Nuk ka dokument për FULLVIEW");
                            }}
                            className="py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                         >
                            <Monitor className="w-3.5 h-3.5" /> FULLVIEW
                         </button>

                         <button
                            type="button"
                            onClick={() => fileInputBackupRef.current?.click()}
                            className="py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                         >
                            <Upload className="w-3.5 h-3.5" /> IMPORT BACKUP
                         </button>
                         <input
                            type="file"
                            ref={fileInputBackupRef}
                            onChange={handleImportBackup}
                            accept=".json,.txt"
                            className="hidden"
                         />

                         <button
                            type="button"
                            onClick={() => handleExportBackup()}
                            className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                         >
                            <Download className="w-3.5 h-3.5" /> EXPORT
                         </button>

                         <button
                            type="button"
                            onClick={() => handleDeleteSelectedCloudDocs()}
                            className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                         >
                            <Trash2 className="w-3.5 h-3.5" /> DELETE ({selectedCloudDocIds.length})
                         </button>
                      </div>

                      {/* Online Documents List */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-hide pt-1">
                         {documents.length === 0 ? (
                            <div className="p-6 text-center text-xs text-zinc-500 border border-dashed rounded-xl">
                               Nuk ka asnjë dokument. Krijoni shënime në notebook dhe ato do të shfaqen automatikisht këtu!
                            </div>
                         ) : (
                            documents.map((docItem) => {
                               const rowCount = docItem.rows ? docItem.rows.length : 0;
                               const isSelected = selectedCloudDocIds.includes(docItem.id);
                               return (
                                  <div 
                                     key={docItem.id} 
                                     className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                                        isSelected 
                                           ? (isDark ? "bg-emerald-950/40 border-emerald-500/60" : "bg-emerald-50 border-emerald-300")
                                           : (isDark ? "bg-zinc-900/90 border-zinc-800 hover:border-emerald-500/40" : "bg-white border-zinc-200 hover:border-emerald-400")
                                     }`}
                                  >
                                     <div className="flex items-center gap-3 min-w-0">
                                        <button
                                           type="button"
                                           onClick={() => {
                                              setSelectedCloudDocIds(prev => 
                                                 prev.includes(docItem.id) ? prev.filter(id => id !== docItem.id) : [...prev, docItem.id]
                                              );
                                           }}
                                           className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                              isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-600 bg-transparent text-transparent hover:border-emerald-400"
                                           }`}
                                        >
                                           <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        </button>

                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                                           {docItem.title ? docItem.title.charAt(0).toUpperCase() : '📄'}
                                        </div>

                                        <div className="min-w-0">
                                           <p className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-zinc-900"}`}>
                                              {docItem.title || 'Dokument pa titull'}
                                           </p>
                                           <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                                              <span>{rowCount} rrjeshta</span>
                                              <span>•</span>
                                              <span className="text-emerald-400 font-mono">Në Cloud</span>
                                           </div>
                                        </div>
                                     </div>

                                     <div className="flex items-center gap-1 shrink-0">
                                        <button
                                           type="button"
                                           onClick={() => setPreviewModalDoc(docItem)}
                                           title="Preview"
                                           className="p-1.5 text-zinc-400 hover:text-amber-400 transition-colors"
                                        >
                                           <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                           type="button"
                                           onClick={() => {
                                              openDocument(docItem);
                                              showToast(`U hap dokumenti: "${docItem.title}"`);
                                              setAuthModal(false);
                                           }}
                                           className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold text-[11px] rounded-lg transition-colors"
                                        >
                                           Hape
                                        </button>
                                        <button
                                           type="button"
                                           onClick={() => handleDeleteSelectedCloudDocs(docItem.id)}
                                           title="Fshi"
                                           className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                                        >
                                           <Trash2 className="w-4 h-4" />
                                        </button>
                                     </div>
                                  </div>
                               );
                            })
                         )}
                      </div>
                   </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 mt-1">
                   <button 
                      type="button" 
                      onClick={() => setDebugLogsModal(true)} 
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 font-mono"
                   >
                      <Terminal className="w-3.5 h-3.5" /> Logcat Console / Diagnostikimi
                   </button>
                   <button 
                      type="button" 
                      onClick={() => setAuthModal(false)} 
                      className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition-colors"
                   >
                      Mbyll
                   </button>
                </div>
             </div>
          </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewModalDoc && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
            <div className={`max-w-3xl w-full p-5 rounded-2xl shadow-2xl border flex flex-col gap-4 ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100" : "bg-white border-zinc-300 text-zinc-900"}`} style={{ maxHeight: '85vh' }}>
               <div className="flex justify-between items-center border-b pb-3 border-zinc-700">
                  <div className="flex items-center gap-2">
                     <Eye className="w-5 h-5 text-amber-400" />
                     <h3 className="font-bold text-base">Parashikim Dokumenti: {previewModalDoc.title}</h3>
                  </div>
                  <button onClick={() => setPreviewModalDoc(null)} className="p-1 rounded text-zinc-400 hover:text-red-400">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="overflow-auto max-h-[60vh] border rounded-xl p-3 bg-zinc-950/40">
                  <table className="w-full text-left text-xs border-collapse">
                     <thead>
                        <tr className="border-b border-zinc-700 text-emerald-400">
                           {previewModalDoc.headers.map((h, idx) => (
                              <th key={idx} className="p-2 font-bold uppercase">{h}</th>
                           ))}
                        </tr>
                     </thead>
                     <tbody>
                        {previewModalDoc.rows.slice(0, 30).map((r, rIdx) => (
                           <tr key={rIdx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                              {previewModalDoc.headers.map((_, cIdx) => (
                                 <td key={cIdx} className="p-2 text-zinc-300">
                                    {(r as any)[`col${cIdx + 1}`] || '-'}
                                 </td>
                              ))}
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="flex justify-between items-center pt-2">
                  <button
                     type="button"
                     onClick={() => handleExportBackup(previewModalDoc)}
                     className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                  >
                     <Download className="w-3.5 h-3.5" /> Eksporto Këtë
                  </button>
                  <button
                     type="button"
                     onClick={() => {
                        openDocument(previewModalDoc);
                        setPreviewModalDoc(null);
                        setAuthModal(false);
                     }}
                     className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg"
                  >
                     Hape në Editor
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* DOCUMENT FULLVIEW MODAL */}
      {fullViewDoc && (
         <div className="fixed inset-0 z-[120] flex flex-col bg-zinc-950 text-white p-4 sm:p-6 animate-in fade-in overflow-hidden">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
               <div className="flex items-center gap-3">
                  <Monitor className="w-6 h-6 text-cyan-400" />
                  <div>
                     <h2 className="text-xl font-bold">{fullViewDoc.title}</h2>
                     <p className="text-xs text-zinc-400">Pamja e Plotë (FULLVIEW) • {fullViewDoc.rows.length} rrjeshta të dhëna</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button
                     type="button"
                     onClick={() => {
                        openDocument(fullViewDoc);
                        setFullViewDoc(null);
                        setAuthModal(false);
                     }}
                     className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                  >
                     <FileText className="w-4 h-4" /> Hape në Editor
                  </button>
                  <button
                     type="button"
                     onClick={() => setFullViewDoc(null)}
                     className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>
            </div>
            <div className="flex-1 overflow-auto border border-zinc-800 rounded-2xl p-4 bg-zinc-900/80">
               <table className="w-full text-left text-sm border-collapse">
                  <thead>
                     <tr className="border-b-2 border-zinc-700 text-cyan-400 font-bold uppercase text-xs">
                        <th className="p-2.5">#</th>
                        {fullViewDoc.headers.map((h, idx) => (
                           <th key={idx} className="p-2.5">{h}</th>
                        ))}
                     </tr>
                  </thead>
                  <tbody>
                     {fullViewDoc.rows.map((r, rIdx) => (
                        <tr key={rIdx} className="border-b border-zinc-800 hover:bg-zinc-800/40">
                           <td className="p-2.5 text-zinc-500 font-mono text-xs">{rIdx + 1}</td>
                           {fullViewDoc.headers.map((_, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-zinc-200">
                                 {(r as any)[`col${cIdx + 1}`] || ''}
                              </td>
                           ))}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}
      
      {/* DEBUG LOGS / LOGCAT CONSOLE MODAL */}
      {debugLogsModal && (
          <div className="fixed inset-0 z-[200] flex items-start pt-8 pb-12 md:items-center overflow-y-auto justify-center bg-black/70 p-4 animate-in fade-in">
             <div className={`max-w-2xl w-full p-6 rounded-2xl shadow-2xl border flex flex-col ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`} style={{ maxHeight: '85vh' }}>
                <div className="flex justify-between items-center mb-3">
                   <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-900"}`}>
                      <Terminal className="w-6 h-6 text-emerald-500" />
                      Logcat Console & Diagnostikimi i Sistemit
                   </h3>
                   <button onClick={() => setDebugLogsModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                
                <p className={`text-xs mb-3 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                   Gjithë historiku i tentativate të sinkronizimit me Google Cloud, AI Gemini API, dhe gabimeve të rrjetit. Mund t'i kopjoni të gjitha me 1 klik.
                </p>

                <textarea
                   readOnly
                   value={debugLogs.length === 0 ? "Nuk ka asnjë log të regjistruar deri tani. Kryeni një aksion ose dërgoni pyetje te AI për të parë historikun." : debugLogs.join('\n')}
                   onClick={(e) => e.currentTarget.select()}
                   className={`w-full h-72 p-3.5 rounded-xl border text-xs font-mono resize-none focus:outline-none leading-relaxed ${
                      isDark ? "bg-zinc-950 border-zinc-800 text-emerald-400" : "bg-zinc-900 border-zinc-700 text-emerald-300"
                   }`}
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                   <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => {
                         if (debugLogs.length === 0) return showToast("Nuk ka log-e për t'u kopjuar.");
                         navigator.clipboard.writeText(debugLogs.join('\n'));
                         showToast("📋 Gjithë log-et u kopjuan në clipboard (Select All TXT)!");
                      }} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md">
                         <Copy className="w-4 h-4" /> Kopjo Të Gjitha (Select All TXT)
                      </button>

                      <button onClick={() => {
                         if (debugLogs.length === 0) return showToast("Nuk ka log-e për t'u shkarkuar.");
                         const blob = new Blob([debugLogs.join('\n')], { type: 'text/plain;charset=utf-8' });
                         const url = URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url;
                         a.download = `logcat_debug_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.txt`;
                         a.click();
                         URL.revokeObjectURL(url);
                         showToast("💾 Skedari logcat .txt u shkarkua me sukses!");
                      }} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md">
                         <Download className="w-4 h-4" /> Shkarko TXT
                      </button>

                      <button onClick={() => {
                         askAi("Përshëndetje AI Gemini! Konfirmo nëse je online dhe funksional.");
                      }} className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md">
                         <Sparkles className="w-4 h-4" /> Testo AI Gemini
                      </button>
                   </div>

                   <button onClick={() => { 
                      localStorage.removeItem('grid_notepad_debug_logs'); 
                      setDebugLogs([]); 
                      showToast("Log-et u pastruan!");
                   }} className="px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-colors">
                      Pastro
                   </button>
                </div>
             </div>
          </div>
      )}

      {/* AI CHAT PANEL */}
      {aiChatModal && (
          <div className="fixed top-0 right-0 z-[95] w-full max-w-[100vw] sm:w-[400px] flex flex-col shadow-2xl border-l animate-in slide-in-from-right transition-colors"
               style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: isDark ? '#3f3f46' : '#e4e4e7', height: '100dvh' }}>
             <div className={`flex justify-between items-center p-4 border-b shrink-0 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                <div className="flex items-center gap-2">
                   <h3 className={`text-lg font-bold flex items-center gap-2 ${textColor}`}>
                      <Sparkles className="w-5 h-5 text-accent-500" /> {t('Asistenti AI', 'AI Assistant')}
                   </h3>
                </div>
                <div className="flex items-center gap-2">
                   <button
                      onClick={() => setShowKeyConfig(!showKeyConfig)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                         userGeminiKey ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                      title="Konfiguro Gemini API Key për APK / Offline"
                   >
                      <Key className="w-3.5 h-3.5" />
                      {userGeminiKey ? 'API Key Personale' : 'Cilëso API Key'}
                   </button>
                   <button onClick={() => setAiChatModal(false)} className="p-1.5 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
             </div>

             {/* API KEY CONFIG CARD */}
             {showKeyConfig && (
                <div className={`m-4 p-3.5 rounded-xl border flex flex-col gap-2 shrink-0 animate-in fade-in slide-in-from-top-2 ${
                   isDark ? "bg-zinc-900 border-amber-500/30" : "bg-amber-50/90 border-amber-300"
                }`}>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                         <Key className="w-4 h-4 text-amber-500" /> Çelësi i Veçantë Gemini API
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">APK / Direct</span>
                   </div>
                   <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                      Vendosni Gemini API Key për të garantuar punën e AI direkt nga telefoni në APK. Mund të merrni një çelës falas (Free API Key) te <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 underline font-bold">Google AI Studio</a>.
                   </p>
                   <div className="flex items-center gap-2 mt-1">
                      <input
                         type="password"
                         placeholder="AIzaSy..."
                         value={userGeminiKey}
                         onChange={(e) => setUserGeminiKey(e.target.value)}
                         className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-amber-500 font-mono ${
                            isDark ? "bg-zinc-950 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                         }`}
                      />
                      <button
                         onClick={() => {
                            if (userGeminiKey.trim()) {
                               localStorage.setItem('grid_notepad_gemini_key', userGeminiKey.trim());
                               showToast("🔑 Gemini API Key u ruajt me sukses!");
                            } else {
                               localStorage.removeItem('grid_notepad_gemini_key');
                               showToast("Çelësi u fshi.");
                            }
                            setShowKeyConfig(false);
                         }}
                         className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow shrink-0"
                      >
                         Ruaj Key
                      </button>
                   </div>
                </div>
             )}
             
             <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
                {aiChatResponse ? (
                   <div className={`p-4 rounded-xl text-sm leading-relaxed ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-50 text-zinc-700"}`}>
                      <div className="whitespace-pre-wrap">{aiChatResponse}</div>
                   </div>
                ) : (
                   <div className="flex flex-col gap-4">
                       <div className={`p-4 rounded-xl text-sm leading-relaxed ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-50 text-zinc-700"}`}>
                          {t('Përshëndetje! Jam Asistenti juaj AI. Mund të analizoj të gjithë bllokun tuaj aktual, çfarëdo lloj të dhënash të keni në të (llogaritje për kg/arka, ditë pune, emra, raporte spërkatjesh, medikamente, etj). Më kërkoni t\'i analizoj apo përmbledh sipas dëshirës!', 'Hello! I am your AI Assistant. I can analyze your entire current notepad, whatever data you have in it (calculations, work days, names, spray reports, medicines, etc). Ask me to analyze or summarize as you like!')}
                       </div>
                       
                       <div className="flex flex-col gap-2 mt-4">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{t('Sugjerime të Shpejta', 'Quick Suggestions')}</span>
                          <button 
                             onClick={() => {
                                 setAiChatInput('Të lutem analizo këtë bllok dhe më nxirr një raport të plotë bazuar në të dhënat që përmban.');
                                 askAi('Të lutem analizo këtë bllok dhe më nxirr një raport të plotë bazuar në të dhënat që përmban.');
                             }}
                             className={`text-left p-3 rounded-lg text-sm transition-colors border ${isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800"}`}
                          >
                             📊 {t('Më nxirr një raport të detajuar', 'Generate a detailed report')}
                          </button>
                          <button 
                             onClick={() => {
                                 setAiChatInput('Pastro rrjeshtat që janë absolutisht të njëjtë dhe fshi rrjeshtat komplet bosh nëse ndodhen mes të dhënave, duke më ripërditësuar listën.');
                                 askAi('Pastro rrjeshtat që janë absolutisht të njëjtë dhe fshi rrjeshtat komplet bosh nëse ndodhen mes të dhënave, duke më ripërditësuar listën.');
                             }}
                             className={`text-left p-3 rounded-lg text-sm transition-colors border ${isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800"}`}
                          >
                             ✨ {t('Pastro duplikatet dhe rrjeshtat bosh', 'Clean duplicates and empty rows')}
                          </button>
                       </div>
                   </div>
                )}
             </div>

             <div className={`p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t flex flex-col gap-2 shrink-0 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                {(aiChatImage || aiChatAudio) && (
                   <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {aiChatImage && (
                          <div className="relative group">
                             <img src={aiChatImage} className="h-14 w-14 object-cover rounded shadow ring-1 ring-zinc-500/30" />
                             <button onClick={() => setAiChatImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow">
                                <X className="w-3 h-3" />
                             </button>
                          </div>
                      )}
                      {aiChatAudio && (
                          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
                             <Mic className="w-4 h-4 text-accent-500" /> Audio gati
                             <button onClick={() => setAiChatAudio(null)} className="text-red-500 hover:text-red-600"><X className="w-3 h-3"/></button>
                          </div>
                      )}
                   </div>
                )}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                   <div className="flex items-center gap-2 w-full sm:w-auto order-last sm:order-none">
                       <label className={`cursor-pointer p-2 rounded-xl border transition-colors flex-1 sm:flex-none flex justify-center items-center ${isDark ? "bg-zinc-900 border-zinc-700 bg-zinc-700 text-white hover:bg-zinc-600 shadow-sm font-bold" : "bg-zinc-50 border-zinc-300 hover:bg-zinc-100 text-zinc-600"}`} title={t("Bashkëngjit Imazh", "Attach Image")}>
                         <ImagePlus className="w-5 h-5" />
                         <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleAiChatImageUpload} />
                       </label>
                       <button 
                          onClick={isRecordingMime ? stopRecordingAiAudio : startRecordingAiAudio} 
                          className={`p-2 rounded-xl border transition-colors flex-1 sm:flex-none flex justify-center items-center ${isRecordingMime ? "bg-red-500 text-white shadow-lg shadow-red-500/20 border-red-500 animate-pulse" : (isDark ? "bg-zinc-900 border-zinc-700 bg-zinc-700 text-white hover:bg-zinc-600 shadow-sm font-bold" : "bg-zinc-50 border-zinc-300 hover:bg-zinc-100 text-zinc-600")}`} 
                          title={t("Regjistro Zërin", "Record Voice")}>
                         {isRecordingMime ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                       </button>
                   </div>
                   <div className="flex items-center gap-2 w-full flex-1">
                       <input
                          type="text"
                          className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl border focus:outline-none focus:border-accent-500 transition-colors ${
                             isDark ? "bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500" : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400"
                          }`}
                          placeholder={t("Shkruani pyetjen...", "Type a question...")}
                          value={aiChatInput}
                          onChange={e => {
                              const val = e.target.value;
                              setAiChatInput(val);
                              localStorage.setItem('grid_aichat_input', val);
                          }}
                          onKeyDown={e => { if(e.key === 'Enter') askAi(); }}
                       />
                       <button onClick={() => askAi()} disabled={isAiThinking || (!aiChatInput.trim() && !aiChatImage && !aiChatAudio)} className="px-4 py-2.5 bg-accent-600 hover:bg-accent-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-600/20 flex items-center justify-center min-w-[64px] shrink-0">
                           {isAiThinking ? <Loader2 className="w-5 h-5 animate-spin"/> : t("Pyet", "Ask")}
                       </button>
                   </div>
                </div>
             </div>
          </div>
      )}

      {/* BACKUP MODAL */}
      {backupModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">
             <div className={`max-w-xl w-full max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
                <div className={`flex justify-between items-center p-5 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <h3 className={`text-xl font-bold flex items-center gap-2 ${textColor}`}>
                      <Database className="w-6 h-6 text-accent-500" /> {t('Sistemi i Sigurisë (Backup)', 'Security System (Backup)')}
                   </h3>
                   <button onClick={() => setBackupModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                
                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
                   <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                     {t('Riktheni ose ruani të gjitha të dhënat tuaja. Keni dy opsione: Ruajtje Online në Cloud (kërkon llogari) dhe Ruajtje manuale në pajisjen tuaj.', 'Restore or save all your data. You have two options: Cloud Auto-sync (requires account) and Manual local backup.')}
                   </p>

                   {/* Local Storage Backup */}
                   <div className={`p-4 rounded-xl border ${isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200"}`}>
                      <h4 className={`font-bold mb-2 flex items-center gap-2 ${textColor}`}>
                         <FolderDown className="w-5 h-5 text-accent-500" /> {t('Memorja e Pajisjes (Phone / PC)', 'Device Memory (Phone / PC)')}
                      </h4>
                      <p className={`text-sm mb-4 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                        {t('Shkarko një skedar të sigurt (.json) me të gjitha të dhënat dhe ruaje në pajisjen tënde. Përdore këtë skedar për të rikthyer të dhënat nëse aplikacioni fshihet.', 'Download a secure file (.json) with all your data and keep it stored locally. Use this file to restore your data if needed.')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                         <button onClick={exportLocalBackup} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border ${isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"}`}>
                            <Download className="w-4 h-4" /> {t('Shkarko / Ruaj', 'Download / Save')}
                         </button>
                         <label className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border cursor-pointer ${isDark ? "bg-accent-600/20 text-accent-400 border-accent-500/30 hover:bg-accent-600/30" : "bg-accent-500 hover:bg-accent-600 text-white shadow-md font-bold border-transparent"}`}>
                            <Upload className="w-4 h-4" /> {t('Rikthe / Ngarko', 'Restore / Upload')}
                            <input type="file" accept=".json" className="hidden" onChange={importLocalBackup} />
                         </label>
                      </div>
                   </div>

                   {/* Cloud Backup */}
                   <div className={`p-4 rounded-xl border ${isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200"}`}>
                      <h4 className={`font-bold mb-2 flex items-center gap-2 ${textColor}`}>
                         <Cloud className="w-5 h-5 text-accent-500" /> {t('Siguria në Cloud (Online)', 'Cloud Security (Online)')}
                      </h4>
                      <p className={`text-sm mb-4 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                        {t('Të dhënat tuaja rezervohen automatikisht në Cloud sapo jeni i kyçur. Mund t\'i shkarkoni përsëri edhe nëse ndërroni telefon.', 'Your data is automatically synced to the Cloud when you are logged in. You can redownload it even if you switch phones.')}
                      </p>
                      {user ? (
                         <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => {forceCloudBackup(); setBackupModal(false)}} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20`}>
                               <Cloud className="w-4 h-4" /> {t('Shto në Cloud', 'Push to Cloud')}
                            </button>
                            <button onClick={handleFullCloudRestore} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border ${isDark ? "bg-orange-600 hover:bg-orange-500 text-white shadow-md border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold border-transparent"}`}>
                               <Download className="w-4 h-4" /> {t('Rikthe Ngarko', 'Restore All')}
                            </button>
                            <button onClick={() => {setBackupModal(false); openCloudModal();}} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border ${isDark ? "bg-green-600 hover:bg-green-500 text-white shadow-md border-transparent" : "bg-green-500 hover:bg-green-600 text-white shadow-md font-bold border-transparent"}`}>
                               <FolderOpen className="w-4 h-4" /> {t('Listo Online', 'List Online')}
                            </button>
                         </div>
                      ) : (
                         <button onClick={() => {setBackupModal(false); setAuthModal(true)}} className={`w-full flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg`}>
                            <LogIn className="w-4 h-4" /> {t('Kyçuni për Cloud', 'Login for Cloud')}
                         </button>
                      )}
                   </div>

                   {/* GitHub Gist Backup */}
                   <div className={`p-4 rounded-xl border ${isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200"}`}>
                      <h4 className={`font-bold mb-2 flex items-center gap-2 ${textColor}`}>
                         <Github className="w-5 h-5 text-zinc-900 dark:text-white" /> Cloud Gist (GitHub)
                      </h4>
                      <p className={`text-sm mb-4 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                        Platforma Gist Online: Ruani shënimet në profilin tuaj GitHub. 
                        <i>Shënim: GitHub nuk lejon më fjalëkalim, duhet të përdorni Token. </i> 
                        <a href="https://github.com/settings/tokens/new?scopes=gist&description=Notepad+Backup" target="_blank" rel="noopener noreferrer" className="text-accent-500 underline font-bold">Krijo Token (Klik Këtu)</a>.
                      </p>
                      
                      <div className="flex flex-col gap-3 mb-4">
                         <input 
                            type="password" 
                            placeholder="Personal Token (Si Fjalëkalim)" 
                            value={gistToken}
                            onChange={(e) => { setGistToken(e.target.value); localStorage.setItem('grid_notepad_gist_token', e.target.value); }}
                            className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-accent-500 ${isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"}`}
                         />
                         <input 
                            type="text" 
                            placeholder="Gist ID (Lëre bosh herën e parë)" 
                            value={gistId}
                            onChange={(e) => { setGistId(e.target.value); localStorage.setItem('grid_notepad_gist_id', e.target.value); }}
                            className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-accent-500 ${isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"}`}
                         />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                         <button onClick={saveToGist} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border ${isDark ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-md border-transparent"}`}>
                            <Upload className="w-4 h-4" /> Ruaj (Sync)
                         </button>
                         <button onClick={loadFromGist} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border ${isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"}`}>
                            <Download className="w-4 h-4" /> Ngarko / Rikthe
                         </button>
                      </div>
                      
                      <div className="mt-3">
                         <button onClick={viewGistContent} className={`w-full flex justify-center items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-colors border shadow-sm ${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}`}>
                            <Eye className="w-4 h-4" /> Shiko Dokumentet Online (Gist)
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
      )}

      {/* GIST VIEWER MODAL */}
      {gistViewerModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[40vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">
             <div className={`max-w-4xl w-full max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
                <div className={`flex justify-between items-center p-5 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <h3 className={`text-xl font-bold flex items-center gap-2 ${textColor}`}>
                      <Github className="w-6 h-6 text-zinc-900 dark:text-white" /> Dokumenti Online (Gist)
                   </h3>
                   <button onClick={() => setGistViewerModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
                   {gistViewerContent ? (
                       (() => {
                           try {
                               const parsedDocs = JSON.parse(gistViewerContent);
                               if (!Array.isArray(parsedDocs)) throw new Error();
                               return parsedDocs.map((docItem: any) => (
                                   <div key={docItem.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 transition-colors ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-200"}`}>
                                       <div className="flex-1">
                                          <h4 className={`font-bold ${textColor}`}>{docItem.title || 'I paemërtuar'}</h4>
                                          <div className={`text-xs mt-1 flex items-center gap-3 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                              <span>{docItem.rows?.length || 0} Rrjeshta</span>
                                              <span>•</span>
                                              <span>{docItem.headers?.length || 0} Kolona</span>
                                          </div>
                                       </div>
                                   </div>
                               ));
                           } catch (e) {
                               return (
                                  <div className="p-0 overflow-y-auto flex-1 flex flex-col bg-zinc-950 text-green-400 font-mono text-xs md:text-sm rounded-lg">
                                     <pre className="p-4 overflow-x-auto whitespace-pre-wrap">
                                        {gistViewerContent}
                                     </pre>
                                  </div>
                               );
                           }
                       })()
                   ) : (
                       <div className="flex justify-center items-center py-10">
                           <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
                       </div>
                   )}
                </div>
                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                    <button onClick={() => setGistViewerModal(false)} className={`px-4 py-2 font-medium rounded-lg transition-colors border ${isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"}`}>
                        Mbyll
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* CLOUD MODAL */}
      {cloudModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">
             <div className={`max-w-2xl w-full max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
                <div className={`flex justify-between items-center p-5 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <h3 className={`text-xl font-bold flex items-center gap-2 ${textColor}`}>
                      <button onClick={() => setCloudModal(false)} className="mr-2 p-1.5 bg-zinc-500/10 hover:bg-zinc-500/20 rounded-lg transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>
                      </button>
                      <Cloud className="w-6 h-6 text-emerald-500" /> Platforma Cloud Google
                   </h3>
                   <button onClick={() => setCloudModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                
                <div className={`p-4 border-b flex flex-wrap gap-2 ${isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                    <button onClick={() => {forceCloudBackup();}} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-accent-600 hover:bg-accent-500 text-white border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white border-transparent"}`}>
                        <Cloud className="w-4 h-4 inline-block mr-1" /> Shto me Sync (Google Cloud)
                    </button>
                    <button onClick={() => {handleFullCloudRestore();}} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white border-transparent"}`}>
                        <Download className="w-4 h-4 inline-block mr-1" /> Rikthe nga Google Cloud
                    </button>
                    <button onClick={() => loadFromGoogleCloud(false)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${isDark ? "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent" : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"}`}>
                        <RefreshCw className="w-3.5 h-3.5" /> Rifresko
                     </button>
                     <button onClick={() => { setCloudModal(false); setAiChatModal(true); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${isDark ? "bg-purple-600 hover:bg-purple-500 text-white border-transparent" : "bg-purple-600 hover:bg-purple-700 text-white border-transparent"}`}>
                        <Sparkles className="w-3.5 h-3.5" /> AI Gemini
                     </button>
                     <button onClick={exportAllTxt} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}`}>TXT</button>
                    <button onClick={exportAllPdf} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}`}>PDF</button>
                    <button onClick={exportLocalBackup} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}`}>JSON</button>
                    <button onClick={exportAllCsv} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}`}>CSV</button>
                </div>
                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
                   {isFetchingCloud ? (
                      <div className="flex justify-center items-center py-10">
                         <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
                      </div>
                   ) : cloudDocs.length === 0 ? (
                      <div className={`text-center py-10 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                         Nuk u gjet asnjë dokument online.
                      </div>
                   ) : (
                      cloudDocs.map(cDoc => (
                         <div key={cDoc.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 transition-colors ${
                            isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                         }`}>
                             <div className="flex-1">
                                <h4 className={`font-bold ${textColor}`}>{cDoc.title}</h4>
                                <div className={`text-xs mt-1 flex items-center gap-3 ${isDark ? "text-zinc-500": "text-zinc-500"}`}>
                                   <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{safeFormatDate(cDoc.createdAt, 'dd MMM yyyy')}</span>
                                   <span className="flex items-center gap-1"><Save className="w-3 h-3" />{safeFormatDate(cDoc.updatedAt, 'HH:mm')}</span>
                                </div>
                             </div>
                             
                             <div className="flex flex-wrap w-full sm:w-auto items-center justify-end gap-2">
                                <button onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   executeProtectedAction(() => {
                                       setCloudDocToDelete(cDoc);
                                   });
                                }} className={`p-3 sm:px-4 sm:py-2.5 text-sm font-medium rounded-lg transition-colors border ${
                                   isDark ? "bg-red-600 hover:bg-red-500 text-white shadow-md border-transparent" : "bg-red-500 hover:bg-red-600 text-white shadow-md font-bold border-transparent"
                                }`} title="Fshi nga Cloud">
                                   <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 pointer-events-none" />
                                </button>
                                <button onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   const existing = documents.findIndex(d => d.id === cDoc.id);
                                   let newDocs = [...documents];
                                   if (existing >= 0) newDocs[existing] = cDoc;
                                   else newDocs.push(cDoc);
                                   setDocuments(newDocs);
                                   localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
                                   openDocument(cDoc);
                                   setCloudModal(false);
                                   setAiChatModal(true);
                                }} className={`p-3 sm:px-4 sm:py-2.5 text-sm font-medium rounded-lg transition-colors border ${
                                   isDark ? "bg-accent-600 hover:bg-accent-500 text-white shadow-md border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white shadow-md font-bold border-transparent"
                                }`} title="Analizo me AI (AI Search)">
                                   <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 pointer-events-none" />
                                </button>
                                <button onClick={() => {
                                   const existing = documents.findIndex(d => d.id === cDoc.id);
                                   let newDocs = [...documents];
                                   if (existing >= 0) newDocs[existing] = cDoc;
                                   else newDocs.push(cDoc);
                                   setDocuments(newDocs);
                                   localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
                                   showToast("Dokumenti u ruajt në memorien e telefonit!");
                                }} className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
                                   isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"
                                }`}>
                                   <FolderDown className="w-4 h-4" /> <span className="sm:hidden lg:inline">Ruaj / Save</span>
                                </button>
                                <button onClick={() => {
                                   openDocument(cDoc);
                                   setCloudModal(false);
                                }} className={`flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20`}>
                                   <FolderUp className="w-4 h-4" /> <span className="sm:hidden lg:inline">Hap / Preview</span>
                                </button>
                             </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
          </div>
      )}

      
    </>
  );

  const pinOverlayJSX = appLocked ? (
    <div className="fixed inset-0 z-[200] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className={`max-w-sm w-full p-8 rounded-3xl shadow-2xl border flex flex-col items-center ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
          <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-accent-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('Blloku i Kyçur', 'Notepad Locked')}</h2>
          <p className={`text-sm text-center mb-8 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
             {t('Ju lutem futni kodin Password për të vazhduar.', 'Please enter Password to continue.')}
          </p>
          <input 
             type="password"
             value={appLockInput}
             onChange={e => setAppLockInput(e.target.value)}
             className={`w-full text-center text-3xl tracking-[0.5em] font-black py-4 px-4 rounded-xl mb-6 border outline-none transition-colors shadow-inner ${
                isDark ? "bg-zinc-950 border-zinc-700 text-white focus:border-accent-500" : "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-accent-500"
             }`}
             onKeyDown={e => { if(e.key === 'Enter') handleAppUnlock(); }}
             autoFocus
             inputMode="numeric"
             placeholder="****"
          />
          <button onClick={handleAppUnlock} className="w-full py-4 bg-accent-600 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-accent-500/20 text-lg">
             {t('Shkyç', 'Unlock')}
          </button>
      </div>
    </div>
  ) : null;

  // CATALOG VIEW
  if (!activeDocId) {
    return (
      <div 
        className={`w-full max-w-4xl mx-auto flex flex-col sm:border sm:rounded-2xl shadow-2xl relative overflow-hidden h-[100dvh] sm:min-h-[600px] sm:h-[90vh] ${baseBg} ${borderColor}`}
      >
         <div className={`flex border-b p-4 items-center justify-between shadow-sm sticky top-0 ${toolbarBg} ${borderColor} sm:rounded-t-2xl z-10`}>
            <div className="flex items-center gap-3">
               <FileText className={`w-6 h-6 ${isDark ? 'text-accent-500' : 'text-accent-600'}`} />
               <h1 className={`text-xl font-bold ${textColor}`}>{t('Bllok Shënimesh', 'Notepad')}</h1>
               {user && (
                 <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold ring-1 ring-green-500/20">
                    <Cloud className="w-3 h-3" /> {user.email ? user.email.split('@')[0] : 'Online'}
                 </span>
               )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
               {!user ? (
                   <button onClick={() => setAuthModal(true)} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20`}>
                      <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">{t('Hyrje', 'Login')}</span>
                   </button>
               ) : (
                   <button onClick={() => {
                      localStorage.removeItem('grid_notepad_saved_pwd');
                      signOut(auth);
                   }} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300" : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700"}`}>
                      <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t('Dil', 'Logout')}</span>
                   </button>
               )}
               <div className="relative">
                 <button 
                   onClick={() => setShowThemeMenu(!showThemeMenu)}
                   className={`p-2 rounded-full transition-colors ${isDark ? "bg-accent-600 hover:bg-accent-500 text-white shadow-md border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white shadow-md font-bold border-transparent"}`}
                   title={t("Ndërro Ngjyrën", "Change Color")}
                 >
                   <Palette className="w-5 h-5" />
                 </button>
                 {showThemeMenu && (
                    <div className={`absolute right-0 top-full mt-2 p-2 rounded-xl border shadow-xl z-50 flex gap-2 w-[220px] max-w-[80vw] overflow-x-auto scrollbar-hide touch-pan-x ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
                       {(Object.keys(COLOR_THEMES) as Array<keyof typeof COLOR_THEMES>).map(c => (
                          <button key={c} onClick={() => { setAccentColor(c); setShowThemeMenu(false); }} className="w-8 h-8 shrink-0 rounded-full border border-black/10 transition-transform hover:scale-110" style={{ backgroundColor: c === 'kontrast' ? '#000000' : COLOR_THEMES[c][500] }} title={c === 'kontrast' ? t('Kontrast i Lartë', 'High Contrast') : c} />
                       ))}
                    </div>
                 )}
               </div>
               <button 
                 onClick={toggleTheme}
                 className={`p-2 rounded-full transition-colors ${isDark ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-md border-transparent" : "bg-zinc-800 hover:bg-zinc-700 text-white shadow-md font-bold border-transparent"}`}
                 title={t("Ndërro Pamjen", "Toggle Theme")}
               >
                 {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>
               <div className="relative">
                 <button 
                   onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                   className={`p-2 rounded-full transition-colors ${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white shadow-md font-bold" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 shadow-md font-bold"}`}
                   title={t("Opsionet e Bllokut", "Notepad Options")}
                 >
                   <Settings className="w-5 h-5" />
                 </button>
                 {showOptionsMenu && (
                    <div className={`absolute right-0 top-full mt-2 py-2 rounded-xl border shadow-xl z-[110] flex flex-col w-[320px] max-h-[80vh] overflow-y-auto overflow-x-hidden scrollbar-hide ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"}`}>
                       <h4 className="px-4 py-2 font-bold mb-1 border-b text-xs uppercase tracking-wider text-accent-500 border-zinc-500/20">{t('Organizimi i Dokumenteve', 'Document Organization')}</h4>
                       <button onClick={handleSortDocsAZ} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white`}>
                           <ArrowDownAZ className="w-4 h-4 shrink-0" /> {t('Rendit A-Z (Titulli)', 'Sort A-Z (Title)')}
                       </button>
                       <button onClick={handleSortDocsZA} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white`}>
                           <ArrowUpAZ className="w-4 h-4 shrink-0" /> {t('Rendit Z-A (Titulli)', 'Sort Z-A (Title)')}
                       </button>
                       <button onClick={handleSortDocsNewest} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white`}>
                           <CalendarDays className="w-4 h-4 shrink-0" /> {t('Më Të Rejat (Data)', 'Newest (Date)')}
                       </button>
                       <button onClick={handleSortDocsOldest} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white`}>
                           <Calendar className="w-4 h-4 shrink-0" /> {t('Më Të Vjetrat (Data)', 'Oldest (Date)')}
                       </button>
                       
                       <div className="h-px w-full my-1 border-b border-zinc-500/20"></div>
                       <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-accent-500">{t('Gjuha / Language', 'Language / Gjuha')}</h4>
                       <button onClick={() => { const next = language === 'sq' ? 'en' : 'sq'; setLanguage(next); localStorage.setItem('grid_lang', next); }} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white`}>
                           <Settings className="w-4 h-4 shrink-0" /> {t('Gjuha Aktuale: Shqip (Kliko)', 'Current Language: EN (Click)')}
                       </button>

                       <div className="h-px w-full my-1 border-b border-zinc-500/20"></div>

                       <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-purple-500">{t('Editimi në Masë (Batch)', 'Bulk Editing (Batch)')}</h4>
                       <button onClick={handleCapitalizeTitles} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-purple-600 hover:text-white`}>
                           <CaseSensitive className="w-4 h-4 shrink-0" /> {t('Kapitalizo Titujt e Dokumenteve', 'Capitalize Document Titles')}
                       </button>
                       <button onClick={handleRemoveAllRowStatuses} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-purple-600 hover:text-white`}>
                           <RemoveFormatting className="w-4 h-4 shrink-0" /> {t('Hiq Ngjyrat e Rrjeshtave (Statuset)', 'Remove Row Colors (Statuses)')}
                       </button>
                       <div className="h-px w-full my-1 border-b border-zinc-500/20"></div>

                       <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-accent-500">{t('Siguria & Aksesi', 'Security & Access')}</h4>
                       <div className="flex items-center justify-between px-4 py-3 hover:bg-accent-500/10 transition-colors">
                           <div className="flex items-center gap-3 text-sm font-medium">
                               <Lock className="w-4 h-4 shrink-0 text-accent-500" /> Password (ON / OFF)
                           </div>
                           <button onClick={() => {
                               if (localStorage.getItem('grid_notepad_pin')) {
                                   handleForceRemovePassword();
                               } else {
                                   handleForceChangePassword();
                               }
                           }} className={`w-10 h-5 rounded-full relative transition-colors ${localStorage.getItem('grid_notepad_pin') ? 'bg-accent-500' : (isDark ? 'bg-zinc-700' : 'bg-zinc-300')}`}>
                               <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${localStorage.getItem('grid_notepad_pin') ? 'translate-x-5' : ''}`} />
                           </button>
                       </div>
                       <button onClick={handleForceChangePassword} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white`}>
                           <Lock className="w-4 h-4 shrink-0" /> {localStorage.getItem('grid_notepad_pin') ? 'CHANGE PASSWORD' : 'NEW PASSWORD'}
                       </button>

                       <div className="h-px w-full my-1 border-b border-zinc-500/20"></div>
                       <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-sky-500 flex items-center gap-2">
                          <Cloud className="w-4 h-4" /> {t('Sinkronizimi (Cloud Auto-save)', 'Cloud Auto-save Frequency')}
                       </h4>
                       <div className="px-4 pb-2">
                           <select 
                               value={cloudSyncFrequency}
                               onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setCloudSyncFrequency(val);
                                  localStorage.setItem('grid_cloud_sync_freq', val.toString());
                                  if (val === -1) {
                                     showToast(t("Auto-ruajtja në Cloud u çaktivizua", "Cloud auto-save disabled"));
                                  } else {
                                     showToast(t(`Ruajtja në Cloud u bë çdo ${val/1000}s`, `Cloud auto-save set to ${val/1000}s`));
                                  }
                               }}
                               className={`w-full p-2 mt-1 rounded border text-sm font-medium focus:outline-none transition-colors ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-sky-500" : "bg-zinc-100 border-zinc-300 text-zinc-800 focus:border-sky-500"}`}
                           >
                               <option value="1500">{t("E Menjëhershme (1.5 sekonda)", "Immediate (1.5 seconds)")}</option>
                               <option value="5000">{t("Çdo 5 sekonda (Rekomanduar)", "Every 5 seconds (Recommended)")}</option>
                               <option value="10000">{t("Çdo 10 sekonda", "Every 10 seconds")}</option>
                               <option value="30000">{t("Çdo 30 sekonda", "Every 30 seconds")}</option>
                               <option value="60000">{t("Çdo 1 minutë", "Every 1 minute")}</option>
                               <option value="-1">{t("Jo Automatik (Vetëm Manual)", "Off (Manual only)")}</option>
                           </select>
                       </div>

                       <div className="h-px w-full my-1 border-b border-zinc-500/20"></div>
                       <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-green-500">{t('Menaxhimi Lokal (JSON)', 'Local Management')}</h4>
                       <button onClick={handleExportDataJson} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-green-600 hover:text-white`}>
                           <FileJson className="w-4 h-4 shrink-0" /> {t('Eksporto të gjitha si JSON', 'Export all as JSON')}
                       </button>
                       <label className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-green-600 hover:text-white cursor-pointer`}>
                           <UploadCloud className="w-4 h-4 shrink-0" /> {t('Importo nga JSON (Rikthe)', 'Import from JSON (Restore)')}
                           <input type="file" accept=".json" className="hidden" onChange={handleImportDataJson} />
                       </label>
                       <div className="h-px w-full my-1 border-b border-zinc-500/20"></div>

                       <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-orange-500">{t('Pamja & Tema', 'Appearance & Theme')}</h4>
                       <button onClick={() => {
                           const next = !themeSync;
                           setThemeSync(next);
                           localStorage.setItem('grid_theme_sync', next.toString());
                           showToast(next ? t('Sinkronizimi me Sistemin u aktivizua', 'System Theme Sync enabled') : t('Sinkronizimi me Sistemin u çaktivizua', 'System Theme Sync disabled'));
                       }} className={`flex items-center justify-between px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-orange-600 hover:text-white`}>
                           <div className="flex items-center gap-3">
                               <Monitor className="w-4 h-4 shrink-0" /> {t('Sinkronizo me Sistemin', 'Sync with System OS')}
                           </div>
                           <div className={`w-8 h-4 rounded-full transition-colors relative ${themeSync ? 'bg-green-500' : 'bg-zinc-500'}`}>
                               <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${themeSync ? 'left-[18px]' : 'left-0.5'}`}></div>
                           </div>
                       </button>
                       <button onClick={handleResetVisualSettings} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-orange-600 hover:text-white`}>
                           <Paintbrush className="w-4 h-4 shrink-0" /> {t('Rivendos Pamjen Baza', 'Reset Base Appearance')}
                       </button>

                       <div className="h-px w-full my-1 border-b border-zinc-500/20"></div>
                       <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-green-500">{t('Menaxhimi Lokal (Ruajtja e Dokumenteve)', 'Local Management (Save Documents)')}</h4>
                        <div className="px-4 py-2 flex flex-col gap-4">
                            {/* PËRZGJEDHJA E METODËS SË RUAJTJES / SHKARKIMIT */}
                            <div className="flex flex-col gap-2 p-3 rounded-xl border border-zinc-500/20 bg-zinc-500/5 w-full">
                                <label className={`text-xs font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                                    {t('Mënyra e Shkarkimit / Ruajtjes:', 'Download / Save Method:')}
                                </label>
                                <select 
                                    value={downloadMethod} 
                                    onChange={(e: any) => {
                                        const method = e.target.value;
                                        setDownloadMethod(method);
                                        localStorage.setItem('grid_download_method', method);
                                        showToast(`U zgjodh mënyra: ${method}`);
                                    }}
                                    className={`w-full p-2 rounded border text-sm font-medium focus:outline-none transition-colors ${
                                        isDark 
                                            ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-sky-500" 
                                            : "bg-white border-zinc-300 text-zinc-800 focus:border-sky-500"
                                    }`}
                                >
                                    <option value="folder">{t('Lokaliteti i Dosjes (Emri i Dosjes me shkrim ose zgjedhje)', 'Folder Location (Manual name or chosen folder)')}</option>
                                    <option value="share">{t('Ndarja e Sistemit (Share Sheet - Më e mira për Android/Celular)', 'System Share (Share Sheet - Best for Android/Mobile)')}</option>
                                    <option value="direct">{t('Shkarkim Direkt (Në dosjen e paracaktuar "Downloads")', 'Direct Download (In default "Downloads" folder)')}</option>
                                    <option value="picker">{t('Dritarja e Ruajtjes (File Picker - Rekomanduar për PC)', 'File Picker Save Dialog (Recommended for PC)')}</option>
                                    <option value="auto">{t('Zgjedhje Automatike (Auto)', 'Automatic Choice (Auto)')}</option>
                                </select>
                                <span className="text-[10px] text-zinc-500 font-normal leading-normal mt-1">
                                    {downloadMethod === 'share' && t('Këshillë: Kjo hap menunë amtare të Android ku mund të zgjidhni direkt "Save to Files" dhe të caktoni çdo dosje në memorien e telefonit.', 'Tip: This opens the native Android menu where you can directly select "Save to Files" and assign any folder in the phone memory.')}
                                    {downloadMethod === 'folder' && t('Këshillë: Shton automatikisht emrin ose rrugën e dosjes përpara emrit të skedarit kur ruhet në downloads.', 'Tip: Automatically prepends the folder name/path to the filename when saving to downloads.')}
                                    {downloadMethod === 'direct' && t('Këshillë: Shkarkon direkt skedarin në dosjen e paracaktuar Downloads pa asnjë pyetje.', 'Tip: Downloads the file directly into the default Downloads folder with no questions asked.')}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3 p-3 rounded-xl border border-green-500/20 bg-green-500/10 w-full">
                                <span className="leading-tight font-bold text-sm text-green-600 dark:text-green-500">
                                    {t('Vendndodhja dhe Dosja Ruajtëse', 'Storage Location & Folder')}
                                </span>
                                {Capacitor.isNativePlatform() && (
                                    <div className="text-[11px] font-medium text-blue-600 bg-blue-100 p-2 rounded">
                                       {t('Në celular (Android), skedarët do të ruhen automatikisht në memorien tuaj te dosja "Documents/EmriQëShkruaniMëPoshtë".', 'On mobile, files will automatically be saved to Documents/FolderYouSpecifyBelow.')}
                                    </div>
                                )}

                                
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className={`text-[11px] font-semibold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                        {t('Shkruaj manualisht emrin/rrugën e Dosjes për celular (p.sh. Blloku, Shënime):', 'Manually write Folder name/path for mobile (e.g. Notebook, Notes):')}
                                    </label>
                                    <input 
                                        type="text"
                                        value={folderName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFolderName(val);
                                            localStorage.setItem('grid_mock_folder', val);
                                        }}
                                        placeholder={t('Shkruaj emrin e dosjes këtu...', 'Type folder name here...')}
                                        className={`w-full p-2 text-xs rounded border transition-colors outline-none ${
                                            isDark 
                                                ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:border-green-500" 
                                                : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-green-500"
                                        }`}
                                    />
                                </div>

                                <div className="h-px w-full bg-green-500/20 my-1"></div>
                                {!Capacitor.isNativePlatform() && (
                                <div className="flex flex-col gap-2 items-start">
                                    <span className="text-[11px] font-semibold text-zinc-500">
                                        {t('Zgjedhja automatike (Për PC ose shfletues të përputhshëm):', 'Automatic picking (For PC or compatible browsers):')}
                                    </span>
                                    <button onClick={async () => {
                                        try {
                                            if (typeof (window as any).showDirectoryPicker === "function" && window.self === window.top) {
                                                const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
                                                await saveDirectoryHandle(handle);
                                                setFolderName(handle.name);
                                                localStorage.setItem("grid_mock_folder", handle.name);
                                                setDownloadMethod("folder");
                                                localStorage.setItem("grid_download_method", "folder");
                                                showToast("Dosja u Lidh me Sukses!");
                                            } else {
                                                document.getElementById("fallback-dir-picker")?.click();
                                            }
                                        } catch (e: any) {
                                            if (e.name !== "AbortError") {
                                                document.getElementById("fallback-dir-picker")?.click();
                                            }
                                        }
                                    }} className={`px-3 py-1.5 text-xs font-semibold rounded shadow-sm transition-colors ${isDark ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
                                        {folderName ? `${t('Ndrysho Dosjen me Picker', 'Change Folder with Picker')} (Aktuale: ${folderName})` : t("Zgjidh Dosjen me Picker", "Choose Folder with Picker")}
                                    </button>
                                    <input
                                        type="file"
                                        id="fallback-dir-picker"
                                        className="hidden"
                                        // @ts-ignore
                                        webkitdirectory="true"
                                        directory="true"
                                        onChange={(e: any) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                const path = e.target.files[0].webkitRelativePath || e.target.files[0].name;
                                                const folder = path ? path.split("/")[0] : "Dosja e Telefonit";
                                                setFolderName(folder);
                                                localStorage.setItem("grid_mock_folder", folder);
                                                setDownloadMethod("folder");
                                                localStorage.setItem("grid_download_method", "folder");
                                                showToast(`Dosja "${folder}" u lidh me sukses!`);
                                            }
                                        }}
                                    />
                                </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px w-full my-1 border-b border-zinc-500/20"></div>
                       <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-blue-500">{t('Sistemi & Riparime', 'System & Fixes')}</h4>
                       <button onClick={handleDeleteEmptyDocs} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-blue-600 hover:text-white`}>
                           <Trash2 className="w-4 h-4 shrink-0" /> {t('Fshi Dokumentet Bosh', 'Delete Empty Documents')}
                       </button>
                       <button onClick={handleCleanupEmptyRowsAll} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-blue-600 hover:text-white`}>
                           <Eraser className="w-4 h-4 shrink-0" /> {t('Pastro Rrjeshtat Bosh Kudo', 'Clear Empty Rows Everywhere')}
                       </button>
                       <button onClick={handleStripAllImages} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-blue-600 hover:text-white`}>
                           <ImageMinus className="w-4 h-4 shrink-0" /> {t('Fshi Imazhet (Liro Hapësirë)', 'Delete Images (Free Space)')}
                       </button>
                       <button onClick={handleRefreshCache} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-blue-600 hover:text-white`}>
                           <RefreshCw className="w-4 h-4 shrink-0" /> {t('Pastro Cache & Rilarko', 'Clear Cache & Reload')}
                       </button>
                       <button onClick={handleResetApp} className={`flex items-center gap-3 px-4 py-3 text-sm text-left font-bold transition-colors hover:bg-red-500 hover:text-white text-red-500`}>
                           <RotateCcw className="w-4 h-4 shrink-0" /> {t('Fshi të gjitha të dhënat (App Reset)', 'Delete all data (App Reset)')}
                       </button>
                    </div>
                 )}
               </div>
            </div>
         </div>
         
         <div className={`px-4 py-2 border-b flex flex-col gap-2 ${isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50/80"}`}>
            <div className="flex flex-nowrap w-full gap-2 items-center overflow-x-auto scrollbar-hide snap-x pb-0.5">
               <button onClick={exportAllPdf} className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border active:scale-95 ${
                 isDark ? "bg-red-600 hover:bg-red-500 text-white shadow-md border-transparent" : "bg-red-500 hover:bg-red-600 text-white shadow-md font-bold border-transparent"
               }`}>
                 <FolderDown className="w-3.5 h-3.5" /> PDF
               </button>

               <button onClick={() => executeProtectedAction(() => setBlueModal(true))} className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border active:scale-95 ${
                 isDark ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md border-transparent" : "bg-blue-500 hover:bg-blue-600 text-white shadow-md font-bold border-transparent"
               }`}>
                 <Lock className="w-3.5 h-3.5" /> Sekrete
               </button>

               <button onClick={() => setBackupModal(true)} className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border active:scale-95 ${
                 isDark ? "bg-accent-600 hover:bg-accent-500 text-white shadow-md border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white shadow-md font-bold border-transparent"
               }`}>
                 <Database className="w-3.5 h-3.5" /> Backup
               </button>

               {user && (
                 <button onClick={openCloudModal} className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border shadow-sm active:scale-95 ${
                   isDark ? "bg-green-600 hover:bg-green-500 text-white shadow-md border-transparent" : "bg-green-500 hover:bg-green-600 text-white shadow-md font-bold border-transparent"
                 }`}>
                   <Cloud className="w-3.5 h-3.5" /> Platforma Cloud
                 </button>
               )}

               <button onClick={() => setAiChatModal(true)} className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border active:scale-95 ${
                 isDark ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md border-transparent" : "bg-purple-500 hover:bg-purple-600 text-white shadow-md font-bold border-transparent"
               }`}>
                 <Sparkles className="w-3.5 h-3.5" /> AI Chat
               </button>
            </div>
            
            <div className="relative w-full">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input 
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={t("Kërko dokumente ose tekst brenda tyre...", "Search documents or text inside them...")}
                  className={`w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border focus:outline-none focus:border-accent-500 transition-colors ${
                     isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400"
                  }`}
               />
            </div>
            {allAvailableTags.length > 0 && (
               <div className="flex flex-wrap gap-2 mt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <button
                     onClick={() => setSelectedTag(null)}
                     className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        selectedTag === null
                           ? "bg-accent-500 text-white"
                           : isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                     }`}
                  >
                     Të gjitha
                  </button>
                  {allAvailableTags.map(tag => (
                     <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                           selectedTag === tag
                              ? "bg-accent-500 text-white"
                              : isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                     >
                        #{tag}
                     </button>
                  ))}
               </div>
            )}
         </div>
         
         <div className={`p-4 sm:p-5 flex-1 overflow-y-auto w-full max-w-full`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
               {/* KRIJO KARTËN E RE */}
               <button 
                 onClick={createNewDocument}
                 className={`flex items-center gap-2.5 p-2 border-2 border-dashed rounded-xl transition-all active:scale-95 text-left ${
                   isDark 
                     ? "border-zinc-700 hover:border-accent-500/80 bg-zinc-900/30 hover:bg-zinc-900/60" 
                     : "border-zinc-300 hover:border-accent-500/80 bg-zinc-50 hover:bg-zinc-100"
                 }`}
               >
                 <div className="p-1.5 bg-accent-500/10 rounded-lg">
                    <Plus className="w-4 h-4 text-accent-500" />
                 </div>
                 <div className="flex flex-col gap-0.5">
                    <span className={`text-sm font-bold ${textColor}`}>{t('Krijo të Re', 'Create New')}</span>
                    <span className={`text-[10px] font-medium leading-tight ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{t('Strukturë me 90 Rrjeshta', '90 Rows Structure')}</span>
                 </div>
               </button>

               {/* LISTA E DOKUMENTEVE */}
               {filteredDocs.length === 0 ? (
                  <div className={`col-span-full text-center py-10 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                    {t('Asnjë dokument nuk u gjet.', 'No documents found.')}
                  </div>
               ) : filteredDocs.map(doc => (
                  <div key={doc.id} onClick={() => openDocument(doc)} className={`flex items-center justify-between p-2 border rounded-xl cursor-pointer transition-all hover:translate-x-1 ${
                     isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-600 shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-400 shadow-sm"
                  }`}>
                     <div className="flex flex-col flex-1 shadow-none min-w-0 pr-2 gap-0.5">
                        <h3 className={`font-bold text-sm truncate ${textColor}`}>{doc.title}</h3>
                        <div className={`flex flex-row flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                           <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.createdAt, 'dd MMM yyyy')}</span>
                           <span className="flex items-center gap-0.5"><Save className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.updatedAt, 'HH:mm')}</span>
                        </div>
                        {(doc.tags && doc.tags.length > 0) && (
                           <div className="flex flex-wrap gap-1 mt-0.5">
                              {doc.tags.map(tag => (
                                 <span key={tag} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}>
                                    #{tag}
                                 </span>
                              ))}
                           </div>
                        )}
                     </div>
                     <button 
                        onClick={(e) => { 
                           e.preventDefault(); 
                           e.stopPropagation(); 
                           executeProtectedAction(() => {
                              setDocToDelete(doc.id);
                           });
                        }} 
                        className={`p-3 -mr-1 rounded-lg text-zinc-500 hover:text-red-500 active:text-red-600 active:bg-red-500/10 transition-colors ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                     >
                        <Trash2 className="w-5 h-5 pointer-events-none" />
                     </button>
                  </div>
               ))}
            </div>
         </div>

         {/* TOAST CUSTOM */}
         {toastMessage && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-accent-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4 z-[300]">
               {toastMessage}
            </div>
         )}
         {renderSharedModals()}
         {pinOverlayJSX}
      </div>
    );
  }

  // ACTIVE DOCUMENT VIEW
  return (
    <>
      <div 
        className={`w-full max-w-[1200px] mx-auto flex flex-col sm:border sm:rounded-xl shadow-2xl font-sans relative overflow-hidden h-[100dvh] sm:min-h-[600px] sm:h-[90vh] ${baseBg} ${borderColor} ${textColor} z-0`}
      >
        
        {/* TOOLBAR */}
      <div className={`flex flex-wrap border-b py-0.5 px-1 sm:py-1 sm:px-1.5 gap-x-1 gap-y-1 items-center justify-between shadow-sm z-30 sticky top-0 ${toolbarBg} ${borderColor}`}>
        <div className="flex flex-col flex-grow min-w-[100px] max-w-[200px]">
           <HeaderInput 
              initialValue={title}
              onChange={(val: string) => {
                  setTitle(val);
                  updateActiveDocumentState(val, rows, headers, columnWidths, activeTags);
              }}
              className={`font-semibold text-sm px-2 py-1 rounded w-full border transition-colors outline-none focus:border-accent-500 ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"}`}
              placeholder={t("Titulli i Shënimit", "Note Title")}
           />
           <input 
              value={activeTags.join(', ')}
              onChange={(e) => {
                 const newTags = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
                 setActiveTags(newTags);
                 updateActiveDocumentState(title, rows, headers, columnWidths, newTags);
              }}
              className={`text-[10px] px-2 py-0.5 mt-0.5 rounded w-full border transition-colors outline-none focus:border-accent-500 ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-white border-zinc-300 text-zinc-500"}`}
              placeholder={t("Etiketa (p.sh. work, personal)", "Tags (e.g. work, personal)")}
           />
           {autoSaveMsg && (
              <span className="text-[10px] text-accent-500 font-medium px-2 py-0.5 animate-in fade-in slide-in-from-top-1 absolute top-[55px] z-50 rounded bg-white dark:bg-zinc-900 shadow-md border dark:border-zinc-800 border-zinc-200">{autoSaveMsg}</span>
           )}
        </div>
        
        <div className="flex items-center relative flex-grow min-w-[100px] max-w-[160px]">
           <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
           <input 
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder={t("Kërko...", "Search...")}
              className={`w-full pl-7 pr-2 py-1 text-xs rounded border transition-colors outline-none focus:border-accent-500 ${isDark ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400"}`}
           />
        </div>
        
        <div className="flex flex-wrap items-center gap-1 border-l pl-2 mr-1 lg:mr-0 border-zinc-500/30">
                {/* New Text Settings Buttons */}
            <div className="relative">
                <button onClick={() => { setShowTextMenu(!showTextMenu); setShowTextColorMenu(false); }} className={`p-1.5 rounded transition-colors ${isDark ? "bg-zinc-700 text-white hover:bg-zinc-600 shadow-sm" : "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 shadow-sm"}`} title={t("Madhësia & Trashësia", "Size & Weight")}>
                   <Type className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                {showTextMenu && (
                   <>
                       <div className="fixed inset-0 z-[140]" onClick={() => setShowTextMenu(false)} />
                       <div className={`absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-full mt-2 p-3 rounded-xl border shadow-xl z-[150] flex flex-col gap-3 w-[220px] ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
                          <div className="flex flex-col gap-1.5">
                             <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                 <span>{t('Zmadhim', 'Zoom')}</span>
                                 <span>{textSize}px</span>
                             </div>
                             <input type="range" min="10" max="32" step="1" value={textSize} onChange={(e) => updateTextSize(parseInt(e.target.value))} className="w-full accent-accent-500" />
                          </div>
                          <div className="h-px w-full bg-zinc-500/20"></div>
                          <div className="flex flex-col gap-1.5">
                             <div className={`flex justify-between text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                 <span>{t('Trashësi', 'Weight')}</span>
                                 <span>{textWeight}</span>
                             </div>
                             <input type="range" min="100" max="900" step="100" value={textWeight} onChange={(e) => updateTextWeight(parseInt(e.target.value))} className="w-full accent-accent-500" />
                          </div>
                       </div>
                   </>
                )}
            </div>

            <div className="relative">
                <button onClick={() => { setShowTextColorMenu(!showTextColorMenu); setShowTextMenu(false); }} className={`p-1.5 rounded transition-colors ${isDark ? "bg-zinc-700 text-white hover:bg-zinc-600 shadow-sm" : "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 shadow-sm"}`} title={t("Ngjyra e Tekstit", "Text Color")}>
                   <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                {showTextColorMenu && (
                   <>
                       <div className="fixed inset-0 z-[140]" onClick={() => setShowTextColorMenu(false)} />
                       <div className={`absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-full mt-2 p-2 rounded-xl border shadow-xl z-[150] flex flex-col gap-1.5 w-[200px] ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
                          <div className="text-[10px] font-bold uppercase text-zinc-500 px-1 mb-1 border-b border-zinc-500/20 pb-1">{t('Zgjidh Ngjyrën', 'Choose Color')}</div>
                          <div className="grid grid-cols-4 gap-1.5">
                             {TEXT_COLORS.map(c => (
                                <button key={c.id} onClick={() => { updateTextColorMode(c.id); setShowTextColorMenu(false); }} className={`w-7 h-7 rounded-[4px] shadow-sm border-2 ${textColorMode === c.id ? 'border-accent-500 scale-110' : 'border-black/10 hover:scale-110'} transition-transform`} style={{ backgroundColor: c.id === 'default' ? (isDark ? '#52525b' : '#a1a1aa') : c.id }} title={c.name} />
                             ))}
                          </div>
                       </div>
                   </>
                )}
            </div>
            
            <div className="h-4 w-px bg-zinc-500/30 mx-1"></div>

            <button onClick={() => updateSelectedRowsStatus('ok')} className={`p-1.5 rounded transition-colors ${isDark ? "bg-green-600/90 text-white hover:bg-green-500 shadow-sm" : "bg-green-500/90 text-white hover:bg-green-600 shadow-sm"}`} title={t("Në rregull", "Ok")}>
               <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button onClick={() => updateSelectedRowsStatus('blue')} className={`p-1.5 rounded transition-colors ${isDark ? "bg-blue-600/90 text-white hover:bg-blue-500 shadow-sm" : "bg-blue-500/90 text-white hover:bg-blue-600 shadow-sm"}`} title={t("Sekrete / Rëndësi", "Secret / Important")}>
               <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button onClick={() => updateSelectedRowsStatus('x')} className={`p-1.5 rounded transition-colors ${isDark ? "bg-red-600/90 text-white hover:bg-red-500 shadow-sm" : "bg-red-500/90 text-white hover:bg-red-600 shadow-sm"}`} title={t("E Pavlefshme", "Invalid")}>
               <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button onClick={() => updateSelectedRowsStatus('none')} className={`p-1.5 rounded transition-colors ${isDark ? "bg-zinc-700 text-white hover:bg-zinc-600 shadow-sm font-bold" : "bg-zinc-300 text-zinc-900 hover:bg-zinc-400 shadow-sm font-bold"}`} title={t("Hiq Statusin", "Remove Status")}>
               <Unlock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            
            <div className="relative">
               <button onClick={() => { setShowTagColorMenu(!showTagColorMenu); setShowTextColorMenu(false); setShowTextMenu(false); }} className={`p-1.5 rounded transition-colors ${isDark ? "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-sm" : "bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300 shadow-sm"}`} title={t("Ngjyra e Etiketës (Tag)", "Tag Color")}>
                  <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
               </button>
               {showTagColorMenu && (
                   <>
                       <div className="fixed inset-0 z-[140]" onClick={() => setShowTagColorMenu(false)}></div>
                       <div className={`absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 p-2 rounded-xl border shadow-xl z-[150] flex flex-col gap-1.5 w-[200px] ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
                           <div className="text-[10px] font-bold uppercase text-zinc-500 px-1 mb-1 border-b border-zinc-500/20 pb-1">{t('Etiketë me Ngjyrë', 'Color Tag')}</div>
                           <div className="grid grid-cols-4 gap-1.5">
                              {TAG_COLORS.map(c => (
                                 <button key={c.id} onClick={() => { updateSelectedRowsStatus(c.id); setShowTagColorMenu(false); }} className={`w-7 h-7 rounded-[4px] shadow-sm border-2 border-black/10 hover:scale-110 transition-transform`} style={{ backgroundColor: c.color }} title={c.name} />
                              ))}
                           </div>
                       </div>
                   </>
               )}
            </div>
            <div className="h-4 w-px bg-zinc-500/30 mx-1"></div>
            <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase mr-1 hidden sm:inline">{t('Kolonat', 'Cols')}:</span>
                  <button onClick={() => {
                     executeProtectedAction(() => {
                         if(headers.length > 1) {
                             const newH = [...headers];
                             newH.pop();
                             setHeaders(newH);
                             const newW = [...columnWidths];
                             newW.pop();
                             setColumnWidths(newW);
                             updateActiveDocumentState(title, rows, newH, newW);
                         }
                     });
                  }} title={t("Hiq Kolonë", "Remove Column")} className={`p-1.5 rounded transition-colors ${isDark ? "text-zinc-400 hover:text-red-500 hover:bg-red-500/10" : "text-zinc-500 hover:text-red-600 hover:bg-red-50"}`}>
                     <Minus className="w-3.5 h-3.5 border border-current rounded-full" />
                  </button>
                  <span className={`text-[11px] font-bold min-w-[12px] text-center ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{headers.length}</span>
                  <button onClick={() => {
                     executeProtectedAction(() => {
                         if(headers.length < 8) {
                             const newH = [...headers, `${t('Kolona', 'Col')} ${headers.length + 1}`];
                             setHeaders(newH);
                             const newW = [...columnWidths, 150];
                             setColumnWidths(newW);
                             updateActiveDocumentState(title, rows, newH, newW);
                         }
                     });
                  }} title={t("Shto Kolonë", "Add Column")} className={`p-1.5 rounded transition-colors ${isDark ? "text-zinc-400 hover:text-green-500 hover:bg-green-500/10" : "text-zinc-500 hover:text-green-600 hover:bg-green-50"}`}>
                     <Plus className="w-3.5 h-3.5 border border-current rounded-full" />
                  </button>
                  <div className="h-4 w-px bg-zinc-500/30 mx-1"></div>
                  <button onClick={() => setPreviewSelectedRows(true)} title={t("Shfaq Rrjeshtat e Shenjuar", "View Selected Rows")} className={`p-1.5 rounded transition-colors ${isDark ? "text-zinc-400 hover:text-accent-500 hover:bg-accent-500/10" : "text-zinc-500 hover:text-accent-600 hover:bg-accent-50"}`}>
                     <Eye className="w-4 h-4" />
                  </button>
             </div>
         </div>
        
        <div className="flex flex-wrap gap-1 lg:w-auto lg:min-w-max lg:ml-auto items-center mt-1 lg:mt-0 order-last lg:order-none justify-end">
          <span className={`text-[10px] sm:text-xs font-semibold mr-auto lg:mr-2 tracking-wide flex items-center gap-1.5 px-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
             <Calendar className="w-3.5 h-3.5" /> {getAlbanianDateTime()}
          </span>
          <button onClick={() => setAiChatModal(true)} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded transition-colors ${
            isDark ? "bg-accent-600 hover:bg-accent-500 text-white shadow-md border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white shadow-md font-bold border-transparent"
          }`} title={t("Analizo me AI", "Analyze with AI")}>
            <Sparkles className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">{t('AI Chat', 'AI Chat')}</span>
          </button>
          
          <button onClick={saveCurrentDocument} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent-600 hover:bg-accent-700 text-white text-[11px] sm:text-xs font-bold rounded transition-colors shadow-sm">
            <Save className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">{t('Ruaj', 'Save')}</span>
          </button>
          
          {selectedRows.size > 0 ? (
             <button onClick={() => executeProtectedAction(() => setShowConfirmDeleteSelected(true))} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded transition-colors ${
               isDark ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"
             }`}>
               <Trash2 className="w-3.5 h-3.5 shrink-0" /> <span>{t('Fshi', 'Delete')} ({selectedRows.size})</span>
             </button>
          ) : (
             <button onClick={() => executeProtectedAction(() => setShowConfirmClear(true))} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded transition-colors border ${
               isDark ? "bg-red-600 hover:bg-red-500 text-white shadow-md border-transparent" : "bg-red-50 bg-red-500/90 text-white hover:bg-red-600 shadow-sm border-red-200"
             }`}>
               <Trash2 className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">{t('Bosh', 'Clear')}</span>
             </button>
          )}

          <button onClick={() => setShowConfirmClose(true)} className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded transition-colors ${
              isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white shadow-md font-bold" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 shadow-md font-bold border-transparent"
            }`} title={t("Kthehu", "Return")}>
            <LogOut className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">{t('Kthehu', 'Return')}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-1.5 min-w-max border-l pl-2 border-zinc-500/30">
                  <div className="relative">
                     <button 
                       onClick={() => setShowThemeMenu(!showThemeMenu)}
                       className={`p-1.5 rounded-full transition-colors ${isDark ? "bg-accent-600 hover:bg-accent-500 text-white shadow-md border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white shadow-md font-bold border-transparent"}`}
                       title="Ndërro Ngjyrën"
                     >
                       <Palette className="w-3.5 h-3.5" />
                     </button>
                     {showThemeMenu && (
                        <div className={`fixed right-4 top-[100px] sm:absolute sm:right-0 sm:top-full mt-2 p-2 rounded-xl border shadow-xl z-[100] flex items-center gap-3 w-[220px] max-w-[calc(100vw-32px)] overflow-x-auto scrollbar-default touch-pan-x ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
                           {(Object.keys(COLOR_THEMES) as Array<keyof typeof COLOR_THEMES>).map(c => (
                              <button key={c} onClick={() => { setAccentColor(c); setShowThemeMenu(false); }} className="w-8 h-8 shrink-0 rounded-full border-2 border-black/10 transition-transform hover:scale-110 shadow-sm" style={{ backgroundColor: c === 'kontrast' ? '#000000' : COLOR_THEMES[c][500] }} title={c === 'kontrast' ? 'Kontrast i Lartë' : c} />
                           ))}
                        </div>
                     )}
                  </div>
          
          <button 
            onClick={toggleTheme}
            className={`p-1.5 rounded-full transition-colors ${isDark ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-md border-transparent" : "bg-zinc-800 hover:bg-zinc-700 text-white shadow-md font-bold border-transparent"}`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <div className="flex gap-1">
             <button onClick={exportTxt} className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
               isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white shadow-sm border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-bold shadow-sm border-transparent"
             }`} title="Shkarko TXT">
               <File className="w-3.5 h-3.5" /> TXT
             </button>
             <button onClick={exportCsv} className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
               isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white shadow-sm border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-bold shadow-sm border-transparent"
             }`} title="Shkarko CSV">
               <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
             </button>
             <button onClick={exportPdf} className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
               isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white shadow-sm border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-bold shadow-sm border-transparent"
             }`} title="Shkarko PDF">
               <FileDown className="w-3.5 h-3.5" /> PDF
             </button>
             <button onClick={() => setShowCalculator(true)} className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
               isDark ? "hover:bg-accent-800/30 text-accent-500" : "hover:bg-accent-50 text-accent-600"
             }`} title="Llogaritës (Mini Calculator)">
               <Calculator className="w-3.5 h-3.5" />
             </button>
             <button onClick={() => executeProtectedAction(() => setBlueModal(true))} className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
               isDark ? "hover:bg-blue-800/30 text-blue-500 hover:text-orange-400" : "hover:bg-blue-50 text-blue-600 hover:text-orange-700"
             }`} title="Shënime Sekrete">
               <Lock className="w-3.5 h-3.5" /> Sekrete
             </button>
             </div>
             

        </div>
      </div>

      {/* HORIZONTAL WRAPPER FOR SWIPasswordG COLUMNS */}
      {/* ADDED overscroll-x-contain touch-pan-x for better mobile swipe UX */}
      <div className={`flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain scrollbar-hide touch-pan-x touch-pan-y ${isDark ? "bg-zinc-950" : "bg-zinc-50"}`}>
        <div className="min-w-[800px] w-full flex flex-col relative">
          
          {/* GRID HEADER */}
          <div className={`flex border-b shadow-sm sticky top-0 z-20 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
            <div 
              className={`w-12 shrink-0 border-r flex flex-col items-center justify-center text-xs font-bold sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-colors ${
                isDark ? "bg-zinc-950 border-zinc-800 text-zinc-500" : "bg-white border-zinc-200 text-zinc-500"
              }`}
            >
               
               <div onClick={toggleAllSelection} className={`w-full flex-1 flex items-center justify-center cursor-pointer hover:bg-accent-500/10 ${selectedRows.size > 0 ? "text-accent-500" : ""}`}>
                  {selectedRows.size === rows.length && rows.length > 0 ? <Check className="w-4 h-4" /> : selectedRows.size > 0 ? <Square className="w-4 h-4 text-accent-500" /> : "NR"}
               </div>
            </div>
            {headers.map((h, i) => (
              <div key={i} style={{ width: columnWidths[i] || 150, minWidth: columnWidths[i] || 150, maxWidth: columnWidths[i] || 150 }} className={`shrink-0 border-r py-1 px-1 last:border-r-0 flex flex-col justify-center relative group ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                <div className="flex gap-1 justify-between w-full opacity-0 px-1 group-hover:opacity-100 transition-opacity absolute top-0.5 left-0 pointer-events-none">
                   <button onClick={(e) => {
                       e.stopPropagation();
                       executeProtectedAction(() => {
                           const ns = [...columnWidths];
                           ns[i] = Math.max(50, (ns[i] || 150) - 20);
                           setColumnWidths(ns);
                           updateActiveDocumentState(title, rows, headers, ns);
                       });
                   }} className="text-zinc-400 hover:text-zinc-600 font-bold text-[10px] pointer-events-auto">&lt;</button>
                   <button onClick={(e) => {
                       e.stopPropagation();
                       executeProtectedAction(() => {
                           const ns = [...columnWidths];
                           ns[i] = Math.min(600, (ns[i] || 150) + 20);
                           setColumnWidths(ns);
                           updateActiveDocumentState(title, rows, headers, ns);
                       });
                   }} className="text-zinc-400 hover:text-zinc-600 font-bold text-[10px] pointer-events-auto">&gt;</button>
                </div>
                <HeaderInput 
                  initialValue={h}
                  onChange={(val: string) => {
                      const newH = [...headers];
                      newH[i] = val;
                      setHeaders(newH);
                      updateActiveDocumentState(title, rows, newH);
                  }}
                  className={`w-full text-xs bg-transparent text-center font-semibold tracking-wide focus:outline-none focus:text-accent-500 transition-colors ${
                    isDark ? "text-zinc-200 placeholder-zinc-600" : "text-zinc-800 placeholder-zinc-400"
                  }`}
                  placeholder={`Kolona ${i+1}`}
                />
              </div>
            ))}
            <div className={`w-16 shrink-0 border-l flex items-center justify-center text-xs font-bold ${
              isDark ? "bg-zinc-950 border-zinc-800 text-zinc-500" : "bg-white border-zinc-200 text-zinc-500"
            }`}>
              IMG
            </div>
          </div>

          {/* GRID BODY (90 ROWS) */}
          <div className="w-full pb-32">
            {rows.map((r, rIndex) => ({ r, rIndex })).filter(({r}) => {
                if (!docSearch.trim()) return true;
                const q = docSearch.toLowerCase();
                return headers.some((_, c) => (r[`col${c+1}`] || '').toString().toLowerCase().includes(q));
            }).map(({r, rIndex}) => (
                <div key={`${r.id}-${rIndex}`} className={`flex border-b min-h-[28px] group w-full transition-colors ${
                  r.status === 'ok' ? (isDark ? 'bg-green-500/25 border-green-500/40' : 'bg-green-50 border-green-200')
                  : r.status === 'blue' ? (isDark ? 'bg-blue-500/25 border-blue-500/40' : 'bg-blue-50 border-blue-200')
                  : r.status === 'x' ? (isDark ? 'bg-red-500/25 border-red-500/40' : 'bg-red-50 border-red-200')
                  : isDark ? "border-zinc-800/80 focus-within:bg-zinc-900/50" : "border-zinc-200 focus-within:bg-zinc-50"
                }`}>
                  {/* Row Number (Sticky) */}
                  <div 
                    onClick={() => toggleRowSelection(rIndex)}
                    className={`w-12 shrink-0 border-r flex items-center justify-center text-sm font-mono sticky left-0 z-10 transition-all duration-200 cursor-pointer shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${
                      selectedRows.has(rIndex)
                        ? "bg-accent-500 text-white border-r-accent-600"
                        : r.status === 'ok' ? (isDark ? "bg-green-500/20 text-green-400 border-zinc-800" : "bg-green-100 text-green-700 border-zinc-200")
                        : r.status === 'blue' ? (isDark ? "bg-blue-500/20 text-blue-400 border-zinc-800" : "bg-blue-100 text-blue-700 border-zinc-200")
                        : r.status === 'x' ? (isDark ? "bg-red-500/20 text-red-400 border-zinc-800" : "bg-red-100 text-red-700 border-zinc-200")
                        : isDark 
                          ? "bg-zinc-900/50 border-zinc-800 text-zinc-600 group-hover:bg-zinc-900/80 group-hover:text-zinc-400" 
                          : "bg-zinc-50 border-zinc-200 text-zinc-500 group-hover:bg-zinc-100 group-hover:text-zinc-700"
                    }`}
                    style={r.status?.startsWith('tag-') && !selectedRows.has(rIndex) 
                      ? { boxShadow: `inset 4px 0 0 ${TAG_COLORS.find(c => c.id === r.status)?.color || 'transparent'}, 2px 0 5px rgba(0,0,0,0.02)` } 
                      : {}
                    }
                  >
                    {selectedRows.has(rIndex) ? <Check className="w-4 h-4" /> : (rIndex + 1)}
                  </div>

                  {/* 4 Equal Columns */}
                  {headers.map((_, i) => `col${i+1}`).map((colKey, cIndex) => (
                    <div key={cIndex} style={{ width: columnWidths[cIndex] || 150, minWidth: columnWidths[cIndex] || 150, maxWidth: columnWidths[cIndex] || 150 }} className={`shrink-0 border-r relative p-0.5 group/cell ${
                      isDark ? "border-zinc-800" : "border-zinc-200"
                    }`}>
                        <CellInput
                          initialValue={r[colKey as keyof GridRow] as string}
                          onChange={(v: string) => updateCell(rIndex, colKey, v)}
                          readOnly={r.status === 'ok' || r.status === 'blue' || r.status === 'x' || r.status === 'lock'}
                          startHold={() => handleCellHoldStart(rIndex, colKey)}
                          stopHold={handleCellHoldCancel}
                          className={`w-full h-full resize-none focus:outline-none px-1.5 py-0.5 rounded scrollbar-hide leading-[1.3] transition-colors ${
                            r.status === 'x' 
                              ? `line-through decoration-red-500 placeholder-red-500/50 cursor-default bg-transparent ${isDark ? "text-red-100" : "text-red-900"}`
                              : r.status === 'blue'
                                ? `placeholder-blue-500/50 cursor-default bg-transparent ${isDark ? "text-blue-100" : "text-blue-900"}`
                              : r.status === 'ok'
                                ? `placeholder-green-500/50 cursor-default bg-transparent ${isDark ? "text-green-100" : "text-green-900"}`
                                : (isDark ? `${inputBgDark} ${textColorMode === 'default' ? 'text-white' : ''} placeholder-zinc-700/50 focus:border-zinc-700/50` : `${inputBgLight} ${textColorMode === 'default' ? 'text-zinc-900' : ''} placeholder-zinc-400/70 focus:border-zinc-300`)
                          }`}
                          style={{
                               fontSize: `${textSize || 12}px`,
                               fontWeight: textWeight || 400,
                               ...((r.status === 'none' || r.status?.startsWith('tag-')) && textColorMode !== 'default' ? { color: getActualTextColor(textColorMode) } : {}),
                               ...(r.status?.startsWith('tag-') ? { backgroundColor: `${TAG_COLORS.find(c => c.id === r.status)?.color || '#888'}15` } : {})
                          }}
                        />
                        
                        {/* Cell Actions */}
                        <div className={`absolute top-0.5 right-0.5 flex items-center gap-1 transition-opacity z-10 ${
                           listeningCell?.rIndex === rIndex && listeningCell?.colKey === colKey 
                             ? "opacity-100" 
                             : "opacity-0 group-hover/cell:opacity-100"
                        }`}>
                           {r.status !== 'lock' && (
                             <button 
                               onClick={(e) => { e.preventDefault(); toggleVoiceRecording(rIndex, colKey); }}
                               className={`p-1 rounded-md transition-all shadow-md scale-95 hover:scale-100 ${
                                 listeningCell?.rIndex === rIndex && listeningCell?.colKey === colKey 
                                 ? "bg-red-500 text-white animate-pulse opacity-100" // force opacity when listening
                                 : (isDark ? "bg-zinc-700/90 text-zinc-200 hover:bg-zinc-600" : "bg-white/90 text-zinc-600 hover:bg-gray-100 border border-zinc-200")
                               }`}
                               title="Fol për të shkruar"
                             >
                               {listeningCell?.rIndex === rIndex && listeningCell?.colKey === colKey ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                             </button>
                           )}
                           <button 
                             onClick={() => openModal(rIndex, colKey)}
                             className={`p-1 rounded-md transition-all shadow-md scale-95 hover:scale-100 ${
                               isDark ? "bg-accent-600/90 text-white hover:bg-accent-500" : "bg-accent-500/90 text-white hover:bg-accent-600"
                             }`}
                             title="Shiko Përmbajtjen e Plotë"
                           >
                             <Maximize2 className="w-3 h-3" />
                           </button>
                        </div>
                    </div>
                  ))}
                  
                  {/* Image Column */}
                  <div className={`w-16 shrink-0 border-l relative p-1 flex items-center justify-center group/img ${
                      isDark ? "border-zinc-800" : "border-zinc-200"
                  }`}>
                     {r.image ? (
                        <div 
                          className={`w-full h-full relative cursor-pointer flex items-center justify-center p-0.5 transition-all ${selectedRows.has(rIndex) ? 'ring-2 ring-blue-500 rounded bg-blue-500/20' : ''}`}
                          onPointerDown={(e) => {
                             isLongPress.current[rIndex] = false;
                             pressTimers.current[rIndex] = setTimeout(() => {
                                 isLongPress.current[rIndex] = true;
                                 setSelectedRows((prev: Set<number>) => {
                                     const n = new Set(prev);
                                     n.add(rIndex);
                                     return n;
                                 });
                                 showToast("Imazhi (Rrjeshti) u zgjodh!");
                             }, 2000);
                          }}
                          onPointerUp={(e) => {
                             if (pressTimers.current[rIndex]) clearTimeout(pressTimers.current[rIndex]);
                             if (!isLongPress.current[rIndex]) {
                                 setPreviewImage(r.image as string);
                             }
                          }}
                          onPointerLeave={(e) => {
                             if (pressTimers.current[rIndex]) clearTimeout(pressTimers.current[rIndex]);
                          }}
                          onPointerCancel={(e) => {
                             if (pressTimers.current[rIndex]) clearTimeout(pressTimers.current[rIndex]);
                          }}
                        >
                           <img src={r.image} className="w-full h-full object-cover rounded opacity-80 hover:opacity-100 transition-opacity ring-1 ring-zinc-500/30" alt="Row upload" />
                           <button onClick={(e) => { e.stopPropagation(); removeImage(rIndex); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 shadow-lg scale-90 hover:scale-110 transition-all">
                               <X className="w-3 h-3" />
                           </button>
                        </div>
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-30 hover:opacity-100 transition-all rounded gap-1.5 relative group/imgbtn">
                           <label className="cursor-pointer hover:text-accent-500 w-full flex justify-center items-center h-1/2" title="Ngarko imazh (JPG/PNG)">
                             <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) handleImageUpload(rIndex, e.target.files[0]); }} />
                             <ImagePlus className="w-4 h-4 text-zinc-500" />
                           </label>
                           <button onClick={() => generatePlaceholderImage(rIndex)} className="text-zinc-500 hover:text-teal-500 transition-colors" title="Gjenero Placeholder">
                             <Sparkles className="w-4 h-4" />
                           </button>
                        </div>
                     )}
                  </div>
                </div>
            ))}
            
            {/* NO RESULTS FOR DOC SEARCH */}
            {docSearch.trim() && rows.filter(r => {
                const q = docSearch.toLowerCase();
                return headers.some((_, c) => (r[`col${c+1}`] || '').toString().toLowerCase().includes(q));
            }).length === 0 && (
                <div className={`p-8 text-center text-sm ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                   Nuk u gjet asnjë përputhje për "{docSearch}" në këtë dokument.
                </div>
            )}
          </div>

        </div>
      </div>

            {/* PREVIEW SELECTED ROWS MODAL */}
      {previewSelectedRows && (
         <div className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-black/70 p-4 animate-in zoom-in-95 fill-mode-forwards" onMouseDown={() => setPreviewSelectedRows(false)}>
            <div className={`max-w-3xl w-full p-0 overflow-hidden rounded-2xl shadow-2xl flex flex-col ${isDark ? "bg-zinc-900 border border-zinc-700" : "bg-white border border-zinc-300"}`} onMouseDown={(e) => e.stopPropagation()}>
               <div className={`flex justify-between items-center px-4 py-3 border-b ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}`}>
                  <h3 className={`font-bold flex items-center gap-2 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                      <Eye className="w-5 h-5 text-accent-500" />
                      {t('Rrjeshtat e Shenjuar', 'Selected Rows')} ({selectedRows.size})
                  </h3>
                  <button onClick={() => setPreviewSelectedRows(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="p-5 max-h-[75vh] overflow-y-auto w-full">
                  <div className="flex flex-col gap-6">
                      {Array.from(selectedRows as Iterable<number>).sort((a,b) => a-b).filter(rIndex => {
                         const r = rows[rIndex];
                         return headers.some((_, i) => (r[`col${i+1}` as keyof GridRow] as string)?.trim());
                      }).map((rIndex) => {
                         const r = rows[rIndex];
                         return (
                            <div key={rIndex} className={`p-4 rounded-xl border ${isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-100 border-zinc-300"}`}>
                               <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-accent-400' : 'text-accent-600'}`}>{t('Rrjeshti', 'Row')} {rIndex + 1}</h4>
                               <div className="flex flex-col gap-3">
                                 {headers.map((h, i) => {
                                     const colVal = r[`col${i+1}` as keyof GridRow] as string;
                                     if (!colVal || !colVal.trim()) return null;
                                     return (
                                        <div key={i} className={`p-3 rounded-lg border ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"}`}>
                                           <div className={`text-xs uppercase font-bold mb-1 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{h}</div>
                                           <div className={`text-sm whitespace-pre-wrap ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{colVal}</div>
                                        </div>
                                     );
                                 })}
                               </div>
                            </div>
                         );
                      })}
                      {Array.from(selectedRows as Iterable<number>).filter(rIndex => {
                         const r = rows[rIndex];
                         return headers.some((_, i) => (r[`col${i+1}` as keyof GridRow] as string)?.trim());
                      }).length === 0 && (
                         <div className="text-center py-8 text-zinc-500 italic">
                             {selectedRows.size === 0 
                                ? t('Nuk keni shenjuar asnjë rrjesht.', 'You have not selected any rows.') 
                                : t('Rrjeshtat e shenjuar nuk kanë asnjë tekst.', 'Selected rows have no text.')}
                         </div>
                      )}
                  </div>
               </div>
            </div>
         </div>
      )}





            {/* PENDING AI CHANGES MODAL */}
      {pendingAiChanges && (
         <div className="fixed inset-0 z-[200] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 p-4 animate-in fade-in">
            <div className={`max-w-xl w-full p-6 rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-accent-500/10 text-accent-500">
                     <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className={`text-xl font-bold ${textColor}`}>{t('Mirato Ndryshimet', 'Approve AI Changes')}</h3>
               </div>
               
               <p className={`mb-4 text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {t('AI sugjeron ndryshime. Struktura e re e kolonave:', 'AI suggests changes. New column structure:')}
               </p>
               
               <div className="flex flex-wrap gap-2 mb-6">
                   {pendingAiChanges.newHeaders.map((h, i) => (
                      <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
                          {h}
                      </span>
                   ))}
               </div>

               <div className="flex justify-end gap-3">
                  <button onClick={() => setPendingAiChanges(null)} className={`px-4 py-2 font-medium rounded-lg transition-colors ${isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>
                     {t('Anulo', 'Cancel')}
                  </button>
                  <button onClick={() => {
                        const pd = pendingAiChanges;
                        setPendingAiChanges(null);
                        executeProtectedAction(async () => {
                           const updatedDocs = documents.map(d => {
                               if (d.id === pd.documentId) {
                                   const newRowsWithImages = pd.newRows.map((nr: any, idx: number) => {
                                       return { ...nr, image: d.rows[idx]?.image || null };
                                   });

                                   if (activeDocId === d.id) {
                                      setRows(newRowsWithImages);
                                      setHeaders(pd.newHeaders);
                                      if (pd.newColumnWidths) setColumnWidths(pd.newColumnWidths);
                                      updateActiveDocumentState(title, newRowsWithImages, pd.newHeaders, pd.newColumnWidths);
                                   }
                                   return { ...d, rows: newRowsWithImages, headers: pd.newHeaders, columnWidths: pd.newColumnWidths || d.columnWidths, updatedAt: new Date().toISOString() };
                               }
                               return d;
                           });
                           setDocuments(updatedDocs);
                           localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(updatedDocs));
                           showToast(t("Struktura u përditësua nga AI!", "Structure updated by AI!"));
                           
                           // Try saving to cloud
                           const theDoc = updatedDocs.find((x) => x.id === pd.documentId);
                           if (user && theDoc) setDoc(doc(db, 'documents', theDoc.id), theDoc).catch(()=>console.error('ai header error sync'));
                        });
                  }} className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white font-medium rounded-lg transition-colors">
                     {t('Apliko Ndryshimet', 'Apply Changes')}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* CONFIRMATION MODAL - CLOSE */}
      {showConfirmClose && (
         <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">
            <div className={`max-w-md w-full p-6 mb-20 md:mb-0 rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
               <h3 className={`text-xl font-bold mb-3 ${textColor}`}>{t('Kthehu në Katalog', 'Return to Catalog')}</h3>
               <p className={`mb-6 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{t('A i keni ruajtur ndryshimet tuaja? Nëse dilni pa ruajtur, ndryshimet e fundit nuk do të ruhen.', 'Have you saved your changes? If you exit without saving, recent changes will not be saved.')}</p>
               <div className="flex justify-end gap-3">
                  <button onClick={() => setShowConfirmClose(false)} className={`px-4 py-2 font-medium rounded-lg transition-colors ${isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>
                     {t('Anulo', 'Cancel')}
                  </button>
                  <button onClick={() => { setShowConfirmClose(false); setActiveDocId(null); }} className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white font-medium rounded-lg transition-colors">
                     {t('Kthehu', 'Return')}
                  </button>
               </div>
            </div>
         </div>
      )}

      {showConfirmDeleteSelected && (
         <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">
            <div className={`max-w-md w-full p-6 mb-20 md:mb-0 rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
               <h3 className={`text-xl font-bold mb-3 text-red-500`}>Kujdes!</h3>
               <p className={`mb-6 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Jeni i sigurt që doni të boshatisni {selectedRows.size} rrjeshtat e zgjedhur? Ky veprim nuk mund të kthehet mbrapsht.</p>
               <div className="flex justify-end gap-3">
                  <button onClick={() => setShowConfirmDeleteSelected(false)} className={`px-4 py-2 font-medium rounded-lg transition-colors ${isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>
                     Anulo
                  </button>
                  <button onClick={handleDeleteSelected} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors">
                     Po, Boshatis
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* CONFIRMATION MODAL - CLEAR */}
      {showConfirmClear && (
         <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">
            <div className={`max-w-md w-full p-6 mb-20 md:mb-0 rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
               <h3 className={`text-xl font-bold mb-3 text-red-500`}>Kujdes!</h3>
               <p className={`mb-6 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Jeni i sigurt që doni të boshatisni të 90 rrjeshtat? Ky veprim nuk mund të kthehet mbrapsht.</p>
               <div className="flex justify-end gap-3">
                  <button onClick={() => setShowConfirmClear(false)} className={`px-4 py-2 font-medium rounded-lg transition-colors ${isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>
                     Anulo
                  </button>
                  <button onClick={handleClearAll} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors">
                     Po, Boshatis
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
         <div className="fixed inset-0 z-[70] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/90 p-4 animate-in fade-in" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
               <img src={previewImage} className="max-w-full max-h-full object-contain rounded-lg" alt="Preview Full" />
               <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
         </div>
      )}

      {/* MODAL FOR EXPANDED TEXT VIEW */}
      {activeCell && (
          <div className="fixed inset-0 z-50 flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 sm:p-4 animate-in fade-in zoom-in-95">
            <div className={`mx-auto w-full h-[100dvh] sm:max-w-4xl sm:h-[80vh] flex flex-col border-0 sm:border sm:rounded-2xl shadow-2xl overflow-hidden ${
              isDark ? "bg-zinc-900 sm:border-zinc-700" : "bg-white sm:border-zinc-300"
            }`}>
                
                {/* Modal Header */}
                <div className={`flex justify-between items-center p-3 sm:p-4 border-b shrink-0 ${
                  isDark ? "border-zinc-800 bg-zinc-900 text-zinc-200" : "border-zinc-200 bg-zinc-50 text-zinc-800"
                }`}>
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      <span className="text-accent-500 font-bold">Rrjeshti {activeCell.rIndex + 1}</span> 
                      <span className={isDark ? "text-zinc-600" : "text-zinc-400"}>/</span> 
                      <span>{headers[parseInt(activeCell.colKey.replace('col', '')) - 1]}</span>
                      {rows[activeCell.rIndex]?.status === 'lock' && <Lock className="w-4 h-4 ml-2 text-amber-500" />}
                    </h3>
                    <div className="flex items-center gap-2">
                       {rows[activeCell.rIndex]?.status !== 'lock' && (
                         <button onClick={toggleModalVoiceRecording} className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium ${
                           listeningModal
                           ? "bg-red-500 text-white animate-pulse"
                           : (isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-white border top-1 border-zinc-300 text-zinc-700 hover:bg-zinc-100")
                         }`}>
                           {listeningModal ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                           <span className="hidden sm:inline">{listeningModal ? "Po dëgjon..." : "Përktheni zë në tekst"}</span>
                         </button>
                       )}
                       <button onClick={closeModal} className={`p-1.5 rounded-lg transition-colors ${
                         isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
                       }`}>
                         <X className="w-5 h-5"/>
                       </button>
                    </div>
                </div>
                
                {/* Modal Body */}
                <div className={`flex-1 p-5 ${isDark ? "bg-zinc-950" : "bg-white"}`}>
                    <textarea
                      autoFocus
                      readOnly={rows[activeCell.rIndex]?.status === 'lock' || rows[activeCell.rIndex]?.status === 'ok' || rows[activeCell.rIndex]?.status === 'blue' || rows[activeCell.rIndex]?.status === 'x'}
                      value={modalText}
                      onChange={(e) => {
                          const val = e.target.value;
                          setModalText(val);
                          updateCell(activeCell.rIndex, activeCell.colKey, val);
                      }}
                      placeholder="Zgjero shënimet e tua dhe shkruaj lirshëm këtu..."
                      className={`w-full h-full bg-transparent resize-none focus:outline-none text-base leading-relaxed scrollbar-hide ${
                        (rows[activeCell.rIndex]?.status === 'lock' || rows[activeCell.rIndex]?.status === 'ok' || rows[activeCell.rIndex]?.status === 'blue' || rows[activeCell.rIndex]?.status === 'x')
                           ? (isDark ? "text-amber-500/90 cursor-default" : "text-amber-600/90 cursor-default")
                           : (isDark ? "text-zinc-200 placeholder-zinc-700" : "text-zinc-800 placeholder-zinc-400")
                      }`}
                      spellCheck={false}
                    />
                </div>
                
                {/* Modal Footer */}
                <div className={`p-3 sm:p-4 border-t flex justify-between items-center shrink-0 ${
                  isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"
                }`}>
                    <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? "text-green-500" : "text-green-600"}`}>
                       {rows[activeCell.rIndex]?.status !== 'lock' && <><Check className="w-3.5 h-3.5" /> Ruhet automatikisht</>}
                    </span>
                    <div className="flex gap-3">
                        <button onClick={closeModal} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                          isDark ? "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700" : "bg-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-300"
                        }`}>
                          Mbyll
                        </button>
                    </div>
                </div>

            </div>
          </div>
      )}

      {renderSharedModals()}

      {/* CALCULATOR MODAL */}
      {showCalculator && (
          <div 
            style={{ 
               position: 'fixed', 
               left: calcPos.x, 
               top: calcPos.y, 
               zIndex: 95 
            }}
            className={`w-40 sm:w-44 rounded-xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 ${
               isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'
            }`}
          >
             <div 
               style={{ touchAction: 'none' }}
               onPointerDown={handleCalcPointerDown}
               onPointerMove={handleCalcPointerMove}
               onPointerUp={handleCalcPointerUp}
               onPointerCancel={handleCalcPointerUp}
               className={`px-2 py-1 flex items-center justify-between cursor-move select-none border-b ${
                  isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'
               }`}
             >
                <span className={`text-[10px] font-bold flex items-center gap-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                   <Calculator className="w-3 h-3 text-accent-500" />
                </span>
                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setShowCalculator(false)} className={`p-0.5 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                   <X className="w-3 h-3" />
                </button>
             </div>
             
             <div className="p-1.5">
                 <div className={`w-full text-right px-2 py-1 rounded mb-1.5 text-sm font-mono font-bold tracking-wider overflow-hidden text-ellipsis whitespace-nowrap ${
                    isDark ? 'bg-zinc-950 text-accent-400' : 'bg-zinc-100 text-accent-600'
                 }`}>
                    {calcDisplay}
                 </div>
                 
                 <div className="grid grid-cols-4 gap-1">
                    {['C', '÷', 'x', '-', '7', '8', '9', '+', '4', '5', '6', '=', '1', '2', '3', '0', '.'].map((btn, i) => (
                       <button 
                         key={i}
                         onClick={() => handleCalcInput(btn)}
                         className={`py-1 rounded font-bold text-[11px] transition-colors active:scale-95 ${
                            btn === '=' 
                               ? `row-span-3 col-start-4 row-start-3 ${isDark ? 'bg-accent-600 hover:bg-accent-500 text-white' : 'bg-accent-500 hover:bg-accent-600 text-white'}`
                               : btn === '0'
                               ? `col-span-2 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`
                               : ['C', '÷', 'x', '-', '+'].includes(btn)
                               ? `${isDark ? 'bg-zinc-800 text-orange-400 hover:bg-zinc-700' : 'bg-zinc-200 text-orange-600 hover:bg-zinc-300'}`
                               : `${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`
                         }`}
                       >
                          {btn}
                       </button>
                    ))}
                 </div>
             </div>
          </div>
      )}

      {/* TOAST CUSTOM FOR INNER VIEW */}
      {toastMessage && (
         <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-accent-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4 z-[300]">
            {toastMessage}
         </div>
      )}
      {pinOverlayJSX}
    </div>
    </>
  );
}
