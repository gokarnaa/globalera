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
  Chip
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
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'] },

  // --- 1. Master Definitions ---
  { section: '1. MASTER SETUP' },
  { id: 'occupations', label: 'Occupations', icon: <CategoryIcon />, roles: ['ADMIN'], badge: 'Master' },
  { id: 'courses', label: 'Courses (Curriculum)', icon: <MenuBookIcon />, roles: ['ADMIN'], badge: 'Master' },
  { id: 'trainers', label: 'Trainers', icon: <PeopleAltIcon />, roles: ['ADMIN'], badge: 'Master' },
  { id: 'syllabus', label: 'Syllabus Units', icon: <FormatListBulletedIcon />, roles: ['ADMIN', 'TRAINER'] },
  { id: 'holidays', label: 'Holidays & Calendar (बिदा)', icon: <EventBusyIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'], badge: 'Calendar' },

  // --- 2. Operational Delivery Chain ---
  { section: '2. OPERATIONS & TRAINING' },
  { id: 'groups', label: 'Training Groups (Batches)', icon: <GroupWorkIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'], highlight: true },
  { id: 'students', label: 'Students (CRM & ID)', icon: <SchoolIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'] },
  { id: 'workplan', label: 'Work Plan (योजना)', icon: <EventNoteIcon />, roles: ['ADMIN', 'TRAINER'] },
  { id: 'lessonplan', label: 'Lesson Plan (तयारी)', icon: <AssignmentIcon />, roles: ['ADMIN', 'TRAINER'] },
  { id: 'attendance', label: 'Daily Attendance', icon: <FactCheckIcon />, roles: ['ADMIN', 'TRAINER'], highlight: true },
  { id: 'logbook', label: 'Log Book (डेलिभरी)', icon: <MenuBookTwoToneIcon />, roles: ['ADMIN', 'TRAINER'] },
  { id: 'evaluations', label: 'Skill Evaluations', icon: <AssessmentIcon />, roles: ['ADMIN', 'TRAINER'] },

  // --- 3. Outcomes, Placements & Certificates ---
  { section: '3. OJT, PLACEMENT & CERTIFICATES' },
  { id: 'employers', label: 'Employers Master', icon: <BusinessIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'ojt', label: 'OJT Records', icon: <WorkIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'placements', label: 'Placements / EPP', icon: <RocketLaunchIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'certificates', label: 'Certificates (प्रमाणपत्र)', icon: <WorkspacePremiumIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'], highlight: true },

  // --- 4. Communication & Notices ---
  { section: '4. COMMUNICATION & NOTICES' },
  { id: 'communication', label: 'Communication Center (सञ्चार)', icon: <ForumIcon />, roles: ['ADMIN', 'STAFF'], highlight: true },
  { id: 'notices', label: 'Notice Board (सूचना)', icon: <CampaignIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF', 'STUDENT'] },

  // --- 5. Self-Service Portals ---
  { section: '5. SELF-SERVICE PORTALS' },
  { id: 'student_portal', label: 'विद्यार्थी पोर्टल (Student Portal)', icon: <SchoolIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF', 'STUDENT'], highlight: true, badge: 'Student' },
  { id: 'employer_portal', label: 'रोजगारदाता पोर्टल (Employer Portal)', icon: <BusinessIcon />, roles: ['ADMIN', 'STAFF', 'EMPLOYER'], highlight: true, badge: 'Jobs' },

  // --- 6. Records, Audits & Intelligence ---
  { section: '6. RECORDS, AUDIT & REPORTS' },
  { id: 'snapshots', label: 'Snapshots & Audit Trail', icon: <SecurityIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'reports', label: 'Reports & Analytics', icon: <BarChartIcon />, roles: ['ADMIN', 'TRAINER', 'STAFF'] },

  // --- 7. Tools & Sync ---
  { section: '7. SETTINGS & CLOUD' },
  { id: 'settings', label: 'Settings & Supabase', icon: <SettingsIcon />, roles: ['ADMIN'] }
];

export default function Sidebar({ currentTab, onSelectTab, open, onClose, isMobile }) {
  const { currentUser, isTrainer, isAdmin } = useAuth();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.section) return true;
    if (!item.roles) return true;
    return item.roles.includes(currentUser?.role);
  });

  const drawerContent = (
    <Box sx={{ width: 280, pb: 4 }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, bgcolor: '#f8fbff', borderBottom: '1px solid #e2e8f0' }}>
        <Typography variant="overline" sx={{ color: '#1a56b0', fontWeight: 900, letterSpacing: '0.08em' }}>
          VOCATIONAL ERP
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#152238', fontSize: '1.1rem' }}>
          ग्लोबल एरा प्राविधिक स्कुल
        </Typography>
        <Typography variant="caption" sx={{ color: '#647089' }}>
          Curriculum to Employment Chain
        </Typography>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 1.5, py: 1 }}>
        {filteredItems.map((item, idx) => {
          if (item.section) {
            return (
              <Typography
                key={idx}
                variant="caption"
                sx={{
                  display: 'block',
                  px: 2,
                  pt: 2.5,
                  pb: 0.5,
                  fontWeight: 800,
                  color: '#94a3b8',
                  letterSpacing: '0.06em',
                  fontSize: '0.7rem'
                }}
              >
                {item.section}
              </Typography>
            );
          }

          const isSelected = currentTab === item.id;

          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  onSelectTab(item.id);
                  if (isMobile && onClose) onClose();
                }}
                sx={{
                  borderRadius: 2.5,
                  py: 1,
                  px: 1.8,
                  bgcolor: isSelected ? '#e8f0fd !important' : 'transparent',
                  color: isSelected ? '#1a56b0' : '#334155',
                  fontWeight: isSelected ? 800 : 600,
                  '&:hover': {
                    bgcolor: '#f1f5fa'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? '#1a56b0' : '#647089',
                    minWidth: 38
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 800 : 600
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      bgcolor: '#f1f5f9',
                      color: '#475569'
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: 280,
              bgcolor: '#ffffff',
              borderRight: '1px solid #e2e8f0'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop Persistent Drawer */
        <Drawer
          variant="persistent"
          open={open}
          PaperProps={{
            sx: {
              width: 280,
              bgcolor: '#ffffff',
              borderRight: '1px solid #e2e8f0',
              top: '66px',
              height: 'calc(100vh - 66px)',
              position: 'fixed'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}
