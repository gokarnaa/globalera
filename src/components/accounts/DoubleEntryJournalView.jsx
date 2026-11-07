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
  TextField,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Tooltip,
  Alert,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { postDoubleEntryJournal, reverseDoubleEntryJournal } from '../../services/storage';

export default function DoubleEntryJournalView({ db, setDb, showToast }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState(null);

  // New Journal Dialog
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [narration, setNarration] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([
    { accountCode: '1010', debit: '', credit: '', lineNarration: '' },
    { accountCode: '4100', debit: '', credit: '', lineNarration: '' }
  ]);

  // Reversal Dialog
  const [reversalTarget, setReversalTarget] = useState(null);
  const [reversalReason, setReversalReason] = useState('');

  const coa = db.chartOfAccounts || [];
  const journals = db.journalEntries || [];

  const filteredJournals = journals.filter((j) => {
    const matchesSearch =
      j.entryNumber.toLowerCase().includes(search.toLowerCase()) ||
      j.narration.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live debit/credit in new journal modal
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '1010', debit: '', credit: '', lineNarration: '' }]);
  };

  const handleRemoveLine = (idx) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    // Single line cannot have both debit and credit
    if (field === 'debit' && Number(value) > 0) updated[index]['credit'] = '';
    if (field === 'credit' && Number(value) > 0) updated[index]['debit'] = '';
    setLines(updated);
  };

  const handlePostJournal = () => {
    if (!narration.trim()) {
      showToast('Please enter the voucher narration.', 'error');
      return;
    }
    if (!isBalanced) {
      showToast(`Voucher is imbalanced! Total Dr (Rs. ${totalDebit}) != Total Cr (Rs. ${totalCredit})`, 'error');
      return;
    }

    try {
      const processedLines = lines
        .filter((l) => Number(l.debit) > 0 || Number(l.credit) > 0)
        .map((l) => {
          const acc = coa.find((a) => a.code === l.accountCode);
          return {
            accountCode: l.accountCode,
            accountName: acc?.name || '',
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
            lineNarration: l.lineNarration || narration
          };
        });

      const { nextDb, newEntry } = postDoubleEntryJournal(db, {
        narration: narration.trim(),
        lines: processedLines,
        sourceModule: 'MANUAL',
        entryDate
      });

      setDb(nextDb);
      showToast(`Journal voucher ${newEntry.entryNumber} posted successfully!`);
      setOpenNewDialog(false);
      setNarration('');
      setLines([
        { accountCode: '1010', debit: '', credit: '', lineNarration: '' },
        { accountCode: '4100', debit: '', credit: '', lineNarration: '' }
      ]);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmReversal = () => {
    if (!reversalReason.trim()) {
      showToast('Reason for reversal is required.', 'error');
      return;
    }
    try {
      const nextDb = reverseDoubleEntryJournal(db, reversalTarget.id, reversalReason.trim());
      setDb(nextDb);
      showToast(`Voucher ${reversalTarget.entryNumber} reversed!`);
      setReversalTarget(null);
      setReversalReason('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <Box>
      {/* Header & Controls */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              📑 Double-Entry General Journal & Day Book
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Balanced Debit and Credit entries for every financial transaction (Debit = Credit Verification)
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
              fontWeight: 800,
              borderRadius: 2.5,
              textTransform: 'none'
            }}
          >
            + Post Journal Entry
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by JV Number or Narration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94A3B8', mr: 1, fontSize: '1.2rem' }} /> }}
            sx={{ minWidth: 320 }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value="POSTED">POSTED</MenuItem>
            <MenuItem value="REVERSED">REVERSED</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Journal Entries Table */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 140 }}>JV Number</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 120 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Narration</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 130 }}>Source Module</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 140 }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'center', width: 120 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJournals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                    No journal entries found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJournals.map((j) => {
                  const entryTotal = (j.lines || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
                  const isReversed = j.status === 'REVERSED';
                  return (
                    <TableRow key={j.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: '#1E40AF' }}>
                        {j.entryNumber}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{j.entryDate}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          {j.narration}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Posted by: {j.postedBy || 'System'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={j.sourceModule} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                        Rs. {entryTotal.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={j.status}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: isReversed ? '#FEE2E2' : '#DCFCE7',
                            color: isReversed ? '#DC2626' : '#166534'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Tooltip title="View Dr/Cr Details">
                          <IconButton size="small" onClick={() => setSelectedEntry(j)} sx={{ color: '#1E40AF' }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!isReversed && (
                          <Tooltip title="Reverse Journal Entry">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setReversalTarget(j);
                                setReversalReason('');
                              }}
                              sx={{ color: '#DC2626' }}
                            >
                              <UndoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* View Detail Modal */}
      {selectedEntry && (
        <Dialog open={Boolean(selectedEntry)} onClose={() => setSelectedEntry(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Journal Voucher Details: {selectedEntry.entryNumber}</span>
            <Chip
              label={selectedEntry.status}
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: selectedEntry.status === 'REVERSED' ? '#FEE2E2' : '#DCFCE7',
                color: selectedEntry.status === 'REVERSED' ? '#DC2626' : '#166534'
              }}
            />
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                Date: {selectedEntry.entryDate} • Posted By: {selectedEntry.postedBy}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                {selectedEntry.narration}
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Account Code & Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Line Note</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Debit (Dr)</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Credit (Cr)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedEntry.lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                          {l.accountCode}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569' }}>
                          {l.accountName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.82rem' }}>{l.lineNarration || '-'}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: l.debit > 0 ? '#1E293B' : '#94A3B8' }}>
                        {l.debit > 0 ? `Rs. ${Number(l.debit).toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: l.credit > 0 ? '#1E293B' : '#94A3B8' }}>
                        {l.credit > 0 ? `Rs. ${Number(l.credit).toLocaleString()}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 900 }}>Total Balance (Dr == Cr)</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#166534' }}>
                      Rs. {selectedEntry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#166534' }}>
                      Rs. {selectedEntry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedEntry(null)} sx={{ fontWeight: 700 }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* New Manual Journal Dialog */}
      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>+ New Double-Entry Journal Entry</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Voucher Date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Narration / Particulars"
                placeholder="e.g. Center Maintenance & IT supplies purchase"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                required
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1E293B' }}>
            Journal Debit & Credit Lines:
          </Typography>

          <Stack spacing={1.5}>
            {lines.map((line, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label={`Line ${idx + 1} Account`}
                  value={line.accountCode}
                  onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                  sx={{ minWidth: 260 }}
                >
                  {coa.map((a) => (
                    <MenuItem key={a.code} value={a.code}>
                      <strong>{a.code}</strong> - {a.name} ({a.type})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  type="number"
                  label="Debit (Dr)"
                  value={line.debit}
                  onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                  sx={{ width: 140 }}
                />

                <TextField
                  size="small"
                  type="number"
                  label="Credit (Cr)"
                  value={line.credit}
                  onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                  sx={{ width: 140 }}
                />

                <TextField
                  size="small"
                  label="Line Remark"
                  placeholder="Optional"
                  value={line.lineNarration}
                  onChange={(e) => handleLineChange(idx, 'lineNarration', e.target.value)}
                  sx={{ flex: 1 }}
                />

                <IconButton size="small" onClick={() => handleRemoveLine(idx)} disabled={lines.length <= 2} sx={{ color: '#DC2626' }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button size="small" onClick={handleAddLine} startIcon={<AddIcon />} sx={{ fontWeight: 700 }}>
              + Add Line
            </Button>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Total Dr: <strong>Rs. {totalDebit.toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Total Cr: <strong>Rs. {totalCredit.toLocaleString()}</strong>
              </Typography>
              <Chip
                label={isBalanced ? 'Balanced' : 'Imbalanced'}
                size="small"
                sx={{
                  fontWeight: 800,
                  bgcolor: isBalanced ? '#DCFCE7' : '#FEE2E2',
                  color: isBalanced ? '#166534' : '#DC2626'
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenNewDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!isBalanced || !narration.trim()}
            onClick={handlePostJournal}
            sx={{ fontWeight: 800 }}
          >
            Post Journal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reversal Confirmation Dialog */}
      {reversalTarget && (
        <Dialog open={Boolean(reversalTarget)} onClose={() => setReversalTarget(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>
            🔄 Reverse Journal Entry
          </DialogTitle>
          <DialogContent dividers>
            <Alert severity="warning" sx={{ mb: 2, fontWeight: 600 }}>
              This action creates a new inverse voucher for <strong>{reversalTarget.entryNumber}</strong>. Original vouchers are never deleted.
            </Alert>
            <TextField
              fullWidth
              size="small"
              label="Reason for Reversal"
              placeholder="e.g. Duplicate entry by mistake / Wrong amount entered"
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setReversalTarget(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              disabled={!reversalReason.trim()}
              onClick={handleConfirmReversal}
              sx={{ fontWeight: 800 }}
            >
              Confirm Reversal
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
