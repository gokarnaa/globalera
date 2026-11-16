import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Grid,
  Chip,
  Paper,
  Divider,
  TextField,
  Avatar,
  Stack,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FlagIcon from '@mui/icons-material/Flag';
import CampaignIcon from '@mui/icons-material/Campaign';
import HistoryIcon from '@mui/icons-material/History';
import SendIcon from '@mui/icons-material/Send';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import EditIcon from '@mui/icons-material/Edit';
import { LEAD_STAGES, LEAD_PRIORITIES } from './LeadModal';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';

export default function LeadDetailsModal({
  open,
  onClose,
  lead,
  onUpdateStage,
  onAddTimelineNote,
  onEditLead,
  onConvertToStudent
}) {
  const { currentUser } = useAuth();
  const [newNote, setNewNote] = useState('');

  if (!lead) return null;

  const currentStageObj = LEAD_STAGES.find((s) => s.value === lead.stage) || LEAD_STAGES[0];
  const currentPriorityObj = LEAD_PRIORITIES.find((p) => p.value === lead.priority) || LEAD_PRIORITIES[1];

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddTimelineNote(lead.id, newNote.trim(), currentUser?.name || 'Counselor / Staff');
    setNewNote('');
  };

  const whatsAppText = `Hello ${lead.name}! Greetings from Prabidhik School, Jorpati (Global Era TVET). We are following up regarding your inquiry for '${lead.course || 'Vocational Training'}' to assist with details and the admission process.`;
  const waUrl = `https://wa.me/977${lead.phone}?text=${encodeURIComponent(whatsAppText)}`;

  const quickTemplates = [
    'Called - No Answer',
    'WhatsApp Brochure Sent',
    'Campus Visit Scheduled',
    'Ready for Admission'
  ];

  const handleQuickLog = (text) => {
    onAddTimelineNote(lead.id, text, currentUser?.name || 'Counselor / Staff');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }
      }}
    >
      {/* Executive Navy + Gold Header */}
      <DialogTitle
        sx={{
          m: 0,
          py: 1.75,
          px: 2.5,
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
          borderBottom: '2.5px solid #F59E0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: currentStageObj.color,
              fontWeight: 800,
              fontSize: '1.15rem',
              border: '2px solid rgba(255,255,255,0.35)'
            }}
          >
            {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem', lineHeight: 1.2 }}>
                {lead.name}
              </Typography>
              <Chip
                label={lead.id}
                size="small"
                sx={{ height: 20, bgcolor: 'rgba(255,255,255,0.16)', color: '#FDE68A', fontWeight: 800, fontSize: '0.68rem' }}
              />
              <Chip
                label={currentStageObj.label.split(' (')[0]}
                size="small"
                sx={{ height: 20, bgcolor: currentStageObj.color, color: '#FFFFFF', fontWeight: 800, fontSize: '0.68rem' }}
              />
            </Stack>
            <Typography variant="caption" noWrap sx={{ color: '#CBD5E1', display: 'block', mt: 0.2, fontSize: '0.73rem' }}>
              {lead.subject ? `${lead.subject} • ` : ''}{lead.course || 'General Inquiry'} • {lead.phone}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Tooltip title={`Call ${lead.phone}`}>
            <Button
              size="small"
              variant="contained"
              component="a"
              href={`tel:${lead.phone}`}
              startIcon={<PhoneIcon sx={{ fontSize: '14px !important' }} />}
              sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: '#0369A1' } }}
            >
              Call
            </Button>
          </Tooltip>
          <Tooltip title="Message on WhatsApp">
            <Button
              size="small"
              variant="contained"
              component="a"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon sx={{ fontSize: '14px !important' }} />}
              sx={{ bgcolor: '#10B981', color: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: '#059669' } }}
            >
              WhatsApp
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
            onClick={() => {
              onClose();
              onEditLead(lead);
            }}
            sx={{
              color: '#FDE68A',
              borderColor: 'rgba(253, 230, 138, 0.4)',
              fontWeight: 700,
              '&:hover': { borderColor: '#FDE68A', bgcolor: 'rgba(253, 230, 138, 0.12)' }
            }}
          >
            Edit
          </Button>
          <IconButton
            size="small"
            aria-label="Close lead profile"
            onClick={onClose}
            sx={{ color: '#CBD5E1', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.14)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.75, sm: 2.25 }, bgcolor: '#F8FAFC' }}>
        {/* 1-Row Horizontal Stepped Pipeline Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            mb: 2,
            borderRadius: 2,
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            overflowX: 'auto'
          }}
        >
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 'max-content' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', fontSize: '0.68rem', mr: 0.5 }}>
              Stage:
            </Typography>
            {LEAD_STAGES.map((stg) => {
              const isCurrent = lead.stage === stg.value;
              return (
                <Chip
                  key={stg.value}
                  label={stg.label.split(' (')[0]}
                  size="small"
                  onClick={() => onUpdateStage(lead.id, stg.value)}
                  clickable
                  sx={{
                    height: 24,
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    bgcolor: isCurrent ? stg.color : '#F8FAFC',
                    color: isCurrent ? '#FFFFFF' : '#475569',
                    border: isCurrent ? `1px solid ${stg.color}` : '1px solid #E2E8F0',
                    '&:hover': { bgcolor: isCurrent ? stg.color : '#EFF6FF' }
                  }}
                />
              );
            })}
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {/* Left Column: Compact Lead Profile Details (5 Cols) */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                height: '100%'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 1.5 }}>
                Lead Profile Details
              </Typography>

              <Stack spacing={1.35}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <LocationOnIcon sx={{ color: '#F59E0B', fontSize: '1.05rem', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                      Location
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                      {lead.address || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <SchoolIcon sx={{ color: '#2563EB', fontSize: '1.05rem', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                      Course / Subject
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.8rem' }}>
                      {lead.course || 'General Inquiry'}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ color: '#0EA5E9', fontSize: '1rem', flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.66rem' }}>
                          Duration
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem' }}>
                          {lead.duration || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MonetizationOnIcon sx={{ color: '#059669', fontSize: '1rem', flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.66rem' }}>
                          Course Fee
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '0.78rem' }}>
                          {lead.price ? `Rs. ${Number(lead.price).toLocaleString()}` : 'Free / Discuss'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CampaignIcon sx={{ color: '#EC4899', fontSize: '1rem', flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.66rem' }}>
                          Source
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem' }}>
                          {lead.source || 'Direct'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlagIcon sx={{ color: currentPriorityObj.color, fontSize: '1rem', flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.66rem' }}>
                          Priority
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: currentPriorityObj.color, fontSize: '0.78rem' }}>
                          {currentPriorityObj.label}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <CalendarMonthIcon sx={{ color: '#7C3AED', fontSize: '1.05rem', flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                      Next Follow-up Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                      {lead.followUpDate || 'Not set'}
                    </Typography>
                  </Box>
                </Box>

                {lead.notes && (
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: 1.8, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, display: 'block', mb: 0.3, fontSize: '0.68rem' }}>
                      Initial Remarks
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', fontSize: '0.78rem' }}>
                      &quot;{lead.notes}&quot;
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Right Column: Interaction Activity Timeline & Quick Notes (7 Cols) */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  fontSize: '0.68rem',
                  mb: 1.25,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75
                }}
              >
                <HistoryIcon sx={{ color: '#2563EB', fontSize: '1rem' }} />
                Activity Timeline &amp; Follow-up History
              </Typography>

              {/* Add New Note Box + 1-Click Quick Templates */}
              <Box component="form" onSubmit={handleAddNoteSubmit} sx={{ mb: 1.75 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Log notes from calls, meetings, or counselling discussions..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
                  <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                    {quickTemplates.map((tpl) => (
                      <Chip
                        key={tpl}
                        label={tpl}
                        size="small"
                        clickable
                        onClick={() => handleQuickLog(tpl)}
                        sx={{
                          height: 21,
                          fontSize: '0.67rem',
                          fontWeight: 700,
                          bgcolor: '#F1F5F9',
                          color: '#334155',
                          '&:hover': { bgcolor: '#E0F2FE', color: '#0369A1' }
                        }}
                      />
                    ))}
                  </Stack>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    endIcon={<SendIcon sx={{ fontSize: '13px !important' }} />}
                    disabled={!newNote.trim()}
                    sx={{ bgcolor: '#0F2C59', fontWeight: 700 }}
                  >
                    Log Note
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 1.5 }} />

              {/* Chronological Timeline List */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, maxHeight: 280 }}>
                {(!lead.timeline || lead.timeline.length === 0) ? (
                  <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 3, fontSize: '0.78rem' }}>
                    No follow-up notes recorded yet. Click a quick tag or add a note above.
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {[...lead.timeline].reverse().map((entry, idx) => {
                      const dateObj = new Date(entry.date);
                      const formattedDate = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : entry.date;

                      return (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.4,
                            borderRadius: 1.8,
                            bgcolor: '#F8FAFC',
                            borderLeft: '3.5px solid #2563EB',
                            borderTop: '1px solid #E2E8F0',
                            borderRight: '1px solid #E2E8F0',
                            borderBottom: '1px solid #E2E8F0',
                            transition: 'background-color 150ms ease-out',
                            '&:hover': { bgcolor: '#F1F5F9' }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E40AF', fontSize: '0.72rem' }}>
                              {entry.staffName || 'Counselor'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.68rem' }}>
                              {formattedDate}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.45, fontSize: '0.79rem' }}>
                            {entry.note}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button size="small" onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
          Close
        </Button>

        {lead.stage !== 'Converted' ? (
          <Button
            size="small"
            variant="contained"
            onClick={() => onConvertToStudent(lead)}
            startIcon={<HowToRegIcon sx={{ fontSize: '15px !important' }} />}
            sx={{
              bgcolor: '#059669',
              fontWeight: 800,
              px: 2,
              '&:hover': { bgcolor: '#047857' }
            }}
          >
            Convert to Student
          </Button>
        ) : (
          <Chip
            icon={<HowToRegIcon />}
            label="Student Enrolled"
            color="success"
            size="small"
            sx={{ fontWeight: 800, px: 0.5 }}
          />
        )}
      </DialogActions>
    </Dialog>
  );
}
