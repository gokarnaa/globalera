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
  Avatar
} from '@mui/material';
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
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { useAuth } from '../../context/AuthContext';
import { loadDB } from '../../services/storage';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: <DashboardIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'] },

  // --- 1. Master Definitions ---
  { section: '1. ACADEMIC & CURRICULUM' },
  { id: 'occupations', label: 'Occupations (पेशा)', icon: <CategoryIcon />, roles: ['ADMIN'], badge: 'Master' },
  { id: 'courses', label: 'Courses (पाठ्यक्रम)', icon: <MenuBookIcon />, roles: ['ADMIN'], badge: 'CTEVT' },
  { id: 'trainers', label: 'Certified Trainers (प्रशिक्षक)', icon: <PeopleAltIcon />, roles: ['ADMIN'], badge: 'ToT' },
  { id: 'syllabus', label: 'Syllabus Studio (पाठ्य-एकाइ)', icon: <FormatListBulletedIcon />, roles: ['ADMIN', 'TRAINER'], badge: 'Studio' },
  { id: 'holidays', label: 'Holidays & Calendar (बिदा)', icon: <EventBusyIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'] },

  // --- 2. Operational Delivery Chain ---
  { section: '2. OPERATIONS & TRAINING CHAIN' },
  { id: 'groups', label: 'Training Batches (समूह)', icon: <GroupWorkIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'], highlight: true, countBadge: '8' },
  { id: 'students', label: 'Trainees CRM (विद्यार्थी)', icon: <SchoolIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'] },
  { id: 'workplan', label: 'Work Plan (कार्ययोजना)', icon: <EventNoteIcon />, roles: ['ADMIN', 'TRAINER'] },
  { id: 'lessonplan', label: 'Lesson Plan (पाठ-तयारी)', icon: <AssignmentIcon />, roles: ['ADMIN', 'TRAINER'] },
  { id: 'attendance', label: 'Daily Attendance (हाजिरी)', icon: <FactCheckIcon />, roles: ['ADMIN', 'TRAINER'], highlight: true, countBadge: 'Live' },
  { id: 'logbook', label: 'Log Book (डेलिभरी लग)', icon: <MenuBookTwoToneIcon />, roles: ['ADMIN', 'TRAINER'] },
  { id: 'evaluations', label: 'Competency Matrix (मूल्याङ्कन)', icon: <AssessmentIcon />, roles: ['ADMIN', 'TRAINER'] },

  // --- 3. Outcomes, Placements & Certificates ---
  { section: '3. OJT, EMPLOYMENT & CERTIFICATES' },
  { id: 'employers', label: 'Partner Employers (कम्पनी)', icon: <BusinessIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'ojt', label: 'OJT Records (उद्योग तालिम)', icon: <WorkIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'placements', label: 'Placements & EPP (रोजगारी)', icon: <RocketLaunchIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'certificates', label: 'Official Certificates (प्रमाणपत्र)', icon: <WorkspacePremiumIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'], highlight: true, badge: 'A4 QR' },

  // --- 4. Self-Service Portals ---
  { section: '4. SELF-SERVICE PORTALS' },
  { id: 'student_portal', label: 'विद्यार्थी पोर्टल (Student Portal)', icon: <SchoolIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF', 'STUDENT'], highlight: true, badge: 'Student' },
  { id: 'employer_portal', label: 'रोजगारदाता पोर्टल (Employer Portal)', icon: <BusinessIcon />, roles: ['ADMIN', 'STAFF', 'EMPLOYER'], highlight: true, badge: 'Jobs' },

  // --- 5. Communication & Notices ---
  { section: '5. COMMUNICATION & AUDIT' },
  { id: 'communication', label: 'Communication Hub (सञ्चार)', icon: <ForumIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'notices', label: 'Notice Board (सूचना)', icon: <CampaignIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF', 'STUDENT'] },
  { id: 'snapshots', label: 'Snapshots & Audit Trail', icon: <SecurityIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'reports', label: 'Reports & Analytics (रिपोर्ट्स)', icon: <BarChartIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'] },

  // --- 6. Tools & Sync ---
  { section: '6. CLOUD & SYSTEM' },
  { id: 'settings', label: 'Settings & Supabase Sync', icon: <SettingsIcon />, roles: ['ADMIN'], badge: 'Cloud' }
];

export default function Sidebar({ currentTab, onSelectTab, open, onClose, isMobile }) {
  const { currentUser, isTrainer, isAdmin, isStudent, isEmployer } = useAuth();
  const db = loadDB();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.section) {
      if (isStudent) {
        return item.section.includes('PORTALS') || item.section.includes('CERTIFICATES');
      }
      if (isEmployer) {
        return item.section.includes('PORTALS') || item.section.includes('OJT');
      }
      return true;
    }
    if (!item.roles) return true;
    return item.roles.includes(currentUser?.role);
  });

  const drawerContent = (
    <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg, #0F2C59 0%, #1A56B0 100%)',
            boxShadow: '0 4px 12px rgba(15,44,89,0.2)',
            fontSize: '1.25rem'
          }}
        >
          🎓
        </Avatar>
        <Box>
          <Typography variant="overline" sx={{ color: '#0F2C59', fontWeight: 900, letterSpacing: '0.08em', lineHeight: 1 }}>
            GLOBAL ERA TVET
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '0.95rem', lineHeight: 1.2 }}>
            ग्लोबल एरा प्राविधिक स्कुल
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.7rem' }}>
            CTEVT Affiliated • Gov Regd
          </Typography>
        </Box>
      </Box>

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
                    px: 1.5,
                    pt: 2.2,
                    pb: 0.6,
                    fontWeight: 900,
                    color: '#94A3B8',
                    letterSpacing: '0.07em',
                    fontSize: '0.68rem',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.section}
                </Typography>
              );
            }

            const isSelected = currentTab === item.id;

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.4 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (isMobile && onClose) onClose();
                  }}
                  sx={{
                    borderRadius: 2.5,
                    py: 1,
                    px: 1.5,
                    bgcolor: isSelected ? '#EFF6FF !important' : 'transparent',
                    border: isSelected ? '1px solid #BFDBFE' : '1px solid transparent',
                    color: isSelected ? '#1E40AF' : '#334155',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: isSelected ? '#DBEAFE' : '#F1F5F9',
                      transform: 'translateX(2px)'
                    }
                  }}
                >
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: '15%',
                        bottom: '15%',
                        width: 4,
                        borderRadius: '0 4px 4px 0',
                        bgcolor: '#1D4ED8'
                      }}
                    />
                  )}

                  <ListItemIcon
                    sx={{
                      color: isSelected ? '#1D4ED8' : '#64748B',
                      minWidth: 36,
                      '& svg': { fontSize: '1.25rem' }
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.84rem',
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? '#1E40AF' : '#1E293B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  />

                  {item.countBadge && (
                    <Chip
                      size="small"
                      label={item.countBadge}
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        bgcolor: item.highlight ? '#10B981' : '#E2E8F0',
                        color: item.highlight ? '#FFFFFF' : '#475569'
                      }}
                    />
                  )}

                  {item.badge && !item.countBadge && (
                    <Chip
                      size="small"
                      label={item.badge}
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: isSelected ? '#DBEAFE' : '#F1F5F9',
                        color: isSelected ? '#1D4ED8' : '#64748B'
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
      <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <CloudDoneIcon sx={{ fontSize: 16, color: '#059669' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.72rem' }}>
                Supabase Connected
              </Typography>
            </Box>
            <Chip
              label="Live"
              size="small"
              sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#ECFDF5', color: '#059669', fontWeight: 900 }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
            Active Batches: <b>8 Groups</b> • MitraPark Hub
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav">
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, bgcolor: '#FFFFFF' }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Persistent Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            top: '70px',
            height: 'calc(100vh - 70px)',
            boxShadow: '2px 0 12px rgba(15, 23, 42, 0.03)'
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
