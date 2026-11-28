import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Stack,
  Alert
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { QRCodeSVG } from 'qrcode.react';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { loadDB } from '../../services/storage';
import {
  buildCertificateBodyData,
  buildDefaultNepaliBody,
  getSavedNepaliBody,
  saveNepaliBody,
  generateNepaliCertificateBodyWithGemini
} from '../../services/certificateFormatter';

// Corner Ornament SVG Helper
function CornerSvg({ style, size = 32, color = '#C59B27', position = 'top-left' }) {
  if (!style || style === 'none') return null;

  let transformStyle = '';
  let positionStyle = {};

  if (position === 'top-left') {
    positionStyle = { top: 0, left: 0 };
    transformStyle = 'none';
  } else if (position === 'top-right') {
    positionStyle = { top: 0, right: 0 };
    transformStyle = 'scaleX(-1)';
  } else if (position === 'bottom-left') {
    positionStyle = { bottom: 0, left: 0 };
    transformStyle = 'scaleY(-1)';
  } else if (position === 'bottom-right') {
    positionStyle = { bottom: 0, right: 0 };
    transformStyle = 'scale(-1, -1)';
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        ...positionStyle,
        transform: transformStyle,
        transformOrigin: 'center center',
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 2
      }}
    >
      {style === 'victorian-flourish' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M4 4 C 30 4, 60 15, 80 40 C 95 60, 96 85, 96 96 C 85 96, 60 95, 40 80 C 15 60, 4 30, 4 4 Z" stroke={color} strokeWidth="3" fill="none" />
          <path d="M12 12 C 35 12, 55 24, 70 45 C 80 60, 84 75, 84 84 C 75 84, 60 80, 45 70 C 24 55, 12 35, 12 12 Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="5" fill={color} />
          <path d="M4 25 C 10 25, 25 10, 25 4" stroke={color} strokeWidth="2.5" />
          <circle cx="4" cy="4" r="3" fill={color} />
        </svg>
      )}

      {style === 'acanthus-leaf' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M6 6 Q 40 6 70 25 Q 94 45 94 94 Q 45 94 25 70 Q 6 40 6 6 Z" stroke={color} strokeWidth="3" fill="none" />
          <path d="M6 6 C 25 30 40 45 60 60 C 45 40 30 25 6 6 Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" />
          <circle cx="6" cy="6" r="4" fill={color} />
          <path d="M18 6 Q 30 18 18 30 Q 6 18 18 6 Z" fill={color} />
        </svg>
      )}

      {style === 'art-deco-bracket' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M4 4 L 96 4 L 96 16 L 16 16 L 16 96 L 4 96 Z" fill={color} fillOpacity="0.9" />
          <path d="M24 24 L 80 24 L 80 32 L 32 32 L 32 80 L 24 80 Z" fill={color} fillOpacity="0.6" />
          <path d="M40 40 L 64 40 L 64 46 L 46 46 L 46 64 L 40 64 Z" fill={color} fillOpacity="0.4" />
          <polygon points="10,10 18,4 26,10 18,16" fill={color} />
        </svg>
      )}

      {style === 'celtic-knot' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <rect x="6" y="6" width="88" height="88" rx="8" stroke={color} strokeWidth="2.5" fill="none" />
          <path d="M6 35 C 35 35 35 6 35 6" stroke={color} strokeWidth="3" />
          <path d="M6 65 C 65 65 65 6 65 6" stroke={color} strokeWidth="2.5" />
          <circle cx="20" cy="20" r="7" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
          <circle cx="6" cy="6" r="4" fill={color} />
        </svg>
      )}

      {style === 'clean-l-bracket' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M4 4 L 96 4" stroke={color} strokeWidth="5" strokeLinecap="square" />
          <path d="M4 4 L 4 96" stroke={color} strokeWidth="5" strokeLinecap="square" />
          <path d="M12 12 L 75 12" stroke={color} strokeWidth="2" />
          <path d="M12 12 L 12 75" stroke={color} strokeWidth="2" />
          <polygon points="4,4 12,4 12,12 4,12" fill={color} />
          <polygon points="20,20 28,14 36,20 28,26" fill={color} />
        </svg>
      )}
    </Box>
  );
}

export default function A4LandscapeCertificateModal({
  open,
  onClose,
  certificate,
  student,
  course,
  group,
  trainer,
  inlineRender = false,
  canvasId = 'printableLandscapeCertificate',
  presetIdOverride = ''
}) {
  const [exportingType, setExportingType] = useState(null); // 'pdf' | 'png' | null
  const [zoomed, setZoomed] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const previewWrapRef = useRef(null);

  // Per-certificate Nepali AI Generator & Language Override state
  const [nepaliDialogOpen, setNepaliDialogOpen] = useState(false);
  const [nepaliDraft, setNepaliDraft] = useState('');
  const [savedNepaliText, setSavedNepaliText] = useState('');
  const [bodyModeOverride, setBodyModeOverride] = useState(null); // null = use Studio setting
  const [selectedPresetId, setSelectedPresetId] = useState(''); // '' = active Studio design
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState('');

  useEffect(() => {
    if (!open) {
      setZoomed(false);
      setNepaliDialogOpen(false);
      setBodyModeOverride(null);
      setSelectedPresetId('');
      setAiNotice('');
      return;
    }
    const existing = getSavedNepaliBody(certificate);
    setSavedNepaliText(existing);
    setNepaliDraft(existing);
  }, [open, certificate?.certificateNo, certificate?.id]);

  useEffect(() => {
    if (!open) {
      setZoomed(false);
      return;
    }
    const updateSize = () => {
      const wrapW = previewWrapRef.current?.clientWidth || window.innerWidth;
      setPreviewWidth(wrapW);
      setViewportHeight(window.innerHeight);
    };
    updateSize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
    if (ro && previewWrapRef.current) ro.observe(previewWrapRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [open]);

  if (!open || !certificate || !student) return null;

  const db = loadDB();
  const baseDesign = db.settings?.certificateDesign || {};
  const savedPresets = baseDesign.customTemplatePresets || [];
  const autoMatchedPreset =
    savedPresets.find(
      (p) => Array.isArray(p.linkedCourseIds) && course?.id && p.linkedCourseIds.includes(course.id)
    ) || null;
  const chosenPresetId = selectedPresetId || presetIdOverride;
  const activePresetObj =
    chosenPresetId === '__studio__'
      ? null
      : chosenPresetId
        ? savedPresets.find((p) => p.id === chosenPresetId)
        : autoMatchedPreset;
  const design = activePresetObj?.config
    ? {
        ...baseDesign,
        ...activePresetObj.config,
        elementStyles: {
          ...(baseDesign.elementStyles || {}),
          ...(activePresetObj.config.elementStyles || {})
        }
      }
    : baseDesign;
  const elStyles = design.elementStyles || {};

  const isPortrait = design.orientation === 'portrait';
  const primaryColor = design.primaryColor || '#0B2545';
  const accentColor = design.accentColor || '#C59B27';
  const cornerColor = design.cornerColor || accentColor;
  const borderStyle = design.borderStyle || 'royal-double';
  const borderWidth = design.borderWidth || 6;
  const borderMargin = design.borderMargin || 12;
  const cornerStyle = design.cornerStyle || 'victorian-flourish';
  const cornerSize = design.cornerSize || 32;
  const backgroundType = design.backgroundType || 'clean-white';
  const customBackgroundUrl = design.customBackgroundUrl || '';
  const watermarkOpacity = design.watermarkOpacity !== undefined ? design.watermarkOpacity : 4;
  const showStudentPhoto = design.showStudentPhoto !== undefined ? design.showStudentPhoto : true;
  const showCompetencyBadge = design.showCompetencyBadge !== undefined ? design.showCompetencyBadge : true;
  const showHeader = design.showHeader !== undefined ? design.showHeader : true;
  const showHeaderTitle = design.showHeaderTitle !== undefined ? design.showHeaderTitle : true;
  const showHeaderDivider = design.showHeaderDivider !== undefined ? design.showHeaderDivider : true;
  const showTitle = design.showTitle !== undefined ? design.showTitle : true;
  const showRefBar = design.showRefBar !== undefined ? design.showRefBar : true;
  const showRefCertNo = design.showRefCertNo !== undefined ? design.showRefCertNo : true;
  const showRefTgid = design.showRefTgid !== undefined ? design.showRefTgid : true;
  const showRefIssueDate = design.showRefIssueDate !== undefined ? design.showRefIssueDate : true;
  const transparentRefBar = Boolean(design.transparentRefBar) || backgroundType === 'custom';
  const showNepaliNameSubtitle = Boolean(design.showNepaliNameSubtitle);
  const showCourseLine = design.showCourseLine !== undefined ? design.showCourseLine : true;
  const showBodyText = design.showBodyText !== undefined ? design.showBodyText : true;
  const showSignatories = design.showSignatories !== undefined ? design.showSignatories : true;
  const showLeftLogo = design.showLeftLogo !== undefined ? design.showLeftLogo : true;
  const showRightLogo = design.showRightLogo !== undefined ? design.showRightLogo : true;

  const companyProfile = db.settings?.companyProfile || {};
  const instituteName = companyProfile.companyNameEn || design.instituteName || design.instituteNameEnglish || 'Prabidhik School, Jorpati / Global Era Multi Service Pvt. Ltd.';
  const accreditationText = design.accreditationText || 'Accredited Technical Training Provider under Council for Technical Education and Vocational Training (CTEVT)';
  const affiliationCodeText = (companyProfile.regNo || companyProfile.ctevtCode)
    ? `Government Regd. No: ${companyProfile.regNo || '184920/078/079'} • CTEVT Affiliation Code: ${companyProfile.ctevtCode || '4208'} • ${companyProfile.address || 'Jorpati, Gokarneshwor, Kathmandu, Nepal'}`
    : (design.affiliationCodeText || 'Government Regd. No: 184920/078/079 • CTEVT Affiliation Code: 4208 • Jorpati, Gokarneshwor, Kathmandu, Nepal');
  const certificateTitleEn = design.certificateTitleEn || 'CERTIFICATE OF VOCATIONAL TRAINING COMPLETION';
  const certificateTitleNp = design.certificateTitleNp || '(Official Skill Completion Credential)';

  // Default values from Batch trainer and Company Profile
  const defaultTrainerName = trainer?.name && trainer.name !== 'Assigned Instructor' 
    ? trainer.name 
    : (companyProfile.leadInstructorName || 'Suman Thapa');
  const defaultTrainerTitle = trainer?.specialization 
    ? `Instructor (${trainer.specialization})` 
    : (companyProfile.leadInstructorTitle || 'Lead Instructor');

  const defaultDirectorName = companyProfile.directorName || 'Gokarna Thapa';
  const defaultDirectorTitle = companyProfile.directorTitle || 'Campus Chief / Managing Director';

  // Dynamic Signatories fallback with automatic batch trainer & company director binding
  const signatories = (design.signatories && design.signatories.length > 0)
    ? design.signatories.map((sig, idx) => {
        if (sig.id === 'sig-1' || idx === 0) {
          return {
            ...sig,
            name: (sig.name && sig.name !== 'Lead Instructor' && sig.name !== 'Suman Thapa') ? sig.name : defaultTrainerName,
            title: sig.title || defaultTrainerTitle
          };
        }
        if (sig.id === 'sig-2' || idx === 1) {
          return {
            ...sig,
            name: (sig.name && sig.name !== 'Director' && sig.name !== 'Gokarna Thapa') ? sig.name : defaultDirectorName,
            title: sig.title || defaultDirectorTitle
          };
        }
        return sig;
      })
    : [
        {
          id: 'sig-1',
          name: defaultTrainerName,
          title: defaultTrainerTitle,
          lineStyle: 'dashed'
        },
        {
          id: 'sig-2',
          name: defaultDirectorName,
          title: defaultDirectorTitle,
          lineStyle: 'solid'
        }
      ];

  const getBackgroundStyle = () => {
    if (design.preprintedTextOnly) {
      return { backgroundColor: 'transparent' };
    }
    if (backgroundType === 'custom') {
      return {
        backgroundColor: '#FFFFFF'
      };
    }
    if (backgroundType === 'ivory-parchment') {
      return {
        background: 'linear-gradient(135deg, #fdfbf7 0%, #faf4e8 50%, #f6ede0 100%)'
      };
    }
    if (backgroundType === 'guilloche-security') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `radial-gradient(${primaryColor}14 1.5px, transparent 1.5px), radial-gradient(${accentColor}14 1.5px, #FFFFFF 1.5px)`,
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 12px 12px'
      };
    }
    if (backgroundType === 'royal-navy-gold') {
      return {
        background: `radial-gradient(ellipse at center, #ffffff 40%, #fbf9f4 75%, ${primaryColor}12 100%)`
      };
    }
    if (backgroundType === 'modern-geometric') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `linear-gradient(30deg, ${primaryColor}06 12%, transparent 12.5%, transparent 87%, ${primaryColor}06 87.5%, ${primaryColor}06), linear-gradient(150deg, ${primaryColor}06 12%, transparent 12.5%, transparent 87%, ${primaryColor}06 87.5%, ${primaryColor}06), linear-gradient(60deg, ${accentColor}0a 25%, transparent 25.5%, transparent 75%, ${accentColor}0a 75%, ${accentColor}0a)`,
        backgroundSize: '40px 70px',
        backgroundPosition: '0 0, 0 0, 20px 35px'
      };
    }
    if (backgroundType === 'damask-floral' || backgroundType === 'damask-classic') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `repeating-linear-gradient(45deg, ${accentColor}0a, ${accentColor}0a 12px, transparent 12px, transparent 24px), repeating-linear-gradient(-45deg, ${accentColor}08, ${accentColor}08 12px, transparent 12px, transparent 24px)`
      };
    }
    if (backgroundType === 'emerald-aristocrat') {
      return {
        background: `radial-gradient(circle at center, #ffffff 45%, #f6fcf8 75%, #064e3b12 100%)`
      };
    }
    if (backgroundType === 'maroon-sovereign') {
      return {
        background: `radial-gradient(circle at center, #ffffff 45%, #fdf6f7 75%, #88133714 100%)`
      };
    }
    if (backgroundType === 'technical-grid') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `linear-gradient(to right, ${primaryColor}0a 1px, transparent 1px), linear-gradient(to bottom, ${primaryColor}0a 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      };
    }
    if (backgroundType === 'marble-veins') {
      return {
        background: 'linear-gradient(125deg, #ffffff 0%, #f9fafb 25%, #f3f4f6 50%, #fafafa 75%, #ffffff 100%)'
      };
    }
    return {
      backgroundColor: '#FFFFFF'
    };
  };

  const getBorderStyle = () => {
    if (design.preprintedTextOnly || borderStyle === 'none') {
      return { border: 'none', outline: 'none', boxShadow: 'none' };
    }
    if (borderStyle === 'royal-double') {
      return {
        border: `${borderWidth}px double ${primaryColor}`,
        outline: `${Math.max(1, Math.round(borderWidth / 2.5))}px solid ${accentColor}`,
        outlineOffset: '-10px',
        borderRadius: '2px'
      };
    }
    if (borderStyle === 'vintage-filigree') {
      return {
        border: `${borderWidth}px solid ${primaryColor}`,
        outline: `${Math.max(1, Math.round(borderWidth / 3))}px dashed ${accentColor}`,
        outlineOffset: '-8px',
        borderRadius: '3px'
      };
    }
    if (borderStyle === 'modern-executive' || borderStyle === 'modern-gold') {
      return {
        border: `${borderWidth}px solid ${primaryColor}`,
        outline: `2px solid ${accentColor}`,
        outlineOffset: '4px',
        borderRadius: '6px'
      };
    }
    if (borderStyle === 'greek-key') {
      return {
        border: `${borderWidth}px solid ${primaryColor}`,
        outline: `3px double ${accentColor}`,
        outlineOffset: '-12px',
        borderRadius: '1px'
      };
    }
    if (borderStyle === 'security-guilloche') {
      return {
        border: `${borderWidth}px ridge ${accentColor}`,
        outline: `2px solid ${primaryColor}`,
        outlineOffset: '-6px',
        borderRadius: '4px'
      };
    }
    if (borderStyle === 'art-deco') {
      return {
        border: `${borderWidth}px solid ${primaryColor}`,
        outline: `1.5px solid ${accentColor}`,
        outlineOffset: '-8px',
        boxShadow: `inset 0 0 0 10px #ffffff, inset 0 0 0 12px ${accentColor}`
      };
    }
    return { border: 'none' };
  };

  const baseWidth = isPortrait ? 760 : 1040;
  const baseHeight = isPortrait ? 1060 : 740;
  const isCompactViewport = previewWidth < baseWidth + 24;
  const isMobileViewport = previewWidth < 600;

  // Auto-fit scale so both Portrait & Landscape fit cleanly like a neat card on mobile
  const widthScale = Math.min(1, Math.max(0.24, (previewWidth - (isMobileViewport ? 20 : 40)) / baseWidth));
  const heightCapScale = isMobileViewport
    ? Math.min(1, Math.max(0.24, (viewportHeight * 0.56) / baseHeight))
    : 1;
  const fitScale = Math.min(widthScale, heightCapScale);
  const activeScale = zoomed ? 1 : fitScale;
  const scaledWidth = Math.round(baseWidth * activeScale);
  const scaledHeight = Math.round(baseHeight * activeScale);

  const handlePrint = () => {
    window.print();
  };

  const captureCertificateCanvas = async () => {
    const el = document.getElementById('printableLandscapeCertificate');
    const frame = document.getElementById('certificateScaleFrame');
    if (!el) throw new Error('Certificate preview element not found.');
    const prevShadow = el.style.boxShadow;
    const prevTransform = el.style.transform;
    const prevFrameOverflow = frame ? frame.style.overflow : '';
    const prevFrameWidth = frame ? frame.style.width : '';
    const prevFrameHeight = frame ? frame.style.height : '';

    // Temporarily render at exact 1:1 full A4 resolution so mobile exports are 100% HD & unclipped
    el.style.boxShadow = 'none';
    el.style.transform = 'none';
    if (frame) {
      frame.style.overflow = 'visible';
      frame.style.width = `${baseWidth}px`;
      frame.style.height = `${el.scrollHeight || baseHeight}px`;
    }
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      const { default: html2canvas } = await import('html2canvas');
      const captureScale = isMobileViewport ? 2.5 : 3;
      return await html2canvas(el, {
        scale: captureScale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: baseWidth,
        height: el.scrollHeight || baseHeight,
        windowWidth: baseWidth,
        windowHeight: el.scrollHeight || baseHeight
      });
    } finally {
      el.style.boxShadow = prevShadow;
      el.style.transform = prevTransform;
      if (frame) {
        frame.style.overflow = prevFrameOverflow;
        frame.style.width = prevFrameWidth;
        frame.style.height = prevFrameHeight;
      }
    }
  };

  const buildSafeFilename = (ext) => {
    const safeName = String(student.name || 'Trainee').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const safeCert = String(certificate.certificateNo || 'CERT').replace(/[^a-zA-Z0-9-]+/g, '_');
    return `Certificate_${safeName}_${safeCert}.${ext}`;
  };

  const handleDownloadPdf = async () => {
    setExportingType('pdf');
    try {
      const [canvas, { jsPDF }] = await Promise.all([
        captureCertificateCanvas(),
        import('jspdf')
      ]);
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const orientation = isPortrait ? 'portrait' : 'landscape';
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pageW = pdf.internal.pageSize.getWidth();   // 297mm landscape / 210mm portrait
      const pageH = pdf.internal.pageSize.getHeight();  // 210mm landscape / 297mm portrait

      // Fit proportionally into exact A4 page with zero distortion
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const drawW = canvas.width * ratio;
      const drawH = canvas.height * ratio;
      const offsetX = (pageW - drawW) / 2;
      const offsetY = (pageH - drawH) / 2;

      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');
      pdf.save(buildSafeFilename('pdf'));
    } catch (err) {
      console.error('Certificate PDF export failed:', err);
      alert('PDF download failed. You can also use Print -> Save as PDF.');
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadPng = async () => {
    setExportingType('png');
    try {
      const canvas = await captureCertificateCanvas();
      const link = document.createElement('a');
      link.download = buildSafeFilename('png');
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Certificate PNG export failed:', err);
      alert('PNG export failed.');
    } finally {
      setExportingType(null);
    }
  };

  const verificationUrl = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(
    certificate.certificateNo
  )}`;

  const shareText =
    `*${instituteName}*\n` +
    `🎓 *VOCATIONAL TRAINING COMPLETION CERTIFICATE*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *Trainee:* ${student.name} (${student.tgid})\n` +
    `• *Course:* ${course?.title || 'Vocational Training'} (${course?.totalHours || 390} Hours)\n` +
    `• *Cert No:* ${certificate.certificateNo}\n` +
    `• *Issue Date:* ${certificate.issueDate}\n` +
    `• *Status:* ✅ Successfully Completed (CTEVT Standards)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔗 *Online Verification Link:*\n${verificationUrl}\n\n` +
    `_Official skill completion certificate issued by a CTEVT-affiliated institution._`;

  const isFemale = (student.gender || '').toLowerCase() === 'female';
  const activeBodyMode = bodyModeOverride || design.bodyLayoutMode || 'english-only';
  const durationDisplayMode = design.durationDisplayMode || 'hours';
  const bodyData = buildCertificateBodyData({
    student,
    course,
    group,
    certificate,
    durationDisplayMode
  });
  const effectiveNepaliBody = savedNepaliText || buildDefaultNepaliBody(bodyData);

  const handleOpenNepaliDialog = () => {
    setNepaliDraft(savedNepaliText || buildDefaultNepaliBody(bodyData));
    setAiNotice('');
    setNepaliDialogOpen(true);
  };

  const handleGenerateNepaliAI = async () => {
    setAiGenerating(true);
    setAiNotice('');
    try {
      const res = await generateNepaliCertificateBodyWithGemini({
        student,
        course,
        group,
        certificate,
        durationDisplayMode
      });
      setNepaliDraft(res.text);
      if (res.ok) {
        setAiNotice('Gemini AI बाट शुद्ध नेपाली अनुच्छेद तयार भयो। आवश्यक परे एडिट गरेर Save & Apply थिच्नुहोस्।');
      } else {
        setAiNotice(res.message || 'Default Nepali template loaded.');
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveNepaliDraft = () => {
    const cleaned = String(nepaliDraft || '').trim();
    saveNepaliBody(certificate, cleaned);
    setSavedNepaliText(cleaned);
    if (activeBodyMode === 'english-only') {
      setBodyModeOverride('bilingual');
    }
    setNepaliDialogOpen(false);
  };

  const renderOuter = (children) =>
    inlineRender ? (
      <Box>{children}</Box>
    ) : (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxWidth: isPortrait ? '840px' : '1160px',
            bgcolor: '#f8fafc'
          }
        }}
      >
        {children}
      </Dialog>
    );

  return renderOuter(
    <>
      {/* Top Action Toolbar (Hidden in Print & inlineRender) — Compact on Mobile */}
      {!inlineRender && (
      <Box
        className="no-print"
        sx={{
          px: { xs: 1.25, sm: 2 },
          py: { xs: 1, sm: 1.5 },
          bgcolor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 1.5 }
        }}
      >
        {/* Row 1 on mobile: Compact Format Badge + Cert No + Zoom + Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Chip
              size="small"
              label={isPortrait ? 'A4 Portrait' : 'A4 Landscape'}
              sx={{
                bgcolor: '#c59b27',
                color: '#0f172a',
                fontWeight: 900,
                fontSize: { xs: '0.68rem', sm: '0.76rem' },
                height: { xs: 22, sm: 26 }
              }}
            />
            <Typography
              variant="body2"
              noWrap
              sx={{ color: '#cbd5e1', fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.82rem' } }}
            >
              {certificate.certificateNo}
            </Typography>
          </Box>

          {/* Mobile-only Nepali AI, Zoom & Close right next to title */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleOpenNepaliDialog}
              aria-label="Nepali AI"
              sx={{ color: '#FDE047', border: '1px solid rgba(253,224,71,0.4)', borderRadius: 1.5, p: 0.5 }}
            >
              <TranslateIcon sx={{ fontSize: 16 }} />
            </IconButton>
            {isCompactViewport && (
              <IconButton
                size="small"
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? 'Fit to screen' : 'Zoom full size'}
                sx={{ color: '#e2e8f0', border: '1px solid #334155', borderRadius: 1.5, p: 0.5 }}
              >
                {zoomed ? <FitScreenIcon sx={{ fontSize: 16 }} /> : <ZoomInIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Close"
              sx={{ color: '#ffffff', border: '1px solid #475569', borderRadius: 1.5, p: 0.5 }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Action Buttons — 4-column compact grid on mobile, inline flex on desktop */}
        <Box
          sx={{
            display: { xs: 'grid', sm: 'flex' },
            gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'none' },
            gap: { xs: 0.6, sm: 1 },
            flexWrap: { sm: 'wrap' },
            alignItems: 'center'
          }}
        >
          {savedPresets.length > 0 && (
            <TextField
              select
              size="small"
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                minWidth: 148,
                '& .MuiOutlinedInput-root': {
                  height: 30,
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  bgcolor: '#1E293B',
                  '& fieldset': { borderColor: '#475569' },
                  '&:hover fieldset': { borderColor: '#94A3B8' }
                },
                '& .MuiSvgIcon-root': { color: '#CBD5E1' }
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.78rem' }}>
                {autoMatchedPreset ? `Auto: ${autoMatchedPreset.name}` : 'Default Studio Design'}
              </MenuItem>
              {autoMatchedPreset && (
                <MenuItem value="__studio__" sx={{ fontSize: '0.78rem', color: '#475569' }}>
                  Studio Base Design
                </MenuItem>
              )}
              {savedPresets.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  {baseDesign.defaultPresetId === p.id ? '★ ' : ''}
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<TranslateIcon sx={{ fontSize: '15px !important' }} />}
            onClick={handleOpenNepaliDialog}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              borderColor: 'rgba(253, 224, 71, 0.5)',
              color: '#FDE047',
              fontWeight: 800,
              px: 1.4,
              py: 0.6,
              fontSize: '0.76rem',
              textTransform: 'none',
              bgcolor: 'rgba(250, 204, 21, 0.1)',
              '&:hover': { borderColor: '#FDE047', bgcolor: 'rgba(250, 204, 21, 0.2)' }
            }}
          >
            नेपाली AI
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={Boolean(exportingType)}
            startIcon={exportingType === 'pdf' ? <CircularProgress size={12} color="inherit" /> : <PictureAsPdfIcon sx={{ fontSize: { xs: '14px !important', sm: '16px !important' } }} />}
            onClick={handleDownloadPdf}
            sx={{
              bgcolor: '#DC2626',
              fontWeight: 800,
              px: { xs: 0.75, sm: 1.75 },
              py: { xs: 0.55, sm: 0.6 },
              fontSize: { xs: '0.68rem', sm: '0.78rem' },
              minWidth: 0,
              textTransform: 'none',
              '&:hover': { bgcolor: '#B91C1C' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {exportingType === 'pdf' ? 'Generating A4 PDF...' : 'Download A4 PDF'}
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              {exportingType === 'pdf' ? '...' : 'PDF'}
            </Box>
          </Button>

          <Button
            variant="outlined"
            size="small"
            disabled={Boolean(exportingType)}
            startIcon={exportingType === 'png' ? <CircularProgress size={12} color="inherit" /> : <ImageIcon sx={{ fontSize: { xs: '14px !important', sm: '16px !important' } }} />}
            onClick={handleDownloadPng}
            sx={{
              borderColor: '#38BDF8',
              color: '#38BDF8',
              fontWeight: 800,
              px: { xs: 0.75, sm: 1.5 },
              py: { xs: 0.55, sm: 0.6 },
              fontSize: { xs: '0.68rem', sm: '0.78rem' },
              minWidth: 0,
              textTransform: 'none',
              bgcolor: 'rgba(56, 189, 248, 0.1)',
              '&:hover': { borderColor: '#7DD3FC', bgcolor: 'rgba(56, 189, 248, 0.2)' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {exportingType === 'png' ? 'Saving...' : 'Save PNG'}
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              {exportingType === 'png' ? '...' : 'PNG'}
            </Box>
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<PrintIcon sx={{ fontSize: { xs: '14px !important', sm: '16px !important' } }} />}
            onClick={handlePrint}
            sx={{
              bgcolor: '#1a56b0',
              fontWeight: 800,
              px: { xs: 0.75, sm: 1.75 },
              py: { xs: 0.55, sm: 0.6 },
              fontSize: { xs: '0.68rem', sm: '0.78rem' },
              minWidth: 0,
              textTransform: 'none',
              '&:hover': { bgcolor: '#123e80' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Print (A4 {isPortrait ? 'Portrait' : 'Landscape'})
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              Print
            </Box>
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<WhatsAppIcon sx={{ fontSize: { xs: '14px !important', sm: '16px !important' } }} />}
            component="a"
            href={getWhatsAppUrl(student.phone || '', shareText)}
            target="_blank"
            sx={{
              borderColor: '#25D366',
              color: '#25D366',
              fontWeight: 800,
              px: { xs: 0.75, sm: 1.5 },
              py: { xs: 0.55, sm: 0.6 },
              fontSize: { xs: '0.68rem', sm: '0.78rem' },
              minWidth: 0,
              textTransform: 'none',
              bgcolor: 'rgba(37, 211, 102, 0.1)',
              '&:hover': { borderColor: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.2)' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              WhatsApp
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              Share
            </Box>
          </Button>

          {isCompactViewport && (
            <Tooltip title={zoomed ? 'Fit to screen' : 'Zoom 100%'}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setZoomed((z) => !z)}
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: '#e2e8f0', borderColor: '#475569', minWidth: 36, px: 1 }}
              >
                {zoomed ? <FitScreenIcon fontSize="small" /> : <ZoomInIcon fontSize="small" />}
              </Button>
            </Tooltip>
          )}

          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: '#ffffff', borderColor: '#475569', minWidth: 38, px: 1 }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
      </Box>
      )}

      {/* Printable Certificate Canvas — Auto-scaled neat card preview on Mobile/Small Screens */}
      <Box
        ref={previewWrapRef}
        sx={
          inlineRender
            ? { p: 0, bgcolor: '#ffffff' }
            : {
                p: { xs: 1.25, sm: 2.5 },
                bgcolor: '#e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: zoomed && isCompactViewport ? 'flex-start' : 'center',
                justifyContent: 'flex-start',
                overflowX: zoomed && isCompactViewport ? 'auto' : 'hidden',
                overflowY: 'auto',
                maxHeight: 'calc(92dvh - 76px)'
              }
        }
      >
        {!inlineRender && isCompactViewport && (
          <Typography
            className="no-print"
            variant="caption"
            sx={{
              mb: 1,
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.68rem',
              textAlign: 'center',
              alignSelf: 'center'
            }}
          >
            {zoomed
              ? 'Full 100% view (swipe to scroll) • Download always saves exact A4 HD'
              : `Compact Preview (${Math.round(activeScale * 100)}%) • Tap PDF for full A4 HD`}
          </Typography>
        )}

        <Box
          id={inlineRender ? undefined : 'certificateScaleFrame'}
          sx={{
            width: inlineRender ? `${baseWidth}px` : `${scaledWidth}px`,
            height: inlineRender ? 'auto' : `${scaledHeight}px`,
            position: 'relative',
            flexShrink: 0,
            borderRadius: !inlineRender && activeScale < 1 ? '6px' : 0,
            boxShadow: !inlineRender && activeScale < 1 ? '0 6px 20px rgba(15, 23, 42, 0.18)' : 'none',
            overflow: inlineRender ? 'visible' : 'hidden',
            bgcolor: '#ffffff'
          }}
        >
          <Box
            id={canvasId}
            sx={{
              width: `${baseWidth}px`,
              minHeight: `${baseHeight}px`,
              p: `${borderMargin}mm`,
              boxSizing: 'border-box',
              fontFamily: "'Noto Sans Devanagari', 'Cinzel', 'Times New Roman', serif",
              color: '#111827',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: inlineRender || activeScale < 1 ? 'none' : '0 10px 30px rgba(0,0,0,0.15)',
              transform: !inlineRender && activeScale < 1 ? `scale(${activeScale})` : 'none',
              transformOrigin: 'top left',
              ...getBorderStyle(),
              ...getBackgroundStyle()
            }}
          >
          {/* Custom Uploaded Background Layer with Opacity & Fit */}
          {!design.preprintedTextOnly && backgroundType === 'custom' && customBackgroundUrl && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${customBackgroundUrl})`,
                backgroundSize: design.customBgFit || 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: (design.customBgOpacity !== undefined ? Number(design.customBgOpacity) : 100) / 100,
                pointerEvents: 'none',
                zIndex: 0
              }}
            />
          )}

          {/* 4 Corner Ornaments */}
          {!design.preprintedTextOnly && cornerStyle !== 'none' && (
            <>
              <CornerSvg style={cornerStyle} size={cornerSize} color={cornerColor} position="top-left" />
              <CornerSvg style={cornerStyle} size={cornerSize} color={cornerColor} position="top-right" />
              <CornerSvg style={cornerStyle} size={cornerSize} color={cornerColor} position="bottom-left" />
              <CornerSvg style={cornerStyle} size={cornerSize} color={cornerColor} position="bottom-right" />
            </>
          )}

          {/* Subtle Background Watermark */}
          {!design.preprintedTextOnly && watermarkOpacity > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: watermarkOpacity / 100,
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              <SchoolIcon sx={{ fontSize: isPortrait ? 380 : 340, color: primaryColor }} />
            </Box>
          )}

          {/* 1. Institutional Letterhead Header: Individual Movable Layers */}
          {showHeader && (
            <Box
              sx={{
                position: 'relative',
                zIndex: 3,
                pb: 1,
                borderBottom: showHeaderDivider && backgroundType !== 'custom' ? `1.5px solid ${accentColor}` : 'none'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', px: 2 }}>
                {/* Left Logo / Emblem (Independently Movable) */}
                <Box
                  sx={{
                    width: `${design.leftLogoWidth || 46}px`,
                    position: 'relative',
                    zIndex: 2,
                    transform: `translate(${elStyles.leftLogo?.x || 0}px, ${elStyles.leftLogo?.y || 0}px)`
                  }}
                >
                  {showLeftLogo && (
                    (design.leftLogoUrl || companyProfile.logoImage) ? (
                      <img src={design.leftLogoUrl || companyProfile.logoImage} alt="Logo" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    ) : (
                      <SchoolIcon sx={{ fontSize: design.leftLogoWidth || 46, color: primaryColor }} />
                    )
                  )}
                </Box>

                {/* Center Institutional Name Lines (Independently Movable) */}
                <Box sx={{ textAlign: 'center', flexGrow: 1, px: 2 }}>
                  {/* Line 1: Main Title */}
                  {showHeaderTitle && (
                  <Box sx={{ transform: `translate(${elStyles.headerTitle?.x || 0}px, ${elStyles.headerTitle?.y || 0}px)` }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: elStyles.headerTitle?.fontFamily || "'Times New Roman', serif",
                        fontWeight: elStyles.headerTitle?.fontWeight || 900,
                        fontStyle: elStyles.headerTitle?.fontStyle || 'normal',
                        letterSpacing: '0.04em',
                        color: elStyles.headerTitle?.color || primaryColor,
                        fontSize: elStyles.headerTitle?.fontSize ? `${elStyles.headerTitle.fontSize}px` : (isPortrait ? '1.25rem' : '1.4rem'),
                        textTransform: 'uppercase'
                      }}
                    >
                      {instituteName}
                    </Typography>
                  </Box>
                  )}

                  {/* Line 2: Accreditation */}
                  {design.showAccreditation !== false && (
                    <Box sx={{ transform: `translate(${elStyles.headerSub?.x || 0}px, ${elStyles.headerSub?.y || 0}px)`, mt: 0.3 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: elStyles.headerSub?.fontSize ? `${elStyles.headerSub.fontSize}px` : '0.72rem',
                          fontWeight: elStyles.headerSub?.fontWeight || 600,
                          color: elStyles.headerSub?.color || '#475569'
                        }}
                      >
                        {accreditationText}
                      </Typography>
                    </Box>
                  )}

                  {/* Line 3: Registration & Location */}
                  {design.showAffiliation !== false && (
                    <Box sx={{ transform: `translate(${elStyles.headerAddress?.x || 0}px, ${elStyles.headerAddress?.y || 0}px)`, mt: 0.2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: elStyles.headerAddress?.fontSize ? `${elStyles.headerAddress.fontSize}px` : '0.68rem',
                          color: elStyles.headerAddress?.color || '#64748b'
                        }}
                      >
                        {affiliationCodeText}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Right Logo / CTEVT Badge (Independently Movable) */}
                <Box
                  sx={{
                    width: `${design.rightLogoWidth || 46}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    zIndex: 2,
                    transform: `translate(${elStyles.rightLogo?.x || 0}px, ${elStyles.rightLogo?.y || 0}px)`
                  }}
                >
                  {showRightLogo && (
                    design.rightLogoUrl ? (
                      <img src={design.rightLogoUrl} alt="Right Badge" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    ) : (
                      <VerifiedIcon sx={{ fontSize: design.rightLogoWidth || 46, color: accentColor }} />
                    )
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* 2. Certificate Title Banner (Movable & Toggleable) */}
          {showTitle && (
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              textAlign: elStyles.title?.align || 'center',
              my: isPortrait ? 1.5 : 0.8,
              transform: `translate(${elStyles.title?.x || 0}px, ${elStyles.title?.y || 0}px)`
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: elStyles.title?.fontFamily || "'Times New Roman', serif",
                fontWeight: elStyles.title?.fontWeight || 900,
                fontStyle: elStyles.title?.fontStyle || 'normal',
                color: elStyles.title?.color || primaryColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: elStyles.title?.fontSize ? `${elStyles.title.fontSize}px` : (isPortrait ? '1.2rem' : '1.35rem'),
                mb: 0.2
              }}
            >
              {certificateTitleEn}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: accentColor,
                fontSize: '1rem',
                letterSpacing: '0.04em'
              }}
            >
              {certificateTitleNp}
            </Typography>
          </Box>
          )}

          {/* 3. Reference Tracking Bar — Each of the 3 values is independently positioned & toggleable */}
          {showRefBar && (
            <Box
              sx={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                py: 0.5,
                bgcolor: transparentRefBar ? 'transparent' : '#f8fafc',
                borderTop: transparentRefBar ? 'none' : '1px solid #e2e8f0',
                borderBottom: transparentRefBar ? 'none' : '1px solid #e2e8f0',
                transform: `translate(${elStyles.refBar?.x || 0}px, ${elStyles.refBar?.y || 0}px)`
              }}
            >
              {showRefCertNo ? (
                <Box
                  sx={{
                    fontSize: elStyles.refCertNo?.fontSize ? `${elStyles.refCertNo.fontSize}px` : '0.78rem',
                    fontWeight: elStyles.refCertNo?.fontWeight || 700,
                    color: elStyles.refCertNo?.color || '#334155',
                    transform: `translate(${elStyles.refCertNo?.x || 0}px, ${elStyles.refCertNo?.y || 0}px)`
                  }}
                >
                  Certificate No: <b style={{ color: primaryColor }}>{certificate.certificateNo}</b>
                </Box>
              ) : <Box />}

              {showRefTgid ? (
                <Box
                  sx={{
                    fontSize: elStyles.refTgid?.fontSize ? `${elStyles.refTgid.fontSize}px` : '0.78rem',
                    fontWeight: elStyles.refTgid?.fontWeight || 700,
                    color: elStyles.refTgid?.color || '#334155',
                    transform: `translate(${elStyles.refTgid?.x || 0}px, ${elStyles.refTgid?.y || 0}px)`
                  }}
                >
                  Registration / TGID: <b style={{ color: primaryColor }}>{student.tgid}</b>
                </Box>
              ) : <Box />}

              {showRefIssueDate ? (
                <Box
                  sx={{
                    fontSize: elStyles.refIssueDate?.fontSize ? `${elStyles.refIssueDate.fontSize}px` : '0.78rem',
                    fontWeight: elStyles.refIssueDate?.fontWeight || 700,
                    color: elStyles.refIssueDate?.color || '#334155',
                    transform: `translate(${elStyles.refIssueDate?.x || 0}px, ${elStyles.refIssueDate?.y || 0}px)`
                  }}
                >
                  Issue Date: <b>{certificate.issueDate}</b>
                </Box>
              ) : <Box />}
            </Box>
          )}

          {/* 4. Trainee Centerpiece & Photo Frame (Movable) */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: elStyles.photo?.preset === 'center' ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              my: isPortrait ? 1.5 : 1
            }}
          >
            {/* Photo if placed on LEFT */}
            {elStyles.photo?.preset === 'left' && showStudentPhoto && (
              <Box
                sx={{
                  width: `${elStyles.photo?.width || 92}px`,
                  height: `${Math.round((elStyles.photo?.width || 92) * 1.25)}px`,
                  position: 'relative',
                  transform: `translate(${elStyles.photo?.x || 0}px, ${elStyles.photo?.y || 0}px)`
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    border: `2px solid ${elStyles.photo?.borderColor || accentColor}`,
                    borderRadius: `${elStyles.photo?.borderRadius || 4}px`,
                    p: '2px',
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <PersonIcon sx={{ fontSize: 36, color: '#94a3b8' }} />
                  )}
                </Box>
              </Box>
            )}

            {/* Left Competency Badge (if photo not on left) */}
            {elStyles.photo?.preset !== 'left' && (
              <Box sx={{ width: '96px' }}>
                {showCompetencyBadge && (
                  <Box
                    sx={{
                      border: `1.5px dashed ${accentColor}`,
                      borderRadius: 1,
                      p: '4px 8px',
                      textAlign: 'center',
                      bgcolor: '#fffbf0'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.64rem', fontWeight: 900, color: primaryColor, display: 'block' }}>
                      {(design.competencyBadgeTitle || '').trim() || course?.level || 'SKILL CERTIFIED'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.58rem', color: '#64748b', display: 'block' }}>
                      {(design.hoursBadgeText || '').trim() || `${course?.totalHours || 390} HRS`}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Center Trainee Name Highlight (Movable) */}
            <Box
              sx={{
                textAlign: elStyles.student?.align || 'center',
                flexGrow: 1,
                px: 2,
                transform: `translate(${elStyles.student?.x || 0}px, ${elStyles.student?.y || 0}px)`
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', letterSpacing: '0.04em', display: 'block' }}>
                This is proudly awarded to:
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: elStyles.student?.fontFamily || "'Times New Roman', serif",
                  fontWeight: elStyles.student?.fontWeight || 900,
                  fontStyle: elStyles.student?.fontStyle || 'normal',
                  color: elStyles.student?.color || primaryColor,
                  letterSpacing: '0.04em',
                  fontSize: elStyles.student?.fontSize ? `${elStyles.student.fontSize}px` : (isPortrait ? '1.9rem' : '1.85rem'),
                  mt: 0.3
                }}
              >
                {student.name}
              </Typography>
              {showNepaliNameSubtitle && student.nameNepali && (
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    color: accentColor,
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                    mt: 0.2
                  }}
                >
                  ({student.nameNepali})
                </Typography>
              )}
              {showCourseLine && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    color: '#059669',
                    fontSize: '0.94rem',
                    letterSpacing: '0.05em',
                    mt: 0.3
                  }}
                >
                  COURSE: {(course?.title || 'Vocational Training').toUpperCase()} ({bodyData.durationEn.toUpperCase()})
                </Typography>
              )}
            </Box>

            {/* Photo if placed on RIGHT (Default) */}
            {elStyles.photo?.preset !== 'left' && (
              <Box
                sx={{
                  width: `${elStyles.photo?.width || 92}px`,
                  height: `${Math.round((elStyles.photo?.width || 92) * 1.25)}px`,
                  position: 'relative',
                  transform: `translate(${elStyles.photo?.x || 0}px, ${elStyles.photo?.y || 0}px)`
                }}
              >
                {showStudentPhoto && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      border: `2px solid ${elStyles.photo?.borderColor || accentColor}`,
                      borderRadius: `${elStyles.photo?.borderRadius || 4}px`,
                      p: '2px',
                      bgcolor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <>
                        <PersonIcon sx={{ fontSize: 36, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#64748b', textAlign: 'center', lineHeight: 1 }}>
                          PHOTO<br />(35×45mm)
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* 5. English & Nepali Wording Paragraphs (Movable & Toggleable) */}
          {showBodyText && (
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              px: 3,
              textAlign: elStyles.body?.align || 'justify',
              my: isPortrait ? 1.5 : 0.5,
              transform: `translate(${elStyles.body?.x || 0}px, ${elStyles.body?.y || 0}px)`
            }}
          >
            {(activeBodyMode === 'english-only' || activeBodyMode === 'bilingual') && (
              <Typography
                variant="body2"
                sx={{
                  fontFamily: elStyles.body?.fontFamily || "'Times New Roman', serif",
                  fontSize: elStyles.body?.fontSize ? `${elStyles.body.fontSize}px` : (isPortrait ? '0.92rem' : '0.9rem'),
                  lineHeight: elStyles.body?.lineHeight || 1.55,
                  color: elStyles.body?.color || '#1e293b',
                  fontWeight: elStyles.body?.fontWeight || 'normal',
                  fontStyle: elStyles.body?.fontStyle || 'normal',
                  mb: activeBodyMode === 'bilingual' ? 0.8 : 0
                }}
              >
                This is to certify that {bodyData.salutationEn} <b>{bodyData.studentName}</b>
                {bodyData.dob ? (
                  <>
                    , born on <b>{bodyData.dob}</b>
                  </>
                ) : null}
                , {bodyData.relationEn} of Mr./Mrs. <b>{bodyData.guardianName}</b> and inhabitant of{' '}
                <b>{bodyData.address}</b>, has successfully completed <b>{bodyData.durationEn}</b> skills training on{' '}
                <b>{bodyData.courseTitle}</b> provided by this institute from <b>{bodyData.startDate}</b> to{' '}
                <b>{bodyData.endDate}</b>. During the training period {bodyData.pronounEn} performance was{' '}
                <b>{bodyData.performanceEn}</b>.
              </Typography>
            )}

            {activeBodyMode === 'bilingual' && (
              <Box sx={{ my: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box sx={{ flexGrow: 1, height: '1px', bgcolor: '#e2e8f0' }} />
                <Box sx={{ color: accentColor, fontSize: '0.75rem' }}>❖</Box>
                <Box sx={{ flexGrow: 1, height: '1px', bgcolor: '#e2e8f0' }} />
              </Box>
            )}

            {(activeBodyMode === 'bilingual' || activeBodyMode === 'nepali-only') && (
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Noto Sans Devanagari', sans-serif",
                  fontSize: elStyles.body?.fontSize ? `${elStyles.body.fontSize}px` : (isPortrait ? '0.88rem' : '0.86rem'),
                  lineHeight: elStyles.body?.lineHeight || 1.55,
                  color: elStyles.body?.color || '#1e293b',
                  fontWeight: elStyles.body?.fontWeight || 'normal',
                  fontStyle: elStyles.body?.fontStyle || 'normal'
                }}
              >
                {effectiveNepaliBody}
              </Typography>
            )}
          </Box>
          )}

          {/* 6. Footer: Dynamic QR + Official Seal (4 Modes) + Dynamic Signatories (Movable) */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              mt: isPortrait ? 2.5 : 1.2,
              pt: 1.2,
              borderTop: backgroundType === 'custom' ? 'none' : '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              px: 2
            }}
          >
            {/* Left: Dynamic QR Code */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                width: '26%',
                transform: `translate(${elStyles.qrCode?.x || 0}px, ${elStyles.qrCode?.y || 0}px)`
              }}
            >
              <Box sx={{ p: 0.5, bgcolor: '#ffffff', border: `1.5px solid ${primaryColor}`, borderRadius: 1 }}>
                <QRCodeSVG value={verificationUrl} size={elStyles.qrCode?.qrSize || 54} level="M" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryColor, display: 'block', fontSize: '0.7rem' }}>
                  SCAN TO VERIFY
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.62rem' }}>
                  CTEVT Accredited
                </Typography>
                <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 700, fontSize: '0.64rem' }}>
                  {certificate.certificateNo}
                </Typography>
              </Box>
            </Box>

            {/* Center: Official Seal Zone (4 Modes) */}
            {design.sealMode !== 'none' && (
              <Box
                sx={{
                  textAlign: 'center',
                  width: '32%',
                  transform: `translate(${elStyles.seal?.x || 0}px, ${elStyles.seal?.y || 0}px)`
                }}
              >
                {/* MODE 1: Scanned Real Stamp Upload */}
                {design.sealMode === 'scanned' && (design.customSealUrl || companyProfile.stampImage) && (
                  <Box
                    component="img"
                    src={design.customSealUrl || companyProfile.stampImage}
                    alt="Official Stamp"
                    sx={{
                      width: `${design.sealWidth || 84}px`,
                      height: 'auto',
                      transform: `rotate(${design.sealTilt || 0}deg)`,
                      display: 'inline-block'
                    }}
                  />
                )}

                {/* MODE 2: Reserved Blank Space for Hand Rubber Stamp (Wet Stamp) */}
                {design.sealMode === 'blank' && (
                  <Box
                    sx={{
                      width: '100px',
                      height: '60px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed rgba(203, 213, 225, 0.4)',
                      borderRadius: '50%',
                      bgcolor: 'transparent'
                    }}
                  />
                )}

                {/* MODE 3: Built-in Graphic Seal */}
                {design.sealMode === 'digital' && (
                  <Box
                    sx={{
                      display: 'inline-block',
                      p: '6px 14px',
                      border: `1.5px solid ${accentColor}`,
                      borderRadius: 2,
                      bgcolor: '#fdfbf7',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 900, color: primaryColor, display: 'block', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
                      ★ OFFICIAL SEAL ★
                    </Typography>
                    <Typography variant="caption" sx={{ color: accentColor, fontWeight: 800, fontSize: '0.66rem', display: 'block' }}>
                      {companyProfile.companyNameEn || 'Prabidhik School, Jorpati'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.62rem', display: 'block' }}>
                      CTEVT ACCREDITED • KATHMANDU
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Right: Dynamic Signatories List (Independently Movable & Toggleable) */}
            {showSignatories && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2.5,
                width: design.sealMode === 'none' ? '68%' : '42%',
                transform: `translate(${elStyles.signatories?.x || 0}px, ${elStyles.signatories?.y || 0}px)`
              }}
            >
              {signatories.map((sig) => (
                <Box key={sig.id} sx={{ textAlign: 'center', minWidth: '110px' }}>
                  <Box
                    sx={{
                      minHeight: 34,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      borderBottom: sig.lineStyle === 'dashed' ? '1px dashed #64748b' : sig.lineStyle === 'none' ? 'none' : `1.5px solid ${primaryColor}`,
                      mb: 0.5,
                      pb: 0.3
                    }}
                  >
                    {design.showDigitalSignatures !== false && sig.signatureUrl && (
                      <Box
                        component="img"
                        src={sig.signatureUrl}
                        alt={`${sig.name} Signature`}
                        crossOrigin="anonymous"
                        sx={{
                          height: `${sig.signatureHeight || 34}px`,
                          maxWidth: '125px',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryColor, fontSize: '0.78rem' }}>
                    {sig.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
                    {sig.title}
                  </Typography>
                </Box>
              ))}
            </Box>
            )}
          </Box>
          </Box>
        </Box>
      </Box>

      {/* Printable CSS Helper injected for exact A4 Orientation Output */}
      {!inlineRender && (
      <style>{`
        @page {
          size: A4 ${isPortrait ? 'portrait' : 'landscape'};
          margin: 6mm 6mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printableLandscapeCertificate, #printableLandscapeCertificate * {
            visibility: visible !important;
          }
          #certificateScaleFrame {
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
          }
          #printableLandscapeCertificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 98vh !important;
            margin: 0 !important;
            transform: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      )}

      {/* 1-Click Gemini AI Nepali Generator & Language Override Dialog */}
      {!inlineRender && (
      <Dialog
        open={nepaliDialogOpen}
        onClose={() => setNepaliDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="no-print"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TranslateIcon fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              नेपाली सर्टिफिकेट अनुच्छेद (Gemini AI)
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setNepaliDialogOpen(false)} sx={{ color: '#ffffff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="यो सर्टिफिकेटको भाषा (Language Mode)"
              value={activeBodyMode}
              onChange={(e) => setBodyModeOverride(e.target.value)}
            >
              <MenuItem value="english-only">English Only (अङ्ग्रेजी मात्र)</MenuItem>
              <MenuItem value="bilingual">Bilingual (English + नेपाली)</MenuItem>
              <MenuItem value="nepali-only">Nepali Only (नेपाली मात्र)</MenuItem>
            </TextField>

            <Button
              variant="contained"
              disabled={aiGenerating}
              startIcon={aiGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={handleGenerateNepaliAI}
              sx={{
                bgcolor: '#0F2C59',
                fontWeight: 800,
                py: 1,
                textTransform: 'none',
                '&:hover': { bgcolor: '#163A70' }
              }}
            >
              {aiGenerating ? 'Gemini AI ले शुद्ध नेपाली बनाउँदैछ...' : 'Gemini AI बाट १-क्लिकमा शुद्ध नेपाली बनाउनुहोस्'}
            </Button>

            {aiNotice && (
              <Alert severity="info" sx={{ fontSize: '0.78rem', py: 0.5 }}>
                {aiNotice}
              </Alert>
            )}

            <TextField
              multiline
              rows={5}
              fullWidth
              label="नेपाली अनुच्छेद (चाहिएमा यहाँ सिधै एडिट गर्न मिल्छ)"
              value={nepaliDraft}
              onChange={(e) => setNepaliDraft(e.target.value)}
              InputProps={{
                sx: { fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: '0.9rem', lineHeight: 1.6 }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNepaliDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveNepaliDraft}
            sx={{ bgcolor: '#059669', fontWeight: 800, '&:hover': { bgcolor: '#047857' } }}
          >
            Save &amp; Apply
          </Button>
        </DialogActions>
      </Dialog>
      )}
    </>
  );
}
