import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Grid,
  Alert,
  Divider,
  Paper,
  CircularProgress,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SmsIcon from '@mui/icons-material/Sms';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BusinessIcon from '@mui/icons-material/Business';
import CertificateStudioManager from './CertificateStudioManager';
import CompanyProfileSettings from './CompanyProfileSettings';
import { loadDB, saveDB, resetDB } from '../../services/storage';
import {
  generateSupabaseSQLSchema,
  testSupabaseConnection,
  pushLocalDBToSupabase
} from '../../services/supabaseClient';
import { exportGoogleContactsVCF } from '../../services/exportUtils';

export default function SettingsManager() {
  const [db, setDb] = useState(loadDB());
  const [settings, setSettings] = useState(db.settings || {});
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Supabase test and sync state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncingData, setSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(settings.supabaseUrl, settings.supabaseAnonKey);
      setTestResult(res);
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setSyncingData(true);
    setSyncResult(null);
    try {
      const counts = await pushLocalDBToSupabase(db);
      setSyncResult({ ok: true, counts });
    } catch (err) {
      setSyncResult({ ok: false, message: err.message });
    } finally {
      setSyncingData(false);
    }
  };

  const handleSaveSettings = () => {
    const nextDb = { ...db, settings };
    saveDB(nextDb);
    setDb(nextDb);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopySql = () => {
    const sql = generateSupabaseSQLSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const sql = generateSupabaseSQLSchema();
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kite_tvet_supabase_migration.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportContacts = () => {
    exportGoogleContactsVCF(db.students, db.employers);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all sample data back to initial seed data?')) {
      const fresh = resetDB();
      setDb(fresh);
      setSettings(fresh.settings);
      alert('Data reset successfully.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <SettingsIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
            Settings & Cloud Integration (सेटिङ्स)
          </Typography>
          <Typography variant="body2" sx={{ color: '#647089' }}>
            Supabase PostgreSQL Connection, Aakash SMS Gateway, WhatsApp, and Google Contacts.
          </Typography>
        </Box>
      </Box>

      {savedSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
          Settings successfully saved!
        </Alert>
      )}

      {/* Settings Navigation Tabs */}
      <Paper elevation={0} sx={{ p: 0.5, mb: 3, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, next) => setActiveTab(next)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.88rem',
              textTransform: 'none',
              minHeight: 46,
              borderRadius: 1.5
            },
            '& .Mui-selected': {
              color: '#0F2E5A !important'
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#0F2E5A',
              height: 3,
              borderRadius: 3
            }
          }}
        >
          <Tab
            icon={<BusinessIcon sx={{ mr: 1, fontSize: 20 }} />}
            iconPosition="start"
            label="संस्थागत प्रोफाइल र जारी नम्बर (Company Profile & Numbering)"
          />
          <Tab
            icon={<WorkspacePremiumIcon sx={{ mr: 1, fontSize: 20 }} />}
            iconPosition="start"
            label="प्रमाणपत्र स्टुडियो तथा टेम्प्लेट (Certificate Studio)"
          />
          <Tab
            icon={<CloudUploadIcon sx={{ mr: 1, fontSize: 20 }} />}
            iconPosition="start"
            label="क्लाउड तथा प्रणाली एकीकरण (Cloud & Integrations)"
          />
        </Tabs>
      </Paper>

      {/* TAB 0: COMPANY PROFILE & CERTIFICATE NUMBERING */}
      {activeTab === 0 && <CompanyProfileSettings onSaveSuccess={() => setDb(loadDB())} />}

      {/* TAB 1: CERTIFICATE STUDIO & TEMPLATE DESIGNER */}
      {activeTab === 1 && <CertificateStudioManager onSaveSuccess={() => setDb(loadDB())} />}

      {/* TAB 2: CLOUD & INTEGRATION SETTINGS */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
        {/* 1. Supabase PostgreSQL Card */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <CloudUploadIcon sx={{ color: '#1a56b0', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Supabase Cloud Database
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#647089', mb: 2.5 }}>
              Connect your live Supabase project to sync this local system with Postgres Cloud.
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Supabase Project URL"
                fullWidth
                placeholder="https://xyzcompany.supabase.co"
                value={settings.supabaseUrl || ''}
                onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value })}
              />
              <TextField
                label="Supabase Anon Public API Key"
                fullWidth
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={settings.supabaseAnonKey || ''}
                onChange={(e) => setSettings({ ...settings, supabaseAnonKey: e.target.value })}
              />
            </Stack>

            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                Ready-to-Run PostgreSQL Migration Script
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5 }}>
                Copy and run this in your Supabase SQL Editor to auto-create all 15 relational tables with foreign keys.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopySql}
                  sx={{ fontWeight: 700 }}
                >
                  {copiedSql ? '✓ Copied to Clipboard!' : 'Copy SQL Schema'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadSql}
                  sx={{ fontWeight: 700 }}
                >
                  Download .sql File
                </Button>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={testingConnection}
                startIcon={testingConnection ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                sx={{ fontWeight: 700 }}
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                sx={{ fontWeight: 700, bgcolor: '#1a56b0' }}
              >
                Save Cloud Configuration
              </Button>
            </Stack>

            {testResult && (
              <Alert
                severity={testResult.ok ? 'success' : 'error'}
                icon={testResult.ok ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                sx={{ mb: 2, borderRadius: 2, fontWeight: 600, fontSize: '0.85rem' }}
              >
                {testResult.message}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ bgcolor: '#eff6ff', p: 2, borderRadius: 2.5, border: '1px solid #bfdbfe' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af', mb: 0.5 }}>
                Localhost ↔ Supabase Cloud Sync Engine
              </Typography>
              <Typography variant="caption" sx={{ color: '#3b82f6', display: 'block', mb: 1.5 }}>
                Push all current LocalStorage data (Curricula, Batches, Students, Attendance, Evaluations, Jobs) into Supabase PostgreSQL Cloud.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSyncToSupabase}
                disabled={syncingData}
                startIcon={syncingData ? <CircularProgress size={16} color="inherit" /> : <CloudSyncIcon />}
                sx={{ fontWeight: 800, bgcolor: '#2563eb' }}
              >
                {syncingData ? 'Syncing to Supabase Cloud...' : 'Push All Local Data to Supabase'}
              </Button>

              {syncResult && (
                <Box sx={{ mt: 1.5 }}>
                  {syncResult.ok ? (
                    <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.82rem', fontWeight: 600 }}>
                      Data synced successfully! Occupations: {syncResult.counts.occupations}, Courses: {syncResult.counts.courses}, Batches: {syncResult.counts.training_groups}, Students: {syncResult.counts.students}, Syllabi: {syncResult.counts.syllabi}, Attendance: {syncResult.counts.attendances}.
                    </Alert>
                  ) : (
                    <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
                      Sync failed: {syncResult.message}. (Make sure you have run the migration SQL script in your Supabase SQL Editor first!)
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* 2. Communication & Automation */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <SmsIcon sx={{ color: '#16834b', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Aakash SMS & Automation
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#647089', mb: 2.5 }}>
              Automated notifications for daily absent alerts and welcome messages in Nepal.
            </Typography>

            <Stack spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Aakash SMS API Auth Token"
                fullWidth
                type="password"
                placeholder="Enter your Aakash SMS Token"
                value={settings.aakashSmsToken || ''}
                onChange={(e) => setSettings({ ...settings, aakashSmsToken: e.target.value })}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.enableAutoSmsOnAbsent)}
                    onChange={(e) => setSettings({ ...settings, enableAutoSmsOnAbsent: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Auto-send SMS to parents when student is Absent
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.enableWhatsAppDirect)}
                    onChange={(e) => setSettings({ ...settings, enableWhatsAppDirect: e.target.checked })}
                    color="success"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Enable 1-Click WhatsApp Quick Action Buttons
                  </Typography>
                }
              />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <ContactPhoneIcon sx={{ color: '#0288d1', fontSize: 26 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Google Contacts Mobile Sync
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5 }}>
              Export all student and employer phone numbers into a single vCard file. Import to your Android or iPhone so incoming caller IDs show student names automatically.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportContacts}
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Export Contacts (.vcf)
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#d5372f', mb: 0.5 }}>
                System Maintenance
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleResetData}
                sx={{ fontWeight: 700 }}
              >
                Reset All Sample Database
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
      )}
    </Box>
  );
}
