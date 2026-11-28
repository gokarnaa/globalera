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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import EditNoteIcon from '@mui/icons-material/EditNote';
import TuneIcon from '@mui/icons-material/Tune';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
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
import LayersIcon from '@mui/icons-material/Layers';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import PaletteIcon from '@mui/icons-material/Palette';
import { QRCodeSVG } from 'qrcode.react';

import { loadDB, saveDB } from '../../services/storage';
import { pushLocalDBToSupabase } from '../../services/supabaseClient';
import { uploadCertificateBgToSupabase } from '../../services/mediaUpload';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CircularProgress from '@mui/material/CircularProgress';

// Default Design Configuration
export const DEFAULT_CERTIFICATE_DESIGN = {
  // 1. Orientation & Dimensions
  orientation: 'landscape', // 'landscape' | 'portrait'
  templateName: 'Official 3-Month Vocational Training Template',

  // 2. 10 Background Presets & Custom Backgrounds
  backgroundType: 'clean-white',
  customBackgroundUrl: '',
  customBgMode: 'plain', // 'plain' | 'predesigned'
  customBackgrounds: [],
  customTemplatePresets: [],
  activePresetId: '',
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
  instituteName: 'Prabidhik School, Jorpati / Global Era Multi Service Pvt. Ltd.',
  showLeftLogo: true,
  leftLogoUrl: '',
  leftLogoWidth: 46,
  showRightLogo: true,
  rightLogoUrl: '',
  rightLogoWidth: 46,
  showAccreditation: true,
  accreditationText: 'Accredited Technical Training Provider under Council for Technical Education and Vocational Training (CTEVT)',
  showAffiliation: true,
  affiliationCodeText: 'Government Regd. No: 184920/078/079 • CTEVT Affiliation Code: 4208 • Jorpati, Gokarneshwor, Kathmandu, Nepal',

  // 6. Title & Body Typography
  showHeaderTitle: true,
  showHeaderDivider: true,
  showTitle: true,
  showRefBar: true,
  showRefCertNo: true,
  showRefTgid: true,
  showRefIssueDate: true,
  transparentRefBar: false,
  showNepaliNameSubtitle: false,
  showCourseLine: true,
  showBodyText: true,
  showSignatories: true,
  certificateTitleEn: 'CERTIFICATE OF VOCATIONAL TRAINING COMPLETION',
  certificateTitleNp: '(VOCATIONAL TRAINING COMPLETION CERTIFICATE)',
  bodyLayoutMode: 'english-only', // 'english-only' | 'bilingual' | 'nepali-only'
  durationDisplayMode: 'hours', // 'hours' | 'unit' | 'both'
  showStudentPhoto: true,
  showCompetencyBadge: true,
  competencyBadgeTitle: 'CTEVT LEVEL 1',
  hoursBadgeText: '',

  // 7. Dynamic Official Seal 4-in-1 Modes
  sealMode: 'blank', // 'blank' | 'scanned' | 'digital' | 'none'
  customSealUrl: '',
  sealWidth: 84,
  sealTilt: 0, // -5 to +5 deg
  showQrVerification: true,

  // 8. Dynamic Signatories (Add/Remove)
  signatories: [
    {
      id: 'sig-1',
      name: 'Suman Thapa',
      title: 'Lead Instructor',
      lineStyle: 'dashed',
      signatureUrl: ''
    },
    {
      id: 'sig-2',
      name: 'Gokarna Thapa',
      title: 'Campus Chief / Director',
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
    refBar: { x: 0, y: 0, fontSize: 12, fontWeight: '700', color: '#334155' },
    refCertNo: { x: 0, y: 0, fontSize: 12, fontWeight: '700', color: '#334155' },
    refTgid: { x: 0, y: 0, fontSize: 12, fontWeight: '700', color: '#334155' },
    refIssueDate: { x: 0, y: 0, fontSize: 12, fontWeight: '700', color: '#334155' },
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
  { id: 'clean-white', label: 'Pure White' },
  { id: 'ivory-parchment', label: 'Ivory Parchment' },
  { id: 'guilloche-security', label: 'Guilloche Security Wave' },
  { id: 'royal-navy-gold', label: 'Navy & Gold Glow' },
  { id: 'modern-geometric', label: 'Modern Geometric Mesh' },
  { id: 'damask-floral', label: 'Damask Floral' },
  { id: 'emerald-aristocrat', label: 'Emerald Aristocrat' },
  { id: 'maroon-sovereign', label: 'Maroon Sovereign' },
  { id: 'technical-grid', label: 'Technical Blueprint Grid' },
  { id: 'marble-veins', label: 'Italian Marble' }
];

// 7 Border Styles Definitions
const BORDER_STYLES = [
  { id: 'royal-double', label: 'Royal Double Gold' },
  { id: 'vintage-filigree', label: 'Vintage Filigree' },
  { id: 'modern-executive', label: 'Modern Executive' },
  { id: 'greek-key', label: 'Greek Key Classic' },
  { id: 'security-guilloche', label: 'Security Frame' },
  { id: 'art-deco', label: 'Art Deco Lines' },
  { id: 'none', label: 'None (Pre-printed)' }
];

// Corner Ornaments Definitions
const CORNER_STYLES = [
  { id: 'victorian-flourish', label: 'Victorian Royal Flourish' },
  { id: 'acanthus-leaf', label: 'Royal Acanthus Leaf' },
  { id: 'art-deco-bracket', label: 'Art Deco 3-Tier Corner' },
  { id: 'celtic-knot', label: 'Celtic Golden Knot' },
  { id: 'clean-l-bracket', label: 'Luxury L-Bracket' },
  { id: 'none', label: 'None' }
];

// 5 Curated Luxury Palettes
const LUXURY_PALETTES = [
  { name: 'Navy & Gold (Official)', primary: '#0B2545', accent: '#C59B27', corner: '#C59B27' },
  { name: 'Burgundy & Champagne', primary: '#6B1D2F', accent: '#D4AF37', corner: '#D4AF37' },
  { name: 'Emerald & Brass (CTEVT)', primary: '#0D472D', accent: '#C59B27', corner: '#C59B27' },
  { name: 'Charcoal & Silver', primary: '#1F2937', accent: '#94A3B8', corner: '#94A3B8' },
  { name: 'Midnight & 24K Gold', primary: '#111827', accent: '#F59E0B', corner: '#F59E0B' }
];

// Available Fonts List
const FONT_OPTIONS = [
  { id: 'Times New Roman', label: 'Times New Roman (Formal)' },
  { id: 'Cinzel', label: 'Cinzel (Royal Serif)' },
  { id: 'Playfair Display', label: 'Playfair Display (Luxury)' },
  { id: 'Noto Sans Devanagari', label: 'Noto Sans (Clean Sans)' },
  { id: 'Georgia', label: 'Georgia (Classic)' },
  { id: 'Inter', label: 'Inter (Modern Sans)' }
];

// Human Labels for Canvas Elements
const ELEMENT_LABELS = {
  leftLogo: 'Left Logo',
  rightLogo: 'Right Badge / Logo',
  headerTitle: 'Institute Title',
  headerSub: 'Accreditation / Subtitle',
  headerAddress: 'Registration & Address',
  title: 'Certificate Main Title',
  student: 'Trainee Name & Course Details',
  photo: 'Trainee Photo Frame',
  body: 'Certification Body Text',
  seal: 'Official Stamp / Space',
  signatories: 'Signatures Group',
  qrCode: 'Verification QR Code'
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
    nameEn: 'Trainee Full Name',
    nameNp: 'Trainee Full Name',
    parentEn: 'Mr./Mrs. Hari Sharma',
    parentNp: 'Mr. Hari Sharma',
    addressEn: 'Gokarneshwor-05, Kathmandu',
    addressNp: 'Gokarneshwor-05, Kathmandu',
    courseEn: 'Basic Beautician Training',
    courseNp: 'Basic Beautician Training',
    hoursBadge: '390 Hours / 3 Months',
    hoursNp: '390 Hours',
    certNo: 'GE-2081-000101',
    tgid: 'TGID-101',
    issueDate: '2026-09-01'
  },
  {
    nameEn: 'Ram Bahadur Singh Thakuri',
    nameNp: 'Ram Bahadur Singh Thakuri',
    parentEn: 'Mr. Sher Bahadur Singh Thakuri',
    parentNp: 'Mr. Sher Bahadur Singh Thakuri',
    addressEn: 'Birgunj-12, Parsa, Madhesh',
    addressNp: 'Birgunj-12, Parsa, Madhesh',
    courseEn: 'Advanced Welding & Fabrication',
    courseNp: 'Advanced Welding & Fabrication Training',
    hoursBadge: '450 Hours / 4 Months',
    hoursNp: '450 Hours',
    certNo: 'GE-2081-000102',
    tgid: 'TGID-102',
    issueDate: '2026-09-01'
  },
  {
    nameEn: 'Dinesh Chaudhary',
    nameNp: 'Dinesh Chaudhary',
    parentEn: 'Mr. Ram Lal Chaudhary',
    parentNp: 'Mr. Ram Lal Chaudhary',
    addressEn: 'Dhangadhi-03, Kailali, Sudurpashchim',
    addressNp: 'Dhangadhi-03, Kailali, Sudurpashchim',
    courseEn: 'Building Electrician (House Wiring)',
    courseNp: 'Building Electrician (House Wiring)',
    hoursBadge: '390 Hours / 3 Months',
    hoursNp: '390 Hours',
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
        name: company.leadInstructorName || 'Suman Thapa',
        title: company.leadInstructorTitle || 'Lead Instructor',
        lineStyle: 'dashed',
        signatureUrl: ''
      },
      {
        id: 'sig-2',
        name: company.directorName || 'Gokarna Thapa',
        title: company.directorTitle || 'Campus Chief / Managing Director',
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
  const [presetNameInput, setPresetNameInput] = useState('');
  const [bgUploading, setBgUploading] = useState(false);
  const [cloudSyncState, setCloudSyncState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'local'
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [presetModalUploading, setPresetModalUploading] = useState(false);
  const [presetForm, setPresetForm] = useState(null);
  const [previewScale, setPreviewScale] = useState(0.58);

  // Sync saved Custom Presets & Backgrounds when cloud hydration finishes on page refresh
  useEffect(() => {
    const onCloudHydrated = () => {
      const freshDb = loadDB();
      setDb(freshDb);
      const cloudDesign = freshDb.settings?.certificateDesign;
      if (cloudDesign) {
        setDesign((prev) => ({
          ...DEFAULT_CERTIFICATE_DESIGN,
          ...cloudDesign,
          elementStyles: {
            ...DEFAULT_CERTIFICATE_DESIGN.elementStyles,
            ...(cloudDesign.elementStyles || {})
          },
          customTemplatePresets:
            (cloudDesign.customTemplatePresets && cloudDesign.customTemplatePresets.length > 0)
              ? cloudDesign.customTemplatePresets
              : (prev.customTemplatePresets || []),
          customBackgrounds:
            (cloudDesign.customBackgrounds && cloudDesign.customBackgrounds.length > 0)
              ? cloudDesign.customBackgrounds
              : (prev.customBackgrounds || [])
        }));
      }
    };
    window.addEventListener('kite_cloud_hydrated', onCloudHydrated);
    return () => window.removeEventListener('kite_cloud_hydrated', onCloudHydrated);
  }, []);
  const [autoFitMode, setAutoFitMode] = useState(true);
  const studioContainerRef = useRef(null);
  const canvasViewportRef = useRef(null);
  const [studioSize, setStudioSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth - 48 : 1240,
    height: typeof window !== 'undefined' ? Math.max(620, window.innerHeight - 165) : 740
  });

  // Left Tools Active Category Tab: 0=Header, 1=Background, 2=Borders, 3=Stamp/Signatures, 4=Calibration, 5=Layers
  const [activeLeftTab, setActiveLeftTab] = useState(0);

  // Panel Visibility Toggles (Option 3: Simple Top Bar Toggles)
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const handleToggleLeftPanel = () => {
    setShowLeftPanel((prev) => !prev);
    setAutoFitMode(true);
  };

  const handleToggleRightPanel = () => {
    setShowRightPanel((prev) => !prev);
    setAutoFitMode(true);
  };

  // Sample Student Switcher
  const [sampleStudentIndex, setSampleStudentIndex] = useState(0);
  const currentSample = SAMPLE_STUDENTS[sampleStudentIndex] || SAMPLE_STUDENTS[0];

  // Canva-Style Selected Element & Dragging State
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initElX: 0, initElY: 0, elKey: null });

  const isPortrait = design.orientation === 'portrait';
  const baseCanvasWidth = isPortrait ? 760 : 1040;
  const baseCanvasHeight = isPortrait ? 1060 : 740;

  // Observe ONLY the outer 3-column Studio container (never the dynamic center panel) -> 0% flicker
  useEffect(() => {
    const measureOuter = () => {
      const el = studioContainerRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setStudioSize((prev) =>
        Math.abs(prev.width - w) >= 4 || Math.abs(prev.height - h) >= 4
          ? { width: w, height: h }
          : prev
      );
    };
    measureOuter();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureOuter) : null;
    if (ro && studioContainerRef.current) ro.observe(studioContainerRef.current);
    window.addEventListener('resize', measureOuter);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measureOuter);
    };
  }, []);

  const computeFitScale = React.useCallback(() => {
    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 1200;
    const reservedLeft = !isNarrow && showLeftPanel ? 310 : 0;
    const reservedRight = !isNarrow && showRightPanel ? 290 : 0;
    const gaps = (!isNarrow ? ((showLeftPanel ? 12 : 0) + (showRightPanel ? 12 : 0)) : 0);
    const availW = Math.max(240, studioSize.width - reservedLeft - reservedRight - gaps - 48);
    const availH = isNarrow
      ? Math.max(240, Math.min((typeof window !== 'undefined' ? window.innerHeight : 760) * 0.56, 600))
      : Math.max(360, studioSize.height - 96);
    const fit = Math.min(availW / baseCanvasWidth, availH / baseCanvasHeight, 0.92);
    return Math.max(0.25, Math.floor(fit * 100) / 100);
  }, [baseCanvasWidth, baseCanvasHeight, studioSize.width, studioSize.height, showLeftPanel, showRightPanel]);

  // Auto-fit preview whenever outer studio container resizes, orientation flips, or side panels toggle
  useEffect(() => {
    if (!autoFitMode) return;
    const next = computeFitScale();
    setPreviewScale((prev) => (Math.abs(next - prev) >= 0.01 ? next : prev));
  }, [autoFitMode, computeFitScale]);

  // Re-engage auto-fit cleanly when user switches between Portrait and Landscape
  useEffect(() => {
    setAutoFitMode(true);
  }, [isPortrait]);

  // Dynamic Center Preview Window width that hugs the zoomed certificate (zero wasted dark side space)
  const scaledCanvasWidth = Math.round(baseCanvasWidth * previewScale);
  const scaledCanvasHeight = Math.round(baseCanvasHeight * previewScale);
  const minSidePanelsWidth =
    (showLeftPanel ? 260 : 0) +
    (showRightPanel ? 250 : 0) +
    (showLeftPanel ? 12 : 0) +
    (showRightPanel ? 12 : 0);
  const maxCenterWindowWidth = Math.max(360, studioSize.width - minSidePanelsWidth);
  const dynamicCenterWindowWidth = Math.min(
    maxCenterWindowWidth,
    Math.max(320, scaledCanvasWidth + 36)
  );

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
      name: 'New Signatory Name',
      title: 'Designation',
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
      alert('At least 1 signatory is required.');
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
      alert('File size must be smaller than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdate(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Apply Plain vs Pre-Designed (Heading Included) mode cleanly
  const handleApplyBgMode = (mode) => {
    setDesign((prev) => {
      if (mode === 'predesigned') {
        return {
          ...prev,
          customBgMode: 'predesigned',
          showHeader: false,
          showTitle: false,
          borderStyle: 'none',
          cornerStyle: 'none',
          watermarkOpacity: 0,
          customBgFit: '100% 100%'
        };
      }
      return {
        ...prev,
        customBgMode: 'plain',
        showHeader: true,
        showTitle: true,
        borderStyle: prev.borderStyle === 'none' ? 'royal-double' : prev.borderStyle,
        cornerStyle: prev.cornerStyle === 'none' ? 'victorian-flourish' : prev.cornerStyle
      };
    });
  };

  // Persist design immediately to localStorage + IndexedDB + Supabase Cloud (prevents losing presets on refresh)
  const persistDesignToCloud = async (nextDesign) => {
    const freshDb = loadDB();
    const nextDb = {
      ...freshDb,
      settings: {
        ...(freshDb.settings || {}),
        certificateDesign: nextDesign
      }
    };
    saveDB(nextDb);
    setDb(nextDb);
    setCloudSyncState('saving');
    try {
      await pushLocalDBToSupabase(nextDb, undefined, ['settings']);
      setCloudSyncState('saved');
    } catch (err) {
      console.warn('[CertificateStudio] Immediate cloud push fallback:', err?.message);
      setCloudSyncState('local');
    }
  };

  const handleUploadCustomBg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Background image size must be smaller than 10MB.');
      return;
    }

    setBgUploading(true);
    try {
      const cleanFileName = file.name
        ? file.name.replace(/\.[^/.]+$/, '')
        : `Custom Background ${((design.customBackgrounds || []).length + 1)}`;
      const uploaded = await uploadCertificateBgToSupabase(file, cleanFileName);
      const imageUrl = uploaded.url;
      const bgMode = design.customBgMode || 'plain';
      const newBg = {
        id: `custom-bg-${Date.now()}`,
        name: cleanFileName.slice(0, 24),
        url: imageUrl,
        bgMode,
        storage: uploaded.storage,
        createdAt: new Date().toLocaleDateString('en-US')
      };

      const existingList = design.customBackgrounds || [];
      const updatedList = [newBg, ...existingList];

      const nextDesign = {
        ...design,
        backgroundType: 'custom',
        customBackgroundUrl: imageUrl,
        customBgMode: bgMode,
        customBackgrounds: updatedList,
        ...(bgMode === 'predesigned'
          ? {
              showHeader: false,
              showTitle: false,
              borderStyle: 'none',
              cornerStyle: 'none',
              watermarkOpacity: 0,
              customBgFit: '100% 100%'
            }
          : {})
      };
      setDesign(nextDesign);
      await persistDesignToCloud(nextDesign);
    } catch (err) {
      console.error('Background upload failed:', err);
      alert('Failed to process background image. Please try another PNG/JPEG.');
    } finally {
      setBgUploading(false);
      e.target.value = '';
    }
  };

  const handleSelectCustomBg = (bgItem) => {
    const bgMode = bgItem.bgMode || design.customBgMode || 'plain';
    setDesign((prev) => ({
      ...prev,
      backgroundType: 'custom',
      customBackgroundUrl: bgItem.url,
      customBgMode: bgMode,
      ...(bgMode === 'predesigned'
        ? {
            showHeader: false,
            showTitle: false,
            borderStyle: 'none',
            cornerStyle: 'none',
            watermarkOpacity: 0,
            customBgFit: '100% 100%'
          }
        : {})
    }));
  };

  // Extract clean snapshot config without recursive preset/bg arrays
  const extractPresetSnapshot = (currentDesign) => {
    const { customTemplatePresets, customBackgrounds, activePresetId, defaultPresetId, ...rest } = currentDesign;
    return JSON.parse(JSON.stringify(rest));
  };

  const handleSaveNewTemplatePreset = async () => {
    const trimmed = String(presetNameInput || '').trim();
    const name = trimmed || `Template ${((design.customTemplatePresets || []).length + 1)}`;
    const bgUrl = design.backgroundType === 'custom' ? design.customBackgroundUrl : '';
    const newPreset = {
      id: `tpl-${Date.now()}`,
      name: name.slice(0, 32),
      bgMode: design.customBgMode || 'plain',
      orientation: design.orientation || 'landscape',
      thumbnail: bgUrl && bgUrl.length < 150000 ? bgUrl : '',
      primaryColor: design.primaryColor || '#0B2545',
      accentColor: design.accentColor || '#C59B27',
      createdAt: new Date().toLocaleDateString('en-US'),
      config: extractPresetSnapshot(design)
    };
    const nextPresets = [newPreset, ...(design.customTemplatePresets || [])];
    const nextDesign = {
      ...design,
      customTemplatePresets: nextPresets,
      activePresetId: newPreset.id,
      defaultPresetId: design.defaultPresetId || newPreset.id
    };
    setDesign(nextDesign);
    setPresetNameInput('');
    await persistDesignToCloud(nextDesign);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleUpdateActiveTemplatePreset = async () => {
    if (!design.activePresetId) return;
    const bgUrl = design.backgroundType === 'custom' ? design.customBackgroundUrl : '';
    const nextPresets = (design.customTemplatePresets || []).map((p) =>
      p.id === design.activePresetId
        ? {
            ...p,
            bgMode: design.customBgMode || 'plain',
            orientation: design.orientation || 'landscape',
            thumbnail: bgUrl && bgUrl.length < 150000 ? bgUrl : '',
            primaryColor: design.primaryColor || '#0B2545',
            accentColor: design.accentColor || '#C59B27',
            updatedAt: new Date().toLocaleDateString('en-US'),
            config: extractPresetSnapshot(design)
          }
        : p
    );
    const nextDesign = { ...design, customTemplatePresets: nextPresets };
    setDesign(nextDesign);
    await persistDesignToCloud(nextDesign);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleApplyTemplatePreset = async (preset) => {
    if (!preset?.config) return;
    const nextDesign = {
      ...DEFAULT_CERTIFICATE_DESIGN,
      ...preset.config,
      elementStyles: {
        ...DEFAULT_CERTIFICATE_DESIGN.elementStyles,
        ...(preset.config.elementStyles || {})
      },
      customBackgrounds: design.customBackgrounds || [],
      customTemplatePresets: design.customTemplatePresets || [],
      defaultPresetId: design.defaultPresetId || '',
      activePresetId: preset.id
    };
    setDesign(nextDesign);
    setAutoFitMode(true);
    await persistDesignToCloud(nextDesign);
  };

  const handleSetDefaultPreset = async (preset, e) => {
    if (e) e.stopPropagation();
    if (!preset?.config) return;
    const nextDesign = {
      ...DEFAULT_CERTIFICATE_DESIGN,
      ...preset.config,
      elementStyles: {
        ...DEFAULT_CERTIFICATE_DESIGN.elementStyles,
        ...(preset.config.elementStyles || {})
      },
      customBackgrounds: design.customBackgrounds || [],
      customTemplatePresets: design.customTemplatePresets || [],
      defaultPresetId: preset.id,
      activePresetId: preset.id
    };
    setDesign(nextDesign);
    setAutoFitMode(true);
    await persistDesignToCloud(nextDesign);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleRenameTemplatePreset = async (preset, e) => {
    if (e) e.stopPropagation();
    const nextName = window.prompt('Rename Custom Preset:', preset.name);
    if (!nextName || !nextName.trim()) return;
    const nextPresets = (design.customTemplatePresets || []).map((p) =>
      p.id === preset.id ? { ...p, name: nextName.trim().slice(0, 32) } : p
    );
    const nextDesign = { ...design, customTemplatePresets: nextPresets };
    setDesign(nextDesign);
    await persistDesignToCloud(nextDesign);
  };

  const handleDuplicateTemplatePreset = async (preset, e) => {
    if (e) e.stopPropagation();
    const copyName = `${preset.name} (Copy)`.slice(0, 32);
    const cloned = {
      ...JSON.parse(JSON.stringify(preset)),
      id: `tpl-${Date.now()}`,
      name: copyName,
      createdAt: new Date().toLocaleDateString('en-US')
    };
    const nextPresets = [cloned, ...(design.customTemplatePresets || [])];
    const nextDesign = {
      ...design,
      customTemplatePresets: nextPresets,
      activePresetId: cloned.id
    };
    setDesign(nextDesign);
    await persistDesignToCloud(nextDesign);
  };

  const handleDeleteTemplatePreset = async (presetId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this saved custom preset?')) return;
    const nextPresets = (design.customTemplatePresets || []).filter((p) => p.id !== presetId);
    const nextDesign = {
      ...design,
      customTemplatePresets: nextPresets,
      activePresetId: design.activePresetId === presetId ? '' : design.activePresetId,
      defaultPresetId: design.defaultPresetId === presetId ? '' : design.defaultPresetId
    };
    setDesign(nextDesign);
    await persistDesignToCloud(nextDesign);
  };

  // Open Dedicated "+ Add Custom Preset" Builder Modal
  const openAddCustomPresetModal = () => {
    setEditingPresetId(null);
    setPresetForm({
      name: `Custom Preset ${((design.customTemplatePresets || []).length + 1)}`,
      orientation: design.orientation || 'landscape',
      backgroundType: design.backgroundType || 'clean-white',
      customBackgroundUrl: design.customBackgroundUrl || '',
      customBgMode: design.customBgMode || 'plain',
      customBgFit: design.customBgFit || '100% 100%',
      customBgOpacity: design.customBgOpacity !== undefined ? design.customBgOpacity : 100,
      borderStyle: design.borderStyle || 'royal-double',
      cornerStyle: design.cornerStyle || 'victorian-flourish',
      watermarkOpacity: design.watermarkOpacity !== undefined ? design.watermarkOpacity : 4,
      bodyLayoutMode: design.bodyLayoutMode || 'english-only',
      durationDisplayMode: design.durationDisplayMode || 'hours',
      showHeader: design.showHeader !== false,
      showHeaderTitle: design.showHeaderTitle !== false,
      showAccreditation: design.showAccreditation !== false,
      showAffiliation: design.showAffiliation !== false,
      showLeftLogo: design.showLeftLogo !== false,
      showRightLogo: design.showRightLogo !== false,
      showHeaderDivider: design.showHeaderDivider !== false,
      showTitle: design.showTitle !== false,
      showRefBar: design.showRefBar !== false,
      showRefCertNo: design.showRefCertNo !== false,
      showRefTgid: design.showRefTgid !== false,
      showRefIssueDate: design.showRefIssueDate !== false,
      transparentRefBar: Boolean(design.transparentRefBar) || design.backgroundType === 'custom',
      showStudentPhoto: design.showStudentPhoto !== false,
      showNepaliNameSubtitle: Boolean(design.showNepaliNameSubtitle),
      showCourseLine: design.showCourseLine !== false,
      showCompetencyBadge: design.showCompetencyBadge !== false,
      showBodyText: design.showBodyText !== false,
      showQrVerification: design.showQrVerification !== false,
      sealMode: design.sealMode || 'blank',
      showSignatories: design.showSignatories !== false,
      setAsDefault: (design.customTemplatePresets || []).length === 0
    });
    setPresetModalOpen(true);
  };

  const openEditCustomPresetModal = (preset, e) => {
    if (e) e.stopPropagation();
    const cfg = preset?.config || {};
    setEditingPresetId(preset.id);
    setPresetForm({
      name: preset.name || 'Custom Preset',
      orientation: cfg.orientation || preset.orientation || 'landscape',
      backgroundType: cfg.backgroundType || 'clean-white',
      customBackgroundUrl: cfg.customBackgroundUrl || preset.thumbnail || '',
      customBgMode: cfg.customBgMode || preset.bgMode || 'plain',
      customBgFit: cfg.customBgFit || '100% 100%',
      customBgOpacity: cfg.customBgOpacity !== undefined ? cfg.customBgOpacity : 100,
      borderStyle: cfg.borderStyle || 'royal-double',
      cornerStyle: cfg.cornerStyle || 'victorian-flourish',
      watermarkOpacity: cfg.watermarkOpacity !== undefined ? cfg.watermarkOpacity : 4,
      bodyLayoutMode: cfg.bodyLayoutMode || 'english-only',
      durationDisplayMode: cfg.durationDisplayMode || 'hours',
      showHeader: cfg.showHeader !== false,
      showHeaderTitle: cfg.showHeaderTitle !== false,
      showAccreditation: cfg.showAccreditation !== false,
      showAffiliation: cfg.showAffiliation !== false,
      showLeftLogo: cfg.showLeftLogo !== false,
      showRightLogo: cfg.showRightLogo !== false,
      showHeaderDivider: cfg.showHeaderDivider !== false,
      showTitle: cfg.showTitle !== false,
      showRefBar: cfg.showRefBar !== false,
      showRefCertNo: cfg.showRefCertNo !== false,
      showRefTgid: cfg.showRefTgid !== false,
      showRefIssueDate: cfg.showRefIssueDate !== false,
      transparentRefBar: Boolean(cfg.transparentRefBar) || cfg.backgroundType === 'custom',
      showStudentPhoto: cfg.showStudentPhoto !== false,
      showNepaliNameSubtitle: Boolean(cfg.showNepaliNameSubtitle),
      showCourseLine: cfg.showCourseLine !== false,
      showCompetencyBadge: cfg.showCompetencyBadge !== false,
      showBodyText: cfg.showBodyText !== false,
      showQrVerification: cfg.showQrVerification !== false,
      sealMode: cfg.sealMode || 'blank',
      showSignatories: cfg.showSignatories !== false,
      setAsDefault: design.defaultPresetId === preset.id
    });
    setPresetModalOpen(true);
  };

  const handlePresetFormBgModeChange = (mode) => {
    setPresetForm((prev) => {
      if (!prev) return prev;
      if (mode === 'predesigned') {
        return {
          ...prev,
          customBgMode: 'predesigned',
          showHeader: false,
          showTitle: false,
          borderStyle: 'none',
          cornerStyle: 'none',
          watermarkOpacity: 0,
          transparentRefBar: true,
          showHeaderDivider: false,
          customBgFit: '100% 100%'
        };
      }
      return {
        ...prev,
        customBgMode: 'plain',
        showHeader: true,
        showTitle: true,
        borderStyle: prev.borderStyle === 'none' ? 'royal-double' : prev.borderStyle,
        cornerStyle: prev.cornerStyle === 'none' ? 'victorian-flourish' : prev.cornerStyle
      };
    });
  };

  const handlePresetFormUploadBg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Background image size must be smaller than 10MB.');
      return;
    }
    setPresetModalUploading(true);
    try {
      const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'preset-bg';
      const uploaded = await uploadCertificateBgToSupabase(file, cleanName);
      setPresetForm((prev) => ({
        ...prev,
        backgroundType: 'custom',
        customBackgroundUrl: uploaded.url,
        transparentRefBar: true
      }));
      // Also record in customBackgrounds gallery so it is reusable
      const newBg = {
        id: `custom-bg-${Date.now()}`,
        name: cleanName.slice(0, 24),
        url: uploaded.url,
        bgMode: presetForm?.customBgMode || 'plain',
        storage: uploaded.storage,
        createdAt: new Date().toLocaleDateString('en-US')
      };
      setDesign((prev) => ({
        ...prev,
        customBackgrounds: [newBg, ...(prev.customBackgrounds || [])]
      }));
    } catch (err) {
      console.error('Preset modal bg upload failed:', err);
      alert('Failed to upload background image.');
    } finally {
      setPresetModalUploading(false);
      e.target.value = '';
    }
  };

  const handleSavePresetModal = async () => {
    if (!presetForm) return;
    const cleanName = String(presetForm.name || '').trim() || `Custom Preset ${((design.customTemplatePresets || []).length + 1)}`;
    const { name, setAsDefault, ...formConfigFields } = presetForm;

    // Base config: if editing existing preset, preserve its elementStyles; if new, start from current design snapshot
    const existingPreset = editingPresetId
      ? (design.customTemplatePresets || []).find((p) => p.id === editingPresetId)
      : null;
    const baseSnapshot = existingPreset?.config
      ? JSON.parse(JSON.stringify(existingPreset.config))
      : extractPresetSnapshot(design);

    const mergedConfig = {
      ...baseSnapshot,
      ...formConfigFields
    };

    const bgUrl = mergedConfig.backgroundType === 'custom' ? mergedConfig.customBackgroundUrl : '';
    const thumb = bgUrl && bgUrl.length < 150000 ? bgUrl : '';

    let nextPresets;
    let savedId;
    if (editingPresetId && existingPreset) {
      savedId = editingPresetId;
      nextPresets = (design.customTemplatePresets || []).map((p) =>
        p.id === editingPresetId
          ? {
              ...p,
              name: cleanName.slice(0, 32),
              bgMode: mergedConfig.customBgMode || 'plain',
              orientation: mergedConfig.orientation || 'landscape',
              thumbnail: thumb,
              primaryColor: mergedConfig.primaryColor || '#0B2545',
              accentColor: mergedConfig.accentColor || '#C59B27',
              updatedAt: new Date().toLocaleDateString('en-US'),
              config: mergedConfig
            }
          : p
      );
    } else {
      savedId = `tpl-${Date.now()}`;
      const newPreset = {
        id: savedId,
        name: cleanName.slice(0, 32),
        bgMode: mergedConfig.customBgMode || 'plain',
        orientation: mergedConfig.orientation || 'landscape',
        thumbnail: thumb,
        primaryColor: mergedConfig.primaryColor || '#0B2545',
        accentColor: mergedConfig.accentColor || '#C59B27',
        createdAt: new Date().toLocaleDateString('en-US'),
        config: mergedConfig
      };
      nextPresets = [newPreset, ...(design.customTemplatePresets || [])];
    }

    const nextDesign = {
      ...DEFAULT_CERTIFICATE_DESIGN,
      ...mergedConfig,
      elementStyles: {
        ...DEFAULT_CERTIFICATE_DESIGN.elementStyles,
        ...(mergedConfig.elementStyles || {})
      },
      customBackgrounds: design.customBackgrounds || [],
      customTemplatePresets: nextPresets,
      activePresetId: savedId,
      defaultPresetId: setAsDefault ? savedId : (design.defaultPresetId || savedId)
    };

    setDesign(nextDesign);
    setPresetModalOpen(false);
    setAutoFitMode(true);
    await persistDesignToCloud(nextDesign);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
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

  const handleSaveDesign = async () => {
    await persistDesignToCloud(design);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3500);

    if (onSaveSuccess) onSaveSuccess(design);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset the entire certificate design to factory defaults?')) {
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
                Certificate Studio & Template Designer
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Full-width canvas: select controls from the top and drag & move any element directly on the canvas with your mouse.
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
                🖥️ A4 Landscape
              </ToggleButton>
              <ToggleButton value="portrait" sx={{ fontWeight: 900, px: 1.8, gap: 0.8, color: '#0F2E5A' }}>
                <CropPortraitIcon fontSize="small" />
                📄 A4 Portrait
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Option 3: Top Bar Simple Panel Toggles (Tools & Inspector) */}
            <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
              {cloudSyncState === 'saving' && <CircularProgress size={16} />}
              {cloudSyncState === 'saved' && (
                <Chip
                  size="small"
                  icon={<CloudDoneIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                  label="Saved to Supabase"
                  sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                />
              )}

              <Tooltip title={showLeftPanel ? 'Hide Left Tools Panel' : 'Show Left Tools Panel'}>
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
                  🛠️ Tools {showLeftPanel ? '✓' : '✗'}
                </Button>
              </Tooltip>

              <Tooltip title={showRightPanel ? 'Hide Right Inspector' : 'Show Right Inspector'}>
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
                  🎨 Inspector {showRightPanel ? '✓' : '✗'}
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
              Default
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handleTestPrint}
              sx={{ fontWeight: 800, borderColor: '#0B2545', color: '#0B2545' }}
            >
              Test Print
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
              Save Design
            </Button>
          </Stack>
        </Box>

        {savedAlert && (
          <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2, fontWeight: 700 }}>
            ✓ Certificate design saved successfully! All newly issued certificates will print with these positions and fonts.
          </Alert>
        )}

      </Paper>

      {/* ============================================================== */}
      {/* 2. 3-COLUMN STUDIO LAYOUT (LEFT: TOOLS | CENTER: CANVAS | RIGHT: INSPECTOR) */}
      {/* ============================================================== */}
      <Box
        ref={studioContainerRef}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: !showLeftPanel && !showRightPanel ? 'center' : 'flex-start',
          gap: 1.5,
          height: { xs: 'auto', lg: 'calc(100dvh - 165px)' },
          minHeight: { xs: 'auto', lg: '740px' }
        }}
      >
        {/* ========================================================== */}
        {/* COLUMN 1: LEFT TOOLS & SETTINGS PANEL (Responsive Flex)    */}
        {/* ========================================================== */}
        {showLeftPanel && (
          <Paper
            elevation={1}
            sx={{
              width: { xs: '100%', lg: 'auto' },
              flex: { xs: 'none', lg: '1 1 290px' },
              minWidth: { xs: '100%', lg: 260 },
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2.5,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              overflow: 'hidden',
              transition: 'flex-basis 180ms ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header of Left Panel with Close Button */}
            <Box sx={{ p: 1.2, bgcolor: '#0F2E5A', color: '#FFFFFF', borderBottom: '2px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TuneIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                Studio Tools & Options
              </Typography>
              <Tooltip title="Hide Left Tools">
                <IconButton size="small" onClick={handleToggleLeftPanel} sx={{ color: '#FFFFFF', p: 0.2 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

          {/* Left Vertical Tabs Navigation Buttons */}
          <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <Grid container spacing={0.6}>
              {[
                { id: 0, label: 'Letterhead & Logo', icon: <BrandingWatermarkIcon sx={{ fontSize: 16 }} /> },
                { id: 1, label: 'Background (10)', icon: <WallpaperIcon sx={{ fontSize: 16 }} /> },
                { id: 2, label: 'Border & Corners', icon: <BorderStyleIcon sx={{ fontSize: 16 }} /> },
                { id: 3, label: 'Stamp & Signatures', icon: <EditNoteIcon sx={{ fontSize: 16 }} /> },
                { id: 4, label: 'Calibration', icon: <TuneIcon sx={{ fontSize: 16 }} /> },
                { id: 5, label: 'Layers List', icon: <LayersIcon sx={{ fontSize: 16 }} /> }
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
                    Main Institutional Name (Single Heading):
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={design.instituteName}
                    onChange={(e) => handleUpdate('instituteName', e.target.value)}
                    placeholder="Prabidhik School, Jorpati"
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.4 }}>
                    Accreditation / Sub-title:
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
                    Registration, Affiliation Code & Location:
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
                    All Sections &amp; Elements Visibility (ON / OFF):
                  </Typography>
                  <Stack spacing={0.35}>
                    <FormControlLabel
                      control={<Switch checked={design.showHeader !== false} onChange={(e) => handleUpdate('showHeader', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Institutional Header</Typography>}
                    />
                    {design.showHeader !== false && (
                      <Stack spacing={0.2} sx={{ pl: 2.2, borderLeft: '2px solid #E2E8F0', my: 0.2 }}>
                        <FormControlLabel
                          control={<Switch checked={design.showHeaderTitle !== false} onChange={(e) => handleUpdate('showHeaderTitle', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Main Institute Name</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={design.showAccreditation !== false} onChange={(e) => handleUpdate('showAccreditation', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Accreditation Sub-title</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={design.showAffiliation !== false} onChange={(e) => handleUpdate('showAffiliation', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Regd. No / CTEVT / Address</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={design.showLeftLogo !== false} onChange={(e) => handleUpdate('showLeftLogo', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Left Logo</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={design.showRightLogo !== false} onChange={(e) => handleUpdate('showRightLogo', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Right Badge / Logo</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={design.showHeaderDivider !== false && design.backgroundType !== 'custom'} onChange={(e) => handleUpdate('showHeaderDivider', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Header Bottom Divider Line</Typography>}
                        />
                      </Stack>
                    )}
                    <FormControlLabel
                      control={<Switch checked={design.showTitle !== false} onChange={(e) => handleUpdate('showTitle', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Main Certificate Title</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={design.showRefBar !== false} onChange={(e) => handleUpdate('showRefBar', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Reference Bar</Typography>}
                    />
                    {design.showRefBar !== false && (
                      <Stack spacing={0.2} sx={{ pl: 2.2, borderLeft: '2px solid #E2E8F0', my: 0.2 }}>
                        <FormControlLabel
                          control={<Switch checked={design.showRefCertNo !== false} onChange={(e) => handleUpdate('showRefCertNo', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Certificate No (Independent Drag)</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={design.showRefTgid !== false} onChange={(e) => handleUpdate('showRefTgid', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Registration / TGID (Independent Drag)</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={design.showRefIssueDate !== false} onChange={(e) => handleUpdate('showRefIssueDate', e.target.checked)} size="small" />}
                          label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Issue Date (Independent Drag)</Typography>}
                        />
                      </Stack>
                    )}
                    <FormControlLabel
                      control={<Switch checked={design.transparentRefBar || design.backgroundType === 'custom'} onChange={(e) => handleUpdate('transparentRefBar', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Transparent Reference Bar (No White Box)</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={design.showStudentPhoto !== false} onChange={(e) => handleUpdate('showStudentPhoto', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Student Photo (PP Photo)</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={Boolean(design.showNepaliNameSubtitle)} onChange={(e) => handleUpdate('showNepaliNameSubtitle', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Nepali Name Subtitle</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={design.showCourseLine !== false} onChange={(e) => handleUpdate('showCourseLine', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Course Highlight Line</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={design.showBodyText !== false} onChange={(e) => handleUpdate('showBodyText', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Body Paragraph</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={design.showQrVerification !== false} onChange={(e) => handleUpdate('showQrVerification', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show QR Code Verification</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={design.sealMode !== 'none'}
                          onChange={(e) => handleUpdate('sealMode', e.target.checked ? 'blank' : 'none')}
                          size="small"
                        />
                      }
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Official Seal / Stamp Space</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={design.showSignatories !== false} onChange={(e) => handleUpdate('showSignatories', e.target.checked)} size="small" />}
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Signatories</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={design.showCompetencyBadge !== false}
                          onChange={(e) => handleUpdate('showCompetencyBadge', e.target.checked)}
                          size="small"
                        />
                      }
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Show Level / Hours Badge</Typography>}
                    />
                  </Stack>

                  {design.showCompetencyBadge !== false && (
                    <Stack spacing={1} sx={{ mt: 1, pt: 1, borderTop: '1px dashed #CBD5E1' }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Badge Title (leave blank for Course Level)"
                        placeholder="e.g. SKILL CERTIFIED / CTEVT LEVEL 1"
                        value={design.competencyBadgeTitle ?? ''}
                        onChange={(e) => handleUpdate('competencyBadgeTitle', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: '#FFFFFF', '& .MuiInputBase-input': { fontSize: '0.74rem', py: 0.6 } }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Hours Text (leave blank for Course Hours)"
                        placeholder="e.g. 390 HRS"
                        value={design.hoursBadgeText ?? ''}
                        onChange={(e) => handleUpdate('hoursBadgeText', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: '#FFFFFF', '& .MuiInputBase-input': { fontSize: '0.74rem', py: 0.6 } }}
                      />
                    </Stack>
                  )}

                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mt: 1.2, mb: 0.6 }}>
                    Upload Custom Logo (PNG):
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.68rem', fontWeight: 700, flex: 1 }}>
                      Left Logo
                      <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('leftLogoUrl', e)} />
                    </Button>
                    <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.68rem', fontWeight: 700, flex: 1 }}>
                      Right Logo
                      <input type="file" hidden accept="image/*" onChange={(e) => handleImageUploadGeneric('rightLogoUrl', e)} />
                    </Button>
                  </Stack>
                </Box>

                {/* Body Language & Duration Format Controls */}
                <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 1 }}>
                    🌐 Body Language &amp; Duration Format
                  </Typography>
                  <Stack spacing={1.2}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Certificate Body Language"
                      value={design.bodyLayoutMode || 'english-only'}
                      onChange={(e) => handleUpdate('bodyLayoutMode', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    >
                      <MenuItem value="english-only">English Only (Official Default)</MenuItem>
                      <MenuItem value="bilingual">Bilingual (English + नेपाली)</MenuItem>
                      <MenuItem value="nepali-only">Nepali Only (नेपाली मात्र)</MenuItem>
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Course Duration Display"
                      value={design.durationDisplayMode || 'hours'}
                      onChange={(e) => handleUpdate('durationDisplayMode', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    >
                      <MenuItem value="hours">Hours Only (e.g. 390 Hours / 178 Hours)</MenuItem>
                      <MenuItem value="unit">Course Unit (e.g. 15 Days / 3 Months / 6 Weeks)</MenuItem>
                      <MenuItem value="both">Both (e.g. 3 Months (390 Hours))</MenuItem>
                    </TextField>
                  </Stack>
                </Box>

                <Alert severity="info" sx={{ fontSize: '0.7rem', py: 0.5, borderRadius: 1.5 }}>
                  💡 Tip: Click on any logo or text on the canvas and drag it anywhere with your mouse.
                </Alert>
              </Stack>
            )}

            {/* TAB 1: BACKGROUND PRESETS & CUSTOM GALLERY */}
            {activeLeftTab === 1 && (
              <Stack spacing={2}>
                {/* 1. Default Built-in Presets */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 1 }}>
                    🏛️ 10 Default Background Presets:
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

                {/* 3. FULL CUSTOM TEMPLATE PRESETS GALLERY (Save, 1-Click Apply, Update, Delete) */}
                <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', fontSize: '0.73rem' }}>
                        ⭐ My Saved Custom Presets ({(design.customTemplatePresets || []).length})
                      </Typography>
                      {cloudSyncState === 'saving' && (
                        <CircularProgress size={12} />
                      )}
                      {cloudSyncState === 'saved' && (
                        <Chip
                          size="small"
                          icon={<CloudDoneIcon sx={{ fontSize: '12px !important', color: '#059669 !important' }} />}
                          label="Cloud Saved"
                          sx={{ height: 17, fontSize: '0.58rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                        />
                      )}
                    </Box>
                    {design.activePresetId && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleUpdateActiveTemplatePreset}
                        sx={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          py: 0.2,
                          px: 0.8,
                          minWidth: 0,
                          borderColor: '#0284C7',
                          color: '#0369A1',
                          bgcolor: '#FFFFFF',
                          textTransform: 'none'
                        }}
                      >
                        Update Active
                      </Button>
                    )}
                  </Box>

                  {/* Primary "+ Add Custom Preset" Button right below Default Presets */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={openAddCustomPresetModal}
                    sx={{
                      mb: 1.25,
                      bgcolor: '#0F2E5A',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      py: 0.85,
                      textTransform: 'none',
                      borderRadius: 1.8,
                      '&:hover': { bgcolor: '#1E3A8A' }
                    }}
                  >
                    + Add Custom Preset (All Options)
                  </Button>

                  {(design.customTemplatePresets || []).length > 0 ? (
                    <Grid container spacing={0.9}>
                      {(design.customTemplatePresets || []).map((preset) => {
                        const isActive = design.activePresetId === preset.id;
                        const isDefault = design.defaultPresetId === preset.id;
                        const thumbUrl = preset.thumbnail || preset.config?.customBackgroundUrl || '';
                        return (
                          <Grid item xs={6} key={preset.id}>
                            <Paper
                              onClick={() => handleApplyTemplatePreset(preset)}
                              elevation={isActive ? 2 : 0}
                              sx={{
                                p: 0.75,
                                cursor: 'pointer',
                                borderRadius: 1.8,
                                border: isActive ? '2px solid #0284C7' : isDefault ? '1.5px solid #F59E0B' : '1px solid #CBD5E1',
                                bgcolor: isActive ? '#FFFFFF' : '#F8FAFC',
                                '&:hover': { borderColor: '#0284C7', bgcolor: '#FFFFFF' }
                              }}
                            >
                              <Box
                                sx={{
                                  height: 48,
                                  borderRadius: 1,
                                  backgroundImage: thumbUrl ? `url(${thumbUrl})` : 'none',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  bgcolor: preset.primaryColor || '#0F2E5A',
                                  border: `2px solid ${preset.accentColor || '#C59B27'}`,
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  justifyContent: 'space-between',
                                  p: 0.4
                                }}
                              >
                                {isDefault && (
                                  <Chip
                                    size="small"
                                    label="★ Default"
                                    sx={{
                                      position: 'absolute',
                                      top: 3,
                                      left: 3,
                                      height: 15,
                                      fontSize: '0.52rem',
                                      fontWeight: 900,
                                      bgcolor: '#F59E0B',
                                      color: '#0F172A'
                                    }}
                                  />
                                )}
                                <Chip
                                  size="small"
                                  label={preset.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                                  sx={{ height: 15, fontSize: '0.52rem', fontWeight: 800, bgcolor: 'rgba(15,23,42,0.82)', color: '#FFFFFF' }}
                                />
                                <Chip
                                  size="small"
                                  label={preset.bgMode === 'predesigned' ? 'Heading' : 'Plain'}
                                  sx={{
                                    height: 15,
                                    fontSize: '0.52rem',
                                    fontWeight: 800,
                                    bgcolor: preset.bgMode === 'predesigned' ? '#F59E0B' : '#059669',
                                    color: preset.bgMode === 'predesigned' ? '#0F172A' : '#FFFFFF'
                                  }}
                                />
                              </Box>

                              <Typography
                                variant="caption"
                                noWrap
                                sx={{ fontWeight: isActive ? 900 : 700, color: '#0F172A', fontSize: '0.66rem', display: 'block', mt: 0.5 }}
                                title={preset.name}
                              >
                                {preset.name}
                              </Typography>

                              {/* Quick Actions Row: Set Default ★ | Rename | Duplicate | Delete */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.35, pt: 0.35, borderTop: '1px solid #E2E8F0' }}>
                                <Tooltip title={isDefault ? 'Default Preset' : 'Set as Default ★'}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleSetDefaultPreset(preset, e)}
                                    sx={{ p: 0.2, color: isDefault ? '#D97706' : '#94A3B8', '&:hover': { color: '#D97706' } }}
                                  >
                                    {isDefault ? <StarIcon sx={{ fontSize: 14 }} /> : <StarBorderIcon sx={{ fontSize: 14 }} />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit All Options of this Preset">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => openEditCustomPresetModal(preset, e)}
                                    sx={{ p: 0.2, color: '#475569', '&:hover': { color: '#0F2C59' } }}
                                  >
                                    <EditIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Duplicate / Copy Preset">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleDuplicateTemplatePreset(preset, e)}
                                    sx={{ p: 0.2, color: '#0284C7', '&:hover': { color: '#0369A1' } }}
                                  >
                                    <ContentCopyIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Preset">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleDeleteTemplatePreset(preset.id, e)}
                                    sx={{ p: 0.2, color: '#DC2626' }}
                                  >
                                    <CloseIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.66rem', display: 'block', lineHeight: 1.35 }}>
                      आफ्नो ब्याकग्राउन्ड, पोजिसन र लेआउट मिलाएर माथि नाम लेखी <b>+ Save</b> थिच्नुहोस् — Supabase Cloud मा सुरक्षित सेभ हुन्छ।
                    </Typography>
                  )}
                </Box>

                {/* 2. Custom Uploaded Presets Library */}
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      🖼️ My Custom Backgrounds (Custom Presets):
                    </Typography>
                    {design.backgroundType === 'custom' && (
                      <Chip
                        label="✓ Active"
                        size="small"
                        sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 900, fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                  </Box>

                  {/* Background Mode Selector: Plain Frame vs Pre-Designed (Heading Included) */}
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.6, fontSize: '0.68rem' }}>
                      Background Type (अपलोड गर्नुअघि छान्नुहोस्):
                    </Typography>
                    <Grid container spacing={0.8}>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          size="small"
                          variant={(design.customBgMode || 'plain') === 'plain' ? 'contained' : 'outlined'}
                          onClick={() => handleApplyBgMode('plain')}
                          sx={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            py: 0.65,
                            textTransform: 'none',
                            bgcolor: (design.customBgMode || 'plain') === 'plain' ? '#0F2E5A' : '#FFFFFF',
                            color: (design.customBgMode || 'plain') === 'plain' ? '#FFFFFF' : '#334155',
                            borderColor: '#CBD5E1'
                          }}
                        >
                          Plain / Frame
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          size="small"
                          variant={design.customBgMode === 'predesigned' ? 'contained' : 'outlined'}
                          onClick={() => handleApplyBgMode('predesigned')}
                          sx={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            py: 0.65,
                            textTransform: 'none',
                            bgcolor: design.customBgMode === 'predesigned' ? '#D97706' : '#FFFFFF',
                            color: design.customBgMode === 'predesigned' ? '#FFFFFF' : '#334155',
                            borderColor: '#CBD5E1',
                            '&:hover': { bgcolor: design.customBgMode === 'predesigned' ? '#B45309' : '#FFFBEB' }
                          }}
                        >
                          Heading Included
                        </Button>
                      </Grid>
                    </Grid>
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.64rem', display: 'block', mt: 0.5, lineHeight: 1.3 }}>
                      {design.customBgMode === 'predesigned'
                        ? 'Pre-Designed: सिस्टमको Header, Title र Border स्वतः OFF हुन्छ — केवल विद्यार्थीको विवरण मात्र देखिन्छ।'
                        : 'Plain / Frame: सिस्टमको Header, Logos, Title र Border सामान्य रूपमा ON रहन्छ।'}
                    </Typography>
                  </Box>

                  {/* Upload New Background Button (Uploads to Supabase Storage) */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    component="label"
                    disabled={bgUploading}
                    startIcon={bgUploading ? <CircularProgress size={14} color="inherit" /> : <UploadFileIcon />}
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
                    {bgUploading
                      ? 'Uploading to Cloud Storage...'
                      : `+ Upload Background (${design.customBgMode === 'predesigned' ? 'Heading Included' : 'Plain'})`}
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
                                <Tooltip title="Delete this background">
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
                        No custom background images uploaded yet. Choose an image using the button above.
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
                            Background Opacity:
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
                          Display Fit Mode:
                        </Typography>
                        <ToggleButtonGroup
                          value={design.customBgFit || 'cover'}
                          exclusive
                          onChange={(e, val) => val && handleUpdate('customBgFit', val)}
                          size="small"
                          fullWidth
                        >
                          <ToggleButton value="cover" sx={{ fontSize: '0.65rem', fontWeight: 800, py: 0.4 }}>
                            Full Page (Cover)
                          </ToggleButton>
                          <ToggleButton value="contain" sx={{ fontSize: '0.65rem', fontWeight: 800, py: 0.4 }}>
                            Fit Ratio (Contain)
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* 3. Watermark Opacity (Global) */}
                <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                    Logo Watermark Opacity ({design.watermarkOpacity}%):
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
                    A) 7 Border Styles:
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
                    B) Corner Ornaments:
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
                    Border Margin ({design.borderMargin} mm):
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
                    Border Width ({design.borderWidth} px):
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
                    Official Stamp Mode (4 Options):
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
                      ⭕ Blank Space (Manual Wet Stamp)
                    </ToggleButton>
                    <ToggleButton value="scanned" sx={{ fontSize: '0.68rem', fontWeight: 800, justifyContent: 'flex-start', py: 0.6 }}>
                      📷 Scanned Stamp (Upload Stamp PNG)
                    </ToggleButton>
                    <ToggleButton value="digital" sx={{ fontSize: '0.68rem', fontWeight: 800, justifyContent: 'flex-start', py: 0.6 }}>
                      ★ Digital Seal (Graphic Stamp)
                    </ToggleButton>
                    <ToggleButton value="none" sx={{ fontSize: '0.68rem', fontWeight: 800, justifyContent: 'flex-start', py: 0.6, color: '#DC2626' }}>
                      ❌ No Stamp (None)
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {design.sealMode === 'scanned' && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: '#F0F9FF', borderRadius: 1.5, border: '1px dashed #0284C7' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1', display: 'block', mb: 0.5 }}>
                        Scanned Image of Official Rubber Stamp:
                      </Typography>
                      <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.68rem', width: '100%' }}>
                        Choose Stamp Image
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
                      Signatories ({design.signatories?.length || 0}):
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={handleAddSignatory}
                      sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: '#059669', py: 0.3 }}
                    >
                      + Add
                    </Button>
                  </Box>

                  <Stack spacing={1}>
                    {(design.signatories || []).map((sig, idx) => (
                      <Paper key={sig.id} variant="outlined" sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                            Signatory #{idx + 1}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => handleDeleteSignatory(sig.id)} sx={{ p: 0.2 }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          label="Name"
                          value={sig.name}
                          onChange={(e) => handleUpdateSignatory(sig.id, 'name', e.target.value)}
                          sx={{ mb: 0.8, bgcolor: '#FFFFFF', '& input': { py: 0.5, fontSize: '0.72rem' } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Title"
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
                        Print Text Only (Text-Only Mode)
                      </Typography>
                    }
                  />
                  <Typography variant="caption" sx={{ color: '#78350F', display: 'block', mt: 0.5, fontSize: '0.67rem' }}>
                    Enable this mode to print only the trainee's name and details on pre-printed stationery that already has borders and the institute header.
                  </Typography>
                </Box>

                <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                    Vertical Shift Calibration (Y-Offset: {design.offsetY} mm):
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
                    Shift vertically up or down to align accurately with pre-printed paper borders in your printer.
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* TAB 5: ELEMENT LAYERS */}
            {activeLeftTab === 5 && (
              <Stack spacing={0.8}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block' }}>
                  Canvas Layers List (Click to Select & Move):
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
        {/* COLUMN 2: CENTER LIVE CANVAS WORKSPACE (Dynamic Zoom Width) */}
        {/* ========================================================== */}
        <Box
          sx={{
            width: { xs: '100%', lg: `${dynamicCenterWindowWidth}px` },
            flexShrink: 0,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#1E293B',
            borderRadius: 2.5,
            overflow: 'hidden',
            transition: isDragging ? 'none' : 'width 180ms ease-out',
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
                <Tooltip title="Open Left Tools Panel">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<TuneIcon fontSize="small" />}
                    onClick={handleToggleLeftPanel}
                    sx={{ bgcolor: '#0F2E5A', fontSize: '0.68rem', fontWeight: 800, py: 0.3, px: 1, borderRadius: 1.5 }}
                  >
                    🛠️ Open Tools
                  </Button>
                </Tooltip>
              )}
              {!showRightPanel && (
                <Tooltip title="Open Right Inspector Panel">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AutoAwesomeIcon fontSize="small" />}
                    onClick={handleToggleRightPanel}
                    sx={{ bgcolor: '#0284C7', fontSize: '0.68rem', fontWeight: 800, py: 0.3, px: 1, borderRadius: 1.5 }}
                  >
                    🎨 Open Inspector
                  </Button>
                </Tooltip>
              )}
              {!showLeftPanel && !showRightPanel && (
                <Chip
                  label="🖥️ Full Landscape Focus"
                  size="small"
                  sx={{ bgcolor: '#059669', color: '#FFFFFF', fontWeight: 900, fontSize: '0.7rem' }}
                />
              )}
              <Chip
                icon={<DragIndicatorIcon sx={{ color: '#38BDF8 !important' }} />}
                label="💡 Drag with mouse to reposition"
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
                  label={`Selected: ${ELEMENT_LABELS[selectedElement] || selectedElement}`}
                  size="small"
                  onDelete={() => setSelectedElement(null)}
                  sx={{ bgcolor: '#F59E0B', color: '#0F172A', fontWeight: 900, fontSize: '0.7rem' }}
                />
              )}
            </Box>

            {/* Canvas Zoom & Aspect Ratio Controls */}
            <Stack direction="row" spacing={0.6} alignItems="center">
              <Tooltip title="Zoom Out">
                <IconButton
                  size="small"
                  onClick={() => {
                    setAutoFitMode(false);
                    setPreviewScale((p) => Math.max(0.25, Math.round((p - 0.05) * 100) / 100));
                  }}
                  sx={{ color: '#E2E8F0', bgcolor: '#1E293B' }}
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Typography variant="caption" sx={{ color: '#F8FAFC', fontWeight: 900, fontFamily: 'monospace', px: 0.8 }}>
                {Math.round(previewScale * 100)}%
              </Typography>

              <Tooltip title="Zoom In">
                <IconButton
                  size="small"
                  onClick={() => {
                    setAutoFitMode(false);
                    setPreviewScale((p) => Math.min(1.2, Math.round((p + 0.05) * 100) / 100));
                  }}
                  sx={{ color: '#E2E8F0', bgcolor: '#1E293B' }}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Auto-Fit to View (Landscape & Portrait)">
                <IconButton
                  size="small"
                  onClick={() => {
                    setAutoFitMode(true);
                    setPreviewScale(computeFitScale());
                  }}
                  sx={{
                    color: autoFitMode ? '#0F172A' : '#38BDF8',
                    bgcolor: autoFitMode ? '#38BDF8' : '#1E293B',
                    '&:hover': { bgcolor: autoFitMode ? '#7DD3FC' : '#334155' }
                  }}
                >
                  <FitScreenIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Button
                size="small"
                onClick={() => {
                  setAutoFitMode(false);
                  setPreviewScale(1.0);
                }}
                sx={{ color: '#CBD5E1', fontSize: '0.68rem', fontWeight: 800, minWidth: 32 }}
              >
                100%
              </Button>
            </Stack>
          </Box>

          {/* Scrollable Viewport containing the True A4 Certificate Canvas */}
          <Box
            ref={canvasViewportRef}
            sx={{
              flex: 1,
              overflow: autoFitMode ? 'hidden' : 'auto',
              p: { xs: 1.5, sm: 2 },
              display: 'flex',
              justifyContent: !autoFitMode && scaledCanvasWidth > dynamicCenterWindowWidth - 28 ? 'flex-start' : 'center',
              alignItems: !autoFitMode && scaledCanvasHeight > studioSize.height - 96 ? 'flex-start' : 'center',
              userSelect: isDragging ? 'none' : 'auto'
            }}
          >
            {/* Exact Scaled Bounding Frame — eliminates ghost scrollbars in both Landscape & Portrait */}
            <Box
              id="studioCanvasScaleFrame"
              sx={{
                width: `${Math.round(baseCanvasWidth * previewScale)}px`,
                height: `${Math.round(baseCanvasHeight * previewScale)}px`,
                position: 'relative',
                flexShrink: 0,
                boxShadow: '0 14px 36px rgba(0,0,0,0.42)',
                borderRadius: '4px',
                overflow: 'visible'
              }}
            >
              {/* The Live Certificate Canvas with Proportional True A4 Aspect Ratio */}
              <Box
                id="liveCertificateStudioCanvas"
                sx={{
                  width: `${baseCanvasWidth}px`,
                  minHeight: `${baseCanvasHeight}px`,
                  p: `${design.borderMargin}mm`,
                  boxSizing: 'border-box',
                  fontFamily: "'Times New Roman', serif",
                  color: '#0F172A',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transform: `scale(${previewScale}) translate(${design.offsetX}px, ${design.offsetY}px)`,
                  transformOrigin: 'top left',
                  transition: isDragging ? 'none' : 'transform 0.15s ease',
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
              {design.showHeader !== false && (
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 3,
                    pb: 1,
                    borderBottom:
                      design.showHeaderDivider !== false && design.backgroundType !== 'custom'
                        ? `1.5px solid ${design.accentColor}`
                        : 'none'
                  }}
                >
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
                      {design.showHeaderTitle !== false && (
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
                      )}

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
              {design.showTitle !== false && (
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
              )}

              {/* 3. Reference Tracking Bar — Each of the 3 values is independently draggable & toggleable */}
              {design.showRefBar !== false && (
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 3,
                    py: 0.5,
                    bgcolor: (design.transparentRefBar || design.backgroundType === 'custom') ? 'transparent' : '#F8FAFC',
                    borderTop: (design.transparentRefBar || design.backgroundType === 'custom') ? 'none' : '1px solid #E2E8F0',
                    borderBottom: (design.transparentRefBar || design.backgroundType === 'custom') ? 'none' : '1px solid #E2E8F0',
                    transform: `translate(${design.elementStyles?.refBar?.x || 0}px, ${design.elementStyles?.refBar?.y || 0}px)`
                  }}
                >
                  {design.showRefCertNo !== false ? (
                    <Box
                      onClick={(e) => { e.stopPropagation(); setSelectedElement('refCertNo'); }}
                      onMouseDown={(e) => handleMouseDownOnElement(e, 'refCertNo')}
                      sx={{
                        position: 'relative',
                        zIndex: selectedElement === 'refCertNo' ? 12 : 3,
                        fontSize: `${design.elementStyles?.refCertNo?.fontSize || 12}px`,
                        fontWeight: design.elementStyles?.refCertNo?.fontWeight || 700,
                        color: design.elementStyles?.refCertNo?.color || '#334155',
                        transform: `translate(${design.elementStyles?.refCertNo?.x || 0}px, ${design.elementStyles?.refCertNo?.y || 0}px)`,
                        cursor: isDragging && selectedElement === 'refCertNo' ? 'grabbing' : 'grab',
                        outline: selectedElement === 'refCertNo' ? '2px dashed #0284c7' : '1px dashed transparent',
                        outlineOffset: '3px',
                        borderRadius: '4px',
                        px: 0.5
                      }}
                    >
                      Certificate No: <b style={{ color: design.primaryColor }}>{currentSample.certNo}</b>
                    </Box>
                  ) : <Box />}

                  {design.showRefTgid !== false ? (
                    <Box
                      onClick={(e) => { e.stopPropagation(); setSelectedElement('refTgid'); }}
                      onMouseDown={(e) => handleMouseDownOnElement(e, 'refTgid')}
                      sx={{
                        position: 'relative',
                        zIndex: selectedElement === 'refTgid' ? 12 : 3,
                        fontSize: `${design.elementStyles?.refTgid?.fontSize || 12}px`,
                        fontWeight: design.elementStyles?.refTgid?.fontWeight || 700,
                        color: design.elementStyles?.refTgid?.color || '#334155',
                        transform: `translate(${design.elementStyles?.refTgid?.x || 0}px, ${design.elementStyles?.refTgid?.y || 0}px)`,
                        cursor: isDragging && selectedElement === 'refTgid' ? 'grabbing' : 'grab',
                        outline: selectedElement === 'refTgid' ? '2px dashed #0284c7' : '1px dashed transparent',
                        outlineOffset: '3px',
                        borderRadius: '4px',
                        px: 0.5
                      }}
                    >
                      Registration / TGID: <b style={{ color: design.primaryColor }}>{currentSample.tgid}</b>
                    </Box>
                  ) : <Box />}

                  {design.showRefIssueDate !== false ? (
                    <Box
                      onClick={(e) => { e.stopPropagation(); setSelectedElement('refIssueDate'); }}
                      onMouseDown={(e) => handleMouseDownOnElement(e, 'refIssueDate')}
                      sx={{
                        position: 'relative',
                        zIndex: selectedElement === 'refIssueDate' ? 12 : 3,
                        fontSize: `${design.elementStyles?.refIssueDate?.fontSize || 12}px`,
                        fontWeight: design.elementStyles?.refIssueDate?.fontWeight || 700,
                        color: design.elementStyles?.refIssueDate?.color || '#334155',
                        transform: `translate(${design.elementStyles?.refIssueDate?.x || 0}px, ${design.elementStyles?.refIssueDate?.y || 0}px)`,
                        cursor: isDragging && selectedElement === 'refIssueDate' ? 'grabbing' : 'grab',
                        outline: selectedElement === 'refIssueDate' ? '2px dashed #0284c7' : '1px dashed transparent',
                        outlineOffset: '3px',
                        borderRadius: '4px',
                        px: 0.5
                      }}
                    >
                      Issue Date: <b>{currentSample.issueDate}</b>
                    </Box>
                  ) : <Box />}
                </Box>
              )}

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
                {design.elementStyles?.photo?.preset === 'left' && design.showStudentPhoto !== false && (
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
                          {(design.competencyBadgeTitle || '').trim() || 'SKILL CERTIFIED'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.56rem', color: '#64748B', display: 'block' }}>
                          {(design.hoursBadgeText || '').trim() || currentSample.hoursBadge}
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
                    This is proudly awarded to:
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
                  {Boolean(design.showNepaliNameSubtitle) && (
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
                  )}
                  {design.showCourseLine !== false && (
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
                  )}
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
              {/* 5. ENGLISH & NEPALI WORDING PARAGRAPHS (MOVABLE & TOGGLEABLE)  */}
              {/* ============================================================== */}
              {design.showBodyText !== false && (
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
                {((design.bodyLayoutMode || 'english-only') === 'bilingual' || (design.bodyLayoutMode || 'english-only') === 'english-only') && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: design.elementStyles?.body?.fontFamily || "'Times New Roman', serif",
                      fontWeight: design.elementStyles?.body?.fontWeight || 'normal',
                      fontStyle: design.elementStyles?.body?.fontStyle || 'normal',
                      fontSize: `${design.elementStyles?.body?.fontSize || (isPortrait ? 14 : 13.5)}px`,
                      lineHeight: design.elementStyles?.body?.lineHeight || 1.5,
                      color: design.elementStyles?.body?.color || '#1E293B',
                      mb: (design.bodyLayoutMode || 'english-only') === 'bilingual' ? 0.8 : 0
                    }}
                  >
                    This is to certify that Mr./Ms. <b>{currentSample.nameEn}</b>, born on <b>2000-05-03</b>, Son/Daughter of Mr./Mrs. <b>{currentSample.parentEn}</b> and inhabitant of <b>{currentSample.addressEn}</b>, has successfully completed <b>{design.durationDisplayMode === 'unit' ? '3 Months' : design.durationDisplayMode === 'both' ? '3 Months (390 Hours)' : '390 Hours'}</b> skills training on <b>{currentSample.courseEn}</b> provided by this institute from <b>2026-01-10</b> to <b>2026-04-10</b>. During the training period his/her performance was <b>Very Good</b>.
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
                      lineHeight: design.elementStyles?.body?.lineHeight || 1.55,
                      color: design.elementStyles?.body?.color || '#1E293B'
                    }}
                  >
                    <b>जोरपाटी-०५, काठमाडौँ</b> निवासी श्री/श्रीमती <b>हरि शर्मा</b> का सुपुत्र/सुपुत्री (जन्म मिति: <b>२०००-०५-०३</b>) श्री/सुश्री <b>प्रशिक्षार्थीको नाम</b> ले यस संस्थाद्वारा मिति <b>२०२६-०१-१०</b> देखि <b>२०२६-०४-१०</b> सम्म सञ्चालित <b>{design.durationDisplayMode === 'unit' ? '३ महिना' : design.durationDisplayMode === 'both' ? '३ महिना (३९० घण्टा)' : '३९० घण्टा'}</b>को <b>"{currentSample.courseEn}"</b> सीपमूलक तालीम सफलतापूर्वक सम्पन्न गर्नुभएकोमा यो <b>प्रमाण-पत्र</b> प्रदान गरिएको छ। तालीम अवधिमा उहाँको कार्यसम्पादन <b>अति उत्तम</b> रहेको थियो।
                  </Typography>
                )}
              </Box>

              )}

              {/* ============================================================== */}
              {/* 6. FOOTER: DYNAMIC QR + OFFICIAL SEAL (4 MODES) + SIGNATORIES  */}
              {/* ============================================================== */}
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  mt: isPortrait ? 2.5 : 1.2,
                  pt: 1.2,
                  borderTop: design.backgroundType === 'custom' ? 'none' : '1px solid #CBD5E1',
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
                        <QRCodeSVG value={`https://globalera.com.np/verify?cert=${currentSample.certNo}`} size={design.elementStyles?.qrCode?.qrSize || 54} level="M" />
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
                            [ Upload Scanned Stamp ]
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
                          (Space for manual<br />stamp after printing)
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
                          Prabidhik School, Jorpati
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Right: Dynamic Signatories List (Independently Movable) */}
                {design.showSignatories !== false && (
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
                )}
              </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ========================================================== */}
        {/* COLUMN 3: RIGHT INSPECTOR & PRESETS PANEL (Responsive Flex) */}
        {/* ========================================================== */}
        {showRightPanel && (
          <Box
            sx={{
              width: { xs: '100%', lg: 'auto' },
              flex: { xs: 'none', lg: '1 1 280px' },
              minWidth: { xs: '100%', lg: 250 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              overflowY: 'auto',
              transition: 'flex-basis 180ms ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Bar for Right Inspector */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Tooltip title="Hide Right Inspector">
                <Button
                  size="small"
                  onClick={handleToggleRightPanel}
                  endIcon={<CloseIcon fontSize="small" />}
                  sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', p: '2px 8px', bgcolor: '#F1F5F9', borderRadius: 1.5 }}
                >
                  Close Inspector
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
                      Position Control:
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0369A1' }}>
                      X:{activeStyle?.x || 0}px Y:{activeStyle?.y || 0}px
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="Left (-1px / Shift -5px)">
                      <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, -1, 0)} sx={{ bgcolor: '#F1F5F9' }}>
                        <ArrowBackIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Stack spacing={0.5}>
                      <Tooltip title="Up (-1px / Shift -5px)">
                        <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 0, -1)} sx={{ bgcolor: '#F1F5F9' }}>
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Down (+1px / Shift +5px)">
                        <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 0, 1)} sx={{ bgcolor: '#F1F5F9' }}>
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Tooltip title="Right (+1px / Shift +5px)">
                      <IconButton size="small" onClick={() => handleNudgeElement(selectedElement, 1, 0)} sx={{ bgcolor: '#F1F5F9' }}>
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Direct Numeric Coordinate Input */}
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <TextField
                      size="small"
                      label="X Position (px)"
                      type="number"
                      value={activeStyle?.x || 0}
                      onChange={(e) => handleElementStyleUpdate(selectedElement, 'x', parseInt(e.target.value) || 0)}
                      sx={{ '& input': { py: 0.4, fontSize: '0.72rem', textAlign: 'center' } }}
                    />
                    <TextField
                      size="small"
                      label="Y Position (px)"
                      type="number"
                      value={activeStyle?.y || 0}
                      onChange={(e) => handleElementStyleUpdate(selectedElement, 'y', parseInt(e.target.value) || 0)}
                      sx={{ '& input': { py: 0.4, fontSize: '0.72rem', textAlign: 'center' } }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={0.8} sx={{ mt: 0.8 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={() => handleElementStyleUpdate(selectedElement, 'x', 0)}
                      sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'none', borderColor: '#0284C7', color: '#0369A1' }}
                    >
                      Center X (0)
                    </Button>
                    <Button
                      fullWidth
                      size="small"
                      color="inherit"
                      onClick={() => handleResetElement(selectedElement)}
                      sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: '#F8FAFC', textTransform: 'none' }}
                    >
                      Reset X &amp; Y
                    </Button>
                  </Stack>
                </Box>

                {/* Typography Controls for Selected Text */}
                {['headerTitle', 'headerSub', 'headerAddress', 'title', 'refCertNo', 'refTgid', 'refIssueDate', 'student', 'body'].includes(selectedElement) && (
                  <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #CBD5E1' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                      Typography & Font Style:
                    </Typography>

                    <Stack spacing={1}>
                      {/* Font Size & Weight */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#F8FAFC', p: '2px 6px', borderRadius: 1.5, border: '1px solid #CBD5E1' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569' }}>Size:</Typography>
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
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Alignment:</Typography>
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
                        <InputLabel sx={{ fontSize: '0.72rem' }}>Font Family</InputLabel>
                        <Select
                          value={activeStyle?.fontFamily || 'Times New Roman'}
                          label="Font Family"
                          onChange={(e) => handleElementStyleUpdate(selectedElement, 'fontFamily', e.target.value)}
                          sx={{ height: 32, fontSize: '0.72rem' }}
                        >
                          {FONT_OPTIONS.map((f) => (
                            <MenuItem key={f.id} value={f.id} sx={{ fontSize: '0.74rem' }}>{f.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Text Color:</Typography>
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
                      Trainee Photo Frame Controls:
                    </Typography>
                    <ToggleButtonGroup
                      value={activeStyle?.preset || 'right'}
                      exclusive
                      onChange={(e, next) => next && handleElementStyleUpdate('photo', 'preset', next)}
                      size="small"
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      <ToggleButton value="right" sx={{ fontSize: '0.68rem', py: 0.3 }}>Right Corner</ToggleButton>
                      <ToggleButton value="center" sx={{ fontSize: '0.68rem', py: 0.3 }}>Center</ToggleButton>
                      <ToggleButton value="left" sx={{ fontSize: '0.68rem', py: 0.3 }}>Left</ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Width:</Typography>
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
                  Element Inspector
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5, lineHeight: 1.3 }}>
                  Click on any text or logo on the canvas, or select one of the main elements below:
                </Typography>
                <Grid container spacing={0.6}>
                  {[
                    { key: 'student', label: 'Trainee Name' },
                    { key: 'headerTitle', label: 'Institute Name' },
                    { key: 'title', label: 'Main Title' },
                    { key: 'photo', label: 'Photo Frame' },
                    { key: 'body', label: 'Body Text' },
                    { key: 'signatories', label: 'Signatures' },
                    { key: 'seal', label: 'Official Stamp' },
                    { key: 'qrCode', label: 'QR Code' }
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
              Sample Student Preview
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1, fontSize: '0.68rem' }}>
              Test how the design looks with varying name lengths and courses:
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
              1-Click Luxury Color Themes
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
          #studioCanvasScaleFrame {
            width: auto !important;
            height: auto !important;
            box-shadow: none !important;
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

      {/* ==================================================================== */}
      {/* DEDICATED CUSTOM PRESET BUILDER MODAL (All Options in One Place)     */}
      {/* ==================================================================== */}
      <Dialog
        open={presetModalOpen && Boolean(presetForm)}
        onClose={() => setPresetModalOpen(false)}
        maxWidth="md"
        fullWidth
        onClick={(e) => e.stopPropagation()}
      >
        {presetForm && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkspacePremiumIcon sx={{ color: '#FBBF24' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  {editingPresetId ? 'Edit Custom Preset' : 'Add New Custom Preset (All Options)'}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setPresetModalOpen(false)} sx={{ color: '#FFFFFF' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ bgcolor: '#F8FAFC', p: { xs: 2, sm: 2.5 } }}>
              <Grid container spacing={2.2}>
                {/* LEFT COLUMN: Name, Orientation, Background Mode & Upload, Language & Duration */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={1.8}>
                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block', mb: 1 }}>
                        1. Preset Name &amp; Orientation
                      </Typography>
                      <Stack spacing={1.2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Custom Preset Name"
                          placeholder="e.g. Canva Beautician Portrait / CTEVT Gold"
                          value={presetForm.name}
                          onChange={(e) => setPresetForm((p) => ({ ...p, name: e.target.value }))}
                        />
                        <ToggleButtonGroup
                          fullWidth
                          size="small"
                          exclusive
                          value={presetForm.orientation}
                          onChange={(e, next) => next && setPresetForm((p) => ({ ...p, orientation: next }))}
                        >
                          <ToggleButton value="landscape" sx={{ fontWeight: 800, fontSize: '0.75rem', gap: 0.6 }}>
                            <CropLandscapeIcon fontSize="small" /> A4 Landscape
                          </ToggleButton>
                          <ToggleButton value="portrait" sx={{ fontWeight: 800, fontSize: '0.75rem', gap: 0.6 }}>
                            <CropPortraitIcon fontSize="small" /> A4 Portrait
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block', mb: 1 }}>
                        2. Background Type &amp; Upload (Cloud Storage)
                      </Typography>
                      <Stack spacing={1.2}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              size="small"
                              variant={presetForm.customBgMode !== 'predesigned' ? 'contained' : 'outlined'}
                              onClick={() => handlePresetFormBgModeChange('plain')}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                textTransform: 'none',
                                bgcolor: presetForm.customBgMode !== 'predesigned' ? '#0F2E5A' : '#FFFFFF'
                              }}
                            >
                              Plain / Frame Only
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              size="small"
                              variant={presetForm.customBgMode === 'predesigned' ? 'contained' : 'outlined'}
                              onClick={() => handlePresetFormBgModeChange('predesigned')}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                textTransform: 'none',
                                bgcolor: presetForm.customBgMode === 'predesigned' ? '#D97706' : '#FFFFFF',
                                color: presetForm.customBgMode === 'predesigned' ? '#FFFFFF' : '#334155',
                                borderColor: '#CBD5E1',
                                '&:hover': { bgcolor: presetForm.customBgMode === 'predesigned' ? '#B45309' : '#FFFBEB' }
                              }}
                            >
                              Heading Included
                            </Button>
                          </Grid>
                        </Grid>

                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          component="label"
                          disabled={presetModalUploading}
                          startIcon={presetModalUploading ? <CircularProgress size={14} color="inherit" /> : <UploadFileIcon />}
                          sx={{ bgcolor: '#059669', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#047857' } }}
                        >
                          {presetModalUploading ? 'Uploading to Supabase Cloud...' : 'Upload Background Image (PNG / JPG)'}
                          <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={handlePresetFormUploadBg} />
                        </Button>

                        {presetForm.backgroundType === 'custom' && presetForm.customBackgroundUrl && (
                          <Box
                            sx={{
                              height: 92,
                              borderRadius: 1.5,
                              border: '1px solid #CBD5E1',
                              backgroundImage: `url(${presetForm.customBackgroundUrl})`,
                              backgroundSize: 'contain',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'center',
                              bgcolor: '#F1F5F9',
                              position: 'relative'
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => setPresetForm((p) => ({ ...p, backgroundType: 'clean-white', customBackgroundUrl: '' }))}
                              sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)', color: '#DC2626', p: 0.3 }}
                            >
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        )}

                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label="Background Fit"
                              value={presetForm.customBgFit}
                              onChange={(e) => setPresetForm((p) => ({ ...p, customBgFit: e.target.value }))}
                            >
                              <MenuItem value="100% 100%">Exact A4 Fill (100%)</MenuItem>
                              <MenuItem value="cover">Cover (Crop)</MenuItem>
                              <MenuItem value="contain">Contain (Fit)</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Opacity (%)"
                              inputProps={{ min: 10, max: 100 }}
                              value={presetForm.customBgOpacity}
                              onChange={(e) => setPresetForm((p) => ({ ...p, customBgOpacity: Math.min(100, Math.max(10, Number(e.target.value) || 100)) }))}
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block', mb: 1 }}>
                        3. Body Language &amp; Course Duration
                      </Typography>
                      <Stack spacing={1.2}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Certificate Body Language"
                          value={presetForm.bodyLayoutMode}
                          onChange={(e) => setPresetForm((p) => ({ ...p, bodyLayoutMode: e.target.value }))}
                        >
                          <MenuItem value="english-only">English Only (Official Default)</MenuItem>
                          <MenuItem value="bilingual">Bilingual (English + नेपाली)</MenuItem>
                          <MenuItem value="nepali-only">Nepali Only (नेपाली मात्र)</MenuItem>
                        </TextField>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Course Duration Display"
                          value={presetForm.durationDisplayMode}
                          onChange={(e) => setPresetForm((p) => ({ ...p, durationDisplayMode: e.target.value }))}
                        >
                          <MenuItem value="hours">Hours Only (390 Hours / 178 Hours)</MenuItem>
                          <MenuItem value="unit">Course Unit (15 Days / 3 Months / 6 Weeks)</MenuItem>
                          <MenuItem value="both">Both (3 Months (390 Hours))</MenuItem>
                        </TextField>
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>

                {/* RIGHT COLUMN: Complete Dynamic Content Visibility (ON / OFF) */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', height: '100%' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block', mb: 1 }}>
                      4. Dynamic Sections Visibility (ON / OFF)
                    </Typography>
                    <Stack spacing={0.2}>
                      <FormControlLabel
                        control={<Switch size="small" checked={presetForm.showHeader} onChange={(e) => setPresetForm((p) => ({ ...p, showHeader: e.target.checked }))} />}
                        label={<Typography variant="caption" sx={{ fontWeight: 800 }}>Institutional Header</Typography>}
                      />
                      {presetForm.showHeader && (
                        <Box sx={{ pl: 2.2, borderLeft: '2px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.2, mb: 0.5 }}>
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showHeaderTitle} onChange={(e) => setPresetForm((p) => ({ ...p, showHeaderTitle: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Institute Name</Typography>}
                          />
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showAccreditation} onChange={(e) => setPresetForm((p) => ({ ...p, showAccreditation: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Accreditation</Typography>}
                          />
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showAffiliation} onChange={(e) => setPresetForm((p) => ({ ...p, showAffiliation: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Regd / Address</Typography>}
                          />
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showHeaderDivider} onChange={(e) => setPresetForm((p) => ({ ...p, showHeaderDivider: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Divider Line</Typography>}
                          />
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showLeftLogo} onChange={(e) => setPresetForm((p) => ({ ...p, showLeftLogo: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Left Logo</Typography>}
                          />
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showRightLogo} onChange={(e) => setPresetForm((p) => ({ ...p, showRightLogo: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Right Badge</Typography>}
                          />
                        </Box>
                      )}

                      <FormControlLabel
                        control={<Switch size="small" checked={presetForm.showTitle} onChange={(e) => setPresetForm((p) => ({ ...p, showTitle: e.target.checked }))} />}
                        label={<Typography variant="caption" sx={{ fontWeight: 800 }}>Main Certificate Title</Typography>}
                      />

                      <FormControlLabel
                        control={<Switch size="small" checked={presetForm.showRefBar} onChange={(e) => setPresetForm((p) => ({ ...p, showRefBar: e.target.checked }))} />}
                        label={<Typography variant="caption" sx={{ fontWeight: 800 }}>Reference Bar (Cert No / TGID / Date)</Typography>}
                      />
                      {presetForm.showRefBar && (
                        <Box sx={{ pl: 2.2, borderLeft: '2px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.2, mb: 0.5 }}>
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showRefCertNo} onChange={(e) => setPresetForm((p) => ({ ...p, showRefCertNo: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Cert No</Typography>}
                          />
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showRefTgid} onChange={(e) => setPresetForm((p) => ({ ...p, showRefTgid: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>TGID</Typography>}
                          />
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.showRefIssueDate} onChange={(e) => setPresetForm((p) => ({ ...p, showRefIssueDate: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Issue Date</Typography>}
                          />
                          <FormControlLabel
                            control={<Switch size="small" checked={presetForm.transparentRefBar} onChange={(e) => setPresetForm((p) => ({ ...p, transparentRefBar: e.target.checked }))} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>Transparent</Typography>}
                          />
                        </Box>
                      )}

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.2 }}>
                        <FormControlLabel
                          control={<Switch size="small" checked={presetForm.showStudentPhoto} onChange={(e) => setPresetForm((p) => ({ ...p, showStudentPhoto: e.target.checked }))} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Student Photo</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={presetForm.showCompetencyBadge} onChange={(e) => setPresetForm((p) => ({ ...p, showCompetencyBadge: e.target.checked }))} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Level / Hours Badge</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={presetForm.showNepaliNameSubtitle} onChange={(e) => setPresetForm((p) => ({ ...p, showNepaliNameSubtitle: e.target.checked }))} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Nepali Name Sub</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={presetForm.showCourseLine} onChange={(e) => setPresetForm((p) => ({ ...p, showCourseLine: e.target.checked }))} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Course Highlight</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={presetForm.showBodyText} onChange={(e) => setPresetForm((p) => ({ ...p, showBodyText: e.target.checked }))} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Body Paragraph</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={presetForm.showQrVerification} onChange={(e) => setPresetForm((p) => ({ ...p, showQrVerification: e.target.checked }))} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>QR Verification</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={presetForm.sealMode !== 'none'} onChange={(e) => setPresetForm((p) => ({ ...p, sealMode: e.target.checked ? 'blank' : 'none' }))} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Seal / Stamp</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch size="small" checked={presetForm.showSignatories} onChange={(e) => setPresetForm((p) => ({ ...p, showSignatories: e.target.checked }))} />}
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Signatories</Typography>}
                        />
                      </Box>

                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                        💡 सेभ गरेपछि Canvas मा कुनै पनि अक्षर/लोगो माउसले तानेर मिलाउन र <b>Update Active</b> थिच्न मिल्छ।
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'space-between', px: 2.5, py: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={Boolean(presetForm.setAsDefault)}
                    onChange={(e) => setPresetForm((p) => ({ ...p, setAsDefault: e.target.checked }))}
                  />
                }
                label={<Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>Set as Default Preset (★)</Typography>}
              />
              <Stack direction="row" spacing={1}>
                <Button onClick={() => setPresetModalOpen(false)}>Cancel</Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSavePresetModal}
                  sx={{ bgcolor: '#059669', fontWeight: 800, px: 2.5, textTransform: 'none', '&:hover': { bgcolor: '#047857' } }}
                >
                  {editingPresetId ? 'Save Preset Changes' : 'Save Custom Preset (Cloud)'}
                </Button>
              </Stack>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
