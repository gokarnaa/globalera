import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Stack,
  Grid,
  Alert,
  Divider,
  Paper,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  IconButton
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import NumbersIcon from '@mui/icons-material/Numbers';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VerifiedIcon from '@mui/icons-material/Verified';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { loadDB, saveDB } from '../../services/storage';

export function computeNextCertificateNumber(db, indexOffset = 0, context = {}) {
  const settings = db?.settings || {};
  const numConfig = settings.certificateNumberFormat || {
    formatStyle: 'year_seq',
    prefix: 'GEMS',
    yearMode: 'AD',
    seqDigits: 3,
    startSeq: 1
  };

  const existingCerts = db?.certificates || [];
  const currentCount = existingCerts.length;
  const startNum = Number(numConfig.startSeq) || 1;
  const nextSeq = currentCount + startNum + indexOffset;
  const seqFormatted = String(nextSeq).padStart(Number(numConfig.seqDigits) || 3, '0');

  const prefix = numConfig.prefix || 'GEMS';

  let yearStr = '';
  if (numConfig.yearMode === 'BS') {
    yearStr = '2081'; // Current Nepali BS Year
  } else if (numConfig.yearMode === 'NONE') {
    yearStr = '';
  } else {
    yearStr = String(new Date().getFullYear());
  }

  if (numConfig.formatStyle === 'course_batch') {
    const courseCode = context.courseCode || 'BTC';
    const batchCode = context.batchCode || 'B1';
    return `${prefix}-${courseCode}-${batchCode}-${seqFormatted}`;
  }
  if (numConfig.formatStyle === 'ctevt_slash') {
    return `${prefix || 'CTEVT-4208'}/${yearStr || '2081'}/${seqFormatted}`;
  }
  if (numConfig.formatStyle === 'bs_seq') {
    return `${prefix}-2081-${seqFormatted}`;
  }

  // Default: year_seq (e.g. GEMS-2026-001)
  return yearStr ? `${prefix}-${yearStr}-${seqFormatted}` : `${prefix}-${seqFormatted}`;
}

export default function CompanyProfileSettings({ onSaveSuccess }) {
  const [db, setDb] = useState(loadDB());
  const [profile, setProfile] = useState(() => db.settings?.companyProfile || {});
  const [numConfig, setNumConfig] = useState(() => db.settings?.certificateNumberFormat || {
    formatStyle: 'year_seq',
    prefix: 'GEMS',
    yearMode: 'AD',
    seqDigits: 3,
    startSeq: 1
  });

  const [savedAlert, setSavedAlert] = useState(false);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumConfigChange = (field, value) => {
    setNumConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('फाइल साइज ३MB भन्दा सानो हुनुपर्छ।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleProfileChange(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetKey) => {
    if (presetKey === 'year_seq') {
      setNumConfig((prev) => ({
        ...prev,
        formatStyle: 'year_seq',
        prefix: 'GEMS',
        yearMode: 'AD',
        seqDigits: 3
      }));
    } else if (presetKey === 'bs_seq') {
      setNumConfig((prev) => ({
        ...prev,
        formatStyle: 'bs_seq',
        prefix: 'GEMS',
        yearMode: 'BS',
        seqDigits: 3
      }));
    } else if (presetKey === 'course_batch') {
      setNumConfig((prev) => ({
        ...prev,
        formatStyle: 'course_batch',
        prefix: 'GEMS',
        yearMode: 'AD',
        seqDigits: 3
      }));
    } else if (presetKey === 'ctevt_slash') {
      setNumConfig((prev) => ({
        ...prev,
        formatStyle: 'ctevt_slash',
        prefix: 'CTEVT-4208',
        yearMode: 'BS',
        seqDigits: 3
      }));
    }
  };

  const handleSave = () => {
    const nextDb = {
      ...db,
      settings: {
        ...(db.settings || {}),
        companyProfile: profile,
        certificateNumberFormat: numConfig,
        // Synchronize with existing certificate design so certificates inherit updated profile automatically
        certificateDesign: {
          ...(db.settings?.certificateDesign || {}),
          instituteName: profile.companyNameEnglish,
          instituteNameEnglish: profile.companyNameEnglish,
          instituteNameNepali: profile.companyNameNepali,
          affiliationCodeText: `Government Regd. No: ${profile.companyRegNo} • CTEVT Affiliation Code: ${profile.ctevtCode} • ${profile.address}`,
          signatory2Name: profile.directorName,
          signatory2Title: profile.directorTitle
        }
      }
    };

    saveDB(nextDb);
    setDb(nextDb);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3500);

    if (onSaveSuccess) onSaveSuccess(nextDb);
  };

  // Preview generated next number
  const simulatedDb = {
    ...db,
    settings: {
      ...(db.settings || {}),
      certificateNumberFormat: numConfig
    }
  };
  const previewNextNo = computeNextCertificateNumber(simulatedDb);

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BusinessIcon sx={{ color: '#0F2E5A', fontSize: 36 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
              संस्थागत प्रोफाइल तथा जारी नम्बर सेटिङ (Company Profile & Certificate Numbering)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              संस्थाको आधिकारिक नाम, दर्ता नं, ठेगाना, संस्था प्रमुख र प्रमाणपत्र जारी नम्बर ढाँचा (GEMS-2026-001) व्यवस्थापन गर्नुहोस्।
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            fontWeight: 900,
            px: 3,
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
          }}
        >
          सुरक्षित गर्नुहोस् (Save Settings)
        </Button>
      </Box>

      {savedAlert && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
          ✓ संस्थागत प्रोफाइल र प्रमाणपत्र जारी नम्बर ढाँचा सफलतापूर्वक सुरक्षित गरियो! अब जारी हुने सबै प्रमाणपत्रमा नयाँ विवरण र नम्बर स्वतः लागु हुनेछन्।
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ============================================================== */}
        {/* CARD 1: DYNAMIC CERTIFICATE NUMBER GENERATOR (GEMS-2026-001)   */}
        {/* ============================================================== */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, borderRadius: 3, border: '2px solid #0F2E5A', bgcolor: '#F8FAFC' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <NumbersIcon sx={{ color: '#0F2E5A', fontSize: 28 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                    प्रमाणपत्र जारी नम्बर इन्जिन (Certificate Number Generation Engine)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    नयाँ प्रमाणपत्र जारी गर्दा प्रणालीले कुन ढाँचामा स्वतः नम्बर बनाउने? छनोट गर्नुहोस्:
                  </Typography>
                </Box>
              </Box>

              {/* Dynamic Live Preview Badge */}
              <Paper
                elevation={0}
                sx={{
                  p: '8px 16px',
                  borderRadius: 2,
                  bgcolor: '#ECFDF5',
                  border: '1.5px solid #059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <AutoAwesomeIcon sx={{ color: '#059669', fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 800 }}>
                  अर्को जारी हुने प्रमाणपत्र नम्बर:
                </Typography>
                <Typography variant="subtitle2" sx={{ color: '#065F46', fontWeight: 900, fontFamily: 'monospace', fontSize: '1rem' }}>
                  {previewNextNo}
                </Typography>
              </Paper>
            </Box>

            {/* Presets Switcher */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 1 }}>
              १-क्लिक ढाँचा प्रिसेटहरू (Format Presets):
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              {[
                { id: 'year_seq', label: 'विकल्प क (डिफल्ट): GEMS-2026-001', desc: 'वर्षगत अंग्रेजी' },
                { id: 'bs_seq', label: 'विकल्प ख: GEMS-2081-001', desc: 'नेपाली वि.सं.' },
                { id: 'course_batch', label: 'विकल्प ग: GEMS-BTC-B1-001', desc: 'स्मार्ट ब्याच कोड' },
                { id: 'ctevt_slash', label: 'विकल्प घ: CTEVT-4208/2081/001', desc: 'सिटिइभिटी स्ल्यास' }
              ].map((p) => (
                <Button
                  key={p.id}
                  size="small"
                  variant={numConfig.formatStyle === p.id ? 'contained' : 'outlined'}
                  onClick={() => handlePresetSelect(p.id)}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    py: 0.8,
                    px: 1.5,
                    bgcolor: numConfig.formatStyle === p.id ? '#0F2E5A' : '#FFFFFF',
                    borderColor: '#CBD5E1',
                    color: numConfig.formatStyle === p.id ? '#FFFFFF' : '#334155'
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Granular Generator Parameters */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="प्रिफिक्स (Prefix Code)"
                  value={numConfig.prefix || 'GEMS'}
                  onChange={(e) => handleNumConfigChange('prefix', e.target.value.toUpperCase())}
                  helperText="जस्तै: GEMS, GETS, GE"
                  sx={{ bgcolor: '#FFFFFF' }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                  साल/वर्ष ढाँचा (Year Format):
                </Typography>
                <ToggleButtonGroup
                  value={numConfig.yearMode || 'AD'}
                  exclusive
                  onChange={(e, next) => next && handleNumConfigChange('yearMode', next)}
                  size="small"
                  fullWidth
                  sx={{ bgcolor: '#FFFFFF' }}
                >
                  <ToggleButton value="AD">AD (2026)</ToggleButton>
                  <ToggleButton value="BS">BS (2081)</ToggleButton>
                  <ToggleButton value="NONE">वर्ष नराख्ने</ToggleButton>
                </ToggleButtonGroup>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                  अंकको लम्बाइ (Sequence Digits):
                </Typography>
                <ToggleButtonGroup
                  value={Number(numConfig.seqDigits) || 3}
                  exclusive
                  onChange={(e, next) => next && handleNumConfigChange('seqDigits', next)}
                  size="small"
                  fullWidth
                  sx={{ bgcolor: '#FFFFFF' }}
                >
                  <ToggleButton value={3}>३ अंक (001)</ToggleButton>
                  <ToggleButton value={4}>४ अंक (0001)</ToggleButton>
                </ToggleButtonGroup>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="सुरुवाती नम्बर (Starting Sequence)"
                  value={numConfig.startSeq || 1}
                  onChange={(e) => handleNumConfigChange('startSeq', e.target.value)}
                  helperText="विगतका रेकर्डबाट सुरु गर्न (जस्तै १ वा १०१)"
                  sx={{ bgcolor: '#FFFFFF' }}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* ============================================================== */}
        {/* CARD 2: INSTITUTION LEGAL CREDENTIALS & LOCATION               */}
        {/* ============================================================== */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
              <BusinessIcon sx={{ color: '#1E40AF', fontSize: 24 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                संस्थाको कानुनी तथा आधिकारिक विवरण (Company Legal Identity)
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="संस्थाको पूरा नाम (English Legal Name)"
                value={profile.companyNameEnglish || ''}
                onChange={(e) => handleProfileChange('companyNameEnglish', e.target.value)}
              />

              <TextField
                fullWidth
                size="small"
                label="संस्थाको पूरा नाम (नेपाली)"
                value={profile.companyNameNepali || ''}
                onChange={(e) => handleProfileChange('companyNameNepali', e.target.value)}
              />

              <TextField
                fullWidth
                size="small"
                label="ठेगाना तथा लोकेसन (Official Address)"
                value={profile.address || ''}
                onChange={(e) => handleProfileChange('address', e.target.value)}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="कम्पनी दर्ता नं (Company Reg No)"
                    value={profile.companyRegNo || ''}
                    onChange={(e) => handleProfileChange('companyRegNo', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="CTEVT सम्बन्धन कोड (Affiliation Code)"
                    value={profile.ctevtCode || ''}
                    onChange={(e) => handleProfileChange('ctevtCode', e.target.value)}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="सम्पर्क फोन (Phone Numbers)"
                    value={profile.contactPhone || ''}
                    onChange={(e) => handleProfileChange('contactPhone', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="आधिकारिक इमेल (Official Email)"
                    value={profile.email || ''}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Card>
        </Grid>

        {/* ============================================================== */}
        {/* CARD 3: INSTITUTIONAL LEADERSHIP & OFFICIAL ASSETS             */}
        {/* ============================================================== */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
              <BadgeIcon sx={{ color: '#C59B27', fontSize: 24 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                संस्था प्रमुख तथा आधिकारिक छाप (Leadership & Assets)
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="संस्था प्रमुख / निर्देशकको नाम (Director Name)"
                value={profile.directorName || ''}
                onChange={(e) => handleProfileChange('directorName', e.target.value)}
                helperText="सर्टिफिकेटमा Signatory 2 को रूपमा स्वतः आउँछ"
              />

              <TextField
                fullWidth
                size="small"
                label="प्रमुखको आधिकारिक पद (Designation / Title)"
                value={profile.directorTitle || ''}
                onChange={(e) => handleProfileChange('directorTitle', e.target.value)}
              />

              <Divider sx={{ my: 1 }} />

              {/* Upload Official Rubber Stamp */}
              <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                  संस्थाको आधिकारिक रबर छाप (Official Stamp PNG):
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    छाप फोटो छान्नुहोस्
                    <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload('stampUrl', e)} />
                  </Button>
                  {profile.stampUrl && (
                    <Button size="small" color="error" onClick={() => handleProfileChange('stampUrl', '')}>
                      हटाउनुहोस्
                    </Button>
                  )}
                </Stack>
              </Box>

              {/* Upload Official Institutional Logo */}
              <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                  आधिकारिक संस्थागत लोगो (Transparent Logo PNG):
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button variant="outlined" size="small" component="label" startIcon={<UploadFileIcon />} sx={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    लोगो फोटो छान्नुहोस्
                    <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload('logoUrl', e)} />
                  </Button>
                  {profile.logoUrl && (
                    <Button size="small" color="error" onClick={() => handleProfileChange('logoUrl', '')}>
                      हटाउनुहोस्
                    </Button>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
