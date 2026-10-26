import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Grid,
  Paper,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

import { saveDB } from '../../services/storage';

export default function DailyCashClosingModal({ open, onClose, db, setDb, showToast }) {
  const today = new Date().toISOString().slice(0, 10);

  // Compute today's cash inflows & outflows
  const openingBalance = 44000; // From Cash on Hand 1010
  const todayCashIn = (db.payments || [])
    .filter((p) => (p.paymentDate === today || (p.createdAt || '').slice(0, 10) === today) && p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const todayCashOut = (db.expenses || [])
    .filter((e) => e.date === today && e.paymentMethod === 'Cash')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const expectedClosing = openingBalance + todayCashIn - todayCashOut;

  const [physicalCount, setPhysicalCount] = useState(expectedClosing.toString());
  const [closingNotes, setClosingNotes] = useState('');

  const countNum = Number(physicalCount) || 0;
  const variance = countNum - expectedClosing;

  const handleConfirmClose = () => {
    const closingRecord = {
      id: `CSH-CLOSE-${Date.now()}`,
      closingDate: today,
      openingBalance,
      cashReceived: todayCashIn,
      cashPaid: todayCashOut,
      expectedClosing,
      physicalCount: countNum,
      variance,
      notes: closingNotes.trim() || (variance === 0 ? 'Cash matched exactly' : `Variance of Rs. ${variance}`),
      closedBy: 'Cashier Desk',
      closedAt: new Date().toISOString()
    };

    const nextDb = {
      ...db,
      cashClosings: [closingRecord, ...(db.cashClosings || [])]
    };
    saveDB(nextDb);
    setDb(nextDb);
    showToast(`दैनिक काउन्टर नगद क्लोजिङ (Rs. ${countNum.toLocaleString()}) सुरक्षित भयो!`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LockIcon sx={{ color: '#0F172A' }} />
        <span>दैनिक काउन्टर नगद क्लोजिङ (Daily Cash Closing)</span>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
          काउन्टरमा रहेको वास्तविक भौतिक नगद (Physical Cash) गनेर प्रविष्टि गर्नुहोस्। प्रणालीले अपेक्षित रकमसँग रुजु गर्नेछ।
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>सुरु मौज्दात</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Rs. {openingBalance.toLocaleString()}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#ECFDF5', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>नगद प्राप्ति (+)</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#059669' }}>Rs. {todayCashIn.toLocaleString()}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#FEF2F2', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 700 }}>नगद भुक्तानी (-)</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#DC2626' }}>Rs. {todayCashOut.toLocaleString()}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#EEF2FF', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 700 }}>हुनुपर्ने अन्तिम</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#4338CA' }}>Rs. {expectedClosing.toLocaleString()}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            type="number"
            label="काउन्टरमा वास्तविक गनिएको नगद (Physical Cash Count in Rs.)"
            value={physicalCount}
            onChange={(e) => setPhysicalCount(e.target.value)}
            helperText="काउन्टरमा अहिले दराजमा रहेको सम्पूर्ण नोट तथा सिक्काको कुल योग"
            required
          />
        </Box>

        {/* Variance Display */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: variance === 0 ? '#ECFDF5' : variance > 0 ? '#EFF6FF' : '#FEF2F2',
            border: variance === 0 ? '1px solid #A7F3D0' : variance > 0 ? '1px solid #BFDBFE' : '1px solid #FECACA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2.5
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              फरक / अन्तर (Cash Variance)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: variance === 0 ? '#059669' : variance > 0 ? '#1E40AF' : '#DC2626' }}>
              Rs. {variance.toLocaleString()}
            </Typography>
          </Box>
          <Chip
            label={variance === 0 ? '✓ मिलेको (Exact Match)' : variance > 0 ? 'बढी (Cash Excess)' : 'घटी (Cash Shortage)'}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: variance === 0 ? '#10B981' : variance > 0 ? '#3B82F6' : '#EF4444',
              color: '#FFFFFF'
            }}
          />
        </Paper>

        <TextField
          fullWidth
          multiline
          rows={2}
          size="small"
          label="क्लोजिङ कैफियत / टिप्पणी (Closing Notes)"
          placeholder="e.g. Counter closed successfully for the day. All cash verified."
          value={closingNotes}
          onChange={(e) => setClosingNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>रद्द गर्नुहोस् (Cancel)</Button>
        <Button variant="contained" onClick={handleConfirmClose} sx={{ fontWeight: 800 }}>
          क्लोजिङ प्रमाणित गर्नुहोस् (Lock Closing)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
