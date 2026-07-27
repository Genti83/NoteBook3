import React, { useState, useEffect, useRef } from 'react';
import { getDirectoryHandle, saveDirectoryHandle } from '../lib/directoryFS';
import { Github, Trash2, Minus, Database, Upload, Download, File, FileDown, Plus, X, Maximize2, Calculator, Save, LogOut, Sun, Moon, FileText, Calendar, Search, Check, Square, ImagePlus, FolderDown, FolderUp, Lock, Unlock, Cloud, LogIn, Loader2, FileSpreadsheet, Sparkles, Mic, MicOff, Palette, Settings, RotateCcw, FileJson, UploadCloud, RefreshCw, Eraser, ImageMinus, Paintbrush, ArrowDownAZ, ArrowUpAZ, CalendarDays, Type, CaseSensitive, RemoveFormatting, Eye, Monitor, Tag, Archive, FolderPlus, Share2, FolderOpen, Terminal, Copy, CheckCheck, Folder, User, Key, AlertTriangle, ArrowLeft, Edit } from 'lucide-react';
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
  const [authError, setAuthError] = useState<{ code: string; message: string; provider: string } | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (authModal) {
      setAuthError(null);
      setResetSent(false);
    }
  }, [authModal]);
  const { user, loading, loginWithGoogle: hookGoogleLogin, loginWithEmail: hookEmailLogin, registerWithEmail: hookEmailRegister, loginAnonymously: hookAnonymousLogin, logout: hookLogout, resetPassword: hookResetPassword } = useFirebase();
  const [email, setEmail] = useState(() => localStorage.getItem('grid_notepad_saved_email') || '');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const [cloudModal, setCloudModal] = useState(false);
  const [cloudDocToDelete, setCloudDocToDelete] = useState<any>(null);
  const [backupModal, setBackupModal] = useState(false);
  const [gistToken, setGistToken] = useState(localStorage.getItem('grid_notepad_gist_token') || '');
  const [gistId, setGistId] = useState(localStorage.getItem('grid_notepad_gist_id') || '');
  const [aiAutopilot, setAiAutopilot] = useState<boolean>(() => localStorage.getItem('grid_ai_autopilot') !== 'false');
  const [isAiAutopilotRunning, setIsAiAutopilotRunning] = useState(false);
  const [gistViewerModal, setGistViewerModal] = useState(false);
  const [gistViewerContent, setGistViewerContent] = useState<string | null>(null);
  
  const [showCloudDropdown, setShowCloudDropdown] = useState(false);
  const [onlineView, setOnlineView] = useState<'cloud' | 'gist' | null>(null);
  const [selectedOnlineDoc, setSelectedOnlineDoc] = useState<GridDocument | null>(null);
  const [isOnlineEditing, setIsOnlineEditing] = useState(false);
  const [isOnlineAiThinking, setIsOnlineAiThinking] = useState(false);
  const [onlineSearch, setOnlineSearch] = useState('');
  const [onlineDashboardTab, setOnlineDashboardTab] = useState<'lists' | 'notes' | 'secrets'>('lists');
  const [onlineBlueText, setOnlineBlueText] = useState('');
  const [onlineSecretList, setOnlineSecretList] = useState<{id: string, text: string, done: boolean}[]>([]);
  const [secureLogoutModal, setSecureLogoutModal] = useState<{
    isOpen: boolean;
    target: 'cloud' | 'gist' | null;
    onSuccess: (() => void) | null;
  }>({ isOpen: false, target: null, onSuccess: null });
  const [secureLogoutPasswordInput, setSecureLogoutPasswordInput] = useState('');
  const [logoutInfoModal, setLogoutInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);
  const isGistSyncingRef = useRef(false);

  const saveToGist = async (docsToSave: GridDocument[] = documents, silent = false, blueTextToSave?: string, secretListToSave?: any[]) => {
      if (!gistToken) {
         if (!silent) showToast("Ju lutem vendosni një GitHub Token");
         return;
      }
      const finalBlueText = blueTextToSave !== undefined ? blueTextToSave : blueText;
      const finalSecretList = secretListToSave !== undefined ? secretListToSave : secretList;

      if (!silent) showToast("Duke ruajtur në GitHub Gist...");
      try {
          const contentObj = {
             documents: docsToSave,
             blueText: finalBlueText,
             secretList: finalSecretList
          };
          const content = JSON.stringify(contentObj);
          
          // Generate a beautiful human-readable markdown notebook representation
          let mdContent = `# 📔 MANUAL NOTEBOOK - GIST CLOUD BACKUP\n\n`;
          mdContent += `*Ky skedar përmban të gjitha shënimet tuaja të sinkronizuara manualisht ose automatikisht në Gist Cloud.*\n`;
          mdContent += `*Përditësuar më: ${new Date().toLocaleString('sq-AL')}*\n\n---\n\n`;

          // Add BlueText/Notes to markdown
          mdContent += `## 📝 SHËNIMET ME TEKST (NOTES)\n\n`;
          if (finalBlueText) {
             mdContent += `${finalBlueText}\n\n`;
          } else {
             mdContent += `*Nuk ka shënime me tekst.*\n\n`;
          }
          mdContent += `\n---\n\n`;

          // Add SecretList to markdown
          mdContent += `## 🔒 LISTA E SEKRETEVE (SECRETS)\n\n`;
          if (finalSecretList && finalSecretList.length > 0) {
             finalSecretList.forEach((secretItem, idx) => {
                const check = secretItem.done ? '[x]' : '[ ]';
                mdContent += `- ${check} ${secretItem.text || 'Element i paemërtuar'}\n`;
             });
          } else {
             mdContent += `*Nuk ka sekrete në listë.*\n\n`;
          }
          mdContent += `\n---\n\n`;

          mdContent += `## 📄 LISTAT E TABELAVE (TABLE DOCUMENTS)\n\n`;
          docsToSave.forEach((docItem, index) => {
             mdContent += `### ${index + 1}. 📄 ${docItem.title || 'Dokument i Paemërtuar'}\n`;
             mdContent += `- **Krijuar më:** ${docItem.createdAt ? new Date(docItem.createdAt).toLocaleString('sq-AL') : 'N/A'}\n`;
             mdContent += `- **Përditësuar më:** ${docItem.updatedAt ? new Date(docItem.updatedAt).toLocaleString('sq-AL') : 'N/A'}\n`;
             if (docItem.tags && docItem.tags.length > 0) {
                mdContent += `- **Etiketat:** ${docItem.tags.map(t => `\`${t}\``).join(', ')}\n`;
             }
             mdContent += `\n#### 📊 Përmbajtja e Tabelës\n\n`;

             // Headers
             const headersLine = '| ' + docItem.headers.join(' | ') + ' |';
             const dividerLine = '| ' + docItem.headers.map(() => '---').join(' | ') + ' |';
             mdContent += headersLine + '\n' + dividerLine + '\n';

             // Rows
             docItem.rows.forEach(row => {
                const cols = docItem.headers.map((_, i) => {
                   let val = (row[`col${i+1}`] || '').toString().trim();
                   // Escape markdown pipes
                   val = val.replace(/\|/g, '\\|').replace(/\n/g, ' <br> ');
                   if (row.status && row.status !== 'none' && i === 0) {
                      const statusSymbol = row.status === 'done' ? '✅ ' : '⏳ ';
                      val = statusSymbol + val;
                   }
                   return val;
                });
                mdContent += '| ' + cols.join(' | ') + ' |\n';
             });

             mdContent += `\n---\n\n`;
          });

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
                description: 'Grid Notepad Backup & Manual Notebook',
                public: false,
                files: {
                   'grid_notepad_backup.json': { content },
                   'manual_notebook_gist_cloud.md': { content: mdContent }
                }
             })
          });

          if (!res.ok) throw new Error("Gabim gjatë ruajtjes në Gist. Kontrolloni Token-in.");
          const data = await res.json();
          setGistId(data.id);
          localStorage.setItem('grid_notepad_gist_id', data.id);
          localStorage.setItem('grid_notepad_gist_token', gistToken);
          
          // Auto-sync Gist credentials with Google Cloud immediately
          if (!isGistSyncingRef.current) {
              isGistSyncingRef.current = true;
              await syncWithGoogleCloud(docsToSave, true);
              isGistSyncingRef.current = false;
          }
          
          if (!silent) showToast("U ruajt me sukses në GitHub Gist dhe u sinkronizua me Google Cloud!");
      } catch (err: any) {
          if (!silent) showToast(err.message);
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
          
          try {
             const parsed = JSON.parse(content);
             let docsList: GridDocument[] = [];
             let gistBlueText = '';
             let gistSecretList: any[] = [];
             
             if (parsed && typeof parsed === 'object') {
                if (Array.isArray(parsed)) {
                   docsList = parsed;
                } else {
                   docsList = parsed.documents || [];
                   gistBlueText = parsed.blueText || '';
                   gistSecretList = parsed.secretList || [];
                }
             }
             
             setOnlineBlueText(gistBlueText);
             setOnlineSecretList(gistSecretList);
             
             if (docsList.length > 0) {
                setSelectedOnlineDoc(docsList[0]);
             }
          } catch(e){}
      } catch (err: any) {
          showToast(err.message);
      }
  };

  const openGistDashboard = async () => {
     if (!gistId) {
        showToast("Nuk ka Gist ID të caktuar. Së pari ruani diçka në Gist.");
        setBackupModal(true);
        return;
     }
     setOnlineView('gist');
     setSelectedOnlineDoc(null);
     setIsOnlineEditing(false);
     await viewGistContent();
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
          
          let docs = parsed;
          let gistBlueText = '';
          let gistSecretList: any[] = [];
          
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
             docs = parsed.documents || [];
             gistBlueText = parsed.blueText || '';
             gistSecretList = parsed.secretList || [];
          }
          
          setDocuments(docs);
          localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(docs));
          
          if (gistBlueText) {
             setBlueText(gistBlueText);
             localStorage.setItem('grid_notepad_blue', gistBlueText);
          }
          if (gistSecretList && gistSecretList.length > 0) {
             setSecretList(gistSecretList);
             localStorage.setItem('grid_notepad_secret_list', JSON.stringify(gistSecretList));
          }

          if (activeDocId) {
             const curr = docs.find((d: any) => d.id === activeDocId);
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
  const [secretActiveTab, setSecretActiveTab] = useState<'editor' | 'list'>('editor');
  const secretFileInputRef = useRef<HTMLInputElement | null>(null);
  const [cloudDocs, setCloudDocs] = useState<GridDocument[]>([]);
  const [isFetchingCloud, setIsFetchingCloud] = useState(false);

  const [selectedCloudDocIds, setSelectedCloudDocIds] = useState<string[]>([]);
  const [previewModalDoc, setPreviewModalDoc] = useState<GridDocument | null>(null);
  const [fullViewDoc, setFullViewDoc] = useState<GridDocument | null>(null);
  const fileInputBackupRef = useRef<HTMLInputElement | null>(null);

  const handleUnifiedCloudSync = async () => {
     if (!user) {
        showToast("Ju lutem kyçuni me Email/Password ose Google për të sinkronizuar të dhënat.");
        setAuthModal(true);
        return;
     }
     const mail = getActiveUid()!;
     
     showToast("⚡ Duke u lidhur me Google Cloud...");

     // 1. Fetch current cloud database state
     const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true).catch(() => null) : null;
     const endpoints = getApiEndpoints(`/api/cloud/load?userId=${encodeURIComponent(mail)}`);
     let cloudData: any = null;

     for (const ep of endpoints) {
        try {
           const headers: Record<string, string> = {};
           if (idToken) {
              headers['Authorization'] = `Bearer ${idToken}`;
           }
           const finalEp = idToken ? `${ep}&idToken=${encodeURIComponent(idToken)}` : ep;
           const res = await fetch(finalEp, { headers });
           if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
              const json = await res.json();
              if (json && json.success) {
                 cloudData = json;
                 break;
              }
           }
        } catch (e) {
           console.warn("Error fetching cloud during smart sync:", e);
        }
     }

     let mergedDocs = [...documents];
     let mergedBlueText = blueText;
     let mergedSecretList = [...secretList];

     if (cloudData) {
        // A. Merge Notepad Documents
        const cloudDocsList: GridDocument[] = cloudData.documents || [];
        const localDocsList = [...documents];

        // Create a map of local documents by ID
        const localDocsMap = new Map<string, GridDocument>();
        localDocsList.forEach(d => localDocsMap.set(d.id, d));

        cloudDocsList.forEach(cDoc => {
           const localDoc = localDocsMap.get(cDoc.id);
           if (!localDoc) {
              // Doc exists in cloud but not locally, download/add it!
              localDocsList.push(cDoc);
           } else {
              // Doc exists in both, choose the one with newer updatedAt
              const localTime = new Date(localDoc.updatedAt || localDoc.createdAt || 0).getTime();
              const cloudTime = new Date(cDoc.updatedAt || cDoc.createdAt || 0).getTime();
              if (cloudTime > localTime) {
                 // Cloud is newer, overwrite local
                 const idx = localDocsList.findIndex(d => d.id === cDoc.id);
                 if (idx >= 0) localDocsList[idx] = cDoc;
              }
           }
        });
        mergedDocs = localDocsList;

        // B. Merge blueText (secrets drafting text)
        const cloudBlueText = cloudData.blueText || '';
        if (!mergedBlueText && cloudBlueText) {
           mergedBlueText = cloudBlueText;
        } else if (mergedBlueText && cloudBlueText && mergedBlueText !== cloudBlueText) {
           // If different, merge them elegantly
           if (!mergedBlueText.includes(cloudBlueText) && !cloudBlueText.includes(mergedBlueText)) {
              mergedBlueText = cloudBlueText + "\n\n--- Sinkronizuar nga Pajisja tjetër ---\n" + mergedBlueText;
           } else if (cloudBlueText.length > mergedBlueText.length) {
              mergedBlueText = cloudBlueText;
           }
        }

        // C. Merge Secret Checklist List
        const cloudSecretList: any[] = cloudData.secretList || [];
        const localSecretMap = new Map<string, any>();
        mergedSecretList.forEach(item => localSecretMap.set(item.id, item));

        cloudSecretList.forEach(cItem => {
           if (!localSecretMap.has(cItem.id)) {
              mergedSecretList.push(cItem);
           } else {
              const localItem = localSecretMap.get(cItem.id);
              if (localItem) {
                 localItem.done = localItem.done || cItem.done;
                 if (cItem.text && !localItem.text) {
                    localItem.text = cItem.text;
                 }
              }
           }
        });

        // D. PIN Password Restore
        if (cloudData.gistToken) {
           setGistToken(cloudData.gistToken);
           localStorage.setItem('grid_notepad_gist_token', cloudData.gistToken);
        }
        if (cloudData.gistId) {
           setGistId(cloudData.gistId);
           localStorage.setItem('grid_notepad_gist_id', cloudData.gistId);
        }
        if (cloudData.pin && !localStorage.getItem('grid_notepad_pin')) {
           localStorage.setItem('grid_notepad_pin', cloudData.pin);
        }
     }

     // 2. Set the merged state locally and save to localStorage
     setDocuments(mergedDocs);
     if (cloudData && cloudData.geminiKey) {
        setUserGeminiKey(cloudData.geminiKey);
        localStorage.setItem('grid_notepad_gemini_key', cloudData.geminiKey);
     }
     setCloudDocs(mergedDocs);
     localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(mergedDocs));

     setBlueText(mergedBlueText);
     localStorage.setItem('grid_notepad_blue', mergedBlueText);

     setSecretList(mergedSecretList);
     localStorage.setItem('grid_notepad_secret_list', JSON.stringify(mergedSecretList));

     // Open first document if no document is active
     if (mergedDocs.length > 0 && !activeDocId) {
        openDocument(mergedDocs[0]);
     }

     // 3. Upload the merged/fully synchronized state back to the cloud
     const synced = await syncWithGoogleCloud(mergedDocs, true);
     
     if (synced) {
        showToast("⚡ Sinkronizimi i zgjuar (Smart Merge) me Google Cloud u krye me sukses 100%!");
     } else {
        showToast("Të dhënat u sinkronizuan lokalisht në këtë pajisje.");
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
     return user ? (user.email || user.uid).toLowerCase() : null;
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
        if (event.error !== 'aborted' && event.error !== 'no-speech' && event.error !== 'not-allowed') {
            console.error("Speech recognition error", event.error);
        } else {
            console.warn("Speech recognition notice:", event.error);
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
        if (event.error !== 'aborted' && event.error !== 'no-speech' && event.error !== 'not-allowed') {
            console.error("Speech recognition error", event.error);
        } else {
            console.warn("Speech recognition notice:", event.error);
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
       
       const mail = (email || localStorage.getItem('grid_notepad_saved_email') || 'genti8319@gmail.com').trim();
       const payload = JSON.stringify({ 
          prompt: promptText, 
          documents: docsForAi, 
          activeDocId, 
          image: aiChatImage, 
          audio: aiChatAudio,
          blueText,
          secretList,
          userEmail: mail,
           geminiKey: userGeminiKey || localStorage.getItem('grid_notepad_gemini_key') || ''
        });
        
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

             const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-pro'];

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

   const syncWithGoogleCloud = async (docsToSync?: GridDocument[], silent = false, blueTextToSync?: string, secretListToSync?: any[]) => {
    const docs = docsToSync || documents;
    const uid = getActiveUid() || 'genti8319@gmail.com';
    const finalBlueText = blueTextToSync !== undefined ? blueTextToSync : blueText;
    const finalSecretList = secretListToSync !== undefined ? secretListToSync : secretList;
    
    appendDebugLog(`☁️ [Google Cloud Sync] Po ngarkohen ${docs.length} dokumente për përdoruesin: ${uid}`);

    const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true).catch(() => null) : null;
    const payloadObj: any = {
      userId: uid,
      documents: docs,
      blueText: finalBlueText,
      secretList: finalSecretList,
      pin: localStorage.getItem('grid_notepad_pin') || null,
      gistToken: gistToken || localStorage.getItem('grid_notepad_gist_token') || null,
      gistId: gistId || localStorage.getItem('grid_notepad_gist_id') || null,
      geminiKey: userGeminiKey || localStorage.getItem('grid_notepad_gemini_key') || null
    };
    if (idToken) {
      payloadObj.idToken = idToken;
    }
    const payload = JSON.stringify(payloadObj);

    const endpoints = getApiEndpoints('/api/cloud/sync');

    let success = false;
    for (const ep of endpoints) {
      appendDebugLog(`📡 [Google Cloud Sync] Po provohet lidhja me endpoint: ${ep}`);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }
        const res = await fetch(ep, {
          method: 'POST',
          headers,
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

    if (success && gistToken && gistId && !isGistSyncingRef.current) {
        isGistSyncingRef.current = true;
        saveToGist(docs, true).finally(() => {
            isGistSyncingRef.current = false;
        });
    }

    return success;
  };

  const handleUnifiedRestoreAll = async () => {
      showToast("Duke nisur rikuperimin e plotë (Restore All)...");
      let successCloud = false;
      let successGist = false;

      // 1. Google Cloud Restore
      if (user) {
         try {
            await handleFullCloudRestore();
            successCloud = true;
         } catch (err: any) {
            console.error("Cloud restore failed:", err);
         }
      }

      // 2. Gist Restore
      if (gistToken && gistId) {
         try {
            await loadFromGist();
            successGist = true;
         } catch (err: any) {
            console.error("Gist restore failed:", err);
         }
      }

      if (successCloud && successGist) {
         showToast("✅ Rikuperimi i plotë u krye me sukses nga Google Cloud & Gist!");
      } else if (successCloud) {
         showToast("✓ Rikuperimi u krye me sukses nga Google Cloud!");
      } else if (successGist) {
         showToast("✓ Rikuperimi u krye me sukses nga Gist!");
      } else {
         showToast("⚠️ Nuk ka asnjë llogari të lidhur për të kryer Restore All.");
      }
  };

     const handleCreateSecretListItem = () => {
      const newItem = { id: Date.now().toString(), text: '', note: '', done: false };
      const updated = [...secretList, newItem];
      setSecretList(updated);
      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
      showToast("U krijua një element i ri!");
   };

  const handleCreateSecretEditorNote = () => {
     const dateStr = format(new Date(), 'yyyy-MM-dd HH:mm');
     const newNotePrompt = (blueText ? "\n\n" : "") + `--- Shënim i Ri (${dateStr}) ---\n`;
     const updated = blueText + newNotePrompt;
     setBlueText(updated);
     localStorage.setItem('grid_notepad_blue', updated);
     showToast("U shtua një seksion i ri shënimesh!");
  };

  const handleSaveSecrets = async () => {
     localStorage.setItem('grid_notepad_blue', blueText);
     localStorage.setItem('grid_notepad_secret_list', JSON.stringify(secretList));
     if (auth.currentUser && navigator.onLine) {
        const blueRef = doc(db, 'settings', getActiveUid()!);
        await setDoc(blueRef, { 
            blueText, 
            secretList,
            userId: getActiveUid()!, 
            pin: localStorage.getItem('grid_notepad_pin') || null 
        }, { merge: true });
        showToast("🔒 Shënimet sekrete u ruajtën me sukses në Cloud!");
     } else {
        showToast("🔒 Shënimet sekrete u ruajtën lokalisht me sukses!");
     }
  };

  const handleDeleteSecrets = () => {
     if (secretActiveTab === 'list') {
        const checkedCount = secretList.filter(i => i.done).length;
        if (checkedCount > 0) {
           const updated = secretList.filter(i => !i.done);
           setSecretList(updated);
           localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
           showToast(`Fshihen ${checkedCount} elemente të përzgjedhur!`);
        } else {
           if (confirm("Dëshironi të fshini të gjithë listën e sekreteve?")) {
              setSecretList([]);
              localStorage.setItem('grid_notepad_secret_list', JSON.stringify([]));
              showToast("U fshinë të gjitha!");
           }
        }
     } else {
        if (confirm("Dëshironi të pastroni plotësisht tekstin e shënimit sekret?")) {
           setBlueText('');
           localStorage.setItem('grid_notepad_blue', '');
           showToast("U pastrua teksti!");
        }
     }
  };

  const handleSelectAllSecrets = () => {
     if (secretActiveTab === 'list') {
        if (secretList.length === 0) {
           showToast("Lista është bosh!");
           return;
        }
        const allDone = secretList.every(i => i.done);
        const updated = secretList.map(i => ({ ...i, done: !allDone }));
        setSecretList(updated);
        localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
        showToast(allDone ? "U çpërzgjodhën të gjitha!" : "U përzgjodhën të gjitha!");
     } else {
        showToast("Zgjedhja vlen vetëm për listën e sekreteve!");
     }
  };

  const handleExportSecrets = () => {
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        blueText,
        secretList
     }, null, 2));
     const downloadAnchor = document.createElement('a');
     downloadAnchor.setAttribute("href", dataStr);
     downloadAnchor.setAttribute("download", `bllok_sekrete_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
     document.body.appendChild(downloadAnchor);
     downloadAnchor.click();
     downloadAnchor.remove();
     showToast("Dosja e sekreteve u shkarkua me sukses!");
  };

  const handleImportSecretsClick = () => {
     secretFileInputRef.current?.click();
  };

  const handleImportSecretsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (event) => {
        try {
           const parsed = JSON.parse(event.target?.result as string);
           if (parsed.blueText !== undefined) {
              setBlueText(parsed.blueText);
              localStorage.setItem('grid_notepad_blue', parsed.blueText);
           }
           if (parsed.secretList && Array.isArray(parsed.secretList)) {
              setSecretList(parsed.secretList);
              localStorage.setItem('grid_notepad_secret_list', JSON.stringify(parsed.secretList));
           }
           showToast("🔒 Të dhënat sekrete u importuan me sukses!");
        } catch (err) {
           const textContent = event.target?.result as string;
           setBlueText(textContent);
           localStorage.setItem('grid_notepad_blue', textContent);
           setSecretActiveTab('editor');
           showToast("🔒 U importua si tekst i thjeshtë në editor.");
        }
     };
     reader.readAsText(file);
  };

  const loadFromGoogleCloud = async (silent = false) => {
    setIsFetchingCloud(true);
    if (!user) {
       setIsFetchingCloud(false);
       if (!silent) {
          showToast("Ju lutem kyçuni me Email/Password ose Google për të shkarkuar të dhënat.");
       }
       return false;
    }
    const uid = getActiveUid()!;
    appendDebugLog(`☁️ [Google Cloud Load] Po shkarkohen dokumentet nga serveri për: ${uid}`);

    const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true).catch(() => null) : null;
    const endpoints = getApiEndpoints(`/api/cloud/load?userId=${encodeURIComponent(uid)}`);

    let loadedData: any = null;
    for (const ep of endpoints) {
      appendDebugLog(`📡 [Google Cloud Load] Po kërkohet nga endpoint: ${ep}`);
      try {
        const headers: Record<string, string> = {};
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }
        const finalEp = idToken ? `${ep}&idToken=${encodeURIComponent(idToken)}` : ep;
        const res = await fetch(finalEp, { headers });
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
          const q = query(collection(db, 'documents'), where('userId', '==', getActiveUid()!));
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

  const fetchCloudDocsOnly = async (silent = false) => {
    setIsFetchingCloud(true);
    const uid = getActiveUid()!;
    const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true).catch(() => null) : null;
    const endpoints = getApiEndpoints(`/api/cloud/load?userId=${encodeURIComponent(uid)}`);

    let loadedDocs: GridDocument[] | null = null;
    for (const ep of endpoints) {
      try {
        const headers: Record<string, string> = {};
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
        const finalEp = idToken ? `${ep}&idToken=${encodeURIComponent(idToken)}` : ep;
        const res = await fetch(finalEp, { headers });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const json = await res.json();
          if (json.documents) {
            loadedDocs = json.documents;
            setOnlineBlueText(json.blueText || '');
            setOnlineSecretList(json.secretList || []);
            break;
          }
        }
      } catch (e) {}
    }

    if (loadedDocs) {
       setCloudDocs(loadedDocs);
       setIsFetchingCloud(false);
       return loadedDocs;
    }

    // Fallback to direct firestore get
    if (user) {
       try {
          const q = query(collection(db, 'documents'), where('userId', '==', getActiveUid()!));
          const snapshot = await getDocs(q);
          const cloudData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as GridDocument));
          
          // Load settings (blueText and secretList) from Firestore
          const settingsSnap = await getDoc(doc(db, 'settings', getActiveUid()!));
          if (settingsSnap.exists()) {
             const sData = settingsSnap.data();
             setOnlineBlueText(sData.blueText || '');
             setOnlineSecretList(sData.secretList || []);
          } else {
             setOnlineBlueText('');
             setOnlineSecretList([]);
          }

          if (cloudData.length > 0) {
             setCloudDocs(cloudData);
             setIsFetchingCloud(false);
             return cloudData;
          }
       } catch (e) {}
    }
    
    setIsFetchingCloud(false);
    if (!silent) showToast("Nuk u gjet asnjë dokument në Cloud.");
    return null;
  };

  const restoreLoadedCloudDocsToLocal = async () => {
     if (cloudDocs.length === 0) {
        showToast("Nuk ka dokumente në Cloud për t'u rikthyer.");
        return;
     }
     if (!window.confirm("A jeni i sigurt që dëshironi të zëvendësoni të gjitha shënimet lokale me ato nga Cloud?")) return;
     
     setDocuments(cloudDocs);
     localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(cloudDocs));
     showToast("⚡ Të gjitha shënimet u rikthyen me sukses!");
  };

  const openCloudModal = async () => {
     if (!user) {
        showToast("Ju lutem kyçuni me Email/Password ose Google për të hapur Cloud.");
        setBackupModal(true);
        return;
     }
     setOnlineView('cloud');
     setSelectedOnlineDoc(null);
     setIsOnlineEditing(false);
     const docs = await fetchCloudDocsOnly(false);
     if (docs && docs.length > 0) {
        setSelectedOnlineDoc(docs[0]);
     }
  };

  const handleSecureLogoutRequest = (target: 'cloud' | 'gist', onSuccess: () => void) => {
     const savedPin = localStorage.getItem('grid_notepad_pin');
     if (!savedPin) {
        showToast("Së pari duhet të krijoni një Password/PIN për sigurinë e llogarisë tuaj!");
        executeProtectedAction(() => {
           handleSecureLogoutRequest(target, onSuccess);
        });
     } else {
        setSecureLogoutPasswordInput('');
        setSecureLogoutModal({ isOpen: true, target, onSuccess });
     }
  };

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
        if (result && result.user) {
            localStorage.setItem('grid_cloud_sync_freq', '5000');
            setCloudSyncFrequency(5000);
            localStorage.setItem('grid_notepad_logged_in_provider', 'google');
            if (result.user.email) {
                localStorage.setItem('grid_notepad_saved_email', result.user.email);
            }
            localStorage.removeItem('grid_notepad_custom_uid');
            showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua automatikisht!");
            setTimeout(() => forceCloudBackup(), 1500);
        }
    }).catch(console.error);

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
  }, []);

  // Intelligent, resilient session auto-restoration
  useEffect(() => {
     if (!loading && !user) {
         const lastProvider = localStorage.getItem('grid_notepad_logged_in_provider');
         if (lastProvider === 'email') {
             const savedEmail = localStorage.getItem('grid_notepad_saved_email');
             const savedPwd = localStorage.getItem('grid_notepad_saved_pwd');
             if (savedEmail && savedPwd) {
                 appendDebugLog(`🔄 [Session Restore] Po rilidhemi me Email/Password: ${savedEmail}`);
                 hookEmailLogin(savedEmail, savedPwd)
                     .then(() => {
                         showToast("Lidhja me llogarinë tuaj u rikthye automatikisht!");
                     })
                     .catch((err) => {
                         appendDebugLog(`⚠️ [Session Restore] Rilidhja me email dështoi: ${err.message}`);
                     });
             }
         } else if (lastProvider === 'anonymous') {
             appendDebugLog(`🔄 [Session Restore] Po rilidhemi me Hyrje të Shpejtë (Anonym)`);
             hookAnonymousLogin()
                 .then(() => {
                     showToast("Hyrja e Shpejtë u rikthye automatikisht!");
                 })
                 .catch((err) => {
                     appendDebugLog(`⚠️ [Session Restore] Rilidhja me Hyrje të Shpejtë dështoi: ${err.message}`);
                 });
         }
     }
  }, [loading, user]);

  useEffect(() => {
     if (user) {
         const fetchCloudSettings = async () => {
            try {
               const uid = getActiveUid() || user.uid;
               const settingsRef = doc(db, 'settings', uid);
               const settingsSnap = await getDoc(settingsRef);
               if (settingsSnap.exists()) {
                  const data = settingsSnap.data();
                  if (data) {
                     appendDebugLog(`🔒 [Settings Load] U gjetën cilësimet e sigurisë në Firestore!`);
                     if (data.blueText !== undefined) {
                        setBlueText(data.blueText);
                        localStorage.setItem('grid_notepad_blue', data.blueText);
                     }
                     if (data.secretList) {
                        setSecretList(data.secretList);
                        localStorage.setItem('grid_notepad_secret_list', JSON.stringify(data.secretList));
                     }
                     if (data.pin) {
                        localStorage.setItem('grid_notepad_pin', data.pin);
                     }
                     if (data.gistToken) {
                        setGistToken(data.gistToken);
                        localStorage.setItem('grid_notepad_gist_token', data.gistToken);
                     }
                     if (data.gistId) {
                        setGistId(data.gistId);
                        localStorage.setItem('grid_notepad_gist_id', data.gistId);
                     }
                     if (data.geminiKey) {
                        setUserGeminiKey(data.geminiKey);
                        localStorage.setItem('grid_notepad_gemini_key', data.geminiKey);
                     }
                  }
               }
            } catch (err) {
               console.error("Error loading settings from Firestore:", err);
            }
         };
         fetchCloudSettings();

         const fetchCloudData = async () => {
           try {
               const q = query(collection(db, 'documents'), where('userId', '==', getActiveUid()!));
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
                               await setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: getActiveUid()! });
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
              showToast("Lorigjistrim i suksesshëm! Sinkronizimi Cloud u aktivizua.");
          } else {
              await hookEmailLogin(email, password);
              showToast("Hyrje e suksesshme! Sinkronizimi Cloud u aktivizua.");
          }
          
          localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);
          localStorage.setItem('grid_notepad_logged_in_provider', 'email');
          localStorage.removeItem('grid_notepad_custom_uid'); 
          
          localStorage.setItem('grid_cloud_sync_freq', '5000');
          setCloudSyncFrequency(5000);
          
          setAuthModal(false);
          setPassword('');
          
          setTimeout(() => handleUnifiedCloudSync(), 1500);
      } catch (err: any) {
          console.error("Email auth err:", err);
          setAuthError({ code: err.code || 'unknown', message: err.message, provider: 'email' });
          let msg = "Gabim: " + err.message;
          if (err.code === 'auth/email-already-in-use') {
             try {
                 showToast("Kjo llogari ekziston! Po kyçeni automatikisht...");
                 await hookEmailLogin(email, password);
                 showToast("Hyrje e suksesshme me llogarinë tuaj!");
                 localStorage.setItem('grid_notepad_saved_email', email);
                 localStorage.setItem('grid_notepad_saved_pwd', password);
                 localStorage.setItem('grid_notepad_logged_in_provider', 'email');
                 localStorage.removeItem('grid_notepad_custom_uid'); 
                 localStorage.setItem('grid_cloud_sync_freq', '5000');
                 setCloudSyncFrequency(5000);
                 setAuthModal(false);
                 setPassword('');
                 setTimeout(() => handleUnifiedCloudSync(), 1500);
                 return;
             } catch (loginErr: any) {
                 setIsSignUp(false);
                 setAuthError({ code: loginErr.code || 'unknown', message: loginErr.message, provider: 'email' });
                 return;
             }
          }
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi duhet të ketë të paktën 6 karaktere.";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
             msg = "Kredenciale të gabuara! Nëse jeni regjistruar me Google, klikoni butonin Google.";
          }
          if (err.code === 'auth/operation-not-allowed') {
             return;
          }
          if (err.code === 'auth/network-request-failed') {
             msg = "Nuk ka lidhje interneti ose u bllokua kërkesa! Sigurohuni që pajisja ka akses.";
          }
          
          showToast(msg);
      }
  };

  const handleResetPassword = async () => {
      if (!email) {
          showToast(t("Ju lutem shkruani email-in tuaj më lart!", "Please type your email above!"));
          return;
      }
      try {
          showToast(t("Po dërgojmë email-in e rivendosjes...", "Sending reset email..."));
          await hookResetPassword(email);
          showToast(t("Email-i i rivendosjes u dërgua me sukses! Kontrolloni inbox-in tuaj.", "Reset email sent successfully! Check your inbox."));
          setResetSent(true);
      } catch (err: any) {
          showToast(t("Gabim gjatë dërgimit: ", "Error during send: ") + err.message);
      }
  };

  const loginWithGoogle = async () => {
      try {
         const googleUser = await hookGoogleLogin(); if (googleUser && googleUser.email) { localStorage.setItem("grid_notepad_saved_email", googleUser.email); }
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
         console.error("Google auth err:", err);
         setAuthError({ code: err.code || 'unknown', message: err.message, provider: 'google' });
         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
             showToast("Dritarja u mbyll! Provoni përsëri ose përdorni hyrjen me Email/Password.");
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
          console.error("Anonymous auth err:", err);
          setAuthError({ code: err.code || 'unknown', message: err.message, provider: 'anonymous' });
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
     localStorage.setItem('grid_notepad_blue', blueText);
     localStorage.setItem('grid_notepad_secret_list', JSON.stringify(secretList));

     const t = setTimeout(async () => {
        if (auth.currentUser && navigator.onLine) {
           const uid = getActiveUid();
           if (uid) {
              const settingsRef = doc(db, 'settings', uid);
              setDoc(settingsRef, { 
                  blueText, 
                  secretList,
                  userId: uid, 
                  pin: localStorage.getItem('grid_notepad_pin') || null,
                  gistToken: gistToken || null,
                  gistId: gistId || null,
                  geminiKey: userGeminiKey || null
              }, { merge: true }).catch(()=>{});
           }
        }
        if (navigator.onLine) {
           await syncWithGoogleCloud(documents, true, blueText, secretList);
        }
     }, 1500);

     runAiAutopilot(documents, blueText);

     return () => clearTimeout(t);
  }, [blueText, secretList, userGeminiKey, gistToken, gistId]);



  const autopilotTimeout = useRef<any>(null);

  const runAiAutopilot = (updatedDocs?: GridDocument[], updatedBlueText?: string) => {
     const isEnabled = localStorage.getItem('grid_ai_autopilot') !== 'false';
     if (!isEnabled || !navigator.onLine) return;

     if (autopilotTimeout.current) clearTimeout(autopilotTimeout.current);
     autopilotTimeout.current = setTimeout(async () => {
        setIsAiAutopilotRunning(true);
        appendDebugLog(`🤖 [AI Autopilot] Agjenti aktiv po analizon ndryshimet e fundit në sfond...`);
        try {
           const docs = updatedDocs || latestDocsRef.current || documents;
           const finalBlueText = updatedBlueText !== undefined ? updatedBlueText : blueText;
           const docsForAi = docs.map(docItem => ({
              ...docItem,
              rows: docItem.rows.map(r => {
                 const { image, ...rest } = r;
                 return rest;
              })
           }));
           
           const mail = (email || localStorage.getItem('grid_notepad_saved_email') || 'genti8319@gmail.com').trim();
           const payload = JSON.stringify({ 
              prompt: "Autopilot Check: Kontrollo dhe auto-përditëso/korrigjo llogaritjet, plotëso kolonat totale/shuma të zbrazëta ose korrigjo drejtshkrimin nëse ka gabime të dukshme.", 
              documents: docsForAi, 
              activeDocId: activeDocIdRef.current, 
              image: null, 
              audio: null,
              blueText: finalBlueText,
               secretList,
               userEmail: mail,
               geminiKey: userGeminiKey || localStorage.getItem('grid_notepad_gemini_key') || ''
           });
           
           const endpoints = getApiEndpoints('/api/ai/chat');
           let response: Response | null = null;
           for (const ep of endpoints) {
              try {
                 const res = await fetch(ep, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                 });
                 if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                    response = res;
                    break;
                 }
              } catch (e) {}
           }

           if (response) {
              const data = await response.json();
              if (data && data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
                 appendDebugLog(`🎉 [AI Autopilot] Agjenti gjeti korrigjime dhe po i aplikon ato automatikisht!`);
                 data.actions.forEach((act: any) => {
                     if (act.type === 'PROPOSE_COLUMNS_CHANGE' && act.documentId) {
                         setDocuments(prevDocs => {
                             const next = prevDocs.map(d => {
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
                             });
                             localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(next));
                             syncWithGoogleCloud(next, true);
                             return next;
                         });
                         if (act.documentId === activeDocIdRef.current) {
                             if (act.newHeaders) setHeaders(act.newHeaders);
                             if (act.newColumnWidths) setColumnWidths(act.newColumnWidths);
                             if (act.newRows) setRows(act.newRows);
                         }
                         showToast("⚡ Agjenti Gemini kreu auto-përditësime në sfond!");
                     } else if (act.type === 'UPDATE_DOCUMENT_ROWS' && act.documentId) {
                         setDocuments(prevDocs => {
                             const next = prevDocs.map(d => {
                                 if (d.id === act.documentId) {
                                     return {
                                         ...d,
                                         rows: act.newRows || d.rows,
                                         updatedAt: new Date().toISOString()
                                     };
                                 }
                                 return d;
                             });
                             localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(next));
                             syncWithGoogleCloud(next, true);
                             return next;
                         });
                         if (act.documentId === activeDocIdRef.current && act.newRows) {
                             setRows(act.newRows);
                         }
                         showToast("⚡ Agjenti Gemini korrigjoi rreshtat e bllokut automatikisht!");
                      } else if (act.type === 'DELETE_DOCUMENT' && act.documentId) {
                          setDocuments(prevDocs => {
                              const next = prevDocs.filter(d => d.id !== act.documentId);
                              localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(next));
                              syncWithGoogleCloud(next, true);
                              return next;
                          });
                          if (act.documentId === activeDocIdRef.current) {
                              setActiveDocId(null);
                          }
                          showToast(`⚡ Autopilot fshiu dokumentin e dubluar: ${act.title || act.documentId}`);
                     }
                 });
              } else {
                 appendDebugLog(`🤖 [AI Autopilot] Analiza mbaroi: Nuk u gjet asnjë gabim apo boshllëk për të plotësuar.`);
              }
           }
        } catch (err: any) {
           console.warn("Autopilot error:", err);
        } finally {
           setIsAiAutopilotRunning(false);
        }
     }, 10000); // 10 seconds of inactivity triggers the background agent
  };

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

      runAiAutopilot(updatedDocs);
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

  // Auto-activate and sync Google Cloud on mount if authenticated and online
  useEffect(() => {
     if (user && navigator.onLine) {
        setTimeout(() => {
           handleUnifiedCloudSync().catch(console.error);
        }, 1200);
     }
  }, [user]);

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

  const renderOnlineDashboard = () => {
     const isGist = onlineView === 'gist';
     const titleText = isGist ? "Platforma Gist GitHub" : "Platforma Cloud Google (Firebase)";
     
     let docsList: GridDocument[] = [];
     if (isGist) {
        try {
           const parsed = JSON.parse(gistViewerContent || '[]');
           if (Array.isArray(parsed)) docsList = parsed;
        } catch(e){}
     } else {
        docsList = cloudDocs;
     }

     const filteredOnline = docsList.filter(d => {
        if (!onlineSearch.trim()) return true;
        const q = onlineSearch.toLowerCase();
        return (d.title || '').toLowerCase().includes(q) || 
               (d.tags || []).some(t => t.toLowerCase().includes(q));
     });

     const handleOnlineTitleChange = (val: string) => {
        if (!selectedOnlineDoc) return;
        setSelectedOnlineDoc({
           ...selectedOnlineDoc,
           title: val,
           updatedAt: new Date().toISOString()
        });
     };

     const handleOnlineTagsChange = (val: string) => {
        if (!selectedOnlineDoc) return;
        const tags = val.split(',').map(t => t.trim()).filter(t => t !== '');
        setSelectedOnlineDoc({
           ...selectedOnlineDoc,
           tags,
           updatedAt: new Date().toISOString()
        });
     };

     const handleOnlineHeaderChange = (hIndex: number, val: string) => {
        if (!selectedOnlineDoc) return;
        const updatedHeaders = [...selectedOnlineDoc.headers];
        updatedHeaders[hIndex] = val;
        setSelectedOnlineDoc({
           ...selectedOnlineDoc,
           headers: updatedHeaders,
           updatedAt: new Date().toISOString()
        });
     };

     const handleOnlineCellChange = (rIndex: number, colKey: string, val: string) => {
        if (!selectedOnlineDoc) return;
        const updatedRows = selectedOnlineDoc.rows.map((r, idx) => {
           if (idx === rIndex) {
              return { ...r, [colKey]: val };
           }
           return r;
        });
        setSelectedOnlineDoc({
           ...selectedOnlineDoc,
           rows: updatedRows,
           updatedAt: new Date().toISOString()
        });
     };

     const saveOnlineEditedDoc = async () => {
       if (!selectedOnlineDoc) return;
       if (onlineView === 'cloud') {
          const updatedDocsList = cloudDocs.map(d => d.id === selectedOnlineDoc.id ? selectedOnlineDoc : d);
          setCloudDocs(updatedDocsList);
          const success = await syncWithGoogleCloud(updatedDocsList, false);
          if (success) {
             setIsOnlineEditing(false);
             showToast("⚡ Dokumenti u ruajt me sukses në Google Cloud!");
          }
       } else if (onlineView === 'gist') {
          let parsedGistDocs: GridDocument[] = [];
          try {
             const parsed = JSON.parse(gistViewerContent || '[]');
             if (Array.isArray(parsed)) parsedGistDocs = parsed;
          } catch(e){}
          
          const updatedGistDocs = parsedGistDocs.map(d => d.id === selectedOnlineDoc.id ? selectedOnlineDoc : d);
          setGistViewerContent(JSON.stringify(updatedGistDocs));
          
          try {
             await saveToGist(updatedGistDocs, false);
             setIsOnlineEditing(false);
             showToast("⚡ Dokumenti u ruajt me sukses në GitHub Gist!");
          } catch (err: any) {
             showToast("Dështoi ruajtja në Gist: " + err.message);
          }
       }
     };

     const handleOnlineDeleteDoc = async () => {
       if (!selectedOnlineDoc) return;
       if (!window.confirm("A jeni i sigurt që dëshironi të fshini këtë dokument online?")) return;
       
       if (onlineView === 'cloud') {
          try {
             const updatedDocsList = cloudDocs.filter(d => d.id !== selectedOnlineDoc.id);
             setCloudDocs(updatedDocsList);
             setSelectedOnlineDoc(null);
             await syncWithGoogleCloud(updatedDocsList, true);
             showToast("⚡ Dokumenti u fshi nga Google Cloud me sukses!");
          } catch (e) {
             showToast("Gabim gjatë fshirjes nga Cloud.");
          }
       } else if (onlineView === 'gist') {
          try {
             let parsedGistDocs: GridDocument[] = [];
             try {
                const parsed = JSON.parse(gistViewerContent || '[]');
                if (Array.isArray(parsed)) parsedGistDocs = parsed;
             } catch(e){}
             
             const updatedGistDocs = parsedGistDocs.filter(d => d.id !== selectedOnlineDoc.id);
             setGistViewerContent(JSON.stringify(updatedGistDocs));
             setSelectedOnlineDoc(null);
             
             await saveToGist(updatedGistDocs, false);
             showToast("⚡ Dokumenti u fshi nga GitHub Gist!");
          } catch (err: any) {
             showToast("Dështoi fshirja nga Gist: " + err.message);
          }
       }
     };

     const handleOnlineAiAutopilot = async () => {
        if (!selectedOnlineDoc) return;
        setIsOnlineAiThinking(true);
        showToast("🤖 Inteligjenca Artificiale (Gemini) po analizon dhe korrigjon shënimet...");
        try {
           const mail = (email || localStorage.getItem('grid_notepad_saved_email') || 'genti8319@gmail.com').trim();
           const docsForAi = [{
              ...selectedOnlineDoc,
              rows: selectedOnlineDoc.rows.map(r => {
                 const { image, ...rest } = r;
                 return rest;
              })
           }];
           
           const payload = JSON.stringify({ 
              prompt: "Autopilot Check: Kontrollo dhe auto-përditëso/korrigjo llogaritjet, plotëso kolonat totale/shuma të zbrazëta ose korrigjo drejtshkrimin nëse ka gabime të dukshme.", 
              documents: docsForAi, 
              activeDocId: selectedOnlineDoc.id, 
              image: null, 
              audio: null,
              blueText: '',
              secretList: [],
              userEmail: mail,
              geminiKey: userGeminiKey || localStorage.getItem('grid_notepad_gemini_key') || ''
           });
           
           const endpoints = getApiEndpoints('/api/ai/chat');
           let response: Response | null = null;
           for (const ep of endpoints) {
              try {
                 const res = await fetch(ep, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                 });
                 if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                    response = res;
                    break;
                 }
              } catch (e) {}
           }

           if (response) {
              const data = await response.json();
              if (data && data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
                 let applied = false;
                 data.actions.forEach((act: any) => {
                     if ((act.type === 'PROPOSE_COLUMNS_CHANGE' || act.type === 'UPDATE_DOCUMENT_ROWS') && act.documentId === selectedOnlineDoc.id && act.newRows) {
                         setSelectedOnlineDoc(prev => {
                             if (!prev) return null;
                             return {
                                 ...prev,
                                 headers: act.newHeaders || prev.headers,
                                 columnWidths: act.newColumnWidths || prev.columnWidths,
                                 rows: act.newRows,
                                 updatedAt: new Date().toISOString()
                             };
                         });
                         applied = true;
                     }
                 });
                 if (applied) {
                    showToast("✨ Agjenti Gemini korrigjoi llogaritjet dhe tekstet me sukses! Klikoni 'Ruaj' për t'i ruajtur në server.");
                 } else {
                    showToast("🤖 Gemini e analizoi dokumentin por nuk gjeti ndonjë gabim ose kolonë për të llogaritur.");
                 }
              } else {
                 showToast("🤖 Gemini e analizoi dokumentin dhe konfirmoi se të dhënat janë të sakta e të plota!");
              }
           } else {
              showToast("Gabim gjatë lidhjes me serverin AI.");
           }
        } catch (err: any) {
           showToast("Gabim nga Gemini AI: " + err.message);
        } finally {
           setIsOnlineAiThinking(false);
        }
     };

     return (
        <div className={`w-full max-w-[1200px] mx-auto flex flex-col sm:border sm:rounded-xl shadow-2xl font-sans relative overflow-hidden h-[100dvh] sm:min-h-[600px] sm:h-[90vh] ${baseBg} ${borderColor} ${textColor} z-10`}>
           {/* HEADER */}
           <div className={`flex border-b py-3 px-4 gap-4 items-center justify-between shadow-sm sticky top-0 ${toolbarBg} ${borderColor} z-20`}>
              <div className="flex items-center gap-3">
                 <button 
                    onClick={() => { setOnlineView(null); setSelectedOnlineDoc(null); setIsOnlineEditing(false); }}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border ${isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700"}`}
                 >
                    <ArrowLeft className="w-4 h-4" /> {t('Kthehu', 'Back')}
                 </button>
                 <div className="flex flex-col">
                    <span className="text-sm font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                       {isGist ? <Github className="w-4 h-4 text-zinc-900 dark:text-white" /> : <Cloud className="w-4 h-4 text-emerald-500" />}
                       {titleText}
                    </span>
                    <span className={`text-[10px] font-medium leading-tight ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                       {isGist 
                          ? `Gist Stream: ${gistId ? gistId.substring(0, 12) + '...' : 'Unassigned'}` 
                          : `Lidhur si: ${user?.email || 'genti8319@gmail.com'}`}
                    </span>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <button 
                    onClick={async () => {
                       if (isGist) {
                          await viewGistContent();
                       } else {
                          await fetchCloudDocsOnly(false);
                       }
                    }} 
                    className={`p-2 rounded-lg transition-colors border ${isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700"}`}
                    title="Rifresko të dhënat"
                 >
                    <RefreshCw className={`w-4 h-4 ${isFetchingCloud ? "animate-spin text-accent-500" : ""}`} />
                 </button>
              </div>
           </div>

           {/* SEGMENTED TAB SELECTOR */}
           <div className={`flex border-b px-4 py-2.5 gap-2 overflow-x-auto shrink-0 ${isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
              <button 
                 id="tab-btn-lists"
                 onClick={() => { setOnlineDashboardTab('lists'); setIsOnlineEditing(false); }}
                 className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 ${
                    onlineDashboardTab === 'lists' 
                       ? "bg-accent-500 text-white shadow-md shadow-accent-500/10" 
                       : (isDark ? "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800")
                 }`}
              >
                 <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                 Listat e Notebook ({docsList.length})
              </button>
              <button 
                 id="tab-btn-notes"
                 onClick={() => { setOnlineDashboardTab('notes'); setIsOnlineEditing(false); }}
                 className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 ${
                    onlineDashboardTab === 'notes' 
                       ? "bg-accent-500 text-white shadow-md shadow-accent-500/10" 
                       : (isDark ? "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800")
                 }`}
              >
                 <FileText className="w-4 h-4 text-blue-500" />
                 Shënimet me Tekst
              </button>
              <button 
                 id="tab-btn-secrets"
                 onClick={() => { setOnlineDashboardTab('secrets'); setIsOnlineEditing(false); }}
                 className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 ${
                    onlineDashboardTab === 'secrets' 
                       ? "bg-accent-500 text-white shadow-md shadow-accent-500/10" 
                       : (isDark ? "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800")
                 }`}
              >
                 <Lock className="w-4 h-4 text-emerald-500" />
                 Lista e Sekreteve ({onlineSecretList.length})
              </button>
           </div>

           {/* MAIN CONTAINER (SPLIT SCREEN OR ACTIVE TAB VIEW) */}
           <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">
              {onlineDashboardTab === 'lists' ? (
                 <React.Fragment>
              {/* LEFT SIDEBAR (ONLINE DOCUMENTS LIST) */}
              <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r flex flex-col shrink-0 overflow-hidden ${isDark ? "border-zinc-800 bg-zinc-950/20" : "border-zinc-200 bg-zinc-50/40"}`}>
                 {/* Search Box */}
                 <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="relative">
                       <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                       <input 
                          type="text"
                          value={onlineSearch}
                          onChange={(e) => setOnlineSearch(e.target.value)}
                          placeholder="Kërko dokument online..."
                          className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-accent-500 transition-colors ${
                             isDark ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600" : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400"
                          }`}
                       />
                    </div>
                 </div>

                 {/* Documents List */}
                 <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredOnline.length === 0 ? (
                       <div className="text-center py-10 text-xs text-zinc-500 font-medium">
                          Nuk u gjet asnjë dokument online.
                       </div>
                    ) : (
                       filteredOnline.map(d => {
                          const isSelected = selectedOnlineDoc?.id === d.id;
                          return (
                             <button
                                key={d.id}
                                onClick={() => {
                                   setSelectedOnlineDoc(d);
                                   setIsOnlineEditing(false);
                                }}
                                className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                                   isSelected 
                                      ? (isDark ? "bg-accent-600/10 border-accent-500/50" : "bg-accent-50 border-accent-300")
                                      : (isDark ? "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80" : "bg-white border-zinc-200 hover:bg-zinc-50")
                                }`}
                             >
                                <h4 className="font-bold text-xs sm:text-sm line-clamp-1">{d.title || "I paemërtuar"}</h4>
                                <div className="text-[10px] mt-1.5 flex items-center justify-between text-zinc-500">
                                   <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {safeFormatDate(d.createdAt, 'dd MMM yyyy')}
                                   </span>
                                   <span>{d.rows?.length || 0} rreshta</span>
                                </div>
                                {d.tags && d.tags.length > 0 && (
                                   <div className="flex flex-wrap gap-1 mt-1.5">
                                      {d.tags.map(t => (
                                         <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                            #{t}
                                         </span>
                                      ))}
                                   </div>
                                )}
                             </button>
                          );
                       })
                    )}
                 </div>
              </div>

              {/* RIGHT PANEL (RICH PREVIEW & MANAGEMENT) */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
                 {!selectedOnlineDoc ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                       <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center mb-4">
                          {isGist ? <Github className="w-8 h-8 text-zinc-400" /> : <Cloud className="w-8 h-8 text-emerald-500" />}
                       </div>
                       <h3 className="font-bold text-base mb-1">{t('Zgjidhni një Dokument', 'Select a Document')}</h3>
                       <p className="text-xs text-zinc-500 max-w-sm">
                          {t('Zgjidhni një dokument nga lista në të majtë për të parë përmbajtjen online, për ta redaktuar ose sinkronizuar.', 'Select a document from the list on the left to see online content, edit, or sync.')}
                       </p>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                       {/* DOC PREVIEW HEADER & INFO */}
                       <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 shrink-0">
                          {isOnlineEditing ? (
                             <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-1">
                                   <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Titulli i Shënimit:</label>
                                   <input 
                                      type="text"
                                      value={selectedOnlineDoc.title}
                                      onChange={(e) => handleOnlineTitleChange(e.target.value)}
                                      className={`px-3 py-1.5 text-sm font-bold rounded border outline-none focus:border-accent-500 ${
                                         isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                                      }`}
                                   />
                                </div>
                                <div className="flex flex-col gap-1">
                                   <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Etiketat (të ndara me presje):</label>
                                   <input 
                                      type="text"
                                      value={(selectedOnlineDoc.tags || []).join(', ')}
                                      onChange={(e) => handleOnlineTagsChange(e.target.value)}
                                      className={`px-3 py-1.5 text-xs font-semibold rounded border outline-none focus:border-accent-500 ${
                                         isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                                      }`}
                                      placeholder="Psh. pune, sekrete"
                                   />
                                </div>
                             </div>
                          ) : (
                             <div>
                                <h2 className="text-lg font-bold">{selectedOnlineDoc.title || "I paemërtuar"}</h2>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                                   <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {safeFormatDate(selectedOnlineDoc.createdAt, 'dd MMM yyyy HH:mm')}</span>
                                   <span>•</span>
                                   <span>{selectedOnlineDoc.rows?.length || 0} rreshta</span>
                                </div>
                                {selectedOnlineDoc.tags && selectedOnlineDoc.tags.length > 0 && (
                                   <div className="flex flex-wrap gap-1 mt-2">
                                      {selectedOnlineDoc.tags.map(t => (
                                         <span key={t} className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                            #{t}
                                         </span>
                                      ))}
                                   </div>
                                )}
                             </div>
                          )}
                       </div>

                       {/* REQUIRED MANAGEMENT TOOLBAR: Save, Edittext, restoreall, delete, AI */}
                       <div className={`px-4 py-2.5 border-b flex flex-wrap gap-2 items-center justify-between shrink-0 ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                          <div className="flex flex-wrap gap-1.5">
                             {/* EDIT TEXT / MODE */}
                             <button
                                onClick={() => setIsOnlineEditing(!isOnlineEditing)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                   isOnlineEditing
                                      ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20 animate-pulse"
                                      : (isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200" : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700")
                                }`}
                             >
                                <Edit className="w-3.5 h-3.5" /> {t('Edittext', 'Edittext')}
                             </button>

                             {/* SAVE BUTTON */}
                             <button
                                onClick={saveOnlineEditedDoc}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                   isDark ? "bg-green-600 hover:bg-green-500 text-white border-transparent" : "bg-green-500 hover:bg-green-600 text-white border-transparent"
                                }`}
                             >
                                <Save className="w-3.5 h-3.5" /> {t('Save', 'Save')}
                             </button>

                             {/* RESTORE ALL */}
                             <button
                                onClick={async () => {
                                   if (isGist) {
                                      await loadFromGist();
                                   } else {
                                      await handleFullCloudRestore();
                                   }
                                }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                   isDark ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white border-transparent"
                                }`}
                             >
                                <Download className="w-3.5 h-3.5" /> {t('restoreall', 'restoreall')}
                             </button>

                             {/* DELETE */}
                             <button
                                onClick={handleOnlineDeleteDoc}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                   isDark ? "bg-red-600/10 hover:bg-red-600/20 text-red-500 border-red-500/20" : "bg-red-50 hover:bg-red-100 text-red-500 border-red-200"
                                }`}
                             >
                                <Trash2 className="w-3.5 h-3.5" /> {t('delete', 'delete')}
                             </button>
                          </div>

                          {/* AI GEMINI */}
                          <button
                             onClick={handleOnlineAiAutopilot}
                             disabled={isOnlineAiThinking}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                isDark ? "bg-purple-600 hover:bg-purple-500 text-white border-transparent shadow-lg shadow-purple-600/20" : "bg-purple-500 hover:bg-purple-600 text-white border-transparent shadow-lg shadow-purple-500/20"
                             } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                             {isOnlineAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                             {t('AI', 'AI')}
                          </button>
                       </div>

                       {/* RICH PREVIEW */}
                       <div className="flex-1 overflow-auto p-4">
                          <div className={`border rounded-xl overflow-hidden ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                             {/* GRID HEADERS */}
                             <div className={`flex border-b min-h-[34px] items-center shrink-0 ${isDark ? "bg-zinc-900/80 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"}`}>
                                <div className="w-12 shrink-0 border-r border-zinc-800/20 dark:border-zinc-200/10 flex items-center justify-center text-[10px] font-bold font-mono">
                                   NR
                                </div>
                                {selectedOnlineDoc.headers?.map((h, hIdx) => (
                                   <div key={hIdx} className="flex-1 border-r border-zinc-800/20 dark:border-zinc-200/10 p-1.5 text-center text-xs font-bold">
                                      {isOnlineEditing ? (
                                         <input 
                                            type="text"
                                            value={h}
                                            onChange={(e) => handleOnlineHeaderChange(hIdx, e.target.value)}
                                            className={`w-full text-center text-xs bg-transparent focus:outline-none focus:text-accent-500 transition-colors border-b border-transparent focus:border-accent-500/30 ${
                                               isDark ? "text-white" : "text-zinc-900"
                                            }`}
                                         />
                                      ) : (
                                         <span>{h}</span>
                                      )}
                                   </div>
                                ))}
                             </div>

                             {/* GRID BODY */}
                             <div className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                                {selectedOnlineDoc.rows?.map((r, rIdx) => (
                                   <div 
                                      key={r.id || rIdx} 
                                      className={`flex min-h-[28px] items-center transition-colors ${
                                         r.status === 'ok' ? (isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100')
                                         : r.status === 'blue' ? (isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100')
                                         : r.status === 'x' ? (isDark ? 'bg-red-500/10 border-red-500/20 line-through' : 'bg-red-50 border-red-100 line-through')
                                         : isDark ? "border-zinc-800/40 focus-within:bg-zinc-900/40" : "border-zinc-200/40 focus-within:bg-zinc-50"
                                      }`}
                                   >
                                      {/* Row number column */}
                                      <div className={`w-12 shrink-0 border-r flex items-center justify-center text-xs font-mono font-bold py-1 ${
                                         isDark ? "bg-zinc-900/40 border-zinc-800/40 text-zinc-500" : "bg-zinc-100/60 border-zinc-200/40 text-zinc-500"
                                      }`}>
                                         {rIdx + 1}
                                      </div>

                                      {/* Row cells */}
                                      {selectedOnlineDoc.headers?.map((_, hIdx) => {
                                         const colKey = `col${hIdx+1}`;
                                         const cellVal = r[colKey] || '';
                                         return (
                                            <div key={hIdx} className="flex-1 border-r border-zinc-200/20 dark:border-zinc-800/20 p-1">
                                               {isOnlineEditing ? (
                                                  <input 
                                                     type="text"
                                                     value={cellVal}
                                                     onChange={(e) => handleOnlineCellChange(rIdx, colKey, e.target.value)}
                                                     className={`w-full bg-transparent px-1 py-0.5 text-xs outline-none focus:bg-zinc-500/5 focus:border-accent-500/30 border border-transparent rounded ${
                                                        isDark ? "text-zinc-200" : "text-zinc-800"
                                                     }`}
                                                  />
                                               ) : (
                                                  <span className={`text-xs px-1 block break-all whitespace-pre-wrap leading-tight ${
                                                     r.status === 'x' ? "line-through text-red-500/70" 
                                                     : r.status === 'blue' ? "text-blue-500 font-semibold"
                                                     : r.status === 'ok' ? "text-green-600 font-semibold"
                                                     : isDark ? "text-zinc-300" : "text-zinc-800"
                                                  }`}>
                                                     {cellVal}
                                                  </span>
                                               )}
                                            </div>
                                         );
                                      })}
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </React.Fragment>
              ) : onlineDashboardTab === 'notes' ? (
                 <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
                    {/* HEADER & INFO */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-1 shrink-0">
                       <h2 className="text-lg font-bold flex items-center gap-2">
                          <FileText className="w-5 h-5 text-accent-500" />
                          Shënimet me Tekst (Fletore / Notebook)
                       </h2>
                       <p className="text-xs text-zinc-500">
                          Këtu mund të shikoni ose redaktoni shënimet tuaja të përgjithshme që sinkronizohen në Cloud dhe Gist.
                       </p>
                    </div>

                    {/* TOOLBAR */}
                    <div className={`px-4 py-2.5 border-b flex flex-wrap gap-2 items-center justify-between shrink-0 ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                       <div className="flex flex-wrap gap-1.5">
                          {/* EDIT TEXT */}
                          <button
                             onClick={() => setIsOnlineEditing(!isOnlineEditing)}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                isOnlineEditing
                                   ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20 animate-pulse"
                                   : (isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200" : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700")
                             }`}
                          >
                             <Edit className="w-3.5 h-3.5" /> {isOnlineEditing ? "Shiko (View Mode)" : "Ndrysho (Edittext)"}
                          </button>

                          {/* SAVE BUTTON */}
                          <button
                             onClick={async () => {
                                if (onlineView === 'cloud') {
                                   const success = await syncWithGoogleCloud(cloudDocs, false, onlineBlueText, onlineSecretList);
                                   if (success) {
                                      setIsOnlineEditing(false);
                                      showToast("⚡ Shënimet u ruajtën me sukses në Google Cloud!");
                                    }
                                } else if (onlineView === 'gist') {
                                   try {
                                      let parsedGistDocs: GridDocument[] = [];
                                      try {
                                         const parsed = JSON.parse(gistViewerContent || '[]');
                                         if (Array.isArray(parsed)) {
                                            parsedGistDocs = parsed;
                                         } else if (parsed && typeof parsed === 'object') {
                                            parsedGistDocs = parsed.documents || [];
                                         }
                                      } catch(e){}

                                      await saveToGist(parsedGistDocs, false, onlineBlueText, onlineSecretList);
                                      setIsOnlineEditing(false);
                                      showToast("⚡ Shënimet u ruajtën me sukses në GitHub Gist!");
                                   } catch (err: any) {
                                      showToast("Dështoi ruajtja në Gist: " + err.message);
                                   }
                                }
                             }}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                isDark ? "bg-green-600 hover:bg-green-500 text-white border-transparent" : "bg-green-500 hover:bg-green-600 text-white border-transparent"
                             }`}
                          >
                             <Save className="w-3.5 h-3.5" /> {t('Ruaj', 'Save')}
                          </button>

                          {/* RESTORE / IMPORT TO LOCAL NOTEBOOK */}
                          <button
                             onClick={() => {
                                if (!onlineBlueText.trim()) {
                                   showToast("Nuk ka shënime online për t'u rikthyer në notebook.");
                                   return;
                                }
                                setBlueText(onlineBlueText);
                                localStorage.setItem('grid_notepad_blue', onlineBlueText);
                                showToast("⚡ Shënimet u rikthyen me sukses në Notebook-un tuaj lokal!");
                             }}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                isDark ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white border-transparent"
                             }`}
                             title="Rikthe këto shënime në notebook-un lokal"
                          >
                             <Download className="w-3.5 h-3.5" /> Rikthe në Notebook-un Lokal
                          </button>
                       </div>
                    </div>

                    {/* NOTES WRITING ENGINE PREVIEW */}
                    <div className="flex-1 overflow-auto p-4 flex flex-col">
                       {isOnlineEditing ? (
                          <textarea
                             value={onlineBlueText}
                             onChange={(e) => setOnlineBlueText(e.target.value)}
                             placeholder="Shkruani shënimet tuaja këtu..."
                             className={`w-full flex-1 p-4 rounded-xl border focus:outline-none focus:border-accent-500 font-sans text-sm resize-none ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400"
                             }`}
                          />
                       ) : (
                          <div className={`p-4 rounded-xl border flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed ${
                             isDark ? "bg-zinc-900/40 border-zinc-800/60 text-zinc-200" : "bg-zinc-50/40 border-zinc-200/60 text-zinc-800"
                          }`}>
                             {onlineBlueText.trim() ? onlineBlueText : <span className="italic text-zinc-400">Nuk ka asnjë shënim të shkruar. Kliko 'Ndrysho' për të shkruar shënime të reja.</span>}
                          </div>
                       )}
                    </div>
                 </div>
              ) : (
                 <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
                    {/* HEADER & INFO */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-1 shrink-0">
                       <h2 className="text-lg font-bold flex items-center gap-2">
                          <Lock className="w-5 h-5 text-accent-500" />
                          Lista e Sekreteve (Secrets Checklist)
                       </h2>
                       <p className="text-xs text-zinc-500">
                          Menaxhoni dhe shikoni detyrat apo listat sekrete të sinkronizuara në mënyrë të sigurt.
                       </p>
                    </div>

                    {/* TOOLBAR */}
                    <div className={`px-4 py-2.5 border-b flex flex-wrap gap-2 items-center justify-between shrink-0 ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                       <div className="flex flex-wrap gap-1.5">
                          {/* EDIT MODE */}
                          <button
                             onClick={() => setIsOnlineEditing(!isOnlineEditing)}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                isOnlineEditing
                                   ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20 animate-pulse"
                                   : (isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200" : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700")
                             }`}
                          >
                             <Edit className="w-3.5 h-3.5" /> {isOnlineEditing ? "Shiko (View Mode)" : "Ndrysho (Edittext)"}
                          </button>

                          {/* SAVE BUTTON */}
                          <button
                             onClick={async () => {
                                if (onlineView === 'cloud') {
                                   const success = await syncWithGoogleCloud(cloudDocs, false, onlineBlueText, onlineSecretList);
                                   if (success) {
                                      setIsOnlineEditing(false);
                                      showToast("⚡ Lista e sekreteve u ruajt me sukses në Google Cloud!");
                                   }
                                } else if (onlineView === 'gist') {
                                   try {
                                      let parsedGistDocs: GridDocument[] = [];
                                      try {
                                         const parsed = JSON.parse(gistViewerContent || '[]');
                                         if (Array.isArray(parsed)) {
                                            parsedGistDocs = parsed;
                                         } else if (parsed && typeof parsed === 'object') {
                                            parsedGistDocs = parsed.documents || [];
                                         }
                                      } catch(e){}

                                      await saveToGist(parsedGistDocs, false, onlineBlueText, onlineSecretList);
                                      setIsOnlineEditing(false);
                                      showToast("⚡ Lista e sekreteve u ruajt me sukses në GitHub Gist!");
                                   } catch (err: any) {
                                      showToast("Dështoi ruajtja në Gist: " + err.message);
                                   }
                                }
                             }}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                isDark ? "bg-green-600 hover:bg-green-500 text-white border-transparent" : "bg-green-500 hover:bg-green-600 text-white border-transparent"
                             }`}
                          >
                             <Save className="w-3.5 h-3.5" /> {t('Ruaj', 'Save')}
                          </button>

                          {/* RESTORE / IMPORT TO LOCAL */}
                          <button
                             onClick={() => {
                                if (onlineSecretList.length === 0) {
                                   showToast("Nuk ka sekrete online për t'u rikthyer.");
                                   return;
                                }
                                setSecretList(onlineSecretList);
                                localStorage.setItem('grid_notepad_secret_list', JSON.stringify(onlineSecretList));
                                showToast("⚡ Lista e sekreteve u rikthye me sukses në aplikacionin tuaj lokal!");
                             }}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border active:scale-95 ${
                                isDark ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white border-transparent"
                             }`}
                             title="Rikthe këtë listë sekretesh lokalisht"
                          >
                             <Download className="w-3.5 h-3.5" /> Rikthe në Sekretet Lokale
                          </button>
                       </div>

                       {/* ADD SECRET BUTTON IN EDIT MODE */}
                       {isOnlineEditing && (
                          <button
                             onClick={() => {
                                const newItem = { id: Date.now().toString(), text: '', done: false };
                                setOnlineSecretList([...onlineSecretList, newItem]);
                             }}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border ${
                                isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white" : "bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-800"
                             }`}
                          >
                             <Plus className="w-4 h-4" /> Shto Element Sekret
                          </button>
                       )}
                    </div>

                    {/* CHECKLIST VIEW & EDITOR */}
                    <div className="flex-1 overflow-auto p-4">
                       {onlineSecretList.length === 0 ? (
                          <div className="text-center py-10 text-xs text-zinc-500 italic">
                             Nuk ka asnjë element në listën sekrete.
                          </div>
                       ) : (
                          <div className="space-y-2.5 max-w-2xl mx-auto">
                             {onlineSecretList.map((item, idx) => (
                                <div 
                                   key={item.id || idx} 
                                   className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                      item.done 
                                         ? (isDark ? "bg-zinc-900/40 border-zinc-800/55 opacity-70" : "bg-zinc-50 border-zinc-100 opacity-70")
                                         : (isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-zinc-200")
                                   }`}
                                >
                                   {/* CHECKBOX */}
                                   <button
                                      disabled={isOnlineEditing}
                                      onClick={() => {
                                         setOnlineSecretList(prev => prev.map((itm, i) => i === idx ? { ...itm, done: !itm.done } : itm));
                                      }}
                                      className={`p-1 rounded transition-colors ${isOnlineEditing ? "cursor-not-allowed opacity-50" : "hover:bg-zinc-500/10"}`}
                                   >
                                      {item.done ? (
                                         <CheckCheck className="w-5 h-5 text-green-500" />
                                      ) : (
                                         <Square className="w-5 h-5 text-zinc-400" />
                                      )}
                                   </button>

                                   {/* TEXT INPUT / VIEW */}
                                   <div className="flex-1">
                                      {isOnlineEditing ? (
                                         <input
                                            type="text"
                                            value={item.text}
                                            onChange={(e) => {
                                               const val = e.target.value;
                                               setOnlineSecretList(prev => prev.map((itm, i) => i === idx ? { ...itm, text: val } : itm));
                                            }}
                                            className={`w-full bg-transparent text-sm py-0.5 px-1 focus:outline-none border-b border-transparent focus:border-accent-500/30 font-semibold ${
                                               isDark ? "text-white" : "text-zinc-900"
                                            }`}
                                            placeholder="Shkruani elementin sekret..."
                                         />
                                      ) : (
                                         <span className={`text-sm font-semibold transition-all ${
                                            item.done 
                                               ? "line-through text-zinc-400 dark:text-zinc-500 font-normal" 
                                               : (isDark ? "text-zinc-100" : "text-zinc-800")
                                         }`}>
                                            {item.text || <span className="italic text-zinc-400">Element pa tekst</span>}
                                         </span>
                                      )}
                                   </div>

                                   {/* DELETE BUTTON (IN EDIT MODE) */}
                                   {isOnlineEditing && (
                                      <button
                                         onClick={() => {
                                            setOnlineSecretList(prev => prev.filter((_, i) => i !== idx));
                                         }}
                                         className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors"
                                      >
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   )}
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              )}
           </div>
        </div>
     );
  };

  const renderSecureLogoutModal = () => {
    if (!secureLogoutModal.isOpen) return null;
    return (
       <div className="fixed inset-0 z-[300] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
         <div className={`max-w-md w-full p-6 rounded-2xl shadow-2xl border flex flex-col items-center ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
             <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                 <Lock className="w-6 h-6 text-red-500" />
             </div>
             <h3 className="text-lg font-extrabold mb-1.5 text-center">{t('Konfirmo Shkyçjen e Sigurt', 'Confirm Security Logout')}</h3>
             <p className={`text-xs text-center mb-6 leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                {t(
                  'Vëmendje! Po shkyçni llogarinë tuaj dhe po ndërpritni sinkronizimin në kohe reale. Për sigurinë e shënimeve tuaja, shkruani PIN-in tuaj aktual.',
                  'Attention! You are logging out and disconnecting real-time sync. For the security of your notes, please enter your PIN.'
                )}
             </p>
             <input 
                type="password"
                value={secureLogoutPasswordInput}
                onChange={e => setSecureLogoutPasswordInput(e.target.value)}
                className={`w-full text-center text-2xl tracking-[0.3em] font-black py-3 px-4 rounded-xl mb-4 border outline-none transition-colors shadow-inner ${
                   isDark ? "bg-zinc-950 border-zinc-700 text-white focus:border-red-500" : "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500"
                }`}
                autoFocus
                placeholder="****"
             />
             <div className="flex gap-2.5 w-full">
                <button 
                   onClick={() => {
                      setSecureLogoutModal({ isOpen: false, target: null, onSuccess: null });
                      setSecureLogoutPasswordInput('');
                   }} 
                   className={`flex-1 py-2.5 rounded-lg font-bold text-xs border ${
                      isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"
                   }`}
                >
                   {t('Anulo', 'Cancel')}
                </button>
                <button 
                   onClick={async () => {
                      const savedPin = localStorage.getItem('grid_notepad_pin') || '';
                      if (secureLogoutPasswordInput === savedPin) {
                         const target = secureLogoutModal.target;
                         const successCallback = secureLogoutModal.onSuccess;
                         
                         setSecureLogoutModal({ isOpen: false, target: null, onSuccess: null });
                         setSecureLogoutPasswordInput('');
                         
                         if (successCallback) {
                            await successCallback();
                         }
                         
                         // Show success info notification modal with complete details
                         setLogoutInfoModal({
                            isOpen: true,
                            title: target === 'cloud' ? "Dritare Informuese: Cloud u shkyç me sukses" : "Dritare Informuese: Gist u shkyç me sukses",
                            message: target === 'cloud' 
                              ? "Lidhja me Platformën Cloud Google u ndërpre në mënyrë të sigurt. Memory ruajtëse lokale në pajisje mbetet aktive, ndërsa sinkronizimi online në kohë reale është çaktivizuar sipas rregullores së sigurisë. Të dhënat tuaja ekzistuese online mbeten të mbrojtura në server."
                              : "Lidhja me GitHub Gist Stream u ndërpre në mënyrë të sigurt. Për të riaktivizuar sinkronizimin, duhet të vendosni përsëri çelësin tuaj të autorizimit."
                         });
                      } else {
                         alert(t('Password i gabuar!', 'Incorrect password!'));
                      }
                   }} 
                   className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-xs"
                >
                   {t('Po, Shkyç', 'Yes, Logout')}
                </button>
             </div>
         </div>
       </div>
    );
  };

  const renderLogoutInfoModal = () => {
     if (!logoutInfoModal || !logoutInfoModal.isOpen) return null;
     return (
        <div className="fixed inset-0 z-[310] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
           <div className={`max-w-md w-full p-6 rounded-2xl shadow-2xl border flex flex-col ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"}`}>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-500/10 mb-4">
                 <h4 className="text-sm font-extrabold flex items-center gap-2 text-emerald-500">
                    <Check className="w-5 h-5" /> {logoutInfoModal.title}
                 </h4>
                 <button onClick={() => setLogoutInfoModal(null)} className="p-1 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                 </button>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 mb-5 whitespace-pre-line">
                 {logoutInfoModal.message}
              </p>
              <button 
                 onClick={() => setLogoutInfoModal(null)} 
                 className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-xs"
              >
                 Mbyll Njoftimin
              </button>
           </div>
        </div>
     );
  };

  const renderSharedModals = () => (
    <>
      {renderSecureLogoutModal()}
      {renderLogoutInfoModal()}
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

                {/* Sub-toolbar inside Secrets Modal */}
                <div className={`p-3 border-b flex flex-wrap gap-1.5 justify-start items-center shrink-0 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                   <button 
                      onClick={() => setSecretActiveTab('editor')} 
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border flex items-center gap-1 ${
                         secretActiveTab === 'editor' 
                         ? (isDark ? "bg-blue-600 border-transparent text-white" : "bg-blue-500 border-transparent text-white") 
                         : (isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200")
                      }`}
                   >
                      <FileText className="w-3.5 h-3.5 text-current" /> Editor
                   </button>

                   <button 
                       onClick={() => setSecretActiveTab('list')} 
                       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border flex items-center gap-1 ${
                          secretActiveTab === 'list' 
                          ? (isDark ? "bg-blue-600 border-transparent text-white" : "bg-blue-500 border-transparent text-white") 
                          : (isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200")
                       }`}
                    >
                       <CheckCheck className="w-3.5 h-3.5 text-current" /> Listë
                    </button>

                    <div className="h-4 w-px bg-zinc-500/30 mx-1" />

                    <button 
                       onClick={secretActiveTab === 'list' ? handleCreateSecretListItem : handleCreateSecretEditorNote} 
                       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${
                          isDark ? "bg-green-600 hover:bg-green-500 text-white border-transparent" : "bg-green-500 hover:bg-green-600 text-white border-transparent"
                       }`}
                       title="Krijo element/shënim të ri"
                    >
                       <Plus className="w-3.5 h-3.5" /> Krijo
                    </button>

                    <button 
                       onClick={handleSelectAllSecrets} 
                       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${
                          isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200"
                       } ${secretActiveTab !== 'list' ? 'opacity-40 cursor-not-allowed' : ''}`}
                       title="Zgjidh të gjitha / Çpërzgjidh"
                       disabled={secretActiveTab !== 'list'}
                    >
                       <Square className="w-3.5 h-3.5" /> Zgjidh All
                    </button>

                    <button 
                       onClick={handleSaveSecrets} 
                       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${
                          isDark ? "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent" : "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                       }`}
                       title="Ruaj"
                    >
                       <Save className="w-3.5 h-3.5" /> Ruaj
                    </button>

                    <button 
                       onClick={handleDeleteSecrets} 
                       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${
                          isDark ? "bg-red-600 hover:bg-red-500 text-white border-transparent" : "bg-red-500 hover:bg-red-600 text-white border-transparent"
                       }`}
                       title="Fshij elementet e përzgjedhur apo pastro editorin"
                    >
                       <Trash2 className="w-3.5 h-3.5" /> Fshij
                    </button>

                    <button 
                       onClick={handleImportSecretsClick} 
                       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${
                          isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200"
                       }`}
                       title="Importo të dhëna"
                    >
                       <FolderUp className="w-3.5 h-3.5" /> Import
                    </button>

                    <button 
                       onClick={handleExportSecrets} 
                       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${
                          isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200"
                       }`}
                       title="Eksporto të dhëna"
                    >
                       <FolderDown className="w-3.5 h-3.5" /> Export
                    </button>

                    <input 
                       type="file" 
                       ref={secretFileInputRef} 
                       onChange={handleImportSecretsFile} 
                       accept=".json,.txt" 
                       className="hidden" 
                    />
                 </div>
                 
                 <div className={`flex-1 p-5 overflow-y-auto ${isDark ? "bg-zinc-950" : "bg-blue-50/30"}`}>

                    <div className="flex flex-col h-full gap-4">
                       {secretActiveTab === 'list' ? (
                          /* Lista e Sekreteve */
                          <div className={`flex-1 rounded-xl p-3 flex flex-col min-h-[300px] ${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"}`}>
                             <div className="flex items-center justify-between mb-3 border-b pb-2">
                                <h4 className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>Lista e Sekreteve</h4>
                                <span className="text-xs text-zinc-500 font-mono">Total: {secretList.length}</span>
                             </div>
                             <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-2">
                                {secretList.length === 0 && (
                                   <p className={`text-xs text-center mt-10 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Nuk ka asnjë element në listë. Kliko "Krijo" më sipër për të shtuar.</p>
                                )}
                                {secretList.map((item, idx) => (
                                   <div key={item.id} className={`flex items-start gap-3 group border-b pb-2 pt-1 transition-colors ${isDark ? "border-zinc-800/60 hover:bg-zinc-800/20" : "border-zinc-100 hover:bg-blue-50/10"}`}>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                           const updated = [...secretList];
                                           updated[idx].done = !updated[idx].done;
                                           setSecretList(updated);
                                           localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                        }}
                                        className={`mt-1.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                          item.done 
                                           ? "bg-blue-500 border-blue-500 text-white scale-110 shadow-sm" 
                                           : (isDark ? "border-zinc-700 text-transparent hover:border-blue-500" : "border-zinc-300 text-transparent hover:border-blue-500")
                                        }`}
                                      >
                                         <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>
                                      
                                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                                         <input
                                           type="text"
                                           value={item.text}
                                           onChange={(e) => {
                                              const updated = [...secretList];
                                              updated[idx].text = e.target.value;
                                              setSecretList(updated);
                                              localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                           }}
                                           placeholder="Emri i sekretit..."
                                           className={`w-full bg-transparent border-none outline-none text-sm font-bold p-0 placeholder-zinc-500 ${
                                              item.done 
                                              ? (isDark ? "text-zinc-500 line-through font-normal" : "text-zinc-400 line-through font-normal") 
                                              : (isDark ? "text-zinc-100" : "text-zinc-800")
                                           }`}
                                         />
                                         <input
                                           type="text"
                                           value={item.note || ''}
                                           onChange={(e) => {
                                              const updated = [...secretList];
                                              updated[idx].note = e.target.value;
                                              setSecretList(updated);
                                              localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                           }}
                                           placeholder="Shto shënim përkatës për këtë sekret..."
                                           className={`w-full bg-transparent border-none outline-none text-xs p-0 placeholder-zinc-500/60 ${
                                              item.done 
                                              ? (isDark ? "text-zinc-600 line-through" : "text-zinc-400 line-through") 
                                              : (isDark ? "text-zinc-400" : "text-zinc-500")
                                           }`}
                                         />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                           const updated = secretList.filter(i => i.id !== item.id);
                                           setSecretList(updated);
                                           localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                        }}
                                        className="mt-1 opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all shrink-0"
                                        title="Fshi këtë sekret"
                                      >
                                         <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                   </div>
                                ))}
                             </div>
                          </div>
                      ) : (
                          /* Hartim Text (Text Drafting) */
                         <div className={`flex-1 rounded-xl p-3 flex flex-col min-h-[300px] ${isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"}`}>
                            <div className="flex items-center justify-between mb-2 border-b pb-2">
                               <h4 className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>Hartim Tekst</h4>
                               <span className="text-xs text-zinc-500 font-mono">Gjatësia: {blueText.length}</span>
                            </div>
                            <textarea
                               autoFocus
                               value={blueText}
                               onChange={(e) => {
                                   const val = e.target.value;
                                   setBlueText(val);
                                   localStorage.setItem('grid_notepad_blue', val);
                               }}
                               placeholder="Këtu mund të mbani shënime të rëndësishme ose sekrete të mbrojtura me Password..."
                               className={`w-full h-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed scrollbar-hide min-h-[250px] ${
                                 isDark ? "text-zinc-200 placeholder-zinc-700" : "text-zinc-800 placeholder-zinc-400"
                               }`}
                               spellCheck={false}
                            />
                         </div>
                      )}
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
                   {user ? (
                      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isDark ? "bg-emerald-950/30 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
                         <div className="flex items-start gap-3">
                            <span className="relative flex h-3 w-3 mt-1 shrink-0">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <div>
                               <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                  Statusi: I Lidhur me Google Cloud
                               </p>
                               <p className="text-xs text-zinc-300 opacity-90 mt-0.5">
                                  Lidhur me llogarinë: <span className="font-bold text-white">{user.email || user.uid}</span>. Të gjitha fletët dhe shënimet ruhen automatikisht në cloud!
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
                   ) : (
                      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isDark ? "bg-amber-950/30 border-amber-500/30" : "bg-amber-50 border-amber-200"}`}>
                         <div className="flex items-start gap-3">
                            <span className="relative flex h-3 w-3 mt-1 shrink-0">
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 animate-pulse"></span>
                            </span>
                            <div>
                               <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                                  Statusi: Offline / Pa Lidhur
                               </p>
                               <p className="text-xs text-zinc-400 mt-0.5">
                                  Krijoni një llogari ose kyçuni më poshtë për të aktivizuar sinkronizimin automatik në re dhe për të ruajtur të dhënat tuaja sigurt online!
                               </p>
                            </div>
                         </div>

                         {/* Unified Single Master Button */}
                         <button
                            type="button"
                            onClick={handleUnifiedCloudSync}
                            className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2"
                         >
                            <LogIn className="w-4 h-4" /> 🔑 Kyçu për të Sinkronizuar
                         </button>
                      </div>
                   )}

                   {/* Google Account Connection Input */}
                   <div className={`p-4 rounded-xl border space-y-3 ${isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                         <User className="w-4 h-4" /> {t('Llogaria juaj në Cloud', 'Your Cloud Account')}
                      </label>
                      {user ? (
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
                            <div className="flex items-center gap-2.5">
                               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                               <div>
                                  <p className="text-xs text-zinc-400 font-medium">{t('Lidhur me sukses', 'Connected successfully')}</p>
                                  <p className="text-sm font-bold text-zinc-100">{user.email || user.uid}</p>
                                </div>
                            </div>
                            <button
                               type="button"
                               onClick={() => {
                                  handleSecureLogoutRequest('cloud', async () => {
                                     await hookLogout();
                                  });
                               }}
                               className="px-3.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold text-xs rounded-lg border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
                            >
                               Çkyçu (Sign Out)
                            </button>
                         </div>
                      ) : (
                         <div className="space-y-4 text-left">
                            {authError && (
                               <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 text-left space-y-3">
                                  <div className="flex items-start gap-2.5">
                                     <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                     <div className="flex-1">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-400">
                                           {t('GABIM GJATË AUTENTIKIMIT', 'AUTHENTICATION ERROR')}
                                        </h4>
                                        <p className="text-[11px] font-mono text-zinc-400 mt-1 break-all bg-black/25 p-2 rounded border border-zinc-800/40">
                                           Code: {authError.code}<br/>
                                           {authError.message}
                                        </p>
                                     </div>
                                  </div>

                                  {/* Actionable Solution Steps */}
                                  <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-2 text-zinc-300">
                                     <p className="font-bold text-amber-400 flex items-center gap-1.5">
                                        🔧 {t('Si ta rregulloni këtë problem:', 'How to resolve this issue:')}
                                     </p>
                                     
                                     {authError.code === 'auth/operation-not-allowed' && authError.provider === 'email' && (
                                        <div className="space-y-1.5">
                                           <p className="font-medium text-zinc-200">
                                              {t('Lidhja me Email/Password nuk është e aktivizuar në Firebase për projektin tuaj.', 'Email/Password authentication is not enabled in your Firebase project.')}
                                           </p>
                                           <ol className="list-decimal pl-4.5 space-y-1 text-[11px] text-zinc-400">
                                              <li>{t('Hapni Firebase Console duke përdorur butonin më poshtë.', 'Open the Firebase Console using the button below.')}</li>
                                              <li>{t('Shkoni tek seksioni "Authentication" (majtas) dhe klikoni tab-in "Sign-in method".', 'Go to the "Authentication" section (left sidebar) and click the "Sign-in method" tab.')}</li>
                                              <li>{t('Klikoni "Add new provider", zgjidhni "Email/Password", aktivizojeni atë dhe klikoni "Save".', 'Click "Add new provider", select "Email/Password", toggle it to Enabled, and click "Save".')}</li>
                                           </ol>
                                        </div>
                                     )}

                                     {authError.code === 'auth/operation-not-allowed' && authError.provider === 'google' && (
                                        <div className="space-y-1.5">
                                           <p className="font-medium text-zinc-200">
                                              {t('Lidhja me Google nuk është e aktivizuar në Firebase për projektin tuaj.', 'Google sign-in is not enabled in your Firebase project.')}
                                           </p>
                                           <ol className="list-decimal pl-4.5 space-y-1 text-[11px] text-zinc-400">
                                              <li>{t('Hapni Firebase Console duke përdorur butonin më poshtë.', 'Open the Firebase Console using the button below.')}</li>
                                              <li>{t('Shkoni tek seksioni "Authentication" (majtas) dhe klikoni tab-in "Sign-in method".', 'Go to the "Authentication" section (left sidebar) and click the "Sign-in method" tab.')}</li>
                                              <li>{t('Aktivizoni ofruesin "Google", vendosni email-in tuaj mbështetës të projektit dhe klikoni "Save".', 'Enable the "Google" provider, select your project support email, and click "Save".')}</li>
                                           </ol>
                                        </div>
                                     )}

                                     {authError.code === 'auth/admin-restricted-operation' && authError.provider === 'anonymous' && (
                                        <div className="space-y-1.5">
                                           <p className="font-medium text-zinc-200">
                                              {t('Hyrja e Shpejtë (Anonymous) nuk është e aktivizuar në Firebase për projektin tuaj.', 'Fast Login (Anonymous) is not enabled in your Firebase project.')}
                                           </p>
                                           <ol className="list-decimal pl-4.5 space-y-1 text-[11px] text-zinc-400">
                                              <li>{t('Hapni Firebase Console.', 'Open the Firebase Console.')}</li>
                                              <li>{t('Shkoni tek seksioni "Authentication" -> "Sign-in method".', 'Go to the "Authentication" -> "Sign-in method" section.')}</li>
                                              <li>{t('Shtoni dhe aktivizoni ofruesin "Anonymous" dhe klikoni "Save".', 'Add and enable the "Anonymous" provider and click "Save".')}</li>
                                           </ol>
                                        </div>
                                     )}

                                     {authError.code === 'auth/unauthorized-domain' && (
                                        <div className="space-y-2">
                                           <p className="font-medium text-zinc-200">
                                              {t('Domeni i tanishëm nuk është i autorizuar në Firebase!', 'This current domain is not authorized in Firebase!')}
                                           </p>
                                           <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5 text-[11px]">
                                              <p className="text-zinc-400 font-bold uppercase tracking-wider">{t('Domeni që duhet të shtoni:', 'Domain to add:')}</p>
                                              <div className="flex items-center justify-between gap-2 bg-black/40 px-2 py-1.5 rounded border border-zinc-800">
                                                 <code className="text-amber-400 font-mono select-all break-all">{window.location.hostname}</code>
                                                 <button
                                                    type="button"
                                                    onClick={() => {
                                                       navigator.clipboard.writeText(window.location.hostname);
                                                       showToast(t("Domeni u kopjua!", "Domain copied!"));
                                                    }}
                                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded text-[10px] uppercase transition-all"
                                                 >
                                                    {t("Kopjo", "Copy")}
                                                 </button>
                                              </div>
                                           </div>
                                           <p className="text-[11px] text-zinc-400 leading-relaxed">
                                              {t('Ky gabim (The requested action is invalid) ndodh sepse domeni ku po ekzekutoni aplikacionin nuk është i regjistruar në listën e domeneve të lejuara (Authorized Domains) të Firebase.', 'This error (The requested action is invalid) occurs because the domain where you are running the app is not registered in the Firebase Authorized Domains list.')}
                                           </p>
                                           <ol className="list-decimal pl-4.5 space-y-1 text-[11px] text-zinc-400">
                                              <li>{t('Klikoni butonin e gjelbër më poshtë për të hapur Firebase Console.', 'Click the green button below to open Firebase Console.')}</li>
                                              <li>{t('Shkoni tek Authentication -> Settings -> Authorized domains.', 'Go to Authentication -> Settings -> Authorized domains.')}</li>
                                              <li>{t('Shtoni domenin e kopjuar më sipër dhe klikoni Save.', 'Add the copied domain above and click Save.')}</li>
                                           </ol>
                                        </div>
                                     )}

                                     {(authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') && (
                                        <div className="space-y-1.5">
                                           <p className="font-medium text-zinc-200">
                                              🔑 {t('Fjalëkalim i pasaktë ose llogaria kërkon rivendosje!', 'Incorrect password or account needs reset!')}
                                           </p>
                                           <p className="text-[11px] text-zinc-400">
                                              {t('Kjo ndodh kur shkruani një fjalëkalim të gabuar, ose kur kjo adresë email është e regjistruar por fjalëkalimi i vendosur nuk përputhet (p.sh. nëse fillimisht jeni kyçur me Google).', 'This happens when you write an incorrect password, or if this email address is registered but the password entered does not match (e.g. if you originally signed up with Google).')}
                                           </p>
                                           <button
                                              type="button"
                                              onClick={handleResetPassword}
                                              className="mt-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 transition-all text-[11px]"
                                           >
                                              📩 {t('Dërgo Email për Rivendosje Fjalëkalimi', 'Send Password Reset Email')}
                                           </button>
                                        </div>
                                     )}

                                     {authError.code === 'auth/too-many-requests' && (
                                        <div className="space-y-1.5">
                                           <p className="font-medium text-zinc-200">
                                              ⚠️ {t('Keni provuar shumë herë!', 'Too many attempts!')}
                                           </p>
                                           <p className="text-[11px] text-zinc-400">
                                              {t('Firebase ka bllokuar përkohësisht kërkesat nga kjo pajisje për arsye sigurie për shkak të shumë tentativave të pasukseshme. Ju lutemi prisni disa minuta ose klikoni butonin më poshtë për të rivendosur fjalëkalimin tuaj.', 'Firebase has temporarily blocked requests from this device for security reasons due to multiple unsuccessful attempts. Please wait a few minutes or click the button below to reset your password.')}
                                           </p>
                                           <button
                                              type="button"
                                              onClick={handleResetPassword}
                                              className="mt-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 transition-all text-[11px]"
                                           >
                                              📩 {t('Dërgo Email për Rivendosje Fjalëkalimi', 'Send Password Reset Email')}
                                           </button>
                                        </div>
                                     )}

                                     {/* Default/Other Firebase Error guidance */}
                                     {authError.code !== 'auth/operation-not-allowed' && 
                                      authError.code !== 'auth/admin-restricted-operation' && 
                                      authError.code !== 'auth/unauthorized-domain' && 
                                      authError.code !== 'auth/invalid-credential' && 
                                      authError.code !== 'auth/wrong-password' && 
                                      authError.code !== 'auth/too-many-requests' && (
                                        <div className="space-y-1.5">
                                           <p className="font-medium text-zinc-200">
                                              {t('Rekomandime për zgjidhje:', 'Troubleshooting recommendations:')}
                                           </p>
                                           <ul className="list-disc pl-4.5 space-y-1 text-[11px] text-zinc-400">
                                              <li>{t('Sigurohuni që keni lidhje interneti të qëndrueshme në pajisje.', 'Ensure you have a stable internet connection on your device.')}</li>
                                              <li>{t('Për stabilitet maksimal brenda APK (Android), gjithmonë preferoni hyrjen me Email/Password.', 'For maximum stability inside APK (Android), always prefer using Email/Password sign-in.')}</li>
                                           </ul>
                                        </div>
                                     )}

                                     {/* Direct Quick Link to Firebase Console */}
                                     <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-3">
                                        <a
                                           href="https://console.firebase.google.com/project/gen-lang-client-0285886461/authentication/providers"
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-all underline shrink-0"
                                        >
                                           🚀 {t('Hap Ofruesit në Firebase Console', 'Open Firebase Console Providers')}
                                        </a>
                                     </div>
                                  </div>

                                  <div className="flex justify-end">
                                     <button
                                        type="button"
                                        onClick={() => setAuthError(null)}
                                        className="text-[10px] font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all uppercase tracking-wider"
                                     >
                                        {t('Pastro Gabimin', 'Clear Error')}
                                     </button>
                                  </div>
                               </div>
                            )}

                            {/* Tabs to switch between Sign In and Sign Up */}
                            <div className="flex border-b border-zinc-800/20 pb-2">
                               <button
                                  type="button"
                                  onClick={() => setIsSignUp(false)}
                                  className={`flex-1 pb-2 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                     !isSignUp 
                                        ? "text-emerald-400 border-emerald-500" 
                                        : "text-zinc-500 border-transparent hover:text-zinc-300"
                                  }`}
                               >
                                  Kyçu (Login)
                               </button>
                               <button
                                  type="button"
                                  onClick={() => setIsSignUp(true)}
                                  className={`flex-1 pb-2 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                     isSignUp 
                                        ? "text-emerald-400 border-emerald-500" 
                                        : "text-zinc-500 border-transparent hover:text-zinc-300"
                                  }`}
                               >
                                  Krijo Llogari (Sign Up)
                               </button>
                            </div>

                            {/* Form fields */}
                            <form onSubmit={handleEmailAuth} className="space-y-3">
                               <div>
                                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                     Adresa Email
                                  </label>
                                  <input
                                     type="email"
                                     required
                                     placeholder="emri@shembull.com"
                                     value={email}
                                     onChange={(e) => setEmail(e.target.value)}
                                     className={`w-full px-3.5 py-2 rounded-xl border text-sm font-semibold outline-none transition-all ${
                                        isDark 
                                           ? "bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500" 
                                           : "bg-white border-zinc-300 text-zinc-900 focus:border-emerald-500"
                                     }`}
                                  />
                               </div>

                               <div>
                                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                     Fjalëkalimi (Password)
                                  </label>
                                  <input
                                     type="password"
                                     required
                                     placeholder="••••••••"
                                     value={password}
                                     onChange={(e) => setPassword(e.target.value)}
                                     className={`w-full px-3.5 py-2 rounded-xl border text-sm font-semibold outline-none transition-all ${
                                        isDark 
                                           ? "bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500" 
                                           : "bg-white border-zinc-300 text-zinc-900 focus:border-emerald-500"
                                     }`}
                                  />
                                  <div className="flex justify-end mt-1.5">
                                     <button
                                        type="button"
                                        onClick={handleResetPassword}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-all font-semibold hover:underline"
                                     >
                                        {t('Keni harruar fjalëkalimin?', 'Forgot password?')}
                                     </button>
                                  </div>
                               </div>

                               {resetSent && (
                                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-left text-xs text-emerald-400 font-medium">
                                     ✓ {t('Email-i i rivendosjes së fjalëkalimit u dërgua me sukses! Ju lutemi kontrolloni kutinë tuaj të postës (Inbox) dhe postën e padëshiruar (Spam).', 'Password reset email sent successfully! Please check your Inbox and Spam folder.')}
                                  </div>
                               )}

                               <button
                                  type="submit"
                                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 mt-2"
                               >
                                  <LogIn className="w-4 h-4" /> 
                                  {isSignUp ? t('Krijo Llogari', 'Create Account') : t('Kyçu me Email', 'Log in with Email')}
                               </button>
                            </form>

                            {/* Divider */}
                            <div className="relative flex py-2 items-center">
                               <div className="flex-grow border-t border-zinc-800/40"></div>
                               <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">OSE / OR</span>
                               <div className="flex-grow border-t border-zinc-800/40"></div>
                            </div>

                            {/* Alternative Login buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                               <button
                                  type="button"
                                  onClick={loginWithGoogle}
                                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                     isDark 
                                        ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800" 
                                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
                                  }`}
                               >
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                     <path fill="#EA4335" d="M12 5.04c1.61 0 3.05.56 4.19 1.65l3.12-3.12C17.43 1.84 14.9 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.6 2.8C6.01 7.15 8.79 5.04 12 5.04z" />
                                     <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.6 2.8c2.11-1.95 3.83-4.82 3.83-8.62z" />
                                     <path fill="#FBBC05" d="M5.1 14.7c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3L1.5 7.3C.54 9.12 0 11.16 0 13.3c0 2.14.54 4.18 1.5 6l3.6-2.6z" />
                                     <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.8c-1.11.75-2.53 1.21-4.36 1.21-3.21 0-5.99-2.11-6.9-5.26l-3.6 2.8C3.4 20.35 7.35 23 12 23z" />
                                  </svg>
                                  {t('Vazhdo me Google', 'Continue with Google')}
                               </button>

                               <button
                                  type="button"
                                  onClick={handleAnonymousAuth}
                                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                     isDark 
                                        ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800" 
                                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
                                  }`}
                               >
                                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                  {t('Hyrje e Shpejtë (Anonym)', 'Fast Login (Anonymous)')}
                               </button>
                            </div>
                         </div>
                      )}
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
                        {t("Të dhënat tuaja rezervohen automatikisht në Cloud sapo jeni i kyçur. Mund t'i shkarkoni përsëri edhe nëse ndërroni telefon.", "Your data is automatically synced to the Cloud when you are logged in. You can redownload it even if you switch phones.")}
                      </p>
                      {user ? (
                         <div className="space-y-4">
                            <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-xs text-emerald-500 font-semibold flex items-center justify-between">
                               <span>Llogaria: <span className="font-bold">{user.email}</span></span>
                               <button 
                                 onClick={() => {
                                    handleSecureLogoutRequest('cloud', async () => {
                                       await hookLogout();
                                    });
                                 }}
                                 className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded font-bold uppercase text-[10px] transition-all"
                               >
                                 {t('Çkyçu', 'Logout')}
                               </button>
                            </div>
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
                         </div>
                      ) : (
                         <div className="space-y-4 w-full text-left">
                             <div className="space-y-3 p-3.5 rounded-xl border bg-zinc-100/30 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800">
                                <div>
                                   <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                      {t('Adresa Email', 'Email Address')}
                                   </label>
                                   <input
                                      type="email"
                                      placeholder="emri@shembull.com"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                      className={`w-full px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold outline-none transition-all ${
                                         isDark 
                                            ? "bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500" 
                                            : "bg-white border-zinc-300 text-zinc-900 focus:border-emerald-500"
                                      }`}
                                   />
                                </div>

                                <div>
                                   <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                      {t('Fjalëkalimi (Password)', 'Password')}
                                   </label>
                                   <input
                                      type="password"
                                      placeholder="••••••••"
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      className={`w-full px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold outline-none transition-all ${
                                         isDark 
                                            ? "bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500" 
                                            : "bg-white border-zinc-300 text-zinc-900 focus:border-emerald-500"
                                      }`}
                                   />
                                </div>

                                {authError && (
                                   <p className="text-[11px] text-red-500 font-bold">{authError.message}</p>
                                )}

                                <div className="flex gap-2 pt-1">
                                   <button 
                                      onClick={() => {
                                         setIsSignUp(false);
                                         setTimeout(() => handleEmailAuth({ preventDefault: () => {} } as any), 50);
                                      }}
                                      className="flex-1 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                   >
                                      {t('Kyçu', 'Login')}
                                   </button>
                                   <button 
                                      onClick={() => {
                                         setIsSignUp(true);
                                         setTimeout(() => handleEmailAuth({ preventDefault: () => {} } as any), 50);
                                      }}
                                      className="flex-1 py-1.5 rounded-lg font-bold text-xs border border-zinc-500/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                                   >
                                      {t('Regjistrohu', 'Register')}
                                   </button>
                                </div>

                                <div className="relative flex py-1 items-center">
                                    <div className="flex-grow border-t border-zinc-300 dark:border-zinc-700"></div>
                                    <span className="flex-shrink mx-3 text-zinc-400 text-[9px] font-bold uppercase">{t('Ose', 'Or')}</span>
                                    <div className="flex-grow border-t border-zinc-300 dark:border-zinc-700"></div>
                                </div>

                                <button
                                   type="button"
                                   onClick={loginWithGoogle}
                                   className={`w-full py-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                                      isDark ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                                   }`}
                                >
                                   <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                      <path
                                         fill="#4285F4"
                                         d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                      />
                                      <path
                                         fill="#34A853"
                                         d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                      />
                                      <path
                                         fill="#FBBC05"
                                         d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                      />
                                      <path
                                         fill="#EA4335"
                                         d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                      />
                                   </svg>
                                   {t('Hyr me Google', 'Sign in with Google')}
                                </button>
                             </div>
                          </div>
                      )}
                   </div>

                   {/* Gemini Active Agent (Autopilot) */}
                   <div className={`p-4 rounded-xl border space-y-3 shadow-sm transition-all ${isDark ? "bg-purple-950/20 border-purple-900/40 hover:border-purple-900/60" : "bg-purple-50/25 border-purple-100 hover:border-purple-200"}`}>
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500 shrink-0 animate-pulse" />
                            <div>
                               <h4 className={`font-bold text-sm text-purple-600 dark:text-purple-400`}>
                                  Agjenti Aktiv Gemini (Autopilot)
                                </h4>
                               <p className="text-[10px] text-zinc-400">
                                  Korigjim & Plotësim Automatike Matematike / Drejtshkrimore
                               </p>
                            </div>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                               type="checkbox" 
                               checked={aiAutopilot} 
                               onChange={(e) => {
                                  const checked = e.target.checked;
                                  setAiAutopilot(checked);
                                  localStorage.setItem('grid_ai_autopilot', checked ? 'true' : 'false');
                                  showToast(checked ? "🤖 Agjenti Aktiv Gemini u aktivizua!" : "🤖 Agjenti Aktiv u çaktivizua.");
                               }}
                               className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                         </label>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                         Kur shkruani rreshta, bëni shënime ose listoni detyra, Agjenti Online i Gemini analizon punën tuaj në sfond pas 10 sekondash qetësie dhe kryen automatikisht plotësimet e kolonave me llogaritje (shuma, sasi, çmimi) dhe korigjon gabimet drejtshkrimore me siguri të lartë!
                      </p>
                      {isAiAutopilotRunning && (
                         <div className="flex items-center gap-2 text-xs text-purple-500 font-bold animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Agjenti po analizon bllokun tuaj online...
                         </div>
                      )}
                   </div>

                   {/* GitHub Gist Backup - Google Cloud Gist Style */}
                    <div className={`p-5 rounded-2xl border space-y-4 shadow-sm transition-all ${isDark ? "bg-zinc-950/40 border-blue-900/40 hover:border-blue-900/60" : "bg-blue-50/25 border-blue-100 hover:border-blue-200"}`}>
                       <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className={`font-extrabold text-sm sm:text-base flex items-center gap-2 text-blue-600 dark:text-blue-400`}>
                             <Github className="w-5 h-5 text-zinc-900 dark:text-white shrink-0" />
                             Gist Cloud Connector (Google Cloud/Gist Style)
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                             gistToken ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                          }`}>
                             {gistToken ? "I LIDHUR (ACTIVE)" : "I PALIDHUR (OFFLINE)"}
                          </span>
                       </div>

                       <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                          Platforma e Gist-it e Integruar me Google Cloud. Shënimet tuaja ruhen në dy skedarë: 
                          <span className="font-semibold text-emerald-500"> JSON</span> (për sinkronizim automatik) dhe 
                          <span className="font-semibold text-blue-500"> Markdown (.md)</span> si manual notebook i lexueshëm direkt në profilin tuaj GitHub.
                       </p>

                       <div className={`text-[11px] p-2.5 rounded-lg font-mono flex flex-col gap-1 ${isDark ? "bg-zinc-900/80 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
                          <div className="flex justify-between">
                             <span>Google Cloud Account:</span>
                             <span className="font-bold text-blue-500">{(email || localStorage.getItem('grid_notepad_saved_email') || 'genti8319@gmail.com').trim()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span>Gist Stream:</span>
                             <span className="font-semibold">{gistId ? `Connected (${gistId.substring(0,8)}...)` : 'Unassigned'}</span>
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                          <div>
                             <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                GitHub Personal Token:
                             </label>
                             <input 
                                type="password" 
                                placeholder="Vendosni Token-in e GitHub (shërben si fjalëkalim)" 
                                value={gistToken}
                                onChange={(e) => { setGistToken(e.target.value); localStorage.setItem('grid_notepad_gist_token', e.target.value); }}
                                className={`w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${isDark ? "bg-zinc-900/90 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900 shadow-sm"}`}
                             />
                             <p className="text-[10px] text-zinc-400 mt-1">
                                Duhet të ketë fushëveprimin <code className="bg-zinc-800 text-zinc-300 px-1 rounded">gist</code>. 
                                <a href="https://github.com/settings/tokens/new?scopes=gist&description=Notepad+Backup" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold ml-1">Krijo një të ri këtu (Klik Këtu)</a>.
                             </p>
                          </div>

                          <div>
                             <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                Gist Stream ID:
                             </label>
                             <input 
                                type="text" 
                                placeholder="Lëreni bosh herën e parë (do të krijohet automatikisht)" 
                                value={gistId}
                                onChange={(e) => { setGistId(e.target.value); localStorage.setItem('grid_notepad_gist_id', e.target.value); }}
                                className={`w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${isDark ? "bg-zinc-900/90 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900 shadow-sm"}`}
                             />
                          </div>
                       </div>

                       {gistToken && (
                          <div className="flex justify-end pb-3">
                             <button
                                type="button"
                                onClick={() => {
                                   handleSecureLogoutRequest('gist', () => {
                                      setGistToken('');
                                      setGistId('');
                                      localStorage.removeItem('grid_notepad_gist_token');
                                      localStorage.removeItem('grid_notepad_gist_id');
                                    });
                                }}
                                className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-xs font-bold border border-red-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
                             >
                                <LogOut className="w-3.5 h-3.5" /> {t('Shkyç Gist (Çaktivizo)', 'Disconnect Gist')}
                             </button>
                          </div>
                       )}

                       <div className="flex flex-col sm:flex-row gap-3">
                           <button onClick={saveToGist} className="flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20">
                              <Upload className="w-4 h-4" /> {t('Shto në Gist', 'Push to Gist')}
                           </button>
                           <button onClick={loadFromGist} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border ${isDark ? "bg-orange-600 hover:bg-orange-500 text-white shadow-md border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold border-transparent"}`}>
                              <Download className="w-4 h-4" /> {t('Rikthe nga Gist', 'Restore All')}
                           </button>
                           <button onClick={openGistDashboard} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border ${isDark ? "bg-green-600 hover:bg-green-500 text-white shadow-md border-transparent" : "bg-green-500 hover:bg-green-600 text-white shadow-md font-bold border-transparent"}`}>
                              <FolderOpen className="w-4 h-4" /> {t('Listo Gist', 'List Gist')}
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
             <div className={`max-w-2xl w-full max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
                <div className={`flex justify-between items-center p-5 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <h3 className={`text-xl font-bold flex items-center gap-2 ${textColor}`}>
                      <Github className="w-6 h-6 text-zinc-900 dark:text-white shrink-0" /> {t('Platforma Gist GitHub', 'GitHub Gist Platform')}
                   </h3>
                   <button onClick={() => setGistViewerModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>

                <div className={`p-4 border-b flex flex-wrap gap-2 ${isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                    <button onClick={saveToGist} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-blue-600 hover:bg-blue-500 text-white border-transparent" : "bg-blue-500 hover:bg-blue-600 text-white border-transparent"}`}>
                        <Upload className="w-4 h-4 inline-block mr-1" /> Shto në Gist (Upload)
                    </button>
                    <button onClick={loadFromGist} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white border-transparent"}`}>
                        <Download className="w-4 h-4 inline-block mr-1" /> Rikthe nga Gist (Restore)
                    </button>
                    <button onClick={viewGistContent} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${isDark ? "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent" : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"}`}>
                        <RefreshCw className="w-3.5 h-3.5" /> Rikthe / Ngarko listën
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
                   {gistViewerContent ? (
                       (() => {
                           try {
                               const parsedDocs = JSON.parse(gistViewerContent);
                               if (!Array.isArray(parsedDocs)) throw new Error();
                               if (parsedDocs.length === 0) {
                                  return (
                                     <div className={`text-center py-10 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                                        Nuk u gjet asnjë dokument online në Gist.
                                     </div>
                                  );
                               }
                               return parsedDocs.map((docItem: any) => (
                                   <div key={docItem.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 transition-colors ${
                                      isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                                   }`}>
                                       <div className="flex-1">
                                          <h4 className={`font-bold ${textColor}`}>{docItem.title || 'I paemërtuar'}</h4>
                                          <div className={`text-xs mt-1 flex items-center gap-3 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{safeFormatDate(docItem.createdAt, 'dd MMM yyyy')}</span>
                                              <span>•</span>
                                              <span>{docItem.rows?.length || 0} Rreshta</span>
                                              <span>•</span>
                                              <span>{docItem.headers?.length || 0} Kolona</span>
                                          </div>
                                       </div>
                                       
                                       <div className="flex flex-wrap w-full sm:w-auto items-center justify-end gap-2">
                                          <button onClick={() => {
                                             const existing = documents.findIndex(d => d.id === docItem.id);
                                             let newDocs = [...documents];
                                             if (existing >= 0) newDocs[existing] = docItem;
                                             else newDocs.push(docItem);
                                             setDocuments(newDocs);
                                             localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newDocs));
                                             showToast("Dokumenti nga Gist u ruajt në memorien e telefonit!");
                                          }} className={`flex-grow sm:flex-grow-0 justify-center flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
                                             isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"
                                          }`}>
                                             <FolderDown className="w-4 h-4" /> <span className="sm:hidden lg:inline">Ruaj / Save</span>
                                          </button>
                                          <button onClick={() => {
                                             openDocument(docItem);
                                             setGistViewerModal(false);
                                             showToast(`U hap dokumenti: ${docItem.title}`);
                                          }} className={`flex-grow sm:flex-grow-0 justify-center flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20`}>
                                             <FolderUp className="w-4 h-4" /> <span className="sm:hidden lg:inline">Hap / Preview</span>
                                          </button>
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
                                   <span>•</span>
                                   <span>{cDoc.rows?.length || 0} Rreshta</span>
                                   <span>•</span>
                                   <span>{cDoc.headers?.length || 0} Kolona</span>
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
                                   showToast("Dokumenti u ruajt në memorien e telefonit!");
                                }} className={`flex-grow sm:flex-grow-0 justify-center flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
                                   isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"
                                }`}>
                                   <FolderDown className="w-4 h-4" /> <span className="sm:hidden lg:inline">Ruaj / Save</span>
                                </button>
                                <button onClick={() => {
                                   openDocument(cDoc);
                                   setCloudModal(false);
                                }} className={`flex-grow sm:flex-grow-0 justify-center flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20`}>
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

  if (onlineView) {
     return renderOnlineDashboard();
  }

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
                      handleSecureLogoutRequest('cloud', async () => {
                         localStorage.removeItem('grid_notepad_saved_pwd');
                         await hookLogout();
                      });
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

               <div className="relative flex-shrink-0 snap-start">
                  <button 
                    onClick={() => setShowCloudDropdown(!showCloudDropdown)} 
                    className={`flex justify-center items-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all border shadow-md active:scale-95 ${
                      isDark ? "bg-green-600 hover:bg-green-500 text-white border-transparent" : "bg-green-500 hover:bg-green-600 text-white border-transparent font-bold"
                    }`}
                  >
                    <Cloud className="w-3.5 h-3.5" /> CLOUD <span className="text-[8px] opacity-80">▼</span>
                  </button>
                  {showCloudDropdown && (
                     <>
                        <div className="fixed inset-0 z-[120]" onClick={() => setShowCloudDropdown(false)} />
                        <div className={`absolute left-0 mt-1.5 py-1 rounded-xl border shadow-xl z-[130] flex flex-col w-[170px] ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"}`}>
                           <button 
                             onClick={() => { setShowCloudDropdown(false); openCloudModal(); }} 
                             className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors w-full"
                           >
                              <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> CLOUD
                           </button>
                           <button 
                             onClick={() => { setShowCloudDropdown(false); viewGistContent(); }} 
                             className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors w-full"
                           >
                              <Github className="w-3.5 h-3.5 text-blue-500 shrink-0" /> GIST
                           </button>
                           <div className="h-px bg-zinc-500/10 my-0.5"></div>
                           <button 
                             onClick={() => { setShowCloudDropdown(false); handleUnifiedRestoreAll(); }} 
                             className="flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-left text-orange-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors w-full animate-pulse"
                           >
                              <Download className="w-3.5 h-3.5 text-orange-500 shrink-0" /> Restore all
                           </button>
                        </div>
                     </>
                  )}
               </div>

               <button onClick={() => setBackupModal(true)} className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border active:scale-95 ${
                 isDark ? "bg-accent-600 hover:bg-accent-500 text-white shadow-md border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white shadow-md font-bold border-transparent"
               }`}>
                 <Database className="w-3.5 h-3.5" /> Backup
               </button>

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
                           if (user && theDoc) setDoc(doc(db, 'documents', theDoc.id), { ...theDoc, userId: getActiveUid()! }).catch(()=>console.error('ai header error sync'));
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
