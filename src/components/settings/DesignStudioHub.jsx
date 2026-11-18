import React, { useState } from 'react';
import { Box, Paper, Typography, Tabs, Tab, Chip } from '@mui/material';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DescriptionIcon from '@mui/icons-material/Description';
import CertificateStudioManager from './CertificateStudioManager';
import AgreementStudioManager from './AgreementStudioManager';

export default function DesignStudioHub({ initialTab = 0, onSaveSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          px: 2.5,
          pt: 2,
          pb: 0,
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#EFF6FF',
                color: '#0F2C59',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ColorLensIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                Design Studio & Template Hub
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Centralized visual studio for Certificates, Trainee Agreements & future print templates
              </Typography>
            </Box>
          </Box>
          <Chip
            size="small"
            label="Multi-Template Studio"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderTop: '1px solid #F1F5F9',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, minHeight: 46 }
          }}
        >
          <Tab icon={<WorkspacePremiumIcon fontSize="small" />} iconPosition="start" label="Certificate Studio" />
          <Tab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="Agreement Studio" />
        </Tabs>
      </Paper>

      {activeTab === 0 && <CertificateStudioManager onSaveSuccess={onSaveSuccess} />}
      {activeTab === 1 && <AgreementStudioManager onSaveSuccess={onSaveSuccess} />}
    </Box>
  );
}
