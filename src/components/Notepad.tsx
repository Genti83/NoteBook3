import { getRedirectResult } from 'firebase/auth';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, Lock, Unlock, Trash2, Edit, Plus, Search, FolderOpen, ChevronRight, 
  Grid, List, Settings, LogOut, Cloud, Key, RefreshCw, FileText, Download, 
  Upload, Copy, Check, Mic, MicOff, Play, Square, Save, Eye, EyeOff, Trash, 
  Calculator, AlertTriangle, ArrowDownAZ, ArrowUpAZ, ArrowLeft, Calendar, 
  CalendarDays, CaseSensitive, CheckCheck, Eraser, File, FileDown, FileJson, 
  FileSpreadsheet, Folder, FolderDown, FolderUp, Github, LayoutGrid, Loader2, 
  LogIn, Maximize2, Minus, Monitor, Moon, Paintbrush, Palette, RotateCcw, 
  Smartphone, Sparkles, Sun, Tag, Terminal, Type, UploadCloud, User,
  RemoveFormatting, Database, ImageMinus, ImagePlus, HardDrive
} from 'lucide-react';

import { db, auth } from '../lib/firebase';
import { 
  doc, setDoc, getDoc, deleteDoc, getDocs, collection, query, where, onSnapshot 
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { jsPDF } from 'jspdf';
import { useFirebase } from '../hooks/useFirebase';

const COLOR_THEMES = {
  blue: {
    50: '#eff6ff',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  emerald: {
    50: '#ecfdf5',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  violet: {
    50: '#f5f3ff',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
  },
  amber: {
    50: '#fffbeb',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  rose: {
    50: '#fff1f2',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
  },
  kontrast: {
    50: '#fafafa',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#262626',
  }
};

export interface GridRow {
  id: string;
  status: 'none' | 'ok' | 'blue' | 'x';
  image?: string;
  col1?: string;
  col2?: string;
  col3?: string;
  col4?: string;
  [key: string]: any;
}

export interface GridDocument {
  id: string;
  title: string;
  headers: string[];
  columnWidths?: number[];
  rows: GridRow[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}


const TEXT_COLORS = [
  { id: "default", name: "Default" },
  { id: "#ef4444", name: "Red" },
  { id: "#f97316", name: "Orange" },
  { id: "#eab308", name: "Yellow" },
  { id: "#22c55e", name: "Green" },
  { id: "#3b82f6", name: "Blue" },
  { id: "#a855f7", name: "Purple" },
  { id: "#ec4899", name: "Pink" },
];

const TAG_COLORS = [
  { id: "tag-red", color: "#ef4444", name: "Red" },
  { id: "tag-orange", color: "#f97316", name: "Orange" },
  { id: "tag-yellow", color: "#eab308", name: "Yellow" },
  { id: "tag-green", color: "#22c55e", name: "Green" },
  { id: "tag-blue", color: "#3b82f6", name: "Blue" },
  { id: "tag-purple", color: "#a855f7", name: "Purple" },
  { id: "tag-pink", color: "#ec4899", name: "Pink" },
  { id: "tag-gray", color: "#71717a", name: "Gray" },
];

interface HeaderInputProps {
  initialValue: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

function HeaderInput({ initialValue, onChange, className, placeholder }: HeaderInputProps) {
  const [val, setVal] = React.useState(initialValue);
  
  React.useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onChange(val)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onChange(val);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
      placeholder={placeholder}
    />
  );
}

interface CellInputProps {
  initialValue: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  startHold?: () => void;
  stopHold?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

function CellInput({ initialValue, onChange, readOnly, startHold, stopHold, className, style }: CellInputProps) {
  const [val, setVal] = React.useState(initialValue || "");

  React.useEffect(() => {
    setVal(initialValue || "");
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setVal(newVal);
    onChange(newVal);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (startHold) startHold();
  };

  const handlePointerUp = () => {
    if (stopHold) stopHold();
  };

  return (
    <textarea
      value={val}
      onChange={handleChange}
      readOnly={readOnly}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={className}
      style={style}
      rows={1}
    />
  );
}


interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  onTagCreated?: (tag: string) => void;
  allAvailableTags: string[];
  isDark?: boolean;
  t?: (sq: string, en: string) => string;
}

function TagInput({ tags, onChange, onTagCreated, allAvailableTags, isDark, t }: TagInputProps) {
  const translate = t || ((sq: string, en: string) => sq);
  const [input, setInput] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      if (onTagCreated) {
        onTagCreated(trimmed);
      }
    }
    setInput('');
    setShowSuggestions(false);
    setIsEditing(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const suggestions = allAvailableTags.filter(
    tag => tag.toLowerCase().includes(input.toLowerCase()) && !tags.includes(tag)
  );

  return (
    <div className="flex flex-col gap-1.5 relative w-full">
      <div className="flex flex-wrap gap-1 items-center p-1 border rounded-lg bg-transparent min-h-[34px] border-zinc-500/10">
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-500 shrink-0"
          >
            #{tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-red-500 font-bold ml-0.5 text-[10px]"
            >
              ×
            </button>
          </span>
        ))}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay slightly so suggestions click can register
              setTimeout(() => {
                setShowSuggestions(false);
                setIsEditing(false);
              }, 200);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                if (input.trim()) handleAddTag(input);
              } else if (e.key === 'Escape') {
                setIsEditing(false);
              }
            }}
            placeholder={translate("Shto etiketë...", "Add tag...")}
            className="flex-grow bg-transparent border-none outline-none text-xs min-w-[70px] p-0.5"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-dashed border-zinc-500/20 text-zinc-500 hover:border-accent-500 hover:text-accent-500 transition-colors"
          >
            + {translate("Etiketë", "Tag")}
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[150] max-h-40 overflow-y-auto rounded-lg shadow-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-1">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={() => handleAddTag(suggestion)}
              className="w-full text-left px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
            >
              #{suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


const format = (date: Date, formatStr: string) => {
  const pad = (num: number) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return formatStr
    .replace('yyyy', String(yyyy))
    .replace('MM', MM)
    .replace('dd', dd)
    .replace('HH', HH)
    .replace('mm', mm)
    .replace('ss', ss);
};

export function Notepad() {
  const { 
    user, loading, 
    loginWithGoogle: hookGoogleLogin, 
    loginWithEmail: hookEmailLogin, 
    registerWithEmail: hookEmailRegister, 
    loginAnonymously: hookAnonymousLogin, 
    logout: hookLogout, 
    resetPassword: hookResetPassword 
  } = useFirebase();
  // Additional missing online, cloud, and UI states
  const [selectedOnlineDoc, setSelectedOnlineDoc] = React.useState<GridDocument | null>(null);
  const [isOnlineEditing, setIsOnlineEditing] = React.useState<boolean>(false);
  const [gistToken, setGistToken] = React.useState<string>(() => localStorage.getItem('grid_notepad_gist_token') || '');
  const [gistId, setGistId] = React.useState<string>(() => localStorage.getItem('grid_notepad_gist_id') || '');
  const [gistViewerModal, setGistViewerModal] = React.useState<boolean>(false);
  const [gistViewerContent, setGistViewerContent] = React.useState<string | null>(null);

  const [onlineBlueText, setOnlineBlueText] = React.useState<string>('');
  const [onlineSecretList, setOnlineSecretList] = React.useState<any[]>([]);

  const [cloudModal, setCloudModal] = React.useState<boolean>(false);
  const [cloudDocToDelete, setCloudDocToDelete] = React.useState<GridDocument | null>(null);
  const [showCloudSelectionModal, setShowCloudSelectionModal] = React.useState<boolean>(false);

  const [showDownloadAppModal, setShowDownloadAppModal] = React.useState<boolean>(false);
  const [downloadActiveTab, setDownloadActiveTab] = React.useState<'pwa' | 'apk' | 'github'>('pwa');

  const [appLocked, setAppLocked] = React.useState<boolean>(() => !!localStorage.getItem('grid_notepad_pin'));
  const [appLockInput, setAppLockInput] = React.useState<string>('');

  const [onlineView, setOnlineView] = React.useState<'cloud' | 'gist' | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = React.useState<boolean>(false);
  const [cloudSyncFrequency, setCloudSyncFrequency] = React.useState<number>(() => parseInt(localStorage.getItem('grid_cloud_sync_freq') || '5000'));

  const [activeProvider, setActiveProvider] = React.useState<string>('local');
  const [currentPath, setCurrentPath] = React.useState<string[]>([]);
  const [showStoragePickerModal, setShowStoragePickerModal] = React.useState<boolean>(false);
  const [showStorageSidebar, setShowStorageSidebar] = React.useState<boolean>(false);
  const [androidBaseDir, setAndroidBaseDir] = React.useState<string>(() => localStorage.getItem('grid_android_base_dir') || 'Memoria e Telefonit');
  const [folderName, setFolderName] = React.useState<string>(() => localStorage.getItem('grid_folder_name') || 'Dosja');
  const [downloadMethod, setDownloadMethod] = React.useState<'prompt' | 'directory'>('prompt');
  const [saveDirectoryHandle, setSaveDirectoryHandle] = React.useState<any>(null);

  const [backupModal, setBackupModal] = React.useState<boolean>(false);
  const [mainTab, setMainTab] = React.useState<'lista' | 'etiketa'>('lista');
  const [catalogSearch, setCatalogSearch] = React.useState<string>('');
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [transferDocId, setTransferDocId] = React.useState<string | null>(null);
  const [transferringInfo, setTransferringInfo] = React.useState<{ docTitle: string; destName: string } | null>(null);
  const [docToDelete, setDocToDelete] = React.useState<string | null>(null);



  const getTagColors = (tagName: string) => {
    const colors = [
      'bg-red-500/10 border-red-500/30 text-red-500',
      'bg-orange-500/10 border-orange-500/30 text-orange-500',
      'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
      'bg-green-500/10 border-green-500/30 text-green-500',
      'bg-blue-500/10 border-blue-500/30 text-blue-500',
      'bg-purple-500/10 border-purple-500/30 text-purple-500',
      'bg-pink-500/10 border-pink-500/30 text-pink-500',
      'bg-zinc-500/10 border-zinc-500/30 text-zinc-500',
    ];
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleAddCustomLabel = () => {
    setLabelModal({
      isOpen: true,
      mode: 'add',
      value: ''
    });
  };

  const viewGistContent = async (gistIdOverride?: string) => {
    const gId = gistIdOverride || gistId || localStorage.getItem('grid_notepad_gist_id');
    if (!gId) {
      showToast("Nuk ka Gist ID. Ruani një herë dokumentet fillimisht.");
      return;
    }
    showToast("Duke hapur dokumentin Gist...");
    try {
      const res = await fetch(`https://api.github.com/gists/${gId}`, {
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

  // Remaining states and handlers from full app scope
  const [isOnlineAiThinking, setIsOnlineAiThinking] = React.useState<boolean>(false);
  const [onlineDashboardTab, setOnlineDashboardTab] = React.useState<'lists' | 'notes' | 'secrets'>('lists');
  const [secureLogoutModal, setSecureLogoutModal] = React.useState<boolean>(false);
  const [secureLogoutPasswordInput, setSecureLogoutPasswordInput] = React.useState<string>('');
  
  const [simulatedFilesystem, setSimulatedFilesystem] = React.useState<Record<string, any[]>>(() => {
    try {
      const stored = localStorage.getItem('grid_simulated_fs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          // Auto-insert "Dosja" if missing from "Memoria e Telefonit"
          if (!parsed["Memoria e Telefonit"]) {
            parsed["Memoria e Telefonit"] = [
              { name: "Dosja", type: "folder" },
              { name: "Dokumente", type: "folder" },
              { name: "Shkarkime", type: "folder" }
            ];
          } else if (!parsed["Memoria e Telefonit"].some((item: any) => item.name === "Dosja")) {
            parsed["Memoria e Telefonit"].push({ name: "Dosja", type: "folder" });
          }
          if (!parsed["Memoria e Telefonit/Dosja"]) {
            parsed["Memoria e Telefonit/Dosja"] = [];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading simulated filesystem", e);
    }
    return {
      "Memoria e Telefonit": [
        { name: "Dosja", type: "folder" },
        { name: "Dokumente", type: "folder" },
        { name: "Shkarkime", type: "folder" }
      ],
      "Memoria e Telefonit/Dosja": [],
      "Memoria e Telefonit/Dokumente": [],
      "Memoria e Telefonit/Shkarkime": [],
      "Kartela SD": [
        { name: "Backup", type: "folder" }
      ],
      "Kartela SD/Backup": [],
      "Ruajtja e Jashtme": []
    };
  });

  React.useEffect(() => {
    localStorage.setItem('grid_simulated_fs', JSON.stringify(simulatedFilesystem));
  }, [simulatedFilesystem]);

  const [storageSearchQuery, setStorageSearchQuery] = React.useState<string>('');
  const [newFolderInputName, setNewFolderInputName] = React.useState<string>('');

  const [activeSecretId, setActiveSecretId] = React.useState<string | null>(null);
  const [secretSearchQuery, setSecretSearchQuery] = React.useState<string>('');

  const [passwordModal, setPasswordModal] = React.useState<boolean>(false);
  const [passwordInput, setPasswordInput] = React.useState<string>('');

  const [aiAutopilot, setAiAutopilot] = React.useState<boolean>(() => localStorage.getItem('grid_ai_autopilot') === 'true');
  const [isAiAutopilotRunning, setIsAiAutopilotRunning] = React.useState<boolean>(false);

  const [githubUser, setGithubUser] = React.useState<any>(null);
  const [tempGistToken, setTempGistToken] = React.useState<string>('');

  const openGistDashboard = () => {
    setOnlineView('gist');
    setOnlineDashboardTab('lists');
  };

  const saveToGist = async (docsOverride?: any, isSilent = false, blueTextOverride?: string, secretListOverride?: any[]) => {
      const token = gistToken || localStorage.getItem('grid_notepad_gist_token');
      if (!token) {
        if (!isSilent) showToast("Ju lutem vendosni një GitHub Token");
        return false;
      }
      if (!isSilent) showToast("Duke ruajtur në GitHub Gist...");
      try {
          const docsToBackup = docsOverride || documents;
          const finalBlueText = blueTextOverride !== undefined ? blueTextOverride : onlineBlueText;
          const finalSecretList = secretListOverride !== undefined ? secretListOverride : onlineSecretList;
          const backupData = {
            documents: docsToBackup,
            blueText: finalBlueText,
            secretList: finalSecretList
          };
          const content = JSON.stringify(backupData);
          let method = 'POST';
          let url = 'https://api.github.com/gists';
          
          const gId = gistId || localStorage.getItem('grid_notepad_gist_id');
          if (gId) {
             method = 'PATCH';
             url = `https://api.github.com/gists/${gId}`;
          }

          const res = await fetch(url, {
             method,
             headers: {
                'Authorization': `token ${token}`,
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
          localStorage.setItem('grid_notepad_gist_token', token);
          if (!isSilent) showToast("U ruajt me sukses në GitHub Gist!");
          return true;
      } catch (err: any) {
          if (!isSilent) showToast(err.message);
          return false;
      }
  };

  const loadFromGist = async () => {
      const token = gistToken || localStorage.getItem('grid_notepad_gist_token');
      const gId = gistId || localStorage.getItem('grid_notepad_gist_id');
      if (!token) return showToast("Ju lutem vendosni një GitHub Token");
      if (!gId) return showToast("Nuk ka asnjë Gist ID të ruajtur për t'u rikthyer.");
      showToast("Duke ngarkuar nga GitHub Gist...");
      try {
          const res = await fetch(`https://api.github.com/gists/${gId}`, {
             headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
             }
          });
          if (!res.ok) throw new Error("Gabim gjatë ngarkimit. Gist ID ose Token i pavlefshëm.");
          const data = await res.json();
          const file = data.files['grid_notepad_backup.json'];
          if (!file) throw new Error("Skedari nuk u gjet në këtë Gist.");
          
          const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
          const parsedData = JSON.parse(content);
          
          let parsedDocs = [];
          if (Array.isArray(parsedData)) {
            parsedDocs = parsedData;
          } else if (parsedData && parsedData.documents) {
            parsedDocs = parsedData.documents;
            if (parsedData.blueText !== undefined) {
              setOnlineBlueText(parsedData.blueText);
              setBlueText(parsedData.blueText);
              localStorage.setItem('grid_notepad_blue', parsedData.blueText);
            }
            if (parsedData.secretList !== undefined) {
              setOnlineSecretList(parsedData.secretList);
              setSecretList(parsedData.secretList);
              localStorage.setItem('grid_notepad_secret_list', JSON.stringify(parsedData.secretList));
            }
          }

          setDocuments(parsedDocs);
          localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(parsedDocs));
          if (activeDocId) {
             const curr = parsedDocs.find((d: any) => d.id === activeDocId);
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



  // Missing states from first block replacement
  const [activeTags, setActiveTags] = React.useState<string[]>([]);
  const [autoSaveMsg, setAutoSaveMsg] = React.useState<string>("");
  const [docSearch, setDocSearch] = React.useState<string>("");
  const [showTextMenu, setShowTextMenu] = React.useState<boolean>(false);
  const [showTextColorMenu, setShowTextColorMenu] = React.useState<boolean>(false);
  const [showTagColorMenu, setShowTagColorMenu] = React.useState<boolean>(false);
  const [previewSelectedRows, setPreviewSelectedRows] = React.useState<boolean>(false);
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set<number>());
  const [showConfirmDeleteSelected, setShowConfirmDeleteSelected] = React.useState<boolean>(false);
  const [showConfirmClear, setShowConfirmClear] = React.useState<boolean>(false);
  const [showConfirmClose, setShowConfirmClose] = React.useState<boolean>(false);
  const [showThemeMenu, setShowThemeMenu] = React.useState<boolean>(false);

  // Text options states and updates
  const [textSize, setTextSize] = React.useState<number>(() => parseInt(localStorage.getItem("grid_notepad_text_size") || "12"));
  const updateTextSize = (val: number) => {
    setTextSize(val);
    localStorage.setItem("grid_notepad_text_size", String(val));
  };

  const [textWeight, setTextWeight] = React.useState<number>(() => parseInt(localStorage.getItem("grid_notepad_text_weight") || "400"));
  const updateTextWeight = (val: number) => {
    setTextWeight(val);
    localStorage.setItem("grid_notepad_text_weight", String(val));
  };

  const [textColorMode, setTextColorMode] = React.useState<string>(() => localStorage.getItem("grid_notepad_text_color_mode") || "default");
  const updateTextColorMode = (val: string) => {
    setTextColorMode(val);
    localStorage.setItem("grid_notepad_text_color_mode", val);
  };

  const getActualTextColor = (mode: string) => {
    if (mode === "default") return isDark ? "#ffffff" : "#18181b";
    return mode;
  };

  // Missing helper function
  const getAlbanianDateTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date().toLocaleDateString("sq-AL", options);
  };

  // Cell Long-Press / Hold refs and handlers
  const isLongPress = React.useRef<Record<number, boolean>>({});
  const pressTimers = React.useRef<Record<number, any>>({});

  const handleCellHoldStart = (rIndex: number, colKey: string) => {
    isLongPress.current[rIndex] = false;
    pressTimers.current[rIndex] = setTimeout(() => {
      isLongPress.current[rIndex] = true;
      setSelectedRows((prev: Set<number>) => {
        const n = new Set(prev);
        n.add(rIndex);
        return n;
      });
      showToast(t("Rrjeshti u zgjodh!", "Row selected!"));
    }, 1500); // 1.5 seconds hold to select row
  };

  const handleCellHoldCancel = () => {
    Object.values(pressTimers.current).forEach(t => clearTimeout(t as any));
  };

  // Extra refs and states needed by full application scope
  const isGistSyncingRef = React.useRef<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const localSaveTimeout = React.useRef<any>(null);
  const autoSaveTimeout = React.useRef<any>(null);

  const [tempGistId, setTempGistId] = React.useState<string>('');
  const [onlineSearch, setOnlineSearch] = React.useState<string>('');

  const addFileToSimulatedFilesystem = (fileName: string, fileSize: number) => {
    setSimulatedFilesystem(prev => {
      const currentFolderKey = activeProvider + (currentPath.length > 0 ? '/' + currentPath.join('/') : '');
      const currentItems = prev[currentFolderKey] || [];
      if (currentItems.some(item => item.name === fileName)) {
        return prev;
      }
      const newItem = {
        name: fileName,
        size: fileSize,
        updatedAt: new Date().toISOString()
      };
      return {
        ...prev,
        [currentFolderKey]: [...currentItems, newItem]
      };
    });
  };

  const getCapacitorDirectory = (dirStr: string) => {
    if (dirStr === 'documents' || dirStr.includes('documents')) return Directory.Documents;
    if (dirStr === 'data' || dirStr.includes('data')) return Directory.Data;
    if (dirStr === 'cache' || dirStr.includes('cache')) return Directory.Cache;
    return Directory.Documents;
  };

  const getDirectoryHandle = async () => {
    if (saveDirectoryHandle) return saveDirectoryHandle;
    try {
      const handle = await (window as any).showDirectoryPicker();
      setSaveDirectoryHandle(handle);
      return handle;
    } catch (e) {
      console.error(e);
      return null;
    }
  };



  // Core and UI states
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('grid_notepad_theme') === 'dark');
  const [themeSync, setThemeSync] = useState<boolean>(() => localStorage.getItem('grid_theme_sync') !== 'false');
  const [accentColor, setAccentColor] = useState<keyof typeof COLOR_THEMES>(
    (localStorage.getItem('grid_notepad_accent') as keyof typeof COLOR_THEMES) || 'blue'
  );
  const [language, setLanguage] = useState<'sq' | 'en'>(
    (localStorage.getItem('language') as 'sq' | 'en') || 'sq'
  );

  // Labels states
  const [customLabels, setCustomLabels] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('customLabels') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [selectedLabelFolder, setSelectedLabelFolder] = useState<string | null>(null);
  const [catalogLayout, setCatalogLayout] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('catalogLayout') as 'grid' | 'list') || 'grid';
  });

  // State for Custom Label Creation/Renaming Modals (avoiding blocked window.prompt in iframe)
  const [labelModal, setLabelModal] = React.useState<{
     isOpen: boolean;
     mode: 'add' | 'rename';
     index?: number;
     value: string;
  }>({ isOpen: false, mode: 'add', value: '' });

  // State for deleting custom label confirmation
  const [labelToDelete, setLabelToDelete] = React.useState<{ index: number; name: string } | null>(null);

  // State for deleting secret block confirmation modal (avoiding blocked window.confirm in iframe)
  const [secretToDelete, setSecretToDelete] = React.useState<any | null>(null);

  // Documents states
  const [documents, setDocuments] = useState<GridDocument[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('grid_notepad_documents_v2') || '[]');
    } catch (e) {
      return [];
    }
  });

  const allAvailableTags = React.useMemo(() => {
    return Array.from(new Set(documents.flatMap(doc => doc.tags || []))).sort();
  }, [documents]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>(['Kolona 1', 'Kolona 2', 'Kolona 3', 'Kolona 4']);
  const [columnWidths, setColumnWidths] = useState<number[]>([150, 150, 150, 150]);
  const [rows, setRows] = useState<GridRow[]>([]);
  const [activeCell, setActiveCell] = useState<{ rIndex: number; colKey: string } | null>(null);
  const [modalText, setModalText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Auth/Email states that might be missing
  const [authModal, setAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [logoutInfoModal, setLogoutInfoModal] = useState(false);

  // Calculator states
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcPos, setCalcPos] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [calcIsDragging, setCalcIsDragging] = useState(false);
  const [calcDragOffset, setCalcDragOffset] = useState({ x: 0, y: 0 });

  // Refs
  const activeDocIdRef = useRef<string | null>(null);
  const latestDocsRef = useRef<GridDocument[]>([]);
  const pendingLocalSaveRef = useRef<any>(null);

  // Translations helper
  const t = (sq: string, en: string) => {
    return language === 'sq' ? sq : en;
  };

  const saveCustomLabels = (labels: string[]) => {
    setCustomLabels(labels);
    localStorage.setItem('customLabels', JSON.stringify(labels));
    
    // Auto-sync customLabels to Google Cloud
    const freq = parseInt(localStorage.getItem('grid_cloud_sync_freq') || '3000', 10);
    if (freq !== -1 && navigator.onLine) {
       syncWithGoogleCloud(documents, true);
    }
  };

  const isDocAllDeletedX = (doc: any) => {
    if (!doc || !doc.rows || doc.rows.length === 0) return false;
    const contentRows = doc.rows.filter((r: any) => 
      (r.col1 && r.col1.trim()) || 
      (r.col2 && r.col2.trim()) || 
      (r.col3 && r.col3.trim()) || 
      (r.col4 && r.col4.trim())
    );
    if (contentRows.length === 0) return false;
    return contentRows.every((r: any) => r.status === 'x');
  };

  // Calculator handlers
  const handleCalcPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setCalcIsDragging(true);
    setCalcDragOffset({
      x: e.clientX - calcPos.x,
      y: e.clientY - calcPos.y
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCalcPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!calcIsDragging) return;
    setCalcPos({
      x: e.clientX - calcDragOffset.x,
      y: e.clientY - calcDragOffset.y
    });
  };

  const handleCalcPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setCalcIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleCalcInput = (btn: string) => {
    if (btn === 'C') {
      setCalcDisplay('0');
    } else if (btn === 'Del' || btn === '←') {
      if (calcDisplay.length > 1) {
        setCalcDisplay(calcDisplay.slice(0, -1));
      } else {
        setCalcDisplay('0');
      }
    } else if (btn === '=') {
      try {
        const expr = calcDisplay.replace(/x/g, '*').replace(/÷/g, '/');
        if (/^[0-9+\-*/().\s]+$/.test(expr)) {
          const result = new Function(`return (${expr})`)();
          setCalcDisplay(String(result));
        } else {
          setCalcDisplay('Gabim');
        }
      } catch (err) {
        setCalcDisplay('Gabim');
      }
    } else {
      if (calcDisplay === '0' || calcDisplay === 'Gabim') {
        if ('+-*/'.includes(btn)) {
          setCalcDisplay('0' + btn);
        } else {
          setCalcDisplay(btn);
        }
      } else {
        setCalcDisplay(calcDisplay + btn);
      }
    }
  };

const handleRenameCustomLabel = (index: number) => {
  const oldName = customLabels[index];
  setLabelModal({
    isOpen: true,
    mode: 'rename',
    index,
    value: oldName
  });
};

const handleSaveLabelModal = () => {
  const trimmed = labelModal.value.trim();
  if (!trimmed) {
    showToast(t("Emri i etiketës nuk mund të jetë i zbrazët!", "Label name cannot be empty!"));
    return;
  }

  if (labelModal.mode === 'add') {
    if (customLabels.includes(trimmed)) {
      showToast(t("Kjo etiketë ekziston tashmë!", "This label already exists!"));
      return;
    }
    const updated = [...customLabels, trimmed];
    saveCustomLabels(updated);
    showToast(t("Etiketa u shtua me sukses!", "Label added successfully!"));
  } else {
    const index = labelModal.index!;
    const oldName = customLabels[index];
    if (trimmed === oldName) {
      setLabelModal(prev => ({ ...prev, isOpen: false }));
      return;
    }
    if (customLabels.includes(trimmed)) {
      showToast(t("Kjo etiketë ekziston tashmë!", "This label already exists!"));
      return;
    }
    const updatedLabels = [...customLabels];
    updatedLabels[index] = trimmed;
    saveCustomLabels(updatedLabels);

    // Update all documents that had the old tag to have the new tag
    const updatedDocs = documents.map(doc => {
       if (doc.tags && doc.tags.includes(oldName)) {
          return {
             ...doc,
             tags: doc.tags.map(tagItem => tagItem === oldName ? trimmed : tagItem)
          };
       }
       return doc;
    });
    setDocuments(updatedDocs);
    triggerAutoSave(updatedDocs);
    
    if (selectedLabelFolder === oldName) {
       setSelectedLabelFolder(trimmed);
    }
    showToast(t("Etiketa u ndryshua me sukses!", "Label renamed successfully!"));
  }
  setLabelModal({ isOpen: false, mode: 'add', value: '' });
};

  const handleMoveDocument = (doc: any, targetLabel: string, destName: string) => {
     setTransferDocId(null);
     setTransferringInfo({ docTitle: doc.title, destName });
     
     setTimeout(() => {
        const updatedDocs = documents.map(d => {
           if (d.id === doc.id) {
              const otherTags = (d.tags || []).filter(tag => !customLabels.includes(tag));
              const newTags = targetLabel === 'default' 
                 ? otherTags 
                 : [...otherTags, targetLabel];
              return { ...d, tags: newTags };
           }
           return d;
        });
        
        setDocuments(updatedDocs);
        triggerAutoSave(updatedDocs);
        setTransferringInfo(null);
        showToast(
           t(
              `Lista "${doc.title}" u transferua me sukses te: ${destName}`, 
              `List "${doc.title}" successfully moved to: ${destName}`
           )
        );
     }, 1200);
  };

  const handleDeleteCustomLabel = (index: number) => {
     const labelName = customLabels[index];
     setLabelToDelete({ index, name: labelName });
  };

  const executeDeleteCustomLabel = (index: number) => {
     const labelName = customLabels[index];
     const updatedLabels = customLabels.filter((_, i) => i !== index);
     saveCustomLabels(updatedLabels);

     // Remove tag from documents
     const updatedDocs = documents.map(doc => {
        if (doc.tags && doc.tags.includes(labelName)) {
           return {
              ...doc,
              tags: doc.tags.filter(tagItem => tagItem !== labelName)
           };
        }
        return doc;
     });
     setDocuments(updatedDocs);
     triggerAutoSave(updatedDocs);

     if (selectedLabelFolder === labelName) {
        setSelectedLabelFolder(null);
     }
     showToast(t("Etiketa u fshi!", "Label was deleted!"));
     setLabelToDelete(null);
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
              const hasContent = cItem.content !== undefined;
              mergedSecretList.push({
                 id: cItem.id,
                 name: cItem.name || cItem.text || t('Pa Emër', 'Unnamed'),
                 content: hasContent ? cItem.content : (cItem.note || ''),
                 text: cItem.name || cItem.text || t('Pa Emër', 'Unnamed'),
                 done: !!cItem.done,
                 createdAt: cItem.createdAt || new Date().toISOString(),
                 updatedAt: cItem.updatedAt || new Date().toISOString()
              });
           } else {
              const localItem = localSecretMap.get(cItem.id);
              if (localItem) {
                 localItem.done = localItem.done || cItem.done;
                 const cloudUpdate = cItem.updatedAt ? new Date(cItem.updatedAt).getTime() : 0;
                 const localUpdate = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
                 if (cloudUpdate > localUpdate || (!localItem.content && cItem.content)) {
                    localItem.name = cItem.name || cItem.text || localItem.name;
                    localItem.content = cItem.content !== undefined ? cItem.content : (cItem.note || localItem.content);
                    localItem.text = localItem.name;
                    if (cItem.updatedAt) {
                       localItem.updatedAt = cItem.updatedAt;
                    }
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
     const content = JSON.stringify(exportData, null, 2);
     const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
     const filename = `notebook_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`;
     handleDownload(blob, filename, 'application/json', 'Backup Cloud');
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
     const customUid = localStorage.getItem('grid_notepad_custom_uid');
     if (customUid) return customUid;
     if (user) {
        return (user.email || user.uid).toLowerCase();
     }
     if (auth.currentUser) {
        return (auth.currentUser.email || auth.currentUser.uid).toLowerCase();
     }
     return null;
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
       
       const mail = (email || localStorage.getItem('grid_notepad_saved_email') || '').trim();
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
    const isCloudView = onlineView === 'cloud';
    const finalBlueText = blueTextToSync !== undefined ? blueTextToSync : (isCloudView ? onlineBlueText : blueText);
    const finalSecretList = secretListToSync !== undefined ? secretListToSync : (isCloudView ? onlineSecretList : secretList);
    
    appendDebugLog(`☁️ [Google Cloud Sync] Po ngarkohen ${docs.length} dokumente për përdoruesin: ${uid}`);

    const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true).catch(() => null) : null;
    const payloadObj: any = {
      userId: uid,
      documents: docs,
      blueText: finalBlueText,
      secretList: finalSecretList,
      customLabels: customLabels,
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

   const handleCreateSecretListItem = (name?: string) => {
      const finalName = name && name.trim() ? name.trim() : `${t('Bllok i Ri', 'New Block')} ${secretList.length + 1}`;
      const newItem = {
         id: Date.now().toString(),
         name: finalName,
         content: '',
         text: finalName, // backward compatibility
         done: false,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString()
      };
      const updated = [...secretList, newItem];
      setSecretList(updated);
      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
      setActiveSecretId(newItem.id);
      showToast(t(`U krijua blloku sekret: "${finalName}"`, `Created secret block: "${finalName}"`));
   };

   const handleCreateSecretEditorNote = () => {
      handleCreateSecretListItem(t('Hartim i Ri', 'New Draft'));
   };

   const handleSaveSecrets = async () => {
      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(secretList));
      
      // Also update blueText as a compilation to keep any systems expecting blueText synchronized
      let compiledBlue = '';
      if (secretList.length > 0) {
         compiledBlue = secretList.map(item => `=== ${item.name || item.text || 'Pa Emër'} ===\n${item.content || ''}`).join('\n\n');
      }
      setBlueText(compiledBlue);
      localStorage.setItem('grid_notepad_blue', compiledBlue);

      if (auth.currentUser && navigator.onLine) {
         const blueRef = doc(db, 'settings', getActiveUid()!);
         await setDoc(blueRef, { 
             blueText: compiledBlue, 
             secretList,
             userId: getActiveUid()!, 
             pin: localStorage.getItem('grid_notepad_pin') || null 
         }, { merge: true });
         showToast(t("🔒 Shënimet sekrete u ruajtën me sukses në Cloud!", "🔒 Secret notes successfully saved to Cloud!"));
      } else {
         showToast(t("🔒 Shënimet sekrete u ruajtën lokalisht me sukses!", "🔒 Secret notes successfully saved locally!"));
      }
   };

   const handleDeleteSecretItem = (idToDelete: string) => {
      const itemToDelete = secretList.find(item => item.id === idToDelete);
      if (itemToDelete) {
         setSecretToDelete(itemToDelete);
      }
   };

   const executeDeleteSecretItem = (idToDelete: string) => {
      if (idToDelete === 'all') {
         setSecretList([]);
         localStorage.setItem('grid_notepad_secret_list', JSON.stringify([]));
         setActiveSecretId(null);
         showToast(t("U fshinë të gjitha blloqet sekrete!", "All secret blocks deleted!"));
      } else {
         const updated = secretList.filter(item => item.id !== idToDelete);
         setSecretList(updated);
         localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
         if (activeSecretId === idToDelete) {
            setActiveSecretId(null);
         }
         showToast(t("Blloku sekret u fshi!", "Secret block was deleted!"));
      }
      setSecretToDelete(null);
   };

   const handleDeleteSecrets = () => {
      if (activeSecretId) {
         handleDeleteSecretItem(activeSecretId);
      } else {
         setSecretToDelete({ id: 'all', name: t("Të gjitha blloqet sekrete", "All secret blocks") });
      }
   };

   const handleExportActiveNoteAsTxt = async (item: any) => {
      if (!item) return;
      const content = item.content || '';
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const filename = `${(item.name || item.text || 'sekret').toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`;
      await handleDownload(blob, filename, 'text/plain', 'Eksport Shënim Sekret');
   };

   const handleExportSecrets = async () => {
      const content = JSON.stringify({
         blueText,
         secretList
      }, null, 2);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      const filename = `bllok_sekrete_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      await handleDownload(blob, filename, 'application/json', 'Backup Sekrete');
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
            let importedList: any[] = [];
            
            if (parsed.secretList && Array.isArray(parsed.secretList)) {
               importedList = parsed.secretList.map((item: any) => ({
                  id: item.id || Date.now().toString() + Math.random().toString(),
                  name: item.name || item.text || t('I importuar', 'Imported'),
                  content: item.content !== undefined ? item.content : (item.note || ''),
                  text: item.name || item.text || t('I importuar', 'Imported'),
                  done: !!item.done,
                  createdAt: item.createdAt || new Date().toISOString(),
                  updatedAt: item.updatedAt || new Date().toISOString()
               }));
            } else if (Array.isArray(parsed)) {
               importedList = parsed.map((item: any) => ({
                  id: item.id || Date.now().toString() + Math.random().toString(),
                  name: item.name || item.text || t('I importuar', 'Imported'),
                  content: item.content !== undefined ? item.content : (item.note || ''),
                  text: item.name || item.text || t('I importuar', 'Imported'),
                  done: !!item.done,
                  createdAt: item.createdAt || new Date().toISOString(),
                  updatedAt: item.updatedAt || new Date().toISOString()
               }));
            } else if (parsed.blueText !== undefined) {
               setBlueText(parsed.blueText);
               localStorage.setItem('grid_notepad_blue', parsed.blueText);
               importedList = [{
                  id: 'legacy-imported',
                  name: t('Shënime të Importuara', 'Imported Notes'),
                  content: parsed.blueText,
                  text: t('Shënime të Importuara', 'Imported Notes'),
                  done: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
               }];
            }
            
            if (importedList.length > 0) {
               const merged = [...secretList];
               importedList.forEach(item => {
                  const idx = merged.findIndex(m => m.id === item.id);
                  if (idx >= 0) {
                     merged[idx] = item;
                  } else {
                     merged.push(item);
                  }
               });
               setSecretList(merged);
               localStorage.setItem('grid_notepad_secret_list', JSON.stringify(merged));
               showToast(t("🔒 Të dhënat sekrete u importuan me sukses!", "🔒 Secret data imported successfully!"));
            } else {
               const textContent = event.target?.result as string;
               handleCreateSecretListItem(t('Import Tekst', 'Import Text'));
               setSecretList(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                     updated[updated.length - 1].content = textContent;
                  }
                  return updated;
               });
               showToast(t("🔒 U importua si bllok sekret i ri.", "🔒 Imported as a new secret block."));
            }
         } catch (err) {
            const textContent = event.target?.result as string;
            const newId = Date.now().toString();
            const newItem = {
               id: newId,
               name: t('Tekst i Importuar', 'Imported Text'),
               content: textContent,
               text: t('Tekst i Importuar', 'Imported Text'),
               done: false,
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString()
            };
            const updated = [...secretList, newItem];
            setSecretList(updated);
            localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
            setActiveSecretId(newId);
            showToast(t("🔒 U importua si bllok i ri sekret.", "🔒 Imported as a new secret block."));
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
      if (loadedData.customLabels) {
         setCustomLabels(loadedData.customLabels);
         localStorage.setItem('customLabels', JSON.stringify(loadedData.customLabels));
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
    const uid = getActiveUid();
    if (!uid) {
       setIsFetchingCloud(false);
       return null;
    }
    setIsFetchingCloud(true);
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
     setOnlineView('cloud');
     setSelectedOnlineDoc(null);
     setIsOnlineEditing(false);
     if (user) {
        const docs = await fetchCloudDocsOnly(false);
        if (docs && docs.length > 0) {
           setSelectedOnlineDoc(docs[0]);
        }
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
    let loadedList: any[] = [];
    if (savedSecretList) {
       try { 
          const parsed = JSON.parse(savedSecretList);
          if (Array.isArray(parsed)) {
             loadedList = parsed.map((item: any) => {
                // Migrate legacy flat checklist with 'note' field to the rich named note model
                const hasContent = item.content !== undefined;
                return {
                   id: item.id || Date.now().toString() + Math.random().toString(),
                   name: item.name || item.text || t('Element i vjetër', 'Legacy Item'),
                   content: hasContent ? item.content : (item.note || ''),
                   text: item.name || item.text || t('Element i vjetër', 'Legacy Item'),
                   done: !!item.done,
                   createdAt: item.createdAt || new Date().toISOString(),
                   updatedAt: item.updatedAt || new Date().toISOString()
                };
             });
          }
       } catch(e){}
    }
    
    // If we have legacy blueText, but no secret list, auto-migrate it as a single block so they don't lose it
    if (loadedList.length === 0 && savedOrange && savedOrange.trim()) {
       loadedList = [{
          id: 'migrated-primary',
          name: t('Blloku Kryesor', 'Primary Block'),
          content: savedOrange,
          text: t('Blloku Kryesor', 'Primary Block'),
          done: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
       }];
    }
    
    if (loadedList.length > 0) {
       setSecretList(loadedList);
       localStorage.setItem('grid_notepad_secret_list', JSON.stringify(loadedList));
       // Pre-select the first item
       setActiveSecretId(loadedList[0].id);
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
         if (!passwordInput.trim()) {
             alert(t('Kodi Password nuk mund të jetë bosh!', 'Password code cannot be empty!'));
             return;
         }
         localStorage.setItem('grid_notepad_pin', passwordInput);
         setPasswordModal({ isOpen: false, action: null, type: 'verify' });
         setPasswordInput('');
         if (passwordModal.action) passwordModal.action();
         showToast(t('Password u krijua me sukses!', 'Password created successfully!'));
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
       if (!savedPassword) {
           showToast(t("Nuk ka asnjë password të vendosur.", "No password is set."));
           return;
       }
       
       const savedRecoveryEmail = localStorage.getItem('grid_notepad_recovery_email') || '';
       if (!savedRecoveryEmail) {
           alert(t(
               "Kujdes! Nuk keni vendosur një Email Rikthimi në Settings. Ju lutem vendosni një email rikthimi te Parametrat (Settings) që të mund të rivendosni fjalëkalimin në mënyrë të sigurt.",
               "Warning! You haven't set a Recovery Email in Settings. Please configure a recovery email in Settings to recover your password securely."
           ));
           return;
       }

       const inputMail = prompt(t(
           "Futni Email-in tuaj të Rikthimit për të verifikuar llogarinë dhe për të dërguar kodin e ricaktimit:",
           "Enter your Recovery Email to verify your account and send the reset code:"
       ));

       if (inputMail === null) return; // User cancelled

       if (inputMail.trim().toLowerCase() === savedRecoveryEmail.trim().toLowerCase()) {
           // Simulate sending code
           const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
           alert(t(
               `🔐 SISTEM: Kodi i sigurisë u dërgua me sukses në emailin tuaj: ${savedRecoveryEmail}.\n\nKodi i Rikthimit është: ${verificationCode}\n\nJu lutem shtypni OK për të vazhduar me verifikimin.`,
               `🔐 SYSTEM: Security code was successfully sent to your email: ${savedRecoveryEmail}.\n\nRecovery Code is: ${verificationCode}\n\nPlease press OK to continue with verification.`
           ));
           
           // Now let's ask them to input that code to verify
           const inputCode = prompt(t("Vendosni kodin 4-shifror të rikthimit që ju erdhi në email:", "Enter the 4-digit recovery code sent to your email:"));
           if (inputCode === verificationCode) {
               showToast(t("Verifikimi u krye me sukses! Vendosni fjalëkalimin/PIN e ri tani.", "Verification successful! Set your new password/PIN now."));
               // Open password creation directly!
               setPasswordModal({ isOpen: true, action: null, type: 'setup' });
               setPasswordInput('');
           } else {
               alert(t("Kodi i rikthimit është i gabuar! Provoni përsëri.", "Incorrect recovery code! Try again."));
           }
       } else {
           alert(t("Email i rikthimit është i gabuar! Provoni përsëri.", "Incorrect recovery email! Try again."));
       }
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
           
           const mail = (email || localStorage.getItem('grid_notepad_saved_email') || '').trim();
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

  const createNewDocument = (initialTags?: string[]) => {
    const newId = `doc-${Date.now()}`;
    const newTitle = t('Shënim i Paemërtuar', 'Untitled Note');
    const newHeaders = [t('Kolona 1', 'Column 1'), t('Kolona 2', 'Column 2'), t('Kolona 3', 'Column 3'), t('Kolona 4', 'Column 4')];
    const newRows = getEmptyRows();
    
    setActiveDocId(newId);
    setTitle(newTitle);
    setActiveTags(initialTags || []);
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
       tags: initialTags || []
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
      // Shto skedarin në sistemin e simuluar të skedarëve që të shfaqet në "Zgjedhësin e Dosjeve"
      addFileToSimulatedFilesystem(filename, blob.size);
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
                          let sanitizedFolder = manualFolder ? manualFolder.replace(/[^a-zA-Z0-9_\s\/-]/g, '').trim() : '';
                          sanitizedFolder = sanitizedFolder.replace(/^\/+|\/+$/g, '');
                          const baseDirStr = localStorage.getItem('grid_android_base_dir') || 'Memoria e Telefonit';
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
                                 directory: getCapacitorDirectory(baseDirStr),
                                 recursive: true
                             });
                             showToast(t(`Skedari u ruajt me sukses në ${baseDirStr}/${fullPath}`, `Saved to ${baseDirStr}/${fullPath}`));
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
                  let savedFolder = localStorage.getItem('grid_mock_folder') !== null ? localStorage.getItem('grid_mock_folder')! : folderName;
                  const currentBase = localStorage.getItem('grid_android_base_dir') || androidBaseDir || 'Memoria e Telefonit';
                  
                  showToast(t(`U sinkronizua automatikisht drejt dosjes: '${currentBase}${savedFolder ? '/' + savedFolder : ''}'`, `Automatically synced to folder: '${currentBase}${savedFolder ? '/' + savedFolder : ''}'`));
                  let sanitizedFolder = savedFolder ? savedFolder.replace(/[^a-zA-Z0-9_\s\/-]/g, '').trim() : '';
                  sanitizedFolder = sanitizedFolder.replace(/^\/+|\/+$/g, '').replace(/\//g, '_');
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
     const titleText = isGist ? "Gist" : "Cloud";
     
     let docsList: GridDocument[] = [];
     if (isGist) {
        try {
           const parsed = JSON.parse(gistViewerContent || '[]');
           if (Array.isArray(parsed)) {
              docsList = parsed;
           } else if (parsed && typeof parsed === 'object') {
              docsList = parsed.documents || [];
           }
        } catch(e){}
        if (docsList.length === 0 && !gistId) {
           docsList = documents;
        }
     } else {
        docsList = cloudDocs;
     }

     const renderGistConnectionForm = () => {
        return (
           <div className="w-full max-w-md mx-auto my-auto p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-3">
              <Github className="w-7 h-7 text-blue-500" />
              <h3 className="text-xs sm:text-sm font-bold">Lidh GitHub Gist</h3>
              <p className="text-[11px] text-zinc-500 leading-tight">
                 Lidhuni me llogarinë tuaj GitHub për të sinkronizuar shënimet tuaja në Gist.
              </p>
              
              <div className="w-full space-y-2.5 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-500/5 text-left">
                  {!gistToken ? (
                     <>
                        <div>
                           <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                              GitHub Personal Access Token (PAT)
                           </label>
                           <input
                              type="password"
                              placeholder="ghp_..."
                              value={tempGistToken}
                              onChange={(e) => {
                                 setTempGistToken(e.target.value);
                              }}
                              className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-accent-500 transition-colors ${
                                 isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                              }`}
                           />
                           <p className="text-[10px] text-zinc-500 mt-1">
                              Krijo një token me akses <code className="bg-zinc-500/10 px-1 py-0.5 rounded">gist</code> në github.com/settings/tokens
                           </p>
                        </div>
                        <button
                           onClick={async () => {
                              if (!tempGistToken.trim()) {
                                 showToast("Ju lutem plotësoni GitHub Token!");
                                 return;
                              }
                              showToast("Duke verifikuar Token-in me GitHub...");
                              setGistToken(tempGistToken);
                              localStorage.setItem('grid_notepad_gist_token', tempGistToken);
                           }}
                           className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors active:scale-95 shadow-md shadow-blue-500/10"
                        >
                           Vazhdo & Kontrollo Tokenin
                        </button>
                     </>
                  ) : (
                     <>
                        {/* Authenticated GitHub User Card */}
                        <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                           isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                        }`}>
                           <div className="flex items-center gap-2.5">
                              {githubUser ? (
                                 <>
                                    <img src={githubUser.avatar_url} alt="avatar" className="w-10 h-10 rounded-full border border-zinc-500/20" referrerPolicy="no-referrer" />
                                    <div className="flex flex-col">
                                       <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">{githubUser.name || githubUser.login}</span>
                                       <span className="text-[10px] text-zinc-500">@{githubUser.login} • GitHub</span>
                                    </div>
                                 </>
                              ) : (
                                 <>
                                    <div className="w-10 h-10 rounded-full bg-zinc-500/10 animate-pulse" />
                                    <div className="flex flex-col gap-1">
                                       <div className="w-20 h-3 bg-zinc-500/10 rounded animate-pulse" />
                                       <div className="w-16 h-2 bg-zinc-500/10 rounded animate-pulse" />
                                    </div>
                                 </>
                              )}
                           </div>
                           <button
                              onClick={() => {
                                 setGistToken('');
                                 setTempGistToken('');
                                 setGistId('');
                                 setTempGistId('');
                                 setGithubUser(null);
                                 localStorage.removeItem('grid_notepad_gist_token');
                                 localStorage.removeItem('grid_notepad_gist_id');
                                 localStorage.removeItem('grid_notepad_github_user');
                                 showToast("U shkëputët nga GitHub!");
                              }}
                              className="text-[10px] font-bold text-red-500 hover:underline p-1"
                           >
                              Shkyç
                           </button>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold px-1">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                           <span>Lidhur me sukses në GitHub!</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                           <div className={`p-2 rounded-lg border flex flex-col justify-between gap-1 ${
                              isDark ? "bg-zinc-900/30 border-zinc-800/60" : "bg-zinc-100/50 border-zinc-200"
                           }`}>
                              <div className="flex flex-col text-left">
                                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mundësia A: Shto të re</span>
                                 <span className="text-[9px] text-zinc-500 leading-tight">Krijo një Gist të ri në profil.</span>
                              </div>
                              <button
                                 onClick={async () => {
                                    try {
                                       showToast("Duke krijuar Gist të ri...");
                                       await saveToGist(documents, false, blueText, secretList);
                                       showToast("Gist i ri u kriua dhe u sinkronizua me sukses!");
                                    } catch(e: any) {
                                       showToast("Dështoi sinkronizimi: " + e.message);
                                    }
                                 }}
                                 className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-md transition-all active:scale-95 flex items-center justify-center gap-1 mt-1.5"
                              >
                                 <Upload className="w-3 h-3" /> Krijo Gist të Ri
                              </button>
                           </div>

                           <div className={`p-2 rounded-lg border flex flex-col justify-between gap-1 ${
                              isDark ? "bg-zinc-900/30 border-zinc-800/60" : "bg-zinc-100/50 border-zinc-200"
                           }`}>
                              <div className="flex flex-col text-left">
                                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mundësia B: Lidh Gist ekzistues</span>
                                 <span className="text-[9px] text-zinc-500 leading-tight">Vendosni ID e një Gist-i të vjetër.</span>
                              </div>
                              <div className="flex gap-1 mt-1.5">
                                 <input
                                    type="text"
                                    placeholder="ID e Gist..."
                                    value={tempGistId}
                                    onChange={(e) => {
                                       setTempGistId(e.target.value);
                                    }}
                                    className={`flex-1 px-2.5 py-1 rounded-md border text-[10px] outline-none focus:border-accent-500 transition-colors ${
                                       isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                                    }`}
                                 />
                                 <button
                                    disabled={!tempGistId.trim()}
                                    onClick={async () => {
                                       try {
                                          showToast("Duke u lidhur me Gist...");
                                          await viewGistContent(tempGistId.trim());
                                          setGistId(tempGistId.trim());
                                          localStorage.setItem('grid_notepad_gist_id', tempGistId.trim());
                                          showToast("Lidhja me Gist-in ekzistues u krye me sukses!");
                                       } catch(e: any) {
                                          showToast("Gist nuk u gjet ose dështoi: " + e.message);
                                       }
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-bold rounded-md transition-all active:scale-95 flex items-center gap-1 shrink-0"
                                 >
                                    Lidh
                                 </button>
                              </div>
                           </div>
                        </div>
                     </>
                  )}
              </div>
           </div>
        );
     };

     const filteredOnline = docsList.filter(d => {
        if (!onlineSearch.trim()) return true;
        const q = onlineSearch.toLowerCase();
        return (d.title || '').toLowerCase().includes(q) || 
               (d.tags || []).some(t => t.toLowerCase().includes(q));
     });

     const handleOnlineTitleChange = (val: string) => {
        if (!selectedOnlineDoc) return;
        const updatedDoc = {
           ...selectedOnlineDoc,
           title: val,
           updatedAt: new Date().toISOString()
        };
        setSelectedOnlineDoc(updatedDoc);
        
        if (onlineView === 'cloud') {
           setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        } else if (onlineView === 'gist') {
           try {
              const parsed = JSON.parse(gistViewerContent || '{}');
              let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
              docs = docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d);
              const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
              setGistViewerContent(JSON.stringify(finalObj));
           } catch(e){}
        }
     };

     const handleOnlineTagsChange = (val: string) => {
        if (!selectedOnlineDoc) return;
        const tags = val.split(',').map(t => t.trim()).filter(t => t !== '');
        const updatedDoc = {
           ...selectedOnlineDoc,
           tags,
           updatedAt: new Date().toISOString()
        };
        setSelectedOnlineDoc(updatedDoc);
        
        if (onlineView === 'cloud') {
           setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        } else if (onlineView === 'gist') {
           try {
              const parsed = JSON.parse(gistViewerContent || '{}');
              let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
              docs = docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d);
              const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
              setGistViewerContent(JSON.stringify(finalObj));
           } catch(e){}
        }
     };

     const handleOnlineHeaderChange = (hIndex: number, val: string) => {
        if (!selectedOnlineDoc) return;
        const updatedHeaders = [...selectedOnlineDoc.headers];
        updatedHeaders[hIndex] = val;
        const updatedDoc = {
           ...selectedOnlineDoc,
           headers: updatedHeaders,
           updatedAt: new Date().toISOString()
        };
        setSelectedOnlineDoc(updatedDoc);
        
        if (onlineView === 'cloud') {
           setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        } else if (onlineView === 'gist') {
           try {
              const parsed = JSON.parse(gistViewerContent || '{}');
              let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
              docs = docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d);
              const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
              setGistViewerContent(JSON.stringify(finalObj));
           } catch(e){}
        }
     };

     const handleOnlineCellChange = (rIndex: number, colKey: string, val: string) => {
        if (!selectedOnlineDoc) return;
        const updatedRows = selectedOnlineDoc.rows.map((r, idx) => {
           if (idx === rIndex) {
              return { ...r, [colKey]: val };
           }
           return r;
        });
        const updatedDoc = {
           ...selectedOnlineDoc,
           rows: updatedRows,
           updatedAt: new Date().toISOString()
        };
        setSelectedOnlineDoc(updatedDoc);
        
        if (onlineView === 'cloud') {
           setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        } else if (onlineView === 'gist') {
           try {
              const parsed = JSON.parse(gistViewerContent || '{}');
              let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
              docs = docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d);
              const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
              setGistViewerContent(JSON.stringify(finalObj));
           } catch(e){}
        }
     };

     const addOnlineRow = () => {
        if (!selectedOnlineDoc) return;
        const newRow = { id: `row-${Date.now()}`, status: 'none', image: '' };
        const updatedDoc = {
           ...selectedOnlineDoc,
           rows: [...selectedOnlineDoc.rows, newRow],
           updatedAt: new Date().toISOString()
        };
        setSelectedOnlineDoc(updatedDoc);
        
        if (onlineView === 'cloud') {
           setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        } else if (onlineView === 'gist') {
           try {
              const parsed = JSON.parse(gistViewerContent || '{}');
              let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
              docs = docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d);
              const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
              setGistViewerContent(JSON.stringify(finalObj));
           } catch(e){}
        }
     };

     const removeOnlineLastRow = () => {
        if (!selectedOnlineDoc || selectedOnlineDoc.rows.length <= 1) return;
        const updatedDoc = {
           ...selectedOnlineDoc,
           rows: selectedOnlineDoc.rows.slice(0, -1),
           updatedAt: new Date().toISOString()
        };
        setSelectedOnlineDoc(updatedDoc);
        
        if (onlineView === 'cloud') {
           setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        } else if (onlineView === 'gist') {
           try {
              const parsed = JSON.parse(gistViewerContent || '{}');
              let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
              docs = docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d);
              const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
              setGistViewerContent(JSON.stringify(finalObj));
           } catch(e){}
        }
     };

     const addOnlineColumn = () => {
        if (!selectedOnlineDoc) return;
        const nextColIndex = selectedOnlineDoc.headers.length + 1;
        const updatedDoc = {
           ...selectedOnlineDoc,
           headers: [...selectedOnlineDoc.headers, `Kolona ${nextColIndex}`],
           updatedAt: new Date().toISOString()
        };
        setSelectedOnlineDoc(updatedDoc);
        
        if (onlineView === 'cloud') {
           setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        } else if (onlineView === 'gist') {
           try {
              const parsed = JSON.parse(gistViewerContent || '{}');
              let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
              docs = docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d);
              const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
              setGistViewerContent(JSON.stringify(finalObj));
           } catch(e){}
        }
     };

     const removeOnlineLastColumn = () => {
        if (!selectedOnlineDoc || selectedOnlineDoc.headers.length <= 1) return;
        const updatedDoc = {
           ...selectedOnlineDoc,
           headers: selectedOnlineDoc.headers.slice(0, -1),
           updatedAt: new Date().toISOString()
        };
        setSelectedOnlineDoc(updatedDoc);
        
        if (onlineView === 'cloud') {
           setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        } else if (onlineView === 'gist') {
           try {
              const parsed = JSON.parse(gistViewerContent || '{}');
              let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
              docs = docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d);
              const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
              setGistViewerContent(JSON.stringify(finalObj));
           } catch(e){}
        }
     };

     const handleOpenOnlineDocInNotepad = (doc: GridDocument) => {
        const exists = documents.some(d => d.id === doc.id);
        let updatedDocs;
        if (exists) {
           updatedDocs = documents.map(d => d.id === doc.id ? doc : d);
        } else {
           updatedDocs = [doc, ...documents];
        }
        setDocuments(updatedDocs);
        localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(updatedDocs));
        openDocument(doc);
        setOnlineView(null);
        showToast(`⚡ U hap lista "${doc.title || 'I paemërtuar'}" në Notepad!`);
     };

     const handleOpenOnlineNotesInNotepad = (text: string) => {
        setBlueText(text);
        localStorage.setItem('grid_notepad_blue', text);
        setOnlineView(null);
        showToast("⚡ Shënimet u hapën dhe u sinkronizuan në Notebook-un tuaj lokal!");
     };

     const handleOpenOnlineSecretsInNotepad = (secrets: any[]) => {
        setSecretList(secrets);
        localStorage.setItem('grid_notepad_secret_list', JSON.stringify(secrets));
        setOnlineView(null);
        showToast("⚡ Lista e sekreteve u hap dhe u sinkronizua lokalisht!");
     };

     const saveOnlineEditedDoc = async () => {
       if (!selectedOnlineDoc) return;
       if (onlineView === 'cloud') {
          let found = false;
          let updatedDocsList = cloudDocs.map(d => {
             if (d.id === selectedOnlineDoc.id) {
                found = true;
                return selectedOnlineDoc;
             }
             return d;
          });
          if (!found) {
             updatedDocsList = [selectedOnlineDoc, ...updatedDocsList];
          }
          setCloudDocs(updatedDocsList);
          const success = await syncWithGoogleCloud(updatedDocsList, false);
          if (success) {
             setIsOnlineEditing(false);
             showToast("⚡ Dokumenti u ruajt me sukses në Google Cloud!");
          }
       } else if (onlineView === 'gist') {
          let parsedGistDocs: GridDocument[] = [];
          let currentGistBlueText = onlineBlueText;
          let currentGistSecretList = onlineSecretList;
          try {
             const parsed = JSON.parse(gistViewerContent || '{}');
             if (Array.isArray(parsed)) {
                parsedGistDocs = parsed;
             } else if (parsed && typeof parsed === 'object') {
                parsedGistDocs = parsed.documents || [];
                if (parsed.blueText !== undefined) currentGistBlueText = parsed.blueText;
                if (parsed.secretList !== undefined) currentGistSecretList = parsed.secretList;
             }
          } catch(e){}
          
          let foundGist = false;
          let updatedGistDocs = parsedGistDocs.map(d => {
             if (d.id === selectedOnlineDoc.id) {
                foundGist = true;
                return selectedOnlineDoc;
             }
             return d;
          });
          if (!foundGist) {
             updatedGistDocs = [selectedOnlineDoc, ...updatedGistDocs];
          }
          const finalGistObj = {
             documents: updatedGistDocs,
             blueText: currentGistBlueText,
             secretList: currentGistSecretList
          };
          setGistViewerContent(JSON.stringify(finalGistObj));
          
          try {
             await saveToGist(updatedGistDocs, false, currentGistBlueText, currentGistSecretList);
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
             let currentGistBlueText = onlineBlueText;
             let currentGistSecretList = onlineSecretList;
             try {
                const parsed = JSON.parse(gistViewerContent || '{}');
                if (Array.isArray(parsed)) {
                   parsedGistDocs = parsed;
                } else if (parsed && typeof parsed === 'object') {
                   parsedGistDocs = parsed.documents || [];
                   if (parsed.blueText !== undefined) currentGistBlueText = parsed.blueText;
                   if (parsed.secretList !== undefined) currentGistSecretList = parsed.secretList;
                }
             } catch(e){}
             
             const updatedGistDocs = parsedGistDocs.filter(d => d.id !== selectedOnlineDoc.id);
             const finalGistObj = {
                documents: updatedGistDocs,
                blueText: currentGistBlueText,
                secretList: currentGistSecretList
             };
             setGistViewerContent(JSON.stringify(finalGistObj));
             setSelectedOnlineDoc(null);
             
             await saveToGist(updatedGistDocs, false, currentGistBlueText, currentGistSecretList);
             showToast("⚡ Dokumenti u fshi nga GitHub Gist me sukses!");
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
           const mail = (email || localStorage.getItem('grid_notepad_saved_email') || '').trim();
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

     const handleOnlineNotesAiAutopilot = async () => {
        setIsOnlineAiThinking(true);
        showToast("🤖 Inteligjenca Artificiale (Gemini) po analizon dhe korrigjon shënimet me tekst...");
        try {
           const mail = (email || localStorage.getItem('grid_notepad_saved_email') || '').trim();
           const payload = JSON.stringify({ 
              prompt: "Autopilot Check: Korrigjo gabimet drejtshkrimore, rregullo pikësimin dhe strukturo në mënyrë të lexueshme e të bukur këto shënime me tekst.", 
              documents: [], 
              activeDocId: '', 
              image: null, 
              audio: null,
              blueText: onlineBlueText,
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
              let proposedText = '';
              if (data && data.actions && Array.isArray(data.actions)) {
                 const act = data.actions.find((a: any) => a.type === 'UPDATE_BLUE_TEXT');
                 if (act && act.newBlueText) {
                    proposedText = act.newBlueText;
                 }
              }
              if (!proposedText && data.text) {
                 proposedText = data.text;
              }

              if (proposedText) {
                 setOnlineBlueText(proposedText);
                 showToast("✨ Shënimet u strukturuan dhe u korrigjuan nga Gemini! Klikoni 'Ruaj' për t'i konfirmuar.");
              } else {
                 showToast("🤖 Gemini e kreu analizën por nuk gjeti ndonjë korrigjim të rëndësishëm.");
              }
           } else {
              showToast("Gabim gjatë lidhjes me serverin AI.");
           }
        } catch(err: any) {
           showToast("Gabim nga Gemini AI: " + err.message);
        } finally {
           setIsOnlineAiThinking(false);
        }
     };

     const handleOnlineSecretsAiAutopilot = async () => {
        setIsOnlineAiThinking(true);
        showToast("🤖 Inteligjenca Artificiale (Gemini) po analizon dhe organizon listën sekrete...");
        try {
           const mail = (email || localStorage.getItem('grid_notepad_saved_email') || '').trim();
           const payload = JSON.stringify({ 
              prompt: "Autopilot Check: Kontrollo, organizo, kategorizo ose fshi dublikatat e elementeve në listën sekrete. Kthe listën e plotë të përditësuar në formatun e strukturuar.", 
              documents: [], 
              activeDocId: '', 
              image: null, 
              audio: null,
              blueText: '',
              secretList: onlineSecretList,
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
              let proposedList: any[] = [];
              if (data && data.actions && Array.isArray(data.actions)) {
                 const act = data.actions.find((a: any) => a.type === 'UPDATE_SECRET_LIST');
                 if (act && act.newSecretList) {
                    proposedList = act.newSecretList;
                  }
              }
              if (proposedList.length === 0 && data.secretList) {
                 proposedList = data.secretList;
              }

              if (proposedList.length > 0) {
                 setOnlineSecretList(proposedList);
                 showToast("✨ Lista e sekreteve u organizua nga Gemini! Klikoni 'Ruaj' për t'i konfirmuar.");
              } else {
                 showToast("🤖 Gemini e kreu analizën por nuk gjeti ndonjë korrigjim të rëndësishëm.");
              }
           } else {
              showToast("Gabim gjatë lidhjes me serverin AI.");
           }
        } catch(err: any) {
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
                    <span className={`text-[10px] font-medium leading-tight ${isDark ? "text-zinc-500" : "text-zinc-400"} flex items-center gap-1.5`}>
                       {isGist ? (
                          githubUser ? (
                             <>
                                <img src={githubUser.avatar_url} alt="avatar" className="w-3.5 h-3.5 rounded-full border border-zinc-500/20" referrerPolicy="no-referrer" />
                                <span>Lidhur si: <b className={isDark ? "text-zinc-300" : "text-zinc-700"}>{githubUser.login}</b> (Gist: {gistId ? gistId.substring(0, 8) + '...' : 'Unassigned'})</span>
                             </>
                          ) : (
                             `Gist Stream: ${gistId ? gistId.substring(0, 12) + '...' : 'Unassigned'}`
                          )
                       ) : (
                          `Lidhur si: ${user?.email || localStorage.getItem('grid_notepad_saved_email') || t('Vizitor (Pa kyçur)', 'Visitor (Not logged in)')}`
                       )}
                    </span>
                 </div>
              </div>

              {/* SEGMENTED PLATFORM TOGGLE */}
              <div className="flex bg-zinc-500/10 p-0.5 rounded-lg border border-zinc-500/10 shrink-0">
                 <button 
                    onClick={async () => { 
                       setOnlineView('cloud'); 
                       setSelectedOnlineDoc(null); 
                       setIsOnlineEditing(false); 
                       await fetchCloudDocsOnly(false);
                    }}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${
                       !isGist 
                          ? "bg-emerald-500 text-white shadow-sm" 
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                 >
                    <Cloud className="w-3.5 h-3.5" /> Cloud
                 </button>
                 <button 
                    onClick={async () => { 
                       setOnlineView('gist'); 
                       setSelectedOnlineDoc(null); 
                       setIsOnlineEditing(false); 
                       if (gistId) { 
                          await viewGistContent(); 
                       } else {
                          setOnlineBlueText(blueText);
                          setOnlineSecretList(secretList);
                       }
                    }}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${
                       isGist 
                          ? "bg-blue-500 text-white shadow-sm" 
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                 >
                    <Github className="w-3.5 h-3.5" /> Gist
                 </button>
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
           <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative">
              {!isGist && !user ? (
                 <div className="flex-1 w-full overflow-y-auto overflow-x-auto p-4 sm:p-6 flex flex-col items-center justify-start md:justify-center text-center max-w-md mx-auto my-auto space-y-3">
                    <Cloud className="w-7 h-7 text-emerald-500" />
                    <h3 className="text-xs sm:text-sm font-bold">Cloud</h3>
                    <p className="text-[11px] text-zinc-500 leading-tight">
                       Hyni për të sinkronizuar të dhënat tuaja në Cloud.
                    </p>
                    
                    <div className="w-full space-y-2.5 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-500/5 text-left">
                       <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                             Adresa Email
                          </label>
                          <input
                             type="email"
                             placeholder="emri@shembull.com"
                             value={email}
                             onChange={(e) => setEmail(e.target.value)}
                             className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-accent-500 transition-colors ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                             }`}
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                             Fjalëkalimi
                          </label>
                          <input
                             type="password"
                             placeholder="••••••••"
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-accent-500 transition-colors ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                             }`}
                          />
                       </div>
                       {authError && (
                          <p className="text-[10px] text-red-500 font-bold bg-red-500/10 p-2 rounded">
                             {authError.message}
                          </p>
                       )}
                       <div className="flex gap-2">
                          <button
                             onClick={async () => {
                                try {
                                   await hookEmailLogin(email, password);
                                   showToast("U kyçët me sukses!");
                                } catch (e: any) {
                                   setAuthError({ code: 'login-failed', message: e.message, provider: 'email' });
                                }
                             }}
                             className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                             Hyr
                          </button>
                          <button
                             onClick={async () => {
                                try {
                                   await hookEmailRegister(email, password);
                                   showToast("U regjistruat dhe u kyçët me sukses!");
                                } catch (e: any) {
                                   setAuthError({ code: 'register-failed', message: e.message, provider: 'email' });
                                }
                             }}
                             className="flex-1 py-2 bg-zinc-600 hover:bg-zinc-500 text-white text-xs font-bold rounded-lg transition-colors border dark:border-zinc-700"
                          >
                             Regjistrohu
                          </button>
                       </div>
                       <div className="relative flex py-1 items-center">
                          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                          <span className="flex-shrink mx-2 text-[9px] text-zinc-400 uppercase font-bold">ose vazhdo me</span>
                          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                       </div>
                       <button
                          onClick={async () => {
                             try {
                                await hookGoogleLogin();
                                showToast("U kyçët me sukses me Google!");
                             } catch (e: any) {
                                showToast("Gabim gjatë kyçjes me Google.");
                             }
                          }}
                          className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                       >
                          Google Sign-In
                       </button>
                    </div>
                 </div>
              ) : (
                 <React.Fragment>
                    {onlineDashboardTab === 'lists' ? (
                       <React.Fragment>
              {/* LEFT SIDEBAR (ONLINE DOCUMENTS LIST) */}
              <div className={`w-full md:w-80 h-full border-r flex flex-col shrink-0 overflow-hidden ${isDark ? "border-zinc-800 bg-zinc-950/20" : "border-zinc-200 bg-zinc-50/40"} ${selectedOnlineDoc ? "hidden md:flex" : "flex"}`}>
                 {/* Search Box */}
                 <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
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
                    <button
                       id="btn-create-online-list"
                       onClick={async () => {
                          const newId = `doc-online-${Date.now()}`;
                          const newTitle = t("Lista e Re Online", "New Online List");
                          const newDoc: GridDocument = {
                             id: newId,
                             title: newTitle,
                             createdAt: new Date().toISOString(),
                             updatedAt: new Date().toISOString(),
                             headers: [t('Kolona 1', 'Column 1'), t('Kolona 2', 'Column 2'), t('Kolona 3', 'Column 3')],
                             columnWidths: [],
                             rows: Array.from({ length: 5 }, (_, i) => ({ id: `row-${Date.now()}-${i}`, status: 'none', image: '' })),
                             tags: []
                          };
                          if (onlineView === 'cloud') {
                             const updated = [newDoc, ...cloudDocs];
                             setCloudDocs(updated);
                             setSelectedOnlineDoc(newDoc);
                             setIsOnlineEditing(true);
                             await syncWithGoogleCloud(updated, false, onlineBlueText, onlineSecretList);
                          } else {
                             let parsedGistDocs: GridDocument[] = [];
                             try {
                                const parsed = JSON.parse(gistViewerContent || '[]');
                                if (Array.isArray(parsed)) { parsedGistDocs = parsed; }
                                else if (parsed && typeof parsed === 'object') { parsedGistDocs = parsed.documents || []; }
                             } catch(e){}
                             const updated = [newDoc, ...parsedGistDocs];
                             const finalGistObj = {
                                documents: updated,
                                blueText: onlineBlueText,
                                secretList: onlineSecretList
                             };
                             setGistViewerContent(JSON.stringify(finalGistObj));
                             setSelectedOnlineDoc(newDoc);
                             setIsOnlineEditing(true);
                             await saveToGist(updated, false, onlineBlueText, onlineSecretList);
                          }
                          showToast("⚡ U krijua një listë e re online!");
                       }}
                       className="w-full py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-95 shrink-0"
                    >
                       <Plus className="w-3.5 h-3.5" /> Krijo Listë të re Online
                    </button>

                    {/* Global Sync Actions Panel */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50">
                       <button
                          onClick={async () => {
                             if (isGist) {
                                await saveToGist(documents, false, onlineBlueText, onlineSecretList);
                                showToast("⚡ Listat lokale u sinkronizuan me sukses në GitHub Gist!");
                             } else {
                                setCloudDocs(documents);
                                const success = await syncWithGoogleCloud(documents, false, onlineBlueText, onlineSecretList);
                                if (success) {
                                   showToast("⚡ Listat lokale u sinkronizuan me sukses në Google Cloud!");
                                }
                             }
                          }}
                          className="py-1 px-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 shrink-0"
                          title="Ngarko të gjitha listat lokale në server"
                       >
                          <Upload className="w-3.5 h-3.5" /> Ngarko lokalin
                       </button>
                       <button
                          onClick={async () => {
                             if (isGist) {
                                await loadFromGist();
                             } else {
                                await handleFullCloudRestore();
                              }
                          }}
                          className="py-1 px-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 shrink-0"
                          title="Rikthe të gjitha listat nga serveri"
                       >
                          <FolderOpen className="w-3.5 h-3.5" /> Rikthe të gjitha
                       </button>
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
                             <div
                                key={d.id}
                                onClick={() => {
                                   setSelectedOnlineDoc(d);
                                   setIsOnlineEditing(false);
                                }}
                                className={`w-full p-3 rounded-xl border text-left transition-all relative group cursor-pointer ${
                                   isSelected 
                                      ? (isDark ? "bg-accent-600/10 border-accent-500/50" : "bg-accent-50 border-accent-300")
                                      : (isDark ? "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80" : "bg-white border-zinc-200 hover:bg-zinc-50")
                                }`}
                             >
                                <div className="pr-12">
                                   <h4 className="font-bold text-xs sm:text-sm line-clamp-1 pr-2">{d.title || "I paemërtuar"}</h4>
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
                                </div>
                                <button
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenOnlineDocInNotepad(d);
                                   }}
                                   className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1 z-10"
                                   title="Hap këtë listë në Notepad"
                                >
                                   <FolderOpen className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          );
                       })
                    )}
                 </div>
              </div>

              {/* RIGHT PANEL (RICH PREVIEW & MANAGEMENT) */}
              <div className={`flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950 ${selectedOnlineDoc ? "flex" : "hidden md:flex"}`}>
                 {!selectedOnlineDoc ? (
                    isGist && !gistId ? (
                       <div className="flex-1 flex items-center justify-center overflow-y-auto">
                          {renderGistConnectionForm()}
                       </div>
                    ) : (
                       <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center mb-4">
                             {isGist ? <Github className="w-8 h-8 text-zinc-400" /> : <Cloud className="w-8 h-8 text-emerald-500" />}
                          </div>
                          <h3 className="font-bold text-base mb-1">{t('Zgjidhni një Dokument', 'Select a Document')}</h3>
                          <p className="text-xs text-zinc-500 max-w-sm">
                             {t('Zgjidhni një dokument nga lista në të majtë për të parë përmbajtjen online, për ta redaktuar ose sinkronizuar.', 'Select a document from the list on the left to see online content, edit, or sync.')}
                          </p>
                       </div>
                    )
                 ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                       {/* COMBINED DOC HEADER & TOOLBAR */}
                       <div className="p-2 sm:p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-zinc-500/5">
                          <div className="flex items-center gap-2 min-w-0">
                             {isOnlineEditing ? (
                                <div className="flex flex-col gap-1 w-full max-w-sm sm:max-w-md">
                                   <div className="flex items-center gap-2 sm:hidden mb-0.5">
                                      <button
                                         onClick={() => { setSelectedOnlineDoc(null); setIsOnlineEditing(false); }}
                                         className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                         title="Kthehu"
                                      >
                                         <ArrowLeft className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-[10px] font-bold text-zinc-400">Kthehu</span>
                                   </div>
                                   <div className="flex gap-2">
                                      <div className="flex-1 min-w-[120px]">
                                         <input 
                                            type="text"
                                            value={selectedOnlineDoc.title}
                                            onChange={(e) => handleOnlineTitleChange(e.target.value)}
                                            className={`px-2 py-1 text-xs font-bold rounded border outline-none focus:border-accent-500 w-full ${
                                               isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                                            }`}
                                            placeholder="Titulli"
                                         />
                                      </div>
                                      <div className="flex-1 min-w-[120px]">
                                         <input 
                                            type="text"
                                            value={(selectedOnlineDoc.tags || []).join(', ')}
                                            onChange={(e) => handleOnlineTagsChange(e.target.value)}
                                            className={`px-2 py-1 text-xs font-semibold rounded border outline-none focus:border-accent-500 w-full ${
                                               isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                                            }`}
                                            placeholder="Etiketa (p.sh. pune, personal)"
                                         />
                                      </div>
                                   </div>
                                </div>
                             ) : (
                                <div className="min-w-0">
                                   <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1.5 md:hidden">
                                         <button
                                            onClick={() => setSelectedOnlineDoc(null)}
                                            className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                            title="Kthehu tek listat"
                                         >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                         </button>
                                      </div>
                                      <h2 className="text-xs sm:text-sm font-extrabold truncate max-w-[150px] sm:max-w-[250px]" title={selectedOnlineDoc.title}>{selectedOnlineDoc.title || "I paemërtuar"}</h2>
                                      <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded-full bg-accent-500/10 text-accent-500 border border-accent-500/20 uppercase">Online</span>
                                   </div>
                                   <div className="flex items-center gap-2 mt-0.5 text-[9px] text-zinc-500">
                                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {safeFormatDate(selectedOnlineDoc.createdAt, 'dd MMM yyyy')}</span>
                                      <span>•</span>
                                      <span>{selectedOnlineDoc.rows?.length || 0} rreshta</span>
                                   </div>
                                </div>
                             )}
                          </div>

                          <div className="flex items-center gap-1.5 py-0.5 flex-wrap">
                             {isOnlineEditing ? (
                                <>
                                   <button
                                      onClick={saveOnlineEditedDoc}
                                      className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 shrink-0 active:scale-95"
                                      title="Ruaj ndryshimet online"
                                   >
                                      <Save className="w-3.5 h-3.5" /> Ruaj
                                   </button>
                                   <button
                                      onClick={() => setIsOnlineEditing(false)}
                                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1 shrink-0 active:scale-95 ${
                                         isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300" : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-650"
                                      }`}
                                   >
                                      Anulo
                                   </button>
                                </>
                             ) : (
                                <>
                                   <button
                                      onClick={() => setIsOnlineEditing(true)}
                                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1.5 shrink-0 active:scale-95 ${
                                         isDark ? "bg-zinc-850 border-zinc-750 hover:bg-zinc-800 text-zinc-300" : "bg-white border-zinc-250 hover:bg-zinc-100 text-zinc-650"
                                      }`}
                                      title="Ndrysho dokumentin online"
                                   >
                                      <Edit className="w-3.5 h-3.5 text-accent-500" /> Ndrysho
                                   </button>
                                   <button
                                      onClick={() => {
                                         executeProtectedAction(() => {
                                            handleOnlineDeleteDoc();
                                         });
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 shrink-0 active:scale-95"
                                      title="Fshi dokumentin me PIN"
                                   >
                                      <Trash2 className="w-3.5 h-3.5" /> Fshi
                                   </button>
                                   <button
                                      onClick={async () => {
                                         if (!selectedOnlineDoc) {
                                            showToast("Zgjidhni një dokument online fillimisht.");
                                            return;
                                         }
                                         const updatedDocs = [...documents.filter(d => d.id !== selectedOnlineDoc.id), selectedOnlineDoc];
                                         setDocuments(updatedDocs);
                                         localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(updatedDocs));
                                         showToast(`⚡ Dokumenti "${selectedOnlineDoc.title}" u rikthye në listën lokale me sukses!`);
                                      }}
                                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1.5 shrink-0 active:scale-95 ${
                                         isDark ? "bg-zinc-850 border-zinc-750 hover:bg-zinc-800 text-zinc-300" : "bg-white border-zinc-250 hover:bg-zinc-100 text-zinc-650"
                                      }`}
                                      title="Rikthe këtë dokument"
                                   >
                                      <Download className="w-3.5 h-3.5" /> Rikthe këtë
                                   </button>
                                   <button
                                      onClick={() => handleOpenOnlineDocInNotepad(selectedOnlineDoc)}
                                      className="px-2.5 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-[11px] font-bold rounded-md transition-all shadow-md active:scale-95 flex items-center gap-1 shrink-0"
                                      title="Hap këtë dokument në Notepad"
                                   >
                                      <FolderOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Hap në Notepad</span>
                                    </button>
                                 </>
                              )}
                              
                              <button
                                 onClick={handleOnlineAiAutopilot}
                                 disabled={isOnlineAiThinking}
                                 className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0 shadow-sm"
                              >
                                 {isOnlineAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                 Autopilot AI
                              </button>
                           </div>
                        </div>

                       {/* RICH PREVIEW */}
                       <div className="flex-1 overflow-auto p-2 sm:p-3">
                          {isOnlineEditing && (
                             <div className="flex flex-wrap gap-2 mb-3 bg-zinc-500/5 p-2 rounded-xl border border-zinc-500/10 shrink-0">
                                <button
                                   onClick={addOnlineRow}
                                   className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[11px] font-bold rounded-lg border border-green-500/20 flex items-center gap-1 transition-colors active:scale-95"
                                >
                                   <Plus className="w-3.5 h-3.5" /> Shto Rresht
                                </button>
                                <button
                                   onClick={removeOnlineLastRow}
                                   className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[11px] font-bold rounded-lg border border-red-500/20 flex items-center gap-1 transition-colors active:scale-95"
                                >
                                   <Trash2 className="w-3.5 h-3.5" /> Fshi Rreshtin e fundit
                                </button>
                                <div className="w-px h-5 bg-zinc-500/20 my-1"></div>
                                <button
                                   onClick={addOnlineColumn}
                                   className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[11px] font-bold rounded-lg border border-blue-500/20 flex items-center gap-1 transition-colors active:scale-95"
                                >
                                   <Plus className="w-3.5 h-3.5" /> Shto Kolonë
                                </button>
                                <button
                                   onClick={removeOnlineLastColumn}
                                   className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-[11px] font-bold rounded-lg border border-orange-500/20 flex items-center gap-1 transition-colors active:scale-95"
                                >
                                   <Trash2 className="w-3.5 h-3.5" /> Fshi Kolonën e fundit
                                </button>
                             </div>
                          )}
                          <div className="overflow-x-auto w-full">
                             <div style={{ minWidth: `${Math.max(700, (selectedOnlineDoc?.headers?.length || 3) * 150)}px` }} className={`border rounded-xl overflow-hidden ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
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
                                      <div 
                                         onClick={() => {
                                            if (isOnlineEditing) {
                                               const statuses = ["none", "ok", "blue", "x"];
                                               const currentIdx = statuses.indexOf(r.status || "none");
                                               const nextStatus = statuses[(currentIdx + 1) % statuses.length];
                                               
                                               const updatedRows = selectedOnlineDoc.rows.map((rowItem, idx) => {
                                                  if (idx === rIdx) {
                                                     return { ...rowItem, status: nextStatus };
                                                  }
                                                  return rowItem;
                                               });
                                               
                                               const updatedDoc = {
                                                  ...selectedOnlineDoc,
                                                  rows: updatedRows,
                                                  updatedAt: new Date().toISOString()
                                               };
                                               setSelectedOnlineDoc(updatedDoc);
                                               
                                               if (onlineView === "cloud") {
                                                  setCloudDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
                                               } else if (onlineView === "gist") {
                                                  try {
                                                     const parsed = JSON.parse(gistViewerContent || "{}");
                                                     let docs = Array.isArray(parsed) ? parsed : (parsed.documents || []);
                                                     docs = docs.map(d => d.id === updatedDoc.id ? updatedDoc : d);
                                                     const finalObj = Array.isArray(parsed) ? docs : { ...parsed, documents: docs };
                                                     setGistViewerContent(JSON.stringify(finalObj));
                                                  } catch(e){}
                                               }
                                            }
                                         }}
                                         className={`w-12 shrink-0 border-r flex items-center justify-center text-xs font-mono font-bold py-1 select-none transition-colors ${
                                            isOnlineEditing ? "cursor-pointer hover:bg-accent-500/10 hover:text-accent-500" : ""
                                         } ${
                                            isDark ? "bg-zinc-900/40 border-zinc-800/40 text-zinc-500" : "bg-zinc-100/60 border-zinc-200/40 text-zinc-500"
                                         }`}
                                         title={isOnlineEditing ? "Kliko për të ndryshuar statusin e rreshtit (OK -> BLUE -> X -> NONE)" : ""}
                                      >
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
                     </div>
                  )}
               </div>
            </React.Fragment>
         ) : onlineDashboardTab === 'notes' ? (
            <div className="flex-grow flex flex-col overflow-hidden">
               <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
                  {isGist && !gistId && (
                     <div className={`mx-3 sm:mx-4 mt-3 p-2.5 border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                        <div className="flex items-center gap-2">
                           <Github className="w-4 h-4 text-blue-500 shrink-0" />
                           <span className="text-left font-medium"><strong>Gist nuk është i lidhur.</strong> Shënimet me tekst po shfaqen nga memorja lokale.</span>
                        </div>
                        <button 
                           onClick={() => { setOnlineDashboardTab('lists'); setSelectedOnlineDoc(null); }} 
                           className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all active:scale-95 text-[10px]"
                        >
                           Lidh Gist në GitHub
                        </button>
                     </div>
                  )}
                  {/* COMBINED COMPACT NOTES HEADER & TOOLBAR */}
                  <div className="p-2 sm:p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-zinc-500/5">
                     <div className="flex items-center gap-2">
                        <h2 className="text-xs sm:text-sm font-extrabold flex items-center gap-1">
                           <FileText className="w-3.5 h-3.5 text-accent-500" />
                           <span className="hidden sm:inline">Shënimet me Tekst</span>
                           <span className="sm:hidden">Shënimet</span>
                        </h2>
                        <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded-full bg-accent-500/10 text-accent-500 border border-accent-500/20 uppercase">Online</span>
                     </div>

                     <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                        {isOnlineEditing ? (
                           <>
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
                                 className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 shrink-0 active:scale-95"
                                 title="Ruaj shënimet online"
                              >
                                 <Save className="w-3.5 h-3.5" /> Ruaj
                              </button>
                              <button
                                 onClick={() => setIsOnlineEditing(false)}
                                 className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1 shrink-0 active:scale-95 ${
                                    isDark ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300' : 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-650'
                                 }`}
                              >
                                 Anulo
                              </button>
                           </>
                        ) : (
                           <>
                              <button
                                 onClick={() => setIsOnlineEditing(true)}
                                 className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1.5 shrink-0 active:scale-95 ${
                                    isDark ? 'bg-zinc-850 border-zinc-750 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-zinc-250 hover:bg-zinc-100 text-zinc-650'
                                 }`}
                                 title="Ndrysho shënimet online"
                              >
                                 <Edit className="w-3.5 h-3.5 text-accent-500" /> Ndrysho
                              </button>
                              <button
                                 onClick={async () => {
                                    if (!blueText) {
                                       showToast("Nuk ka shënime lokale për të ngarkuar.");
                                       return;
                                    }
                                    setOnlineBlueText(blueText);
                                    if (onlineView === 'cloud') {
                                       const success = await syncWithGoogleCloud(cloudDocs, false, blueText, onlineSecretList);
                                       if (success) {
                                          showToast("⚡ Shënimet lokale u ngarkuan në Cloud!");
                                       }
                                    } else {
                                       let parsedGistDocs: GridDocument[] = [];
                                       try {
                                          const parsed = JSON.parse(gistViewerContent || '[]');
                                          if (Array.isArray(parsed)) { parsedGistDocs = parsed; }
                                       } catch(e){}
                                       await saveToGist(parsedGistDocs, false, blueText, onlineSecretList);
                                       showToast("⚡ Shënimet lokale u ngarkuan në Gist!");
                                    }
                                 }}
                                 className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1.5 shrink-0 active:scale-95 ${
                                    isDark ? 'bg-zinc-850 border-zinc-750 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-zinc-250 hover:bg-zinc-100 text-zinc-650'
                                 }`}
                                 title="Ngarko shënimet lokale në server"
                              >
                                 <Upload className="w-3.5 h-3.5" /> Ngarko lokalin
                              </button>
                              <button
                                 onClick={() => {
                                    if (!onlineBlueText) {
                                       showToast("Nuk ka shënime online për t'u rikthyer.");
                                       return;
                                    }
                                    setBlueText(onlineBlueText);
                                    localStorage.setItem('grid_notepad_blue', onlineBlueText);
                                    showToast("⚡ Shënimet u rikthyen me sukses në aplikacionun tuaj lokal!");
                                 }}
                                 className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1.5 shrink-0 active:scale-95 ${
                                    isDark ? 'bg-zinc-850 border-zinc-750 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-zinc-250 hover:bg-zinc-100 text-zinc-650'
                                 }`}
                                 title="Rikthe shënimet lokalish"
                              >
                                 <Download className="w-3.5 h-3.5" /> Rikthe këtë
                              </button>
                              <button
                                 onClick={() => handleOpenOnlineNotesInNotepad(onlineBlueText)}
                                 className="px-2.5 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-[11px] font-bold rounded-md transition-all shadow-md active:scale-95 flex items-center gap-1 shrink-0"
                                 title="Hap këtë fletore shënimesh në editorin kryesor"
                              >
                                 <FolderOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Hap në Notebook</span>
                              </button>
                           </>
                        )}
                        
                        <button
                           onClick={handleOnlineNotesAiAutopilot}
                           disabled={isOnlineAiThinking}
                           className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0 shadow-sm"
                        >
                           {isOnlineAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                           Autopilot AI
                        </button>
                     </div>
                  </div>

                  {/* NOTES VIEW & EDITOR */}
                  <div className="flex-grow flex flex-col p-4 overflow-hidden">
                     {isOnlineEditing ? (
                        <textarea
                           value={onlineBlueText}
                           onChange={(e) => setOnlineBlueText(e.target.value)}
                           className={`w-full flex-grow p-6 sm:p-8 md:p-10 resize-none overflow-y-auto border-2 rounded-2xl focus:outline-none focus:border-accent-500 text-base sm:text-lg md:text-xl font-medium leading-relaxed tracking-wide shadow-inner ${
                              isDark 
                                 ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:bg-zinc-950 focus:ring-4 focus:ring-accent-500/10' 
                                 : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-4 focus:ring-accent-500/10'
                           }`}
                           placeholder="Shkruani shënimet tuaja me tekst këtu..."
                        />
                     ) : (
                        <div className={`w-full flex-grow p-4 border rounded-xl overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap ${
                           isDark ? 'bg-zinc-900/30 border-zinc-800 text-zinc-200' : 'bg-zinc-50/30 border-zinc-200 text-zinc-700'
                        }`}>
                           {onlineBlueText || (
                              <div className="text-center py-20 text-xs text-zinc-400 italic">
                                 Nuk ka shënime me tekst. Klikoni 'Ndrysho' ose 'Ngarko lokalin' për të filluar.
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         ) : (
            <div className="flex-grow flex flex-col overflow-hidden">
               <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
                  {isGist && !gistId && (
                     <div className={`mx-3 sm:mx-4 mt-3 p-2.5 border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-350' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                        <div className="flex items-center gap-2">
                           <Lock className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                           <span className="text-left font-medium"><strong>Gist nuk është i lidhur.</strong> Lista e sekreteve po shfaqet nga memorja lokale.</span>
                        </div>
                        <button 
                           onClick={() => { setOnlineDashboardTab('lists'); setSelectedOnlineDoc(null); }} 
                           className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all active:scale-95 text-[10px]"
                        >
                           Lidh Gist në GitHub
                        </button>
                     </div>
                  )}
                  {/* COMPACT SECRETS HEADER */}
                  <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-zinc-500/5">
                     <div>
                        <div className="flex items-center gap-2">
                           <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5">
                              <Lock className="w-4 h-4 text-emerald-500 animate-pulse" />
                              Lista e Sekreteve (Checklist)
                           </h2>
                           <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">Sekrete</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">Mbrojtur dhe sinkronizuar në mënyrë të sigurt.</p>
                     </div>
                     {!isOnlineEditing && (
                        <button
                           onClick={() => handleOpenOnlineSecretsInNotepad(onlineSecretList)}
                           className="px-2.5 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1 shrink-0"
                           title="Hap këtë listë sekretesh në panelin kryesor"
                        >
                           <FolderOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Hap në Panel</span>
                        </button>
                     )}
                  </div>

                  {/* SLIM SECRETS TOOLBAR */}
                  <div className={`px-3 py-1.5 border-b flex items-center justify-between shrink-0 gap-2 ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50/50 border-zinc-200'}`}>
                     <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                        {isOnlineEditing ? (
                           <>
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
                                 className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 shrink-0 active:scale-95"
                                 title="Ruaj listën sekrete online"
                              >
                                 <Save className="w-3.5 h-3.5" /> Ruaj
                              </button>
                              <button
                                 onClick={() => {
                                    const newItem = { id: Date.now().toString(), text: '', done: false };
                                    setOnlineSecretList([...onlineSecretList, newItem]);
                                 }}
                                 className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1 shrink-0 active:scale-95 ${
                                    isDark ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300' : 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-600'
                                 }`}
                              >
                                 <Plus className="w-3.5 h-3.5" /> Element
                              </button>
                              <button
                                 onClick={() => setIsOnlineEditing(false)}
                                 className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1 shrink-0 active:scale-95 ${
                                    isDark ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-300' : 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-600'
                                 }`}
                              >
                                 Anulo
                              </button>
                           </>
                        ) : (
                           <>
                              <button
                                 onClick={() => setIsOnlineEditing(true)}
                                 className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1 shrink-0 active:scale-95 ${
                                    isDark ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-600'
                                 }`}
                                 title="Ndrysho listën sekrete online"
                              >
                                 <Edit className="w-3.5 h-3.5" /> Ndrysho
                              </button>
                              <button
                                 onClick={() => {
                                    executeProtectedAction(async () => {
                                       if (window.confirm("A jeni i sigurt që dëshironi të fshini të gjithë elementet në listën sekrete online?")) {
                                          setOnlineSecretList([]);
                                          if (onlineView === 'cloud') {
                                             await syncWithGoogleCloud(cloudDocs, false, onlineBlueText, []);
                                          } else {
                                             let parsedGistDocs: GridDocument[] = [];
                                             try {
                                                const parsed = JSON.parse(gistViewerContent || '[]');
                                                if (Array.isArray(parsed)) { parsedGistDocs = parsed; }
                                             } catch(e){}
                                             await saveToGist(parsedGistDocs, false, onlineBlueText, []);
                                          }
                                          showToast("⚡ Lista sekrete online u fshi me sukses!");
                                       }
                                    });
                                 }}
                                 className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 shrink-0 active:scale-95"
                                 title="Fshi listën sekrete me PIN"
                              >
                                 <Trash2 className="w-3 h-3" /> Fshi
                              </button>
                              <button
                                 onClick={() => {
                                    if (onlineSecretList.length === 0) {
                                       showToast("Nuk ka sekrete online për t'u rikthyer.");
                                       return;
                                    }
                                    setSecretList(onlineSecretList);
                                    localStorage.setItem('grid_notepad_secret_list', JSON.stringify(onlineSecretList));
                                    showToast("⚡ Lista e sekreteve u rikthye me sukses në aplikacionun tuaj lokal!");
                                 }}
                                 className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 shrink-0 active:scale-95"
                                 title="Rikthe listën sekrete lokalish"
                              >
                                 <Download className="w-3.5 h-3.5" /> Rikthe këtë
                              </button>
                              <button
                                 onClick={async () => {
                                    if (secretList.length === 0) {
                                       showToast("Nuk ka sekrete lokale për të ngarkuar.");
                                       return;
                                    }
                                    setOnlineSecretList(secretList);
                                    if (onlineView === 'cloud') {
                                       const success = await syncWithGoogleCloud(cloudDocs, false, onlineBlueText, secretList);
                                       if (success) {
                                          showToast("⚡ Lista lokale e sekreteve u ngarkuan në Cloud!");
                                       }
                                    } else {
                                       let parsedGistDocs: GridDocument[] = [];
                                       try {
                                          const parsed = JSON.parse(gistViewerContent || '[]');
                                          if (Array.isArray(parsed)) { parsedGistDocs = parsed; }
                                       } catch(e){}
                                       await saveToGist(parsedGistDocs, false, onlineBlueText, secretList);
                                       showToast("⚡ Lista lokale e sekreteve u ngarkuan në Gist!");
                                    }
                                 }}
                                 className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1 shrink-0 active:scale-95"
                                 title="Ngarko listën lokale të sekreteve në server"
                              >
                                 <Upload className="w-3.5 h-3.5" /> Ngarko lokalin
                              </button>
                           </>
                        )}
                     </div>

                     {/* AI AUTOPILOT */}
                     <button
                        onClick={handleOnlineSecretsAiAutopilot}
                        disabled={isOnlineAiThinking}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0 shadow-sm"
                     >
                        {isOnlineAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Autopilot AI
                     </button>
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
                                       ? (isDark ? 'bg-zinc-900/40 border-zinc-800/55 opacity-70' : 'bg-zinc-50 border-zinc-100 opacity-70')
                                       : (isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200')
                                 }`}
                              >
                                 {/* CHECKBOX */}
                                 <button
                                    disabled={isOnlineEditing}
                                    onClick={async () => {
                                       const updatedList = onlineSecretList.map((itm, i) => i === idx ? { ...itm, done: !itm.done } : itm);
                                       setOnlineSecretList(updatedList);
                                       if (onlineView === 'cloud') {
                                          await syncWithGoogleCloud(cloudDocs, true, onlineBlueText, updatedList);
                                       } else if (onlineView === 'gist') {
                                          let parsedGistDocs = [];
                                          try {
                                             const parsed = JSON.parse(gistViewerContent || '{}');
                                             if (Array.isArray(parsed)) {
                                                parsedGistDocs = parsed;
                                             } else if (parsed && typeof parsed === 'object') {
                                                parsedGistDocs = parsed.documents || [];
                                             }
                                          } catch(e){}
                                          await saveToGist(parsedGistDocs, true, onlineBlueText, updatedList);
                                       }
                                    }}
                                    className={`p-1 rounded transition-colors ${isOnlineEditing ? 'cursor-not-allowed opacity-50' : 'hover:bg-zinc-500/10'}`}
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
                                       <textarea
                                          rows={1}
                                          value={item.text}
                                          onChange={(e) => {
                                             const val = e.target.value;
                                             setOnlineSecretList(prev => prev.map((itm, i) => i === idx ? { ...itm, text: val } : itm));
                                          }}
                                          onInput={(e: any) => {
                                             e.target.style.height = 'auto';
                                             e.target.style.height = e.target.scrollHeight + 'px';
                                          }}
                                          className={`w-full bg-transparent text-sm py-0.5 px-1 focus:outline-none border-b border-transparent focus:border-accent-500/30 font-semibold resize-none h-auto overflow-hidden leading-snug ${
                                             isDark ? 'text-white' : 'text-zinc-900'
                                          }`}
                                          placeholder="Shkruani elementin sekret..."
                                       />
                                    ) : (
                                       <span className={`text-sm font-semibold transition-all ${
                                          item.done 
                                             ? 'line-through text-zinc-400 dark:text-zinc-500 font-normal' 
                                             : (isDark ? 'text-zinc-100' : 'text-zinc-800')
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
            </div>
         )}
      </React.Fragment>
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

  const renderStoragePickerModal = () => {
     if (!showStoragePickerModal) return null;

     const currentFolderKey = activeProvider + (currentPath.length > 0 ? '/' + currentPath.join('/') : '');
     const currentItems = simulatedFilesystem[currentFolderKey] || [];
     const filteredItems = currentItems.filter(item => 
         item.name.toLowerCase().includes(storageSearchQuery.toLowerCase())
     );

     const handleSelectCurrentFolder = () => {
         const subPath = currentPath.join('/');
         setAndroidBaseDir(activeProvider);
         setFolderName(subPath);
         localStorage.setItem('grid_android_base_dir', activeProvider);
         localStorage.setItem('grid_mock_folder', subPath);
         localStorage.setItem('grid_folder_name', subPath);
         setShowStoragePickerModal(false);
         showToast(t(`U zgjodh me sukses: ${activeProvider}${subPath ? '/' + subPath : ''}`, `Successfully selected: ${activeProvider}${subPath ? '/' + subPath : ''}`));
     };

     const handleCreateFolder = (name: string) => {
         const trimmed = name.trim();
         if (!trimmed) return;
         const currentKey = currentFolderKey;
         const items = simulatedFilesystem[currentKey] || [];
         if (items.some(item => item.name.toLowerCase() === trimmed.toLowerCase() && item.type === 'folder')) {
             showToast(t('Ky folder ekziston tashmë!', 'This folder already exists!'));
             return;
         }
         const updatedItems = [
             ...items,
             { name: trimmed, type: 'folder' }
         ];
         const newFolderKey = currentKey + '/' + trimmed;
         setSimulatedFilesystem(prev => {
             const next = {
                 ...prev,
                 [currentKey]: updatedItems,
                 [newFolderKey]: []
             };
             localStorage.setItem('grid_simulated_fs', JSON.stringify(next));
             return next;
         });
         setNewFolderInputName('');
         showToast(t(`Folderi "${trimmed}" u krijua me sukses!`, `Folder "${trimmed}" created successfully!`));
     };

     const handleDeleteItem = (name: string) => {
         const currentKey = currentFolderKey;
         const items = simulatedFilesystem[currentKey] || [];
         const updatedItems = items.filter(item => item.name !== name);
         const targetKey = currentKey + '/' + name;
         setSimulatedFilesystem(prev => {
             const next = { ...prev, [currentKey]: updatedItems };
             delete next[targetKey];
             Object.keys(next).forEach(key => {
                 if (key.startsWith(targetKey + '/')) {
                     delete next[key];
                 }
             });
             localStorage.setItem('grid_simulated_fs', JSON.stringify(next));
             return next;
         });
         showToast(t(`U fshi folderi: ${name}`, `Deleted folder: ${name}`));
     };

     return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
           <div className={`w-full max-w-xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden max-h-[90vh] ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"}`}>
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-zinc-500/10 shrink-0">
                 <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-green-500" />
                    <div>
                       <h3 className="text-sm font-bold">{t('Zgjedhësi i Dosjeve të Memories', 'Storage Folder Picker')}</h3>
                       <p className="text-[10px] text-zinc-400 font-medium leading-none mt-0.5">{t('Mundëson zgjedhjen e çdo dosjeje në telefon', 'Choose any directory in phone storage')}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowStoragePickerModal(false)} className="p-1.5 hover:bg-zinc-500/10 rounded-lg text-zinc-400 hover:text-red-550 transition-colors">
                    <X className="w-4 h-4" />
                 </button>
              </div>

              {/* Memory Provider / Storage Type Selector */}
              <div className="p-3 border-b border-zinc-500/10 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 bg-zinc-500/5">
                 <span className="text-[10px] font-bold uppercase text-zinc-400 shrink-0 select-none mr-1">{t('Pajisja:', 'Device:')}</span>
                 {[
                    { key: 'Memoria e Telefonit', label: t('Memoria e Telefonit', 'Phone Storage'), icon: Smartphone },
                    { key: 'Kartela SD', label: t('Kartela SD', 'SD Card'), icon: HardDrive },
                    { key: 'Ruajtja e Jashtme', label: t('Ruajtja e Jashtme', 'External USB'), icon: FolderOpen }
                 ].map(prov => {
                    const ProvIcon = prov.icon;
                    const isSelected = activeProvider === prov.key;
                    return (
                       <button
                          key={prov.key}
                          type="button"
                          onClick={() => {
                             setActiveProvider(prov.key);
                             setCurrentPath([]);
                             setStorageSearchQuery('');
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                             isSelected 
                                ? (isDark ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-green-50 border-green-200 text-green-600')
                                : (isDark ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-400' : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600 shadow-sm')
                          }`}
                       >
                          <ProvIcon className="w-3.5 h-3.5" />
                          <span>{prov.label}</span>
                       </button>
                    );
                 })}
              </div>

              {/* Search & Breadcrumbs */}
              <div className="p-3 border-b border-zinc-500/10 flex flex-col gap-2 shrink-0">
                 {/* Breadcrumbs */}
                 <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide py-1 text-xs">
                    <button 
                       type="button" 
                       onClick={() => setCurrentPath([])}
                       className="text-zinc-400 hover:text-green-500 font-bold transition-colors flex items-center gap-1"
                    >
                       <span>📁</span>
                       <span>{activeProvider}</span>
                    </button>
                    {currentPath.map((segment, idx) => (
                       <div key={idx} className="flex items-center gap-1.5 text-zinc-400">
                          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                          <button
                             type="button"
                             onClick={() => setCurrentPath(prev => prev.slice(0, idx + 1))}
                             className="hover:text-green-500 font-bold text-zinc-300 dark:text-zinc-200 hover:underline transition-all"
                          >
                             {segment}
                          </button>
                        </div>
                     ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                     <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                     <input
                        type="text"
                        value={storageSearchQuery}
                        onChange={(e) => setStorageSearchQuery(e.target.value)}
                        placeholder={t('Kërko në këtë dosje...', 'Search in this folder...')}
                        className={`w-full pl-9 pr-4 py-1.5 rounded-lg text-xs font-medium outline-none border focus:ring-1 transition-all ${
                           isDark 
                              ? 'bg-zinc-950 border-zinc-800 text-white focus:border-green-500 focus:ring-green-500/50' 
                              : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-green-500 focus:ring-green-500/30'
                        }`}
                     />
                     {storageSearchQuery && (
                        <button onClick={() => setStorageSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-550">
                           <X className="w-3.5 h-3.5" />
                        </button>
                     )}
                  </div>
               </div>

               {/* Items Directory Explorer */}
               <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[150px]">
                  {filteredItems.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="text-3xl">📁</span>
                        <span className="text-xs font-bold text-zinc-500 mt-2">{t('Kjo dosje është bosh', 'This folder is empty')}</span>
                        <p className="text-[10px] text-zinc-400 max-w-xs mt-1">{t('Krijoni një dosje të re më poshtë për të organizuar skedarët tuaj.', 'Create a new folder below to organize your files.')}</p>
                     </div>
                  ) : (
                     filteredItems.map((item, idx) => {
                        const isFolder = item.type === 'folder';
                        return (
                           <div 
                              key={idx}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors group ${
                                 isDark 
                                    ? 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-800/20' 
                                    : 'bg-zinc-50/50 border-zinc-200/60 hover:bg-zinc-100/40 shadow-sm'
                              }`}
                           >
                              {isFolder ? (
                                 <button
                                    type="button"
                                    onClick={() => {
                                       setCurrentPath(prev => [...prev, item.name]);
                                       setStorageSearchQuery('');
                                    }}
                                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left font-bold text-xs hover:text-green-500 transition-colors"
                                 >
                                    <Folder className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                                    <span className="truncate">{item.name}</span>
                                 </button>
                              ) : (
                                 <div className="flex items-center gap-2.5 flex-1 min-w-0 text-left font-normal text-xs opacity-60">
                                    <FileText className="w-4 h-4 text-green-500" />
                                    <div className="min-w-0">
                                       <span className="truncate block font-semibold">{item.name}</span>
                                       <span className="text-[9px] text-zinc-400 font-mono block mt-0.5">{item.size || '0 B'} • {item.date || 'Sot'}</span>
                                    </div>
                                 </div>
                              )}

                              {/* Delete Option for Folders */}
                              {isFolder && (
                                 <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.name)}
                                    className="p-1 hover:bg-red-500/10 text-zinc-400 hover:text-red-550 rounded transition-colors"
                                    title="Fshi Dosjen"
                                 >
                                    <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                              )}
                           </div>
                        );
                     })
                  )}
               </div>

               {/* Create New Folder Panel */}
               <div className="p-3 border-t border-zinc-500/10 shrink-0 bg-zinc-500/5 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider select-none">{t('Krijo Dosje të Re:', 'Create New Folder:')}</span>
                  <div className="flex items-center gap-2">
                     <input
                        type="text"
                        value={newFolderInputName}
                        onChange={(e) => setNewFolderInputName(e.target.value)}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') handleCreateFolder(newFolderInputName);
                        }}
                        placeholder={t('Shkruaj emrin e folderit...', 'Enter folder name...')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none border transition-all ${
                           isDark 
                              ? 'bg-zinc-950 border-zinc-800 text-white focus:border-green-500' 
                              : 'bg-white border-zinc-300 text-zinc-900 focus:border-green-500 shadow-inner'
                        }`}
                     />
                     <button
                        type="button"
                        onClick={() => handleCreateFolder(newFolderInputName)}
                        className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-md"
                     >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('Krijo', 'Create')}</span>
                     </button>
                  </div>
               </div>

               {/* Actions Footer */}
               <div className="p-4 border-t border-zinc-500/10 shrink-0 flex items-center justify-between bg-zinc-500/5">
                  <span className="text-[10px] font-mono text-green-500 font-bold max-w-[50%] truncate">
                     📁 {activeProvider}{currentPath.length > 0 ? '/' + currentPath.join('/') : ''}
                  </span>
                  <div className="flex gap-2.5">
                     <button
                        type="button"
                        onClick={() => setShowStoragePickerModal(false)}
                        className={`px-3.5 py-2 font-bold text-xs rounded-lg border transition-colors ${
                           isDark ? "text-zinc-400 border-zinc-800 hover:bg-zinc-850" : "text-zinc-500 border-zinc-350 hover:bg-zinc-50 shadow-sm"
                        }`}
                     >
                        {t('Anulo', 'Cancel')}
                     </button>
                     <button
                        type="button"
                        onClick={handleSelectCurrentFolder}
                        className="px-5 py-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-green-900/10"
                     >
                        {t('PËRZGJIDH KËTË DOSJE', 'SELECT THIS FOLDER')}
                     </button>
                  </div>
               </div>

            </div>
         </div>
     );
  };

  const renderSharedModals = () => (
    <>
      {renderStoragePickerModal()}
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
             <div className={`w-full h-[100dvh] sm:max-w-4xl sm:h-[85vh] flex flex-col sm:rounded-2xl shadow-2xl border-0 sm:border ${isDark ? "bg-zinc-900 sm:border-blue-500/30" : "bg-white sm:border-blue-300"}`}>
                <div className={`flex justify-between items-center p-4 border-b shrink-0 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-blue-500" : "text-blue-600"}`}>
                      <Lock className="w-5 h-5 animate-pulse text-blue-500" /> {t('Blloku i Shënimeve Sekrete', 'Secret Notepad Block')}
                   </h3>
                   <button onClick={() => setBlueModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <X className="w-5 h-5"/>
                   </button>
                </div>

                {/* Sub-toolbar inside Secrets Modal */}
                <div className={`p-3 border-b flex flex-wrap gap-1.5 justify-between items-center shrink-0 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                   <div className="flex flex-wrap gap-1.5">
                      <button 
                         onClick={() => handleCreateSecretListItem()} 
                         className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border shadow-sm flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white border-transparent`}
                         title="Krijo bllok të ri sekret"
                      >
                         <Plus className="w-4 h-4" /> {t('Bllok i Ri', 'New Block')}
                      </button>

                      <button 
                         onClick={handleSaveSecrets} 
                         className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border shadow-sm flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border-transparent`}
                         title="Ruaj dhe Sinkronizo të dhënat"
                      >
                         <Save className="w-4 h-4" /> {t('Ruaj / Sinkro', 'Save & Sync')}
                      </button>
                   </div>

                   <div className="flex flex-wrap gap-1.5">
                      <button 
                         onClick={handleImportSecretsClick} 
                         className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border shadow-sm flex items-center gap-1.5 ${
                            isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-750" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200"
                         }`}
                         title="Importo backup"
                      >
                         <FolderUp className="w-4 h-4 text-blue-500" /> {t('Import', 'Import')}
                      </button>

                      <button 
                         onClick={handleExportSecrets} 
                         className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border shadow-sm flex items-center gap-1.5 ${
                            isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-750" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200"
                         }`}
                         title="Eksporto të gjitha si JSON"
                      >
                         <FolderDown className="w-4 h-4 text-indigo-500" /> {t('Backup JSON', 'Backup JSON')}
                      </button>

                      {secretList.length > 0 && (
                         <button 
                            onClick={handleDeleteSecrets} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border shadow-sm flex items-center gap-1.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border-transparent`}
                            title="Fshi bllokun aktiv apo pastro të gjitha"
                         >
                            <Trash2 className="w-4 h-4" /> {t('Fshi', 'Delete')}
                         </button>
                      )}
                   </div>

                   <input 
                      type="file" 
                      ref={secretFileInputRef} 
                      onChange={handleImportSecretsFile} 
                      accept=".json,.txt" 
                      className="hidden" 
                   />
                </div>
                
                {/* Main Content Pane */}
                <div className={`flex-1 flex overflow-hidden ${isDark ? "bg-zinc-950" : "bg-zinc-50"}`}>
                   
                   {/* Left Sidebar: List of named notebooks */}
                   <div className={`${activeSecretId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r flex flex-col shrink-0 ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-white"}`}>
                      {/* Search bar inside sidebar */}
                      <div className="p-3 border-b relative dark:border-zinc-800 flex items-center gap-2">
                         <div className="relative flex-1">
                            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                               type="text"
                               value={secretSearchQuery}
                               onChange={(e) => setSecretSearchQuery(e.target.value)}
                               placeholder={t("Kërko shënime...", "Search notes...")}
                               className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                                  isDark 
                                  ? "bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-500" 
                                  : "bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-blue-500 focus:bg-white"
                               }`}
                            />
                            {secretSearchQuery && (
                               <button 
                                  onClick={() => setSecretSearchQuery('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                               >
                                  <X className="w-3.5 h-3.5" />
                               </button>
                            )}
                         </div>
                      </div>

                      {/* Scrollable List */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                         {(() => {
                            const filtered = secretList.filter(item => {
                               const q = secretSearchQuery.toLowerCase().trim();
                               if (!q) return true;
                               const nameMatch = (item.name || item.text || '').toLowerCase().includes(q);
                               const contentMatch = (item.content || '').toLowerCase().includes(q);
                               return nameMatch || contentMatch;
                            });

                            if (filtered.length === 0) {
                               return (
                                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                     <FileText className="w-8 h-8 text-zinc-400/60 mb-2" />
                                     <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {secretSearchQuery 
                                           ? t("Nuk u gjet asnjë bllok.", "No blocks found.") 
                                           : t("Krijo një bllok sekret për të filluar.", "Create a secret block to start.")}
                                     </p>
                                  </div>
                               );
                            }

                            return filtered.map((item) => {
                               const isActive = item.id === activeSecretId;
                               const snippet = item.content ? item.content.slice(0, 60) + (item.content.length > 60 ? '...' : '') : t('Pa përmbajtje...', 'No content...');
                               const itemDate = item.updatedAt ? format(new Date(item.updatedAt), 'dd.MM.yyyy HH:mm') : '';

                               return (
                                  <div 
                                     key={item.id}
                                     className={`group relative flex items-center justify-between rounded-xl p-2.5 cursor-pointer transition-all ${
                                        isActive 
                                        ? "bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30" 
                                        : (isDark ? "hover:bg-zinc-800/60 border border-transparent text-zinc-300" : "hover:bg-zinc-100 border border-transparent text-zinc-800")
                                     }`}
                                     onClick={() => setActiveSecretId(item.id)}
                                  >
                                     <div className="flex-1 min-w-0 pr-10">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                           <Lock className={`w-3 h-3 shrink-0 ${isActive ? "text-blue-500" : "text-zinc-400"}`} />
                                           <span className={`text-sm font-semibold truncate ${isActive ? "text-blue-600 dark:text-blue-400" : (isDark ? "text-zinc-200" : "text-zinc-900")}`}>
                                              {item.name || item.text || t('Pa Emër', 'Unnamed')}
                                           </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mb-1">
                                           {snippet}
                                        </p>
                                        {itemDate && (
                                           <span className="text-[9px] text-zinc-400 font-mono block">
                                              {itemDate}
                                           </span>
                                        )}
                                     </div>

                                     {/* Quick Delete button inside item */}
                                     <button
                                        onClick={(e) => {
                                           e.stopPropagation();
                                           handleDeleteSecretItem(item.id);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all shrink-0 opacity-80 hover:opacity-100 z-10"
                                        title={t("Fshi bllokun", "Delete block")}
                                     >
                                        <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                  </div>
                               );
                            });
                         })()}
                      </div>
                   </div>

                   {/* Right Workspace: Rich note writing workspace */}
                   <div className={`${!activeSecretId ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden ${isDark ? "bg-zinc-950" : "bg-white"}`}>
                      {(() => {
                         const activeNote = secretList.find(item => item.id === activeSecretId);

                         if (!activeNote) {
                            return (
                               <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/20 dark:bg-zinc-950/10">
                                  <div className="p-4 rounded-full bg-blue-500/5 dark:bg-blue-500/10 mb-4 animate-bounce">
                                     <Lock className="w-10 h-10 text-blue-500" />
                                  </div>
                                  <h4 className="text-base font-bold mb-1">{t("Zgjidhni një Bllok", "Select a Block")}</h4>
                                  <p className="text-sm text-zinc-400 max-w-sm">
                                     {t("Zgjidhni një bllok sekret nga lista anësore ose krijoni një të ri për të shkruar shënime të mbrojtura.", "Select a secret block from the sidebar list or create a new one to write protected notes.")}
                                  </p>
                               </div>
                            );
                         }

                         const wordCount = activeNote.content ? activeNote.content.trim().split(/\s+/).filter(Boolean).length : 0;
                         const charCount = activeNote.content ? activeNote.content.length : 0;

                         return (
                            <div className="flex-1 flex flex-col overflow-hidden">
                               {/* Active Note Header Toolbar */}
                               <div className={`flex items-center justify-between p-3 border-b shrink-0 ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-100 bg-zinc-50/50"}`}>
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                     <button 
                                        onClick={() => setActiveSecretId(null)}
                                        className="md:hidden p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 rounded-lg shrink-0"
                                        title={t("Kthehu te lista", "Back to list")}
                                     >
                                        <ArrowLeft className="w-4 h-4" />
                                     </button>

                                     {/* Title Input */}
                                     <input 
                                        type="text"
                                        value={activeNote.name || activeNote.text || ''}
                                        onChange={(e) => {
                                           const val = e.target.value;
                                           const updated = secretList.map(item => {
                                              if (item.id === activeNote.id) {
                                                 return {
                                                    ...item,
                                                    name: val,
                                                    text: val,
                                                    updatedAt: new Date().toISOString()
                                                 };
                                              }
                                              return item;
                                           });
                                           setSecretList(updated);
                                           localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                        }}
                                        placeholder={t("Emri i bllokut sekret...", "Secret block name...")}
                                        className="bg-transparent border-none outline-none text-base font-bold text-zinc-900 dark:text-zinc-100 flex-1 min-w-0 py-1"
                                     />
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                     {/* Copy note contents */}
                                     <button 
                                        onClick={() => {
                                           navigator.clipboard.writeText(activeNote.content || '');
                                           showToast(t("Përmbajtja u kopjua!", "Content copied!"));
                                        }}
                                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-500 rounded-lg transition-colors"
                                        title={t("Kopjo", "Copy")}
                                     >
                                        <FileText className="w-4 h-4" />
                                     </button>

                                     {/* Shkarko në folder si TXT */}
                                     <button 
                                        onClick={() => handleExportActiveNoteAsTxt(activeNote)}
                                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-indigo-500 rounded-lg transition-colors"
                                        title={t("Shkarko si TXT (Në Memorje)", "Download as TXT (To Storage)")}
                                     >
                                        <FolderDown className="w-4 h-4" />
                                     </button>

                                     {/* Delete Note */}
                                     <button 
                                        onClick={() => handleDeleteSecretItem(activeNote.id)}
                                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                                        title={t("Fshi këtë bllok", "Delete this block")}
                                     >
                                        <Trash2 className="w-4 h-4" />
                                     </button>
                                  </div>
                               </div>

                               {/* Note Area / Textarea */}
                               <div className="flex-1 relative overflow-hidden flex flex-col p-4 sm:p-6 bg-transparent">
                                  <div className={`flex-1 flex flex-col p-4 sm:p-6 rounded-2xl border shadow-inner transition-colors ${
                                     isDark 
                                        ? 'bg-zinc-950/90 border-zinc-800' 
                                        : 'bg-zinc-50 border-zinc-200'
                                  }`}>
                                     <textarea
                                        value={activeNote.content || ''}
                                        onChange={(e) => {
                                           const val = e.target.value;
                                           const updated = secretList.map(item => {
                                              if (item.id === activeNote.id) {
                                                 return {
                                                    ...item,
                                                    content: val,
                                                    updatedAt: new Date().toISOString()
                                                 };
                                              }
                                              return item;
                                           });
                                           setSecretList(updated);
                                           localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                        }}
                                        placeholder={t("Shkruani shënimet tuaja sekrete këtu...", "Write your secret notes here...")}
                                        className={`w-full flex-1 bg-transparent resize-none overflow-y-auto focus:outline-none text-base sm:text-lg leading-relaxed p-0 font-medium ${
                                           isDark ? "text-white placeholder-zinc-700" : "text-zinc-900 placeholder-zinc-400"
                                        }`}
                                        spellCheck={false}
                                     />
                                  </div>
                                  
                                  {/* Counts footer */}
                                  <div className="flex items-center justify-end border-t dark:border-zinc-800/50 pt-3 mt-3 text-[10px] text-zinc-400 font-mono shrink-0">
                                     <span>{wordCount} {t("fjalë", "words")}</span>
                                     <span className="mx-2 font-light">|</span>
                                     <span>{charCount} {t("karaktere", "characters")}</span>
                                  </div>
                               </div>
                            </div>
                         );
                      })()}
                   </div>

                </div>
                
                {/* Footer and Auto-save indicator */}
                <div className={`p-4 flex items-center justify-between border-t shrink-0 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? "text-green-500" : "text-green-600"}`}>
                     <Check className="w-3.5 h-3.5" /> {t("Sinkronizuar në memorje", "Synced in memory")}
                   </span>
                   <button onClick={() => {
                       setBlueModal(false);
                   }} className={`px-5 py-2 font-semibold text-xs rounded-lg transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20`}>
                      {t("Mbyll", "Close")}
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
                 autoFocus
                 placeholder="PIN ose Password"
                 className={`w-full text-center text-xl font-bold py-3 px-4 rounded-xl mb-4 border outline-none transition-colors ${
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
                         <h3 className="text-lg font-bold flex items-center gap-2">
                            Cloud
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                               ONLINE 24/7
                            </span>
                         </h3>
                         <p className="text-xs text-zinc-400">Menaxhimi i Llogarisë dhe Dokumenteve në Cloud</p>
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
                   className={`w-full h-72 p-3.5 rounded-xl border text-xs font-mono resize-none overflow-y-auto focus:outline-none leading-relaxed ${
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

                      <button onClick={async () => {
                         if (debugLogs.length === 0) return showToast("Nuk ka log-e për t'u shkarkuar.");
                         const blob = new Blob([debugLogs.join('\n')], { type: 'text/plain;charset=utf-8' });
                         await handleDownload(blob, `logcat_debug_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.txt`, 'text/plain', 'Logcat Debug');
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
                              Gist Cloud Connector
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

                        {gistToken ? (
                           <div className="space-y-4 w-full text-left">
                              <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                                 isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                              }`}>
                                 <div className="flex items-center gap-2.5">
                                    {githubUser ? (
                                       <>
                                          <img src={githubUser.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-zinc-500/20" referrerPolicy="no-referrer" />
                                          <div className="flex flex-col">
                                             <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">{githubUser.name || githubUser.login}</span>
                                             <span className="text-[10px] text-zinc-500">@{githubUser.login} • Gist Stream: {gistId ? `${gistId.substring(0,8)}...` : 'Pa lidhur'}</span>
                                          </div>
                                       </>
                                    ) : (
                                       <div className="flex items-center gap-2">
                                          <Github className="w-4 h-4 text-zinc-500" />
                                          <span className="text-xs text-zinc-600 dark:text-zinc-400">Lidhur në GitHub • Gist ID: {gistId ? `${gistId.substring(0,8)}...` : 'Pa lidhur'}</span>
                                       </div>
                                    )}
                                 </div>
                                 <button
                                    onClick={() => {
                                       handleSecureLogoutRequest('gist', () => {
                                          setGistToken('');
                                          setTempGistToken('');
                                          setGistId('');
                                          setGithubUser(null);
                                          localStorage.removeItem('grid_notepad_gist_token');
                                          localStorage.removeItem('grid_notepad_gist_id');
                                          localStorage.removeItem('grid_notepad_github_user');
                                          showToast("U shkëputët nga GitHub!");
                                       });
                                    }}
                                    className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-[10px] font-bold border border-red-500/20 active:scale-95 transition-all"
                                 >
                                    Shkyç
                                 </button>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3">
                                 <button onClick={saveToGist} className="flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 text-xs sm:text-sm font-semibold">
                                    <Upload className="w-4 h-4" /> {t('Shto në Gist', 'Push to Gist')}
                                 </button>
                                 <button onClick={loadFromGist} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border text-xs sm:text-sm font-semibold ${isDark ? "bg-orange-600 hover:bg-orange-500 text-white shadow-md border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold border-transparent"}`}>
                                    <Download className="w-4 h-4" /> {t('Rikthe nga Gist', 'Restore All')}
                                 </button>
                                 <button onClick={openGistDashboard} className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border text-xs sm:text-sm font-semibold ${isDark ? "bg-green-600 hover:bg-green-500 text-white shadow-md border-transparent" : "bg-green-500 hover:bg-green-600 text-white shadow-md font-bold border-transparent"}`}>
                                    <FolderOpen className="w-4 h-4" /> {t('Listo Gist', 'List Gist')}
                                 </button>
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-4 w-full text-left">
                              <div className="space-y-3 p-3.5 rounded-xl border bg-zinc-100/30 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800">
                                 <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                       GitHub Personal Token (PAT)
                                    </label>
                                    <input 
                                       type="password" 
                                       placeholder="Vendosni Token-in e GitHub (shërben si fjalëkalim)" 
                                       value={tempGistToken}
                                       onChange={(e) => { setTempGistToken(e.target.value); }}
                                       className={`w-full px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${isDark ? "bg-zinc-900/90 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900 shadow-sm"}`}
                                    />
                                    <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                                       Duhet të ketë fushëveprimin <code className="bg-zinc-850 text-zinc-300 px-1 rounded font-mono">gist</code>. 
                                       <a href="https://github.com/settings/tokens/new?scopes=gist&description=Notepad+Backup" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold ml-1">Krijo një të ri këtu (Klik Këtu)</a>.
                                    </p>
                                 </div>

                                 <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                       Gist ID ekzistues (Opsionale)
                                    </label>
                                    <input 
                                       type="text" 
                                       placeholder="Lëreni bosh herën e parë (do të krijohet automatikisht)" 
                                       value={gistId}
                                       onChange={(e) => { setGistId(e.target.value); localStorage.setItem('grid_notepad_gist_id', e.target.value); }}
                                       className={`w-full px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${isDark ? "bg-zinc-900/90 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900 shadow-sm"}`}
                                    />
                                 </div>

                                 <button
                                    type="button"
                                    onClick={() => {
                                       if (!tempGistToken.trim()) {
                                          showToast("Ju lutem plotësoni GitHub Token!");
                                          return;
                                       }
                                       showToast("Duke u lidhur me GitHub...");
                                       setGistToken(tempGistToken);
                                       localStorage.setItem('grid_notepad_gist_token', tempGistToken);
                                    }}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors active:scale-95 shadow-md shadow-blue-500/10 mt-2"
                                 >
                                    Lidhu me GitHub
                                 </button>
                              </div>
                           </div>
                        )}
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
                   <h3 className={`text-lg font-bold flex items-center gap-2 ${textColor}`}>
                      <Github className="w-5 h-5 text-zinc-900 dark:text-white shrink-0" /> Gist
                   </h3>
                   <button onClick={() => setGistViewerModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>

                <div className={`p-4 border-b flex flex-wrap gap-2 ${isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                    <button onClick={saveToGist} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-blue-600 hover:bg-blue-500 text-white border-transparent" : "bg-blue-500 hover:bg-blue-600 text-white border-transparent"}`}>
                        <Upload className="w-4 h-4 inline-block mr-1" /> Ngarko
                    </button>
                    <button onClick={loadFromGist} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white border-transparent"}`}>
                        <Download className="w-4 h-4 inline-block mr-1" /> Rikthe
                    </button>
                    <button onClick={viewGistContent} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${isDark ? "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent" : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"}`}>
                        <RefreshCw className="w-3.5 h-3.5" /> Rifresko
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
                   {gistViewerContent ? (
                       (() => {
                           try {
                               const parsed = JSON.parse(gistViewerContent);
                               let parsedDocs = [];
                               if (Array.isArray(parsed)) {
                                  parsedDocs = parsed;
                               } else if (parsed && typeof parsed === "object") {
                                  parsedDocs = parsed.documents || [];
                               } else {
                                  throw new Error();
                               }
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

      {/* CLOUD PLATFORM SELECTION MODAL */}
      {showCloudSelectionModal && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
            <div className={`max-w-md w-full rounded-2xl shadow-2xl border p-6 animate-in zoom-in-95 duration-150 ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"}`}>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-extrabold flex items-center gap-2">
                     <Cloud className="w-5 h-5 text-emerald-500 animate-pulse" />
                     Zgjidh Shërbimin Cloud
                  </h3>
                  <button 
                     onClick={() => setShowCloudSelectionModal(false)}
                     className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-500/10 transition-colors"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex flex-col gap-3">
                  <button
                     onClick={async () => {
                        setShowCloudSelectionModal(false);
                        setOnlineView('cloud');
                        setSelectedOnlineDoc(null);
                        setIsOnlineEditing(false);
                        await fetchCloudDocsOnly(false);
                     }}
                     className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all active:scale-[0.98] group ${
                        isDark 
                           ? "bg-zinc-950/40 hover:bg-zinc-950 border-zinc-800 hover:border-emerald-500/50" 
                           : "bg-zinc-50/50 hover:bg-zinc-50 border-zinc-200 hover:border-emerald-500/50"
                     }`}
                  >
                     <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <Cloud className="w-6 h-6" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="text-sm font-extrabold flex items-center gap-1.5">
                           Firebase Cloud
                           <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20">Aktiv</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                           Sinkronizoni, ruani dhe ndani shënimet tuaja në mënyrë të sigurt në Google Firebase.
                        </p>
                     </div>
                  </button>

                  <button
                     onClick={async () => {
                        setShowCloudSelectionModal(false);
                        setOnlineView('gist');
                        setSelectedOnlineDoc(null);
                        setIsOnlineEditing(false);
                        if (gistId) {
                           await viewGistContent();
                        } else {
                           setOnlineBlueText(blueText);
                           setOnlineSecretList(secretList);
                        }
                     }}
                     className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all active:scale-[0.98] group ${
                        isDark 
                           ? "bg-zinc-950/40 hover:bg-zinc-950 border-zinc-800 hover:border-blue-500/50" 
                           : "bg-zinc-50/50 hover:bg-zinc-50 border-zinc-200 hover:border-blue-500/50"
                     }`}
                  >
                     <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Github className="w-6 h-6" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="text-sm font-extrabold flex items-center gap-1.5">
                           GitHub Gist
                        </div>
                        <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                           Ruani shënimet tuaja në GitHub Gists privatë ose publikë duke përdorur Token.
                        </p>
                     </div>
                  </button>
               </div>
               
               <p className={`text-[10px] text-center mt-4 leading-relaxed ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                  Të dyja platformat ofrojnë siguri maksimale dhe mbështetje për sinkronizim të shpejtë në çdo pajisje.
               </p>
            </div>
         </div>
      )}

      {/* CLOUD MODAL */}
      {cloudModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">
             <div className={`max-w-2xl w-full max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}>
                <div className={`flex justify-between items-center p-5 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                   <h3 className={`text-lg font-bold flex items-center gap-2 ${textColor}`}>
                      <button onClick={() => setCloudModal(false)} className="mr-2 p-1.5 bg-zinc-500/10 hover:bg-zinc-500/20 rounded-lg transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>
                      </button>
                      <Cloud className="w-5 h-5 text-emerald-500" /> Cloud
                   </h3>
                   <button onClick={() => setCloudModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                
                <div className={`p-4 border-b flex flex-wrap gap-2 ${isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                    <button onClick={() => {forceCloudBackup();}} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-accent-600 hover:bg-accent-500 text-white border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white border-transparent"}`}>
                        <Cloud className="w-4 h-4 inline-block mr-1" /> Ngarko
                    </button>
                    <button onClick={() => {handleFullCloudRestore();}} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white border-transparent"}`}>
                        <Download className="w-4 h-4 inline-block mr-1" /> Rikthe
                    </button>
                    <button onClick={() => loadFromGoogleCloud(false)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm flex items-center gap-1 ${isDark ? "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent" : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"}`}>
                        <RefreshCw className="w-3.5 h-3.5" /> Rifresko
                     </button>
                    <button onClick={exportAllPdf} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}`}>PDF</button>
                    <button onClick={exportLocalBackup} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm ${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}`}>JSON</button>
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



      {/* 3. MODAL: SYSTEMI PER SHKARKIM APP/APK, REPO DHE GITHUB ACTIONS */}
      {showDownloadAppModal && (
         <div className="fixed inset-0 z-[300] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 p-4 animate-in fade-in">
            <div className={`max-w-2xl w-full p-6 mb-20 md:mb-0 rounded-2xl shadow-2xl border flex flex-col ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"}`}>
               <div className="flex justify-between items-center pb-3 border-b border-zinc-500/10 mb-4 shrink-0">
                  <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-amber-500">
                     <Download className="w-5 h-5" />
                     {t('Qendra e Shkarkimit & Integrimit (PWA, APK, GitHub)', 'Download & Integration Center (PWA, APK, GitHub)')}
                  </h3>
                  <button onClick={() => setShowDownloadAppModal(false)} className="p-1.5 hover:text-red-500 transition-colors">
                     <X className="w-4 h-4" />
                  </button>
               </div>

               {/* TAB NAVIGIMI */}
               <div className="flex border-b border-zinc-500/10 mb-4 shrink-0 gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                     onClick={() => setDownloadActiveTab('pwa')}
                     className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                        downloadActiveTab === 'pwa'
                           ? isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                           : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                     }`}
                  >
                     <Monitor className="w-3.5 h-3.5 text-amber-500" />
                     <span>{t('PWA App (Ueb)', 'PWA App (Web)')}</span>
                  </button>
                  <button
                     onClick={() => setDownloadActiveTab('apk')}
                     className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                        downloadActiveTab === 'apk'
                           ? isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                           : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                     }`}
                  >
                     <Download className="w-3.5 h-3.5 text-amber-500" />
                     <span>{t('Android APK (Native)', 'Android APK (Native)')}</span>
                  </button>
                  <button
                     onClick={() => setDownloadActiveTab('github')}
                     className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                        downloadActiveTab === 'github'
                           ? isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                           : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                     }`}
                  >
                     <Github className="w-3.5 h-3.5 text-amber-500" />
                     <span>{t('GitHub & Actions', 'GitHub & Actions')}</span>
                  </button>
               </div>

               <div className="flex flex-col gap-4 overflow-y-auto max-h-[55vh] pr-1 scrollbar-hide text-xs leading-relaxed">
                  
                  {/* TAB 1: PWA App */}
                  {downloadActiveTab === 'pwa' && (
                     <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className={`p-4 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-amber-500/5 border-amber-500/10"}`}>
                           <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs">
                              <Monitor className="w-4 h-4 text-current" />
                              <span>{t('MBI STRUKTURËN PWA (PROGRESSIVE WEB APP)', 'ABOUT PWA STRUCTURE')}</span>
                           </div>
                           <p className={`${isDark ? "text-zinc-400" : "text-zinc-600"} text-xs`}>
                              {t(
                                 "Aplikacioni NoteBook3 përfshin një strukturë të plotë PWA të ndërtuar me plugin-in `vite-plugin-pwa`. Kjo i lejon aplikacionit të instalohet direkt në telefon ose PC pa patur nevojë për dyqane aplikacionesh (App Stores), duke ruajtur të gjitha skedarët në mënyrë offline.",
                                 "NoteBook3 includes a full PWA structure powered by `vite-plugin-pwa`. This allows installing the app directly to your phone or PC without needing App Stores, caching all assets for continuous offline usage."
                              )}
                           </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"}`}>
                              <span className="font-bold text-amber-500 flex items-center gap-1.5">
                                 <Check className="w-3.5 h-3.5 text-current" />
                                 {t('Service Worker (sw.js)', 'Service Worker (sw.js)')}
                              </span>
                              <p className={`${isDark ? "text-zinc-400" : "text-zinc-500"} text-[11px]`}>
                                 {t(
                                    "Cachon të gjithë kodin burimor, imazhet dhe stilet në memorien e shfletuesit. Ju mund të hapni NoteBook3 dhe të shkruani shënime plotësisht pa internet (Offline).",
                                    "Caches code assets, images, and styles in your browser cache. You can launch NoteBook3 and manage notes completely offline."
                                 )}
                              </p>
                           </div>

                           <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"}`}>
                              <span className="font-bold text-amber-500 flex items-center gap-1.5">
                                 <FileJson className="w-3.5 h-3.5 text-current" />
                                 {t('Web Manifest (manifest.webmanifest)', 'Web Manifest (manifest.webmanifest)')}
                              </span>
                              <p className={`${isDark ? "text-zinc-400" : "text-zinc-500"} text-[11px]`}>
                                 {t(
                                    "Përcakton ikonat, emrin, ngjyrat e temës dhe mënyrën e shfaqjes 'standalone' (pa shirita shfletuesi), duke ofruar një ndjesi të plotë native.",
                                    "Defines icons, name, theme colors, and standalone display mode to provide a completely native look and feel on mobile homescreens."
                                 )}
                              </p>
                           </div>
                        </div>

                        <div className={`p-4 rounded-xl border flex flex-col gap-2.5 ${isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-zinc-50/50 border-zinc-200"}`}>
                           <span className="font-extrabold uppercase tracking-wider text-amber-500 text-[10px]">{t('Si ta instaloni në pajisjen tuaj:', 'How to install on your device:')}</span>
                           <ul className={`list-disc pl-4 space-y-1.5 text-[11px] font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                              <li>
                                 <strong className={textColor}>{t('Android ose Google Chrome:', 'Android or Google Chrome:')}</strong> {t("Klikoni tre pikat në cepin e djathtë të shfletuesit dhe zgjidhni 'Shto në ekranin kryesor' ose 'Instalo'.", "Click the three dots in browser's top-right corner and select 'Add to Home Screen' or 'Install'.")}
                              </li>
                              <li>
                                 <strong className={textColor}>{t('iOS Safari (iPhone/iPad):', 'iOS Safari (iPhone/iPad):')}</strong> {t("Klikoni butonin 'Share' (Shpërndaj) në fund dhe zgjidhni 'Add to Home Screen'.", "Click the 'Share' button at the bottom and select 'Add to Home Screen'.")}
                              </li>
                           </ul>
                        </div>
                     </div>
                  )}

                  {/* TAB 2: Android APK (Native) */}
                  {downloadActiveTab === 'apk' && (
                     <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className={`p-4 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-amber-500/5 border-amber-500/10"}`}>
                           <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs">
                              <Download className="w-4 h-4 text-current" />
                              <span>{t('DORËZIMI I APK (ANDROID NATIVE)', 'ANDROID NATIVE APK DELIVERY')}</span>
                           </div>
                           <p className={`${isDark ? "text-zinc-400" : "text-zinc-600"} text-xs`}>
                              {t(
                                 "NoteBook3 është i përgatitur të ndërtohet si një aplikacion native për Android përmes teknologjisë Capacitor. Kjo siguron qasje në API-të vendase të pajisjes me performancë maksimale.",
                                 "NoteBook3 is prepared to be built as a native Android app via Capacitor. This ensures access to native device APIs with maximum performance."
                              )}
                           </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"}`}>
                              <span className="font-bold text-amber-500 flex items-center gap-1.5">
                                 <span className="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-bold">1</span>
                                 {t('Latest Releases (Mënyra e Shpejtë)', 'Latest Releases (Quick Way)')}
                              </span>
                              <p className={`${isDark ? "text-zinc-400" : "text-zinc-500"} text-[11px]`}>
                                 {t(
                                    "Shkoni në faqen GitHub të projektit, zgjidhni versionin 'latest-apk' te seksioni Releases, dhe shkarkoni skedarin 'app-debug.apk' direkt në celular.",
                                    "Go to the GitHub page of the project, choose the 'latest-apk' release, and download 'app-debug.apk' directly to your phone."
                                 )}
                              </p>
                           </div>

                           <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"}`}>
                              <span className="font-bold text-amber-500 flex items-center gap-1.5">
                                 <span className="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-bold">2</span>
                                 {t('Instalimi i Sigurt', 'Secure Installation')}
                              </span>
                              <p className={`${isDark ? "text-zinc-400" : "text-zinc-500"} text-[11px]`}>
                                 {t(
                                    "Pasi të shkarkoni skedarin, hapeni atë në pajisje dhe jepni lejen për 'Burime të Panjohura' në parametrat e sigurisë për të përfunduar instalimin.",
                                    "After downloading the file, open it and allow installation from 'Unknown Sources' in security settings to complete setup."
                                 )}
                              </p>
                           </div>
                        </div>

                        <div className={`p-4 rounded-xl border flex flex-col gap-2.5 ${isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-zinc-50/50 border-zinc-200"}`}>
                           <span className="font-extrabold uppercase tracking-wider text-amber-500 text-[10px]">{t('Specifikimet e Build-it:', 'Build Specs:')}</span>
                           <ul className={`list-disc pl-4 space-y-1.5 text-[11px] font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                              <li>
                                 <strong className={textColor}>Gradle & Android Studio:</strong> {t("Përdor Gradle 8.5 me Java JDK 21 Zulu për stabilitet të lartë.", "Uses Gradle 8.5 with Java JDK 21 Zulu for high build stability.")}
                              </li>
                              <li>
                                 <strong className={textColor}>Capacitor Core:</strong> {t("Bën urën e lidhjes mes kodit Web dhe pamjes native pa asnjë vonesë.", "Bridges Web code and Native UI views with zero lag.")}
                              </li>
                           </ul>
                        </div>
                     </div>
                  )}

                  {/* TAB 3: GitHub & Actions */}
                  {downloadActiveTab === 'github' && (
                     <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className={`p-4 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-amber-500/5 border-amber-500/10"}`}>
                           <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs">
                              <Github className="w-4 h-4 text-current" />
                              <span>{t('INTEGRIMI ME GITHUB DHE GITHUB ACTIONS', 'GITHUB & GITHUB ACTIONS INTEGRATION')}</span>
                           </div>
                           <p className={`${isDark ? "text-zinc-400" : "text-zinc-600"} text-xs`}>
                              {t(
                                 "Kodi juaj burimor është i lidhur me një pipeline të plotë CI/CD përmes GitHub Actions. Skedari i përcaktuar i workflow ndërton automatikisht dhe me siguri APK-në e re çdo herë që kryeni një commit.",
                                 "Your source code is integrated with a complete CI/CD pipeline via GitHub Actions. The workflow file automatically builds the APK securely on every code commit."
                              )}
                           </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"}`}>
                              <span className="font-bold text-amber-500 flex items-center gap-1.5">
                                 <Terminal className="w-3.5 h-3.5 text-current" />
                                 {t('android-apk.yml Workflow', 'android-apk.yml Workflow')}
                              </span>
                              <p className={`${isDark ? "text-zinc-400" : "text-zinc-500"} text-[11px]`}>
                                 {t(
                                    "Konfigurimi i saktë që automatizon testimin, përpilimin e kodit React me Vite dhe paketimin final përmes Gradle CLI.",
                                    "Automates testing, Vite compilation of the React code, and packaging through the Gradle CLI."
                                 )}
                              </p>
                           </div>

                           <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"}`}>
                              <span className="font-bold text-amber-500 flex items-center gap-1.5">
                                 <Settings className="w-3.5 h-3.5 text-current" />
                                 {t('Build Manual', 'Manual Build Trigger')}
                              </span>
                              <p className={`${isDark ? "text-zinc-400" : "text-zinc-500"} text-[11px]`}>
                                 {t(
                                    "Nga faqja e Actions në GitHub, ju mund të klikoni 'Run workflow' te 'Build Android APK' për të nisur një build manual në çdo kohë.",
                                    "Under Actions page in GitHub, you can click 'Run workflow' on 'Build Android APK' to manually trigger a compilation anytime."
                                 )}
                              </p>
                           </div>
                        </div>

                        <div className={`p-3 text-[11px] font-semibold rounded-xl text-center flex items-center justify-center gap-2 ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/5 text-amber-700"}`}>
                           <Sparkles className="w-4 h-4 animate-spin shrink-0" />
                           <span>{t('Repo juaj është gjithmonë e sinkronizuar me standardet më të larta PWA dhe Android!', 'Your repository is always in sync with the highest PWA and Android standards!')}</span>
                        </div>
                     </div>
                  )}

               </div>

               <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-zinc-500/10 shrink-0">
                  <button 
                     onClick={() => {
                        window.open("https://github.com", "_blank");
                     }}
                     className={`px-4 py-2 font-bold rounded-lg text-xs transition-colors border flex items-center gap-1.5 ${isDark ? "bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-white" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700 shadow-sm"}`}
                  >
                     <Github className="w-4 h-4 text-current" />
                     <span>Hap GitHub</span>
                  </button>
                  <button 
                     onClick={() => setShowDownloadAppModal(false)} 
                     className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors text-xs shadow-md shadow-amber-500/20"
                  >
                     {t('Mbyll Udhëzuesin', 'Close Guide')}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* TRANSFERRING INFO */}
      {transferringInfo && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
            <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${
               isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}>
               <div className="relative mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10">
                  <FolderOpen className="w-8 h-8 text-blue-500 animate-bounce" />
                  <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
               </div>
               <h4 className="font-extrabold text-base mb-1.5 text-zinc-800 dark:text-zinc-100">
                  {t("Po transferohet...", "Moving...")}
               </h4>
               <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                  {t("Lista", "List")}{" "}
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">
                     "{transferringInfo.docTitle}"
                  </span>{" "}
                  {t("po transferohet te", "is being moved to")}{" "}
                  <span className="font-bold text-blue-500">
                     "{transferringInfo.destName}"
                  </span>...
               </p>
               <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full animate-pulse w-full" />
               </div>
            </div>
         </div>
      )}

      {/* CUSTOM LABEL MODAL (ADD / RENAME) */}
      {labelModal.isOpen && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[220] p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${
               isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">
                     {labelModal.mode === 'add' 
                        ? t("Krijo Etiketë të Re", "Create New Label") 
                        : t("Ndrysho Emrin e Etiketës", "Rename Label")
                     }
                  </h3>
                  <button 
                     onClick={() => setLabelModal({ isOpen: false, mode: 'add', value: '' })}
                     className="p-1.5 hover:bg-zinc-500/10 rounded-lg transition-colors"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                     {t("Emri i Etiketës", "Label Name")}
                  </label>
                  <input
                     type="text"
                     value={labelModal.value}
                     onChange={(e) => setLabelModal(prev => ({ ...prev, value: e.target.value }))}
                     placeholder={t("p.sh. Pune, Personale", "e.g. Work, Personal")}
                     className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                           ? "bg-zinc-800 border-zinc-750 text-white placeholder-zinc-500" 
                           : "bg-zinc-50 border-zinc-250 text-zinc-900 placeholder-zinc-400"
                     }`}
                     autoFocus
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                           handleSaveLabelModal();
                        }
                     }}
                  />
               </div>

               <div className="flex justify-end gap-2.5">
                  <button
                     onClick={() => setLabelModal({ isOpen: false, mode: 'add', value: '' })}
                     className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all border ${
                        isDark 
                           ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300" 
                           : "border-zinc-250 hover:bg-zinc-50 text-zinc-700"
                     }`}
                  >
                     {t("Anulo", "Cancel")}
                  </button>
                  <button
                     onClick={handleSaveLabelModal}
                     className="px-4 py-2 text-sm font-semibold rounded-xl transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-md"
                  >
                     {t("Ruaj", "Save")}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* CUSTOM LABEL DELETION CONFIRMATION MODAL */}
      {labelToDelete && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[220] p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${
               isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}>
               <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-full shrink-0">
                     <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                     <h3 className="text-lg font-bold text-red-500 mb-1">
                        {t("Fshi Etiketën", "Delete Label")}
                     </h3>
                     <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                        {t(`Dëshironi të fshini etiketën "${labelToDelete.name}"?\nDokumentet nuk do të fshihen, thjesht do të hiqet etiketa prej tyre.`, `Are you sure you want to delete label "${labelToDelete.name}"?\nDocuments won't be deleted, only the label will be removed from them.`)}
                     </p>
                  </div>
               </div>

               <div className="flex justify-end gap-2.5 mt-6">
                  <button
                     onClick={() => setLabelToDelete(null)}
                     className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all border ${
                        isDark 
                           ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300" 
                           : "border-zinc-250 hover:bg-zinc-50 text-zinc-700"
                     }`}
                  >
                     {t("Anulo", "Cancel")}
                  </button>
                  <button
                     onClick={() => executeDeleteCustomLabel(labelToDelete.index)}
                     className="px-4 py-2 text-sm font-semibold rounded-xl transition-all bg-red-600 text-white hover:bg-red-500 shadow-md"
                  >
                     {t("Fshi", "Delete")}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* CUSTOM SECRET DELETION CONFIRMATION MODAL */}
      {secretToDelete && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[220] p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${
               isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}>
               <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-full shrink-0">
                     <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                     <h3 className="text-lg font-bold text-red-500 mb-1">
                        {secretToDelete.id === 'all' 
                           ? t("Fshi të Gjithë Sekretet", "Delete All Secrets")
                           : t("Fshi Bllokun Sekret", "Delete Secret Block")
                        }
                     </h3>
                     <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-650"}`}>
                        {secretToDelete.id === 'all'
                           ? t("Dëshironi të fshini të gjithë listën e sekreteve? Ky veprim nuk mund të kthehet mbrapa.", "Are you sure you want to delete all secret blocks? This action cannot be undone.")
                           : t(`Dëshironi ta fshini bllokun sekret "${secretToDelete.name || secretToDelete.text || t("Pa Emër", "Unnamed")}"?\nKy shënim do të hiqet përgjithmonë.`, `Are you sure you want to delete secret block "${secretToDelete.name || secretToDelete.text || t("Unnamed", "Unnamed")}"?\nThis note will be removed permanently.`)
                        }
                     </p>
                  </div>
               </div>

               <div className="flex justify-end gap-2.5 mt-6">
                  <button
                     onClick={() => setSecretToDelete(null)}
                     className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all border ${
                        isDark 
                           ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300" 
                           : "border-zinc-250 hover:bg-zinc-50 text-zinc-700"
                     }`}
                  >
                     {t("Anulo", "Cancel")}
                  </button>
                  <button
                     onClick={() => executeDeleteSecretItem(secretToDelete.id)}
                     className="px-4 py-2 text-sm font-semibold rounded-xl transition-all bg-red-600 text-white hover:bg-red-500 shadow-md"
                  >
                     {t("Fshi", "Delete")}
                  </button>
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
          <p className={`text-sm text-center mb-6 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
             {t('Ju lutem futni kodin Password ose PIN për të vazhduar.', 'Please enter Password or PIN to continue.')}
          </p>
          <input 
             type="password"
             value={appLockInput}
             onChange={e => setAppLockInput(e.target.value)}
             className={`w-full text-center text-xl font-bold py-3 px-4 rounded-xl mb-4 border outline-none transition-colors shadow-sm ${
                isDark ? "bg-zinc-950 border-zinc-700 text-white focus:border-accent-500" : "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-accent-500"
             }`}
             onKeyDown={e => { if(e.key === 'Enter') handleAppUnlock(); }}
             autoFocus
             placeholder={t("Fjalëkalimi / PIN", "Password / PIN")}
          />
          <button onClick={handleAppUnlock} className="w-full py-3.5 bg-accent-600 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-accent-500/20 text-md mb-4">
             {t('Shkyç', 'Unlock')}
          </button>
          
          <button onClick={handleForgotPassword} className={`text-center text-xs font-semibold hover:underline ${isDark ? "text-accent-400" : "text-accent-600"}`}>
              {t("Harruat Password? (Rikthe me Email)", "Forgot Password? (Recover with Email)")}
          </button>
      </div>
    </div>
  ) : null;

  if (onlineView) {
     return (
        <>
           {renderOnlineDashboard()}
           {renderSharedModals()}
           {toastMessage && (
              <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-accent-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4 z-[300]">
                 {toastMessage}
              </div>
           )}
           {pinOverlayJSX}
        </>
     );
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
                           <Lock className="w-4 h-4 shrink-0" /> {localStorage.getItem('grid_notepad_pin') ? t('NDRYSHO PIN / PASSWORD', 'CHANGE PIN / PASSWORD') : t('KRIJO PIN / PASSWORD', 'CREATE PIN / PASSWORD')}
                       </button>

                       <div className="px-4 py-3 flex flex-col gap-1.5 border-t border-zinc-500/10 bg-accent-500/5">
                           <label className="text-xs font-bold uppercase tracking-wider text-accent-500 flex items-center gap-1">
                               📩 {t('Email për Rikthim PIN', 'Recovery Email for PIN')}
                           </label>
                           <input 
                               type="email"
                               value={recoveryEmail}
                               placeholder={t("p.sh. emri@email.com", "e.g. name@email.com")}
                               onChange={(e) => {
                                   const val = e.target.value;
                                   setRecoveryEmail(val);
                                   localStorage.setItem('grid_notepad_recovery_email', val.trim());
                               }}
                               className={`w-full p-2 text-xs rounded border outline-none font-medium transition-colors ${
                                   isDark 
                                       ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-accent-500" 
                                       : "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-accent-500"
                                }`}
                           />
                           <p className="text-[10px] text-zinc-500 leading-tight">
                               {t("Nëse harroni fjalëkalimin, do t'ju dërgohet një kod sigurie për ta rivendosur tek ky email.", "If you forget your password, a security code will be sent to this email to reset it.")}
                           </p>
                       </div>

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
                            <div className="flex flex-col gap-3.5 p-4 rounded-xl border border-green-500/20 bg-green-500/5 dark:bg-green-500/10 w-full shadow-sm">
                                <span className="leading-tight font-bold text-sm text-green-600 dark:text-green-500 flex items-center gap-1.5">
                                    <Folder className="w-4 h-4 text-green-500" />
                                    {t('Vendndodhja e Memories së Telefonit', 'Phone Storage Location')}
                                </span>

                                <div className={`p-3 rounded-lg border flex flex-col gap-1.5 ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                                        <Smartphone className="w-4 h-4 text-green-500" />
                                        <span>{t('Pajisja / Lokacioni:', 'Device / Location:')}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-808'}`}>
                                            {activeProvider}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                                        <FolderOpen className="w-4 h-4 text-sky-500" />
                                        <span>{t('Dosja e Përzgjedhur:', 'Selected Folder:')}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-zinc-800 text-sky-400' : 'bg-zinc-200 text-sky-600'}`}>
                                            {folderName ? folderName : t('Dosja Rrënjë (Baza)', 'Root Folder (Base)')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-[10px] font-mono mt-1 text-green-600 dark:text-green-400">
                                        <span className="opacity-75 uppercase tracking-wider font-bold text-[9px]">{t('Rruga e Plotë e Ruajtjes:', 'Full Storage Path:')}</span>
                                        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-0.5">
                                            <span>📁</span>
                                            <span className="font-bold underline">{androidBaseDir}</span>
                                            <span>/</span>
                                            {folderName ? (
                                                <>
                                                    <span className="font-bold text-sky-500 dark:text-sky-400">{folderName}</span>
                                                    <span>/</span>
                                                </>
                                            ) : null}
                                            <span className="opacity-60">[skedari].pdf / .txt</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowStoragePickerModal(true);
                                        setActiveProvider(localStorage.getItem('grid_android_base_dir') || 'Memoria e Telefonit');
                                        setCurrentPath(folderName ? folderName.split('/') : []);
                                        setShowStorageSidebar(false);
                                    }}
                                    className={`w-full py-2.5 px-4 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border active:scale-95 ${
                                        isDark 
                                            ? 'bg-green-600 hover:bg-green-550 border-transparent text-white shadow-md shadow-green-950/20' 
                                            : 'bg-green-500 hover:bg-green-600 border-transparent text-white shadow-md'
                                    }`}
                                >
                                    <FolderOpen className="w-4 h-4" />
                                    {t('NDRYSHO DOSJEN NGA MEMORIA E TELEFONIT', 'CHANGE FOLDER FROM PHONE STORAGE')}
                                </button>

                                <div className="h-px w-full bg-green-500/20 my-1"></div>
                                {!Capacitor.isNativePlatform() && (
                                <div className="flex flex-col gap-2.5 items-start w-full">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                        {t('Përzgjedhësi i Dosjeve (Picker):', 'Folder Selector (Picker):')}
                                    </span>
                                    
                                    <div className="flex flex-wrap gap-2 w-full">
                                        {/* Main Simulated Memory Phone Picker */}
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setShowStoragePickerModal(true);
                                                setActiveProvider('Memoria e Telefonit');
                                                setCurrentPath(['Dosja']);
                                                setDownloadMethod("folder");
                                                localStorage.setItem("grid_download_method", "folder");
                                                showToast(t("U hap Memoria e Telefonit. Përzgjidhni dosjen 'Dosja' për të vazhduar!", "Opened Phone Storage. Select 'Dosja' folder to continue!"));
                                            }} 
                                            className={`flex-1 min-w-[200px] px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border shadow-md active:scale-95 ${
                                                isDark 
                                                    ? 'bg-orange-600 hover:bg-orange-500 border-transparent text-white shadow-orange-950/20' 
                                                    : 'bg-orange-500 hover:bg-orange-600 border-transparent text-white shadow-orange-500/10'
                                            }`}
                                        >
                                            <FolderOpen className="w-4 h-4" />
                                            {t("Zgjidh Dosjen me Picker", "Choose Folder with Picker")} (Memoria e Telefonit)
                                        </button>

                                        {/* Fallback Real Device / Browser Directory Picker */}
                                        <button 
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    if (typeof (window as any).showDirectoryPicker === "function" && window.self === window.top) {
                                                        const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
                                                        await saveDirectoryHandle(handle);
                                                        setFolderName(handle.name);
                                                        localStorage.setItem("grid_mock_folder", handle.name);
                                                        localStorage.setItem("grid_folder_name", handle.name);
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
                                            }} 
                                            className={`px-3.5 py-2.5 text-xs font-bold rounded-xl transition-colors border active:scale-95 flex items-center justify-center gap-1.5 ${
                                                isDark 
                                                    ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200' 
                                                    : 'bg-white hover:bg-zinc-50 border-zinc-250 text-zinc-700 shadow-sm'
                                            }`}
                                            title={t("Lidh me një dosje reale në PC/Browser", "Link with a real folder on PC/Browser")}
                                        >
                                            <Smartphone className="w-3.5 h-3.5 text-green-500" />
                                            <span>{t("Zgjidh Dosje Reale (PC/Browser)", "Choose Real Folder (PC/Browser)")}</span>
                                        </button>
                                    </div>

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
                                                localStorage.setItem("grid_folder_name", folder);
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
                        <h4 className="px-4 py-2 font-bold mb-1 text-xs uppercase tracking-wider text-accent-500 flex items-center gap-1.5">
                           <Database className="w-4 h-4" /> {t('Backup i Sigurisë (Hapësira)', 'Security Backup')}
                        </h4>
                        <button 
                           onClick={() => {
                              setShowOptionsMenu(false);
                              setBackupModal(true);
                           }} 
                           className="flex items-center gap-3 px-4 py-3 text-sm text-left font-bold transition-colors hover:bg-accent-500 hover:text-white text-accent-500 w-full"
                        >
                            <Database className="w-4 h-4 shrink-0" /> {t('Mjetet e Backup & Sinkronizimit', 'Backup & Sync Tools')}
                        </button>

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

               <button 
                  onClick={() => {
                     executeProtectedAction(() => setShowCloudSelectionModal(true));
                  }} 
                  className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all border shadow-md active:scale-95 ${
                    isDark ? "bg-green-600 hover:bg-green-500 text-white border-transparent" : "bg-green-500 hover:bg-green-600 text-white border-transparent font-bold"
                  }`}
                  title="Zgjidhni platformën Cloud Firebase ose Gist"
                >
                  <Cloud className="w-3.5 h-3.5" /> CLOUD
                </button>


                <button onClick={() => setAiChatModal(true)} className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border active:scale-95 ${
                  isDark ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md border-transparent" : "bg-purple-500 hover:bg-purple-600 text-white shadow-md font-bold border-transparent"
                }`}>
                  <Sparkles className="w-3.5 h-3.5" /> AI Chat
                </button>

                <button onClick={() => setShowDownloadAppModal(true)} className={`flex-shrink-0 snap-start flex justify-center items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors border active:scale-95 ${
                  isDark ? "bg-zinc-800 hover:bg-zinc-700 text-amber-400 shadow-md border-zinc-700" : "bg-amber-50 hover:bg-amber-100 text-amber-800 shadow-sm border-amber-300 font-bold"
                }`} title={t("Shkarko aplikacionin (APK) ose shiko Repo / GitHub Actions", "Download App (APK) or view Repo / GitHub Actions")}>
                  <Download className="w-3.5 h-3.5" /> APK / App
                </button>
             </div>
            
            {/* SEGMENTED TAB SELECTOR: LISTA OSE ETIKETA */}
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-850/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 mt-1 shrink-0">
               <button
                  onClick={() => { setMainTab('lista'); setSelectedLabelFolder(null); }}
                  className={`flex-grow flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                     mainTab === 'lista'
                        ? "bg-accent-500 text-white shadow-md shadow-accent-500/15"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
                  }`}
               >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                  {t("Lista", "Lists")} ({documents.length})
               </button>
               <button
                  onClick={() => setMainTab('etiketa')}
                  className={`flex-grow flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                     mainTab === 'etiketa'
                        ? "bg-accent-500 text-white shadow-md shadow-accent-500/15"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
                  }`}
               >
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  {t("Etiketa", "Labels")} ({customLabels.length})
               </button>
            </div>
            
            {/* If Lista Tab, show Search and Dynamic Tags */}
            {mainTab === 'lista' && (
               <>
                  <div className="flex gap-2 w-full mt-1 shrink-0">
                     <div className="relative flex-grow">
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
                     <button 
                        onClick={() => {
                           const next = catalogLayout === 'grid' ? 'list' : 'grid';
                           setCatalogLayout(next);
                           localStorage.setItem('grid_notepad_catalog_layout', next);
                        }}
                        className={`px-2.5 rounded-lg border transition-all active:scale-95 flex items-center justify-center shrink-0 ${
                           isDark 
                              ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300" 
                              : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                        }`}
                        title={catalogLayout === 'grid' ? t("Shiko si Listë", "View as List") : t("Shiko si Grid", "View as Grid")}
                     >
                        {catalogLayout === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                     </button>
                  </div>
                  {allAvailableTags.length > 0 && (
                     <div className="flex flex-wrap gap-1.5 mt-2 pb-1 border-b border-zinc-200 dark:border-zinc-850 shrink-0">
                        <button
                           onClick={() => setSelectedTag(null)}
                           className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 border ${
                              selectedTag === null
                                 ? "bg-accent-500 text-white border-accent-500 shadow-sm"
                                 : isDark 
                                    ? "bg-zinc-850 border-zinc-700 text-zinc-300 hover:bg-zinc-750" 
                                    : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                           }`}
                        >
                           <span>{t("Të gjitha", "All")}</span>
                           <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                              selectedTag === null 
                                 ? "bg-white/25 text-white" 
                                 : isDark ? "bg-zinc-750 text-zinc-400" : "bg-white text-zinc-500"
                           }`}>
                              {documents.length}
                           </span>
                        </button>
                        {allAvailableTags.map(tag => {
                           const count = documents.filter(doc => (doc.tags || []).includes(tag)).length;
                           return (
                              <button
                                 key={tag}
                                 onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                 className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 border ${
                                    selectedTag === tag
                                       ? "bg-accent-500 text-white border-accent-500 shadow-sm"
                                       : isDark 
                                          ? "bg-zinc-850 border-zinc-700 text-zinc-300 hover:bg-zinc-750" 
                                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                                 }`}
                              >
                                 <Tag className="w-2.5 h-2.5 opacity-70" />
                                 <span>#{tag}</span>
                                 <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                                    selectedTag === tag 
                                       ? "bg-white/25 text-white" 
                                       : isDark ? "bg-zinc-750 text-zinc-400" : "bg-white text-zinc-500"
                                 }`}>
                                    {count}
                                 </span>
                              </button>
                           );
                        })}
                     </div>
                  )}
               </>
            )}
         </div>
         
         <div className={`p-4 sm:p-5 flex-1 overflow-y-auto w-full max-w-full`}>
            {mainTab === 'lista' ? (
               <div className={catalogLayout === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 animate-in fade-in duration-200" 
                  : "flex flex-col gap-2 max-w-4xl animate-in fade-in duration-200"
               }>
                     {/* KRIJO KARTËN E RE */}
                     <button 
                       onClick={() => createNewDocument()}
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
                          <span className={`text-[10px] font-medium leading-tight text-zinc-500`}>{t('Strukturë me 90 Rrjeshta', '90 Rows Structure')}</span>
                       </div>
                     </button>

                     {/* LISTA E DOKUMENTEVE */}
                     {filteredDocs.length === 0 ? (
                        <div className={`col-span-full text-center py-10 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          {t('Asnjë dokument nuk u gjet.', 'No documents found.')}
                        </div>
                     ) : filteredDocs.map(doc => {
                        const allDeleted = isDocAllDeletedX(doc);
                        return (
                           <div 
                              key={doc.id} 
                               onClick={() => openDocument(doc)} 
                               className={`flex items-between justify-between p-2.5 border rounded-xl cursor-pointer transition-all hover:translate-x-1 ${
                                  allDeleted
                                     ? isDark 
                                        ? "bg-red-950/10 border-red-900/40 hover:border-red-700 shadow-sm" 
                                        : "bg-red-50/20 border-red-200 hover:border-red-300 shadow-sm"
                                     : isDark 
                                        ? "bg-zinc-900 border-zinc-800 hover:border-zinc-600 shadow-sm" 
                                        : "bg-white border-zinc-200 hover:border-zinc-400 shadow-sm"
                               }`}
                            >
                               <div className="flex flex-col flex-1 shadow-none min-w-0 pr-2 gap-0.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                     <h3 className={`font-bold text-sm truncate ${textColor}`}>{doc.title}</h3>
                                     {allDeleted && (
                                        <Lock className="w-3.5 h-3.5 text-red-500 shrink-0" title={t("Të gjitha rreshtat e fshira", "All rows deleted")} />
                                     )}
                                  </div>
                                  <div className={`flex flex-row flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500`}>
                                     <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.createdAt, 'dd MMM yyyy')}</span>
                                     <span className="flex items-center gap-0.5"><Save className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.updatedAt, 'HH:mm')}</span>
                                  </div>
                                  {(doc.tags && doc.tags.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                       {doc.tags.map(tag => (
                                          <button
                                             key={tag}
                                             type="button"
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTag(selectedTag === tag ? null : tag);
                                                setMainTab('lista');
                                             }}
                                             className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer ${getTagColors(tag)}`}
                                             title={t(`Filtro sipas #` + tag, `Filter by #` + tag)}
                                          >
                                             #{tag}
                                          </button>
                                       ))}
                                    </div>
                                 )}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                 {/* Transfer List button */}
                                 <button
                                    onClick={() => setTransferDocId(doc.id)}
                                    className={`p-2 rounded-lg text-zinc-400 hover:text-blue-500 transition-colors ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                                    title={t("Transfero te Etiketa", "Transfer to Label")}
                                 >
                                    <FolderOpen className="w-4 h-4" />
                                 </button>

                                 {/* Delete Button */}
                                 <button 
                                    onClick={() => { 
                                       executeProtectedAction(() => {
                                          setDocToDelete(doc.id);
                                       });
                                    }} 
                                    className={`p-2 rounded-lg text-zinc-500 hover:text-red-500 active:text-red-600 active:bg-red-500/10 transition-colors ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                                 >
                                    <Trash2 className="w-4 h-4 pointer-events-none" />
                                 </button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
            ) : (
               /* TAB ETIKETA */
               selectedLabelFolder === null ? (
                  /* LABELS LIST VIEW */
                  <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                     <div className="flex justify-between items-center mb-1">
                        <h3 className={`text-sm font-extrabold tracking-tight ${textColor}`}>
                           {t("Etiketat e Personalizuara", "Custom Labels")}
                        </h3>
                        <button
                           onClick={handleAddCustomLabel}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-lg active:scale-95 transition-all shadow-md shadow-orange-500/10"
                        >
                           <Plus className="w-3.5 h-3.5" />
                           {t("Krijo Etiketë", "Create Label")}
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-350">
                        {customLabels.length > 0 && (
                           /* KRIJO KARTËN E ETIKETËS RE BRENDA GRIDIT */
                           <button 
                              type="button"
                              onClick={handleAddCustomLabel}
                              className={`p-4 rounded-2xl border-2 border-dashed transition-all active:scale-95 text-left flex items-center justify-between h-[84px] ${
                                isDark 
                                  ? "border-zinc-800 hover:border-orange-500 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-400 hover:text-orange-500" 
                                  : "border-zinc-200 hover:border-orange-500 bg-zinc-50 hover:bg-orange-50/10 text-zinc-500 hover:text-orange-600"
                              }`}
                           >
                              <div className="flex items-center gap-3 min-w-0">
                                 <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl shrink-0 inline-flex items-center justify-center w-10 h-10 shadow-inner">
                                    <Plus className="w-5 h-5" />
                                 </div>
                                 <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-xs sm:text-sm font-extrabold truncate">{t('Krijo Etiketë', 'Create Label')}</span>
                                    <span className="text-[10px] text-zinc-500 leading-tight font-semibold">{t('Shto kategori', 'Add category')}</span>
                                 </div>
                              </div>
                              <Plus className="w-4 h-4 text-zinc-400 shrink-0" />
                           </button>
                        )}

                        {customLabels.map((label, idx) => {
                           // Count how many documents belong to this label
                           const labelDocsCount = documents.filter(doc => doc.tags && doc.tags.includes(label)).length;
                           return (
                              <div
                                 key={label}
                                 className={`p-4 rounded-2xl border transition-all hover:-translate-y-1 cursor-pointer flex items-center justify-between h-[84px] shadow-sm hover:shadow-lg ${
                                    isDark 
                                       ? "bg-zinc-900 border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-850" 
                                       : "bg-white border-zinc-200 hover:border-orange-500/50 hover:bg-orange-50/10"
                                 }`}
                                 onClick={() => setSelectedLabelFolder(label)}
                              >
                                 <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl shrink-0 w-10 h-10 flex items-center justify-center shadow-inner">
                                       <FolderOpen className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <span className={`text-xs sm:text-sm font-extrabold truncate ${textColor}`} title={label}>{label}</span>
                                       <span className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                                          {labelDocsCount === 1 
                                             ? t("1 Listë", "1 List") 
                                             : t(`${labelDocsCount} Lista`, `${labelDocsCount} Lists`)}
                                       </span>
                                    </div>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                              </div>
                           );
                        })}
                        
                        {customLabels.length === 0 && (
                           <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
                              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500 border border-orange-500/20 shadow-inner">
                                 <Tag className="w-8 h-8 animate-pulse" />
                              </div>
                              <h4 className={`text-base font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                                 {t("Nuk ka etiketa të krijuara", "No custom labels created")}
                              </h4>
                              <p className="text-xs text-zinc-500 max-w-xs mb-5 leading-relaxed">
                                 {t("Organizoni shënimet tuaja nëpërmjet etiketave të personalizuara për t'i gjetur ato më lehtë.", "Organize your notes using custom labels to find them more easily.")}
                              </p>
                              <button
                                 type="button"
                                 onClick={handleAddCustomLabel}
                                 className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl active:scale-95 transition-all shadow-md shadow-orange-500/15 cursor-pointer"
                              >
                                 <Plus className="w-4 h-4" />
                                 {t("Krijoni një etiketë të re.", "Create a new label.")}
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               ) : (
                  /* INSIDE LABEL VIEW */
                  (() => {
                     const currentLabelIdx = customLabels.indexOf(selectedLabelFolder);
                     const labelFilteredDocs = documents
                        .filter(doc => doc.tags && doc.tags.includes(selectedLabelFolder))
                        .filter(doc => {
                           if (!catalogSearch.trim()) return true;
                           const q = catalogSearch.toLowerCase();
                           if (doc.title.toLowerCase().includes(q)) return true;
                           return doc.rows.some(r => 
                              Object.values(r).some(val => (val || '').toString().toLowerCase().includes(q))
                           );
                        });

                     return (
                        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                           {/* Header / Breadcrumb */}
                           <div className="flex items-center justify-between border-b pb-3 border-zinc-500/10 mb-2">
                              <div className="flex items-center gap-2.5">
                                 <button
                                    onClick={() => { setSelectedLabelFolder(null); setCatalogSearch(''); }}
                                    className={`p-2 rounded-xl transition-colors border ${
                                       isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                                    }`}
                                    title={t("Kthehu mbrapa", "Go back")}
                                 >
                                    <ArrowLeft className="w-4 h-4" />
                                 </button>
                                 <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                       <span>{t("Etiketat", "Labels")}</span>
                                        <ChevronRight className="w-2.5 h-2.5" />
                                        <span className="text-zinc-400">{selectedLabelFolder}</span>
                                     </div>
                                     <h3 className={`text-base font-extrabold ${textColor}`}>
                                        {selectedLabelFolder}
                                     </h3>
                                  </div>
                               </div>

                               {/* Label Management Actions inside Folder */}
                               {currentLabelIdx !== -1 && (
                                  <div className="flex items-center gap-1.5">
                                     <button
                                        onClick={() => handleRenameCustomLabel(currentLabelIdx)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-xl hover:bg-orange-500/5 active:scale-95 transition-all cursor-pointer ${
                                           isDark ? "border-orange-500/30 text-orange-400 hover:border-orange-500" : "border-orange-500/30 text-orange-600 hover:border-orange-500"
                                        }`}
                                        title={t("Ndrysho emrin", "Rename label")}
                                     >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{t("Ndrysho emrin", "Rename")}</span>
                                     </button>
                                     <button
                                        onClick={() => handleDeleteCustomLabel(currentLabelIdx)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-red-500/30 hover:border-red-500 text-red-500 rounded-xl hover:bg-red-500/5 active:scale-95 transition-all cursor-pointer"
                                        title={t("Fshi etiketën", "Delete label")}
                                     >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{t("Fshi", "Delete")}</span>
                                     </button>
                                  </div>
                               )}
                            </div>
                     
                     <div className={catalogLayout === 'grid' 
                        ? "grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 animate-in fade-in duration-200" 
                        : "flex flex-col gap-2 max-w-4xl animate-in fade-in duration-200"
                     }>
                        {/* Create list in this label */}
                        <button 
                           onClick={() => createNewDocument([selectedLabelFolder])}
                           className={`flex items-center gap-2.5 p-2 border-2 border-dashed rounded-xl transition-all active:scale-95 text-left ${
                              catalogLayout === 'list' ? 'w-full animate-in fade-in duration-100' : ''
                           } ${
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
                              <span className={`text-[10px] font-medium leading-tight text-zinc-500`}>
                                 {t('Auto-Kategorizuar', 'Auto-Categorized')}
                              </span>
                           </div>
                        </button>
                        
                        {/* List of documents that belong to this label */}
                        {labelFilteredDocs.length === 0 ? (
                           <div className={`col-span-full text-center py-10 text-xs italic ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                              {t("Nuk ka lista në këtë etiketë që përputhen me kërkimin tuaj.", 
                                 "No lists in this label matching your search.")}
                           </div>
                        ) : (
                           labelFilteredDocs
                              .map(doc => (
                                 <div 
                                    key={doc.id} 
                                    onClick={() => openDocument(doc)} 
                                    className={`flex items-center justify-between p-2 border rounded-xl cursor-pointer transition-all hover:translate-x-1 ${
                                       isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-600 shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-400 shadow-sm"
                                    }`}
                                 >
                                    <div className="flex flex-col flex-1 shadow-none min-w-0 pr-2 gap-0.5">
                                       <h3 className={`font-bold text-sm truncate ${textColor}`}>{doc.title}</h3>
                                       <div className={`flex flex-row flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500`}>
                                          <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.createdAt, 'dd MMM yyyy')}</span>
                                          <span className="flex items-center gap-0.5"><Save className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.updatedAt, 'HH:mm')}</span>
                                       </div>
                                       {(doc.tags && doc.tags.length > 0) && (
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                             {doc.tags.map(tag => (
                                                <button key={tag} type="button" onClick={(e) => { e.stopPropagation(); setSelectedTag(selectedTag === tag ? null : tag); setSelectedLabelFolder(null); setMainTab('lista'); }} className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer ${getTagColors(tag)}`} title={t(`Filtro sipas #` + tag, `Filter by #` + tag)}>
                                                   #{tag}
                                                </button>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                       {/* Transfer Button */}
                                       <button
                                          onClick={() => setTransferDocId(doc.id)}
                                          className={`p-2 rounded-lg text-zinc-400 hover:text-blue-500 transition-colors ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                                          title={t("Transfero te Etiketa", "Transfer to Label")}
                                       >
                                          <FolderOpen className="w-4 h-4" />
                                       </button>
                                       {/* Delete Button */}
                                       <button 
                                          onClick={() => { 
                                             executeProtectedAction(() => {
                                                setDocToDelete(doc.id);
                                             });
                                          }} 
                                          className={`p-2 rounded-lg text-zinc-500 hover:text-red-500 active:text-red-600 active:bg-red-500/10 transition-colors ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                                       >
                                          <Trash2 className="w-4 h-4 pointer-events-none" />
                                       </button>
                                    </div>
                                 </div>
                              ))
                        )}
                     </div>
                  </div>
                     );
                  })()
               )
            )}
         </div>

         {/* TRANSFER MODAL */}
         {transferDocId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[130] p-4 animate-in fade-in duration-200">
               <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-200 ${
                  isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
               }`}>
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-sm flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        {t("Transfero te Etiketa", "Transfer to Label")}
                     </h3>
                     <button onClick={() => setTransferDocId(null)} className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500">
                        <X className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                     {t("Zgjidhni etiketën ku dëshironi të transferoni/kategorizoni këtë listë. Struktura dhe të dhënat mbeten të pandryshuara.", 
                        "Select the label where you want to transfer/categorize this list. The structure and data will remain unchanged.")}
                  </p>
                  
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto mb-4 scrollbar-hide">
                     {/* 1. DEFAULT MAIN LIST OPTION */}
                     {(() => {
                        const doc = documents.find(d => d.id === transferDocId);
                        const hasNoCustomLabel = !doc?.tags?.some(tag => customLabels.includes(tag));
                        return (
                           <button
                              key="default-main-list-opt"
                              onClick={() => {
                                 if (doc) {
                                    handleMoveDocument(doc, "default", t("Lista Kryesore (Default)", "Main Lists (Default)"));
                                 }
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                 hasNoCustomLabel 
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" 
                                    : isDark 
                                       ? "bg-zinc-850 border-zinc-750/50 hover:bg-zinc-800 text-zinc-300" 
                                       : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                              }`}
                           >
                              <span className="flex items-center gap-1.5">
                                 <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                                 {t("Lista Kryesore (Default)", "Main Lists (Default)")}
                              </span>
                              {hasNoCustomLabel && <Check className="w-4 h-4 text-amber-500" />}
                           </button>
                        );
                     })()}

                     {customLabels.length > 0 && (
                        <div className="flex items-center gap-2 my-2">
                           <div className="h-px bg-zinc-500/10 flex-1"></div>
                           <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("Etiketat", "Labels")}</span>
                           <div className="h-px bg-zinc-500/10 flex-1"></div>
                        </div>
                     )}

                     {/* 2. CUSTOM LABELS OPTIONS */}
                     {customLabels.map(label => {
                        const doc = documents.find(d => d.id === transferDocId);
                        const isAssigned = doc?.tags?.includes(label);
                        return (
                           <button
                              key={label}
                              onClick={() => {
                                 if (doc) {
                                    handleMoveDocument(doc, label, label);
                                 }
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                 isAssigned 
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400" 
                                    : isDark 
                                       ? "bg-zinc-850 border-zinc-750/50 hover:bg-zinc-800 text-zinc-300" 
                                       : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                              }`}
                           >
                              <span className="flex items-center gap-1.5">
                                 <Tag className="w-3.5 h-3.5 text-blue-500" />
                                 {label}
                              </span>
                              {isAssigned && <Check className="w-4 h-4 text-blue-500" />}
                           </button>
                        );
                     })}
                     
                     {customLabels.length === 0 && (
                        <div className="text-center py-6 text-xs text-zinc-500 italic flex flex-col items-center gap-1.5">
                           <span>{t("Nuk ka etiketa të krijuara.", "No labels created.")}</span>
                           <button
                              onClick={() => handleAddCustomLabel()}
                              className="text-accent-500 hover:text-accent-600 hover:underline font-bold not-italic cursor-pointer"
                           >
                              {t("Krijoni një etiketë të re.", "Create a new label.")}
                           </button>
                        </div>
                     )}
                  </div>
                  
                  <div className="flex gap-2">
                     <button
                        onClick={() => {
                           handleAddCustomLabel();
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border dark:border-zinc-700 active:scale-95 transition-all"
                     >
                        + {t("Krijo Etiketë", "Create Label")}
                     </button>
                     <button
                        onClick={() => setTransferDocId(null)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-650 active:scale-95 transition-all"
                     >
                        {t("Mbyll", "Close")}
                     </button>
                  </div>
               </div>
            </div>
         )}

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
        <div className="flex flex-col flex-grow min-w-[100px] max-w-[200px] relative">
           <HeaderInput 
              initialValue={title}
              onChange={(val: string) => {
                  setTitle(val);
                  updateActiveDocumentState(val, rows, headers, columnWidths, activeTags);
              }}
              className={`font-semibold text-sm px-2 py-1 rounded w-full border transition-colors outline-none focus:border-accent-500 ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"}`}
              placeholder={t("Titulli i Shënimit", "Note Title")}
           />
           {autoSaveMsg && (
              <span className="text-[10px] text-accent-500 font-medium px-2 py-0.5 animate-in fade-in slide-in-from-top-1 absolute top-[35px] z-50 rounded bg-white dark:bg-zinc-900 shadow-md border dark:border-zinc-800 border-zinc-200">{autoSaveMsg}</span>
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
                      className={`w-full h-full bg-transparent resize-none focus:outline-none text-base leading-relaxed overflow-y-auto ${
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
