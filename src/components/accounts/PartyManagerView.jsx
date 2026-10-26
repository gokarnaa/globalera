import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentIcon from '@mui/icons-material/Payment';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';

import { postDoubleEntryJournal, saveDB } from '../../services/storage';

export const PARTY_CATEGORIES = [
  { code: 'LANDLORD', label: 'घरधनी (Landlord / Office Rent)', icon: '🏠' },
  { code: 'TAILORING_SUPPLIER', label: 'सिलाई कच्चा पदार्थ (Fabric/Thread)', icon: '🧵' },
  { code: 'BEAUTICIAN_SUPPLIER', label: 'ब्युटिसियन तथा कस्मेटिक्स सामग्री', icon: '💄' },
  { code: 'BAKERY_SUPPLIER', label: 'बेकरी तथा खाद्य कच्चा पदार्थ', icon: '🎂' },
  { code: 'TECHNICAL_SUPPLIER', label: 'मोबाइल तथा इलेक्ट्रिकल स्पेयर पार्ट्स', icon: '🔧' },
  { code: 'UTILITY_SERVICE', label: 'इन्टरनेट, स्टेशनरी तथा कार्यालय सेवा', icon: '🌐' }
];

export default function PartyManagerView({ db, setDb, showToast }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dueFilter, setDueFilter] = useState('ALL');

  // Modals
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [recordPurchaseOpen, setRecordPurchaseOpen] = useState(false);
  const [payDueOpen, setPayDueOpen] = useState(false);
  const [selectedPartyForPay, setSelectedPartyForPay] = useState(null);
  const [viewLedgerParty, setViewLedgerParty] = useState(null);

  // Form states: Add Party
  const [partyName, setPartyName] = useState('');
  const [partyCategory, setPartyCategory] = useState('TAILORING_SUPPLIER');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [address, setAddress] = useState('Kathmandu');
  const [notes, setNotes] = useState('');

  // Form states: Record Purchase
  const [purchasePartyId, setPurchasePartyId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [isCreditPurchase, setIsCreditPurchase] = useState(false);
  const [purchasePayMethod, setPurchasePayMethod] = useState('Cash');

  // Form states: Pay Due
  const [payDueAmount, setPayDueAmount] = useState('');
  const [payDueMethod, setPayDueMethod] = useState('Cash');
  const [payDueRemarks, setPayDueRemarks] = useState('पार्टी बक्यौता भुक्तानी');

  // Resolve Parties & ensure seed data if empty
  const parties = useMemo(() => {
    return db.parties || [];
  }, [db.parties]);

  // Auto-seed realistic parties if empty
  React.useEffect(() => {
    if (!db.parties || db.parties.length === 0) {
      const initialParties = [
        {
          id: 'PRT-001',
          name: 'गोकर्णेश्वर घरधनी (Gokarneshwor Building Rent)',
          category: 'LANDLORD',
          contactPerson: 'राम कुमार श्रेष्ठ',
          phone: '9851011122',
          panNumber: '302918273',
          address: 'Jorpati-05, Kathmandu',
          totalPurchases: 70000,
          totalPaid: 35000,
          currentDue: 35000,
          notes: '३० दिनको घरभाडा सम्झौता'
        },
        {
          id: 'PRT-002',
          name: 'न्युरोड फेब्रिक तथा सिलाई सामग्री स्टोर',
          category: 'TAILORING_SUPPLIER',
          contactPerson: 'सुनिल बज्राचार्य',
          phone: '9841887766',
          panNumber: '601928374',
          address: 'New Road, Kathmandu',
          totalPurchases: 25000,
          totalPaid: 15000,
          currentDue: 10000,
          notes: 'सिलाई तालिमका लागि कपडा, धागो, मेसिन सुई सप्लायर'
        },
        {
          id: 'PRT-003',
          name: 'ग्लोबल कस्मेटिक्स तथा ब्युटी सप्लायर्स',
          category: 'BEAUTICIAN_SUPPLIER',
          contactPerson: 'अनिता महर्जन',
          phone: '9818223344',
          panNumber: '602819201',
          address: 'Chabahil, Kathmandu',
          totalPurchases: 18000,
          totalPaid: 18000,
          currentDue: 0,
          notes: 'ब्युटिसियन फेसिअल किट, क्रिम र नेल आर्ट सामग्री'
        },
        {
          id: 'PRT-004',
          name: 'वर्ल्डलिङ्क कम्युनिकेशन्स प्रा.लि.',
          category: 'UTILITY_SERVICE',
          contactPerson: 'Customer Service',
          phone: '01-4911222',
          panNumber: '600012345',
          address: 'Jorpati, Kathmandu',
          totalPurchases: 4400,
          totalPaid: 4400,
          currentDue: 0,
          notes: 'इन्टरनेट तथा नेटवर्क सेवा'
        }
      ];

      const nextDb = { ...db, parties: initialParties };
      saveDB(nextDb);
      setDb(nextDb);
    }
  }, [db]);

  // KPI Computations
  const totalPartiesCount = parties.length;
  const totalPurchasesBilled = parties.reduce((sum, p) => sum + (Number(p.totalPurchases) || 0), 0);
  const totalPaidToParties = parties.reduce((sum, p) => sum + (Number(p.totalPaid) || 0), 0);
  const totalCreditDue = parties.reduce((sum, p) => sum + (Number(p.currentDue) || 0), 0);

  // Filtered Parties
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchPhone = (p.phone || '').includes(q);
        const matchPan = (p.panNumber || '').includes(q);
        const matchContact = (p.contactPerson || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchPan && !matchContact) return false;
      }

      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (dueFilter === 'DUE' && (Number(p.currentDue) || 0) <= 0) return false;
      if (dueFilter === 'CLEARED' && (Number(p.currentDue) || 0) > 0) return false;

      return true;
    });
  }, [parties, search, categoryFilter, dueFilter]);

  // Handler: Add New Party
  const handleAddParty = (e) => {
    e.preventDefault();
    if (!partyName.trim()) return;

    const newParty = {
      id: `PRT-${Date.now().toString().slice(-6)}`,
      name: partyName.trim(),
      category: partyCategory,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      panNumber: panNumber.trim(),
      address: address.trim(),
      totalPurchases: 0,
      totalPaid: 0,
      currentDue: 0,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    const nextParties = [newParty, ...parties];
    const nextDb = { ...db, parties: nextParties };
    saveDB(nextDb);
    setDb(nextDb);

    if (showToast) showToast(`पार्टी ${partyName} सफलतापूर्वक दर्ता भयो।`, 'success');
    setAddPartyOpen(false);
    setPartyName('');
    setPhone('');
    setPanNumber('');
    setNotes('');
  };

  // Handler: Record Purchase / Expense
  const handleRecordPurchase = (e) => {
    e.preventDefault();
    const amt = Number(purchaseAmount) || 0;
    if (amt <= 0 || !purchasePartyId) return;

    const targetParty = parties.find((p) => p.id === purchasePartyId);
    if (!targetParty) return;

    const billNo = billNumber.trim() || `BILL-${Date.now().toString().slice(-5)}`;
    const isCredit = isCreditPurchase;

    // Update Party Balance
    const updatedParties = parties.map((p) => {
      if (p.id === purchasePartyId) {
        return {
          ...p,
          totalPurchases: (p.totalPurchases || 0) + amt,
          totalPaid: isCredit ? (p.totalPaid || 0) : (p.totalPaid || 0) + amt,
          currentDue: isCredit ? (p.currentDue || 0) + amt : (p.currentDue || 0)
        };
      }
      return p;
    });

    // Also record into db.expenses
    const newExpense = {
      id: `EXP-${Date.now()}`,
      voucherNo: `PUR-${Date.now().toString().slice(-5)}`,
      billNumber: billNo,
      date: billDate,
      category: targetParty.category === 'LANDLORD' ? 'Rent & Facilities' : 'Training Materials',
      payee: targetParty.name,
      partyId: targetParty.id,
      amount: amt,
      paymentMethod: isCredit ? 'Credit (उधारो)' : purchasePayMethod,
      accountCode: targetParty.category === 'LANDLORD' ? '5400' : '5300',
      description: `${purchaseDescription || 'सामग्री खरिद'} (बिल नं: ${billNo})`,
      status: isCredit ? 'Pending (उधारो)' : 'Paid',
      recordedBy: 'Accounts'
    };

    const updatedExpenses = [newExpense, ...(db.expenses || [])];
    const nextDb = { ...db, parties: updatedParties, expenses: updatedExpenses };

    // Post double-entry journal
    try {
      postDoubleEntryJournal(
        nextDb,
        {
          date: billDate,
          voucherType: 'PURCHASE',
          referenceNo: billNo,
          narration: `खरिद/खर्च: ${targetParty.name} - ${purchaseDescription || 'कच्चा पदार्थ खरिद'}`,
          createdBy: 'Accounts',
          lines: [
            {
              accountCode: targetParty.category === 'LANDLORD' ? '5400' : '5300', // Expense
              description: `खर्च: ${targetParty.name}`,
              debit: amt,
              credit: 0
            },
            {
              accountCode: isCredit ? '2010' : (purchasePayMethod === 'Bank' ? '1020' : '1010'), // A/P or Cash/Bank
              description: isCredit ? `साहु बक्यौता (A/P): ${targetParty.name}` : `भुक्तानी (${purchasePayMethod})`,
              debit: 0,
              credit: amt
            }
          ]
        },
        () => {}
      );
    } catch (err) {
      console.warn('Journal purchase notice:', err);
    }

    saveDB(nextDb);
    setDb(nextDb);

    if (showToast) {
      showToast(`खरिद बिल (रु. ${amt.toLocaleString()}) सफलतापूर्वक सुरक्षित भयो।`, 'success');
    }
    setRecordPurchaseOpen(false);
    setPurchaseAmount('');
    setBillNumber('');
    setPurchaseDescription('');
  };

  // Handler: Pay Due to Party
  const handlePayDue = (e) => {
    e.preventDefault();
    const amt = Number(payDueAmount) || 0;
    if (amt <= 0 || !selectedPartyForPay) return;

    const targetParty = parties.find((p) => p.id === selectedPartyForPay.id);
    if (!targetParty) return;

    const receiptNo = `PAY-PRT-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().slice(0, 10);

    // Update Party Balance
    const updatedParties = parties.map((p) => {
      if (p.id === selectedPartyForPay.id) {
        const nextDue = Math.max(0, (p.currentDue || 0) - amt);
        return {
          ...p,
          totalPaid: (p.totalPaid || 0) + amt,
          currentDue: nextDue
        };
      }
      return p;
    });

    // Record into expenses as settlement
    const settlementExp = {
      id: `EXP-SETTLE-${Date.now()}`,
      voucherNo: receiptNo,
      date: today,
      category: 'Party Due Settlement',
      payee: targetParty.name,
      partyId: targetParty.id,
      amount: amt,
      paymentMethod: payDueMethod,
      accountCode: '2010', // Accounts Payable
      description: `${payDueRemarks} (रसिद नं: ${receiptNo})`,
      status: 'Paid',
      recordedBy: 'Accounts'
    };

    const updatedExpenses = [settlementExp, ...(db.expenses || [])];
    const nextDb = { ...db, parties: updatedParties, expenses: updatedExpenses };

    // Post double entry journal
    try {
      postDoubleEntryJournal(
        nextDb,
        {
          date: today,
          voucherType: 'PAYMENT',
          referenceNo: receiptNo,
          narration: `पार्टी बक्यौता भुक्तानी: ${targetParty.name}`,
          createdBy: 'Accounts',
          lines: [
            {
              accountCode: '2010', // Accounts Payable
              description: `बक्यौता कट्टी: ${targetParty.name}`,
              debit: amt,
              credit: 0
            },
            {
              accountCode: payDueMethod === 'Bank' ? '1020' : '1010', // Cash / Bank
              description: `भुक्तानी माध्यम: ${payDueMethod}`,
              debit: 0,
              credit: amt
            }
          ]
        },
        () => {}
      );
    } catch (err) {
      console.warn('Journal settlement notice:', err);
    }

    saveDB(nextDb);
    setDb(nextDb);

    if (showToast) {
      showToast(`${targetParty.name} लाई रु. ${amt.toLocaleString()} भुक्तानी गरियो।`, 'success');
    }
    setPayDueOpen(false);
    setSelectedPartyForPay(null);
    setPayDueAmount('');
  };

  const handleDeleteParty = (partyId, name) => {
    if (window.confirm(`के तपाईं पार्टी '${name}' लाई सूचीबाट हटाउन चाहनुहुन्छ?`)) {
      const updated = parties.filter((p) => p.id !== partyId);
      const nextDb = { ...db, parties: updated };
      saveDB(nextDb);
      setDb(nextDb);
      if (showToast) showToast('पार्टी हटाइयो।', 'info');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* 4 Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  कुल दर्ता पार्टीहरू
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f2e5a', mt: 0.5 }}>
                  {totalPartiesCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700 }}>
                  घरधनी र सप्लायरहरू
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 2, color: '#0284c7' }}>
                <StorefrontIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  कुल खरिद / बिल रकम
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f2e5a', mt: 0.5 }}>
                  रु. {totalPurchasesBilled.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  कच्चा पदार्थ र सेवा
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, color: '#1e40af' }}>
                <ShoppingBagIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  पार्टीलाई भुक्तान रकम
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', mt: 0.5 }}>
                  रु. {totalPaidToParties.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                  नगद तथा बैंक चुक्ता
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#ecfdf5', borderRadius: 2, color: '#059669' }}>
                <PaymentIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Outstanding Credit Due */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1.5px solid #fecdd3', bgcolor: '#fff1f2' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#9f1239' }}>
                  तिर्न बाँकी उधारो बक्यौता
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#be123c', mt: 0.5 }}>
                  रु. {totalCreditDue.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#e11d48', fontWeight: 700 }}>
                  साहु/पार्टीलाई तिर्नुपर्ने
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#ffe4e6', borderRadius: 2, color: '#e11d48' }}>
                <ReceiptLongIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Action Bar & Filters */}
      <Card elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="पार्टीको नाम, फोन वा प्यान नं खोजी गर्नुहोस्..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="पार्टी वर्ग (Category)"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="ALL">सबै प्रकारका पार्टीहरू</MenuItem>
              {PARTY_CATEGORIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.icon} {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="बक्यौता स्थिति"
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value)}
            >
              <MenuItem value="ALL">सबै (All)</MenuItem>
              <MenuItem value="DUE">उधारो बाँकी (Due)</MenuItem>
              <MenuItem value="CLEARED">चुक्ता (Cleared)</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={3.5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAddPartyOpen(true)}
                sx={{ fontWeight: 800, textTransform: 'none' }}
              >
                + पार्टी थप्नुहोस्
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PointOfSaleIcon />}
                onClick={() => setRecordPurchaseOpen(true)}
                sx={{ fontWeight: 800, textTransform: 'none', bgcolor: '#0f2e5a' }}
              >
                + खरिद/खर्च इन्ट्री
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Party Table */}
      <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }}>पार्टीको नाम / वर्ग</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }}>सम्पर्क व्यक्ति / फोन</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }}>प्यान नं / ठेगाना</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }} align="right">कुल खरिद / बिल</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }} align="right">हालसम्म भुक्तानी</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }} align="right">तिर्न बाँकी बक्यौता</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }} align="center">कार्यहरू</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredParties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748b' }}>
                    कुनै पार्टी फेला परेन। '+ पार्टी थप्नुहोस्' थिचेर घरधनी वा सप्लायर दर्ता गर्नुहोस्।
                  </TableCell>
                </TableRow>
              ) : (
                filteredParties.map((p) => {
                  const catObj = PARTY_CATEGORIES.find((c) => c.code === p.category) || {};
                  const isDue = (Number(p.currentDue) || 0) > 0;

                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                          {catObj.icon} {p.name}
                        </Typography>
                        <Chip
                          label={catObj.label ? catObj.label.split('(')[0] : 'Supplier'}
                          size="small"
                          sx={{ height: '20px', fontSize: '0.68rem', fontWeight: 700, mt: 0.5, bgcolor: '#f1f5f9' }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                          {p.contactPerson || '-'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          फोन: {p.phone || '-'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#475569' }}>
                          PAN: {p.panNumber || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {p.address}
                        </Typography>
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0f2e5a' }}>
                        रु. {(Number(p.totalPurchases) || 0).toLocaleString()}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 700, color: '#059669' }}>
                        रु. {(Number(p.totalPaid) || 0).toLocaleString()}
                      </TableCell>

                      <TableCell align="right">
                        {isDue ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#dc2626' }}>
                              रु. {(Number(p.currentDue) || 0).toLocaleString()}
                            </Typography>
                            <Chip
                              label="उधारो बाँकी"
                              size="small"
                              sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 800, bgcolor: '#fef2f2', color: '#991b1b' }}
                            />
                          </Box>
                        ) : (
                          <Chip
                            label="चुक्ता (Clear)"
                            size="small"
                            sx={{ height: '20px', fontSize: '0.7rem', fontWeight: 800, bgcolor: '#ecfdf5', color: '#065f46' }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {isDue && (
                            <Tooltip title="बक्यौता भुक्तानी गर्नुहोस्">
                              <Button
                                variant="contained"
                                size="small"
                                color="error"
                                startIcon={<PaymentIcon />}
                                onClick={() => {
                                  setSelectedPartyForPay(p);
                                  setPayDueAmount(p.currentDue || '');
                                  setPayDueOpen(true);
                                }}
                                sx={{ fontWeight: 800, fontSize: '0.75rem', py: 0.5 }}
                              >
                                बक्यौता तिर्नुहोस्
                              </Button>
                            </Tooltip>
                          )}

                          <Tooltip title="पार्टी मेटाउनुहोस्">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteParty(p.id, p.name)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog: Add New Party */}
      <Dialog open={addPartyOpen} onClose={() => setAddPartyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f2e5a', color: '#ffffff', py: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              + नयाँ पार्टी दर्ता गर्नुहोस् (Add Party / Vendor)
            </Typography>
            <IconButton onClick={() => setAddPartyOpen(false)} sx={{ color: '#ffffff' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleAddParty} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="पार्टीको वर्ग (Category)"
                  value={partyCategory}
                  onChange={(e) => setPartyCategory(e.target.value)}
                >
                  {PARTY_CATEGORIES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.icon} {c.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="पार्टी / पसलको नाम"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="उदा: न्युरोड फेब्रिक स्टोर"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="सम्पर्क व्यक्ति (Contact Person)"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="मोबाइल नम्बर"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="प्यान नम्बर (PAN / VAT No.)"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="ठेगाना (Address)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="थप कैफियत / सम्झौता नोट"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>

            <DialogActions sx={{ px: 0, pt: 3 }}>
              <Button onClick={() => setAddPartyOpen(false)} color="inherit">
                रद्द गर्नुहोस्
              </Button>
              <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 800, bgcolor: '#0f2e5a' }}>
                पार्टी सुरक्षित गर्नुहोस्
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog: Record Purchase / Expense */}
      <Dialog open={recordPurchaseOpen} onClose={() => setRecordPurchaseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f2e5a', color: '#ffffff', py: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              + खरिद तथा खर्च बिल इन्ट्री (Purchase / Expense Entry)
            </Typography>
            <IconButton onClick={() => setRecordPurchaseOpen(false)} sx={{ color: '#ffffff' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleRecordPurchase} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="पार्टी छनोट गर्नुहोस् (Select Party)"
                  value={purchasePartyId}
                  onChange={(e) => setPurchasePartyId(e.target.value)}
                >
                  {parties.map((p) => {
                    const cat = PARTY_CATEGORIES.find((c) => c.code === p.category);
                    return (
                      <MenuItem key={p.id} value={p.id}>
                        {cat?.icon} {p.name} — बक्यौता: रु. {(p.currentDue || 0).toLocaleString()}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="बिल / इनभ्वाइस नम्बर"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="उदा: INV-102"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="बिल मिति"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  size="small"
                  label="कुल बिल रकम (रु.)"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="भुक्तानी माध्यम"
                  value={purchasePayMethod}
                  disabled={isCreditPurchase}
                  onChange={(e) => setPurchasePayMethod(e.target.value)}
                >
                  <MenuItem value="Cash">नगद (Cash)</MenuItem>
                  <MenuItem value="Bank">बैंक ट्रान्सफर (Bank)</MenuItem>
                  <MenuItem value="Fonepay">Fonepay / QR</MenuItem>
                  <MenuItem value="eSewa">eSewa</MenuItem>
                </TextField>
              </Grid>

              {/* Credit Purchase Checkbox Toggle */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: isCreditPurchase ? '#fff1f2' : '#f0fdf4',
                    border: `1.5px solid ${isCreditPurchase ? '#f43f5e' : '#10b981'}`,
                    borderRadius: 1.5
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isCreditPurchase ? '#9f1239' : '#065f46' }}>
                        {isCreditPurchase ? '⚠️ उधारो खरिद (Credit Purchase - Payable)' : '✓ तुरुन्त भुक्तानी (Paid Immediately)'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {isCreditPurchase
                          ? 'यो रकम पार्टीको नाममा बक्यौता भएर बस्नेछ, पछि भुक्तानी गर्न सकिनेछ।'
                          : 'यो रकम तुरुन्तै क्यास वा बैंक खाताबाट घट्नेछ।'}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant={isCreditPurchase ? 'contained' : 'outlined'}
                      color={isCreditPurchase ? 'error' : 'success'}
                      onClick={() => setIsCreditPurchase(!isCreditPurchase)}
                      sx={{ fontWeight: 800 }}
                    >
                      {isCreditPurchase ? 'उधारो' : 'नगद भुक्तान'}
                    </Button>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="सामग्री विवरण / के के ल्याएको?"
                  value={purchaseDescription}
                  onChange={(e) => setPurchaseDescription(e.target.value)}
                  placeholder="उदा: सिलाई तालिमका लागि २० मिटर सुती कपडा, १० वटा धागो र मेसिन सुई..."
                />
              </Grid>
            </Grid>

            <DialogActions sx={{ px: 0, pt: 3 }}>
              <Button onClick={() => setRecordPurchaseOpen(false)} color="inherit">
                रद्द गर्नुहोस्
              </Button>
              <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 800, bgcolor: '#0f2e5a' }}>
                खरिद सुरक्षित गर्नुहोस्
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog: Pay Party Due */}
      <Dialog open={payDueOpen} onClose={() => setPayDueOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#dc2626', color: '#ffffff', py: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              पार्टी बक्यौता भुक्तानी
            </Typography>
            <IconButton onClick={() => setPayDueOpen(false)} sx={{ color: '#ffffff' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedPartyForPay && (
            <Box component="form" onSubmit={handlePayDue} sx={{ mt: 1 }}>
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fef2f2', borderRadius: 1.5, border: '1px solid #fecdd3' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991b1b' }}>
                  {selectedPartyForPay.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#b91c1c', display: 'block' }}>
                  कुल तिर्न बाँकी बक्यौता: <strong>रु. {(selectedPartyForPay.currentDue || 0).toLocaleString()}</strong>
                </Typography>
              </Box>

              <TextField
                fullWidth
                required
                type="number"
                size="small"
                label="भुक्तानी गर्न लागेको रकम (रु.)"
                value={payDueAmount}
                onChange={(e) => setPayDueAmount(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                select
                fullWidth
                size="small"
                label="भुक्तानी माध्यम"
                value={payDueMethod}
                onChange={(e) => setPayDueMethod(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="Cash">नगद (Cash)</MenuItem>
                <MenuItem value="Bank">बैंक ट्रान्सफर / चेक (Bank Transfer / Cheque)</MenuItem>
                <MenuItem value="Fonepay">Fonepay / QR</MenuItem>
                <MenuItem value="eSewa">eSewa</MenuItem>
              </TextField>

              <TextField
                fullWidth
                size="small"
                label="कैफियत (Remarks)"
                value={payDueRemarks}
                onChange={(e) => setPayDueRemarks(e.target.value)}
              />

              <DialogActions sx={{ px: 0, pt: 3 }}>
                <Button onClick={() => setPayDueOpen(false)} color="inherit">
                  रद्द गर्नुहोस्
                </Button>
                <Button type="submit" variant="contained" color="error" sx={{ fontWeight: 800 }}>
                  भुक्तानी भौचर जारी गर्नुहोस्
                </Button>
              </DialogActions>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
