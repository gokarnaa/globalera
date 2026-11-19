import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Avatar,
  Chip,
  Stack,
  Divider,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Drawer,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CallIcon from '@mui/icons-material/Call';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CampaignIcon from '@mui/icons-material/Campaign';
import BoltIcon from '@mui/icons-material/Bolt';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import PaymentsIcon from '@mui/icons-material/Payments';
import SmsIcon from '@mui/icons-material/Sms';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AiCounselorSandbox from './AiCounselorSandbox';
import { StatusBadge } from '../common';
import RecordPaymentModal from '../accounts/RecordPaymentModal';
import FeeClearanceReceiptModal from '../accounts/FeeClearanceReceiptModal';
import ConvertToStudentModal from '../leads/ConvertToStudentModal';
import { loadDB, saveDB, logCommunication, postDoubleEntryJournal } from '../../services/storage';
import { sendAakashSmsReal } from '../../services/exportUtils';
import {
  sendMetaWhatsAppMessage,
  sendWhatsAppBrochureDirect,
  markThreadRead,
  toggleBotPause,
  togglePinContact,
  assignThreadStaff,
  addInternalStaffNote,
  getWhatsAppTemplates,
  renderWhatsAppTemplate,
  suggestGeminiReply,
  cleanWhatsAppMarkdown,
  getBotSettings,
  fetchRemoteBotSettings,
  saveBotSettings,
  resolveBotMode,
  sendFacebookReply
} from '../../services/whatsappCloudApi';

const ROLE_COLORS = {
  Lead: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  Student: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  Trainer: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  Employer: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  'New Inquiry': { bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' },
  'FB Messenger': { bg: '#EFF6FF', color: '#1877F2', border: '#BFDBFE' },
  'FB Comment': { bg: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' }
};

const QUICK_TEMPLATES = [
  {
    id: 'welcome',
    label: 'Admission Welcome',
    build: (t) =>
      `Namaste ${t.name}! Welcome to Prabidhik School (Global Era Technical School), Jorpati. Let us know if you need syllabus, shift timing, or admission details.`
  },
  {
    id: 'fee',
    label: 'Fee Reminder',
    build: (t) => {
      const due = Number(t.entity?.dueFee || 0);
      return `Namaste ${t.name}, this is a gentle reminder from Prabidhik School Accounts Desk regarding your remaining tuition fee${due > 0 ? ` of NPR ${due.toLocaleString()}` : ''}. Please contact 014910715 for assistance.`;
    }
  },
  {
    id: 'counsel',
    label: 'Counselling Follow-up',
    build: (t) =>
      `Namaste ${t.name}! Following up on your vocational training inquiry at Global Era Technical School. Would you like to visit our Jorpati campus this week for a free lab tour?`
  },
  {
    id: 'ojt',
    label: 'OJT / Placement Update',
    build: (t) =>
      `Namaste ${t.name}, we have an OJT / Job Placement update ready for you at Prabidhik School. Please reply when convenient or call 014910715.`
  }
];

const SLASH_COMMANDS = [
  { cmd: '/fee', label: 'Fee Policy (50-50)', text: 'Our TVET course fee follows an easy 50-50 policy: 50% upon admission and 50% at mid-course. Call 014910715 for exact course fee details.' },
  { cmd: '/shift', label: 'Daily 2-Hour Shifts', text: 'We run 5 flexible daily shifts (Sun–Fri): Shift A (7–9 AM), Shift B (10–12), Shift C (12–2 PM), Shift D (2–4 PM), and Shift E (4–6 PM).' },
  { cmd: '/documents', label: 'Admission Documents', text: 'For admission, please bring: 1) Citizenship copy, 2) 2 PP-size photos, 3) Last academic certificate copy, and 50% advance fee.' },
  { cmd: '/location', label: 'Jorpati Campus Location', text: '📍 Prabidhik School (Global Era Technical School), Jorpati, Gokarneshwor, Kathmandu (Near MitraPark Hub). Phone: 014910715 / 9803614574.' },
  { cmd: '/caregiver', label: 'Caregiver (390 Hrs)', text: '🏥 Caregiver Training (390 Hours / 3 Months, CTEVT Accredited): 80% practical clinical labs, elderly & patient care, First Aid & CPR.' },
  { cmd: '/tailoring', label: 'Tailoring & Fashion', text: '👗 Tailoring & Fashion Designing (390 Hours / 3 Months): Individual Juki machine, pattern drafting, Kurtha/Blouse/Boutique stitching.' },
  { cmd: '/beautician', label: 'Beautician & Cosmetology', text: '💄 Beautician & Cosmetology (390 Hours / 3 Months): Skin care, facial, hair styling, bridal makeup & Salon OJT placement.' }
];

function formatTimeShort(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin >= 0 && diffMin < 1) return 'Just now';
    if (diffMin >= 1 && diffMin < 60) return `${diffMin}m ago`;
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const INSTANT_QUICK_REPLIES = [
  {
    key: 'addr',
    label: '📍 ठेगाना',
    text: 'हाम्रो तालिम केन्द्र *गोकर्णेश्वर–५, जोरपाटी, काठमाडौं* मा छ (चामुण्डा गेट विपरीत, कुमार गहना पसलसँगैको गल्लीभित्र, T-Mart को दोस्रो तला)। 📞 01-4910715 / 9803614574'
  },
  {
    key: 'fees',
    label: '💰 शुल्क सूची',
    text: 'हजुर, हाम्रो हालको तालिम शुल्क:\n• *बेसिक सिलाई / ब्युटिसियन (१ महिना):* रु. 2,000\n• *फुल सिलाई / ब्युटिसियन (३ महिना):* ५०% छुटमा रु. 15,000\n• *नेल आर्ट / आइल्यास:* बेसिक रु. 10,000 | प्रोफेसनल रु. 20,000\n• *कमर्सियल बेकरी (२ महिना):* रु. 30,000\nहजुरलाई कुन कोर्स गर्न मन छ?'
  },
  {
    key: 'shifts',
    label: '⏰ सिफ्ट समय',
    text: 'हजुर, हाम्रोमा दैनिक २ घण्टे सिफ्टहरू: बिहान 7–9, 10–12, दिउँसो 12–2, 2–4 र साँझ 4–6 बजे छन्। जागिरदारका लागि *Holiday Special Class* को व्यवस्था पनि छ। हजुरलाई कुन समय मिल्छ?'
  },
  {
    key: 'contact',
    label: '📞 सम्पर्क',
    text: 'हजुर, हाम्रो जोरपाटी अफिसको सम्पर्क नम्बर *01-4910715* र *9803614574* हो। हजुरको नम्बर दिनुभए हामी पनि कल गर्न सक्छौँ है! 🙏'
  }
];

function formatDateDivider(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Shared 3-Pane WhatsApp-Style Communication & Workflow Workspace.
 * Used in both the Floating Window and the Dedicated WhatsApp Sidebar Module.
 */
export default function WhatsAppWorkspace({
  threads = [],
  onRefresh,
  refreshing = false,
  height = '100%',
  initialPhone = null,
  initialDraft = '',
  jumpNonce = null,
  botCfg: propBotCfg = null,
  onChangeReplyMode: propOnChangeReplyMode = null,
  hideGlobalModeSwitcher = false
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [mobileWorkflowOpen, setMobileWorkflowOpen] = useState(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState(null);
  const [templateAnchor, setTemplateAnchor] = useState(null);

  // Composer channel & modals
  const [sendChannel, setSendChannel] = useState('WhatsApp'); // 'WhatsApp' | 'SMS'
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({ url: '', filename: 'Brochure.pdf', caption: '' });
  const [tplModalOpen, setTplModalOpen] = useState(false);
  const [metaTplForm, setMetaTplForm] = useState({ name: 'hello_world', language: 'en_US' });

  // Right-pane quick workflow & call log state
  const [noteText, setNoteText] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [newLeadCourse, setNewLeadCourse] = useState('Caregiver Training');
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callNote, setCallNote] = useState('');
  const [workflowSavedMsg, setWorkflowSavedMsg] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiAutoSending, setAiAutoSending] = useState(false);
  const [aiSandboxModalOpen, setAiSandboxModalOpen] = useState(false);
  const [localBotCfg, setLocalBotCfg] = useState(() => getBotSettings());

  const activeBotCfg = propBotCfg || localBotCfg;
  const activeReplyMode = resolveBotMode(activeBotCfg);

  useEffect(() => {
    if (!propBotCfg) {
      fetchRemoteBotSettings().then(setLocalBotCfg).catch(() => {});
    }
  }, [propBotCfg]);

  const handleChangeWorkspaceReplyMode = async (nextMode) => {
    if (!nextMode || nextMode === activeReplyMode) return;
    if (propOnChangeReplyMode) {
      await propOnChangeReplyMode(nextMode);
      return;
    }
    const nextCfg = {
      ...localBotCfg,
      replyMode: nextMode,
      autoBotEnabled: nextMode !== 'manual',
      aiCounselorEnabled: nextMode === 'ai'
    };
    setLocalBotCfg(nextCfg);
    try {
      await saveBotSettings(nextCfg);
      setSendFeedback({
        type: 'success',
        text:
          nextMode === 'ai'
            ? 'AI Mode active: Real 2-way AI Counselor handles incoming WhatsApp chats.'
            : nextMode === 'bot'
              ? 'Bot Mode active: Keyword Menu Bot handles replies (AI OFF).'
              : 'Manual Mode active: Both AI & Bot OFF (100% manual chat).'
      });
    } catch {
      setLocalBotCfg(localBotCfg);
    }
  };

  // High-performance Optimistic State (0ms Seen/Unseen, 0ms Message Display, 0ms Bot Mode Toggle)
  const [optimisticReadSet, setOptimisticReadSet] = useState(() => new Set());
  const [optimisticMessagesMap, setOptimisticMessagesMap] = useState({});
  const [botModesMap, setBotModesMap] = useState({});
  const [adHocThreads, setAdHocThreads] = useState([]);
  const [visibleLimit, setVisibleLimit] = useState(60);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const swipeStartRef = useRef(null);
  const pillScrollRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    setVisibleLimit(60);
  }, [roleFilter, searchQuery]);

  // Reconcile & prune optimistic messages once persisted in threads (prevents duplicate bubbles)
  const isOptimisticSynced = (optMsg, persistedMsgs) => {
    if (!optMsg || optMsg.status === 'failed') return false;
    const optContent = String(optMsg.content || '').trim();
    const optTs = new Date(optMsg.createdAt || 0).getTime();
    return (persistedMsgs || []).some((m) => {
      if (m.direction !== optMsg.direction) return false;
      if (String(m.content || '').trim() !== optContent) return false;
      const mTs = new Date(m.createdAt || 0).getTime();
      return Math.abs(mTs - optTs) <= 180000;
    });
  };

  useEffect(() => {
    setOptimisticMessagesMap((prev) => {
      const keys = Object.keys(prev);
      if (keys.length === 0) return prev;
      let changed = false;
      const next = {};
      for (const k of keys) {
        const list = prev[k] || [];
        const thread = threads.find((t) => t.key === k);
        const remaining = thread ? list.filter((m) => !isOptimisticSynced(m, thread.messages)) : list;
        if (remaining.length !== list.length) changed = true;
        if (remaining.length > 0) next[k] = remaining;
      }
      return changed ? next : prev;
    });
  }, [threads]);

  // Compute enriched threads with instant optimistic updates + ad-hoc dialer threads
  const computedThreads = useMemo(() => {
    const existingKeys = new Set(threads.map((t) => t.key));
    const mergedSource = [
      ...adHocThreads.filter((a) => !existingKeys.has(a.key)),
      ...threads
    ];
    return mergedSource.map((t) => {
      const isRead = optimisticReadSet.has(t.key);
      const unreadCount = isRead ? 0 : t.unreadCount;
      const rawOptMsgs = optimisticMessagesMap[t.key] || [];
      const optMsgs = rawOptMsgs.length > 0 ? rawOptMsgs.filter((m) => !isOptimisticSynced(m, t.messages)) : [];
      const allMsgs = optMsgs.length > 0 ? [...t.messages, ...optMsgs] : t.messages;
      const lastMsg = allMsgs.length > 0 ? allMsgs[allMsgs.length - 1] : null;
      const botPaused = botModesMap[t.key] !== undefined ? botModesMap[t.key].paused : t.botPaused;

      return {
        ...t,
        unreadCount,
        botPaused,
        messages: allMsgs,
        lastMessage: lastMsg ? lastMsg.content : t.lastMessage,
        lastMessageStatus: lastMsg ? lastMsg.status : (t.lastMessageStatus || null),
        lastMessageDirection: lastMsg ? lastMsg.direction : (t.lastMessageDirection || null),
        lastTimestamp: lastMsg ? (lastMsg.createdAt || lastMsg.timestamp) : t.lastTimestamp
      };
    });
  }, [threads, adHocThreads, optimisticReadSet, optimisticMessagesMap, botModesMap]);

  useEffect(() => {
    if (initialPhone) {
      const digits = String(initialPhone).replace(/\D/g, '').slice(-10);
      const match = computedThreads.find((t) => t.key === digits);
      if (match) {
        setSelectedKey(match.key);
        if (isMobile) setMobileView('chat');
      }
      if (initialDraft) {
        setDraft(initialDraft);
      }
    }
  }, [initialPhone, initialDraft, jumpNonce, computedThreads, isMobile]);

  useEffect(() => {
    if (!selectedKey && computedThreads.length > 0 && !isMobile) {
      setSelectedKey(computedThreads[0].key);
    }
  }, [computedThreads, selectedKey, isMobile]);

  // Native mobile Back button / gesture returns from Chat -> Contact List smoothly
  useEffect(() => {
    if (!isMobile || mobileView !== 'chat' || typeof window === 'undefined') return undefined;
    window.history.pushState({ waMobileChat: true }, '');
    const handlePop = () => {
      setMobileView('list');
    };
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, [isMobile, mobileView]);

  // Keep latest message visible when mobile soft keyboard opens/resizes
  useEffect(() => {
    if (!isMobile || mobileView !== 'chat' || typeof window === 'undefined' || !window.visualViewport) return undefined;
    const onResize = () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    };
    window.visualViewport.addEventListener('resize', onResize);
    return () => window.visualViewport?.removeEventListener('resize', onResize);
  }, [isMobile, mobileView]);

  const searchDigits = useMemo(() => {
    const d = searchQuery.replace(/\D/g, '');
    const ten = d.length >= 10 ? d.slice(-10) : '';
    return /^9[678]\d{8}$/.test(ten) ? ten : '';
  }, [searchQuery]);

  const canStartDirectChat = useMemo(() => {
    if (!searchDigits) return false;
    return !computedThreads.some(
      (t) => (t.channelPlatform || 'whatsapp') === 'whatsapp' && String(t.phone || '').replace(/\D/g, '').slice(-10) === searchDigits
    );
  }, [searchDigits, computedThreads]);

  const handleStartDirectNumberChat = (digits, defaultChannel = 'SMS') => {
    if (!digits) return;
    const newThread = {
      key: digits,
      phone: digits,
      channelPlatform: 'whatsapp',
      name: `+977 ${digits}`,
      role: 'New Inquiry',
      entity: null,
      messages: [],
      adReferral: null,
      unreadCount: 0,
      botPaused: false,
      pinned: false,
      assignedTo: '',
      lastMessage: 'New direct chat',
      lastTimestamp: new Date().toISOString()
    };
    setAdHocThreads((prev) => (prev.some((p) => p.key === digits) ? prev : [newThread, ...prev]));
    setSelectedKey(digits);
    setSendChannel(defaultChannel);
    if (isMobile) setMobileView('chat');
  };

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qDigits = searchQuery.replace(/\D/g, '');
    const todayStr = new Date().toISOString().slice(0, 10);
    return computedThreads.filter((t) => {
      if (roleFilter === 'Needs Reply' && !t.needsReply) return false;
      if (roleFilter === 'Needs Human' && !t.botPaused) return false;
      if (roleFilter === 'Unread' && t.unreadCount === 0) return false;
      if (roleFilter === 'Pinned' && !t.pinned) return false;
      if (roleFilter === 'Due / Today') {
        const isLeadDue = t.role === 'Lead' && t.entity?.nextFollowUp && t.entity.nextFollowUp <= todayStr && t.entity.stage !== 'Converted';
        const isFeeDue = t.role === 'Student' && Number(t.entity?.dueFee || 0) > 0;
        if (!isLeadDue && !isFeeDue) return false;
      }
      if (roleFilter === 'WhatsApp' && (t.channelPlatform || 'whatsapp') !== 'whatsapp') return false;
      if (roleFilter === 'Messenger' && t.channelPlatform !== 'messenger') return false;
      if (roleFilter === 'FB Comments' && t.channelPlatform !== 'fb_comment') return false;
      if (roleFilter === 'FB Ads' && !t.adReferral && !t.messages.some((m) => m.messageType === 'fb_ad_inquiry')) return false;
      if (['Lead', 'Student', 'Trainer', 'Employer'].includes(roleFilter) && t.role !== roleFilter) return false;
      if (!q) return true;
      const phoneDigits = String(t.phone || '').replace(/\D/g, '');
      const hasMessageMatch = (t.messages || []).some((m) => (m.content || '').toLowerCase().includes(q));
      return (
        (t.name || '').toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q) ||
        (qDigits.length >= 3 && phoneDigits.includes(qDigits)) ||
        (t.entity?.tgid || '').toLowerCase().includes(q) ||
        (t.entity?.course || '').toLowerCase().includes(q) ||
        (t.assignedTo || '').toLowerCase().includes(q) ||
        (t.role || '').toLowerCase().includes(q) ||
        (t.lastMessage || '').toLowerCase().includes(q) ||
        hasMessageMatch
      );
    });
  }, [computedThreads, roleFilter, searchQuery]);

  const activeThread = useMemo(
    () => computedThreads.find((t) => t.key === selectedKey) || filteredThreads[0] || null,
    [computedThreads, filteredThreads, selectedKey]
  );

  const liveDb = useMemo(() => loadDB(), [threads, activeThread?.key, workflowSavedMsg]);

  const studentLedgerData = useMemo(() => {
    if (!activeThread || activeThread.role !== 'Student' || !activeThread.entity) return null;
    const std = activeThread.entity;
    const grp = (liveDb.trainingGroups || []).find((g) => g.id === std.groupId);
    const course = (liveDb.courses || []).find((c) => c.id === (std.courseId || grp?.courseId));
    const totalFee = Number(std.totalFee ?? std.feeAmount ?? course?.price ?? course?.fee ?? 0);
    const studentPayments = (liveDb.payments || []).filter((p) => p.studentId === std.id);
    const paidFromPayments = studentPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const paid = studentPayments.length > 0 ? paidFromPayments : Number(std.paidFee ?? std.feePaid ?? 0);
    const due = Math.max(0, totalFee - paid);
    const stage =
      due <= 0 && totalFee > 0
        ? { label: 'Cleared — Final Bill Ready', tone: 'success' }
        : paid === 0
        ? { label: 'Advance Pending (50%)', tone: 'warning' }
        : { label: 'Installment / Partial', tone: 'info' };

    return {
      totalFee,
      paid,
      due,
      courseName: course?.title || 'Vocational Course',
      stage,
      studentPayments,
      ledgerObj: {
        totalFee,
        paid,
        due,
        courseName: course?.title || 'Vocational Course',
        status: due <= 0 && totalFee > 0 ? 'Cleared' : paid > 0 ? 'Partial' : 'Pending'
      }
    };
  }, [activeThread, liveDb]);

  // 24-hour WhatsApp customer-service window indicator
  const waWindowStatus = useMemo(() => {
    if (!activeThread || (activeThread.channelPlatform && activeThread.channelPlatform !== 'whatsapp')) {
      return null;
    }
    const inboundMsgs = (activeThread.messages || []).filter((m) => m.direction === 'inbound' && m.createdAt);
    if (inboundMsgs.length === 0) return { isOpen: false, label: '24h Expired • Use Template or SMS' };
    const latestInbound = inboundMsgs.reduce((max, m) => Math.max(max, new Date(m.createdAt).getTime()), 0);
    const isOpen = Date.now() - latestInbound <= 24 * 60 * 60 * 1000;
    return isOpen
      ? { isOpen: true, label: '24h Open' }
      : { isOpen: false, label: '24h Expired • Use Template or SMS' };
  }, [activeThread]);

  // Auto-detect Nepal 10-digit phone number inside FB Messenger / Comment messages
  const detectedFbPhone = useMemo(() => {
    if (!activeThread || !['messenger', 'fb_comment'].includes(activeThread.channelPlatform)) return '';
    if (activeThread.role === 'Lead' || activeThread.role === 'Student') return '';
    const msgs = [...(activeThread.messages || [])].reverse();
    for (const m of msgs) {
      const match = String(m.content || '').match(/(?:\+?977[\s-]?)?(9[678]\d{8})\b/);
      if (match && match[1]) {
        const digits = match[1];
        const exists =
          (liveDb.leads || []).some((l) => String(l.phone || '').replace(/\D/g, '').slice(-10) === digits) ||
          (liveDb.students || []).some((s) => String(s.phone || '').replace(/\D/g, '').slice(-10) === digits);
        if (!exists) return digits;
      }
    }
    return '';
  }, [activeThread, liveDb]);

  const handleSaveDetectedFbLead = (phoneDigits) => {
    if (!phoneDigits || !activeThread) return;
    const db = loadDB();
    const newLead = {
      id: `LD-${Date.now()}`,
      name: activeThread.name && activeThread.name !== 'FB Visitor' ? activeThread.name : `FB Lead ${phoneDigits.slice(-4)}`,
      phone: phoneDigits,
      course: '',
      source: activeThread.channelPlatform === 'fb_comment' ? 'Facebook Comment' : 'Facebook Messenger',
      status: 'New',
      stage: 'New Lead',
      priority: 'High',
      notes: `Captured from ${activeThread.channelPlatform === 'fb_comment' ? 'FB Comment' : 'FB Messenger'} (${activeThread.phone})`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    saveDB({ ...db, leads: [newLead, ...(db.leads || [])] });
    setWorkflowSavedMsg(`Saved ${newLead.name} (${phoneDigits}) as Lead!`);
    setTimeout(() => setWorkflowSavedMsg(''), 3500);
    onRefresh?.();
  };

  const handleSavePaymentFromHub = (newPayment) => {
    const currentDb = loadDB();
    const nextPayments = [newPayment, ...(currentDb.payments || [])];
    const nextStudents = (currentDb.students || []).map((s) => {
      if (s.id !== newPayment.studentId) return s;
      const total = Number(s.totalFee || 0);
      const paid = nextPayments
        .filter((p) => p.studentId === s.id)
        .reduce((acc, p) => acc + Number(p.amount || 0), 0);
      return { ...s, paidFee: paid, dueFee: Math.max(0, total - paid) };
    });
    let nextDb = { ...currentDb, payments: nextPayments, students: nextStudents };
    try {
      nextDb = postDoubleEntryJournal(nextDb, {
        date: newPayment.date,
        narration: `Fee Receipt ${newPayment.receiptNo} (${activeThread?.name || 'Student'})`,
        debitAccount: newPayment.method === 'Cash' ? 'Cash in Hand' : 'Bank Account',
        creditAccount: 'Tuition Fee Income',
        amount: Number(newPayment.amount || 0),
        referenceId: newPayment.receiptNo
      });
    } catch {
      // ignore if journal helper throws
    }
    saveDB(nextDb);
    setWorkflowSavedMsg(`Receipt ${newPayment.receiptNo} saved & sent!`);
    setTimeout(() => setWorkflowSavedMsg(''), 3500);
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages?.length, activeThread?.key]);

  const handleSelectThread = (thread) => {
    setSelectedKey(thread.key);
    setOptimisticReadSet((prev) => new Set(prev).add(thread.key));
    markThreadRead(thread.key || thread.phone);
    if (isMobile) setMobileView('chat');
  };

  const handleSend = async (customText = null, opts = {}) => {
    const textToSend = (customText ?? draft).trim();
    if (!textToSend || !activeThread) return;

    const effectiveChannel = opts.forceChannel || sendChannel;
    if (!customText) setDraft('');

    // Instant 1ms optimistic message preview in chat
    const optId = `OPT-${Date.now()}`;
    const optimisticMsg = {
      id: optId,
      key: activeThread.key,
      phone: activeThread.phone,
      direction: 'outbound',
      messageType: effectiveChannel === 'Note' ? 'internal_note' : (effectiveChannel === 'SMS' ? 'sms' : 'text'),
      status: 'sent',
      content: textToSend,
      createdAt: new Date().toISOString()
    };
    setOptimisticMessagesMap((prev) => ({
      ...prev,
      [activeThread.key]: [...(prev[activeThread.key] || []), optimisticMsg]
    }));
    setOptimisticReadSet((prev) => new Set(prev).add(activeThread.key));
    markThreadRead(activeThread.key || activeThread.phone);

    setSending(true);
    setSendFeedback(null);
    try {
      const currentDb = loadDB();
      if (effectiveChannel === 'Note' && (!customText || opts.forceChannel === 'Note')) {
        addInternalStaffNote({
          phone: activeThread.phone,
          note: textToSend,
          author: 'Staff',
          channelPlatform: activeThread.channelPlatform || 'whatsapp'
        });
        if (onRefresh) onRefresh();
        return;
      }
      if (effectiveChannel === 'SMS' && (!customText || opts.forceChannel === 'SMS')) {
        await sendAakashSmsReal({
          to: activeThread.phone,
          text: textToSend,
          token: currentDb.settings?.aakashSmsToken
        });
        logCommunication(currentDb, {
          recipientType: activeThread.role || 'Contact',
          recipientId: activeThread.entity?.id || activeThread.key,
          recipientName: activeThread.name,
          recipientPhone: activeThread.phone,
          channel: 'SMS',
          messageText: textToSend
        });
        const cleanDigits = String(activeThread.phone || '').replace(/\D/g, '').slice(-10);
        const nameHasPhone = cleanDigits && String(activeThread.name || '').replace(/\D/g, '').includes(cleanDigits);
        const recipientLabel = nameHasPhone ? activeThread.name : `${activeThread.name} (${activeThread.phone})`;
        setSendFeedback({ type: 'success', text: `SMS sent via Aakash SMS to ${recipientLabel}.` });
      } else if (activeThread.channelPlatform === 'messenger' || activeThread.channelPlatform === 'fb_comment') {
        await sendFacebookReply({
          targetId: activeThread.phone,
          targetName: activeThread.name,
          channel: activeThread.channelPlatform,
          text: textToSend
        });
      } else {
        await sendMetaWhatsAppMessage({
          to: activeThread.phone,
          type: 'text',
          text: textToSend
        });
        logCommunication(currentDb, {
          recipientType: activeThread.role || 'Contact',
          recipientId: activeThread.entity?.id || activeThread.key,
          recipientName: activeThread.name,
          recipientPhone: activeThread.phone,
          channel: 'WhatsApp',
          messageText: textToSend
        });
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setOptimisticMessagesMap((prev) => ({
        ...prev,
        [activeThread.key]: (prev[activeThread.key] || []).map((m) =>
          m.id === optId ? { ...m, status: 'failed' } : m
        )
      }));
      setSendFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendDocument = async () => {
    if (!activeThread || !docForm.url.trim()) return;
    setSending(true);
    setSendFeedback(null);
    try {
      await sendMetaWhatsAppMessage({
        to: activeThread.phone,
        type: 'document',
        document: {
          url: docForm.url.trim(),
          filename: docForm.filename.trim() || 'Document.pdf',
          caption: docForm.caption.trim()
        },
        text: `[Document: ${docForm.filename || 'PDF'}] ${docForm.caption || docForm.url}`
      });
      setDocModalOpen(false);
      setDocForm({ url: '', filename: 'Brochure.pdf', caption: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setSendFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendMetaTemplate = async () => {
    if (!activeThread || !metaTplForm.name.trim()) return;
    setSending(true);
    setSendFeedback(null);
    try {
      await sendMetaWhatsAppMessage({
        to: activeThread.phone,
        type: 'template',
        template: {
          name: metaTplForm.name.trim(),
          language: { code: metaTplForm.language.trim() || 'en_US' }
        },
        text: `[Meta Template: ${metaTplForm.name.trim()}]`
      });
      setTplModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setSendFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleQuickShare = async (kind) => {
    if (!activeThread) return;
    const currentDb = loadDB();
    if (kind === 'brochure') {
      const courseName = activeThread.entity?.course || activeThread.entity?.subject || '';
      const matchedCourse = (currentDb.courses || []).find((c) =>
        courseName ? (c.title || '').toLowerCase().includes(courseName.toLowerCase()) : false
      ) || (currentDb.courses || [])[0];
      setSending(true);
      try {
        await sendWhatsAppBrochureDirect(activeThread.phone, matchedCourse);
        if (onRefresh) onRefresh();
      } catch (err) {
        setSendFeedback({ type: 'error', text: err.message });
      } finally {
        setSending(false);
      }
    } else if (kind === 'location') {
      await handleSend(renderWhatsAppTemplate('campus_location', { name: activeThread.name }));
    } else if (kind === 'fee') {
      const due = Number(studentLedgerData?.due ?? activeThread.entity?.dueFee ?? 0).toLocaleString();
      await handleSend(
        renderWhatsAppTemplate('fee_reminder', {
          name: activeThread.name,
          course: studentLedgerData?.courseName || activeThread.entity?.course || 'Vocational Training',
          due
        })
      );
    } else if (kind === 'certificate') {
      const cert = (currentDb.certificates || []).find(
        (c) => activeThread.entity?.id && c.studentId === activeThread.entity.id
      );
      const certNum = cert?.certificateNo || cert?.certNo;
      const verifyUrl = certNum
        ? `https://globalera.vercel.app/?verify=${encodeURIComponent(certNum)}`
        : `https://globalera.vercel.app`;
      await handleSend(
        renderWhatsAppTemplate('certificate_verify', {
          name: activeThread.name,
          verifyUrl
        })
      );
    }
  };

  const handleLogCall = () => {
    if (!activeThread) return;
    const currentDb = loadDB();
    logCommunication(currentDb, {
      recipientType: activeThread.role || 'Contact',
      recipientId: activeThread.entity?.id || activeThread.key,
      recipientName: activeThread.name,
      recipientPhone: activeThread.phone,
      channel: 'Phone Call',
      callStatus: callOutcome,
      messageText: `[Call: ${callOutcome}] ${callNote.trim() || 'Phone follow-up logged from WhatsApp Hub'}`
    });
    setCallNote('');
    setWorkflowSavedMsg(`Call (${callOutcome}) logged!`);
    setTimeout(() => setWorkflowSavedMsg(''), 2500);
    if (onRefresh) onRefresh();
  };

  const handleSaveLeadWorkflow = (nextStage) => {
    if (!activeThread?.entity || activeThread.role !== 'Lead') return;
    const db = loadDB();
    const updatedLeads = (db.leads || []).map((l) => {
      if (l.id !== activeThread.entity.id) return l;
      const followUps = [...(l.followUps || [])];
      if (noteText.trim()) {
        followUps.unshift({
          id: `FU-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          note: noteText.trim(),
          by: 'WhatsApp Hub'
        });
      }
      return {
        ...l,
        stage: nextStage || l.stage,
        nextFollowUp: nextFollowUp || l.nextFollowUp,
        followUps
      };
    });
    saveDB({ ...db, leads: updatedLeads });
    setNoteText('');
    setWorkflowSavedMsg('Lead workflow updated');
    setTimeout(() => setWorkflowSavedMsg(''), 2500);
    if (onRefresh) onRefresh();
  };

  const handleConvertVisitorToLead = () => {
    if (!activeThread) return;
    const db = loadDB();
    const newLead = {
      id: `LD-${Date.now()}`,
      name: activeThread.name || 'WhatsApp Inquiry',
      phone: activeThread.phone,
      course: activeThread.adReferral?.headline || newLeadCourse,
      source: activeThread.adReferral ? 'Facebook Ad (WhatsApp)' : 'WhatsApp Direct',
      stage: 'New Lead',
      priority: 'High',
      notes: activeThread.lastMessage || 'Inquiry from WhatsApp Hub',
      createdAt: new Date().toISOString(),
      followUps: []
    };
    saveDB({ ...db, leads: [newLead, ...(db.leads || [])] });
    setWorkflowSavedMsg('Saved to Leads CRM!');
    setTimeout(() => setWorkflowSavedMsg(''), 3000);
    if (onRefresh) onRefresh();
  };

  const renderLeftPane = () => (
    <Box
      sx={{
        width: { xs: '100%', md: 300 },
        flexShrink: 0,
        borderRight: { md: '1px solid #E2E8F0' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
        height: '100%',
        minHeight: 0
      }}
    >
      {/* Search + Refresh */}
      <Box sx={{ p: 1.25, borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, message, course..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                bgcolor: '#F8FAFC',
                '& fieldset': { borderColor: '#E2E8F0' }
              },
              '& input': { fontSize: { xs: '16px', md: '0.875rem' } }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 17, color: '#64748B' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Clear search" onClick={() => setSearchQuery('')}>
                    <CloseIcon sx={{ fontSize: 15, color: '#64748B' }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          {onRefresh && (
            <Tooltip title="Sync live WhatsApp messages">
              <IconButton size="small" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Horizontal Scrollable Filter Pills */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton
            size="small"
            aria-label="Scroll filters left"
            onClick={() => pillScrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
            sx={{ p: 0.25, color: '#64748B', display: { xs: 'none', md: 'inline-flex' } }}
          >
            <ChevronLeftIcon sx={{ fontSize: 17 }} />
          </IconButton>
          <Box
            ref={pillScrollRef}
            onWheel={(e) => {
              if (pillScrollRef.current && Math.abs(e.deltaY) > 0) {
                pillScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            sx={{
              display: 'flex',
              gap: 0.6,
              overflowX: 'auto',
              flex: 1,
              py: 0.25,
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {['All', 'Needs Reply', 'Needs Human', 'Unread', 'WhatsApp', 'Messenger', 'FB Comments', 'FB Ads', 'Pinned', 'Due / Today', 'Lead', 'Student', 'Trainer', 'Employer'].map((tab) => {
              const active = roleFilter === tab;
              const needsReplyCount = tab === 'Needs Reply' ? computedThreads.filter((x) => x.needsReply).length : 0;
              const needsHumanCount = tab === 'Needs Human' ? computedThreads.filter((x) => x.botPaused).length : 0;
              const unreadTabCount = tab === 'Unread' ? computedThreads.filter((x) => x.unreadCount > 0).length : 0;
              const tabLabel =
                tab === 'Lead' ? 'Leads'
                : tab === 'Student' ? 'Students'
                : tab === 'Trainer' ? 'Trainers'
                : tab === 'Employer' ? 'Employers'
                : tab === 'Needs Reply' && needsReplyCount > 0 ? `Needs Reply (${needsReplyCount})`
                : tab === 'Needs Human' && needsHumanCount > 0 ? `Needs Human (${needsHumanCount})`
                : tab === 'Unread' && unreadTabCount > 0 ? `Unread (${unreadTabCount})`
                : tab;
              return (
                <Chip
                  key={tab}
                  size="small"
                  label={tabLabel}
                  onClick={() => setRoleFilter(tab)}
                  sx={{
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontWeight: 700,
                    bgcolor: active
                      ? (tab === 'Needs Human' ? '#DC2626' : tab === 'Needs Reply' ? '#D97706' : '#0F2C59')
                      : (tab === 'Needs Human' && needsHumanCount > 0 ? '#FEF2F2' : tab === 'Needs Reply' && needsReplyCount > 0 ? '#FFFBEB' : '#F1F5F9'),
                    color: active
                      ? '#FFFFFF'
                      : (tab === 'Needs Human' && needsHumanCount > 0 ? '#DC2626' : tab === 'Needs Reply' && needsReplyCount > 0 ? '#B45309' : '#475569'),
                    '&:hover': { bgcolor: active ? '#0F2C59' : '#E2E8F0' }
                  }}
                />
              );
            })}
          </Box>
          <IconButton
            size="small"
            aria-label="Scroll filters right"
            onClick={() => pillScrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
            sx={{ p: 0.25, color: '#64748B', display: { xs: 'none', md: 'inline-flex' } }}
          >
            <ChevronRightIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Contact List */}
      <Box sx={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        {canStartDirectChat && (
          <Box sx={{ p: 1.25, borderBottom: '1px solid #E2E8F0', bgcolor: '#F0FDF4' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', display: 'block', mb: 0.75 }}>
              New mobile number detected: +977 {searchDigits}
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                startIcon={<SmsIcon sx={{ fontSize: 15 }} />}
                onClick={() => handleStartDirectNumberChat(searchDigits, 'SMS')}
                sx={{ textTransform: 'none', fontWeight: 800, bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' }, fontSize: '0.72rem' }}
              >
                Send SMS
              </Button>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                onClick={() => handleStartDirectNumberChat(searchDigits, 'WhatsApp')}
                sx={{ textTransform: 'none', fontWeight: 800, color: '#15803D', borderColor: '#86EFAC', bgcolor: '#FFFFFF', fontSize: '0.72rem' }}
              >
                WA Chat
              </Button>
            </Stack>
          </Box>
        )}
        {filteredThreads.length === 0 && !canStartDirectChat ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
              No matching contacts found.
            </Typography>
          </Box>
        ) : (
          filteredThreads.slice(0, visibleLimit).map((t) => {
            const isSelected = activeThread?.key === t.key;
            const roleStyle = ROLE_COLORS[t.role] || ROLE_COLORS['New Inquiry'];
            const hasAd = Boolean(t.adReferral) || t.messages.some((m) => m.messageType === 'fb_ad_inquiry');
            return (
              <Box
                key={t.key}
                onClick={() => handleSelectThread(t)}
                sx={{
                  px: 1.5,
                  py: { xs: 1.45, md: 1.15 },
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  borderBottom: '1px solid #F1F5F9',
                  bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  borderLeft: isSelected ? '3px solid #0F2C59' : '3px solid transparent',
                  transition: 'background-color 0.12s ease, transform 0.08s ease',
                  WebkitTapHighlightColor: 'transparent',
                  '&:active': { bgcolor: '#E2E8F0', transform: 'scale(0.985)' },
                  '&:hover': { bgcolor: isSelected ? '#EFF6FF' : '#F8FAFC' }
                }}
              >
                <Badge
                  badgeContent={t.unreadCount}
                  overlap="circular"
                  invisible={!t.unreadCount}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#25D366',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      height: 19,
                      minWidth: 19,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.18)'
                    }
                  }}
                >
                  <Avatar
                    src={t.entity?.photo || t.entity?.photoUrl || undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: roleStyle.bg,
                      color: roleStyle.color,
                      border: `1px solid ${roleStyle.border}`,
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}
                  >
                    {(t.name || 'W').slice(0, 2).toUpperCase()}
                  </Avatar>
                </Badge>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: t.unreadCount ? 800 : 700,
                        color: t.unreadCount ? '#0F172A' : '#1E293B',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.4
                      }}
                    >
                      {t.pinned && <StarIcon sx={{ fontSize: 13, color: '#F59E0B', flexShrink: 0 }} />}
                      {t.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: t.unreadCount ? '#16A34A' : '#64748B',
                        fontWeight: t.unreadCount ? 800 : 500,
                        fontSize: '0.67rem',
                        flexShrink: 0
                      }}
                    >
                      {formatTimeShort(t.lastTimestamp)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                    <Box
                      component="span"
                      sx={{
                        px: 0.65,
                        py: 0.1,
                        borderRadius: 1,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: roleStyle.bg,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                        flexShrink: 0
                      }}
                    >
                      {t.role}
                    </Box>
                    {t.botPaused && (
                      <Box
                        component="span"
                        sx={{
                          px: 0.6,
                          py: 0.1,
                          borderRadius: 1,
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          bgcolor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          flexShrink: 0
                        }}
                      >
                        Human
                      </Box>
                    )}
                    {!t.botPaused && t.needsReply && (
                      <Box
                        component="span"
                        sx={{
                          px: 0.55,
                          py: 0.1,
                          borderRadius: 1,
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          bgcolor: '#FFFBEB',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                          flexShrink: 0
                        }}
                      >
                        Reply
                      </Box>
                    )}
                    {hasAd && (
                      <Box
                        component="span"
                        sx={{
                          px: 0.6,
                          py: 0.1,
                          borderRadius: 1,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          bgcolor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          flexShrink: 0
                        }}
                      >
                        FB Ad
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35, minWidth: 0, flex: 1 }}>
                      {t.lastMessageDirection === 'outbound' && (
                        t.lastMessageStatus === 'read' ? (
                          <DoneAllIcon sx={{ fontSize: 14, color: '#53BDEB', flexShrink: 0 }} />
                        ) : t.lastMessageStatus === 'delivered' ? (
                          <DoneAllIcon sx={{ fontSize: 14, color: '#8696A0', flexShrink: 0 }} />
                        ) : (
                          <DoneIcon sx={{ fontSize: 14, color: '#8696A0', flexShrink: 0 }} />
                        )
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: t.unreadCount ? '#0F172A' : '#64748B',
                          fontWeight: t.unreadCount ? 700 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {t.lastMessage || t.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
        {filteredThreads.length > visibleLimit && (
          <Box sx={{ p: 1.25, textAlign: 'center', borderTop: '1px solid #F1F5F9' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setVisibleLimit((prev) => prev + 60)}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              Show More ({filteredThreads.length - visibleLimit} remaining)
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  const renderWorkflowPanel = () => {
    if (!activeThread) return null;
    const roleStyle = ROLE_COLORS[activeThread.role] || ROLE_COLORS['New Inquiry'];
    const entity = activeThread.entity;

    return (
      <Box
        sx={{
          width: { xs: '100%', md: 310 },
          flexShrink: 0,
          borderLeft: { md: '1px solid #E2E8F0' },
          bgcolor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          p: 1.75,
          gap: 1.5
        }}
      >
        {/* Identity Summary Card + Staff Assignment */}
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar
              src={entity?.photo || entity?.photoUrl || undefined}
              sx={{ width: 44, height: 44, bgcolor: roleStyle.bg, color: roleStyle.color, fontWeight: 800 }}
            >
              {(activeThread.name || 'W').slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }} noWrap>
                {activeThread.name}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                title={activeThread.phone}
                sx={{ color: '#64748B', display: 'block', fontVariantNumeric: 'tabular-nums' }}
              >
                {activeThread.phone}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              {isMobile && (
                <IconButton
                  size="small"
                  aria-label={activeThread.pinned ? 'Unpin contact' : 'Pin contact'}
                  onClick={() => togglePinContact(activeThread.key || activeThread.phone)}
                  sx={{
                    bgcolor: activeThread.pinned ? '#FFFBEB' : '#F1F5F9',
                    color: activeThread.pinned ? '#D97706' : '#64748B'
                  }}
                >
                  {activeThread.pinned ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                </IconButton>
              )}
              <StatusBadge
                label={activeThread.role}
                tone={activeThread.role === 'Student' ? 'success' : activeThread.role === 'Lead' ? 'warning' : 'primary'}
              />
            </Box>
          </Box>
          <TextField
            select
            fullWidth
            size="small"
            label="Assigned Team / Desk"
            value={activeThread.assignedTo || ''}
            onChange={(e) => assignThreadStaff(activeThread.key || activeThread.phone, e.target.value)}
            InputLabelProps={{ shrink: true }}
            SelectProps={{ native: true }}
          >
            <option value="">Unassigned</option>
            <option value="Admission Counselor">Admission Counselor</option>
            <option value="Accounts Desk">Accounts Desk</option>
            <option value="Placement & OJT">Placement & OJT</option>
            <option value="Super Admin">Super Admin</option>
          </TextField>
        </Paper>

        {workflowSavedMsg && (
          <Alert severity="success" sx={{ py: 0.25, borderRadius: 2 }}>
            {workflowSavedMsg}
          </Alert>
        )}

        {/* Auto-Detected Phone from FB Messenger / Comment */}
        {detectedFbPhone && (
          <Paper
            elevation={0}
            sx={{ p: 1.35, borderRadius: 2.5, border: '1px solid #93C5FD', bgcolor: '#EFF6FF', display: 'flex', flexDirection: 'column', gap: 0.75 }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>
              Phone Detected in Chat
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
              +977 {detectedFbPhone}
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => handleSaveDetectedFbLead(detectedFbPhone)}
              sx={{ fontWeight: 800, textTransform: 'none', bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
            >
              Save as Lead
            </Button>
          </Paper>
        )}

        {/* FB Ad Referral Card */}
        {activeThread.adReferral && (
          <Paper
            elevation={0}
            sx={{ p: 1.35, borderRadius: 2.5, border: '1px solid #BFDBFE', bgcolor: '#EFF6FF' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <CampaignIcon sx={{ fontSize: 16, color: '#1D4ED8' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>
                Facebook Ad Referral
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              {activeThread.adReferral.headline || 'Click-to-WhatsApp Ad'}
            </Typography>
            {activeThread.adReferral.body && (
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.25 }}>
                {activeThread.adReferral.body}
              </Typography>
            )}
          </Paper>
        )}

        {/* Role-Specific Live Workflow */}
        {activeThread.role === 'Lead' && entity && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              Lead Pipeline Workflow
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {['New Lead', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Lost / Cancelled'].map((st) => {
                const active = entity.stage === st;
                return (
                  <Chip
                    key={st}
                    size="small"
                    label={st}
                    onClick={() => handleSaveLeadWorkflow(st)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      bgcolor: active ? '#0F2C59' : '#F1F5F9',
                      color: active ? '#FFFFFF' : '#475569'
                    }}
                  />
                );
              })}
            </Box>
            <TextField
              size="small"
              type="date"
              label="Next Follow-up Date"
              InputLabelProps={{ shrink: true }}
              value={nextFollowUp || entity.nextFollowUp || ''}
              onChange={(e) => setNextFollowUp(e.target.value)}
            />
            <TextField
              size="small"
              multiline
              rows={2}
              label="Log Counselling Note"
              placeholder="Write call or WhatsApp discussion..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<NoteAddIcon />}
              onClick={() => handleSaveLeadWorkflow()}
              sx={{ fontWeight: 800 }}
            >
              Save Workflow Update
            </Button>
            {entity.stage !== 'Converted' && (
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<HowToRegIcon />}
                onClick={() => setConvertModalOpen(true)}
                sx={{ fontWeight: 800, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
              >
                Admit / Convert to Student
              </Button>
            )}
          </Paper>
        )}

        {activeThread.role === 'Student' && entity && studentLedgerData && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
                Fee & Billing Workflow
              </Typography>
              <StatusBadge label={studentLedgerData.stage.label} tone={studentLedgerData.stage.tone} showDot />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, bgcolor: '#F8FAFC', p: 1, borderRadius: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>TGID / Total Fee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {entity.tgid || '-'} • Rs. {studentLedgerData.totalFee.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Status</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{entity.status || 'Active'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Total Paid</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                  Rs. {studentLedgerData.paid.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Remaining Due</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: studentLedgerData.due > 0 ? '#DC2626' : '#059669', fontVariantNumeric: 'tabular-nums' }}>
                  Rs. {studentLedgerData.due.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {studentLedgerData.due > 0 && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PointOfSaleIcon />}
                onClick={() => setPaymentModalOpen(true)}
                sx={{ fontWeight: 800, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
              >
                Collect Fee & Send Receipt
              </Button>
            )}

            <Button
              variant={studentLedgerData.due === 0 ? 'contained' : 'outlined'}
              size="small"
              startIcon={<ReceiptLongIcon />}
              onClick={() => setReceiptModalOpen(true)}
              sx={{ fontWeight: 800 }}
            >
              {studentLedgerData.due === 0 ? 'View / Print Final Clearance Bill' : 'View / Print Bill & Receipts'}
            </Button>

            {studentLedgerData.due > 0 && (
              <Stack direction="row" spacing={0.75}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<PaymentsIcon />}
                  onClick={() => handleSend(QUICK_TEMPLATES[1].build(activeThread))}
                  sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none' }}
                >
                  Fee Reminder (WA)
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<SmsIcon />}
                  onClick={() =>
                    handleSend(
                      `Namaste ${entity.name}, Prabidhik School (Jorpati) bata fee reminder: Tapai ko baki fee Rs. ${studentLedgerData.due.toLocaleString()} chha. Samparka: 01-4910715.`,
                      { forceChannel: 'SMS' }
                    )
                  }
                  sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'none', color: '#0284C7', borderColor: '#7DD3FC' }}
                >
                  Fee Reminder (SMS)
                </Button>
              </Stack>
            )}

            {studentLedgerData.studentPayments.length > 0 && (
              <Box sx={{ pt: 0.5, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                  Recent Receipts (Click to Resend WA)
                </Typography>
                {studentLedgerData.studentPayments.slice(0, 3).map((p) => (
                  <Chip
                    key={p.id}
                    size="small"
                    icon={<WhatsAppIcon sx={{ fontSize: 14, color: '#16A34A' }} />}
                    label={`${p.receiptNo || p.id} • Rs. ${Number(p.amount || 0).toLocaleString()}`}
                    onClick={() =>
                      handleSend(
                        `🧾 *Receipt Copy — Prabidhik School*\nReceipt No: *${p.receiptNo || p.id}*\nStudent: *${entity.name}*\nAmount Paid: *Rs. ${Number(p.amount || 0).toLocaleString()}*\nDate: ${p.date || '-'}\nRemaining Due: *Rs. ${studentLedgerData.due.toLocaleString()}*`
                      )
                    }
                    sx={{ cursor: 'pointer', justifyContent: 'flex-start', fontWeight: 700, bgcolor: '#ECFDF5', color: '#065F46' }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        )}

        {(activeThread.role === 'Trainer' || activeThread.role === 'Employer') && entity && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              {activeThread.role} Details
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {entity.specialization || entity.sector || entity.trade || 'Partner / Faculty'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {entity.email || entity.address || entity.location || 'Global Era Network'}
            </Typography>
          </Paper>
        )}

        {activeThread.role === 'New Inquiry' && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E9D5FF', bgcolor: '#FAF5FF', display: 'flex', flexDirection: 'column', gap: 1.1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase' }}>
              Unsaved WhatsApp / Ad Visitor
            </Typography>
            <TextField
              size="small"
              label="Course Interest"
              value={newLeadCourse}
              onChange={(e) => setNewLeadCourse(e.target.value)}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={handleConvertVisitorToLead}
              sx={{ bgcolor: '#7E22CE', '&:hover': { bgcolor: '#6B21A8' }, fontWeight: 800 }}
            >
              Save as New Lead
            </Button>
          </Paper>
        )}

        {/* Call Outcome Tracker */}
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PhoneInTalkIcon sx={{ fontSize: 16, color: '#0F2C59' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              Phone Call Outcome Log
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {['Connected', 'No Answer', 'Busy', 'Call Back Later'].map((st) => (
              <Chip
                key={st}
                size="small"
                label={st}
                onClick={() => setCallOutcome(st)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  bgcolor: callOutcome === st ? '#0F2C59' : '#F1F5F9',
                  color: callOutcome === st ? '#FFFFFF' : '#475569'
                }}
              />
            ))}
          </Box>
          <TextField
            size="small"
            placeholder="Call summary note..."
            value={callNote}
            onChange={(e) => setCallNote(e.target.value)}
          />
          <Button size="small" variant="outlined" startIcon={<PhoneInTalkIcon />} onClick={handleLogCall} sx={{ fontWeight: 800 }}>
            Log Phone Call
          </Button>
        </Paper>
      </Box>
    );
  };

  const renderCenterPane = () => {
    if (!activeThread) {
      return (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', p: 4 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
            <WhatsAppIcon sx={{ fontSize: 48, color: '#16A34A', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Select a Conversation
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Choose any Lead, Student, Trainer, Employer, or FB Ad inquiry from the left list to start chatting and managing workflows.
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        onTouchStart={(e) => {
          if (!isMobile || e.touches.length !== 1) return;
          const t = e.touches[0];
          swipeStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        }}
        onTouchEnd={(e) => {
          if (!isMobile || !swipeStartRef.current || e.changedTouches.length !== 1) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - swipeStartRef.current.x;
          const dy = Math.abs(t.clientY - swipeStartRef.current.y);
          const dt = Date.now() - swipeStartRef.current.time;
          const startX = swipeStartRef.current.x;
          swipeStartRef.current = null;
          if (startX < 80 && dx > 75 && dy < 45 && dt < 500) {
            setMobileView('list');
          }
        }}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F1F5F9', minWidth: 0, height: '100%', minHeight: 0, position: 'relative' }}
      >
        {/* Chat Header */}
        <Box
          sx={{
            px: { xs: 1, sm: 1.75 },
            py: { xs: 0.9, sm: 1.1 },
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.75
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, minWidth: 0, flex: 1 }}>
            {isMobile && (
              <IconButton size="small" onClick={() => setMobileView('list')} aria-label="Back to list" sx={{ flexShrink: 0 }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
              {(activeThread.name || 'W').slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }} noWrap>
                {activeThread.name}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: '#64748B', display: 'block', fontVariantNumeric: 'tabular-nums', fontSize: '0.7rem' }}>
                {isMobile && (activeThread.channelPlatform === 'messenger' || activeThread.channelPlatform === 'fb_comment')
                  ? `${activeThread.role} • …${String(activeThread.phone || '').slice(-6)}`
                  : `${activeThread.phone} • ${activeThread.role}`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75 }, flexShrink: 0 }}>
            {waWindowStatus && (
              <Tooltip
                title={
                  waWindowStatus.isOpen
                    ? 'Customer messaged within last 24h — free-text WhatsApp replies are allowed.'
                    : 'No inbound message in last 24h — use a Meta Approved Template or Aakash SMS.'
                }
              >
                <Chip
                  size="small"
                  label={waWindowStatus.label}
                  sx={{
                    display: { xs: 'none', lg: 'inline-flex' },
                    height: 24,
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    bgcolor: waWindowStatus.isOpen ? '#F0FDF4' : '#FFFBEB',
                    color: waWindowStatus.isOpen ? '#15803D' : '#B45309',
                    border: waWindowStatus.isOpen ? '1px solid #BBF7D0' : '1px solid #FDE68A'
                  }}
                />
              </Tooltip>
            )}
            <Tooltip title={activeThread.pinned ? 'Unpin contact' : 'Pin priority contact'}>
              <IconButton
                size="small"
                onClick={() => togglePinContact(activeThread.key || activeThread.phone)}
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  bgcolor: activeThread.pinned ? '#FFFBEB' : '#F1F5F9',
                  color: activeThread.pinned ? '#D97706' : '#64748B'
                }}
              >
                {activeThread.pinned ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                activeThread.botPaused
                  ? 'Auto-reply is currently PAUSED for this contact (Human Takeover). Click to RESUME.'
                  : activeReplyMode === 'manual'
                    ? 'Global Manual Mode is active (click to toggle per-chat pause)'
                    : `${activeReplyMode === 'ai' ? 'AI Counselor' : 'Menu Bot'} is active for this contact. Click to PAUSE (Human Takeover).`
              }
            >
              <Chip
                size="small"
                icon={
                  activeThread.botPaused ? (
                    <PersonIcon sx={{ fontSize: 14 }} />
                  ) : activeReplyMode === 'ai' ? (
                    <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                  ) : activeReplyMode === 'bot' ? (
                    <SmartToyIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <PersonIcon sx={{ fontSize: 14 }} />
                  )
                }
                label={
                  activeThread.botPaused
                    ? (isMobile ? 'Paused' : 'Paused (Manual)')
                    : activeReplyMode === 'ai'
                      ? (isMobile ? 'AI' : 'AI Active')
                      : activeReplyMode === 'bot'
                        ? (isMobile ? 'Bot' : 'Bot Active')
                        : (isMobile ? 'Manual' : 'Manual Mode')
                }
                onClick={async () => {
                  const nextPaused = !activeThread.botPaused;
                  setBotModesMap((prev) => ({ ...prev, [activeThread.key]: { paused: nextPaused } }));
                  await toggleBotPause(activeThread.key || activeThread.phone, nextPaused);
                  setSendFeedback({
                    type: nextPaused ? 'warning' : 'success',
                    text: nextPaused
                      ? 'Auto-reply paused for this contact (Human Takeover active).'
                      : 'Auto-reply resumed 24/7 for this contact.'
                  });
                  onRefresh?.();
                }}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 800,
                  bgcolor: activeThread.botPaused
                    ? '#FEF2F2'
                    : activeReplyMode === 'ai'
                      ? '#EEF2FF'
                      : activeReplyMode === 'bot'
                        ? '#ECFDF5'
                        : '#FFFBEB',
                  color: activeThread.botPaused
                    ? '#DC2626'
                    : activeReplyMode === 'ai'
                      ? '#4338CA'
                      : activeReplyMode === 'bot'
                        ? '#059669'
                        : '#B45309',
                  border: activeThread.botPaused
                    ? '1px solid #FECACA'
                    : activeReplyMode === 'ai'
                      ? '1px solid #C7D2FE'
                      : activeReplyMode === 'bot'
                        ? '1px solid #A7F3D0'
                        : '1px solid #FDE68A',
                  height: 26
                }}
              />
            </Tooltip>

            {!hideGlobalModeSwitcher && (
              <ToggleButtonGroup
                size="small"
                exclusive
                value={activeReplyMode}
                onChange={async (_, nextMode) => {
                  if (!nextMode) return;
                  await handleChangeWorkspaceReplyMode(nextMode);
                  if (nextMode !== 'manual' && activeThread.botPaused) {
                    setBotModesMap((prev) => ({ ...prev, [activeThread.key]: { paused: false } }));
                    await toggleBotPause(activeThread.key || activeThread.phone, false);
                    onRefresh?.();
                  }
                }}
                aria-label="Reply mode switcher"
                sx={{
                  bgcolor: '#F1F5F9',
                  borderRadius: 2,
                  border: '1px solid #E2E8F0',
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    py: 0.25,
                    px: 0.85,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    color: '#475569',
                    gap: 0.35,
                    height: 26,
                    '&.Mui-selected': { color: '#FFFFFF' }
                  }
                }}
              >
                <ToggleButton value="ai" sx={{ '&.Mui-selected': { bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } } }}>
                  <AutoAwesomeIcon sx={{ fontSize: 12 }} />
                  AI
                </ToggleButton>
                <ToggleButton value="bot" sx={{ '&.Mui-selected': { bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } } }}>
                  <SmartToyIcon sx={{ fontSize: 12 }} />
                  Bot
                </ToggleButton>
                <ToggleButton value="manual" sx={{ '&.Mui-selected': { bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } } }}>
                  <PersonIcon sx={{ fontSize: 12 }} />
                  Manual
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            {(!isMobile || (activeThread.channelPlatform !== 'messenger' && activeThread.channelPlatform !== 'fb_comment')) && (
              <Tooltip title="Call">
                <IconButton
                  size="small"
                  component="a"
                  href={`tel:${activeThread.phone}`}
                  sx={{ bgcolor: '#EFF6FF', color: '#0F2C59' }}
                >
                  <CallIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isMobile && (
              <Tooltip title="Open Workflow Panel">
                <IconButton
                  size="small"
                  onClick={() => setMobileWorkflowOpen(true)}
                  sx={{ bgcolor: '#F1F5F9', color: '#0F2C59' }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Chat Messages Scroll Area */}
        <Box
          ref={messagesContainerRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setShowScrollDown(distFromBottom > 160);
          }}
          sx={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.1,
            backgroundImage: 'radial-gradient(rgba(15, 44, 89, 0.04) 1px, transparent 1px)',
            backgroundSize: '18px 18px'
          }}
        >
          {activeThread.messages.length === 0 ? (
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', borderRadius: 2.5, mx: 'auto', my: 3, maxWidth: 340, border: '1px dashed #CBD5E1' }}>
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700 }}>
                No messages logged yet with {activeThread.name}.
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                Use a Quick Template or type a message below to start via WhatsApp Cloud API.
              </Typography>
            </Paper>
          ) : (
            activeThread.messages.map((m, idx) => {
              const isOutbound = m.direction === 'outbound';
              const isInternalNote = m.direction === 'internal_note';
              const prevMsg = idx > 0 ? activeThread.messages[idx - 1] : null;
              const currDay = m.createdAt ? new Date(m.createdAt).toDateString() : '';
              const prevDay = prevMsg?.createdAt ? new Date(prevMsg.createdAt).toDateString() : '';
              const showDateDivider = currDay && currDay !== prevDay;
              const mediaUrl = m.media?.id ? `/api/whatsapp-media?id=${encodeURIComponent(m.media.id)}` : null;
              return (
                <React.Fragment key={m.id}>
                  {showDateDivider && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.75 }}>
                      <Chip
                        size="small"
                        label={formatDateDivider(m.createdAt)}
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          bgcolor: '#E2E8F0',
                          color: '#334155'
                        }}
                      />
                    </Box>
                  )}
                  <Box
                    sx={{
                      alignSelf: isInternalNote ? 'center' : isOutbound ? 'flex-end' : 'flex-start',
                      maxWidth: isInternalNote ? '90%' : { xs: '88%', sm: '74%' },
                      bgcolor: isInternalNote ? '#FEF3C7' : isOutbound ? '#DCFCE7' : '#FFFFFF',
                      color: '#0F172A',
                      px: 1.5,
                      py: 1,
                      borderRadius: isInternalNote
                        ? 2.5
                        : isOutbound
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      boxShadow: isInternalNote ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.08)',
                      border: isInternalNote
                        ? '1px dashed #F59E0B'
                        : isOutbound
                        ? '1px solid #BBF7D0'
                        : '1px solid #E2E8F0'
                    }}
                  >
                  {isInternalNote && (
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontWeight: 800, color: '#92400E', fontSize: '0.67rem', mb: 0.25 }}>
                      <LockOutlinedIcon sx={{ fontSize: 12 }} />
                      Internal Staff Note (Not sent to WhatsApp)
                    </Typography>
                  )}
                  {m.messageType === 'auto_bot' && (
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#047857', fontSize: '0.66rem', mb: 0.25 }}>
                      प्राविधिक स्कुल काउन्सिलर (जोरपाटी)
                    </Typography>
                  )}
                  {m.messageType === 'fb_ad_inquiry' && (
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#1D4ED8', fontSize: '0.66rem', mb: 0.25 }}>
                      📢 Facebook Ad Inquiry
                    </Typography>
                  )}
                  {mediaUrl && m.media?.type === 'image' && (
                    <Box
                      component="a"
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'block', mb: 0.75 }}
                    >
                      <Box
                        component="img"
                        src={mediaUrl}
                        alt="WhatsApp Media"
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 220,
                          borderRadius: 2,
                          objectFit: 'cover',
                          border: '1px solid #CBD5E1'
                        }}
                      />
                    </Box>
                  )}
                  {mediaUrl && m.media?.type !== 'image' && (
                    <Button
                      size="small"
                      variant="outlined"
                      component="a"
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<DownloadForOfflineIcon />}
                      sx={{ mb: 0.75, fontWeight: 700 }}
                    >
                      {m.media?.filename || `Download ${m.media?.type || 'File'}`}
                    </Button>
                  )}
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.84rem', lineHeight: 1.45 }}>
                    {cleanWhatsAppMarkdown(m.content)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.4 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.64rem' }}>
                      {formatTimeShort(m.createdAt)}
                    </Typography>
                    {isOutbound && (
                      m.status === 'failed' ? (
                        <ErrorOutlineIcon sx={{ fontSize: 13, color: '#DC2626' }} />
                      ) : m.status === 'read' ? (
                        <DoneAllIcon sx={{ fontSize: 14, color: '#53BDEB' }} />
                      ) : m.status === 'delivered' ? (
                        <DoneAllIcon sx={{ fontSize: 14, color: '#8696A0' }} />
                      ) : (
                        <DoneIcon sx={{ fontSize: 13, color: '#8696A0' }} />
                      )
                    )}
                  </Box>
                  </Box>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Box>

        {showScrollDown && (
          <IconButton
            size="small"
            aria-label="Scroll to latest message"
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            sx={{
              position: 'absolute',
              right: 16,
              bottom: { xs: 130, sm: 136 },
              zIndex: 10,
              width: 36,
              height: 36,
              bgcolor: '#FFFFFF',
              color: '#0F2C59',
              border: '1px solid #CBD5E1',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.16)',
              '&:hover': { bgcolor: '#F8FAFC' }
            }}
          >
            <KeyboardArrowDownIcon fontSize="small" />
          </IconButton>
        )}

        {sendFeedback && (
          <Alert severity={sendFeedback.type} onClose={() => setSendFeedback(null)} sx={{ mx: 1.5, mb: 1, borderRadius: 2 }}>
            {sendFeedback.text}
          </Alert>
        )}

        {/* 1-Click ERP Quick Share Bar */}
        <Box
          sx={{
            px: 1.25,
            py: 0.7,
            bgcolor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.65,
              overflowX: 'auto',
              minWidth: 0,
              flex: 1,
              pr: 0.5,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            <Chip
              size="small"
              icon={<MenuBookIcon sx={{ fontSize: 14 }} />}
              label="Brochure"
              onClick={() => handleQuickShare('brochure')}
              disabled={sending}
              sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8' }}
            />
            <Chip
              size="small"
              icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
              label="Location"
              onClick={() => handleQuickShare('location')}
              disabled={sending}
              sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#ECFDF5', color: '#047857' }}
            />
            <Chip
              size="small"
              icon={<PaymentsIcon sx={{ fontSize: 14 }} />}
              label="Fee Info"
              onClick={() => handleQuickShare('fee')}
              disabled={sending}
              sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#FFFBEB', color: '#B45309' }}
            />
            {activeThread.role === 'Student' && (
              <Chip
                size="small"
                icon={<WorkspacePremiumIcon sx={{ fontSize: 14 }} />}
                label="Cert Link"
                onClick={() => handleQuickShare('certificate')}
                disabled={sending}
                sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#FAF5FF', color: '#7E22CE' }}
              />
            )}
            <Chip
              size="small"
              icon={aiDrafting ? <CircularProgress size={12} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 14 }} />}
              label={aiDrafting ? 'Drafting...' : 'AI Suggest'}
              disabled={sending || aiDrafting || aiAutoSending}
              onClick={async () => {
                setAiDrafting(true);
                setSendFeedback(null);
                try {
                  const studentInfo =
                    activeThread.role === 'Student' && activeThread.entity
                      ? `Name: ${activeThread.entity.name}, TGID: ${activeThread.entity.tgid || '-'}, Status: ${activeThread.entity.status || 'Active'}, Fee: Rs. ${Number(activeThread.entity.feeAmount || activeThread.entity.fee_amount || 0)}, Paid: Rs. ${Number(activeThread.entity.feePaid || activeThread.entity.fee_paid || 0)}`
                      : '';
                  const suggestion = await suggestGeminiReply({
                    contactName: activeThread.name,
                    role: activeThread.role,
                    messages: activeThread.messages,
                    studentInfo
                  });
                  setDraft(suggestion);
                } catch (err) {
                  setSendFeedback({ type: 'error', text: err?.message || 'AI suggestion failed.' });
                } finally {
                  setAiDrafting(false);
                }
              }}
              sx={{
                cursor: 'pointer',
                fontWeight: 800,
                bgcolor: '#EEF2FF',
                color: '#4338CA',
                border: '1px solid #C7D2FE'
              }}
            />
            <Tooltip title="Generate AI reply and immediately send it to this customer's real WhatsApp">
              <Chip
                size="small"
                icon={aiAutoSending ? <CircularProgress size={12} color="inherit" /> : <BoltIcon sx={{ fontSize: 14 }} />}
                label={aiAutoSending ? 'AI Sending...' : 'AI Reply & Send'}
                disabled={sending || aiDrafting || aiAutoSending}
                onClick={async () => {
                  setAiAutoSending(true);
                  setSendFeedback(null);
                  try {
                    const studentInfo =
                      activeThread.role === 'Student' && activeThread.entity
                        ? `Name: ${activeThread.entity.name}, TGID: ${activeThread.entity.tgid || '-'}, Status: ${activeThread.entity.status || 'Active'}, Fee: Rs. ${Number(activeThread.entity.feeAmount || activeThread.entity.fee_amount || 0)}, Paid: Rs. ${Number(activeThread.entity.feePaid || activeThread.entity.fee_paid || 0)}`
                        : '';
                    const aiText = await suggestGeminiReply({
                      contactName: activeThread.name,
                      role: activeThread.role,
                      messages: activeThread.messages,
                      studentInfo
                    });
                    const optId = `opt-${Date.now()}`;
                    setOptimisticMessagesMap((prev) => ({
                      ...prev,
                      [activeThread.key]: [
                        ...(prev[activeThread.key] || []),
                        {
                          id: optId,
                          direction: 'outbound',
                          messageType: 'auto_bot',
                          status: 'sent',
                          content: aiText,
                          createdAt: new Date().toISOString()
                        }
                      ]
                    }));
                    if (activeThread.channelPlatform === 'messenger' || activeThread.channelPlatform === 'fb_comment') {
                      await sendFacebookReply({
                        targetId: activeThread.phone,
                        targetName: activeThread.name,
                        channel: activeThread.channelPlatform,
                        text: aiText,
                        messageType: 'auto_bot'
                      });
                    } else {
                      await sendMetaWhatsAppMessage({
                        to: activeThread.phone,
                        type: 'text',
                        text: aiText,
                        messageType: 'auto_bot'
                      });
                    }
                    const platformLabel = activeThread.channelPlatform === 'messenger'
                      ? 'Facebook Messenger'
                      : activeThread.channelPlatform === 'fb_comment'
                        ? 'Facebook Comment'
                        : 'WhatsApp';
                    setSendFeedback({ type: 'success', text: `AI Counselor reply sent directly to ${platformLabel}!` });
                    onRefresh?.();
                  } catch (err) {
                    setSendFeedback({ type: 'error', text: err?.message || 'AI Auto-Send failed.' });
                  } finally {
                    setAiAutoSending(false);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 800,
                  bgcolor: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                  '&:hover': { bgcolor: '#D1FAE5' }
                }}
              />
            </Tooltip>

            {INSTANT_QUICK_REPLIES.map((qr) => (
              <Chip
                key={qr.key}
                size="small"
                label={qr.label}
                onClick={() => setDraft(qr.text)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  bgcolor: '#F8FAFC',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  flexShrink: 0,
                  '&:hover': { bgcolor: '#EFF6FF', borderColor: '#93C5FD', color: '#1D4ED8' }
                }}
              />
            ))}

            {activeThread && !['Student', 'Lead', 'Trainer', 'Employer'].includes(activeThread.role) && (
              <Chip
                size="small"
                label="+ Save Lead"
                onClick={() => {
                  const currentDb = loadDB();
                  const cleanPhone = String(activeThread.phone || '').trim();
                  const existing = (currentDb.leads || []).find((l) => l.phone === cleanPhone);
                  if (existing) {
                    setSendFeedback({ type: 'info', text: `${activeThread.name} is already saved in CRM Leads.` });
                    return;
                  }
                  const newLead = {
                    id: `LD-CHAT-${Date.now().toString().slice(-6)}`,
                    name: activeThread.name || 'Chat Inquiry',
                    phone: cleanPhone,
                    source: activeThread.channelPlatform === 'messenger' ? 'Facebook Messenger' : 'WhatsApp Hub',
                    stage: 'Contacted',
                    status: 'Contacted',
                    notes: `Saved directly from chat: ${activeThread.lastMessage || ''}`,
                    nextFollowUp: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                    createdAt: new Date().toISOString()
                  };
                  saveDB({ ...currentDb, leads: [newLead, ...(currentDb.leads || [])] });
                  setSendFeedback({ type: 'success', text: `Saved ${activeThread.name} to CRM Leads with tomorrow's Follow-Up!` });
                  onRefresh?.();
                }}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  bgcolor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FCD34D',
                  flexShrink: 0,
                  '&:hover': { bgcolor: '#FDE68A' }
                }}
              />
            )}
          </Box>
        </Box>

        {/* Slash Quick-Reply Autocomplete Strip */}
        {draft.startsWith('/') && (
          <Paper
            elevation={3}
            sx={{
              mx: 1.25,
              mb: 0.5,
              p: 0.75,
              borderRadius: 2,
              border: '1px solid #CBD5E1',
              bgcolor: '#FFFFFF',
              maxHeight: 180,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.4
            }}
          >
            {getWhatsAppTemplates()
              .filter((s) => Boolean(s.slashCmd))
              .filter((s) =>
                s.slashCmd.toLowerCase().startsWith(draft.trim().toLowerCase()) ||
                (s.title || '').toLowerCase().includes(draft.slice(1).toLowerCase())
              )
              .map((s) => {
                const rendered = renderWhatsAppTemplate(s, {
                  name: activeThread.name,
                  course: activeThread.entity?.course || 'Vocational Training',
                  due: Number(studentLedgerData?.due ?? activeThread.entity?.dueFee ?? 0).toLocaleString()
                });
                return (
                  <Box
                    key={s.key}
                    onClick={() => setDraft(rendered)}
                    sx={{
                      px: 1,
                      py: 0.6,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      '&:hover': { bgcolor: '#EFF6FF' }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59' }}>
                      {s.slashCmd} — {s.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }} noWrap>
                      {rendered.slice(0, 48)}...
                    </Typography>
                  </Box>
                );
              })}
          </Paper>
        )}

        {/* Composer Bar with Integrated Premium Channel Switcher */}
        <Box
          sx={{
            px: { xs: 1, sm: 1.25 },
            pt: 0.85,
            pb: { xs: 'calc(10px + env(safe-area-inset-bottom))', sm: 1.15 },
            bgcolor: sendChannel === 'Note' ? '#FFFBEB' : sendChannel === 'SMS' ? '#F0F9FF' : '#FFFFFF',
            borderTop: sendChannel === 'Note' ? '1px solid #FDE68A' : sendChannel === 'SMS' ? '1px solid #BAE6FD' : '1px solid #E2E8F0',
            transition: 'background-color 0.15s ease'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75, gap: 1 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={sendChannel}
              onChange={(_, v) => v && setSendChannel(v)}
              aria-label="Select messaging channel"
              sx={{
                bgcolor: '#F1F5F9',
                p: '3px',
                borderRadius: 2,
                border: '1px solid #E2E8F0',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '6px !important',
                  py: 0.3,
                  px: 1.1,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  color: '#475569',
                  gap: 0.45,
                  lineHeight: 1.2,
                  transition: 'all 0.15s ease',
                  '&.Mui-selected': {
                    color: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.18)'
                  }
                }
              }}
            >
              <ToggleButton
                value="WhatsApp"
                sx={{ '&.Mui-selected': { bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } } }}
              >
                <WhatsAppIcon sx={{ fontSize: 14, color: sendChannel === 'WhatsApp' ? '#FFFFFF' : '#16A34A' }} />
                WA
              </ToggleButton>
              <ToggleButton
                value="SMS"
                sx={{ '&.Mui-selected': { bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' } } }}
              >
                <SmsIcon sx={{ fontSize: 14, color: sendChannel === 'SMS' ? '#FFFFFF' : '#0284C7' }} />
                SMS
              </ToggleButton>
              <ToggleButton
                value="Note"
                sx={{ '&.Mui-selected': { bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } } }}
              >
                <LockOutlinedIcon sx={{ fontSize: 13, color: sendChannel === 'Note' ? '#FFFFFF' : '#D97706' }} />
                Note
              </ToggleButton>
            </ToggleButtonGroup>

            <Typography
              variant="caption"
              sx={{
                color: sendChannel === 'Note' ? '#B45309' : sendChannel === 'SMS' ? '#0369A1' : '#64748B',
                fontWeight: 600,
                fontSize: '0.68rem',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {sendChannel === 'Note'
                ? 'Private staff note — hidden from student'
                : sendChannel === 'SMS'
                  ? 'Sending via Aakash SMS gateway'
                  : 'Enter to send • Shift+Enter for new line'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75 }}>
          <Menu
            anchorEl={templateAnchor}
            open={Boolean(templateAnchor)}
            onClose={() => setTemplateAnchor(null)}
            PaperProps={{ sx: { maxHeight: 340 } }}
          >
            {getWhatsAppTemplates()
              .filter((tpl) => !tpl.slashCmd)
              .map((tpl) => (
                <MenuItem
                  key={tpl.key}
                  onClick={() => {
                    setDraft(
                      renderWhatsAppTemplate(tpl, {
                        name: activeThread.name,
                        course: studentLedgerData?.courseName || activeThread.entity?.course || 'Vocational Training',
                        due: Number(studentLedgerData?.due ?? activeThread.entity?.dueFee ?? 0).toLocaleString(),
                        tgid: activeThread.entity?.tgid || '-'
                      })
                    );
                    setTemplateAnchor(null);
                  }}
                >
                  {tpl.title}
                </MenuItem>
              ))}
            <Divider />
            <MenuItem
              onClick={() => {
                setTemplateAnchor(null);
                setTplModalOpen(true);
              }}
              sx={{ fontWeight: 700, color: '#0F2C59' }}
            >
              Send Meta Approved Template (24h+)...
            </MenuItem>
          </Menu>

          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                bgcolor: sendChannel === 'Note' ? '#FEF3C7' : '#F8FAFC',
                px: 0.75,
                py: 0.4,
                '& fieldset': { borderColor: sendChannel === 'Note' ? '#FCD34D' : '#CBD5E1' }
              },
              '& textarea': { fontSize: { xs: '16px', md: '0.875rem' }, lineHeight: 1.4 }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.25 }}>
                  <Tooltip title="Quick Templates & Meta Approved Template">
                    <IconButton
                      size="small"
                      aria-label="Quick templates"
                      onClick={(e) => setTemplateAnchor(e.currentTarget)}
                      sx={{ color: '#0F2C59', p: 0.5 }}
                    >
                      <BoltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end" sx={{ ml: 0.25 }}>
                  <Tooltip title="Send PDF / Document URL">
                    <IconButton
                      size="small"
                      aria-label="Attach document"
                      onClick={() => setDocModalOpen(true)}
                      sx={{ color: '#64748B', p: 0.5 }}
                    >
                      <AttachFileIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
            placeholder={
              isMobile
                ? sendChannel === 'Note'
                  ? 'Private note...'
                  : sendChannel === 'SMS'
                    ? 'Write SMS...'
                    : 'Message...'
                : sendChannel === 'Note'
                  ? 'Write private internal staff note (not sent to student)...'
                  : sendChannel === 'SMS'
                    ? `Send Aakash SMS to ${activeThread.name}...`
                    : `Message ${activeThread.name} (type / for quick replies)...`
            }
          />

          <IconButton
            aria-label="Send message"
            disabled={sending || !draft.trim()}
            onClick={() => handleSend()}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              width: 42,
              height: 42,
              flexShrink: 0,
              bgcolor: sendChannel === 'Note' ? '#D97706' : sendChannel === 'SMS' ? '#0284C7' : '#16A34A',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: sendChannel === 'Note' ? '#B45309' : sendChannel === 'SMS' ? '#0369A1' : '#15803D'
              },
              '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' }
            }}
          >
            {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
          </IconButton>

          <Button
            variant="contained"
            disabled={sending || !draft.trim()}
            onClick={() => handleSend()}
            endIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              bgcolor: sendChannel === 'Note' ? '#D97706' : sendChannel === 'SMS' ? '#0284C7' : '#16A34A',
              '&:hover': {
                bgcolor: sendChannel === 'Note' ? '#B45309' : sendChannel === 'SMS' ? '#0369A1' : '#15803D'
              },
              fontWeight: 800,
              px: 2,
              py: 0.85,
              flexShrink: 0
            }}
          >
            {sendChannel === 'Note' ? 'Save Note' : sendChannel === 'SMS' ? 'Send SMS' : 'Send'}
          </Button>
          </Box>
        </Box>

        {/* Attach Document URL Dialog */}
        <Dialog open={docModalOpen} onClose={() => setDocModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Send Document / PDF via WhatsApp</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              size="small"
              label="Public PDF / Document URL"
              required
              placeholder="https://..."
              value={docForm.url}
              onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
            />
            <TextField
              size="small"
              label="File Name"
              value={docForm.filename}
              onChange={(e) => setDocForm({ ...docForm, filename: e.target.value })}
            />
            <TextField
              size="small"
              label="Caption (Optional)"
              value={docForm.caption}
              onChange={(e) => setDocForm({ ...docForm, caption: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSendDocument} disabled={sending || !docForm.url.trim()}>
              Send Document
            </Button>
          </DialogActions>
        </Dialog>

        {/* Meta Approved Template Dialog */}
        <Dialog open={tplModalOpen} onClose={() => setTplModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Send Meta Approved Template</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Use an approved template name from Meta WhatsApp Manager to re-open conversations older than 24 hours.
            </Typography>
            <TextField
              size="small"
              label="Template Name"
              required
              value={metaTplForm.name}
              onChange={(e) => setMetaTplForm({ ...metaTplForm, name: e.target.value })}
            />
            <TextField
              size="small"
              label="Language Code"
              value={metaTplForm.language}
              onChange={(e) => setMetaTplForm({ ...metaTplForm, language: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTplModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSendMetaTemplate} disabled={sending || !metaTplForm.name.trim()}>
              Send Template
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        height,
        borderRadius: { xs: 0, md: 3 },
        border: { xs: 'none', md: '1px solid #E2E8F0' },
        overflow: 'hidden',
        bgcolor: '#FFFFFF'
      }}
    >
      {isMobile ? (
        <>
          {mobileView === 'list' ? renderLeftPane() : renderCenterPane()}
          <Drawer
            anchor="bottom"
            open={mobileWorkflowOpen}
            onClose={() => setMobileWorkflowOpen(false)}
            PaperProps={{
              sx: {
                maxHeight: '85dvh',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                pb: 'env(safe-area-inset-bottom)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1, pb: 0.5 }}>
              <Box sx={{ width: 40, height: 4, borderRadius: 99, bgcolor: '#CBD5E1' }} />
            </Box>
            {renderWorkflowPanel()}
          </Drawer>
        </>
      ) : (
        <>
          {renderLeftPane()}
          {renderCenterPane()}
          {renderWorkflowPanel()}
        </>
      )}

      {/* Embedded Live Billing, Final Bill & Admission Modals */}
      {paymentModalOpen && activeThread?.role === 'Student' && activeThread?.entity && (
        <RecordPaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSavePayment={handleSavePaymentFromHub}
          db={liveDb}
          preselectedStudentId={activeThread.entity.id}
        />
      )}

      {receiptModalOpen && activeThread?.role === 'Student' && activeThread?.entity && studentLedgerData && (
        <FeeClearanceReceiptModal
          open={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          student={activeThread.entity}
          ledger={studentLedgerData.ledgerObj}
          payments={studentLedgerData.studentPayments}
        />
      )}

      {convertModalOpen && activeThread?.role === 'Lead' && activeThread?.entity && (
        <ConvertToStudentModal
          open={convertModalOpen}
          onClose={() => setConvertModalOpen(false)}
          lead={activeThread.entity}
          db={liveDb}
          onConverted={() => {
            setConvertModalOpen(false);
            setWorkflowSavedMsg('Lead admitted & converted to Student!');
            setTimeout(() => setWorkflowSavedMsg(''), 3500);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Live AI Counselor Sandbox Dialog inside Workspace */}
      <Dialog
        open={aiSandboxModalOpen}
        onClose={() => setAiSandboxModalOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(3px)',
              backgroundColor: 'rgba(15, 23, 42, 0.55)'
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#0F2C59',
            color: '#FFFFFF',
            py: 1.25,
            borderBottom: '2px solid #4F46E5'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon sx={{ color: '#818CF8' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Live AI Counselor Test Sandbox
            </Typography>
          </Box>
          <IconButton
            size="small"
            aria-label="Close AI Sandbox"
            onClick={() => setAiSandboxModalOpen(false)}
            sx={{ color: '#FFFFFF' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#F8FAFC' }}>
          <AiCounselorSandbox inDialog />
        </DialogContent>
      </Dialog>
    </Paper>
  );
}
