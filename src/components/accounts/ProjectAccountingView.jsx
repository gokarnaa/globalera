import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Stack
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { saveDB } from '../../services/storage';

export default function ProjectAccountingView({ db, setDb, showToast }) {
  const projects = db.projectContracts || [];

  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    fundingAgency: '',
    contractValue: '',
    targetTrainees: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: ''
  });

  const totalContractValue = projects.reduce((sum, p) => sum + (Number(p.contractValue) || 0), 0);
  const totalReceived = projects.reduce((sum, p) => sum + (Number(p.receivedAmount) || 0), 0);
  const totalReceivables = projects.reduce((sum, p) => sum + (Number(p.pendingReceivable) || 0), 0);

  const handleCreateProject = () => {
    if (!form.name.trim() || !form.contractValue) {
      showToast('कृपया प्रोजेक्टको नाम र सम्झौता रकम भर्नुहोस्।', 'error');
      return;
    }

    const val = Number(form.contractValue);
    const newProject = {
      id: `PRJ-${Date.now()}`,
      code: `PRJ-${String(projects.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      fundingAgency: form.fundingAgency.trim() || 'Municipality / Donor',
      contractValue: val,
      targetTrainees: Number(form.targetTrainees) || 30,
      startDate: form.startDate,
      endDate: form.endDate,
      status: 'Ongoing',
      invoicedAmount: 0,
      receivedAmount: 0,
      pendingReceivable: val,
      milestones: [
        { name: 'सम्झौता तथा विद्यार्थी भर्ना किस्ता (५०%)', amount: val * 0.5, status: 'Pending', date: form.startDate },
        { name: 'प्रशिक्षार्थी मूल्याङ्कन तथा अन्तिम भुक्तानी (५०%)', amount: val * 0.5, status: 'Pending', date: form.endDate }
      ]
    };

    const nextDb = {
      ...db,
      projectContracts: [newProject, ...projects]
    };
    saveDB(nextDb);
    setDb(nextDb);
    showToast(`प्रोजेक्ट सम्झौता ${newProject.code} थपियो!`);
    setOpenModal(false);
    setForm({
      name: '',
      fundingAgency: '',
      contractValue: '',
      targetTrainees: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: ''
    });
  };

  return (
    <Box>
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              🏢 नगरपालिका तथा संस्थागत प्रोजेक्ट लेखा (Municipal Project Accounting)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              स्थानीय तह (वार्ड / पालिका), दातृ निकाय तथा विशेष तालिम सम्झौता, माइलस्टोन बिलिङ तथा प्राप्ति ट्र्याकिङ
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{
              background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
              fontWeight: 800,
              borderRadius: 2.5,
              textTransform: 'none'
            }}
          >
            + नयाँ प्रोजेक्ट सम्झौता (Add Project)
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Financial KPI Summary */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#4338CA' }}>कुल सम्झौता रकम (Total Contract Value)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#312E81', mt: 0.5 }}>
                Rs. {totalContractValue.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>प्राप्त रकम (Amount Received)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#065F46', mt: 0.5 }}>
                Rs. {totalReceived.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#B45309' }}>बाँकी बक्यौता (Pending Receivable)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#92400E', mt: 0.5 }}>
                Rs. {totalReceivables.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* Projects List */}
      <Stack spacing={2.5}>
        {projects.map((p) => {
          const progressPct = p.contractValue > 0 ? Math.round((p.receivedAmount / p.contractValue) * 100) : 0;
          return (
            <Card key={p.id} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B' }}>
                      {p.name}
                    </Typography>
                    <Chip label={p.code} size="small" sx={{ fontWeight: 800, bgcolor: '#EEF2FF', color: '#4338CA' }} />
                    <Chip label={p.status} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mt: 0.3 }}>
                    सम्पर्क निकाय: {p.fundingAgency} • लक्षित प्रशिक्षार्थी संख्या: {p.targetTrainees} जना
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#312E81' }}>
                    Rs. {Number(p.contractValue).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                    प्राप्त: Rs. {Number(p.receivedAmount).toLocaleString()} ({progressPct}%)
                  </Typography>
                </Box>
              </Box>

              <LinearProgress variant="determinate" value={progressPct} sx={{ height: 8, borderRadius: 4, mb: 2 }} />

              {/* Milestones list */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', mb: 1 }}>
                माइलस्टोन भुक्तानी तालिका (Payment Milestones):
              </Typography>
              <Grid container spacing={1.5}>
                {p.milestones.map((m, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', display: 'block' }}>
                          {m.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          मिति: {m.date}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          Rs. {Number(m.amount).toLocaleString()}
                        </Typography>
                        <Chip
                          label={m.status}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            bgcolor: m.status === 'Received' ? '#DCFCE7' : '#FEF3C7',
                            color: m.status === 'Received' ? '#166534' : '#92400E'
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Card>
          );
        })}
      </Stack>

      {/* New Project Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>+ नयाँ प्रोजेक्ट सम्झौता प्रविष्टि (New Project Contract)</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="प्रोजेक्टको नाम (Project Title)"
              placeholder="e.g. Ward 5 Vocational Training for Women"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              size="small"
              label="दाता / पालिका (Funding Agency)"
              placeholder="e.g. Gokarneshwor Municipality Ward 5"
              value={form.fundingAgency}
              onChange={(e) => setForm({ ...form, fundingAgency: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="कुल सम्झौता रकम (Contract Value)"
                  placeholder="e.g. 450000"
                  value={form.contractValue}
                  onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="लक्ष्य संख्या (Trainees)"
                  placeholder="e.g. 40"
                  value={form.targetTrainees}
                  onChange={(e) => setForm({ ...form, targetTrainees: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="सुरु मिति (Start Date)"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="सकिने मिति (End Date)"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateProject} sx={{ fontWeight: 800 }}>
            सम्झौता सुरक्षित गर्नुहोस् (Save Project)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
