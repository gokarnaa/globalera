import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Fab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Chip,
  Box,
  Typography,
  IconButton,
  Button,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RemoveIcon from '@mui/icons-material/Remove';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppWorkspace from './WhatsAppWorkspace';
import AiCounselorSandbox from './AiCounselorSandbox';
import { loadDB } from '../../services/storage';
import { playLeadChime } from '../../services/soundUtils';
import {
  fetchRemoteWhatsAppData,
  buildWhatsAppHubState,
  getBotSettings,
  saveBotSettings,
  fetchRemoteBotSettings,
  resolveBotMode,
  subscribeWhatsAppRealtime
} from '../../services/whatsappCloudApi';

/**
 * Global Floating WhatsApp Action Button + 3-State Hub Window:
 * Closed (FAB) <-> Normal Modal <-> Minimized Dock Pill <-> Full-Screen Maximized.
 * Uses keepMounted on Dialog so minimizing preserves active chat & unsent drafts.
 */
export default function FloatingWhatsAppHub({ onOpenFullModule }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [windowMode, setWindowMode] = useState('closed'); // 'closed' | 'normal' | 'minimized' | 'maximized'
  const [soundMuted, setSoundMuted] = useState(false);
  const [targetContact, setTargetContact] = useState({ phone: null, draft: '' });
  const [aiSandboxOpen, setAiSandboxOpen] = useState(false);
  const [botCfg, setBotCfg] = useState(() => getBotSettings());
  const [db, setDb] = useState(() => loadDB());
  const [remoteData, setRemoteData] = useState({ logs: [], inbound: [] });
  const [refreshing, setRefreshing] = useState(false);

  const syncHub = useCallback(async () => {
    setRefreshing(true);
    try {
      setDb(loadDB());
      const [remote, remoteBot] = await Promise.all([
        fetchRemoteWhatsAppData(),
        fetchRemoteBotSettings()
      ]);
      setRemoteData(remote);
      setBotCfg(remoteBot);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const isDialogOpen = windowMode === 'normal' || windowMode === 'maximized';
  const isMaximized = windowMode === 'maximized';
  const activeReplyMode = resolveBotMode(botCfg);

  const handleChangeReplyMode = async (nextMode) => {
    if (!nextMode || nextMode === activeReplyMode) return;
    const nextCfg = {
      ...botCfg,
      replyMode: nextMode,
      autoBotEnabled: nextMode !== 'manual',
      aiCounselorEnabled: nextMode === 'ai'
    };
    setBotCfg(nextCfg);
    try {
      await saveBotSettings(nextCfg);
    } catch {
      setBotCfg(botCfg);
    }
  };

  useEffect(() => {
    syncHub();
    const onDbUpdate = () => setDb(loadDB());
    const onOpenForContact = (e) => {
      const detail = e?.detail || {};
      if (detail.phone) {
        setTargetContact({ phone: detail.phone, draft: detail.initialDraft || '', nonce: Date.now() });
      }
      setWindowMode('normal');
      syncHub();
    };
    window.addEventListener('kite_db_updated', onDbUpdate);
    window.addEventListener('kite_open_whatsapp_hub', onOpenForContact);
    // Real-time WebSocket subscription (<0.5s instant message & AI reply updates)
    const unsubscribeRealtime = subscribeWhatsAppRealtime(() => {
      syncHub();
    });
    return () => {
      window.removeEventListener('kite_db_updated', onDbUpdate);
      window.removeEventListener('kite_open_whatsapp_hub', onOpenForContact);
      unsubscribeRealtime();
    };
  }, [syncHub]);

  // Fallback sync every 5s when open, 15s when minimized/closed
  useEffect(() => {
    const timer = setInterval(syncHub, isDialogOpen ? 5000 : 15000);
    return () => clearInterval(timer);
  }, [syncHub, isDialogOpen]);

  const hubState = useMemo(() => buildWhatsAppHubState(db, remoteData), [db, remoteData]);
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    if (!soundMuted && hubState.totalUnread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
      playLeadChime();
    }
    prevUnreadRef.current = hubState.totalUnread;
  }, [hubState.totalUnread, soundMuted]);

  return (
    <>
      {/* Closed State: Floating Action Button */}
      {windowMode === 'closed' && (
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
                setWindowMode('normal');
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
      )}

      {/* Minimized State: Sleek Floating Dock Pill */}
      {windowMode === 'minimized' && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            right: { xs: 14, md: 24 },
            bottom: { xs: 'calc(76px + env(safe-area-inset-bottom))', md: 24 },
            zIndex: 1150,
            bgcolor: '#0F2C59',
            color: '#FFFFFF',
            borderRadius: '999px',
            px: 1.5,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1.1,
            border: '1.5px solid #16A34A',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)'
          }}
        >
          <Box
            onClick={() => setWindowMode('normal')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <WhatsAppIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
              WhatsApp Hub
            </Typography>
            {hubState.totalUnread > 0 && (
              <Chip
                size="small"
                label={`${hubState.totalUnread} new`}
                sx={{
                  height: 20,
                  bgcolor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.68rem'
                }}
              />
            )}
          </Box>

          <Tooltip title="Restore window">
            <IconButton
              size="small"
              aria-label="Restore WhatsApp Hub"
              onClick={() => setWindowMode('normal')}
              sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
            >
              <OpenInFullIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton
              size="small"
              aria-label="Close WhatsApp Hub"
              onClick={() => setWindowMode('closed')}
              sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(239,68,68,0.35)' } }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Paper>
      )}

      {/* Normal / Maximized Floating 3-Pane Dialog */}
      <Dialog
        open={isDialogOpen}
        keepMounted
        onClose={() => setWindowMode('minimized')}
        maxWidth="xl"
        fullWidth
        fullScreen={isMobile || isMaximized}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(15, 23, 42, 0.45)'
            }
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: isMobile || isMaximized ? 0 : 3.5,
            height: isMobile || isMaximized ? '100dvh' : '86dvh',
            maxHeight: isMobile || isMaximized ? '100dvh' : '86dvh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 65px -12px rgba(15, 23, 42, 0.45)',
            transition: 'all 0.18s ease'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#0F2C59',
            color: '#FFFFFF',
            px: { xs: 1.5, sm: 2.25 },
            py: 1.15,
            borderBottom: '2px solid #16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.25
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                position: 'relative',
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
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  bgcolor: '#4ADE80',
                  border: '1.5px solid #0F2C59'
                }}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }} noWrap>
                WhatsApp Live Chat & Workflow Hub
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)', display: 'block' }} noWrap>
                +977 980-3614574 • Synced with Full WhatsApp Tracking Section
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={activeReplyMode}
              onChange={(_, val) => val && handleChangeReplyMode(val)}
              aria-label="WhatsApp Reply Mode"
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.35)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.18)',
                '& .MuiToggleButton-root': {
                  color: '#CBD5E1',
                  border: 'none',
                  py: 0.35,
                  px: 1,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  gap: 0.4,
                  '&.Mui-selected': {
                    color: '#FFFFFF'
                  }
                }
              }}
            >
              <ToggleButton
                value="ai"
                sx={{
                  '&.Mui-selected': { bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                AI Mode
              </ToggleButton>
              <ToggleButton
                value="bot"
                sx={{
                  '&.Mui-selected': { bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }
                }}
              >
                <SmartToyIcon sx={{ fontSize: 13 }} />
                Bot Mode
              </ToggleButton>
              <ToggleButton
                value="manual"
                sx={{
                  '&.Mui-selected': { bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }
                }}
              >
                <PersonIcon sx={{ fontSize: 13 }} />
                Manual
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              size="small"
              variant="contained"
              startIcon={<SmartToyIcon sx={{ fontSize: 15 }} />}
              onClick={() => setAiSandboxOpen(true)}
              sx={{
                bgcolor: '#4F46E5',
                color: '#FFFFFF',
                fontWeight: 800,
                '&:hover': { bgcolor: '#4338CA' },
                fontSize: '0.75rem',
                py: 0.45,
                px: 1.25,
                borderRadius: 2
              }}
            >
              AI Sandbox
            </Button>

            {onOpenFullModule && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                onClick={() => {
                  setWindowMode('closed');
                  onOpenFullModule();
                }}
                sx={{
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.35)',
                  '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' },
                  display: { xs: 'none', md: 'inline-flex' },
                  mr: 0.5
                }}
              >
                Full Tracking Section
              </Button>
            )}

            <Tooltip title={soundMuted ? 'Unmute message chime' : 'Mute message chime'}>
              <IconButton
                size="small"
                aria-label={soundMuted ? 'Unmute chime' : 'Mute chime'}
                onClick={() => setSoundMuted((prev) => !prev)}
                sx={{ color: soundMuted ? '#FCA5A5' : '#86EFAC', bgcolor: 'rgba(255,255,255,0.10)' }}
              >
                {soundMuted ? <NotificationsOffIcon fontSize="small" /> : <NotificationsActiveIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Minimize to dock">
              <IconButton
                size="small"
                aria-label="Minimize WhatsApp Hub"
                onClick={() => setWindowMode('minimized')}
                sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {!isMobile && (
              <Tooltip title={isMaximized ? 'Restore normal size' : 'Maximize full screen'}>
                <IconButton
                  size="small"
                  aria-label={isMaximized ? 'Restore window size' : 'Maximize full screen'}
                  onClick={() => setWindowMode(isMaximized ? 'normal' : 'maximized')}
                  sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
                >
                  {isMaximized ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Close">
              <IconButton
                size="small"
                aria-label="Close WhatsApp Hub"
                onClick={() => setWindowMode('closed')}
                sx={{ color: '#FFFFFF', bgcolor: 'rgba(239,68,68,0.25)', '&:hover': { bgcolor: 'rgba(239,68,68,0.45)' } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 0, sm: isMaximized ? 1 : 1.25 }, bgcolor: '#F8FAFC', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <WhatsAppWorkspace
            threads={hubState.threads}
            onRefresh={syncHub}
            refreshing={refreshing}
            height="100%"
            initialPhone={targetContact.phone}
            initialDraft={targetContact.draft}
            jumpNonce={targetContact.nonce}
            botCfg={botCfg}
            onChangeReplyMode={handleChangeReplyMode}
          />
        </DialogContent>
      </Dialog>

      {/* Standalone Live AI Counselor Sandbox Dialog */}
      <Dialog
        open={aiSandboxOpen}
        onClose={() => setAiSandboxOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(3px)',
              backgroundColor: 'rgba(15, 23, 42, 0.55)'
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#0F2C59',
            color: '#FFFFFF',
            py: 1.25,
            borderBottom: '2px solid #4F46E5'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon sx={{ color: '#818CF8' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Live AI Counselor Test Sandbox
            </Typography>
          </Box>
          <IconButton
            size="small"
            aria-label="Close AI Sandbox"
            onClick={() => setAiSandboxOpen(false)}
            sx={{ color: '#FFFFFF' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#F8FAFC' }}>
          <AiCounselorSandbox inDialog />
        </DialogContent>
      </Dialog>
    </>
  );
}
