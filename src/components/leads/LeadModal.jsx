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
  'Beautician & Cosmetology',
  'Care Giver & Healthcare',
  'Tailoring & Garment Fashion',
  'Bakery & Confectionery',
  'Mobile Phone Repair',
  'Computer Basics & Office Applications',
  'Electrician (House Wiring)',
  'Plumbing & Pipe Fitting',
  'Fast Food & Commercial Cooking',
  'Barista & Coffee Making',
  'Photography & Videography',
  'Graphic Design',
  'Pickle & Food Processing',
  'Boutique & Advanced Fashion',
  'Other Vocational Trade'
];

export const LEAD_SOURCES = [
  'Agent Referral',
  'Walk-in',
  'Phone Inquiry',
  'Facebook',
  'Instagram',
  'TikTok',
  'WhatsApp',
  'Website',
  'Referral / Friends',
  'Poster / Banner',
  'Other'
];

export const LEAD_STAGES = [
  { value: 'New Lead', label: 'New Lead', color: '#3B82F6' },
  { value: 'Contacted', label: 'Contacted', color: '#8B5CF6' },
  { value: 'Interested', label: 'Interested', color: '#F59E0B' },
  { value: 'Follow-up', label: 'Follow-up', color: '#06B6D4' },
  { value: 'Converted', label: 'Converted (Enrolled)', color: '#10B981' },
  { value: 'Lost', label: 'Lost / Cancelled', color: '#EF4444' }
];

export const LEAD_PRIORITIES = [
  { value: 'High', label: 'High', color: '#EF4444' },
  { value: 'Medium', label: 'Medium', color: '#F59E0B' },
  { value: 'Low', label: 'Low', color: '#64748B' }
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
    source: 'Walk-in',
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
        source: editingLead.source || 'Walk-in',
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
        source: 'Walk-in',
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
      setValidationError('Full Name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setValidationError('Mobile Phone is required.');
      return;
    }
    // Clean phone number (strip whitespace/dashes)
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      setValidationError('Please enter a valid mobile number.');
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
              {editingLead ? 'Edit Lead / Inquiry' : 'New Lead / Inquiry Entry'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
              {editingLead ? `Lead ID: ${editingLead.id}` : 'Enter prospective student inquiry & counselling details'}
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
            1. Student Contact Information
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Full Name"
                placeholder="e.g. Full Name"
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
                label="Mobile Phone / WhatsApp"
                placeholder="9841......"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#10B981' }} />
                    </InputAdornment>
                  )
                }}
                helperText="Primary contact number"
              />
            </Grid>

            <Grid item xs={12} sm={12}>
              <TextField
                fullWidth
                label="Address / Location"
                placeholder="e.g. Jorpati, Kathmandu"
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
            2. Program & Course Interest
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Master Subject / Sector"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              >
                <MenuItem value="">
                  <em>-- Select Sector --</em>
                </MenuItem>
                {MASTER_SUBJECTS.map((subj) => (
                  <MenuItem key={subj} value={subj}>
                    {subj}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Course"
                value={formData.course}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>-- Select Course --</em>
                </MenuItem>
                {courses.map((crs) => (
                  <MenuItem key={crs.id} value={crs.title}>
                    {crs.title} {crs.level ? `(${crs.level})` : ''}
                  </MenuItem>
                ))}
                <MenuItem value="Custom / Other Course">Other / Custom Course</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Duration"
                placeholder="e.g. 3 Months (390 hrs)"
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
                label="Course Fee (Rs.)"
                placeholder="e.g. 15000"
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
            3. Inquiry Source & Pipeline Tracking
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Lead Source"
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
                label="Priority"
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
                label="Pipeline Stage"
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
                label="Next Follow-up Date"
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
                label="Counselor Notes & Remarks"
                placeholder="Student preferences, shift availability, discussion summary..."
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
            Cancel
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
            {editingLead ? 'Update Lead' : 'Save Lead'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
