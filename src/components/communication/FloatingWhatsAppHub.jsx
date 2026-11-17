import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Fab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WhatsAppWorkspace from './WhatsAppWorkspace';
import { loadDB } from '../../services/storage';
import { playLeadChime } from '../../services/soundUtils';
import {
  fetchRemoteWhatsAppData,
  buildWhatsAppHubState
} from '../../services/whatsappCloudApi';

/**
 * Global Floating WhatsApp Action Button + 3-Pane Quick Hub Dialog.
 * Shares the exact same single source of truth as the Dedicated WhatsApp Sidebar Section.
 */
export default function FloatingWhatsAppHub({ onOpenFullModule }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [open, setOpen] = useState(false);
  const [db, setDb] = useState(() => loadDB());
  const [remoteData, setRemoteData] = useState({ logs: [], inbound: [] });
  const [refreshing, setRefreshing] = useState(false);

  const syncHub = useCallback(async () => {
    setRefreshing(true);
    try {
      setDb(loadDB());
      const remote = await fetchRemoteWhatsAppData();
      setRemoteData(remote);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    syncHub();
    const onDbUpdate = () => setDb(loadDB());
    window.addEventListener('kite_db_updated', onDbUpdate);
    const timer = setInterval(syncHub, 20000);
    return () => {
      window.removeEventListener('kite_db_updated', onDbUpdate);
      clearInterval(timer);
    };
  }, [syncHub]);

  const hubState = useMemo(() => buildWhatsAppHubState(db, remoteData), [db, remoteData]);
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    if (hubState.totalUnread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
      playLeadChime();
    }
    prevUnreadRef.current = hubState.totalUnread;
  }, [hubState.totalUnread]);

  return (
    <>
      <Tooltip title="Open WhatsApp 3-Pane Hub" placement="left">
        <Badge
          badgeContent={hubState.totalUnread}
          color="error"
          overlap="circular"
          invisible={!hubState.totalUnread}
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 24 },
            bottom: { xs: 'calc(76px + env(safe-area-inset-bottom))', md: 24 },
            zIndex: 1150
          }}
        >
          <Fab
            aria-label="Open WhatsApp Hub"
            onClick={() => {
              setOpen(true);
              syncHub();
            }}
            sx={{
              bgcolor: '#16A34A',
              color: '#FFFFFF',
              boxShadow: '0 10px 28px rgba(22, 163, 74, 0.42)',
              '&:hover': { bgcolor: '#15803D', transform: 'scale(1.05)' },
              transition: 'transform 0.15s ease, background-color 0.15s ease'
            }}
          >
            <WhatsAppIcon sx={{ fontSize: 28 }} />
          </Fab>
        </Badge>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xl"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            height: isMobile ? '100dvh' : '86dvh',
            maxHeight: isMobile ? '100dvh' : '86dvh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#0F2C59',
            color: '#FFFFFF',
            px: { xs: 1.75, sm: 2.5 },
            py: 1.25,
            borderBottom: '2px solid #16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                bgcolor: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <WhatsAppIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }} noWrap>
                WhatsApp Live Chat & Workflow Hub
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)', display: 'block' }} noWrap>
                +977 980-3614574 • All messages synced with WhatsApp Tracking Section
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {onOpenFullModule && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                onClick={() => {
                  setOpen(false);
                  onOpenFullModule();
                }}
                sx={{
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.35)',
                  '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' },
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              >
                Full Tracking Section
              </Button>
            )}
            <IconButton
              size="small"
              aria-label="Close WhatsApp Hub"
              onClick={() => setOpen(false)}
              sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.12)' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 0, sm: 1.25 }, bgcolor: '#F8FAFC', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <WhatsAppWorkspace
            threads={hubState.threads}
            onRefresh={syncHub}
            refreshing={refreshing}
            height="100%"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
