import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Grid,
  Alert,
  Divider,
  Paper,
  Chip,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse
} from '@mui/material';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import EditNoteIcon from '@mui/icons-material/EditNote';
import TuneIcon from '@mui/icons-material/Tune';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';
import CropPortraitIcon from '@mui/icons-material/CropPortrait';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import PanToolIcon from '@mui/icons-material/PanTool';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LayersIcon from '@mui/icons-material/Layers';
import { QRCodeSVG } from 'qrcode.react';

import { loadDB, saveDB } from '../../services/storage';

// Default Design Configuration
export const DEFAULT_CERTIFICATE_DESIGN = {
  // 1. Orientation & Dimensions
  orientation: 'landscape', // 'landscape' | 'portrait'
  templateName: 'आधिकारिक ३ महिने व्यावसायिक तालिम ढाँचा',

  // 2. 10 Background Presets
  backgroundType: 'clean-white',
  customBackgroundUrl: '',
  watermarkType: 'school-crest',
  watermarkOpacity: 4,
  watermarkScale: 100,

  // 3. 7 Border Styles & Corner Ornaments
  borderStyle: 'royal-double',
  borderWidth: 6,
  borderMargin: 12,
  cornerStyle: 'victorian-flourish',
  cornerSize: 32,
  cornerColor: '#C59B27',

  // 4. Color Palette & Pickers
  primaryColor: '#0B2545',
  accentColor: '#C59B27',
  backgroundColor: '#FFFFFF',
  textColor: '#0F172A',

  // 5. Header & Branding (Single Versatile Line + Sub lines)
  showHeader: true,
  instituteName: 'GLOBAL ERA TECHNICAL SCHOOL / GLOBAL ERA MULTI SERVICE',
  showLeftLogo: true,
  leftLogoUrl: '',
  leftLogoWidth: 46,
  showRightLogo: true,
  rightLogoUrl: '',
  rightLogoWidth: 46,
  showAccreditation: true,
  accreditationText: 'Accredited Technical Training Provider under Council for Technical Education and Vocational Training (CTEVT)',
  showAffiliation: true,
  affiliationCodeText: 'Government Regd. No: 184920/078/079 • CTEVT Affiliation Code: 4208 • MitraPark, Kathmandu, Nepal',

  // 6. Title & Body Typography
  certificateTitleEn: 'CERTIFICATE OF VOCATIONAL TRAINING COMPLETION',
  certificateTitleNp: '(व्यावसायिक तालिम समापन प्रमाणपत्र)',
  bodyLayoutMode: 'bilingual',
  showStudentPhoto: true,
  showCompetencyBadge: true,
  hoursBadgeText: '390 HRS • LEVEL 1',

  // 7. Dynamic Official Seal (छाप) 4-in-1 Modes
  sealMode: 'blank', // 'blank' | 'scanned' | 'digital' | 'none'
  customSealUrl: '',
  sealWidth: 84,
  sealTilt: 0, // -5 to +5 deg
  showQrVerification: true,

  // 8. Dynamic Signatories (Add/Remove)
  signatories: [
    {
      id: 'sig-1',
      name: 'सुमन थापा (Suman Thapa)',
      title: 'प्रशिक्षक (Lead Instructor)',
      lineStyle: 'dashed',
      signatureUrl: ''
    },
    {
      id: 'sig-2',
      name: 'गोकर्ण थापा (Gokarna Thapa)',
      title: 'क्याम्पस प्रमुख / निर्देशक (Director)',
      lineStyle: 'solid',
      signatureUrl: ''
    }
  ],

  // 9. Pre-printed Calibration & Text-Only Print Mode
  preprintedTextOnly: false,
  offsetY: 0,
  offsetX: 0,
  fontScale: 100,

  // 10. Canva-Style Independent Movable Layers
  elementStyles: {
    leftLogo: { x: 0, y: 0 },
    rightLogo: { x: 0, y: 0 },
    headerTitle: { x: 0, y: 0, fontSize: 22, fontWeight: '900', fontStyle: 'normal', color: '', fontFamily: 'Times New Roman', align: 'center' },
    headerSub: { x: 0, y: 0, fontSize: 11.5, fontWeight: '600', fontStyle: 'normal', color: '#475569', align: 'center' },
    headerAddress: { x: 0, y: 0, fontSize: 10.5, fontWeight: 'normal', fontStyle: 'normal', color: '#64748B', align: 'center' },
    title: { x: 0, y: 0, fontSize: 20, fontWeight: '900', fontStyle: 'normal', color: '', fontFamily: 'Times New Roman', align: 'center' },
    student: { x: 0, y: 0, fontSize: 28, fontWeight: '900', fontStyle: 'normal', color: '', fontFamily: 'Times New Roman', align: 'center' },
    photo: { x: 0, y: 0, width: 88, height: 108, borderRadius: 4, borderColor: '', preset: 'right' },
    body: { x: 0, y: 0, fontSize: 13.5, lineHeight: 1.5, align: 'justify', color: '', fontFamily: 'Times New Roman' },
    seal: { x: 0, y: 0 },
    signatories: { x: 0, y: 0 },
    qrCode: { x: 0, y: 0, qrSize: 54 }
  }
};

// 10 Background Presets Definitions
const BACKGROUND_PRESETS = [
  { id: 'clean-white', label: 'सादा सेतो (Pure White)' },
  { id: 'ivory-parchment', label: 'क्लासिक आइभोरी (Ivory Parchment)' },
  { id: 'guilloche-security', label: 'सेक्युरिटी वेभ (Guilloche Wave)' },
  { id: 'royal-navy-gold', label: 'शाही नेभी-गोल्डेन (Navy & Gold Glow)' },
  { id: 'modern-geometric', label: 'आधुनिक ज्यामितीय (Modern Mesh)' },
  { id: 'damask-floral', label: 'दमास्क फ्लोरल (Damask Floral)' },
  { id: 'emerald-aristocrat', label: 'मरकत हरियो (Emerald Aristocrat)' },
  { id: 'maroon-sovereign', label: 'मरुन सार्वभौम (Maroon Sovereign)' },
  { id: 'technical-grid', label: 'टेक्निकल ग्रिड (Technical Blueprint)' },
  { id: 'marble-veins', label: 'फाइन मार्बल (Italian Marble)' }
];

// 7 Border Styles Definitions
const BORDER_STYLES = [
  { id: 'royal-double', label: 'शाही डबल रेखा (Royal Double Gold)' },
  { id: 'vintage-filigree', label: 'भिन्टेज ओर्नेट (Vintage Filigree)' },
  { id: 'modern-executive', label: 'आधुनिक स्लीक (Modern Executive)' },
  { id: 'greek-key', label: 'ग्रीक मियान्डर (Greek Key Classic)' },
  { id: 'security-guilloche', label: 'सेक्युरिटी घेरा (Security Frame)' },
  { id: 'art-deco', label: 'आर्ट डेको (Art Deco Lines)' },
  { id: 'none', label: 'बोर्डर नराख्ने (None - Preprinted)' }
];

// Corner Ornaments Definitions
const CORNER_STYLES = [
  { id: 'victorian-flourish', label: 'भिक्टोरियन शाही फूलबुट्टा' },
  { id: 'acanthus-leaf', label: 'रोयल अकान्थस पात' },
  { id: 'art-deco-bracket', label: 'आर्ट डेको ३-तले कुना' },
  { id: 'celtic-knot', label: 'सेल्टिक सुनौलो नट' },
  { id: 'clean-l-bracket', label: 'लक्जरी एल-ब्र्याकेट' },
  { id: 'none', label: 'कुना नराख्ने (None)' }
];

// 5 Curated Luxury Palettes
const LUXURY_PALETTES = [
  { name: 'Navy & Gold (आधिकारिक)', primary: '#0B2545', accent: '#C59B27', corner: '#C59B27' },
  { name: 'Burgundy & Champagne', primary: '#6B1D2F', accent: '#D4AF37', corner: '#D4AF37' },
  { name: 'Emerald & Brass (CTEVT)', primary: '#0D472D', accent: '#C59B27', corner: '#C59B27' },
  { name: 'Charcoal & Silver', primary: '#1F2937', accent: '#94A3B8', corner: '#94A3B8' },
  { name: 'Midnight & 24K Gold', primary: '#111827', accent: '#F59E0B', corner: '#F59E0B' }
];

// Available Fonts List
const FONT_OPTIONS = [
  { id: 'Times New Roman', label: 'Times New Roman (औपचारिक)' },
  { id: 'Cinzel', label: 'Cinzel (रोयल सेरिफ)' },
  { id: 'Playfair Display', label: 'Playfair Display (लक्जरी)' },
  { id: 'Noto Sans Devanagari', label: 'Noto Sans (नेपाली स्पष्ट)' },
  { id: 'Georgia', label: 'Georgia (शास्त्रीय)' },
  { id: 'Inter', label: 'Inter (आधुनिक Sans)' }
];

// Human Labels for Canvas Elements
const ELEMENT_LABELS = {
  leftLogo: 'बायाँ लोगो (Left Logo)',
  rightLogo: 'दायाँ ब्याज / लोगो (Right Badge)',
  headerTitle: 'मुख्य संस्थागत नाम (Institute Title)',
  headerSub: 'सम्बन्धन / उप-शीर्षक (Accreditation)',
  headerAddress: 'दर्ता तथा ठेगाना (Regd & Address)',
  title: 'प्रमाणपत्र मुख्य शीर्षक (Certificate Title)',
  student: 'विद्यार्थी नाम तथा कोर्स (Trainee Details)',
  photo: 'विद्यार्थी फोटो फ्रेम (Photo Frame)',
  body: 'प्रमाणीकरण व्यहोरा (Body Text)',
  seal: 'आधिकारिक छाप (Official Stamp / Space)',
  signatories: 'हस्ताक्षरकर्ताहरू (Signatures Group)',
  qrCode: 'प्रमाणीकरण क्युआर कोड (Verification QR)'
};

// Corner Ornament SVG Renderer
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

export default function CertificateStudioManager({ onSaveSuccess }) {
  const [db, setDb] = useState(loadDB());
  const [design, setDesign] = useState(() => {
    const loaded = db.settings?.certificateDesign || {};
    return {
      ...DEFAULT_CERTIFICATE_DESIGN,
      ...loaded,
      signatories: loaded.signatories || DEFAULT_CERTIFICATE_DESIGN.signatories,
      elementStyles: {
        ...DEFAULT_CERTIFICATE_DESIGN.elementStyles,
        ...(loaded.elementStyles || {})
      }
    };
  });

  const [savedAlert, setSavedAlert] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.88);

  // Top Ribbon Active Category Tab: 0=Header, 1=Background, 2=Borders, 3=Stamp/Signatures, 4=Calibration
  const [activeRibbonTab, setActiveRibbonTab] = useState(0);
  const [ribbonExpanded, setRibbonExpanded] = useState(true);

  // Canva-Style Selected Element & Dragging State
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initElX: 0, initElY: 0, elKey: null });

  const isPortrait = design.orientation === 'portrait';

  const handleUpdate = (field, value) => {
    setDesign((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleElementStyleUpdate = (elKey, prop, val) => {
    setDesign((prev) => ({
      ...prev,
      elementStyles: {
        ...(prev.elementStyles || {}),
        [elKey]: {
          ...(prev.elementStyles?.[elKey] || {}),
          [prop]: val
        }
      }
    }));
  };

  const handleNudgeElement = (elKey, dx, dy) => {
    const curX = design.elementStyles?.[elKey]?.x || 0;
    const curY = design.elementStyles?.[elKey]?.y || 0;
    handleElementStyleUpdate(elKey, 'x', curX + dx);
    handleElementStyleUpdate(elKey, 'y', curY + dy);
  };

  const handleResetElement = (elKey) => {
    const def = DEFAULT_CERTIFICATE_DESIGN.elementStyles[elKey] || { x: 0, y: 0 };
    setDesign((prev) => ({
      ...prev,
      elementStyles: {
        ...(prev.elementStyles || {}),
        [elKey]: { ...def }
      }
    }));
  };

  // Signatories Management
  const handleAddSignatory = () => {
    const newId = `sig-${Date.now()}`;
    const newSig = {
      id: newId,
      name: 'नयाँ हस्ताक्षरकर्ता (Signatory Name)',
      title: 'पद (Designation)',
      lineStyle: 'solid',
      signatureUrl: ''
    };
    handleUpdate('signatories', [...(design.signatories || []), newSig]);
  };

  const handleUpdateSignatory = (id, prop, val) => {
    const nextList = (design.signatories || []).map((s) => (s.id === id ? { ...s, [prop]: val } : s));
    handleUpdate('signatories', nextList);
  };

  const handleDeleteSignatory = (id) => {
    if ((design.signatories || []).length <= 1) {
      alert('कम्तीमा १ जना हस्ताक्षरकर्ता अनिवार्य हुन्छ।');
      return;
    }
    const nextList = (design.signatories || []).filter((s) => s.id !== id);
    handleUpdate('signatories', nextList);
  };

  // Mouse Drag Handlers
  const handleMouseDownOnElement = (e, elKey) => {
    e.stopPropagation();
    setSelectedElement(elKey);
    setIsDragging(true);

    const curX = design.elementStyles?.[elKey]?.x || 0;
    const curY = design.elementStyles?.[elKey]?.y || 0;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initElX: curX,
      initElY: curY,
      elKey
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !dragRef.current.elKey) return;
      const { startX, startY, initElX, initElY, elKey } = dragRef.current;
      const dx = (e.clientX - startX) / previewScale;
      const dy = (e.clientY - startY) / previewScale;

      handleElementStyleUpdate(elKey, 'x', Math.round(initElX + dx));
      handleElementStyleUpdate(elKey, 'y', Math.round(initElY + dy));
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    const handleKeyDown = (e) => {
      if (!selectedElement) return;
      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNudgeElement(selectedElement, -step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNudgeElement(selectedElement, step, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNudgeElement(selectedElement, 0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNudgeElement(selectedElement, 0, step);
      } else if (e.key === 'Escape') {
        setSelectedElement(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging, previewScale, selectedElement, design.elementStyles]);

  const handleApplyPalette = (palette) => {
    setDesign((prev) => ({
      ...prev,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      cornerColor: palette.corner
    }));
  };

  const handleImageUploadGeneric = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('फाइल साइज ३MB भन्दा सानो हुनुपर्छ।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdate(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDesign = () => {
    const nextDb = {
      ...db,
      settings: {
        ...(db.settings || {}),
        certificateDesign: design
      }
    };
    saveDB(nextDb);
    setDb(nextDb);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3500);

    if (onSaveSuccess) onSaveSuccess(design);
  };

  const handleResetDefaults = () => {
    if (window.confirm('के तपाईं प्रमाणपत्रको सम्पूर्ण डिजाइन सुरुवाती डिफल्टमा फर्काउन चाहनुहुन्छ?')) {
      setDesign(DEFAULT_CERTIFICATE_DESIGN);
      const nextDb = {
        ...db,
        settings: {
          ...(db.settings || {}),
          certificateDesign: DEFAULT_CERTIFICATE_DESIGN
        }
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const handleTestPrint = () => {
    window.print();
  };

  // 10 Background CSS Styles Generator
  const getBackgroundStyle = () => {
    if (design.preprintedTextOnly) {
      return { backgroundColor: 'transparent' };
    }

    const { backgroundType, customBackgroundUrl, primaryColor, accentColor } = design;

    if (backgroundType === 'custom' && customBackgroundUrl) {
      return {
        backgroundImage: `url(${customBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
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
    if (backgroundType === 'damask-floral') {
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

  // 7 Border Styles Generator
  const getBorderStyle = () => {
    if (design.preprintedTextOnly || design.borderStyle === 'none') {
      return {
        border: 'none',
        outline: 'none',
        boxShadow: 'none'
      };
    }

    const { borderStyle, borderWidth, primaryColor, accentColor } = design;

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
    if (borderStyle === 'modern-executive') {
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
    return {
      border: 'none'
    };
  };

  const activeStyle = selectedElement ? design.elementStyles?.[selectedElement] || {} : null;

  return (
    <Box onClick={() => setSelectedElement(null)} sx={{ pb: 6 }}>
      {/* ============================================================== */}
      {/* 1. TOP HEADER & MAIN WORKSPACE TOOLBAR                         */}
      {/* ============================================================== */}
      <Paper
        elevation={1}
        sx={{
          p: 1.8,
          mb: 2,
          borderRadius: 2.5,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* Logo & Module Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WorkspacePremiumIcon sx={{ color: '#C59B27', fontSize: 38 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2E5A', lineHeight: 1.2 }}>
                Certificate Studio & Template Designer (प्रमाणपत्र स्टुडियो)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                पूर्ण चौडाइको क्यानभास: माथिबाट कन्ट्रोल छान्नुहोस् र क्यानभासमा सीधै माउसले जहाँ पनि तान्नुहोस् (Drag & Move)।
              </Typography>
            </Box>
          </Box>

          {/* Center: True Aspect Ratio Switcher */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              value={design.orientation}
              exclusive
              onChange={(e, next) => next && handleUpdate('orientation', next)}
              size="small"
              sx={{ bgcolor: '#F8FAFC', border: '1.5px solid #0F2E5A' }}
            >
              <ToggleButton value="landscape" sx={{ fontWeight: 900, px: 2, gap: 0.8, color: '#0F2E5A' }}>
                <CropLandscapeIcon fontSize="small" />
                🖥️ A4 Landscape (तेर्सो)
              </ToggleButton>
              <ToggleButton value="portrait" sx={{ fontWeight: 900, px: 2, gap: 0.8, color: '#0F2E5A' }}>
                <CropPortraitIcon fontSize="small" />
                📄 A4 Portrait (ठाडो)
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={handleResetDefaults}
              sx={{ fontWeight: 700 }}
            >
              डिफल्ट
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handleTestPrint}
              sx={{ fontWeight: 800, borderColor: '#0B2545', color: '#0B2545' }}
            >
              परीक्षण प्रिन्ट
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSaveDesign}
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                fontWeight: 900,
                px: 2.5,
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
              }}
            >
              डिजाइन सुरक्षित गर्नुहोस्
            </Button>
          </Stack>
        </Box>

        {savedAlert && (
          <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2, fontWeight: 700 }}>
            ✓ प्रमाणपत्रको डिजाइन सफलतापूर्वक सुरक्षित गरियो! अब जारी हुने सबै प्रमाणपत्र यसै सरेको स्थिति र फन्टमा प्रिन्ट हुनेछन्।
          </Alert>
        )}

        {/* ============================================================== */}
        {/* 2. TOP RIBBON CATEGORY TABS (Word / Canva Style)               */}
        {/* ============================================================== */}
        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {[
              { id: 0, label: '१. संस्थागत लेटरहेड र लोगो', icon: <BrandingWatermarkIcon fontSize="small" /> },
              { id: 1, label: '२. पृष्ठभूमि (१० प्रिसेट)', icon: <WallpaperIcon fontSize="small" /> },
              { id: 2, label: '३. बोर्डर, कुना र कलर पिकर', icon: <BorderStyleIcon fontSize="small" /> },
              { id: 3, label: '४. आधिकारिक छाप र हस्ताक्षरकर्ता', icon: <EditNoteIcon fontSize="small" /> },
              { id: 4, label: '५. प्रि-प्रिन्टेड क्यालिब्रेसन', icon: <TuneIcon fontSize="small" /> }
            ].map((tab) => (
              <Button
                key={tab.id}
                size="small"
                variant={activeRibbonTab === tab.id ? 'contained' : 'outlined'}
                onClick={() => {
                  setActiveRibbonTab(tab.id);
                  setRibbonExpanded(true);
                }}
                startIcon={tab.icon}
                sx={{
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  py: 0.6,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: activeRibbonTab === tab.id ? '#0F2E5A' : '#FFFFFF',
                  borderColor: '#CBD5E1',
                  color: activeRibbonTab === tab.id ? '#FFFFFF' : '#334155',
                  boxShadow: activeRibbonTab === tab.id ? '0 2px 8px rgba(15, 46, 90, 0.25)' : 'none'
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>

          {/* Collapse/Expand Ribbon Button */}
          <Button
            size="small"
            onClick={() => setRibbonExpanded(!ribbonExpanded)}
            endIcon={ribbonExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#64748B' }}
          >
            {ribbonExpanded ? 'प्यानल बन्द गर्नुहोस्' : 'कन्ट्रोल खोल्नुहोस्'}
          </Button>
        </Box>

        {/* ============================================================== */}
        {/* 3. EXPANDABLE HORIZONTAL TOP RIBBON CONTENT PANELS             */}
        {/* ============================================================== */}
        <Collapse in={ribbonExpanded}>
          <Box sx={{ mt: 1.8, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }} onClick={(e) => e.stopPropagation()}>
            {/* TAB 0: LETTERHEAD & LOGOS */}
            {activeRibbonTab === 0 && (
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={5}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                    मुख्य संस्थागत नाम (Single Versatile Heading - English/Nepali/Both):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={design.instituteName}
                    onChange={(e) => handleUpdate('instituteName', e.target.value)}
                    placeholder="ग्लोबल एरा प्राविधिक स्कुल / GLOBAL ERA TECHNICAL SCHOOL"
                    sx={{ mb: 1, bgcolor: '#FFFFFF' }}
                  />

                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                    सम्बन्धन / उप-शीर्षक (Accreditation / Sub-title):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={design.accreditationText}
                    onChange={(e) => handleUpdate('accreditationText', e.target.value)}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                    दर्ता, सम्बन्धन कोड र ठेगाना (Regd & Location):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={design.affiliationCodeText}
                    onChange={(e) => handleUpdate('affiliationCodeText', e.target.value)}
                    sx={{ mb: 1, bgcolor: '#FFFFFF' }}
                  />

                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={<Switch checked={design.showLeftLogo} onChange={(e) => handleUpdate('showLeftLogo', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>बायाँ लोगो देखाउने</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={design.showRightLogo} onChange={(e) => handleUpdate('showRightLogo', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>दायाँ ब्याज देखाउने</Typography>}
                    />
                  </Stack>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Box sx={{ p: 1.2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                      कस्टम लोगो अपलोड (Upload Transparent PNG):
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                        बायाँ लोगो
                        <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('leftLogoUrl', e)} />
                      </Button>
                      <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                        दायाँ लोगो
                        <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('rightLogoUrl', e)} />
                      </Button>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#0369A1', display: 'block', mt: 0.8, fontSize: '0.66rem' }}>
                      💡 टिप: क्यानभासमा प्रत्येक लाइन र लोगोमा क्लिक गरेर माउसले जहाँ पनि सार्न सकिन्छ!
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* TAB 1: BACKGROUND PRESETS */}
            {activeRibbonTab === 1 && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 1 }}>
                  १० आधुनिक तथा विश्वविद्यालय स्तरका पृष्ठभूमि प्रिसेटहरू:
                </Typography>
                <Grid container spacing={1} sx={{ mb: 1.5 }}>
                  {BACKGROUND_PRESETS.map((bg) => (
                    <Grid item xs={6} sm={4} md={2.4} key={bg.id}>
                      <Button
                        fullWidth
                        size="small"
                        variant={design.backgroundType === bg.id ? 'contained' : 'outlined'}
                        onClick={() => handleUpdate('backgroundType', bg.id)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.67rem',
                          py: 0.7,
                          bgcolor: design.backgroundType === bg.id ? '#0F2E5A' : '#FFFFFF',
                          borderColor: '#CBD5E1',
                          color: design.backgroundType === bg.id ? '#FFFFFF' : '#334155'
                        }}
                      >
                        {bg.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      आफ्नै फोटो अपलोड
                      <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('customBackgroundUrl', e)} />
                    </Button>
                    {design.customBackgroundUrl && (
                      <Button size="small" color="error" onClick={() => handleUpdate('customBackgroundUrl', '')}>हटाउनुहोस्</Button>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, maxWidth: 350 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>वाटरमार्क गाढापन ({design.watermarkOpacity}%):</Typography>
                    <Slider
                      value={design.watermarkOpacity}
                      min={0}
                      max={25}
                      step={1}
                      onChange={(e, val) => handleUpdate('watermarkOpacity', val)}
                      sx={{ color: '#0F2E5A' }}
                    />
                  </Box>
                </Stack>
              </Box>
            )}

            {/* TAB 2: BORDERS, CORNERS & PALETTES */}
            {activeRibbonTab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                    क) ७ बोर्डर ढाँचाहरू (Border Styles):
                  </Typography>
                  <Grid container spacing={0.8}>
                    {BORDER_STYLES.map((b) => (
                      <Grid item xs={6} key={b.id}>
                        <Button
                          fullWidth
                          size="small"
                          variant={design.borderStyle === b.id ? 'contained' : 'outlined'}
                          onClick={() => handleUpdate('borderStyle', b.id)}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            py: 0.5,
                            bgcolor: design.borderStyle === b.id ? '#C59B27' : '#FFFFFF',
                            borderColor: '#CBD5E1',
                            color: design.borderStyle === b.id ? '#0F172A' : '#334155'
                          }}
                        >
                          {b.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#C59B27', display: 'block', mb: 0.8 }}>
                    ख) कुनाका बुट्टाहरू (Corner Ornaments):
                  </Typography>
                  <Grid container spacing={0.8}>
                    {CORNER_STYLES.map((c) => (
                      <Grid item xs={6} key={c.id}>
                        <Button
                          fullWidth
                          size="small"
                          variant={design.cornerStyle === c.id ? 'contained' : 'outlined'}
                          onClick={() => handleUpdate('cornerStyle', c.id)}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            py: 0.5,
                            bgcolor: design.cornerStyle === c.id ? '#0F2E5A' : '#FFFFFF',
                            borderColor: '#CBD5E1',
                            color: design.cornerStyle === c.id ? '#FFFFFF' : '#334155'
                          }}
                        >
                          {c.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                    ग) १-क्लिक लक्जरी प्यालेट तथा कलर पिकर:
                  </Typography>
                  <Stack direction="row" spacing={0.8} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                    {LUXURY_PALETTES.map((pal) => (
                      <Chip
                        key={pal.name}
                        label={pal.name}
                        size="small"
                        onClick={() => handleApplyPalette(pal)}
                        sx={{ fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', border: '1px solid #CBD5E1' }}
                      />
                    ))}
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Primary:</Typography>
                      <input
                        type="color"
                        value={design.primaryColor}
                        onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                        style={{ width: 28, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#C59B27' }}>Accent:</Typography>
                      <input
                        type="color"
                        value={design.accentColor}
                        onChange={(e) => handleUpdate('accentColor', e.target.value)}
                        style={{ width: 28, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      />
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            )}

            {/* TAB 3: OFFICIAL SEAL (4 MODES) & DYNAMIC SIGNATORIES */}
            {activeRibbonTab === 3 && (
              <Grid container spacing={2}>
                {/* 4-in-1 Official Seal Modes */}
                <Grid item xs={12} md={5}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                    आधिकारिक छाप मोड (Official Stamp - ४ वटा विकल्पहरू):
                  </Typography>
                  <ToggleButtonGroup
                    value={design.sealMode}
                    exclusive
                    onChange={(e, next) => next && handleUpdate('sealMode', next)}
                    size="small"
                    fullWidth
                    sx={{ mb: 1.5, bgcolor: '#FFFFFF' }}
                  >
                    <ToggleButton value="blank" sx={{ fontSize: '0.68rem', fontWeight: 800 }}>
                      खाली ठाउँ (Wet Stamp)
                    </ToggleButton>
                    <ToggleButton value="scanned" sx={{ fontSize: '0.68rem', fontWeight: 800 }}>
                      स्क्यान छाप (Upload PNG)
                    </ToggleButton>
                    <ToggleButton value="digital" sx={{ fontSize: '0.68rem', fontWeight: 800 }}>
                      डिजिटल सिल (Graphic)
                    </ToggleButton>
                    <ToggleButton value="none" sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#DC2626' }}>
                      छाप हटाउने
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {design.sealMode === 'scanned' && (
                    <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px dashed #0284C7' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1', display: 'block', mb: 0.5 }}>
                        संस्थाको वास्तविक रबर छापको स्क्यान फोटो:
                      </Typography>
                      <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.7rem' }}>
                        छापको फोटो छान्नुहोस्
                        <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('customSealUrl', e)} />
                      </Button>
                    </Box>
                  )}

                  {design.sealMode === 'blank' && (
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block' }}>
                      ✓ प्रिन्ट गरिसकेपछि हातले रबर स्ट्याम्प लगाउनका लागि बीचमा सफा खाली ठाउँ सुरक्षित गरिएको छ।
                    </Typography>
                  )}
                </Grid>

                {/* Dynamic Signatories List (+ Add Signatory) */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      हस्ताक्षरकर्ताहरू ({design.signatories?.length || 0} जना):
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={handleAddSignatory}
                      sx={{ fontSize: '0.68rem', fontWeight: 800, bgcolor: '#059669' }}
                    >
                      + नयाँ हस्ताक्षरकर्ता थप्नुहोस्
                    </Button>
                  </Box>

                  <Stack spacing={1} sx={{ maxHeight: 150, overflowY: 'auto', pr: 0.5 }}>
                    {(design.signatories || []).map((sig, idx) => (
                      <Paper key={sig.id} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#FFFFFF' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748B' }}>#{idx + 1}</Typography>
                        <TextField
                          size="small"
                          label="नाम (Name)"
                          value={sig.name}
                          onChange={(e) => handleUpdateSignatory(sig.id, 'name', e.target.value)}
                          sx={{ flexGrow: 1, '& input': { py: 0.5, fontSize: '0.74rem' } }}
                        />
                        <TextField
                          size="small"
                          label="पद (Title)"
                          value={sig.title}
                          onChange={(e) => handleUpdateSignatory(sig.id, 'title', e.target.value)}
                          sx={{ flexGrow: 1, '& input': { py: 0.5, fontSize: '0.74rem' } }}
                        />
                        <IconButton size="small" color="error" onClick={() => handleDeleteSignatory(sig.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            )}

            {/* TAB 4: PRE-PRINTED CALIBRATION */}
            {activeRibbonTab === 4 && (
              <Stack direction="row" spacing={4} alignItems="center">
                <Box sx={{ p: 1.2, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid #FCD34D' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={design.preprintedTextOnly}
                        onChange={(e) => handleUpdate('preprintedTextOnly', e.target.checked)}
                        color="warning"
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E' }}>
                        केवल अक्षरहरू मात्र प्रिन्ट गर्नुहोस् (Text-Only Mode: बजारको बोर्डर भएको कागजमा प्रिन्ट गर्न)
                      </Typography>
                    }
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, maxWidth: 350 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    माथि/तल सर्ने (Y-Offset: {design.offsetY} mm):
                  </Typography>
                  <Slider
                    value={design.offsetY}
                    min={-20}
                    max={20}
                    step={1}
                    onChange={(e, val) => handleUpdate('offsetY', val)}
                    sx={{ color: '#D97706' }}
                  />
                </Box>
              </Stack>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* ============================================================== */}
      {/* 4. CANVA-STYLE FLOATING ELEMENT INSPECTOR BAR                  */}
      {/* ============================================================== */}
      <Paper
        elevation={2}
        sx={{
          p: 1.2,
          mb: 1.5,
          border: '1.5px solid #0284c7',
          borderRadius: 2.5,
          bgcolor: selectedElement ? '#F0F9FF' : '#FFFFFF',
          boxShadow: selectedElement ? '0 4px 16px rgba(2, 132, 199, 0.15)' : '0 2px 6px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedElement ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<PanToolIcon fontSize="small" />}
                  label={ELEMENT_LABELS[selectedElement] || selectedElement}
                  size="small"
                  sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 900, fontSize: '0.72rem' }}
                />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369A1' }}>
                  X: {activeStyle?.x > 0 ? `+${activeStyle?.x}` : activeStyle?.x || 0}px, Y: {activeStyle?.y > 0 ? `+${activeStyle?.y}` : activeStyle?.y || 0}px
                </Typography>
              </Box>

              {/* Precision Nudge Arrow Buttons */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="बायाँ सार्नुहोस् (-1px, Shift थिचेर -5px)">
                  <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, -1, 0)} sx={{ bgcolor: '#E0F2FE' }}>
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="माथि सार्नुहोस् (-1px)">
                  <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 0, -1)} sx={{ bgcolor: '#E0F2FE' }}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="तल सार्नुहोस् (+1px)">
                  <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 0, 1)} sx={{ bgcolor: '#E0F2FE' }}>
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="दायाँ सार्नुहोस् (+1px)">
                  <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 1, 0)} sx={{ bgcolor: '#E0F2FE' }}>
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Button
                  size="small"
                  color="inherit"
                  onClick={() => handleResetElement(selectedElement)}
                  sx={{ fontSize: '0.68rem', fontWeight: 700, ml: 1 }}
                >
                  सुरुवाती स्थिति (Reset)
                </Button>

                <IconButton size="small" onClick={() => setSelectedElement(null)} sx={{ ml: 0.5 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            {/* Rich Typography Controls for Selected Text / Photo Elements */}
            <Divider sx={{ my: 0.3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {/* If it's a text element */}
              {['headerTitle', 'headerSub', 'headerAddress', 'title', 'student', 'body'].includes(selectedElement) && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#FFFFFF', p: '2px 6px', borderRadius: 1.5, border: '1px solid #CBD5E1' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mr: 0.5 }}>🗚 साइज:</Typography>
                    <Button size="small" sx={{ minWidth: 24, p: 0 }} onClick={() => handleElementStyleUpdate(selectedElement, 'fontSize', Math.max(8, (activeStyle?.fontSize || 20) - 1))}>-</Button>
                    <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{activeStyle?.fontSize || 20}px</Typography>
                    <Button size="small" sx={{ minWidth: 24, p: 0 }} onClick={() => handleElementStyleUpdate(selectedElement, 'fontSize', Math.min(50, (activeStyle?.fontSize || 20) + 1))}>+</Button>
                  </Box>

                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => handleElementStyleUpdate(selectedElement, 'fontWeight', activeStyle?.fontWeight === 'bold' || activeStyle?.fontWeight === '900' ? 'normal' : '900')}
                      sx={{
                        bgcolor: activeStyle?.fontWeight === 'bold' || activeStyle?.fontWeight === '900' ? '#0284C7' : '#FFFFFF',
                        color: activeStyle?.fontWeight === 'bold' || activeStyle?.fontWeight === '900' ? '#FFFFFF' : '#334155',
                        border: '1px solid #CBD5E1'
                      }}
                    >
                      <FormatBoldIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => handleElementStyleUpdate(selectedElement, 'fontStyle', activeStyle?.fontStyle === 'italic' ? 'normal' : 'italic')}
                      sx={{
                        bgcolor: activeStyle?.fontStyle === 'italic' ? '#0284C7' : '#FFFFFF',
                        color: activeStyle?.fontStyle === 'italic' ? '#FFFFFF' : '#334155',
                        border: '1px solid #CBD5E1'
                      }}
                    >
                      <FormatItalicIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Stack direction="row" spacing={0.5}>
                    {['left', 'center', 'right', 'justify'].map((align) => (
                      <IconButton
                        key={align}
                        size="small"
                        onClick={() => handleElementStyleUpdate(selectedElement, 'align', align)}
                        sx={{
                          bgcolor: activeStyle?.align === align ? '#0284C7' : '#FFFFFF',
                          color: activeStyle?.align === align ? '#FFFFFF' : '#334155',
                          border: '1px solid #CBD5E1'
                        }}
                      >
                        {align === 'left' && <FormatAlignLeftIcon fontSize="small" />}
                        {align === 'center' && <FormatAlignCenterIcon fontSize="small" />}
                        {align === 'right' && <FormatAlignRightIcon fontSize="small" />}
                        {align === 'justify' && <FormatAlignJustifyIcon fontSize="small" />}
                      </IconButton>
                    ))}
                  </Stack>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569' }}>अक्षर रङ:</Typography>
                    <input
                      type="color"
                      value={activeStyle?.color || design.primaryColor}
                      onChange={(e) => handleElementStyleUpdate(selectedElement, 'color', e.target.value)}
                      style={{ width: 30, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                    />
                  </Box>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={activeStyle?.fontFamily || 'Times New Roman'}
                      onChange={(e) => handleElementStyleUpdate(selectedElement, 'fontFamily', e.target.value)}
                      sx={{ height: 30, fontSize: '0.74rem' }}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <MenuItem key={f.id} value={f.id} sx={{ fontSize: '0.75rem' }}>{f.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              {/* If it's Photo Frame */}
              {selectedElement === 'photo' && (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>फोटो स्थिति:</Typography>
                  <ToggleButtonGroup
                    value={activeStyle?.preset || 'right'}
                    exclusive
                    onChange={(e, next) => next && handleElementStyleUpdate('photo', 'preset', next)}
                    size="small"
                  >
                    <ToggleButton value="right" sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>दायाँ कुना (Right)</ToggleButton>
                    <ToggleButton value="center" sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>बीचमा (Center)</ToggleButton>
                    <ToggleButton value="left" sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>बायाँ (Left)</ToggleButton>
                  </ToggleButtonGroup>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>साइज:</Typography>
                    <Button size="small" onClick={() => handleElementStyleUpdate('photo', 'width', Math.max(60, (activeStyle?.width || 88) - 4))}>-</Button>
                    <Typography variant="caption" sx={{ fontWeight: 900 }}>{activeStyle?.width || 88}px</Typography>
                    <Button size="small" onClick={() => handleElementStyleUpdate('photo', 'width', Math.min(140, (activeStyle?.width || 88) + 4))}>+</Button>
                  </Box>
                </>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DragIndicatorIcon sx={{ color: '#0284C7' }} />
              <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 800 }}>
                💡 Canva Move & Edit: क्यानभास भित्रको कुनै पनि लाइन वा लोगोमा क्लिक गरी माउसले सीधै जहाँ पनि तान्नुहोस् (Click & Drag)!
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>जुम:</Typography>
              <Button size="small" onClick={() => setPreviewScale((p) => Math.max(0.55, p - 0.05))}>-</Button>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>{Math.round(previewScale * 100)}%</Typography>
              <Button size="small" onClick={() => setPreviewScale((p) => Math.min(1.05, p + 0.05))}>+</Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* ============================================================== */}
      {/* 5. FULL-WIDTH MAJESTIC CERTIFICATE CANVAS WORKSPACE            */}
      {/* ============================================================== */}
      <Box
        sx={{
          width: '100%',
          overflow: 'auto',
          p: { xs: 1.5, sm: 3 },
          bgcolor: '#334155',
          borderRadius: 3,
          display: 'flex',
          justifyContent: 'center',
          boxShadow: 'inset 0 2px 14px rgba(0,0,0,0.3)',
          minHeight: '800px',
          userSelect: isDragging ? 'none' : 'auto'
        }}
      >
        {/* The Live Certificate Canvas with Proportional True A4 Aspect Ratio */}
        <Box
          id="liveCertificateStudioCanvas"
          sx={{
            width: isPortrait ? '760px' : '1040px',
            minHeight: isPortrait ? '1060px' : '740px',
            p: `${design.borderMargin}mm`,
            boxSizing: 'border-box',
            fontFamily: "'Times New Roman', serif",
            color: '#0F172A',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transform: `scale(${previewScale}) translate(${design.offsetX}px, ${design.offsetY}px)`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'all 0.15s ease',
            boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
            ...getBorderStyle(),
            ...getBackgroundStyle()
          }}
        >
          {/* 4 Corner Ornaments */}
          {!design.preprintedTextOnly && design.cornerStyle !== 'none' && (
            <>
              <CornerSvg style={design.cornerStyle} size={design.cornerSize} color={design.cornerColor} position="top-left" />
              <CornerSvg style={design.cornerStyle} size={design.cornerSize} color={design.cornerColor} position="top-right" />
              <CornerSvg style={design.cornerStyle} size={design.cornerSize} color={design.cornerColor} position="bottom-left" />
              <CornerSvg style={design.cornerStyle} size={design.cornerSize} color={design.cornerColor} position="bottom-right" />
            </>
          )}

          {/* Watermark Logo */}
          {!design.preprintedTextOnly && design.watermarkOpacity > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: design.watermarkOpacity / 100,
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              <SchoolIcon sx={{ fontSize: (isPortrait ? 380 : 340) * (design.watermarkScale / 100), color: design.primaryColor }} />
            </Box>
          )}

          {/* ============================================================== */}
          {/* 1. INSTITUTIONAL LETTERHEAD: INDIVIDUAL MOVABLE LAYERS        */}
          {/* ============================================================== */}
          {design.showHeader && (
            <Box sx={{ position: 'relative', zIndex: 3, pb: 1, borderBottom: `1.5px solid ${design.accentColor}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', px: 2 }}>
                {/* Left Logo (Independently Movable) */}
                <Box
                  onClick={(e) => { e.stopPropagation(); setSelectedElement('leftLogo'); }}
                  onMouseDown={(e) => handleMouseDownOnElement(e, 'leftLogo')}
                  sx={{
                    width: `${design.leftLogoWidth || 46}px`,
                    position: 'relative',
                    zIndex: selectedElement === 'leftLogo' ? 10 : 2,
                    transform: `translate(${design.elementStyles?.leftLogo?.x || 0}px, ${design.elementStyles?.leftLogo?.y || 0}px)`,
                    cursor: isDragging && selectedElement === 'leftLogo' ? 'grabbing' : 'grab',
                    outline: selectedElement === 'leftLogo' ? '2px dashed #0284c7' : '1px dashed transparent',
                    outlineOffset: '4px',
                    borderRadius: '4px'
                  }}
                >
                  {design.showLeftLogo && (
                    design.leftLogoUrl ? (
                      <img src={design.leftLogoUrl} alt="Logo" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    ) : (
                      <SchoolIcon sx={{ fontSize: design.leftLogoWidth || 46, color: design.primaryColor }} />
                    )
                  )}
                </Box>

                {/* Center Lines: Main Title, Sub-heading, Address (Each Independently Movable) */}
                <Box sx={{ textAlign: 'center', flexGrow: 1, px: 2 }}>
                  {/* Line 1: Main Institution Title */}
                  <Box
                    onClick={(e) => { e.stopPropagation(); setSelectedElement('headerTitle'); }}
                    onMouseDown={(e) => handleMouseDownOnElement(e, 'headerTitle')}
                    sx={{
                      position: 'relative',
                      zIndex: selectedElement === 'headerTitle' ? 10 : 2,
                      transform: `translate(${design.elementStyles?.headerTitle?.x || 0}px, ${design.elementStyles?.headerTitle?.y || 0}px)`,
                      cursor: isDragging && selectedElement === 'headerTitle' ? 'grabbing' : 'grab',
                      outline: selectedElement === 'headerTitle' ? '2px dashed #0284c7' : '1px dashed transparent',
                      outlineOffset: '2px',
                      borderRadius: '4px'
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: design.elementStyles?.headerTitle?.fontFamily || "'Times New Roman', serif",
                        fontWeight: design.elementStyles?.headerTitle?.fontWeight || 900,
                        fontStyle: design.elementStyles?.headerTitle?.fontStyle || 'normal',
                        letterSpacing: '0.04em',
                        color: design.elementStyles?.headerTitle?.color || design.primaryColor,
                        fontSize: `${design.elementStyles?.headerTitle?.fontSize || (isPortrait ? 21 : 22)}px`,
                        textTransform: 'uppercase'
                      }}
                    >
                      {design.instituteName}
                    </Typography>
                  </Box>

                  {/* Line 2: Accreditation / Sub-heading */}
                  {design.showAccreditation && (
                    <Box
                      onClick={(e) => { e.stopPropagation(); setSelectedElement('headerSub'); }}
                      onMouseDown={(e) => handleMouseDownOnElement(e, 'headerSub')}
                      sx={{
                        position: 'relative',
                        zIndex: selectedElement === 'headerSub' ? 10 : 2,
                        transform: `translate(${design.elementStyles?.headerSub?.x || 0}px, ${design.elementStyles?.headerSub?.y || 0}px)`,
                        cursor: isDragging && selectedElement === 'headerSub' ? 'grabbing' : 'grab',
                        outline: selectedElement === 'headerSub' ? '2px dashed #0284c7' : '1px dashed transparent',
                        outlineOffset: '2px',
                        borderRadius: '4px',
                        mt: 0.3
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: `${design.elementStyles?.headerSub?.fontSize || 11.5}px`,
                          fontWeight: design.elementStyles?.headerSub?.fontWeight || 600,
                          color: design.elementStyles?.headerSub?.color || '#475569'
                        }}
                      >
                        {design.accreditationText}
                      </Typography>
                    </Box>
                  )}

                  {/* Line 3: Registration, Affiliation & Location */}
                  {design.showAffiliation && (
                    <Box
                      onClick={(e) => { e.stopPropagation(); setSelectedElement('headerAddress'); }}
                      onMouseDown={(e) => handleMouseDownOnElement(e, 'headerAddress')}
                      sx={{
                        position: 'relative',
                        zIndex: selectedElement === 'headerAddress' ? 10 : 2,
                        transform: `translate(${design.elementStyles?.headerAddress?.x || 0}px, ${design.elementStyles?.headerAddress?.y || 0}px)`,
                        cursor: isDragging && selectedElement === 'headerAddress' ? 'grabbing' : 'grab',
                        outline: selectedElement === 'headerAddress' ? '2px dashed #0284c7' : '1px dashed transparent',
                        outlineOffset: '2px',
                        borderRadius: '4px',
                        mt: 0.2
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: `${design.elementStyles?.headerAddress?.fontSize || 10.5}px`,
                          color: design.elementStyles?.headerAddress?.color || '#64748B'
                        }}
                      >
                        {design.affiliationCodeText}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Right Logo / CTEVT Badge (Independently Movable) */}
                <Box
                  onClick={(e) => { e.stopPropagation(); setSelectedElement('rightLogo'); }}
                  onMouseDown={(e) => handleMouseDownOnElement(e, 'rightLogo')}
                  sx={{
                    width: `${design.rightLogoWidth || 46}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    zIndex: selectedElement === 'rightLogo' ? 10 : 2,
                    transform: `translate(${design.elementStyles?.rightLogo?.x || 0}px, ${design.elementStyles?.rightLogo?.y || 0}px)`,
                    cursor: isDragging && selectedElement === 'rightLogo' ? 'grabbing' : 'grab',
                    outline: selectedElement === 'rightLogo' ? '2px dashed #0284c7' : '1px dashed transparent',
                    outlineOffset: '4px',
                    borderRadius: '4px'
                  }}
                >
                  {design.showRightLogo && (
                    design.rightLogoUrl ? (
                      <img src={design.rightLogoUrl} alt="Right Badge" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    ) : (
                      <VerifiedIcon sx={{ fontSize: design.rightLogoWidth || 46, color: design.accentColor }} />
                    )
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* ============================================================== */}
          {/* 2. CERTIFICATE TITLE BANNER (MOVABLE)                          */}
          {/* ============================================================== */}
          <Box
            onClick={(e) => { e.stopPropagation(); setSelectedElement('title'); }}
            onMouseDown={(e) => handleMouseDownOnElement(e, 'title')}
            sx={{
              position: 'relative',
              zIndex: selectedElement === 'title' ? 10 : 2,
              textAlign: design.elementStyles?.title?.align || 'center',
              my: isPortrait ? 1.5 : 0.8,
              transform: `translate(${design.elementStyles?.title?.x || 0}px, ${design.elementStyles?.title?.y || 0}px)`,
              cursor: isDragging && selectedElement === 'title' ? 'grabbing' : 'grab',
              outline: selectedElement === 'title' ? '2px dashed #0284c7' : '1px dashed transparent',
              outlineOffset: '4px',
              borderRadius: '4px'
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: design.elementStyles?.title?.fontFamily || "'Times New Roman', serif",
                fontWeight: design.elementStyles?.title?.fontWeight || 900,
                fontStyle: design.elementStyles?.title?.fontStyle || 'normal',
                color: design.elementStyles?.title?.color || design.primaryColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: `${design.elementStyles?.title?.fontSize || (isPortrait ? 19 : 20)}px`,
                mb: 0.2
              }}
            >
              {design.certificateTitleEn}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "'Noto Sans Devanagari', sans-serif",
                fontWeight: 800,
                color: design.accentColor,
                fontSize: '0.98rem',
                letterSpacing: '0.03em'
              }}
            >
              {design.certificateTitleNp}
            </Typography>
          </Box>

          {/* 3. Reference Tracking Bar */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              px: 3,
              py: 0.5,
              bgcolor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              borderBottom: '1px solid #E2E8F0',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#334155'
            }}
          >
            <Box>Certificate No: <b style={{ color: design.primaryColor }}>GE-2081-000101</b></Box>
            <Box>Registration / TGID: <b style={{ color: design.primaryColor }}>TGID-101</b></Box>
            <Box>Issue Date: <b>2026-09-01</b></Box>
          </Box>

          {/* ============================================================== */}
          {/* 4. TRAINEE CENTERPIECE & PHOTO FRAME (MOVABLE)                 */}
          {/* ============================================================== */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: design.elementStyles?.photo?.preset === 'center' ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              my: isPortrait ? 1.5 : 1
            }}
          >
            {/* Photo if placed on LEFT */}
            {design.elementStyles?.photo?.preset === 'left' && (
              <Box
                onClick={(e) => { e.stopPropagation(); setSelectedElement('photo'); }}
                onMouseDown={(e) => handleMouseDownOnElement(e, 'photo')}
                sx={{
                  width: `${design.elementStyles?.photo?.width || 88}px`,
                  height: `${Math.round((design.elementStyles?.photo?.width || 88) * 1.25)}px`,
                  position: 'relative',
                  transform: `translate(${design.elementStyles?.photo?.x || 0}px, ${design.elementStyles?.photo?.y || 0}px)`,
                  cursor: isDragging && selectedElement === 'photo' ? 'grabbing' : 'grab',
                  outline: selectedElement === 'photo' ? '2px dashed #0284c7' : '1px dashed transparent',
                  outlineOffset: '4px',
                  borderRadius: `${design.elementStyles?.photo?.borderRadius || 4}px`
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    border: `2px solid ${design.elementStyles?.photo?.borderColor || design.accentColor}`,
                    borderRadius: `${design.elementStyles?.photo?.borderRadius || 4}px`,
                    p: '2px',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PersonIcon sx={{ fontSize: 36, color: '#94A3B8' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.52rem', color: '#64748B', textAlign: 'center', lineHeight: 1 }}>
                    PP PHOTO<br />(35×45mm)
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Left Competency Badge (if photo not on left) */}
            {design.elementStyles?.photo?.preset !== 'left' && (
              <Box sx={{ width: '92px' }}>
                {design.showCompetencyBadge && (
                  <Box sx={{ border: `1.5px dashed ${design.accentColor}`, borderRadius: 1, p: '4px 8px', textAlign: 'center', bgcolor: '#FFFBF0' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 900, color: design.primaryColor, display: 'block' }}>
                      CTEVT LEVEL 1
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.56rem', color: '#64748B', display: 'block' }}>
                      {design.hoursBadgeText}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Center Trainee Name Highlight (MOVABLE) */}
            <Box
              onClick={(e) => { e.stopPropagation(); setSelectedElement('student'); }}
              onMouseDown={(e) => handleMouseDownOnElement(e, 'student')}
              sx={{
                textAlign: design.elementStyles?.student?.align || 'center',
                flexGrow: 1,
                px: 2,
                position: 'relative',
                zIndex: selectedElement === 'student' ? 10 : 2,
                transform: `translate(${design.elementStyles?.student?.x || 0}px, ${design.elementStyles?.student?.y || 0}px)`,
                cursor: isDragging && selectedElement === 'student' ? 'grabbing' : 'grab',
                outline: selectedElement === 'student' ? '2px dashed #0284c7' : '1px dashed transparent',
                outlineOffset: '4px',
                borderRadius: '4px'
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                यो प्रमाणपत्र प्रदान गरिएको छ / This is proudly awarded to:
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: design.elementStyles?.student?.fontFamily || "'Times New Roman', serif",
                  fontWeight: design.elementStyles?.student?.fontWeight || 900,
                  fontStyle: design.elementStyles?.student?.fontStyle || 'normal',
                  color: design.elementStyles?.student?.color || design.primaryColor,
                  letterSpacing: '0.04em',
                  fontSize: `${design.elementStyles?.student?.fontSize || (isPortrait ? 29 : 28)}px`,
                  mt: 0.3
                }}
              >
                Sunita Sharma
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: "'Noto Sans Devanagari', sans-serif",
                  fontWeight: 800,
                  color: design.accentColor,
                  fontSize: '1.05rem',
                  mt: 0.2
                }}
              >
                (सुनिता शर्मा)
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: '#059669',
                  fontSize: '0.92rem',
                  mt: 0.3,
                  letterSpacing: '0.04em'
                }}
              >
                COURSE: BASIC BEAUTICIAN TRAINING (390 HOURS / 3 MONTHS)
              </Typography>
            </Box>

            {/* Photo if placed on RIGHT (Default) */}
            {design.elementStyles?.photo?.preset !== 'left' && (
              <Box
                onClick={(e) => { e.stopPropagation(); setSelectedElement('photo'); }}
                onMouseDown={(e) => handleMouseDownOnElement(e, 'photo')}
                sx={{
                  width: `${design.elementStyles?.photo?.width || 88}px`,
                  height: `${Math.round((design.elementStyles?.photo?.width || 88) * 1.25)}px`,
                  position: 'relative',
                  transform: `translate(${design.elementStyles?.photo?.x || 0}px, ${design.elementStyles?.photo?.y || 0}px)`,
                  cursor: isDragging && selectedElement === 'photo' ? 'grabbing' : 'grab',
                  outline: selectedElement === 'photo' ? '2px dashed #0284c7' : '1px dashed transparent',
                  outlineOffset: '4px',
                  borderRadius: `${design.elementStyles?.photo?.borderRadius || 4}px`
                }}
              >
                {design.showStudentPhoto && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      border: `2px solid ${design.elementStyles?.photo?.borderColor || design.accentColor}`,
                      borderRadius: `${design.elementStyles?.photo?.borderRadius || 4}px`,
                      p: '2px',
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 36, color: '#94A3B8' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.52rem', color: '#64748B', textAlign: 'center', lineHeight: 1 }}>
                      PP PHOTO<br />(35×45mm)
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* ============================================================== */}
          {/* 5. ENGLISH & NEPALI WORDING PARAGRAPHS (MOVABLE)               */}
          {/* ============================================================== */}
          <Box
            onClick={(e) => { e.stopPropagation(); setSelectedElement('body'); }}
            onMouseDown={(e) => handleMouseDownOnElement(e, 'body')}
            sx={{
              position: 'relative',
              zIndex: selectedElement === 'body' ? 10 : 2,
              px: 3,
              textAlign: design.elementStyles?.body?.align || 'justify',
              my: isPortrait ? 1.5 : 0.5,
              transform: `translate(${design.elementStyles?.body?.x || 0}px, ${design.elementStyles?.body?.y || 0}px)`,
              cursor: isDragging && selectedElement === 'body' ? 'grabbing' : 'grab',
              outline: selectedElement === 'body' ? '2px dashed #0284c7' : '1px dashed transparent',
              outlineOffset: '4px',
              borderRadius: '4px'
            }}
          >
            {(design.bodyLayoutMode === 'bilingual' || design.bodyLayoutMode === 'english-only') && (
              <Typography
                variant="body2"
                sx={{
                  fontFamily: design.elementStyles?.body?.fontFamily || "'Times New Roman', serif",
                  fontWeight: design.elementStyles?.body?.fontWeight || 'normal',
                  fontStyle: design.elementStyles?.body?.fontStyle || 'normal',
                  fontSize: `${design.elementStyles?.body?.fontSize || (isPortrait ? 14 : 13.5)}px`,
                  lineHeight: design.elementStyles?.body?.lineHeight || 1.45,
                  color: design.elementStyles?.body?.color || '#1E293B',
                  mb: 0.8
                }}
              >
                This is to certify that Ms. <b>Sunita Sharma</b>, Daughter of Mr./Mrs. <b>Hari Sharma</b>, permanent resident of <b>Gokarneshwor-05, Kathmandu</b>, has successfully completed the <b>390 Hours</b> vocational skills training course in <b>"Basic Beautician Training"</b> conducted from <b>2026-06-01</b> to <b>2026-09-01</b> in accordance with the curriculum standards prescribed by the Council for Technical Education and Vocational Training (CTEVT), Nepal.
              </Typography>
            )}

            {design.bodyLayoutMode === 'bilingual' && (
              <Box sx={{ my: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box sx={{ flexGrow: 1, height: '1px', bgcolor: '#E2E8F0' }} />
                <Box sx={{ color: design.accentColor, fontSize: '0.75rem' }}>❖</Box>
                <Box sx={{ flexGrow: 1, height: '1px', bgcolor: '#E2E8F0' }} />
              </Box>
            )}

            {(design.bodyLayoutMode === 'bilingual' || design.bodyLayoutMode === 'nepali-only') && (
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Noto Sans Devanagari', sans-serif",
                  fontWeight: design.elementStyles?.body?.fontWeight || 'normal',
                  fontStyle: design.elementStyles?.body?.fontStyle || 'normal',
                  fontSize: `${design.elementStyles?.body?.fontSize || (isPortrait ? 14 : 13.5)}px`,
                  lineHeight: design.elementStyles?.body?.lineHeight || 1.5,
                  color: design.elementStyles?.body?.color || '#1E293B'
                }}
              >
                प्रमाणित गरिन्छ कि गोकर्णेश्वर-०५, काठमाडौँ निवासी श्री हरि शर्माको सुपुत्री सुश्री <b>सुनिता शर्मा</b>ले यस संस्थाद्वारा मिति <b>२०८३/०२/१८</b> देखि <b>२०८३/०५/१८</b> सम्म सञ्चालित <b>३९० घन्टे</b> <b>"आधारभूत ब्युटिसियन तालिम"</b> सफलतापूर्वक सम्पन्न गर्नुभएकोले यो <b>व्यावसायिक तालिम समापन प्रमाणपत्र</b> प्रदान गरिएको छ।
              </Typography>
            )}
          </Box>

          {/* ============================================================== */}
          {/* 6. FOOTER: DYNAMIC QR + OFFICIAL SEAL (4 MODES) + SIGNATORIES  */}
          {/* ============================================================== */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              mt: isPortrait ? 2.5 : 1.2,
              pt: 1.2,
              borderTop: '1px solid #CBD5E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              px: 2
            }}
          >
            {/* Left QR Code (Movable) */}
            <Box
              onClick={(e) => { e.stopPropagation(); setSelectedElement('qrCode'); }}
              onMouseDown={(e) => handleMouseDownOnElement(e, 'qrCode')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '26%',
                transform: `translate(${design.elementStyles?.qrCode?.x || 0}px, ${design.elementStyles?.qrCode?.y || 0}px)`,
                cursor: isDragging && selectedElement === 'qrCode' ? 'grabbing' : 'grab',
                outline: selectedElement === 'qrCode' ? '2px dashed #0284c7' : '1px dashed transparent',
                outlineOffset: '4px',
                borderRadius: '4px'
              }}
            >
              {design.showQrVerification && (
                <>
                  <Box sx={{ p: 0.5, bgcolor: '#FFFFFF', border: `1.5px solid ${design.primaryColor}`, borderRadius: 1 }}>
                    <QRCodeSVG value="https://globalera.edu.np/verify?cert=GE-2081-000101" size={design.elementStyles?.qrCode?.qrSize || 54} level="M" />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: design.primaryColor, display: 'block', fontSize: '0.68rem' }}>
                      SCAN TO VERIFY
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.62rem' }}>
                      CTEVT Accredited
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Center Official Seal Zone (4-in-1 Modes: Blank Space, Scanned Stamp, Digital, or None) */}
            {design.sealMode !== 'none' && (
              <Box
                onClick={(e) => { e.stopPropagation(); setSelectedElement('seal'); }}
                onMouseDown={(e) => handleMouseDownOnElement(e, 'seal')}
                sx={{
                  textAlign: 'center',
                  width: '32%',
                  transform: `translate(${design.elementStyles?.seal?.x || 0}px, ${design.elementStyles?.seal?.y || 0}px)`,
                  cursor: isDragging && selectedElement === 'seal' ? 'grabbing' : 'grab',
                  outline: selectedElement === 'seal' ? '2px dashed #0284c7' : '1px dashed transparent',
                  outlineOffset: '4px',
                  borderRadius: '4px'
                }}
              >
                {/* MODE 1: Scanned Real Stamp Upload */}
                {design.sealMode === 'scanned' && (
                  design.customSealUrl ? (
                    <Box
                      component="img"
                      src={design.customSealUrl}
                      alt="Official Stamp"
                      sx={{
                        width: `${design.sealWidth || 84}px`,
                        height: 'auto',
                        transform: `rotate(${design.sealTilt || 0}deg)`,
                        display: 'inline-block'
                      }}
                    />
                  ) : (
                    <Box sx={{ p: '6px 12px', border: '1.5px dashed #0284C7', borderRadius: 2, display: 'inline-block' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1' }}>
                        [ स्क्यान गरिएको छाप अपलोड गर्नुहोस् ]
                      </Typography>
                    </Box>
                  )
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
                      border: '1px dashed rgba(203, 213, 225, 0.6)',
                      borderRadius: '50%',
                      bgcolor: 'transparent'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.58rem', textAlign: 'center', fontStyle: 'italic' }}>
                      (प्रिन्टपछि हातले<br />छाप लगाउने ठाउँ)
                    </Typography>
                  </Box>
                )}

                {/* MODE 3: Built-in Graphic Seal */}
                {design.sealMode === 'digital' && (
                  <Box sx={{ display: 'inline-block', p: '4px 12px', border: `1.5px solid ${design.accentColor}`, borderRadius: 2, bgcolor: '#FDFBF7' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: design.primaryColor, display: 'block', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                      ★ OFFICIAL SEAL ★
                    </Typography>
                    <Typography variant="caption" sx={{ color: design.accentColor, fontWeight: 800, fontSize: '0.62rem', display: 'block' }}>
                      GLOBAL ERA TECHNICAL SCHOOL
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Right: Dynamic Signatories List (Independently Movable) */}
            <Box
              onClick={(e) => { e.stopPropagation(); setSelectedElement('signatories'); }}
              onMouseDown={(e) => handleMouseDownOnElement(e, 'signatories')}
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2.5,
                width: design.sealMode === 'none' ? '68%' : '42%',
                transform: `translate(${design.elementStyles?.signatories?.x || 0}px, ${design.elementStyles?.signatories?.y || 0}px)`,
                cursor: isDragging && selectedElement === 'signatories' ? 'grabbing' : 'grab',
                outline: selectedElement === 'signatories' ? '2px dashed #0284c7' : '1px dashed transparent',
                outlineOffset: '4px',
                borderRadius: '4px'
              }}
            >
              {(design.signatories || []).map((sig) => (
                <Box key={sig.id} sx={{ textAlign: 'center', minWidth: '110px' }}>
                  {/* Signature Line */}
                  <Box
                    sx={{
                      height: 28,
                      borderBottom: sig.lineStyle === 'dashed' ? '1px dashed #64748B' : sig.lineStyle === 'none' ? 'none' : `1.5px solid ${design.primaryColor}`,
                      mb: 0.5
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: design.primaryColor, fontSize: '0.74rem' }}>
                    {sig.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem', display: 'block' }}>
                    {sig.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Dynamic Print CSS for Studio Test Prints */}
      <style>{`
        @page {
          size: A4 ${design.orientation || 'landscape'};
          margin: 6mm;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #liveCertificateStudioCanvas, #liveCertificateStudioCanvas * {
            visibility: visible !important;
          }
          #liveCertificateStudioCanvas {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 98vh !important;
            margin: 0 !important;
            box-shadow: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </Box>
  );
}
