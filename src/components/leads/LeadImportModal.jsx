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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as XLSX from 'xlsx';

export default function LeadImportModal({
  open,
  onClose,
  onImportSuccess
}) {
  const [parsedRows, setParsedRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        Name: 'Sita Sharma',
        Phone: '9841000001',
        Address: 'Boudha, Kathmandu',
        Subject: 'Beautician',
        Course: 'Basic Beautician',
        Duration: '3 Months (390 hrs)',
        Fee: 15000,
        Source: 'Facebook',
        Priority: 'High',
        Stage: 'Interested',
        Notes: 'Morning shift preference'
      },
      {
        Name: 'Kiran Thapa',
        Phone: '9801000002',
        Address: 'Jorpati, Kathmandu',
        Subject: 'Mobile Repair',
        Course: 'Smartphone Hardware & Software',
        Duration: '2 Months (260 hrs)',
        Fee: 18000,
        Source: 'Walk-in',
        Priority: 'Medium',
        Stage: 'New Lead',
        Notes: 'Wants installment plan'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LeadsTemplate');
    XLSX.writeFile(workbook, `leads_import_template_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          setErrorMsg('फाइलमा कुनै डाटा फेला परेन (File is empty).');
          setParsedRows([]);
          return;
        }

        // Standardize keys (case-insensitive)
        const normalized = jsonData.map((row) => {
          const keys = Object.keys(row);
          const getVal = (target) => {
            const foundKey = keys.find((k) => k.trim().toLowerCase() === target.toLowerCase());
            return foundKey ? String(row[foundKey]).trim() : '';
          };

          const rawPhone = getVal('phone') || getVal('mobile') || getVal('contact');
          const cleanPhone = rawPhone.replace(/\D/g, '');

          return {
            name: getVal('name') || getVal('fullname') || getVal('studentname'),
            phone: cleanPhone,
            address: getVal('address') || getVal('location'),
            subject: getVal('subject') || getVal('category'),
            course: getVal('course') || getVal('courseTitle'),
            duration: getVal('duration') || '3 Months (390 hrs)',
            price: Number(getVal('fee') || getVal('price')) || 0,
            source: getVal('source') || 'Other (अन्य)',
            priority: getVal('priority') || 'Medium',
            stage: getVal('stage') || 'New Lead',
            notes: getVal('notes') || getVal('remarks') || ''
          };
        });

        // Filter valid rows (must have name and phone)
        const validRows = normalized.filter((r) => r.name && r.phone);
        if (validRows.length === 0) {
          setErrorMsg('कुनै मान्य रेकर्ड भेटिएन। कृपया Name र Phone स्तम्भहरू छन् भनी सुनिश्चित गर्नुहोस्।');
          setParsedRows([]);
        } else {
          setParsedRows(validRows);
        }
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMsg('फाइल पढ्न सकिएन। कृपया मान्य Excel (.xlsx) वा .csv फाइल छान्नुहोस्।');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (!parsedRows.length) return;
    onImportSuccess(parsedRows);
    setParsedRows([]);
    setFileName('');
    onClose();
  };

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
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA'
            }}
          >
            <CloudUploadIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
              एक्सेल / CSV बाट सोधपुछ इम्पोर्ट (Bulk Import Leads)
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
              फेसबुक विज्ञापन वा बाह्य एक्सेल सिटबाट एकैपटक धेरै लिडहरू थप्नुहोस्
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#FFF' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Step 1: Download Template & Upload Area */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3
          }}
        >
          <Button
            variant="outlined"
            onClick={handleDownloadTemplate}
            startIcon={<FileDownloadIcon />}
            sx={{
              py: 1.5,
              px: 2.5,
              fontWeight: 700,
              borderRadius: 2.5,
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#FFFFFF',
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
            }}
          >
            नमूना टेम्प्लेट डाउनलोड (Sample Excel)
          </Button>

          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{
              flexGrow: 1,
              py: 1.5,
              px: 2.5,
              fontWeight: 800,
              borderRadius: 2.5,
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' }
            }}
          >
            {fileName ? `छानिएको फाइल: ${fileName}` : 'एक्सेल वा CSV फाइल अपलोड गर्नुहोस्'}
            <input
              type="file"
              hidden
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
            />
          </Button>
        </Box>

        {/* Preview Table */}
        {parsedRows.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                इम्पोर्ट गरिने सोधपुछ सूची (Preview {parsedRows.length} Leads)
              </Typography>
              <Chip
                icon={<CheckCircleIcon />}
                label={`${parsedRows.length} Records Ready`}
                color="success"
                size="small"
                sx={{ fontWeight: 800 }}
              />
            </Box>

            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                maxHeight: 320,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF'
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>नाम (Name)</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>फोन (Phone)</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>ठेगाना (Address)</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>कोर्स (Course)</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>स्रोत (Source)</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>अवस्था (Stage)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedRows.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#1E293B' }}>{r.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#047857', fontWeight: 600 }}>{r.phone}</TableCell>
                      <TableCell>{r.address || '-'}</TableCell>
                      <TableCell>{r.course || '-'}</TableCell>
                      <TableCell>{r.source || 'Other'}</TableCell>
                      <TableCell>
                        <Chip label={r.stage || 'New Lead'} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
          रद्द गर्नुहोस् (Cancel)
        </Button>
        <Button
          onClick={handleConfirmImport}
          variant="contained"
          disabled={parsedRows.length === 0}
          sx={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
            fontWeight: 800,
            px: 3.5,
            py: 1,
            borderRadius: 2.5
          }}
        >
          सबै ({parsedRows.length}) सोधपुछ इम्पोर्ट गर्नुहोस् (Import All)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
