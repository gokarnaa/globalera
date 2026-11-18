import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  IconButton,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { loadDB, saveDB } from '../../services/storage';
import AgreementSheet, {
  DEFAULT_AGREEMENT_TEMPLATE,
  mergeAgreementTemplate
} from '../admission/AgreementSheet';

const SAMPLE_ADMISSION = {
  agreementNo: 'GE-AGR-2083-001',
  studentId: 'STD-1001',
  tgid: 'TGID-2083-01',
  studentName: 'Aachal Magar',
  gender: 'Female',
  phone: '9860998815',
  currentAddress: 'Jorpati, Kathmandu',
  permanentAddress: 'Sindhupalchok',
  citizenshipNumber: '27-01-78-04512',
  courseTitle: 'Full Course Beautician (Level 2)',
  groupName: 'GRP-01 (Morning)',
  shift: 'Morning',
  timing: '07:00 AM - 10:00 AM',
  duration: '3 Months (390 Hrs)',
  ojtPreference: 'REQUIRED',
  totalCourseFee: 25000,
  discountAmount: 2000,
  netPayableFee: 23000,
  advancePaid50: 11500,
  dueAmount50: 11500,
  receiptNo: 'REC-1042',
  paymentMethod: 'Cash / QR',
  dueDate: '2083-08-30',
  admissionDateBS: '2083-08-01'
};

const ACCENT_SWATCHES = [
  { label: 'Navy Blue', value: '#0f2e5a' },
  { label: 'Emerald', value: '#047857' },
  { label: 'Crimson', value: '#991b1b' },
  { label: 'Slate Black', value: '#1e293b' }
];

const PRESETS = {
  standard: DEFAULT_AGREEMENT_TEMPLATE,
  compact: {
    ...DEFAULT_AGREEMENT_TEMPLATE,
    fontScale: 'compact',
    copyMode: 'single',
    borderStyle: 'minimal'
  },
  bilingual: {
    ...DEFAULT_AGREEMENT_TEMPLATE,
    title: 'TRAINEE ADMISSION & VOCATIONAL TRAINING AGREEMENT (प्रशिक्षार्थी भर्ना सम्झौता)',
    subtitle: 'ENROLLMENT TERMS, FEE SCHEDULE & CODE OF CONDUCT • प्रविधि र सीप तालिम नियम',
    feePolicyNote:
      '* Policy / नियम: बाँकी ५०% तालिम शुल्क ३० दिनभित्र बुझाउनु पर्नेछ। एकपटक बुझाएको शुल्क फिर्ता हुने छैन।',
    rules: [
      'Attendance (हाजिरी): प्रमाणपत्र र OJT को लागि कम्तिमा ८०% हाजिरी अनिवार्य हुनेछ।',
      'Safety & Equipment (उपकरण सुरक्षा): ल्याबका मेसिन र औजारहरू सावधानीपूर्वक चलाउनु पर्नेछ; लापरवाहीले क्षति भएमा प्रशिक्षार्थीले व्यहोर्नुपर्नेछ।',
      'Batch Transfer (ब्याच परिवर्तन): विशेष स्वास्थ्य/व्यक्तिगत कारणले प्रशासनको स्वीकृतिमा १ पटक मात्र ब्याच सार्न सकिनेछ।',
      'Certification (प्रमाणपत्र): १००% शुल्क चुक्ता र आन्तरिक परीक्षा उत्तीर्ण भएपछि मात्र प्रमाणपत्र प्रदान गरिनेछ।'
    ]
  }
};

export default function AgreementStudioManager({ onSaveSuccess }) {
  const initialDb = loadDB();
  const [tpl, setTpl] = useState(() => mergeAgreementTemplate(initialDb.settings?.agreementTemplate));
  const [companyProfile] = useState(() => initialDb.settings?.companyProfile || {});
  const [newRuleText, setNewRuleText] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const updateField = (key, val) => setTpl((prev) => ({ ...prev, [key]: val }));

  const handleRuleChange = (idx, val) => {
    setTpl((prev) => {
      const next = [...prev.rules];
      next[idx] = val;
      return { ...prev, rules: next };
    });
  };

  const handleMoveRule = (idx, dir) => {
    setTpl((prev) => {
      const next = [...prev.rules];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, rules: next };
    });
  };

  const handleDeleteRule = (idx) => {
    setTpl((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== idx)
    }));
  };

  const handleAddRule = () => {
    const clean = newRuleText.trim();
    if (!clean) return;
    setTpl((prev) => ({ ...prev, rules: [...prev.rules, clean] }));
    setNewRuleText('');
  };

  const handleSave = () => {
    const db = loadDB();
    saveDB({
      ...db,
      settings: {
        ...(db.settings || {}),
        agreementTemplate: tpl
      }
    });
    setSavedMsg('Agreement template saved & synced to cloud! All agreement prints will use this layout.');
    setTimeout(() => setSavedMsg(''), 4000);
    onSaveSuccess?.();
  };

  const handleReset = () => {
    setTpl(DEFAULT_AGREEMENT_TEMPLATE);
    setSavedMsg('Reset to default template (click Save Template to apply).');
    setTimeout(() => setSavedMsg(''), 3500);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Top Action Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 1.75,
          borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <DescriptionIcon sx={{ color: '#0f2e5a', fontSize: 28 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Dynamic Agreement Studio & Clause Designer
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Customize sections, add/edit/remove rules, branding & A4 layout with instant live preview
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Reset Default
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ fontWeight: 800, textTransform: 'none', bgcolor: '#0f2e5a', '&:hover': { bgcolor: '#1e3a8a' } }}
          >
            Save Agreement Template
          </Button>
        </Stack>
      </Paper>

      {savedMsg && (
        <Alert icon={<CheckCircleIcon />} severity="success" sx={{ borderRadius: 2 }}>
          {savedMsg}
        </Alert>
      )}

      {/* Split-Screen Studio */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' },
          gap: 2,
          alignItems: 'start'
        }}
      >
        {/* Left Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {/* Presets */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', display: 'block', mb: 0.75 }}>
              Quick Presets
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip label="Standard English" onClick={() => setTpl(PRESETS.standard)} clickable size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
              <Chip label="Compact 1-Page" onClick={() => setTpl(PRESETS.compact)} clickable size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
              <Chip label="Bilingual (EN + नेपाली)" onClick={() => setTpl(PRESETS.bilingual)} clickable size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
            </Stack>
          </Box>

          <Divider />

          {/* Layout & Style */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              Design & Layout
            </Typography>

            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>
                Accent Color
              </Typography>
              <Stack direction="row" spacing={1}>
                {ACCENT_SWATCHES.map((c) => (
                  <Tooltip key={c.value} title={c.label}>
                    <Box
                      onClick={() => updateField('accentColor', c.value)}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: c.value,
                        cursor: 'pointer',
                        border: tpl.accentColor === c.value ? '3px solid #f59e0b' : '2px solid #e2e8f0'
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.4 }}>
                  Print Copies
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={tpl.copyMode}
                  onChange={(_, v) => v && updateField('copyMode', v)}
                >
                  <ToggleButton value="dual" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>
                    Dual (Office + Student)
                  </ToggleButton>
                  <ToggleButton value="single" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>
                    Single Copy
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.4 }}>
                  Font Size
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={tpl.fontScale}
                  onChange={(_, v) => v && updateField('fontScale', v)}
                >
                  <ToggleButton value="compact" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>Compact</ToggleButton>
                  <ToggleButton value="standard" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>Standard</ToggleButton>
                  <ToggleButton value="large" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>Large</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.4 }}>
                Border Frame
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={tpl.borderStyle}
                onChange={(_, v) => v && updateField('borderStyle', v)}
              >
                <ToggleButton value="solid" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>Classic</ToggleButton>
                <ToggleButton value="double" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>Double Frame</ToggleButton>
                <ToggleButton value="minimal" sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}>Minimal</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Divider />

          {/* Sections On/Off */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
              Show / Hide Sections
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.25 }}>
              <FormControlLabel control={<Switch size="small" checked={tpl.showLogo} onChange={(e) => updateField('showLogo', e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>Institute Logo</Typography>} />
              <FormControlLabel control={<Switch size="small" checked={tpl.showStamp} onChange={(e) => updateField('showStamp', e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>Official Seal</Typography>} />
              <FormControlLabel control={<Switch size="small" checked={tpl.showOjtSection} onChange={(e) => updateField('showOjtSection', e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>OJT Section</Typography>} />
              <FormControlLabel control={<Switch size="small" checked={tpl.showFeeTable} onChange={(e) => updateField('showFeeTable', e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>Fee Table</Typography>} />
              <FormControlLabel control={<Switch size="small" checked={tpl.showRulesSection} onChange={(e) => updateField('showRulesSection', e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>Rules & Clauses</Typography>} />
              <FormControlLabel control={<Switch size="small" checked={tpl.showGuardianSignature} onChange={(e) => updateField('showGuardianSignature', e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>Guardian Sign</Typography>} />
            </Box>
          </Box>

          <Divider />

          {/* Headings & Notes */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              Headings & Policy Text
            </Typography>
            <TextField size="small" fullWidth label="Agreement Title" value={tpl.title} onChange={(e) => updateField('title', e.target.value)} />
            <TextField size="small" fullWidth label="Subtitle" value={tpl.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} />
            {tpl.showOjtSection && (
              <TextField size="small" fullWidth multiline minRows={2} label="OJT Clause Note" value={tpl.ojtNote} onChange={(e) => updateField('ojtNote', e.target.value)} />
            )}
            {tpl.showFeeTable && (
              <TextField size="small" fullWidth multiline minRows={2} label="Fee Policy Note" value={tpl.feePolicyNote} onChange={(e) => updateField('feePolicyNote', e.target.value)} />
            )}
            <TextField size="small" fullWidth multiline minRows={2} label="Declaration Statement" value={tpl.declarationText} onChange={(e) => updateField('declarationText', e.target.value)} />
          </Box>

          <Divider />

          {/* Dynamic Rules / Clauses */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              Editable Rules / Clauses ({tpl.rules.length})
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
              Variables: {'{{studentName}}'}, {'{{courseTitle}}'}, {'{{netFee}}'}, {'{{dueDate}}'}
            </Typography>
            {tpl.rules.map((rule, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  value={rule}
                  onChange={(e) => handleRuleChange(idx, e.target.value)}
                  InputProps={{ sx: { fontSize: '0.78rem' } }}
                />
                <Stack direction="column">
                  <IconButton size="small" disabled={idx === 0} onClick={() => handleMoveRule(idx, -1)}>
                    <ArrowUpwardIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                  <IconButton size="small" disabled={idx === tpl.rules.length - 1} onClick={() => handleMoveRule(idx, 1)}>
                    <ArrowDownwardIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Stack>
                <IconButton size="small" color="error" onClick={() => handleDeleteRule(idx)}>
                  <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Add new rule / clause..."
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              />
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddRule} sx={{ fontWeight: 700, flexShrink: 0 }}>
                Add
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Right Live A4 Preview */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: '#F1F5F9'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Live A4 Preview ({tpl.copyMode === 'dual' ? 'Office Copy shown — Student Copy prints on Page 2' : 'Single Copy'})
            </Typography>
            <Chip size="small" label="Real-time Sync" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
          </Box>
          <AgreementSheet
            admission={SAMPLE_ADMISSION}
            template={tpl}
            copyType="OFFICE"
            companyProfile={companyProfile}
          />
        </Paper>
      </Box>
    </Box>
  );
}
