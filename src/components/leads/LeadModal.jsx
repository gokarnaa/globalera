import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Divider,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CampaignIcon from '@mui/icons-material/Campaign';
import FlagIcon from '@mui/icons-material/Flag';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export const MASTER_SUBJECTS = [
  'Beautician (कस्मोटोलोजी / ब्यूटिसियन)',
  'Care Giver (केयर गिभर / स्वास्थ्य सेवा)',
  'Tailoring & Garment (सिलाई कटाई तथा फेसन)',
  'Bakery & Confectionery (बेकरी तथा पेस्ट्री)',
  'Mobile Phone Repair (मोबाइल मर्मत)',
  'Computer Basics & Office App (कम्प्युटर तालिम)',
  'Electrician (House Wiring) (इलेक्ट्रिसियन)',
  'Plumbing (प्लम्बिङ)',
  'Fast Food & Commercial Cooking (फास्टफुड तथा कुकिङ)',
  'Barista & Coffee Making (बरिस्ता / कफी)',
  'Photography & Videography (फोटोग्राफी)',
  'Graphic Design (ग्राफिक डिजाइन)',
  'Achar & Pickle Making (अचार बनाउने)',
  'Boutique & Advanced Fashion (बु boutique)',
  'Other Vocational Trade (अन्य सीप)'
];

export const LEAD_SOURCES = [
  'Walk-in (कार्यालयमा आएको)',
  'Phone Inquiry (फोन सम्पर्क)',
  'Facebook (फेसबुक)',
  'Instagram (इन्स्टाग्राम)',
  'TikTok (टिकटक)',
  'WhatsApp (ह्वाट्सएप)',
  'Website (वेबसाइट)',
  'Referral (सिफारिस / साथी)',
  'Poster / Banner (पोस्टर / ब्यानर)',
  'Other (अन्य)'
];

export const LEAD_STAGES = [
  { value: 'New Lead', label: 'New Lead (नयाँ सोधपुछ)', color: '#3B82F6' },
  { value: 'Contacted', label: 'Contacted (सम्पर्क भएको)', color: '#8B5CF6' },
  { value: 'Interested', label: 'Interested (इच्छुक / Positive)', color: '#F59E0B' },
  { value: 'Follow-up', label: 'Follow-up (पुन: सम्पर्क गर्नुपर्ने)', color: '#06B6D4' },
  { value: 'Converted', label: 'Converted (भर्ना सम्पन्न / Enrolled)', color: '#10B981' },
  { value: 'Lost', label: 'Lost (अनुपस्थित / रद्द)', color: '#EF4444' }
];

export const LEAD_PRIORITIES = [
  { value: 'High', label: 'High (उच्च)', color: '#EF4444' },
  { value: 'Medium', label: 'Medium (मध्यम)', color: '#F59E0B' },
  { value: 'Low', label: 'Low (सामान्य)', color: '#64748B' }
];

export default function LeadModal({
  open,
  onClose,
  onSave,
  editingLead,
  courses = []
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    subject: '',
    course: '',
    duration: '',
    price: '',
    source: 'Walk-in (कार्यालयमा आएको)',
    priority: 'Medium',
    stage: 'New Lead',
    followUpDate: '',
    notes: ''
  });

  const [validationError, setValidationError] = useState('');

  // Reset or fill formData when editingLead changes or modal opens
  useEffect(() => {
    if (editingLead) {
      setFormData({
        name: editingLead.name || '',
        phone: editingLead.phone || '',
        address: editingLead.address || '',
        subject: editingLead.subject || '',
        course: editingLead.course || '',
        duration: editingLead.duration || '',
        price: editingLead.price || '',
        source: editingLead.source || 'Walk-in (कार्यालयमा आएको)',
        priority: editingLead.priority || 'Medium',
        stage: editingLead.stage || 'New Lead',
        followUpDate: editingLead.followUpDate || '',
        notes: editingLead.notes || ''
      });
    } else {
      // Clear all fields for clean new lead creation (no pre-filled dummy data)
      setFormData({
        name: '',
        phone: '',
        address: '',
        subject: '',
        course: '',
        duration: '',
        price: '',
        source: 'Walk-in (कार्यालयमा आएको)',
        priority: 'Medium',
        stage: 'New Lead',
        followUpDate: '',
        notes: ''
      });
    }
    setValidationError('');
  }, [editingLead, open]);

  // When course changes, auto-fill duration & price if matching a course in Course Master
  const handleCourseChange = (selectedCourseTitle) => {
    const matchedCourse = courses.find((c) => c.title === selectedCourseTitle);
    if (matchedCourse) {
      const dur = `${matchedCourse.durationValue || 3} ${matchedCourse.durationUnit || 'Months'} (${matchedCourse.totalHours || 390} hrs)`;
      setFormData((prev) => ({
        ...prev,
        course: selectedCourseTitle,
        duration: dur,
        price: matchedCourse.price || ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        course: selectedCourseTitle
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('कृपया विद्यार्थीको नाम लेख्नुहोस् (Full Name is required).');
      return;
    }
    if (!formData.phone.trim()) {
      setValidationError('कृपया मोबाइल नम्बर लेख्नुहोस् (Mobile Phone is required).');
      return;
    }
    // Clean phone number (strip whitespace/dashes)
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setValidationError('कृपया १० अंकको मान्य मोबाइल नम्बर लेख्नुहोस् (Must be 10 digits).');
      return;
    }

    setValidationError('');
    onSave({
      ...formData,
      phone: cleanPhone,
      price: formData.price ? Number(formData.price) : 0
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.2,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 16px rgba(59, 130, 246, 0.35)'
            }}
          >
            <AutoAwesomeIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2, color: '#FFFFFF' }}>
              {editingLead ? 'सोधपुछ सम्पादन (Edit Lead / Inquiry)' : 'नयाँ सोधपुछ दर्ता (New Lead Entry)'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
              {editingLead ? `Lead ID: ${editingLead.id}` : 'तालिम सम्बन्धी सोधपुछ र काउन्सिलिङ विवरण प्रविष्टि'}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.85)',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.25)' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Dialog Form Container */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <DialogContent
          dividers
          sx={{
            p: { xs: 2.2, sm: 3 },
            bgcolor: '#F8FAFC',
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 7 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 4 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          {validationError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {validationError}
            </Alert>
          )}

          {/* SECTION 1: Personal & Contact Information */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: '#334155',
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <PersonIcon sx={{ color: '#3B82F6', fontSize: '1.2rem' }} />
            १. विद्यार्थी तथा सम्पर्क विवरण (Contact Info)
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="पूरा नाम (Full Name)"
                placeholder="उदा: सुनिता शर्मा"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="मोबाइल नम्बर (Phone / WhatsApp)"
                placeholder="९८४१...... (१० अंक)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#10B981' }} />
                    </InputAdornment>
                  )
                }}
                helperText="१० अंकको मान्य नेपाली मोबाइल नम्बर"
              />
            </Grid>

            <Grid item xs={12} sm={12}>
              <TextField
                fullWidth
                label="ठेगाना / टोल (Address / Location)"
                placeholder="उदा: जोरपाटी, काठमाडौँ"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: '#F59E0B' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          {/* SECTION 2: Course & Academic Interest */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: '#334155',
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <SchoolIcon sx={{ color: '#6366F1', fontSize: '1.2rem' }} />
            २. रुचि भएको विषय तथा पाठ्यक्रम (Subject & Course)
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="मुख्य विषय क्षेत्र (Master Subject)"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              >
                <MenuItem value="">
                  <em>-- विषय क्षेत्र छान्नुहोस् --</em>
                </MenuItem>
                {MASTER_SUBJECTS.map((subj) => (
                  <MenuItem key={subj} value={subj.split(' (')[0]}>
                    {subj}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="पाठ्यक्रम (Course)"
                value={formData.course}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>-- पाठ्यक्रम छान्नुहोस् --</em>
                </MenuItem>
                {courses.map((crs) => (
                  <MenuItem key={crs.id} value={crs.title}>
                    {crs.title} {crs.level ? `(${crs.level})` : ''}
                  </MenuItem>
                ))}
                <MenuItem value="Custom / Other Course">अन्य पाठ्यक्रम (Other / Custom)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="तालिम अवधि (Course Duration)"
                placeholder="उदा: 3 Months (390 hrs)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="अनुमानित शुल्क (Course Fee Rs.)"
                placeholder="उदा: 15000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MonetizationOnIcon sx={{ color: '#10B981' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          {/* SECTION 3: Lead Tracking & Pipeline Management */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: '#334155',
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <CampaignIcon sx={{ color: '#EC4899', fontSize: '1.2rem' }} />
            ३. सोधपुछ स्रोत र फलो-अप स्थिति (Pipeline Status)
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="सोधपुछको स्रोत (Source)"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                {LEAD_SOURCES.map((src) => (
                  <MenuItem key={src} value={src}>
                    {src}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="प्राथमिकता (Priority)"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {LEAD_PRIORITIES.map((p) => (
                  <MenuItem key={p.value} value={p.value} sx={{ color: p.color, fontWeight: 700 }}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="अवस्था (Pipeline Stage)"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              >
                {LEAD_STAGES.map((s) => (
                  <MenuItem key={s.value} value={s.value} sx={{ color: s.color, fontWeight: 700 }}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="अर्को फलो-अप मिति (Next Follow-up Date)"
                InputLabelProps={{ shrink: true }}
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon sx={{ color: '#0EA5E9' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="परामर्श नोट / कैफियत (Counselor Notes)"
                placeholder="विद्यार्थीको रुचि, शिफ्ट प्राथमिकता वा कुनै विशेष छलफल..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NoteAltIcon sx={{ color: '#64748B', alignSelf: 'flex-start', mt: 1 }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.03)',
            zIndex: 10
          }}
        >
          <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
            रद्द गर्नुहोस् (Cancel)
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
              fontWeight: 800,
              px: 3.5,
              py: 1,
              borderRadius: 2.5,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}
          >
            {editingLead ? 'अपडेट गर्नुहोस् (Update Lead)' : 'सोधपुछ दर्ता गर्नुहोस् (Save Lead)'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
