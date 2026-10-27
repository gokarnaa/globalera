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
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import PaletteIcon from '@mui/icons-material/Palette';
import { QRCodeSVG } from 'qrcode.react';

import { loadDB, saveDB } from '../../services/storage';

// Default Design Configuration
export const DEFAULT_CERTIFICATE_DESIGN = {
  // 1. Orientation & Dimensions
  orientation: 'landscape', // 'landscape' | 'portrait'
  templateName: 'आधिकारिक ३ महिने व्यावसायिक तालिम ढाँचा',

  // 2. 10 Background Presets & Custom Backgrounds
  backgroundType: 'clean-white',
  customBackgroundUrl: '',
  customBackgrounds: [],
  customBgOpacity: 100,
  customBgFit: 'cover',
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

// Sample Student Data for Live Preview
const SAMPLE_STUDENTS = [
  {
    nameEn: 'Sunita Sharma',
    nameNp: 'सुनिता शर्मा',
    parentEn: 'Mr./Mrs. Hari Sharma',
    parentNp: 'श्री हरि शर्मा',
    addressEn: 'Gokarneshwor-05, Kathmandu',
    addressNp: 'गोकर्णेश्वर-०५, काठमाडौँ',
    courseEn: 'Basic Beautician Training',
    courseNp: 'आधारभूत ब्युटिसियन तालिम',
    hoursBadge: '390 Hours / 3 Months',
    hoursNp: '३९० घन्टे',
    certNo: 'GE-2081-000101',
    tgid: 'TGID-101',
    issueDate: '2026-09-01'
  },
  {
    nameEn: 'Ram Bahadur Singh Thakuri',
    nameNp: 'राम बहादुर सिंह ठकुरी',
    parentEn: 'Mr. Sher Bahadur Singh Thakuri',
    parentNp: 'श्री शेर बहादुर सिंह ठकुरी',
    addressEn: 'Birgunj-12, Parsa, Madhesh',
    addressNp: 'वीरगन्ज-१२, पर्सा, मधेश',
    courseEn: 'Advanced Welding & Fabrication',
    courseNp: 'एडभान्स वेल्डिङ तथा फेब्रिकेसन तालिम',
    hoursBadge: '450 Hours / 4 Months',
    hoursNp: '४५० घन्टे',
    certNo: 'GE-2081-000102',
    tgid: 'TGID-102',
    issueDate: '2026-09-01'
  },
  {
    nameEn: 'Dinesh Chaudhary',
    nameNp: 'दिनेश चौधरी',
    parentEn: 'Mr. Ram Lal Chaudhary',
    parentNp: 'श्री राम लाल चौधरी',
    addressEn: 'Dhangadhi-03, Kailali, Sudurpashchim',
    addressNp: 'धनगढी-०३, कैलाली, सुदूरपश्चिम',
    courseEn: 'Building Electrician (House Wiring)',
    courseNp: 'भवन इलेक्ट्रिसियन (हाउस वायरिङ)',
    hoursBadge: '390 Hours / 3 Months',
    hoursNp: '३९० घन्टे',
    certNo: 'GE-2081-000103',
    tgid: 'TGID-103',
    issueDate: '2026-09-01'
  }
];

export default function CertificateStudioManager({ onSaveSuccess }) {
  const [db, setDb] = useState(loadDB());
  const [design, setDesign] = useState(() => {
    const loaded = db.settings?.certificateDesign || {};
    const company = db.settings?.companyProfile || {};
    const defaultSignatories = [
      {
        id: 'sig-1',
        name: company.leadInstructorName || 'सुमन थापा (Suman Thapa)',
        title: company.leadInstructorTitle || 'प्रशिक्षक (Lead Instructor)',
        lineStyle: 'dashed',
        signatureUrl: ''
      },
      {
        id: 'sig-2',
        name: company.directorName || 'गोकर्ण थापा (Gokarna Thapa)',
        title: company.directorTitle || 'क्याम्पस प्रमुख / निर्देशक (Managing Director)',
        lineStyle: 'solid',
        signatureUrl: ''
      }
    ];

    return {
      ...DEFAULT_CERTIFICATE_DESIGN,
      instituteName: loaded.instituteName || company.companyNameEn || DEFAULT_CERTIFICATE_DESIGN.instituteName,
      customSealUrl: loaded.customSealUrl || company.stampImage || '',
      leftLogoUrl: loaded.leftLogoUrl || company.logoImage || '',
      ...loaded,
      signatories: loaded.signatories && loaded.signatories.length > 0 ? loaded.signatories : defaultSignatories,
      elementStyles: {
        ...DEFAULT_CERTIFICATE_DESIGN.elementStyles,
        ...(loaded.elementStyles || {})
      }
    };
  });

  const [savedAlert, setSavedAlert] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.75);

  // Left Tools Active Category Tab: 0=Header, 1=Background, 2=Borders, 3=Stamp/Signatures, 4=Calibration, 5=Layers
  const [activeLeftTab, setActiveLeftTab] = useState(0);

  // Panel Visibility Toggles (Option 3: Simple Top Bar Toggles)
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const handleToggleLeftPanel = () => {
    setShowLeftPanel((prev) => {
      const next = !prev;
      if (!next && !showRightPanel) {
        setPreviewScale(0.95);
      } else if (next && previewScale > 0.8) {
        setPreviewScale(0.75);
      }
      return next;
    });
  };

  const handleToggleRightPanel = () => {
    setShowRightPanel((prev) => {
      const next = !prev;
      if (!showLeftPanel && !next) {
        setPreviewScale(0.95);
      } else if (next && previewScale > 0.8) {
        setPreviewScale(0.75);
      }
      return next;
    });
  };

  // Sample Student Switcher
  const [sampleStudentIndex, setSampleStudentIndex] = useState(0);
  const currentSample = SAMPLE_STUDENTS[sampleStudentIndex] || SAMPLE_STUDENTS[0];

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

  const handleUploadCustomBg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('पृष्ठभूमि फोटोको साइज ५MB भन्दा सानो हुनुपर्छ।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const cleanFileName = file.name
        ? file.name.replace(/\.[^/.]+$/, '')
        : `कस्टम पृष्ठभूमि ${((design.customBackgrounds || []).length + 1)}`;
      const newPreset = {
        id: `custom-bg-${Date.now()}`,
        name: cleanFileName.slice(0, 24),
        url: dataUrl,
        createdAt: new Date().toLocaleDateString('ne-NP')
      };

      const existingList = design.customBackgrounds || [];
      const updatedList = [newPreset, ...existingList];

      setDesign((prev) => ({
        ...prev,
        backgroundType: 'custom',
        customBackgroundUrl: dataUrl,
        customBackgrounds: updatedList
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectCustomBg = (bgItem) => {
    setDesign((prev) => ({
      ...prev,
      backgroundType: 'custom',
      customBackgroundUrl: bgItem.url
    }));
  };

  const handleDeleteCustomBg = (bgId, e) => {
    if (e) e.stopPropagation();
    const existingList = design.customBackgrounds || [];
    const updatedList = existingList.filter((item) => item.id !== bgId);

    let nextUrl = design.customBackgroundUrl;
    let nextBgType = design.backgroundType;
    if (design.customBackgroundUrl && !updatedList.some((item) => item.url === design.customBackgroundUrl)) {
      if (updatedList.length > 0) {
        nextUrl = updatedList[0].url;
        nextBgType = 'custom';
      } else {
        nextUrl = '';
        nextBgType = 'clean-white';
      }
    }

    setDesign((prev) => ({
      ...prev,
      customBackgrounds: updatedList,
      customBackgroundUrl: nextUrl,
      backgroundType: nextBgType
    }));
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

          {/* Center: True Aspect Ratio Switcher & Panel Toggles */}
          <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
            <ToggleButtonGroup
              value={design.orientation}
              exclusive
              onChange={(e, next) => next && handleUpdate('orientation', next)}
              size="small"
              sx={{ bgcolor: '#F8FAFC', border: '1.5px solid #0F2E5A' }}
            >
              <ToggleButton value="landscape" sx={{ fontWeight: 900, px: 1.8, gap: 0.8, color: '#0F2E5A' }}>
                <CropLandscapeIcon fontSize="small" />
                🖥️ A4 Landscape (तेर्सो)
              </ToggleButton>
              <ToggleButton value="portrait" sx={{ fontWeight: 900, px: 1.8, gap: 0.8, color: '#0F2E5A' }}>
                <CropPortraitIcon fontSize="small" />
                📄 A4 Portrait (ठाडो)
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Option 3: Top Bar Simple Panel Toggles (Tools & Inspector) */}
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Tooltip title={showLeftPanel ? 'बायाँ टूल्स प्यानल लुकाउनुहोस्' : 'बायाँ टूल्स प्यानल देखाउनुहोस्'}>
                <Button
                  size="small"
                  variant={showLeftPanel ? 'contained' : 'outlined'}
                  onClick={handleToggleLeftPanel}
                  startIcon={<TuneIcon fontSize="small" />}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    borderRadius: 2,
                    py: 0.5,
                    px: 1.2,
                    bgcolor: showLeftPanel ? '#0F2E5A' : '#FFFFFF',
                    color: showLeftPanel ? '#FFFFFF' : '#0F2E5A',
                    borderColor: '#0F2E5A',
                    boxShadow: showLeftPanel ? '0 2px 6px rgba(15, 46, 90, 0.25)' : 'none',
                    '&:hover': {
                      bgcolor: showLeftPanel ? '#0B2545' : '#F1F5F9'
                    }
                  }}
                >
                  🛠️ टूल्स {showLeftPanel ? '✓' : '✗'}
                </Button>
              </Tooltip>

              <Tooltip title={showRightPanel ? 'दायाँ इन्स्पेक्टर लुकाउनुहोस्' : 'दायाँ इन्स्पेक्टर देखाउनुहोस्'}>
                <Button
                  size="small"
                  variant={showRightPanel ? 'contained' : 'outlined'}
                  onClick={handleToggleRightPanel}
                  startIcon={<AutoAwesomeIcon fontSize="small" />}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    borderRadius: 2,
                    py: 0.5,
                    px: 1.2,
                    bgcolor: showRightPanel ? '#0284C7' : '#FFFFFF',
                    color: showRightPanel ? '#FFFFFF' : '#0284C7',
                    borderColor: '#0284C7',
                    boxShadow: showRightPanel ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                    '&:hover': {
                      bgcolor: showRightPanel ? '#0369A1' : '#F1F5F9'
                    }
                  }}
                >
                  🎨 इन्स्पेक्टर {showRightPanel ? '✓' : '✗'}
                </Button>
              </Tooltip>
            </Stack>

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

      </Paper>

      {/* ============================================================== */}
      {/* 2. 3-COLUMN STUDIO LAYOUT (LEFT: TOOLS | CENTER: CANVAS | RIGHT: INSPECTOR) */}
      {/* ============================================================== */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 1.5,
          height: { xs: 'auto', lg: 'calc(100vh - 165px)' },
          minHeight: { xs: 'auto', lg: '740px' }
        }}
      >
        {/* ========================================================== */}
        {/* COLUMN 1: LEFT TOOLS & SETTINGS PANEL (~330px)             */}
        {/* ========================================================== */}
        {showLeftPanel && (
          <Paper
            elevation={1}
            sx={{
              width: { xs: '100%', lg: 330 },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2.5,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header of Left Panel with Close Button */}
            <Box sx={{ p: 1.2, bgcolor: '#0F2E5A', color: '#FFFFFF', borderBottom: '2px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TuneIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                स्टुडियो टूल्स र विकल्पहरू (Tools)
              </Typography>
              <Tooltip title="बायाँ टूल्स लुकाउनुहोस् (Hide Tools)">
                <IconButton size="small" onClick={handleToggleLeftPanel} sx={{ color: '#FFFFFF', p: 0.2 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

          {/* Left Vertical Tabs Navigation Buttons */}
          <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <Grid container spacing={0.6}>
              {[
                { id: 0, label: 'लेटरहेड र लोगो', icon: <BrandingWatermarkIcon sx={{ fontSize: 16 }} /> },
                { id: 1, label: 'पृष्ठभूमि (१०)', icon: <WallpaperIcon sx={{ fontSize: 16 }} /> },
                { id: 2, label: 'बोर्डर र कुना', icon: <BorderStyleIcon sx={{ fontSize: 16 }} /> },
                { id: 3, label: 'छाप र हस्ताक्षर', icon: <EditNoteIcon sx={{ fontSize: 16 }} /> },
                { id: 4, label: 'क्यालिब्रेसन', icon: <TuneIcon sx={{ fontSize: 16 }} /> },
                { id: 5, label: 'लेयर्स सूची', icon: <LayersIcon sx={{ fontSize: 16 }} /> }
              ].map((tab) => (
                <Grid item xs={6} key={tab.id}>
                  <Button
                    fullWidth
                    size="small"
                    variant={activeLeftTab === tab.id ? 'contained' : 'outlined'}
                    onClick={() => setActiveLeftTab(tab.id)}
                    startIcon={tab.icon}
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      py: 0.6,
                      px: 0.8,
                      justifyContent: 'flex-start',
                      borderRadius: 1.5,
                      bgcolor: activeLeftTab === tab.id ? '#0F2E5A' : '#FFFFFF',
                      borderColor: activeLeftTab === tab.id ? '#0F2E5A' : '#CBD5E1',
                      color: activeLeftTab === tab.id ? '#FFFFFF' : '#334155',
                      '&:hover': {
                        bgcolor: activeLeftTab === tab.id ? '#0B2545' : '#F1F5F9'
                      }
                    }}
                  >
                    {tab.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Scrollable Tab Content Body */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {/* TAB 0: LETTERHEAD & LOGOS */}
            {activeLeftTab === 0 && (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.4 }}>
                    मुख्य संस्थागत नाम (Single Heading):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={design.instituteName}
                    onChange={(e) => handleUpdate('instituteName', e.target.value)}
                    placeholder="ग्लोबल एरा प्राविधिक स्कुल"
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.4 }}>
                    सम्बन्धन / उप-शीर्षक (Accreditation / Sub-title):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={design.accreditationText}
                    onChange={(e) => handleUpdate('accreditationText', e.target.value)}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.4 }}>
                    दर्ता, सम्बन्धन कोड र ठेगाना (Regd & Location):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={design.affiliationCodeText}
                    onChange={(e) => handleUpdate('affiliationCodeText', e.target.value)}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                    लोगो तथा ब्याज प्रदर्शन:
                  </Typography>
                  <Stack spacing={0.6}>
                    <FormControlLabel
                      control={<Switch checked={design.showLeftLogo} onChange={(e) => handleUpdate('showLeftLogo', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>बायाँ लोगो देखाउने</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={design.showRightLogo} onChange={(e) => handleUpdate('showRightLogo', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>दायाँ ब्याज देखाउने</Typography>}
                    />
                  </Stack>

                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mt: 1.2, mb: 0.6 }}>
                    कस्टम लोगो अपलोड (PNG):
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.68rem', fontWeight: 700, flex: 1 }}>
                      बायाँ लोगो
                      <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('leftLogoUrl', e)} />
                    </Button>
                    <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.68rem', fontWeight: 700, flex: 1 }}>
                      दायाँ लोगो
                      <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('rightLogoUrl', e)} />
                    </Button>
                  </Stack>
                </Box>

                <Alert severity="info" sx={{ fontSize: '0.7rem', py: 0.5, borderRadius: 1.5 }}>
                  💡 टिप: क्यानभासमा प्रत्येक लोगो र अक्षरमा क्लिक गरेर माउसले जहाँ पनि सार्न सकिन्छ।
                </Alert>
              </Stack>
            )}

            {/* TAB 1: BACKGROUND PRESETS & CUSTOM GALLERY */}
            {activeLeftTab === 1 && (
              <Stack spacing={2}>
                {/* 1. Default Built-in Presets */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 1 }}>
                    🏛️ प्रणालीका १० आधारभूत पृष्ठभूमि प्रिसेटहरू:
                  </Typography>
                  <Grid container spacing={0.8}>
                    {BACKGROUND_PRESETS.map((bg) => {
                      const isSelected = design.backgroundType === bg.id;
                      return (
                        <Grid item xs={6} key={bg.id}>
                          <Button
                            fullWidth
                            size="small"
                            variant={isSelected ? 'contained' : 'outlined'}
                            onClick={() => handleUpdate('backgroundType', bg.id)}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.64rem',
                              py: 0.6,
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              bgcolor: isSelected ? '#0F2E5A' : '#FFFFFF',
                              borderColor: isSelected ? '#0F2E5A' : '#CBD5E1',
                              color: isSelected ? '#FFFFFF' : '#334155',
                              '&:hover': {
                                bgcolor: isSelected ? '#0B2545' : '#F1F5F9'
                              }
                            }}
                          >
                            {bg.label}
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* 2. Custom Uploaded Presets Library */}
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      🖼️ मेरो आफ्ना पृष्ठभूमिहरू (Custom Presets):
                    </Typography>
                    {design.backgroundType === 'custom' && (
                      <Chip
                        label="✓ सक्रिय (Active)"
                        size="small"
                        sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 900, fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                  </Box>

                  {/* Upload New Background Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      py: 0.8,
                      mb: 1.5,
                      boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #047857 0%, #065F46 100%)'
                      }
                    }}
                  >
                    + नयाँ पृष्ठभूमि फोटो अपलोड गर्नुहोस् (PNG / JPEG)
                    <input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleUploadCustomBg} />
                  </Button>

                  {/* Custom Presets Grid / Thumbnails */}
                  {(design.customBackgrounds || []).length > 0 ? (
                    <Grid container spacing={1} sx={{ mb: 1.5 }}>
                      {(design.customBackgrounds || []).map((bgItem) => {
                        const isCurrentActive = design.backgroundType === 'custom' && design.customBackgroundUrl === bgItem.url;
                        return (
                          <Grid item xs={6} key={bgItem.id}>
                            <Paper
                              onClick={() => handleSelectCustomBg(bgItem)}
                              elevation={isCurrentActive ? 2 : 0}
                              sx={{
                                p: 0.8,
                                cursor: 'pointer',
                                borderRadius: 1.8,
                                border: isCurrentActive ? '2px solid #F59E0B' : '1px solid #CBD5E1',
                                bgcolor: isCurrentActive ? '#FEFCE8' : '#FFFFFF',
                                position: 'relative',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  borderColor: '#F59E0B',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                }
                              }}
                            >
                              {/* Thumbnail preview image */}
                              <Box
                                sx={{
                                  height: 60,
                                  borderRadius: 1,
                                  backgroundImage: `url(${bgItem.url})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  bgcolor: '#F1F5F9',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  border: '1px solid #E2E8F0'
                                }}
                              >
                                {isCurrentActive && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      left: 4,
                                      bgcolor: '#059669',
                                      color: '#FFFFFF',
                                      borderRadius: '50%',
                                      width: 18,
                                      height: 18,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.7rem',
                                      fontWeight: 900
                                    }}
                                  >
                                    ✓
                                  </Box>
                                )}
                              </Box>

                              {/* Title and Delete Action */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.6 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: isCurrentActive ? 900 : 700,
                                    color: isCurrentActive ? '#0F2E5A' : '#475569',
                                    fontSize: '0.65rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 90
                                  }}
                                  title={bgItem.name}
                                >
                                  {bgItem.name}
                                </Typography>
                                <Tooltip title="यो पृष्ठभूमि हटाउनुहोस्">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleDeleteCustomBg(bgItem.id, e)}
                                    sx={{ p: 0.2, color: '#DC2626', '&:hover': { bgcolor: '#FEE2E2' } }}
                                  >
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  ) : (
                    <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px dashed #CBD5E1', mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                        हालसम्म कुनै कस्टम पृष्ठभूमि फोटो अपलोड गरिएको छैन। माथिको बटनबाट फोटो छनोट गर्नुहोस्।
                      </Typography>
                    </Box>
                  )}

                  {/* Controls when custom background is active */}
                  {design.backgroundType === 'custom' && (
                    <Box sx={{ pt: 1, borderTop: '1px dashed #CBD5E1', mt: 1 }}>
                      {/* Opacity Slider */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.7rem' }}>
                            पृष्ठभूमि स्पष्टता / गाढापन:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#059669', fontSize: '0.75rem' }}>
                            {design.customBgOpacity !== undefined ? design.customBgOpacity : 100}%
                          </Typography>
                        </Box>
                        <Slider
                          value={design.customBgOpacity !== undefined ? design.customBgOpacity : 100}
                          min={15}
                          max={100}
                          step={5}
                          onChange={(e, val) => handleUpdate('customBgOpacity', val)}
                          sx={{ color: '#059669', py: 0.5 }}
                        />
                      </Box>

                      {/* Display Mode / Fit */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                          प्रदर्शन ढाँचा (Fit Mode):
                        </Typography>
                        <ToggleButtonGroup
                          value={design.customBgFit || 'cover'}
                          exclusive
                          onChange={(e, val) => val && handleUpdate('customBgFit', val)}
                          size="small"
                          fullWidth
                        >
                          <ToggleButton value="cover" sx={{ fontSize: '0.65rem', fontWeight: 800, py: 0.4 }}>
                            पूर्ण पाना (Cover)
                          </ToggleButton>
                          <ToggleButton value="contain" sx={{ fontSize: '0.65rem', fontWeight: 800, py: 0.4 }}>
                            अनुपात मिलाउने (Contain)
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* 3. Watermark Opacity (Global) */}
                <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                    लोगो वाटरमार्क गाढापन ({design.watermarkOpacity}%):
                  </Typography>
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
            )}

            {/* TAB 2: BORDERS, CORNERS & MARGINS */}
            {activeLeftTab === 2 && (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.6 }}>
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
                            fontSize: '0.64rem',
                            py: 0.6,
                            justifyContent: 'flex-start',
                            textAlign: 'left',
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
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#C59B27', display: 'block', mb: 0.6 }}>
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
                            fontSize: '0.64rem',
                            py: 0.6,
                            justifyContent: 'flex-start',
                            textAlign: 'left',
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
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                    बोर्डर मार्जिन ({design.borderMargin} mm):
                  </Typography>
                  <Slider
                    value={design.borderMargin}
                    min={4}
                    max={25}
                    step={1}
                    onChange={(e, val) => handleUpdate('borderMargin', val)}
                    sx={{ color: '#0F2E5A' }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mt: 1, mb: 0.5 }}>
                    बोर्डर मोटाइ ({design.borderWidth} px):
                  </Typography>
                  <Slider
                    value={design.borderWidth}
                    min={2}
                    max={14}
                    step={1}
                    onChange={(e, val) => handleUpdate('borderWidth', val)}
                    sx={{ color: '#0F2E5A' }}
                  />
                </Box>
              </Stack>
            )}

            {/* TAB 3: OFFICIAL SEAL (4 MODES) & DYNAMIC SIGNATORIES */}
            {activeLeftTab === 3 && (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.6 }}>
                    आधिकारिक छाप मोड (Official Stamp - ४ विकल्पहरू):
                  </Typography>
                  <ToggleButtonGroup
                    value={design.sealMode}
                    exclusive
                    onChange={(e, next) => next && handleUpdate('sealMode', next)}
                    size="small"
                    fullWidth
                    orientation="vertical"
                    sx={{ bgcolor: '#FFFFFF' }}
                  >
                    <ToggleButton value="blank" sx={{ fontSize: '0.68rem', fontWeight: 800, justifyContent: 'flex-start', py: 0.6 }}>
                      ⭕ खाली ठाउँ (Wet Stamp - हातले लगाउने)
                    </ToggleButton>
                    <ToggleButton value="scanned" sx={{ fontSize: '0.68rem', fontWeight: 800, justifyContent: 'flex-start', py: 0.6 }}>
                      📷 स्क्यान छाप (Upload Stamp PNG)
                    </ToggleButton>
                    <ToggleButton value="digital" sx={{ fontSize: '0.68rem', fontWeight: 800, justifyContent: 'flex-start', py: 0.6 }}>
                      ★ डिजिटल सिल (Graphic Stamp)
                    </ToggleButton>
                    <ToggleButton value="none" sx={{ fontSize: '0.68rem', fontWeight: 800, justifyContent: 'flex-start', py: 0.6, color: '#DC2626' }}>
                      ❌ छाप नराख्ने (None)
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {design.sealMode === 'scanned' && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: '#F0F9FF', borderRadius: 1.5, border: '1px dashed #0284C7' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1', display: 'block', mb: 0.5 }}>
                        संस्थाको वास्तविक रबर छापको स्क्यान फोटो:
                      </Typography>
                      <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.68rem', width: '100%' }}>
                        छापको फोटो छान्नुहोस्
                        <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('customSealUrl', e)} />
                      </Button>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* Dynamic Signatories List */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      हस्ताक्षरकर्ताहरू ({design.signatories?.length || 0} जना):
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={handleAddSignatory}
                      sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: '#059669', py: 0.3 }}
                    >
                      + थप्नुहोस्
                    </Button>
                  </Box>

                  <Stack spacing={1}>
                    {(design.signatories || []).map((sig, idx) => (
                      <Paper key={sig.id} variant="outlined" sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                            हस्ताक्षरकर्ता #{idx + 1}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => handleDeleteSignatory(sig.id)} sx={{ p: 0.2 }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          label="नाम (Name)"
                          value={sig.name}
                          onChange={(e) => handleUpdateSignatory(sig.id, 'name', e.target.value)}
                          sx={{ mb: 0.8, bgcolor: '#FFFFFF', '& input': { py: 0.5, fontSize: '0.72rem' } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="पद (Title)"
                          value={sig.title}
                          onChange={(e) => handleUpdateSignatory(sig.id, 'title', e.target.value)}
                          sx={{ bgcolor: '#FFFFFF', '& input': { py: 0.5, fontSize: '0.72rem' } }}
                        />
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}

            {/* TAB 4: PRE-PRINTED CALIBRATION */}
            {activeLeftTab === 4 && (
              <Stack spacing={1.5}>
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
                        केवल अक्षरहरू मात्र प्रिन्ट गर्नुहोस् (Text-Only Mode)
                      </Typography>
                    }
                  />
                  <Typography variant="caption" sx={{ color: '#78350F', display: 'block', mt: 0.5, fontSize: '0.67rem' }}>
                    बजारबाट किनिएका वा पहिले नै बोर्डर र संस्थाको नाम छापिएका रेडीमेड पेपरहरूमा तालिमार्थीको नाम र विवरण मात्र प्रिन्ट गर्न यो मोड अन गर्नुहोस्।
                  </Typography>
                </Box>

                <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                    माथि/तल सर्ने क्यालिब्रेसन (Y-Offset: {design.offsetY} mm):
                  </Typography>
                  <Slider
                    value={design.offsetY}
                    min={-20}
                    max={20}
                    step={1}
                    onChange={(e, val) => handleUpdate('offsetY', val)}
                    sx={{ color: '#D97706' }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.67rem' }}>
                    प्रिन्टरमा कागजको बोर्डरसँग ठ्याक्कै मिलाउन माथि वा तल सार्न सकिन्छ।
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* TAB 5: ELEMENT LAYERS */}
            {activeLeftTab === 5 && (
              <Stack spacing={0.8}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block' }}>
                  क्यानभास लेयर्स सूची (Click to Select & Move):
                </Typography>
                {Object.entries(ELEMENT_LABELS).map(([key, label]) => {
                  const isSelected = selectedElement === key;
                  const elStyle = design.elementStyles?.[key] || {};
                  return (
                    <Box
                      key={key}
                      onClick={() => setSelectedElement(key)}
                      sx={{
                        p: 0.8,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        bgcolor: isSelected ? '#E0F2FE' : '#F8FAFC',
                        border: isSelected ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isSelected ? '#E0F2FE' : '#F1F5F9'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <DragIndicatorIcon sx={{ fontSize: 16, color: isSelected ? '#0284C7' : '#94A3B8' }} />
                        <Typography variant="caption" sx={{ fontWeight: isSelected ? 900 : 700, color: isSelected ? '#0369A1' : '#334155', fontSize: '0.72rem' }}>
                          {label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.66rem', color: '#64748B' }}>
                        X:{elStyle.x || 0} Y:{elStyle.y || 0}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Paper>
        )}

        {/* ========================================================== */}
        {/* COLUMN 2: CENTER LIVE CANVAS WORKSPACE (Interactive)        */}
        {/* ========================================================== */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#1E293B',
            borderRadius: 2.5,
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 14px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
        >
          {/* Canvas Top Sticky Toolbar */}
          <Box
            sx={{
              p: '8px 14px',
              bgcolor: '#0F172A',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              zIndex: 10
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Quick Panel Open Buttons + Drag hint badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {!showLeftPanel && (
                <Tooltip title="बायाँ टूल्स प्यानल खोल्नुहोस्">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<TuneIcon fontSize="small" />}
                    onClick={handleToggleLeftPanel}
                    sx={{ bgcolor: '#0F2E5A', fontSize: '0.68rem', fontWeight: 800, py: 0.3, px: 1, borderRadius: 1.5 }}
                  >
                    🛠️ टूल्स खोल्नुहोस्
                  </Button>
                </Tooltip>
              )}
              {!showRightPanel && (
                <Tooltip title="दायाँ इन्स्पेक्टर प्यानल खोल्नुहोस्">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AutoAwesomeIcon fontSize="small" />}
                    onClick={handleToggleRightPanel}
                    sx={{ bgcolor: '#0284C7', fontSize: '0.68rem', fontWeight: 800, py: 0.3, px: 1, borderRadius: 1.5 }}
                  >
                    🎨 इन्स्पेक्टर खोल्नुहोस्
                  </Button>
                </Tooltip>
              )}
              {!showLeftPanel && !showRightPanel && (
                <Chip
                  label="🖥️ पूर्ण ल्यान्डस्केप दृश्य (Full Landscape Focus)"
                  size="small"
                  sx={{ bgcolor: '#059669', color: '#FFFFFF', fontWeight: 900, fontSize: '0.7rem' }}
                />
              )}
              <Chip
                icon={<DragIndicatorIcon sx={{ color: '#38BDF8 !important' }} />}
                label="💡 माउसले तानेर मिलाउनुहोस् (Drag to Move)"
                size="small"
                sx={{
                  bgcolor: 'rgba(56, 189, 248, 0.12)',
                  color: '#38BDF8',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              />
              {selectedElement && (
                <Chip
                  label={`चयन: ${ELEMENT_LABELS[selectedElement] || selectedElement}`}
                  size="small"
                  onDelete={() => setSelectedElement(null)}
                  sx={{ bgcolor: '#F59E0B', color: '#0F172A', fontWeight: 900, fontSize: '0.7rem' }}
                />
              )}
            </Box>

            {/* Canvas Zoom & Aspect Ratio Controls */}
            <Stack direction="row" spacing={0.6} alignItems="center">
              <Tooltip title="जुम घटाउनुहोस्">
                <IconButton
                  size="small"
                  onClick={() => setPreviewScale((p) => Math.max(0.45, Math.round((p - 0.05) * 100) / 100))}
                  sx={{ color: '#E2E8F0', bgcolor: '#1E293B' }}
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Typography variant="caption" sx={{ color: '#F8FAFC', fontWeight: 900, fontFamily: 'monospace', px: 0.8 }}>
                {Math.round(previewScale * 100)}%
              </Typography>

              <Tooltip title="जुम बढाउनुहोस्">
                <IconButton
                  size="small"
                  onClick={() => setPreviewScale((p) => Math.min(1.2, Math.round((p + 0.05) * 100) / 100))}
                  sx={{ color: '#E2E8F0', bgcolor: '#1E293B' }}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="फिट दृश्य (Fit to View ~72%)">
                <IconButton
                  size="small"
                  onClick={() => setPreviewScale(0.72)}
                  sx={{ color: '#38BDF8', bgcolor: '#1E293B' }}
                >
                  <FitScreenIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Button
                size="small"
                onClick={() => setPreviewScale(1.0)}
                sx={{ color: '#CBD5E1', fontSize: '0.68rem', fontWeight: 800, minWidth: 32 }}
              >
                100%
              </Button>
            </Stack>
          </Box>

          {/* Scrollable Viewport containing the True A4 Certificate Canvas */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: { xs: 1.5, sm: 2.5 },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
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
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                ...getBorderStyle(),
                ...getBackgroundStyle()
              }}
            >
              {/* Custom Uploaded Background Layer with Opacity & Fit */}
              {!design.preprintedTextOnly && design.backgroundType === 'custom' && design.customBackgroundUrl && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${design.customBackgroundUrl})`,
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

                    {/* Center Lines: Main Title, Sub-heading, Address */}
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
                <Box>Certificate No: <b style={{ color: design.primaryColor }}>{currentSample.certNo}</b></Box>
                <Box>Registration / TGID: <b style={{ color: design.primaryColor }}>{currentSample.tgid}</b></Box>
                <Box>Issue Date: <b>{currentSample.issueDate}</b></Box>
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
                          {design.hoursBadgeText || currentSample.hoursBadge}
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
                    {currentSample.nameEn}
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
                    ({currentSample.nameNp})
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
                    COURSE: {currentSample.courseEn.toUpperCase()} ({currentSample.hoursBadge.toUpperCase()})
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
                    This is to certify that Ms./Mr. <b>{currentSample.nameEn}</b>, Child of <b>{currentSample.parentEn}</b>, permanent resident of <b>{currentSample.addressEn}</b>, has successfully completed the <b>{currentSample.hoursNp}</b> vocational skills training course in <b>"{currentSample.courseEn}"</b> conducted in accordance with the curriculum standards prescribed by the Council for Technical Education and Vocational Training (CTEVT), Nepal.
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
                    प्रमाणित गरिन्छ कि {currentSample.addressNp} निवासी {currentSample.parentNp}को सन्तान सुश्री/श्री <b>{currentSample.nameNp}</b>ले यस संस्थाद्वारा सञ्चालित <b>{currentSample.hoursNp}</b> <b>"{currentSample.courseNp}"</b> सफलतापूर्वक सम्पन्न गर्नुभएकोले यो <b>व्यावसायिक तालिम समापन प्रमाणपत्र</b> प्रदान गरिएको छ।
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
                        <QRCodeSVG value={`https://globalera.edu.np/verify?cert=${currentSample.certNo}`} size={design.elementStyles?.qrCode?.qrSize || 54} level="M" />
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
        </Box>

        {/* ========================================================== */}
        {/* COLUMN 3: RIGHT INSPECTOR & PRESETS PANEL (~310px)         */}
        {/* ========================================================== */}
        {showRightPanel && (
          <Box
            sx={{
              width: { xs: '100%', lg: 310 },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Bar for Right Inspector */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Tooltip title="दायाँ इन्स्पेक्टर लुकाउनुहोस् (Hide Inspector)">
                <Button
                  size="small"
                  onClick={handleToggleRightPanel}
                  endIcon={<CloseIcon fontSize="small" />}
                  sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', p: '2px 8px', bgcolor: '#F1F5F9', borderRadius: 1.5 }}
                >
                  इन्स्पेक्टर बन्द गर्नुहोस्
                </Button>
              </Tooltip>
            </Box>
          {/* CARD 1: ELEMENT INSPECTOR */}
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              border: selectedElement ? '1.5px solid #0284c7' : '1px solid #E2E8F0',
              bgcolor: selectedElement ? '#F0F9FF' : '#FFFFFF',
              boxShadow: selectedElement ? '0 4px 16px rgba(2, 132, 199, 0.12)' : '0 1px 4px rgba(0,0,0,0.04)'
            }}
          >
            {selectedElement ? (
              <Stack spacing={1.2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    icon={<PanToolIcon fontSize="small" />}
                    label={ELEMENT_LABELS[selectedElement] || selectedElement}
                    size="small"
                    sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 900, fontSize: '0.72rem' }}
                  />
                  <IconButton size="small" onClick={() => setSelectedElement(null)} sx={{ p: 0.2 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Precision Nudge Controls */}
                <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #CBD5E1' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1' }}>
                      स्थिति नियन्त्रण (Position):
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0369A1' }}>
                      X:{activeStyle?.x || 0}px Y:{activeStyle?.y || 0}px
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="बायाँ (-1px / Shift -5px)">
                      <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, -1, 0)} sx={{ bgcolor: '#F1F5F9' }}>
                        <ArrowBackIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Stack spacing={0.5}>
                      <Tooltip title="माथि (-1px / Shift -5px)">
                        <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 0, -1)} sx={{ bgcolor: '#F1F5F9' }}>
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="तल (+1px / Shift +5px)">
                        <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 0, 1)} sx={{ bgcolor: '#F1F5F9' }}>
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Tooltip title="दायाँ (+1px / Shift +5px)">
                      <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 1, 0)} sx={{ bgcolor: '#F1F5F9' }}>
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Direct Numeric Coordinate Input */}
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <TextField
                      size="small"
                      label="X स्थिति (px)"
                      type="number"
                      value={activeStyle?.x || 0}
                      onChange={(e) => handleElementStyleUpdate(selectedElement, 'x', parseInt(e.target.value) || 0)}
                      sx={{ '& input': { py: 0.4, fontSize: '0.72rem', textAlign: 'center' } }}
                    />
                    <TextField
                      size="small"
                      label="Y स्थिति (px)"
                      type="number"
                      value={activeStyle?.y || 0}
                      onChange={(e) => handleElementStyleUpdate(selectedElement, 'y', parseInt(e.target.value) || 0)}
                      sx={{ '& input': { py: 0.4, fontSize: '0.72rem', textAlign: 'center' } }}
                    />
                  </Stack>

                  <Button
                    fullWidth
                    size="small"
                    color="inherit"
                    onClick={() => handleResetElement(selectedElement)}
                    sx={{ mt: 0.8, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#F8FAFC' }}
                  >
                    सुरुवाती स्थितिमा फर्काउनुहोस् (Reset)
                  </Button>
                </Box>

                {/* Typography Controls for Selected Text */}
                {['headerTitle', 'headerSub', 'headerAddress', 'title', 'student', 'body'].includes(selectedElement) && (
                  <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #CBD5E1' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                      टाइपोग्राफी तथा फन्ट स्टाइल:
                    </Typography>

                    <Stack spacing={1}>
                      {/* Font Size & Weight */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#F8FAFC', p: '2px 6px', borderRadius: 1.5, border: '1px solid #CBD5E1' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569' }}>साइज:</Typography>
                          <Button size="small" sx={{ minWidth: 20, p: 0 }} onClick={() => handleElementStyleUpdate(selectedElement, 'fontSize', Math.max(8, (activeStyle?.fontSize || 20) - 1))}>-</Button>
                          <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{activeStyle?.fontSize || 20}px</Typography>
                          <Button size="small" sx={{ minWidth: 20, p: 0 }} onClick={() => handleElementStyleUpdate(selectedElement, 'fontSize', Math.min(50, (activeStyle?.fontSize || 20) + 1))}>+</Button>
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
                      </Box>

                      {/* Text Alignment */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>पङ्क्तिबद्धता:</Typography>
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
                      </Box>

                      {/* Font Family & Color */}
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: '0.72rem' }}>फन्ट परिवार (Font)</InputLabel>
                        <Select
                          value={activeStyle?.fontFamily || 'Times New Roman'}
                          label="फन्ट परिवार (Font)"
                          onChange={(e) => handleElementStyleUpdate(selectedElement, 'fontFamily', e.target.value)}
                          sx={{ height: 32, fontSize: '0.72rem' }}
                        >
                          {FONT_OPTIONS.map((f) => (
                            <MenuItem key={f.id} value={f.id} sx={{ fontSize: '0.74rem' }}>{f.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>अक्षरको रङ:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input
                            type="color"
                            value={activeStyle?.color || design.primaryColor}
                            onChange={(e) => handleElementStyleUpdate(selectedElement, 'color', e.target.value)}
                            style={{ width: 34, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                          />
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                            {activeStyle?.color || design.primaryColor}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                )}

                {/* Photo Frame Controls */}
                {selectedElement === 'photo' && (
                  <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #CBD5E1' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                      विद्यार्थी फोटो फ्रेम नियन्त्रण:
                    </Typography>
                    <ToggleButtonGroup
                      value={activeStyle?.preset || 'right'}
                      exclusive
                      onChange={(e, next) => next && handleElementStyleUpdate('photo', 'preset', next)}
                      size="small"
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      <ToggleButton value="right" sx={{ fontSize: '0.68rem', py: 0.3 }}>दायाँ कुना</ToggleButton>
                      <ToggleButton value="center" sx={{ fontSize: '0.68rem', py: 0.3 }}>बीचमा</ToggleButton>
                      <ToggleButton value="left" sx={{ fontSize: '0.68rem', py: 0.3 }}>बायाँ</ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>चौडाइ (Width):</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Button size="small" onClick={() => handleElementStyleUpdate('photo', 'width', Math.max(60, (activeStyle?.width || 88) - 4))}>-</Button>
                        <Typography variant="caption" sx={{ fontWeight: 900 }}>{activeStyle?.width || 88}px</Typography>
                        <Button size="small" onClick={() => handleElementStyleUpdate('photo', 'width', Math.min(140, (activeStyle?.width || 88) + 4))}>+</Button>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 1.5 }}>
                <AutoAwesomeIcon sx={{ color: '#0284C7', fontSize: 32, mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 0.5 }}>
                  एलिमेन्ट इन्स्पेक्टर (Inspector)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5, lineHeight: 1.3 }}>
                  क्यानभासमा कुनै पनि अक्षर वा लोगोमा क्लिक गर्नुहोस्, वा तलका मुख्य एलिमेन्टहरू छान्नुहोस्:
                </Typography>
                <Grid container spacing={0.6}>
                  {[
                    { key: 'student', label: 'विद्यार्थी नाम' },
                    { key: 'headerTitle', label: 'संस्थागत नाम' },
                    { key: 'title', label: 'मुख्य शीर्षक' },
                    { key: 'photo', label: 'फोटो फ्रेम' },
                    { key: 'body', label: 'व्यहोरा' },
                    { key: 'signatories', label: 'हस्ताक्षर' },
                    { key: 'seal', label: 'आधिकारिक छाप' },
                    { key: 'qrCode', label: 'क्युआर कोड' }
                  ].map((el) => (
                    <Grid item xs={6} key={el.key}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedElement(el.key)}
                        sx={{ fontSize: '0.67rem', fontWeight: 800, py: 0.4, bgcolor: '#FFFFFF' }}
                      >
                        {el.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>

          {/* CARD 2: SAMPLE STUDENT SWITCHER */}
          <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <PersonIcon fontSize="small" sx={{ color: '#059669' }} />
              नमूना विद्यार्थी छनोट (Preview)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1, fontSize: '0.68rem' }}>
              विभिन्न नामको लम्बाइ तथा कोर्स अनुसार डिजाइन कस्तो देखिन्छ जाँच गर्नुहोस्:
            </Typography>
            <Stack spacing={0.8}>
              {SAMPLE_STUDENTS.map((st, idx) => (
                <Box
                  key={st.certNo}
                  onClick={() => setSampleStudentIndex(idx)}
                  sx={{
                    p: 0.8,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: sampleStudentIndex === idx ? '#ECFDF5' : '#F8FAFC',
                    border: sampleStudentIndex === idx ? '1.5px solid #059669' : '1px solid #E2E8F0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 900, color: sampleStudentIndex === idx ? '#065F46' : '#1E293B', display: 'block' }}>
                    {st.nameNp} ({st.nameEn})
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem', display: 'block' }}>
                    {st.courseEn} ({st.hoursBadge})
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* CARD 3: 1-CLICK LUXURY PALETTES */}
          <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <PaletteIcon fontSize="small" sx={{ color: '#C59B27' }} />
              १-क्लिक लक्जरी रङ थिम
            </Typography>
            <Stack spacing={0.6} sx={{ mb: 1.2 }}>
              {LUXURY_PALETTES.map((pal) => (
                <Box
                  key={pal.name}
                  onClick={() => handleApplyPalette(pal)}
                  sx={{
                    p: '6px 10px',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', fontSize: '0.7rem' }}>
                    {pal.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: pal.primary, border: '1px solid #CBD5E1' }} />
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: pal.accent, border: '1px solid #CBD5E1' }} />
                  </Box>
                </Box>
              ))}
            </Stack>

            <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Stack direction="row" spacing={2} justifyContent="space-around">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.4 }}>Primary</Typography>
                  <input
                    type="color"
                    value={design.primaryColor}
                    onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                    style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontSize: '0.65rem' }}>{design.primaryColor}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#C59B27', display: 'block', mb: 0.4 }}>Accent</Typography>
                  <input
                    type="color"
                    value={design.accentColor}
                    onChange={(e) => handleUpdate('accentColor', e.target.value)}
                    style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontSize: '0.65rem' }}>{design.accentColor}</Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Box>
        )}
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
