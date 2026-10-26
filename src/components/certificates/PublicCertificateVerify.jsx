import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  Grid,
  Paper,
  Card,
  IconButton
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PublicCertificateVerify({
  open,
  onClose,
  certId,
  certificate,
  student,
  course,
  group,
  isCloudVerified,
  onOpenFullCertificate
}) {
  if (!open) return null;

  const isValid = Boolean(certificate && student);
  const snapshot = certificate?.snapshot || {};
  const isRevoked = certificate?.status === 'REVOKED';

  const studentName = snapshot.studentNameEn || student?.name;
  const studentNameNp = snapshot.studentNameNp || student?.nameNp;
  const courseTitle = snapshot.courseTitleEn || course?.title || 'Vocational Training';
  const totalHours = snapshot.totalHours || course?.totalHours || 390;
  const guardianName = snapshot.guardianNameEn || student?.fatherName || student?.guardianName || '—';
  const address = snapshot.addressEn || student?.permanentAddress || 'Nepal';
  const startDate = snapshot.startDate || group?.admissionDate || '2026-07-15';
  const endDate = snapshot.endDate || group?.expectedEndDate || '2026-10-15';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ bgcolor: isRevoked ? '#7f1d1d' : '#0b2545', color: '#ffffff', p: 2.5, textAlign: 'center', position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: '#94a3b8' }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: isRevoked ? '#dc2626' : '#16834b', width: 56, height: 56 }}>
            <VerifiedIcon sx={{ fontSize: 36, color: '#ffffff' }} />
          </Avatar>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '0.04em' }}>
          {isRevoked ? 'CERTIFICATE REVOKED' : 'OFFICIAL CREDENTIAL VERIFICATION'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
          प्रमाणीकरण पोर्टल • CTEVT Accredited Institution
        </Typography>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {isValid ? (
          <Box>
            {/* Status Alert Banner */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2.5,
                bgcolor: isRevoked ? '#fef2f2' : '#e5f8ee',
                border: `1.5px solid ${isRevoked ? '#dc2626' : '#16834b'}`,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <CheckCircleIcon sx={{ color: isRevoked ? '#dc2626' : '#16834b', fontSize: 30 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isRevoked ? '#dc2626' : '#16834b' }}>
                  {isRevoked
                    ? '⚠️ CERTIFICATE HAS BEEN REVOKED (रद्द गरिएको प्रमाणपत्र)'
                    : 'CERTIFIED AUTHENTIC & VALID (सक्कल अभिलेख प्रमाणित)'}
                </Typography>
                <Typography variant="caption" sx={{ color: isRevoked ? '#991b1b' : '#276749', display: 'block' }}>
                  {isRevoked
                    ? 'This certificate has been revoked and is no longer valid for official purposes.'
                    : 'This vocational training completion certificate is genuine and officially recorded.'}
                </Typography>
                {isCloudVerified && (
                  <Chip
                    label="⚡ Verified from Supabase PostgreSQL Cloud"
                    size="small"
                    sx={{ mt: 0.5, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
            </Paper>

            {/* Student Info Card */}
            <Card sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Avatar
                  src={student?.photoUrl}
                  sx={{ width: 52, height: 52, bgcolor: '#1a56b0', fontWeight: 900 }}
                >
                  {studentName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', fontSize: '1.15rem' }}>
                    {studentName} {studentNameNp ? `(${studentNameNp})` : ''}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                    TGID / Reg: <b>{student?.tgid}</b> • Gender: {student?.gender || '—'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Grid container spacing={1.5} sx={{ fontSize: '0.85rem' }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                    CERTIFICATE NUMBER:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0b2545' }}>
                    {certificate.certificateNo}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                    ISSUE DATE (जारी मिति):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {certificate.issueDate}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                    COURSE / PROGRAM (पाठ्यक्रम):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                    {courseTitle} ({totalHours} Hours)
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                    FATHER / GUARDIAN:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {guardianName}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                    PERMANENT ADDRESS:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {address}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                    TRAINING PERIOD (तालिम अवधि):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {startDate} → {endDate}
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Institution Badge */}
            <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0b2545' }}>
                GLOBAL ERA TECHNICAL SCHOOL / KITE CAREGIVER
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                CTEVT Accredited Institution • Regd No: 184920/078/079
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                MitraPark, Chabahil-07, Kathmandu, Nepal
              </Typography>
            </Box>

            {onOpenFullCertificate && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<PrintIcon />}
                onClick={() => {
                  onClose();
                  onOpenFullCertificate();
                }}
                sx={{ bgcolor: '#0b2545', fontWeight: 800, py: 1 }}
              >
                View Full A4 Landscape Certificate
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 800 }}>
              Certificate Not Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#647089', mt: 1 }}>
              No active certificate matches record ID: <b>{certId}</b>. Please check the Certificate ID or contact the institution.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
