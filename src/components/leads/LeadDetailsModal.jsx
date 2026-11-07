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

  const whatsAppText = `Hello ${lead.name}! Greetings from Global Era Technical School (Global Era TVET). We are following up regarding your inquiry for '${lead.course || 'Vocational Training'}' to assist with details and the admission process.`;
  const waUrl = `https://wa.me/977${lead.phone}?text=${encodeURIComponent(whatsAppText)}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: currentStageObj.color,
              fontWeight: 800,
              fontSize: '1.4rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                {lead.name}
              </Typography>
              <Chip
                label={lead.id}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#93C5FD',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.3 }}>
              {lead.subject ? `${lead.subject} • ` : ''} {lead.course || 'General Inquiry'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => {
              onClose();
              onEditLead(lead);
            }}
            sx={{
              color: '#93C5FD',
              borderColor: 'rgba(147, 197, 253, 0.4)',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { borderColor: '#93C5FD', bgcolor: 'rgba(147, 197, 253, 0.1)' }
            }}
          >
            Edit
          </Button>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#94A3B8',
              '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F8FAFC' }}>
        {/* Quick Contact & Action Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              component="a"
              href={`tel:${lead.phone}`}
              startIcon={<PhoneIcon />}
              sx={{
                bgcolor: '#0284C7',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#0369A1' }
              }}
            >
              Call {lead.phone}
            </Button>

            <Button
              variant="contained"
              component="a"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon />}
              sx={{
                bgcolor: '#10B981',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              WhatsApp
            </Button>
          </Box>

          {lead.stage !== 'Converted' ? (
            <Button
              variant="contained"
              onClick={() => onConvertToStudent(lead)}
              startIcon={<HowToRegIcon />}
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                fontWeight: 800,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                textTransform: 'none'
              }}
            >
              Convert to Student
            </Button>
          ) : (
            <Chip
              icon={<HowToRegIcon />}
              label="Student Enrolled"
              color="success"
              sx={{ fontWeight: 800, fontSize: '0.85rem', px: 1 }}
            />
          )}
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column: Lead Information & Quick Stage Switcher */}
          <Grid item xs={12} md={5}>
            {/* Stage Quick Switcher */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 2.5,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 1.5 }}>
                Pipeline Stage
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {LEAD_STAGES.map((stg) => {
                  const isCurrent = lead.stage === stg.value;
                  return (
                    <Chip
                      key={stg.value}
                      label={stg.label.split(' (')[0]}
                      onClick={() => onUpdateStage(lead.id, stg.value)}
                      clickable
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: isCurrent ? stg.color : '#F1F5F9',
                        color: isCurrent ? '#FFFFFF' : '#475569',
                        border: isCurrent ? `1px solid ${stg.color}` : '1px solid #CBD5E1',
                        '&:hover': {
                          bgcolor: isCurrent ? stg.color : '#E2E8F0'
                        }
                      }}
                    />
                  );
                })}
              </Stack>
            </Paper>

            {/* Information Cards */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 2 }}>
                Lead Profile Details
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocationOnIcon sx={{ color: '#F59E0B', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Location
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      {lead.address || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SchoolIcon sx={{ color: '#6366F1', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Course / Subject
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      {lead.course || 'General Inquiry'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccessTimeIcon sx={{ color: '#0EA5E9', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      {lead.duration || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MonetizationOnIcon sx={{ color: '#10B981', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Course Fee
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>
                      {lead.price ? `Rs. ${Number(lead.price).toLocaleString()}` : 'Free / Pending Discussion'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CampaignIcon sx={{ color: '#EC4899', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Source
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      {lead.source || 'Direct'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <FlagIcon sx={{ color: currentPriorityObj.color, fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Priority
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: currentPriorityObj.color }}>
                      {currentPriorityObj.label}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarMonthIcon sx={{ color: '#8B5CF6', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Next Follow-up Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      {lead.followUpDate || 'Not set'}
                    </Typography>
                  </Box>
                </Box>

                {lead.notes && (
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, display: 'block', mb: 0.5 }}>
                      Initial Remarks:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic' }}>
                      "{lead.notes}"
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Right Column: Interaction Activity Timeline & Add Note */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: '#334155',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <HistoryIcon sx={{ color: '#3B82F6' }} />
                Activity Timeline & Follow-up History
              </Typography>

              {/* Add New Note Box */}
              <Box component="form" onSubmit={handleAddNoteSubmit} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Log notes from calls, meetings, or counselling discussions..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    endIcon={<SendIcon />}
                    disabled={!newNote.trim()}
                    sx={{
                      bgcolor: '#1E40AF',
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: 'none'
                    }}
                  >
                    Log Note
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              {/* Chronological Timeline List */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, maxHeight: 380 }}>
                {(!lead.timeline || lead.timeline.length === 0) ? (
                  <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 4 }}>
                    No follow-up notes recorded yet. Add a new note above.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
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
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#F8FAFC',
                            borderLeft: '4px solid #3B82F6',
                            borderTop: '1px solid #E2E8F0',
                            borderRight: '1px solid #E2E8F0',
                            borderBottom: '1px solid #E2E8F0',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#F1F5F9' }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                              {entry.staffName || 'Counselor'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                              {formattedDate}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.5 }}>
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

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
