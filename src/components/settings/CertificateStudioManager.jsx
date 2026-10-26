import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
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
import { QRCodeSVG } from 'qrcode.react';

import { loadDB, saveDB } from '../../services/storage';

// Default Design Configuration
export const DEFAULT_CERTIFICATE_DESIGN = {
  // 1. Template Identity
  templateName: 'आधिकारिक ३ महिने तालिम समापन ढाँचा',
  templateCategory: 'vocational-standard',

  // 2. Background
  backgroundType: 'clean-white', // 'clean-white' | 'ivory-parchment' | 'guilloche-security' | 'damask-classic' | 'custom'
  customBackgroundUrl: '',
  watermarkType: 'school-crest', // 'school-crest' | 'ctevt' | 'custom' | 'none'
  watermarkOpacity: 4, // 0 to 30 %
  watermarkScale: 100, // 50 to 150 %

  // 3. Borders & Colors
  borderStyle: 'royal-double', // 'royal-double' | 'ornate-vintage' | 'modern-gold' | 'certificate-filigree' | 'none'
  primaryColor: '#0B2545', // Deep Navy
  accentColor: '#C59B27', // Metallic Gold
  borderMargin: 12, // mm
  borderWidth: 6, // px

  // 4. Header & Branding
  showHeader: true,
  instituteNameNepali: 'ग्लोबल एरा प्राविधिक स्कुल',
  instituteNameEnglish: 'GLOBAL ERA TECHNICAL SCHOOL / GLOBAL ERA MULTI SERVICE',
  accreditationText: 'Accredited Technical Training Provider under Council for Technical Education and Vocational Training (CTEVT)',
  affiliationCodeText: 'Government Regd. No: 184920/078/079 • CTEVT Affiliation Code: 4208 • MitraPark, Kathmandu, Nepal',
  showLeftLogo: true,
  showRightLogo: true,

  // 5. Title & Body Typography
  certificateTitleEn: 'CERTIFICATE OF VOCATIONAL TRAINING COMPLETION',
  certificateTitleNp: '(व्यावसायिक तालिम समापन प्रमाणपत्र)',
  bodyLayoutMode: 'bilingual', // 'bilingual' | 'english-only' | 'nepali-only'
  showStudentPhoto: true,
  showCompetencyBadge: true,
  hoursBadgeText: '390 HRS • LEVEL 1',

  // 6. Signatures & Official Seals
  showDualSignatures: true,
  signatory1Title: 'प्रशिक्षक (Lead Instructor)',
  signatory1Name: 'सुमन थापा (Suman Thapa)',
  signatory2Title: 'क्याम्पस प्रमुख / निर्देशक (Director)',
  signatory2Name: 'गोकर्ण थापा (Gokarna Thapa)',
  showOfficialSeal: true,
  sealColor: '#0B2545', // '#0B2545' | '#DC2626' | '#C59B27'
  showQrVerification: true,

  // 7. Pre-printed Offset Calibration
  offsetY: 0, // -25mm to +25mm
  offsetX: 0, // -25mm to +25mm
  fontScale: 100 // 85% to 115%
};

// Preset Swatches
const PRIMARY_PALETTE = ['#0B2545', '#0F2E5A', '#1E3A8A', '#1E293B', '#991B1B', '#065F46', '#581C87', '#312E81'];
const ACCENT_PALETTE = ['#C59B27', '#F59E0B', '#D97706', '#E2E8F0', '#94A3B8', '#FBBF24', '#FEF08A', '#A16207'];

export default function CertificateStudioManager({ onSaveSuccess }) {
  const [db, setDb] = useState(loadDB());
  const [design, setDesign] = useState({
    ...DEFAULT_CERTIFICATE_DESIGN,
    ...(db.settings?.certificateDesign || {})
  });
  const [savedAlert, setSavedAlert] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.85); // Preview zoom scale

  const handleUpdate = (field, value) => {
    setDesign((prev) => ({
      ...prev,
      [field]: value
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

  // Compute background CSS
  const getBackgroundStyle = () => {
    if (design.backgroundType === 'custom' && design.customBackgroundUrl) {
      return {
        backgroundImage: `url(${design.customBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    if (design.backgroundType === 'ivory-parchment') {
      return {
        background: 'linear-gradient(135deg, #fdfbf7 0%, #fbf6ec 50%, #f7f0e1 100%)'
      };
    }
    if (design.backgroundType === 'guilloche-security') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `radial-gradient(${design.primaryColor}0D 1.5px, transparent 1.5px), radial-gradient(${design.accentColor}0D 1.5px, #FFFFFF 1.5px)`,
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 12px 12px'
      };
    }
    if (design.backgroundType === 'damask-classic') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `repeating-linear-gradient(45deg, ${design.accentColor}08, ${design.accentColor}08 10px, transparent 10px, transparent 20px)`
      };
    }
    return {
      backgroundColor: '#FFFFFF'
    };
  };

  return (
    <Box>
      {/* Top Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WorkspacePremiumIcon sx={{ color: '#C59B27', fontSize: 36 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
              Certificate Studio & Template Settings (प्रमाणपत्र स्टुडियो)
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              संस्थाको प्रमाणपत्रको पृष्ठभूमि, बोर्डर डिजाइन, रङ्ग, लोगो, ब्यहोरा र क्यालिब्रेसन अनुकूलन गर्नुहोस्।
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5}>
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
          ✓ प्रमाणपत्रको डिजाइन सफलतापूर्वक सुरक्षित गरियो! अब जारी हुने सबै प्रमाणपत्र यसै नयाँ ढाँचामा प्रिन्ट हुनेछन्।
        </Alert>
      )}

      {/* Main Studio Grid: Left Controls (5 cols) & Right Live WYSIWYG Preview (7 cols) */}
      <Grid container spacing={3}>
        {/* ============================================================== */}
        {/* LEFT COLUMN: CUSTOMIZATION CONTROLS ACCORDIONS                 */}
        {/* ============================================================== */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={2}>
            {/* 1. BACKGROUND & WATERMARK */}
            <Accordion defaultExpanded sx={{ borderRadius: '10px !important', border: '1px solid #CBD5E1', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <WallpaperIcon sx={{ color: '#0F2E5A', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    १. पृष्ठभूमि तथा वाटरमार्क (Background & Watermark)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                  प्रमाणपत्रको पृष्ठभूमि प्रकार छान्नुहोस् वा आफ्नै फोटो/ब्याकग्राउन्ड अपलोड गर्नुहोस्:
                </Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {[
                    { id: 'clean-white', label: 'सादा सेतो (White)' },
                    { id: 'ivory-parchment', label: 'आइभोरी (Ivory Parchment)' },
                    { id: 'guilloche-security', label: 'सेक्युरिटी वेभ (Guilloche)' },
                    { id: 'damask-classic', label: 'क्लासिक दमास्क (Damask)' }
                  ].map((bg) => (
                    <Grid item xs={6} key={bg.id}>
                      <Button
                        fullWidth
                        size="small"
                        variant={design.backgroundType === bg.id ? 'contained' : 'outlined'}
                        onClick={() => handleUpdate('backgroundType', bg.id)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          py: 0.8,
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

            {/* 2. BORDER DESIGN & COLOR PALETTE */}
            <Accordion sx={{ borderRadius: '10px !important', border: '1px solid #CBD5E1', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <BorderStyleIcon sx={{ color: '#C59B27', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    २. बोर्डर डिजाइन तथा रङ्ग (Border Style & Colors)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {/* Border Style */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 1 }}>
                  बोर्डरको ढाँचा (Border Style):
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {[
                    { id: 'royal-double', label: 'शाही डबल लाइन (Royal Double)' },
                    { id: 'ornate-vintage', label: 'ओर्नेट कुना (Vintage Ornate)' },
                    { id: 'modern-gold', label: 'आधुनिक स्लीक (Modern Sleek)' },
                    { id: 'none', label: 'बोर्डर नराख्ने (None - Preprinted)' }
                  ].map((b) => (
                    <Grid item xs={6} key={b.id}>
                      <Button
                        fullWidth
                        size="small"
                        variant={design.borderStyle === b.id ? 'contained' : 'outlined'}
                        onClick={() => handleUpdate('borderStyle', b.id)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          py: 0.8,
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

                {/* Primary Border Color */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                  मुख्य बोर्डर रङ्ग (Primary Frame Color):
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  {PRIMARY_PALETTE.map((color) => (
                    <Box
                      key={color}
                      onClick={() => handleUpdate('primaryColor', color)}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: color,
                        cursor: 'pointer',
                        border: design.primaryColor === color ? '3px solid #F59E0B' : '2px solid #FFFFFF',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                    />
                  ))}
                  <TextField
                    size="small"
                    value={design.primaryColor}
                    onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                    sx={{ width: 100, ml: 1, '& input': { p: '4px 8px', fontSize: '0.78rem' } }}
                  />
                </Box>

                {/* Accent/Gold Border Color */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#C59B27', display: 'block', mb: 0.8 }}>
                  सहायक सुनौलो रङ्ग (Accent / Inlay Color):
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  {ACCENT_PALETTE.map((color) => (
                    <Box
                      key={color}
                      onClick={() => handleUpdate('accentColor', color)}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: color,
                        cursor: 'pointer',
                        border: design.accentColor === color ? '3px solid #0F2E5A' : '2px solid #FFFFFF',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                    />
                  ))}
                  <TextField
                    size="small"
                    value={design.accentColor}
                    onChange={(e) => handleUpdate('accentColor', e.target.value)}
                    sx={{ width: 100, ml: 1, '& input': { p: '4px 8px', fontSize: '0.78rem' } }}
                  />
                </Box>
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

            {/* 6. PRE-PRINTED PAPER OFFSETS */}
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
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                  छापाखानाबाट छापिएका खाली कागजमा नाम र मिति ठ्याक्कै खाली ठाउँमा बस्ने गरी मिलान गर्नुहोस्:
                </Typography>

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
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                  A4 Landscape (वास्तविक प्रिन्ट अनुपात)
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>प्रिभ्यु जुम:</Typography>
                <Button size="small" onClick={() => setPreviewScale((p) => Math.max(0.65, p - 0.05))}>-</Button>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>{Math.round(previewScale * 100)}%</Typography>
                <Button size="small" onClick={() => setPreviewScale((p) => Math.min(1.05, p + 0.05))}>+</Button>
              </Box>
            </Paper>

            {/* Scaled Certificate Wrapper */}
            <Box
              sx={{
                overflow: 'auto',
                p: 1.5,
                bgcolor: '#475569',
                borderRadius: 2.5,
                display: 'flex',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
              }}
            >
              {/* The Live Certificate Canvas */}
              <Box
                id="liveCertificateStudioCanvas"
                sx={{
                  width: '980px',
                  minHeight: '680px',
                  p: `${design.borderMargin}mm`,
                  boxSizing: 'border-box',
                  fontFamily: "'Times New Roman', serif",
                  color: '#0F172A',
                  position: 'relative',
                  border:
                    design.borderStyle === 'royal-double'
                      ? `${design.borderWidth}px double ${design.primaryColor}`
                      : design.borderStyle === 'ornate-vintage'
                      ? `4px solid ${design.primaryColor}`
                      : design.borderStyle === 'modern-gold'
                      ? `2.5px solid ${design.accentColor}`
                      : 'none',
                  outline:
                    design.borderStyle === 'royal-double'
                      ? `2.5px solid ${design.accentColor}`
                      : design.borderStyle === 'modern-gold'
                      ? `1px solid ${design.primaryColor}`
                      : 'none',
                  outlineOffset: '-10px',
                  borderRadius: design.borderStyle === 'modern-gold' ? '8px' : '2px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transform: `scale(${previewScale}) translate(${design.offsetX}px, ${design.offsetY}px)`,
                  transformOrigin: 'top center',
                  transition: 'all 0.15s ease',
                  ...getBackgroundStyle()
                }}
              >
                {/* Subtle Watermark Logo */}
                {design.watermarkOpacity > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '52%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      opacity: design.watermarkOpacity / 100,
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 320 * (design.watermarkScale / 100), color: design.primaryColor }} />
                  </Box>
                )}

                {/* 1. Institutional Letterhead Header */}
                {design.showHeader && (
                  <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', pb: 1, borderBottom: `1.5px solid ${design.accentColor}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                      {/* Left Logo */}
                      <Box sx={{ display: 'flex', alignItems: 'center', width: 60 }}>
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
                            fontSize: '1.35rem',
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
                            fontSize: '1.05rem',
                            letterSpacing: '0.02em',
                            mt: 0.2
                          }}
                        >
                          {design.instituteNameNepali}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.74rem', fontWeight: 600, mt: 0.3 }}>
                          {design.accreditationText}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                          {design.affiliationCodeText}
                        </Typography>
                      </Box>

                      {/* Right Logo */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 60 }}>
                        {design.showRightLogo && <VerifiedIcon sx={{ fontSize: 44, color: design.accentColor }} />}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* 2. Certificate Title Banner */}
                <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', my: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: design.primaryColor,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontSize: '1.25rem',
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
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155'
                  }}
                >
                  <Box>Certificate No: <b style={{ color: design.primaryColor }}>GE-2081-000101</b></Box>
                  <Box>Registration / TGID: <b style={{ color: design.primaryColor }}>TGID-101</b></Box>
                  <Box>Issue Date: <b>2026-09-01</b></Box>
                </Box>

                {/* 4. Trainee Centerpiece & Photo Frame */}
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, my: 1.2 }}>
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
                        fontSize: '1.75rem',
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
                <Box sx={{ position: 'relative', zIndex: 1, px: 3, textAlign: 'justify' }}>
                  {(design.bodyLayoutMode === 'bilingual' || design.bodyLayoutMode === 'english-only') && (
                    <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, color: '#1E293B', mb: 0.8 }}>
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
                    <Typography variant="body2" sx={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: '0.86rem', lineHeight: 1.5, color: '#1E293B' }}>
                      प्रमाणित गरिन्छ कि गोकर्णेश्वर-०५, काठमाडौँ निवासी श्री हरि शर्माको सुपुत्री सुश्री <b>सुनिता शर्मा</b>ले यस संस्थाद्वारा मिति <b>२०८३/०२/१८</b> देखि <b>२०८३/०५/१८</b> सम्म सञ्चालित <b>३९० घन्टे</b> <b>"आधारभूत ब्युटिसियन तालिम"</b> सफलतापूर्वक सम्पन्न गर्नुभएकोले यो <b>व्यावसायिक तालिम समापन प्रमाणपत्र</b> प्रदान गरिएको छ।
                    </Typography>
                  )}
                </Box>

                {/* 6. Footer: QR Code + Golden Seal + Dual Signatures */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    mt: 1.5,
                    pt: 1.2,
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
                          <QRCodeSVG value="https://globalera.edu.np/verify?cert=GE-2081-000101" size={56} level="M" />
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
    </Box>
  );
}
