import React, { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import { QRCodeSVG } from 'qrcode.react';

import { loadDB, saveDB } from '../../services/storage';

// Default Design Configuration
export const DEFAULT_CERTIFICATE_DESIGN = {
  // 1. Orientation & Dimensions
  orientation: 'landscape', // 'landscape' | 'portrait'
  templateName: 'आधिकारिक ३ महिने व्यावसायिक तालिम ढाँचा',

  // 2. 10 Background Presets
  backgroundType: 'clean-white', // 'clean-white' | 'ivory-parchment' | 'guilloche-security' | 'royal-navy-gold' | 'modern-geometric' | 'damask-floral' | 'emerald-aristocrat' | 'maroon-sovereign' | 'technical-grid' | 'marble-veins' | 'custom'
  customBackgroundUrl: '',
  watermarkType: 'school-crest',
  watermarkOpacity: 4, // 0 to 30 %
  watermarkScale: 100, // 50 to 150 %

  // 3. 7 Border Styles & Corner Ornaments
  borderStyle: 'royal-double', // 'royal-double' | 'vintage-filigree' | 'modern-executive' | 'greek-key' | 'security-guilloche' | 'art-deco' | 'none'
  borderWidth: 6, // 2 to 14 px
  borderMargin: 12, // 6 to 22 mm
  cornerStyle: 'victorian-flourish', // 'victorian-flourish' | 'acanthus-leaf' | 'art-deco-bracket' | 'celtic-knot' | 'clean-l-bracket' | 'none'
  cornerSize: 32, // 15 to 55 px
  cornerColor: '#C59B27',

  // 4. Color Palette & Pickers
  primaryColor: '#0B2545', // Deep Navy
  accentColor: '#C59B27', // Metallic Gold
  backgroundColor: '#FFFFFF', // Paper Tint
  textColor: '#0F172A',

  // 5. Header & Branding
  showHeader: true,
  instituteNameNepali: 'ग्लोबल एरा प्राविधिक स्कुल',
  instituteNameEnglish: 'GLOBAL ERA TECHNICAL SCHOOL / GLOBAL ERA MULTI SERVICE',
  accreditationText: 'Accredited Technical Training Provider under Council for Technical Education and Vocational Training (CTEVT)',
  affiliationCodeText: 'Government Regd. No: 184920/078/079 • CTEVT Affiliation Code: 4208 • MitraPark, Kathmandu, Nepal',
  showLeftLogo: true,
  showRightLogo: true,

  // 6. Title & Body Typography
  certificateTitleEn: 'CERTIFICATE OF VOCATIONAL TRAINING COMPLETION',
  certificateTitleNp: '(व्यावसायिक तालिम समापन प्रमाणपत्र)',
  bodyLayoutMode: 'bilingual', // 'bilingual' | 'english-only' | 'nepali-only'
  showStudentPhoto: true,
  showCompetencyBadge: true,
  hoursBadgeText: '390 HRS • LEVEL 1',

  // 7. Signatures & Official Seals
  showDualSignatures: true,
  signatory1Title: 'प्रशिक्षक (Lead Instructor)',
  signatory1Name: 'सुमन थापा (Suman Thapa)',
  signatory2Title: 'क्याम्पस प्रमुख / निर्देशक (Director)',
  signatory2Name: 'गोकर्ण थापा (Gokarna Thapa)',
  showOfficialSeal: true,
  sealColor: '#0B2545',
  showQrVerification: true,

  // 8. Pre-printed Calibration & Text-Only Print Mode
  preprintedTextOnly: false,
  offsetY: 0, // -25mm to +25mm
  offsetX: 0, // -25mm to +25mm
  fontScale: 100 // 85% to 115%
};

// 10 Background Presets Definitions
const BACKGROUND_PRESETS = [
  { id: 'clean-white', label: 'सादा सेतो (Pure White)', desc: 'सफा, तीव्र र मसी-मैत्री' },
  { id: 'ivory-parchment', label: 'क्लासिक आइभोरी (Ivory Parchment)', desc: 'न्यानो क्रिम शास्त्रीय विश्वविद्यालय कागज' },
  { id: 'guilloche-security', label: 'सेक्युरिटी वेभ (Guilloche Wave)', desc: 'बैंक नोट/राहदानी जस्तो जालीदार' },
  { id: 'royal-navy-gold', label: 'शाही नेभी-गोल्डेन (Navy & Gold Glow)', desc: 'कर्पोरेट लक्जरी आभा' },
  { id: 'modern-geometric', label: 'आधुनिक ज्यामितीय (Modern Mesh)', desc: 'कम्प्युटर, आइटी र प्राविधिक' },
  { id: 'damask-floral', label: 'दमास्क फ्लोरल (Damask Floral)', desc: 'ब्युटिसियन, फेसन र कलात्मक' },
  { id: 'emerald-aristocrat', label: 'मरकत हरियो (Emerald Aristocrat)', desc: 'सिटिइभिटी हरियो र गोल्डेन' },
  { id: 'maroon-sovereign', label: 'मरुन सार्वभौम (Maroon Sovereign)', desc: 'दीक्षान्त तथा विशेष सम्मान' },
  { id: 'technical-grid', label: 'टेक्निकल ग्रिड (Technical Blueprint)', desc: 'इन्जिनियरिङ र अटोमोबाइल' },
  { id: 'marble-veins', label: 'फाइन मार्बल (Italian Marble)', desc: 'लक्जरी स्पा र ब्युटी एकेडेमी' }
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
  const [design, setDesign] = useState({
    ...DEFAULT_CERTIFICATE_DESIGN,
    ...(db.settings?.certificateDesign || {})
  });
  const [savedAlert, setSavedAlert] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.85);

  const isPortrait = design.orientation === 'portrait';

  const handleUpdate = (field, value) => {
    setDesign((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyPalette = (palette) => {
    setDesign((prev) => ({
      ...prev,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      cornerColor: palette.corner
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('फाइल साइज ३MB भन्दा सानो हुनुपर्छ।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdate('customBackgroundUrl', reader.result);
      handleUpdate('backgroundType', 'custom');
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
    if (window.confirm('के तपाईं प्रमाणपत्रको डिजाइन सुरुवाती डिफल्टमा फर्काउन चाहनुहुन्छ?')) {
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

  return (
    <Box>
      {/* Top Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WorkspacePremiumIcon sx={{ color: '#C59B27', fontSize: 40 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
              Certificate Studio & Template Designer (प्रमाणपत्र स्टुडियो)
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              संस्थाको प्रमाणपत्रको पृष्ठभूमिका १० प्रिसेट, ७ बोर्डर, कुनाका बुट्टा, कलर पिकर तथा ल्यान्डस्केप/पोर्ट्रेट ओरिएन्टेसन अनुकूलन गर्नुहोस्।
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Orientation Toggle Button */}
          <ToggleButtonGroup
            value={design.orientation}
            exclusive
            onChange={(e, next) => next && handleUpdate('orientation', next)}
            size="small"
            sx={{ bgcolor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
          >
            <ToggleButton value="landscape" sx={{ fontWeight: 800, px: 2, gap: 0.8 }}>
              <CropLandscapeIcon fontSize="small" />
              तेर्सो (Landscape)
            </ToggleButton>
            <ToggleButton value="portrait" sx={{ fontWeight: 800, px: 2, gap: 0.8 }}>
              <CropPortraitIcon fontSize="small" />
              ठाडो (Portrait)
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RestartAltIcon />}
            onClick={handleResetDefaults}
            sx={{ fontWeight: 700 }}
          >
            डिफल्टमा फर्काउनुहोस्
          </Button>

          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handleTestPrint}
            sx={{ fontWeight: 700, borderColor: '#0B2545', color: '#0B2545' }}
          >
            परीक्षण प्रिन्ट
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveDesign}
            sx={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              fontWeight: 900,
              px: 3,
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
            }}
          >
            डिजाइन सुरक्षित गर्नुहोस् (Save Design)
          </Button>
        </Stack>
      </Box>

      {savedAlert && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
          ✓ प्रमाणपत्रको डिजाइन सफलतापूर्वक सुरक्षित गरियो! अब जारी हुने सबै प्रमाणपत्र यसै ढाँचा र ओरिएन्टेसनमा प्रिन्ट हुनेछन्।
        </Alert>
      )}

      {/* Main Studio Grid: Left Controls (5 cols) & Right Live WYSIWYG Preview (7 cols) */}
      <Grid container spacing={3}>
        {/* ============================================================== */}
        {/* LEFT COLUMN: CUSTOMIZATION CONTROLS ACCORDIONS                 */}
        {/* ============================================================== */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={2}>
            {/* 1. BACKGROUND & WATERMARK (10 PRESETS) */}
            <Accordion defaultExpanded sx={{ borderRadius: '10px !important', border: '1px solid #CBD5E1', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <WallpaperIcon sx={{ color: '#0F2E5A', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    १. पृष्ठभूमि तथा वाटरमार्क (१० लक्जरी प्रिसेटहरू)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                  १० आधुनिक तथा विश्वविद्यालय स्तरका पृष्ठभूमि प्रिसेटहरू मध्येबाट रोज्नुहोस्:
                </Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {BACKGROUND_PRESETS.map((bg) => (
                    <Grid item xs={6} key={bg.id}>
                      <Button
                        fullWidth
                        size="small"
                        variant={design.backgroundType === bg.id ? 'contained' : 'outlined'}
                        onClick={() => handleUpdate('backgroundType', bg.id)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          py: 0.8,
                          textAlign: 'left',
                          justifyContent: 'flex-start',
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

                {/* Custom Background Upload */}
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1', mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 1 }}>
                    आफ्नै पृष्ठभूमि फोटो अपलोड गर्नुहोस् (Custom Background Blank):
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                      variant="outlined"
                      size="small"
                      component="label"
                      startIcon={<UploadFileIcon />}
                      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      फोटो छान्नुहोस्
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </Button>

                    {design.customBackgroundUrl && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => {
                          handleUpdate('customBackgroundUrl', '');
                          handleUpdate('backgroundType', 'clean-white');
                        }}
                        sx={{ fontSize: '0.72rem' }}
                      >
                        हटाउनुहोस्
                      </Button>
                    )}
                  </Stack>
                </Box>

                {/* Watermark Controls */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
                  वाटरमार्क गाढापन (Watermark Opacity: {design.watermarkOpacity}%)
                </Typography>
                <Slider
                  value={design.watermarkOpacity}
                  min={0}
                  max={25}
                  step={1}
                  onChange={(e, val) => handleUpdate('watermarkOpacity', val)}
                  sx={{ color: '#0F2E5A' }}
                />
              </AccordionDetails>
            </Accordion>

            {/* 2. BORDER DESIGN, CORNER ORNAMENTS & COLOR PICKERS */}
            <Accordion defaultExpanded sx={{ borderRadius: '10px !important', border: '1px solid #CBD5E1', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <BorderStyleIcon sx={{ color: '#C59B27', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    २. बोर्डर, कुनाका बुट्टा तथा पूर्ण कलर पिकर
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {/* 7 Border Styles */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 1 }}>
                  क) बोर्डरको ढाँचा (७ Border Styles):
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {BORDER_STYLES.map((b) => (
                    <Grid item xs={6} key={b.id}>
                      <Button
                        fullWidth
                        size="small"
                        variant={design.borderStyle === b.id ? 'contained' : 'outlined'}
                        onClick={() => handleUpdate('borderStyle', b.id)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          py: 0.7,
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

                {/* Border Margin & Width Sliders */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block' }}>
                      बोर्डर मोटाइ ({design.borderWidth}px)
                    </Typography>
                    <Slider
                      value={design.borderWidth}
                      min={2}
                      max={14}
                      step={1}
                      onChange={(e, val) => handleUpdate('borderWidth', val)}
                      sx={{ color: '#C59B27' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block' }}>
                      कागज किनारा मार्जिन ({design.borderMargin}mm)
                    </Typography>
                    <Slider
                      value={design.borderMargin}
                      min={6}
                      max={22}
                      step={1}
                      onChange={(e, val) => handleUpdate('borderMargin', val)}
                      sx={{ color: '#0F2E5A' }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                {/* Corner Ornaments */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#C59B27', display: 'block', mb: 1 }}>
                  ख) कुनाका बुट्टाहरू (Corner Ornaments / Flourishes):
                </Typography>
                <Grid container spacing={1} sx={{ mb: 1.5 }}>
                  {CORNER_STYLES.map((c) => (
                    <Grid item xs={6} key={c.id}>
                      <Button
                        fullWidth
                        size="small"
                        variant={design.cornerStyle === c.id ? 'contained' : 'outlined'}
                        onClick={() => handleUpdate('cornerStyle', c.id)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.67rem',
                          py: 0.6,
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

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block' }}>
                      कुनाको साइज ({design.cornerSize}px)
                    </Typography>
                    <Slider
                      value={design.cornerSize}
                      min={16}
                      max={55}
                      step={1}
                      onChange={(e, val) => handleUpdate('cornerSize', val)}
                      sx={{ color: '#C59B27' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                      कुनाको रङ्ग (Corner Color):
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={design.cornerColor}
                        onChange={(e) => handleUpdate('cornerColor', e.target.value)}
                        style={{ width: 36, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      />
                      <TextField
                        size="small"
                        value={design.cornerColor}
                        onChange={(e) => handleUpdate('cornerColor', e.target.value)}
                        sx={{ '& input': { p: '4px 8px', fontSize: '0.75rem', fontFamily: 'monospace' } }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                {/* 1-Click Luxury Palettes */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 1 }}>
                  ग) १-क्लिक लक्जरी कलर प्यालेटहरू (Matching Palettes):
                </Typography>
                <Stack spacing={0.8} sx={{ mb: 2 }}>
                  {LUXURY_PALETTES.map((pal) => (
                    <Box
                      key={pal.name}
                      onClick={() => handleApplyPalette(pal)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 0.8,
                        borderRadius: 1.5,
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B' }}>
                        {pal.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.8 }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: pal.primary, border: '1px solid #FFF' }} />
                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: pal.accent, border: '1px solid #FFF' }} />
                      </Box>
                    </Box>
                  ))}
                </Stack>

                {/* Interactive Color Pickers */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 1 }}>
                  घ) पूर्ण कलर पिकर (Interactive HTML5 Color Wheel):
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
                      प्राथमिक रङ्ग (Primary):
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={design.primaryColor}
                        onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                        style={{ width: 36, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      />
                      <TextField
                        size="small"
                        value={design.primaryColor}
                        onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                        sx={{ '& input': { p: '4px 8px', fontSize: '0.75rem', fontFamily: 'monospace' } }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#C59B27', display: 'block', mb: 0.5 }}>
                      सुनौलो एक्सेन्ट (Accent):
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={design.accentColor}
                        onChange={(e) => handleUpdate('accentColor', e.target.value)}
                        style={{ width: 36, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      />
                      <TextField
                        size="small"
                        value={design.accentColor}
                        onChange={(e) => handleUpdate('accentColor', e.target.value)}
                        sx={{ '& input': { p: '4px 8px', fontSize: '0.75rem', fontFamily: 'monospace' } }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 3. INSTITUTIONAL LETTERHEAD & LOGOS */}
            <Accordion sx={{ borderRadius: '10px !important', border: '1px solid #CBD5E1', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <BrandingWatermarkIcon sx={{ color: '#1E40AF', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    ३. संस्थागत लेटरहेड र लोगो (Header & Logos)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <FormControlLabel
                  control={<Switch checked={design.showHeader} onChange={(e) => handleUpdate('showHeader', e.target.checked)} />}
                  label={<Typography variant="caption" sx={{ fontWeight: 800 }}>शीर्ष लेटरहेड देखाउनुहोस् (Show Header)</Typography>}
                  sx={{ mb: 1.5 }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="संस्थाको नाम (नेपाली)"
                  value={design.instituteNameNepali}
                  onChange={(e) => handleUpdate('instituteNameNepali', e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="संस्थाको नाम (English)"
                  value={design.instituteNameEnglish}
                  onChange={(e) => handleUpdate('instituteNameEnglish', e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="सम्बन्धन / दर्ता विवरण (Registration Details)"
                  value={design.affiliationCodeText}
                  onChange={(e) => handleUpdate('affiliationCodeText', e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                <Stack direction="row" spacing={2}>
                  <FormControlLabel
                    control={<Switch checked={design.showLeftLogo} onChange={(e) => handleUpdate('showLeftLogo', e.target.checked)} size="small" />}
                    label={<Typography variant="caption">बायाँ संस्था लोगो</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={design.showRightLogo} onChange={(e) => handleUpdate('showRightLogo', e.target.checked)} size="small" />}
                    label={<Typography variant="caption">दायाँ CTEVT लोगो</Typography>}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* 4. TITLE & TYPOGRAPHY */}
            <Accordion sx={{ borderRadius: '10px !important', border: '1px solid #CBD5E1', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <FormatSizeIcon sx={{ color: '#059669', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    ४. शीर्षक तथा ब्यहोरा (Title & Typography)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="प्रमाणपत्र मुख्य शीर्षक (English)"
                  value={design.certificateTitleEn}
                  onChange={(e) => handleUpdate('certificateTitleEn', e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="प्रमाणपत्र उप-शीर्षक (नेपाली)"
                  value={design.certificateTitleNp}
                  onChange={(e) => handleUpdate('certificateTitleNp', e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.8 }}>
                  अनुच्छेदको भाषा (Paragraph Language):
                </Typography>
                <ToggleButtonGroup
                  value={design.bodyLayoutMode}
                  exclusive
                  onChange={(e, next) => next && handleUpdate('bodyLayoutMode', next)}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="bilingual">द्विभाषी (Bilingual)</ToggleButton>
                  <ToggleButton value="english-only">English मात्र</ToggleButton>
                  <ToggleButton value="nepali-only">नेपाली मात्र</ToggleButton>
                </ToggleButtonGroup>

                <Stack direction="row" spacing={2}>
                  <FormControlLabel
                    control={<Switch checked={design.showStudentPhoto} onChange={(e) => handleUpdate('showStudentPhoto', e.target.checked)} size="small" />}
                    label={<Typography variant="caption">फोटो फ्रेम देखाउने (PP Photo)</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={design.showCompetencyBadge} onChange={(e) => handleUpdate('showCompetencyBadge', e.target.checked)} size="small" />}
                    label={<Typography variant="caption">घण्टा ब्याच ({design.hoursBadgeText})</Typography>}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* 5. SIGNATURES & OFFICIAL SEALS */}
            <Accordion sx={{ borderRadius: '10px !important', border: '1px solid #CBD5E1', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <EditNoteIcon sx={{ color: '#DC2626', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    ५. हस्ताक्षर तथा आधिकारिक छाप (Signatures & Stamp)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="प्रशिक्षक पद (Signatory 1 Title)"
                      value={design.signatory1Title}
                      onChange={(e) => handleUpdate('signatory1Title', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="प्रशिक्षक नाम (Signatory 1 Name)"
                      value={design.signatory1Name}
                      onChange={(e) => handleUpdate('signatory1Name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="प्रमुख पद (Signatory 2 Title)"
                      value={design.signatory2Title}
                      onChange={(e) => handleUpdate('signatory2Title', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="प्रमुख नाम (Signatory 2 Name)"
                      value={design.signatory2Name}
                      onChange={(e) => handleUpdate('signatory2Name', e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                  <FormControlLabel
                    control={<Switch checked={design.showOfficialSeal} onChange={(e) => handleUpdate('showOfficialSeal', e.target.checked)} size="small" />}
                    label={<Typography variant="caption">आधिकारिक गोल्डेन/रेड सिल</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={design.showQrVerification} onChange={(e) => handleUpdate('showQrVerification', e.target.checked)} size="small" />}
                    label={<Typography variant="caption">QR भेरिफिकेसन कोड</Typography>}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* 6. PRE-PRINTED PAPER OFFSETS & TEXT-ONLY PRINT */}
            <Accordion sx={{ borderRadius: '10px !important', border: '1px solid #CBD5E1', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <TuneIcon sx={{ color: '#D97706', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    ६. प्रि-प्रिन्टेड क्यालिब्रेसन (Pre-printed Paper Offsets)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {/* 1-Click Text Only Mode */}
                <Box sx={{ p: 1.5, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid #FCD34D', mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={design.preprintedTextOnly}
                        onChange={(e) => handleUpdate('preprintedTextOnly', e.target.checked)}
                        color="warning"
                      />
                    }
                    label={
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E' }}>
                        केवल अक्षरहरू मात्र प्रिन्ट गर्नुहोस् (Text-Only Mode: बजारको बोर्डर भएको कागजमा प्रिन्ट गर्न)
                      </Typography>
                    }
                  />
                </Box>

                <Typography variant="caption">माथि/तल सर्ने (Y-Offset: {design.offsetY} mm)</Typography>
                <Slider
                  value={design.offsetY}
                  min={-20}
                  max={20}
                  step={1}
                  onChange={(e, val) => handleUpdate('offsetY', val)}
                  sx={{ color: '#D97706', mb: 1 }}
                />

                <Typography variant="caption">दायाँ/बायाँ सर्ने (X-Offset: {design.offsetX} mm)</Typography>
                <Slider
                  value={design.offsetX}
                  min={-20}
                  max={20}
                  step={1}
                  onChange={(e, val) => handleUpdate('offsetX', val)}
                  sx={{ color: '#D97706' }}
                />
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Grid>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: LIVE WYSIWYG INTERACTIVE PREVIEW CANVAS          */}
        {/* ============================================================== */}
        <Grid item xs={12} lg={7}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            {/* Preview Control Header */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2,
                border: '1px solid #CBD5E1',
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label="LIVE PREVIEW"
                  size="small"
                  sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 900, fontSize: '0.68rem' }}
                />
                <Typography variant="caption" sx={{ color: '#0F2E5A', fontWeight: 800 }}>
                  {isPortrait ? 'A4 Portrait (ठाडो - २१० × २९७ मिमी)' : 'A4 Landscape (तेर्सो - २९७ × २१० मिमी)'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>प्रिभ्यु जुम:</Typography>
                <Button size="small" onClick={() => setPreviewScale((p) => Math.max(0.55, p - 0.05))}>-</Button>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>{Math.round(previewScale * 100)}%</Typography>
                <Button size="small" onClick={() => setPreviewScale((p) => Math.min(1.05, p + 0.05))}>+</Button>
              </Box>
            </Paper>

            {/* Scaled Certificate Wrapper */}
            <Box
              sx={{
                overflow: 'auto',
                p: 2,
                bgcolor: '#334155',
                borderRadius: 2.5,
                display: 'flex',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.25)',
                minHeight: '750px'
              }}
            >
              {/* The Live Certificate Canvas */}
              <Box
                id="liveCertificateStudioCanvas"
                sx={{
                  width: isPortrait ? '740px' : '1020px',
                  minHeight: isPortrait ? '1040px' : '720px',
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
                  transition: 'all 0.2s ease',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
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

                {/* Subtle Watermark Logo */}
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
                    <SchoolIcon sx={{ fontSize: (isPortrait ? 360 : 320) * (design.watermarkScale / 100), color: design.primaryColor }} />
                  </Box>
                )}

                {/* 1. Institutional Letterhead Header */}
                {design.showHeader && (
                  <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', pb: 1, borderBottom: `1.5px solid ${design.accentColor}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                      {/* Left Logo */}
                      <Box sx={{ display: 'flex', alignItems: 'center', width: 64 }}>
                        {design.showLeftLogo && <SchoolIcon sx={{ fontSize: 44, color: design.primaryColor }} />}
                      </Box>

                      {/* Center Institute Titles */}
                      <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontFamily: "'Times New Roman', serif",
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            color: design.primaryColor,
                            fontSize: isPortrait ? '1.25rem' : '1.35rem',
                            textTransform: 'uppercase'
                          }}
                        >
                          {design.instituteNameEnglish}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: "'Noto Sans Devanagari', sans-serif",
                            fontWeight: 800,
                            color: design.accentColor,
                            fontSize: isPortrait ? '0.98rem' : '1.05rem',
                            letterSpacing: '0.02em',
                            mt: 0.2
                          }}
                        >
                          {design.instituteNameNepali}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.72rem', fontWeight: 600, mt: 0.3 }}>
                          {design.accreditationText}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                          {design.affiliationCodeText}
                        </Typography>
                      </Box>

                      {/* Right Logo */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 64 }}>
                        {design.showRightLogo && <VerifiedIcon sx={{ fontSize: 44, color: design.accentColor }} />}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* 2. Certificate Title Banner */}
                <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', my: isPortrait ? 2 : 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: design.primaryColor,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontSize: isPortrait ? '1.18rem' : '1.25rem',
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
                    py: 0.6,
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

                {/* 4. Trainee Centerpiece & Photo Frame */}
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, my: isPortrait ? 2 : 1.2 }}>
                  {/* Left Competency Badge */}
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

                  {/* Center Trainee Name Highlight */}
                  <Box sx={{ textAlign: 'center', flexGrow: 1, px: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      यो प्रमाणपत्र प्रदान गरिएको छ / This is proudly awarded to:
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 900,
                        color: design.primaryColor,
                        fontFamily: 'serif',
                        letterSpacing: '0.04em',
                        fontSize: isPortrait ? '1.85rem' : '1.75rem',
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

                  {/* Right Student Photo Frame */}
                  <Box sx={{ width: '88px', height: '108px' }}>
                    {design.showStudentPhoto && (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          border: `2px solid ${design.accentColor}`,
                          borderRadius: '4px',
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
                </Box>

                {/* 5. English & Nepali Wording Paragraphs */}
                <Box sx={{ position: 'relative', zIndex: 1, px: 3, textAlign: 'justify', my: isPortrait ? 2 : 0.5 }}>
                  {(design.bodyLayoutMode === 'bilingual' || design.bodyLayoutMode === 'english-only') && (
                    <Typography variant="body2" sx={{ fontSize: isPortrait ? '0.88rem' : '0.85rem', lineHeight: isPortrait ? 1.6 : 1.45, color: '#1E293B', mb: 0.8 }}>
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
                    <Typography variant="body2" sx={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: isPortrait ? '0.88rem' : '0.85rem', lineHeight: isPortrait ? 1.6 : 1.5, color: '#1E293B' }}>
                      प्रमाणित गरिन्छ कि गोकर्णेश्वर-०५, काठमाडौँ निवासी श्री हरि शर्माको सुपुत्री सुश्री <b>सुनिता शर्मा</b>ले यस संस्थाद्वारा मिति <b>२०८३/०२/१८</b> देखि <b>२०८३/०५/१८</b> सम्म सञ्चालित <b>३९० घन्टे</b> <b>"आधारभूत ब्युटिसियन तालिम"</b> सफलतापूर्वक सम्पन्न गर्नुभएकोले यो <b>व्यावसायिक तालिम समापन प्रमाणपत्र</b> प्रदान गरिएको छ।
                    </Typography>
                  )}
                </Box>

                {/* 6. Footer: QR Code + Golden Seal + Dual Signatures */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    mt: isPortrait ? 3 : 1.5,
                    pt: 1.5,
                    borderTop: '1px solid #CBD5E1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    px: 2
                  }}
                >
                  {/* Left QR Code */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '28%' }}>
                    {design.showQrVerification && (
                      <>
                        <Box sx={{ p: 0.5, bgcolor: '#FFFFFF', border: `1.5px solid ${design.primaryColor}`, borderRadius: 1 }}>
                          <QRCodeSVG value="https://globalera.edu.np/verify?cert=GE-2081-000101" size={54} level="M" />
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

                  {/* Center Official Seal */}
                  <Box sx={{ textAlign: 'center', width: '32%' }}>
                    {design.showOfficialSeal && (
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

                  {/* Right Dual Signatures */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, width: '38%' }}>
                    <Box sx={{ textAlign: 'center', width: '120px' }}>
                      <Box sx={{ height: 28, borderBottom: '1px dashed #64748B', mb: 0.5 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: design.primaryColor, fontSize: '0.74rem' }}>
                        {design.signatory1Name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                        {design.signatory1Title}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', width: '130px' }}>
                      <Box sx={{ height: 28, borderBottom: `1.5px solid ${design.primaryColor}`, mb: 0.5 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: design.primaryColor, fontSize: '0.74rem' }}>
                        {design.signatory2Name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                        {design.signatory2Title}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

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
