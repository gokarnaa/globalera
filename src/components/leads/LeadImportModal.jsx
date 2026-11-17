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
  Chip,
  Stack,
  useTheme,
  useMediaQuery
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
          setErrorMsg('The uploaded file is empty.');
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
            source: getVal('source') || 'Other',
            priority: getVal('priority') || 'Medium',
            stage: getVal('stage') || 'New Lead',
            notes: getVal('notes') || getVal('remarks') || ''
          };
        });

        // Filter valid rows (must have name and phone)
        const validRows = normalized.filter((r) => r.name && r.phone);
        if (validRows.length === 0) {
          setErrorMsg('No valid records found. Please ensure the file contains Name and Phone columns.');
          setParsedRows([]);
        } else {
          setParsedRows(validRows);
        }
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMsg('Could not read the file. Please select a valid Excel (.xlsx) or CSV (.csv) file.');
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
      fullScreen={isMobile}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          px: { xs: 2, sm: 2.5 },
          py: 1.75,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
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
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B'
            }}
          >
            <CloudUploadIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.1rem' }, lineHeight: 1.2 }}>
              Bulk Import Leads from Excel / CSV
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, display: 'block' }}>
              Import prospective student inquiries from external spreadsheets or ad campaigns
            </Typography>
          </Box>
        </Box>
        <IconButton
          aria-label="Close bulk import dialog"
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

      <DialogContent
        dividers
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          bgcolor: '#F8FAFC',
          flex: 1,
          overflowY: 'auto'
        }}
      >
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Step 1: Download Template & Upload Area */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF'
          }}
        >
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#64748B',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              mb: 1.5
            }}
          >
            1. Template & Spreadsheet Upload
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              onClick={handleDownloadTemplate}
              startIcon={<FileDownloadIcon />}
              sx={{
                py: 1.1,
                px: 2.5,
                fontWeight: 700,
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: '#334155',
                bgcolor: '#FFFFFF',
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
              }}
            >
              Download Sample Excel Template
            </Button>

            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{
                flexGrow: 1,
                py: 1.1,
                px: 2.5,
                fontWeight: 800,
                borderRadius: 2,
                bgcolor: '#0F2C59',
                '&:hover': { bgcolor: '#1E3A8A' }
              }}
            >
              {fileName ? `Selected File: ${fileName}` : 'Upload Excel (.xlsx) or CSV File'}
              <input
                type="file"
                hidden
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
              />
            </Button>
          </Stack>
        </Paper>

        {/* Preview Table */}
        {parsedRows.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                2. Preview Import List ({parsedRows.length} Leads)
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
              sx={{
                maxHeight: 320,
                borderRadius: 1.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                overflowX: 'auto'
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>Address</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#F1F5F9' }}>Stage</TableCell>
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
          </Paper>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          flexShrink: 0,
          justifyContent: 'space-between'
        }}
      >
        <Button onClick={onClose} size="small" sx={{ color: '#64748B', fontWeight: 700, py: 0.8 }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirmImport}
          variant="contained"
          size="small"
          disabled={parsedRows.length === 0}
          sx={{
            bgcolor: '#0F2C59',
            fontWeight: 800,
            px: 3,
            py: 0.8,
            borderRadius: 2,
            '&:hover': { bgcolor: '#1E3A8A' }
          }}
        >
          Import All ({parsedRows.length}) Leads
        </Button>
      </DialogActions>
    </Dialog>
  );
}
