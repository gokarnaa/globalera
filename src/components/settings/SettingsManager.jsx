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
  Tab,
  InputAdornment,
  IconButton
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SmsIcon from '@mui/icons-material/Sms';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BusinessIcon from '@mui/icons-material/Business';
import CertificateStudioManager from './CertificateStudioManager';
import CompanyProfileSettings from './CompanyProfileSettings';
import { loadDB, saveDB, resetDB, syncWithCloud } from '../../services/storage';
import {
  generateSupabaseSQLSchema,
  testSupabaseConnection,
  pushLocalDBToSupabase,
  pullRemoteDBFromSupabase
} from '../../services/supabaseClient';
import { exportGoogleContactsVCF } from '../../services/exportUtils';

export default function SettingsManager() {
  const [db, setDb] = useState(loadDB());
  const [settings, setSettings] = useState(db.settings || {});
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showKey, setShowKey] = useState(false);

  // Supabase test and sync state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncingData, setSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const url = (settings.supabaseUrl || '').trim();
      const key = (settings.supabaseAnonKey || '').trim();

      if (!url || !key) {
        setTestResult({
          ok: false,
          message: 'Please enter your Supabase Project URL and Anon Public Key.'
        });
        return;
      }

      if (url.includes('yycybsmwuixixfmocrcz')) {
        setTestResult({
          ok: false,
          message: 'The URL "yycybsmwuixixfmocrcz.supabase.co" is a demo placeholder that does not exist. Please create your project at supabase.com and paste your real Project URL.'
        });
        return;
      }

      const res = await testSupabaseConnection(url, key);
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

  const [pullingData, setPullingData] = useState(false);
  const [pullResult, setPullResult] = useState(null);

  const handlePullFromSupabase = async () => {
    setPullingData(true);
    setPullResult(null);
    try {
      const res = await syncWithCloud(false);
      if (res.ok) {
        setDb(loadDB());
        setPullResult({ ok: true, message: 'Successfully pulled latest records from Supabase Cloud!' });
      } else {
        setPullResult({ ok: false, message: res.message || 'Could not fetch records. Please verify table migration.' });
      }
    } catch (err) {
      setPullResult({ ok: false, message: err.message });
    } finally {
      setPullingData(false);
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
            Settings & Cloud Integration
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
            label="Company Profile & Numbering"
          />
          <Tab
            icon={<WorkspacePremiumIcon sx={{ mr: 1, fontSize: 20 }} />}
            iconPosition="start"
            label="Certificate Studio & Templates"
          />
          <Tab
            icon={<CloudUploadIcon sx={{ mr: 1, fontSize: 20 }} />}
            iconPosition="start"
            label="Cloud & System Integrations"
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
            <Typography variant="body2" sx={{ color: '#647089', mb: 2 }}>
              Connect your live Supabase project to sync this local system with Postgres Cloud.
            </Typography>

            {(!settings.supabaseUrl || settings.supabaseUrl.includes('yycybsmwuixixfmocrcz')) ? (
              <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Cloud Sync is in Local Storage Mode (Offline)
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  The default address <code>yycybsmwuixixfmocrcz</code> was an unconfigured placeholder. Please paste your own real <b>Supabase Project URL</b> and <b>Anon Public API Key</b> from your <b>supabase.com</b> dashboard to activate cross-browser cloud sync.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  Configured Project: <b>{settings.supabaseUrl.replace(/^https?:\/\//, '').split('/')[0]}</b>. Click <b>Test Connection</b> to check live status.
                </Typography>
              </Alert>
            )}

            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Supabase Project URL"
                fullWidth
                placeholder="https://yourprojectid.supabase.co"
                value={settings.supabaseUrl || ''}
                onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value.trim() })}
                helperText="Found under Project Settings -> API -> Project URL at supabase.com"
              />
              <TextField
                label="Supabase Anon Public API Key"
                fullWidth
                type={showKey ? 'text' : 'password'}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={settings.supabaseAnonKey || ''}
                onChange={(e) => setSettings({ ...settings, supabaseAnonKey: e.target.value.trim() })}
                helperText="Found under Project Settings -> API -> Project API Keys (anon public)"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowKey(!showKey)}
                        edge="end"
                      >
                        {showKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Stack>

            <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: '#0F172A' }}>
                Complete Multi-Tenant Relational PostgreSQL Schema (36 Tables)
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                Includes all 8 related table sections: Organizations, Users, Courses & Syllabi, CTEVT Work & Lesson Plans, Trainees & Biometrics, CRM Leads & Admissions, Double-Entry Accounting & Payroll, and Industry Placements.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopySql}
                  sx={{ fontWeight: 700 }}
                >
                  {copiedSql ? '✓ Copied SQL to Clipboard!' : 'Copy Complete SQL Schema'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadSql}
                  sx={{ fontWeight: 700 }}
                >
                  Download supabase_schema.sql
                </Button>
              </Box>

              <Alert severity="info" sx={{ py: 0.5, fontSize: '0.78rem', bgcolor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                <strong>How to setup Supabase:</strong> Open your Supabase Dashboard &rarr; <b>SQL Editor</b> &rarr; New Query &rarr; Paste the schema &rarr; Click <b>Run</b>. Then enter your Project URL and Anon Key above and click Save.
              </Alert>
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

            <Box sx={{ bgcolor: '#eff6ff', p: 2.5, borderRadius: 2.5, border: '1px solid #bfdbfe' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af', mb: 0.5 }}>
                Two-Way Multi-Browser Cloud Synchronization
              </Typography>
              <Typography variant="caption" sx={{ color: '#3b82f6', display: 'block', mb: 2 }}>
                Synchronize between your local browser cache and Supabase PostgreSQL. This ensures your data is permanently preserved and identical across different browsers and devices.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={handleSyncToSupabase}
                  disabled={syncingData}
                  startIcon={syncingData ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                  sx={{ fontWeight: 800, bgcolor: '#2563eb' }}
                >
                  {syncingData ? 'Pushing to Cloud...' : 'Push Local Data to Supabase'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handlePullFromSupabase}
                  disabled={pullingData}
                  startIcon={pullingData ? <CircularProgress size={16} /> : <CloudDownloadIcon />}
                  sx={{ fontWeight: 800, color: '#1E40AF', borderColor: '#93C5FD' }}
                >
                  {pullingData ? 'Pulling from Cloud...' : 'Pull Cloud Data to Browser'}
                </Button>
              </Stack>

              {syncResult && (
                <Box sx={{ mt: 1.5 }}>
                  {syncResult.ok ? (
                    <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.82rem', fontWeight: 600 }}>
                      Data pushed successfully to Supabase! All 36 relational tables are synced with your cloud database.
                    </Alert>
                  ) : (
                    <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
                      Push failed: {syncResult.message}. (Make sure you have run the migration SQL script in your Supabase SQL Editor first!)
                    </Alert>
                  )}
                </Box>
              )}

              {pullResult && (
                <Box sx={{ mt: 1.5 }}>
                  <Alert severity={pullResult.ok ? 'success' : 'error'} sx={{ borderRadius: 2, fontSize: '0.82rem', fontWeight: 600 }}>
                    {pullResult.message}
                  </Alert>
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
