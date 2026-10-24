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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Grid,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  Divider
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { loadDB, saveDB, createSnapshot, logAudit } from '../../services/storage';
import { exportToExcel } from '../../services/exportUtils';

export default function SnapshotAuditManager() {
  const [db, setDb] = useState(loadDB());
  const [currentTab, setCurrentTab] = useState(0);

  // --- Tab 1: Snapshot State ---
  const [entityFilter, setEntityFilter] = useState('All');
  const [snapshotSearch, setSnapshotSearch] = useState('');
  const [viewingSnapshot, setViewingSnapshot] = useState(null);
  const [openCreateSnapshot, setOpenCreateSnapshot] = useState(false);
  const [newSnapshotForm, setNewSnapshotForm] = useState({
    entityType: 'WorkPlan',
    entityId: '',
    title: '',
    reason: 'Official baseline approval'
  });

  // --- Tab 2: Audit Trail State ---
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('All');

  // Handle Snapshot Creation
  const handleSaveNewSnapshot = () => {
    if (!newSnapshotForm.title.trim()) {
      alert('Snapshot title is required.');
      return;
    }

    let payload = {};
    if (newSnapshotForm.entityType === 'WorkPlan') {
      payload = (db.workPlans || [])[0] || {};
    } else if (newSnapshotForm.entityType === 'Certificate') {
      payload = (db.certificates || [])[0] || {};
    } else if (newSnapshotForm.entityType === 'LogBook') {
      payload = (db.logBooks || [])[0] || {};
    } else {
      payload = { status: 'Finalized', timestamp: new Date().toISOString() };
    }

    const updatedDb = createSnapshot(
      db,
      newSnapshotForm.entityType,
      newSnapshotForm.entityId || `ENT-${Date.now()}`,
      newSnapshotForm.title,
      payload,
      newSnapshotForm.reason,
      'Admin'
    );

    logAudit(updatedDb, 'CREATE_SNAPSHOT', newSnapshotForm.entityType, newSnapshotForm.entityId, `Created snapshot: ${newSnapshotForm.title}`);
    setDb(updatedDb);
    setOpenCreateSnapshot(false);
    alert('Immutable snapshot created and saved to records!');
  };

  // Export Audit Trail
  const handleExportAudit = () => {
    const rows = (db.auditLogs || []).map((a, i) => ({
      'S.N.': i + 1,
      'Timestamp': a.timestamp,
      'Action': a.action,
      'Entity Type': a.entityType,
      'Entity ID': a.entityId,
      'Description': a.description,
      'Performed By': a.performedBy
    }));
    exportToExcel(rows, 'TVET_System_Audit_Trail');
  };

  // Filtered Snapshots
  const filteredSnapshots = (db.snapshots || []).filter((s) => {
    const q = snapshotSearch.toLowerCase();
    const matchesSearch =
      !snapshotSearch ||
      (s.title || '').toLowerCase().includes(q) ||
      (s.entityType || '').toLowerCase().includes(q) ||
      (s.author || '').toLowerCase().includes(q) ||
      (s.reasonForRevision || '').toLowerCase().includes(q);

    const matchesEntity = entityFilter === 'All' || s.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  // Filtered Audit Logs
  const filteredAudits = (db.auditLogs || []).filter((a) => {
    const q = auditSearch.toLowerCase();
    const matchesSearch =
      !auditSearch ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.performedBy || '').toLowerCase().includes(q) ||
      (a.entityType || '').toLowerCase().includes(q) ||
      (a.action || '').toLowerCase().includes(q);

    const matchesAction = auditActionFilter === 'All' || a.action === auditActionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: '#1a56b0', fontSize: 34 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Record Snapshots & Audit Trail (अभिलेख तथा अडिट केन्द्र)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Immutable version-controlled snapshots of Work Plans, Certificates, and Log Books + complete tamper-evident audit history.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {currentTab === 1 && (
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportAudit} sx={{ fontWeight: 700 }}>
              Export Audit Trail
            </Button>
          )}
          {currentTab === 0 && (
            <Button variant="contained" startIcon={<LockIcon />} onClick={() => setOpenCreateSnapshot(true)} sx={{ fontWeight: 800 }}>
              + Create Baseline Snapshot
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          sx={{
            px: 2,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            '& .MuiTab-root': { fontWeight: 800, py: 1.8 }
          }}
        >
          <Tab icon={<LockIcon fontSize="small" />} iconPosition="start" label="१. स्थिर अभिलेखहरू (Immutable Snapshots & Revisions)" />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="२. प्रणाली अडिट लग (System Audit Trail)" />
        </Tabs>

        {/* Tab 1: Snapshots */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search snapshot title, author, reason..."
                value={snapshotSearch}
                onChange={(e) => setSnapshotSearch(e.target.value)}
                sx={{ width: { xs: '100%', sm: 340 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {['All', 'WorkPlan', 'Certificate', 'LogBook', 'LessonPlan', 'Evaluation'].map((ent) => (
                  <Chip
                    key={ent}
                    label={ent}
                    clickable
                    color={entityFilter === ent ? 'primary' : 'default'}
                    onClick={() => setEntityFilter(ent)}
                    sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                  />
                ))}
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, width: '60px' }}>क्र.सं.</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Version</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Record Title</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Entity Type</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Reason for Baseline</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Created By</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Document</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSnapshots.map((snap, idx) => (
                    <TableRow key={snap.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Chip label={`v${snap.version}`} size="small" sx={{ bgcolor: '#0b2545', color: '#ffffff', fontWeight: 800 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {snap.title}
                        <Typography variant="caption" sx={{ display: 'block', color: '#647089' }}>
                          ID: {snap.id} • {snap.createdAt?.slice(0, 10)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={snap.entityType} size="small" sx={{ bgcolor: '#eff6ff', color: '#1a56b0', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {snap.reasonForRevision}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                        {snap.author}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
                          label="Immutable"
                          size="small"
                          sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => setViewingSnapshot(snap)}
                          sx={{ fontWeight: 700 }}
                        >
                          View Record
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSnapshots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                        No snapshots found matching filter criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: Audit Trail */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search audit trail by action, description, user..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                sx={{ width: { xs: '100%', sm: 340 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {['All', 'CREATE', 'UPDATE', 'DELETE', 'ISSUE_CERTIFICATE', 'DEPLOY_OJT', 'BROADCAST_MESSAGE'].map((act) => (
                  <Chip
                    key={act}
                    label={act}
                    clickable
                    color={auditActionFilter === act ? 'primary' : 'default'}
                    onClick={() => setAuditActionFilter(act)}
                    sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                  />
                ))}
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, width: '60px' }}>क्र.सं.</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Entity</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Event Description</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Performed By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAudits.map((aud, idx) => (
                    <TableRow key={aud.id || idx} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#647089' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#647089' }}>
                        {aud.timestamp?.replace('T', ' ').slice(0, 19)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={aud.action}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: aud.action.includes('DELETE') ? '#fee2e2' : aud.action.includes('CREATE') ? '#e0f2fe' : aud.action.includes('CERTIFICATE') ? '#fef3c7' : '#f1f5f9',
                            color: aud.action.includes('DELETE') ? '#dc2626' : aud.action.includes('CREATE') ? '#0369a1' : aud.action.includes('CERTIFICATE') ? '#92400e' : '#475569'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {aud.entityType}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          {aud.entityId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#1e293b' }}>
                        {aud.description}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                        {aud.performedBy}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAudits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                        No audit records found matching criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>

      {/* View Snapshot Record Modal */}
      <Dialog open={Boolean(viewingSnapshot)} onClose={() => setViewingSnapshot(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{viewingSnapshot?.title}</span>
          <Chip label="Immutable Sealed Record" size="small" color="success" sx={{ fontWeight: 800 }} />
        </DialogTitle>
        <DialogContent dividers>
          {viewingSnapshot && (
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>ENTITY TYPE</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{viewingSnapshot.entityType} ({viewingSnapshot.entityId})</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>SEALED BY & DATE</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{viewingSnapshot.author} • {viewingSnapshot.createdAt}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Snapshot Payload (अपरिवर्तनीय डाटा विवरण):
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto', borderRadius: 2 }}>
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(viewingSnapshot.dataPayload, null, 2)}
                </pre>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewingSnapshot(null)} sx={{ fontWeight: 700 }}>Close Record</Button>
        </DialogActions>
      </Dialog>

      {/* Create New Baseline Snapshot Dialog */}
      <Dialog open={openCreateSnapshot} onClose={() => setOpenCreateSnapshot(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Immutable Baseline Snapshot</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Record Type to Seal"
              fullWidth
              value={newSnapshotForm.entityType}
              onChange={(e) => setNewSnapshotForm({ ...newSnapshotForm, entityType: e.target.value })}
            >
              <MenuItem value="WorkPlan">Work Plan (कार्ययोजना)</MenuItem>
              <MenuItem value="LessonPlan">Lesson Plan (पाठयोजना)</MenuItem>
              <MenuItem value="LogBook">Log Book (डेलिभरी रेकर्ड)</MenuItem>
              <MenuItem value="Certificate">Certificate (प्रमाणपत्र)</MenuItem>
              <MenuItem value="OJT">OJT Deployment (स्थलगत अभ्यास)</MenuItem>
              <MenuItem value="Placement">Career Placement (रोजगारी सम्झौता)</MenuItem>
            </TextField>

            <TextField
              label="Snapshot Title (e.g. Work Plan V1 - Official CTEVT Baseline)"
              fullWidth
              value={newSnapshotForm.title}
              onChange={(e) => setNewSnapshotForm({ ...newSnapshotForm, title: e.target.value })}
              required
            />

            <TextField
              label="Reason for Baseline Snapshot / Revision"
              multiline
              rows={3}
              fullWidth
              value={newSnapshotForm.reason}
              onChange={(e) => setNewSnapshotForm({ ...newSnapshotForm, reason: e.target.value })}
              placeholder="e.g. Official baseline snapshot approved prior to inspection."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCreateSnapshot(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNewSnapshot} sx={{ fontWeight: 800 }}>
            Seal & Save Snapshot
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
