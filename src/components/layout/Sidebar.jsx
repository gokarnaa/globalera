import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton,
  ButtonBase
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MenuBookTwoToneIcon from '@mui/icons-material/MenuBookTwoTone';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BarChartIcon from '@mui/icons-material/BarChart';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CampaignIcon from '@mui/icons-material/Campaign';
import ForumIcon from '@mui/icons-material/Forum';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useAuth } from '../../context/AuthContext';
import { loadDB } from '../../services/storage';

const NAV_ITEMS = [
  // --- 1. Core Operations & Programs ---
  { section: 'Core operations' },
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'groups', label: 'Training Batches', icon: <GroupWorkIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'occupations', label: 'Occupations', icon: <CategoryIcon />, roles: ['ADMIN'] },
  { id: 'courses', label: 'Courses & Curriculum', icon: <MenuBookIcon />, roles: ['ADMIN'] },
  { id: 'trainers', label: 'Trainers', icon: <PeopleAltIcon />, roles: ['ADMIN'] },
  { id: 'holidays', label: 'Academic Calendar', icon: <EventBusyIcon />, roles: ['ADMIN', 'STAFF'] },

  // --- 2. Trainees & Admissions Management ---
  { section: 'Trainees & CRM' },
  { id: 'leads', label: 'Inquiries & Leads', icon: <ContactPhoneIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'admission', label: 'Admissions', icon: <HowToRegIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'students', label: 'Trainees Directory', icon: <SchoolIcon />, roles: ['ADMIN', 'STAFF'] },

  // --- 3. Training & Classroom Operations ---
  { section: 'Academics & attendance' },
  { id: 'live_attendance', label: 'Live Attendance', icon: <FingerprintIcon />, roles: ['ADMIN', 'STAFF'], liveDot: true },
  { id: 'attendance', label: 'Daily Attendance', icon: <FactCheckIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'workplan', label: 'Work Plan', icon: <EventNoteIcon />, roles: ['ADMIN'] },
  { id: 'lessonplan', label: 'Lesson Plan', icon: <AssignmentIcon />, roles: ['ADMIN'] },
  { id: 'logbook', label: 'CTEVT Log Book', icon: <MenuBookTwoToneIcon />, roles: ['ADMIN'] },
  { id: 'evaluations', label: 'Competency Matrix', icon: <AssessmentIcon />, roles: ['ADMIN'] },
  { id: 'syllabus', label: 'Syllabus Studio', icon: <FormatListBulletedIcon />, roles: ['ADMIN'] },

  // --- 4. Placements & Certificates ---
  { section: 'Placements & certificates' },
  { id: 'certificates', label: 'Certificates', icon: <WorkspacePremiumIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'certificate_studio', label: 'Certificate Studio', icon: <ColorLensIcon />, roles: ['ADMIN'] },
  { id: 'employers', label: 'Partner Employers', icon: <BusinessIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'ojt', label: 'Industry OJT', icon: <WorkIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'placements', label: 'Placements & EPP', icon: <RocketLaunchIcon />, roles: ['ADMIN', 'STAFF'] },

  // --- 5. Finance & Accounts ---
  { section: 'Finance' },
  { id: 'accounts', label: 'Finance & Billing', icon: <AccountBalanceWalletIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'course_fees', label: 'Course Fee Setup', icon: <PointOfSaleIcon />, roles: ['ADMIN', 'STAFF'] },

  // --- 6. System & Settings ---
  { section: 'System' },
  { id: 'users', label: 'Users & Portals', icon: <PeopleAltIcon />, roles: ['ADMIN'] },
  { id: 'settings', label: 'System Settings', icon: <SettingsIcon />, roles: ['ADMIN'] },
  { id: 'whatsapp_hub', label: 'WhatsApp Inbox', icon: <WhatsAppIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'communication', label: 'SMS & Broadcast', icon: <ForumIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'notices', label: 'Notice Board', icon: <CampaignIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'snapshots', label: 'Audit Snapshots', icon: <SecurityIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'reports', label: 'Reports & Analytics', icon: <BarChartIcon />, roles: ['ADMIN', 'STAFF'] }
];

import { testSupabaseConnection } from '../../services/supabaseClient';

export default function Sidebar({ currentTab, onSelectTab, open, onClose, isMobile }) {
  const { currentUser, isTrainer, isAdmin, isStudent, isEmployer } = useAuth();
  const [db, setDb] = React.useState(() => loadDB());
  const [cloudStatus, setCloudStatus] = React.useState('checking');

  React.useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const currentDb = loadDB();
        setDb(currentDb);
        const url = currentDb.settings?.supabaseUrl;
        const key = currentDb.settings?.supabaseAnonKey;
        if (!url || !key) {
          if (isMounted) setCloudStatus('offline');
          return;
        }
        const res = await testSupabaseConnection(url, key);
        if (isMounted) {
          setCloudStatus(res.ok && !res.tableMissing ? 'connected' : res.ok && res.tableMissing ? 'setup_needed' : 'offline');
        }
      } catch {
        if (isMounted) setCloudStatus('offline');
      }
    };

    checkStatus();
    window.addEventListener('kite_db_updated', checkStatus);
    window.addEventListener('storage', checkStatus);
    const interval = setInterval(checkStatus, 25000);

    return () => {
      isMounted = false;
      window.removeEventListener('kite_db_updated', checkStatus);
      window.removeEventListener('storage', checkStatus);
      clearInterval(interval);
    };
  }, []);

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.section) {
      const sec = item.section.toLowerCase();
      if (isStudent) {
        return sec.includes('portal') || sec.includes('certificate');
      }
      if (isEmployer) {
        return sec.includes('portal') || sec.includes('placement');
      }
      return true;
    }
    if (!item.roles) return true;
    return item.roles.includes(currentUser?.role);
  });

  const drawerContent = (
    <Box sx={{ width: 252, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {isMobile && (
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#FFFFFF'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
            Navigation
          </Typography>
          <IconButton size="small" aria-label="Close navigation menu" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Navigation Links List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
        <List disablePadding>
          {filteredItems.map((item, idx) => {
            if (item.section) {
              return (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 1.25,
                    pt: idx === 0 ? 1 : 2.5,
                    pb: 0.75,
                    fontWeight: 500,
                    color: '#6B7487',
                    fontSize: '0.72rem',
                    letterSpacing: '0.01em'
                  }}
                >
                  {item.section}
                </Typography>
              );
            }

            const isSelected = currentTab === item.id;

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (isMobile && onClose) onClose();
                  }}
                  sx={{
                    borderRadius: '8px',
                    minHeight: 34,
                    py: 0.5,
                    px: 1.25,
                    bgcolor: isSelected ? '#EEF2F6 !important' : 'transparent',
                    color: isSelected ? '#0F2C59' : '#4B5565',
                    transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
                    '&:hover': {
                      bgcolor: isSelected ? '#EEF2F6' : '#F7F8FA',
                      color: '#111827'
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isSelected ? '#0F2C59' : '#6B7487',
                      minWidth: 28,
                      '& svg': { fontSize: '1.05rem' }
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#0F2C59' : '#1F2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  />

                  {item.liveDot && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#16A34A',
                        flexShrink: 0,
                        ml: 1
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer System Status Card */}
      <Box sx={{ p: 1.5, borderTop: '1px solid #E5E7EB', bgcolor: '#FFFFFF' }}>
        <ButtonBase
          onClick={() => onSelectTab && onSelectTab('settings')}
          aria-label={`Cloud status ${cloudStatus}, ${(db.trainingGroups || []).length} active batches. Open settings`}
          sx={{
            width: '100%',
            display: 'block',
            textAlign: 'left',
            p: 1.25,
            borderRadius: '8px',
            bgcolor: '#F7F8FA',
            border: '1px solid #E5E7EB',
            cursor: 'pointer',
            transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
            '&:hover': {
              borderColor: '#D1D5DB',
              bgcolor: '#F1F5F9'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {cloudStatus === 'connected' ? (
                <CloudDoneIcon sx={{ fontSize: 15, color: '#16A34A' }} />
              ) : cloudStatus === 'setup_needed' ? (
                <CloudSyncIcon sx={{ fontSize: 15, color: '#D97706' }} />
              ) : (
                <ErrorOutlineIcon sx={{ fontSize: 15, color: '#DC2626' }} />
              )}
              <Typography variant="caption" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.75rem' }}>
                {cloudStatus === 'connected'
                  ? 'Cloud synced'
                  : cloudStatus === 'setup_needed'
                  ? 'Setup needed'
                  : 'Local mode'}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color:
                  cloudStatus === 'connected'
                    ? '#16A34A'
                    : cloudStatus === 'setup_needed'
                    ? '#D97706'
                    : '#DC2626'
              }}
            >
              {cloudStatus === 'connected'
                ? 'Live'
                : cloudStatus === 'setup_needed'
                ? 'Setup'
                : 'Offline'}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#6B7487', display: 'block', fontSize: '0.72rem' }}>
            {(db.trainingGroups || []).length} active batches · Jorpati
          </Typography>
        </ButtonBase>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: isMobile ? 0 : (open ? 252 : 0),
        flexShrink: 0
      }}
    >
      {isMobile ? (
        /* Mobile Drawer: Only rendered when on mobile breakpoint */
        <Drawer
          variant="temporary"
          anchor="left"
          open={Boolean(open)}
          onClose={onClose}
          ModalProps={{ keepMounted: false }}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 2,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 252,
              bgcolor: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop Persistent Drawer: Only rendered on desktop */
        <Drawer
          variant="persistent"
          anchor="left"
          open={Boolean(open)}
          sx={{
            width: open ? 252 : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 252,
              bgcolor: '#FFFFFF',
              borderRight: '1px solid #E5E7EB',
              top: '64px',
              height: 'calc(100dvh - 64px)',
              boxShadow: 'none'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
}
