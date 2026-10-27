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
  Paper,
  Divider,
  InputAdornment,
  Chip,
  IconButton
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import confetti from 'canvas-confetti';
import { saveDB, postDoubleEntryJournal } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useDialog } from '../../context/DialogContext';

export default function ConnectIpsPayoutModal({
  open,
  onClose,
  party,
  db,
  setDb,
  onSuccess
}) {
  const { alert } = useDialog();
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CONNECT_IPS');
  const [fromBank, setFromBank] = useState('Nabil Bank (खाता: ०१२३४५६७८९)');
  const [toBankName, setToBankName] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [toAccountHolder, setToAccountHolder] = useState('');
  const [txnReference, setTxnReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthTarget, setMonthTarget] = useState('Baisakh');
  const [tdsDeducted, setTdsDeducted] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [completedVoucher, setCompletedVoucher] = useState(null);

  useEffect(() => {
    if (party) {
      setToBankName(party.bankName || 'Global IME Bank');
      setToAccountNumber(party.accountNumber || '01201010049281');
      setToAccountHolder(party.accountHolderName || party.contactPerson || party.name);
      
      const defaultAmt = party.currentDue > 0 ? party.currentDue : (party.monthlyRent || '');
      setAmount(defaultAmt ? String(defaultAmt) : '');

      if (party.category === 'LANDLORD') {
        const tds = party.monthlyRent ? Math.round(party.monthlyRent * ((party.tdsPercent || 10) / 100)) : 0;
        setTdsDeducted(tds);
        setRemarks(`${party.name} - मासिक भवन भाडा भुक्तानी (TDS कट्टी सहित)`);
      } else {
        setTdsDeducted(0);
        setRemarks(`${party.name} - सामान खरिद / सेवा बिल भुक्तानी`);
      }
    }
  }, [party]);

  const handleCalculateTds = (val) => {
    const num = Number(val) || 0;
    if (party?.category === 'LANDLORD') {
      const rate = party.tdsPercent || 10;
      setTdsDeducted(Math.round(num * (rate / 100)));
    }
  };

  const handleProcessPayment = async () => {
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      await alert({
        type: 'warning',
        title: 'रकम आवश्यक (Amount Required)',
        message: 'कृपया भुक्तानी गर्ने सही रकम प्रविष्टि गर्नुहोस्।'
      });
      return;
    }

    if (payMethod === 'CONNECT_IPS' && !txnReference.trim()) {
      await alert({
        type: 'warning',
        title: 'रेफरेन्स आईडी आवश्यक (Txn Reference Required)',
        message: 'कृपया ConnectIPS को ट्रान्ज्याक्सन आईडी (Txn ID / UTR No.) प्रविष्टि गर्नुहोस्।'
      });
      return;
    }

    const voucherNo = `PAY-${Date.now().toString().slice(-6)}`;
    const newTxn = {
      id: `TXN-${Date.now()}`,
      refNo: voucherNo,
      voucherNo,
      date: paymentDate,
      partyId: party.id,
      partyName: party.name,
      partyCategory: party.category,
      type: 'OUTFLOW',
      isInflow: false,
      amount: payNum,
      tdsAmount: tdsDeducted,
      netDisbursed: payNum - tdsDeducted,
      paymentMethod: payMethod,
      fromBank,
      toBank: `${toBankName} (A/C: ${toAccountNumber})`,
      toAccountHolder,
      txnReference: txnReference.trim() || 'N/A',
      remarks: remarks.trim() || 'पार्टी भुक्तानी',
      monthTarget: party.category === 'LANDLORD' ? monthTarget : null,
      createdAt: new Date().toISOString()
    };

    // Update Party Balance
    const updatedParties = (db.parties || []).map((p) => {
      if (p.id === party.id) {
        const prevPaid = Number(p.totalPaid) || 0;
        const prevDue = Number(p.currentDue) || 0;
        const newDue = Math.max(0, prevDue - payNum);
        return {
          ...p,
          totalPaid: prevPaid + payNum,
          currentDue: newDue,
          bankName: toBankName,
          accountNumber: toAccountNumber,
          accountHolderName: toAccountHolder
        };
      }
      return p;
    });

    // Update Expenses
    const newExpense = {
      id: `EXP-${Date.now()}`,
      voucherNo,
      date: paymentDate,
      category: party.category === 'LANDLORD' ? 'Rent & Facilities' : 'Practical Raw Materials',
      payee: party.name,
      amount: payNum,
      paymentMethod: payMethod === 'CONNECT_IPS' ? 'Bank Transfer' : payMethod,
      accountCode: party.category === 'LANDLORD' ? '5400' : '5300',
      description: `${remarks} [Ref: ${txnReference}]`,
      status: 'Paid',
      recordedBy: 'Admin (ConnectIPS)'
    };

    let nextDb = {
      ...db,
      parties: updatedParties,
      expenses: [newExpense, ...(db.expenses || [])],
      transactions: [newTxn, ...(db.transactions || [])]
    };

    // Post Double Entry Journal Entry
    try {
      const creditAcc = payMethod === 'CASH' ? '1010' : '1020';
      const debitAcc = party.category === 'LANDLORD' ? '5400' : '2010';
      const journalRes = postDoubleEntryJournal(nextDb, {
        entryDate: paymentDate,
        narration: `पार्टी ${party.name} लाई ${payMethod} भुक्तानी (Voucher: ${voucherNo}, Ref: ${txnReference})`,
        sourceModule: 'PARTY_PAYOUT',
        sourceId: voucherNo,
        lines: [
          { accountCode: debitAcc, debit: payNum, credit: 0, lineNarration: remarks },
          { accountCode: creditAcc, debit: 0, credit: payNum, lineNarration: `Paid via ${payMethod}` }
        ]
      });
      nextDb = journalRes.nextDb;
    } catch (_) {}

    saveDB(nextDb);
    setDb(nextDb);
    setCompletedVoucher(newTxn);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}

    if (onSuccess) onSuccess(newTxn);
  };

  const handleResetAndClose = () => {
    setCompletedVoucher(null);
    setAmount('');
    setTxnReference('');
    onClose();
  };

  if (!party) return null;

  return (
    <Dialog
      open={open}
      onClose={handleResetAndClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)'
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#0F2E5A',
          color: '#FFFFFF',
          fontWeight: 900,
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #F59E0B'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalanceIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1.2 }}>
              {completedVoucher ? 'भुक्तानी सफलतापूर्वक सम्पन्न (Receipt Voucher)' : 'ConnectIPS / बैंक भुक्तानी टर्मिनल'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              पार्टी: {party.name} ({party.category})
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleResetAndClose} sx={{ color: '#94A3B8', '&:hover': { color: '#FFF' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {completedVoucher ? (
          /* =========================================================
             VOUCHER SUCCESS CONFIRMATION SLIP
             ========================================================= */
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#ECFDF5',
                color: '#059669',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 0 0 8px rgba(5, 150, 105, 0.15)'
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 38 }} />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5 }}>
              रकम सफलतापूर्वक भुक्तानी गरियो!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
              भौचर नं: <strong>{completedVoucher.voucherNo}</strong> • मिति: {completedVoucher.date}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#F8FAFC', textAlign: 'left', mb: 3 }}>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>भुक्तानी पाउने पार्टी:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>{party.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>भुक्तानी रकम:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 900, color: '#059669' }}>
                    रु. {completedVoucher.amount.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>माध्यम तथा खाता:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {completedVoucher.paymentMethod} • {completedVoucher.toBank}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>ConnectIPS Txn ID:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#1E40AF' }}>
                    {completedVoucher.txnReference}
                  </Typography>
                </Grid>
                {completedVoucher.tdsAmount > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700 }}>
                      * TDS कट्टी: रु. {completedVoucher.tdsAmount.toLocaleString()} (खुद निकासा: रु. {completedVoucher.netDisbursed.toLocaleString()})
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
                sx={{ borderRadius: 2.5, fontWeight: 800, py: 1, textTransform: 'none' }}
              >
                भौचर प्रिन्ट (Print)
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
                component="a"
                href={getWhatsAppUrl(
                  party.phone,
                  `नमस्ते ${party.name} ज्यू,\n\nग्लोबल एरा प्राविधिक स्कुलबाट ConnectIPS मार्फत रु. ${completedVoucher.amount.toLocaleString()} भुक्तानी गरिएको छ।\n\nभौचर नं: ${completedVoucher.voucherNo}\nConnectIPS Ref ID: ${completedVoucher.txnReference}\nमिति: ${completedVoucher.date}\nकैफियत: ${completedVoucher.remarks}\n\nधन्यवाद!`
                )}
                target="_blank"
                sx={{ borderRadius: 2.5, fontWeight: 900, py: 1, textTransform: 'none', bgcolor: '#25D366' }}
              >
                WhatsApp मा स्लिप पठाउनुहोस्
              </Button>
            </Stack>
          </Box>
        ) : (
          /* =========================================================
             PAYMENT INPUT FORM
             ========================================================= */
          <Box>
            {/* Party Profile Summary Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2.5,
                borderRadius: 2.5,
                bgcolor: '#F1F5F9',
                border: '1px solid #CBD5E1'
              }}
            >
              <Grid container spacing={1}>
                <Grid item xs={7}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                    पार्टीको बैंक विवरण (Saved Beneficiary):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                    {toBankName} • A/C: {toAccountNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    खातावाला: {toAccountHolder}
                  </Typography>
                </Grid>
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                    हाल तिर्न बाँकी दायित्व:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: party.currentDue > 0 ? '#DC2626' : '#059669' }}>
                    रु. {(party.currentDue || 0).toLocaleString()}
                  </Typography>
                  {party.monthlyRent && (
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                      मासिक भाडा: रु. {party.monthlyRent.toLocaleString()}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={2}>
              {/* Payment Method */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="भुक्तानी माध्यम (Payment Method)"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <MenuItem value="CONNECT_IPS">⚡ ConnectIPS (Immediate)</MenuItem>
                  <MenuItem value="BANK_TRANSFER">🏦 Bank Account Transfer</MenuItem>
                  <MenuItem value="ACCOUNT_DEPOSIT">💵 Direct Bank Deposit</MenuItem>
                  <MenuItem value="ESEWA">📱 eSewa / Khalti</MenuItem>
                  <MenuItem value="CASH">💵 काउन्टर नगद (Cash)</MenuItem>
                </TextField>
              </Grid>

              {/* Paying From Bank */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="संस्थाको भुक्तानी खाता (From Account)"
                  value={fromBank}
                  onChange={(e) => setFromBank(e.target.value)}
                >
                  <MenuItem value="Nabil Bank (खाता: ०१२३४५६७८९)">Nabil Bank Ltd. (Main Operation)</MenuItem>
                  <MenuItem value="Global IME Bank (खाता: ०९८७६५४३२१)">Global IME Bank Ltd.</MenuItem>
                  <MenuItem value="काउन्टर नगद मौज्दात (Counter Cash)">काउन्टर नगद मौज्दात (Cash Box)</MenuItem>
                </TextField>
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="भुक्तानी रकम (Amount Rs.)"
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    handleCalculateTds(e.target.value);
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">रु.</InputAdornment>
                  }}
                />
              </Grid>

              {/* Payment Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="भुक्तानी मिति (Date)"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Transaction Ref / ConnectIPS Txn ID */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required={payMethod === 'CONNECT_IPS'}
                  size="small"
                  label="ConnectIPS Trx ID / UTR / भौचर रेफरेन्स नं"
                  placeholder="उदा: CIP-90812894129"
                  value={txnReference}
                  onChange={(e) => setTxnReference(e.target.value)}
                  helperText="अडिट र प्रमाणका लागि ConnectIPS को कारोबार आइडी अनिवार्य लेख्नुहोस्।"
                />
              </Grid>

              {/* Landlord Rent Details (if applicable) */}
              {party.category === 'LANDLORD' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="कुन महिनाको भाडा? (Target Month)"
                      value={monthTarget}
                      onChange={(e) => setMonthTarget(e.target.value)}
                    >
                      {['Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra', 'Baisakh', 'Jestha', 'Ashad'].map((m) => (
                        <MenuItem key={m} value={m}>{m} महिनाको भाडा</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="TDS कट्टी रकम (१०%)"
                      type="number"
                      value={tdsDeducted}
                      onChange={(e) => setTdsDeducted(Number(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">रु.</InputAdornment>
                      }}
                      helperText={`खुद घरबेटीलाई जाने: रु. ${(Math.max(0, (Number(amount) || 0) - tdsDeducted)).toLocaleString()}`}
                    />
                  </Grid>
                </>
              )}

              {/* Remarks */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="कैफियत (Remarks)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="उदा: वैशाख महिनाको भवन भाडा ConnectIPS बाट भुक्तानी गरियो"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        {completedVoucher ? (
          <Button
            variant="contained"
            onClick={handleResetAndClose}
            sx={{ bgcolor: '#0F2E5A', borderRadius: 2.5, px: 3, fontWeight: 800 }}
          >
            बन्द गर्नुहोस् (Close)
          </Button>
        ) : (
          <>
            <Button onClick={handleResetAndClose} sx={{ color: '#64748B', fontWeight: 800 }}>
              रद्द गर्नुहोस् (Cancel)
            </Button>
            <Button
              variant="contained"
              onClick={handleProcessPayment}
              sx={{
                bgcolor: '#0F2E5A',
                borderRadius: 2.5,
                px: 3.5,
                py: 1,
                fontWeight: 900,
                boxShadow: '0 4px 14px rgba(15, 46, 90, 0.35)',
                '&:hover': { bgcolor: '#174276' }
              }}
            >
              💸 भुक्तानी सुरक्षित गर्नुहोस् (Confirm Payout)
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
