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
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useAuth } from '../../context/AuthContext';
import { loadDB } from '../../services/storage';

const NAV_ITEMS = [
  // --- 1. मुख्य ड्यासबोर्ड र कार्यक्रम ---
  { section: '१. ड्यासबोर्ड र कार्यक्रम (CORE OPERATIONS)' },
  { id: 'dashboard', label: 'कार्यकारी ड्यासबोर्ड (Dashboard)', icon: <DashboardIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'groups', label: 'तालिम समूहहरू (Training Batches)', icon: <GroupWorkIcon />, roles: ['ADMIN', 'STAFF'], highlight: true, countBadge: '8' },
  { id: 'occupations', label: 'पेशा तथा क्षेत्र (Occupations Master)', icon: <CategoryIcon />, roles: ['ADMIN'], badge: 'Master' },
  { id: 'courses', label: 'पाठ्यक्रमहरू (Courses & Curriculum)', icon: <MenuBookIcon />, roles: ['ADMIN'], badge: 'CTEVT' },
  { id: 'trainers', label: 'प्रशिक्षक रोस्टर (Certified Trainers)', icon: <PeopleAltIcon />, roles: ['ADMIN'], badge: 'ToT' },
  { id: 'holidays', label: 'शैक्षिक क्यालेन्डर र बिदा (Calendar)', icon: <EventBusyIcon />, roles: ['ADMIN', 'STAFF'] },

  // --- 2. प्रशिक्षार्थी तथा भर्ना व्यवस्थापन ---
  { section: '२. प्रशिक्षार्थी तथा भर्ना (TRAINEES CRM)' },
  { id: 'leads', label: 'सोधपुछ तथा लिड्स (Inquiry CRM)', icon: <ContactPhoneIcon />, roles: ['ADMIN', 'STAFF'], highlight: true, countBadge: 'CRM' },
  { id: 'admission', label: 'नयाँ भर्ना सम्झौता (Admissions)', icon: <HowToRegIcon />, roles: ['ADMIN', 'STAFF'], highlight: true, badge: 'A4' },
  { id: 'students', label: 'प्रशिक्षार्थी विवरण (Trainees Directory)', icon: <SchoolIcon />, roles: ['ADMIN', 'STAFF'] },

  // --- 3. तालिम तथा कक्षा सञ्चालन ---
  { section: '३. तालिम तथा कक्षा सञ्चालन (ACADEMICS)' },
  { id: 'live_attendance', label: '📡 प्रत्यक्ष लाइभ हाजिरी (Live Attendance)', icon: <FingerprintIcon />, roles: ['ADMIN', 'STAFF'], highlight: true, countBadge: 'LIVE' },
  { id: 'attendance', label: 'दैनिक हाजिरी (Daily Attendance)', icon: <FactCheckIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'workplan', label: 'कार्य-योजना (Work Plan)', icon: <EventNoteIcon />, roles: ['ADMIN'] },
  { id: 'lessonplan', label: 'पाठ-योजना (Lesson Plan)', icon: <AssignmentIcon />, roles: ['ADMIN'] },
  { id: 'logbook', label: 'CTEVT दैनिक लग-बुक (Log Book)', icon: <MenuBookTwoToneIcon />, roles: ['ADMIN'] },
  { id: 'evaluations', label: 'सीप मूल्याङ्कन (Competency Matrix)', icon: <AssessmentIcon />, roles: ['ADMIN'] },
  { id: 'syllabus', label: 'पाठ्यक्रम स्टुडियो (Syllabus Studio)', icon: <FormatListBulletedIcon />, roles: ['ADMIN'], badge: 'Studio' },

  // --- 4. रोजगारी तथा प्रमाणपत्र ---
  { section: '४. रोजगारी तथा प्रमाणपत्र (PLACEMENTS)' },
  { id: 'certificates', label: 'आधिकारिक प्रमाणपत्र (Certificates)', icon: <WorkspacePremiumIcon />, roles: ['ADMIN', 'STAFF'], highlight: true, badge: 'A4 QR' },
  { id: 'certificate_studio', label: 'प्रमाणपत्र स्टुडियो (Design Studio)', icon: <ColorLensIcon />, roles: ['ADMIN'], highlight: true, badge: 'Studio' },
  { id: 'employers', label: 'रोजगारदाता कम्पनी (Partner Employers)', icon: <BusinessIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'ojt', label: 'उद्योग तालिम / OJT Records', icon: <WorkIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'placements', label: 'रोजगारी तथ्याङ्क (Placements & EPP)', icon: <RocketLaunchIcon />, roles: ['ADMIN', 'STAFF'] },

  // --- 5. आर्थिक तथा लेखा ---
  { section: '५. आर्थिक तथा लेखा (FINANCE & ACCOUNTS)' },
  { id: 'accounts', label: 'लेखा तथा बिलिङ (Finance & Billing)', icon: <AccountBalanceWalletIcon />, roles: ['ADMIN', 'STAFF'], highlight: true, countBadge: 'Rs' },
  { id: 'course_fees', label: 'कोर्स शुल्क संरचना (Course Fee Setup)', icon: <PointOfSaleIcon />, roles: ['ADMIN', 'STAFF'], highlight: true, countBadge: 'VAT' },

  // --- 6. प्रणाली र प्रयोगकर्ता ---
  { section: '६. प्रणाली र प्रयोगकर्ता (SYSTEM & SETTINGS)' },
  { id: 'users', label: 'प्रयोगकर्ता तथा पहुँच (User Access)', icon: <PeopleAltIcon />, roles: ['ADMIN'], highlight: true, badge: 'Portals' },
  { id: 'settings', label: 'संस्थागत प्रोफाइल र सिङ्क (Settings)', icon: <SettingsIcon />, roles: ['ADMIN'], badge: 'Cloud' },
  { id: 'communication', label: 'सञ्चार हब (SMS/WhatsApp Hub)', icon: <ForumIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'notices', label: 'सूचना पाटी (Notice Board)', icon: <CampaignIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'snapshots', label: 'अडिट तथा स्न्यापसट (Audit Trail)', icon: <SecurityIcon />, roles: ['ADMIN', 'STAFF'] },
  { id: 'reports', label: 'समग्र रिपोर्टहरू (Reports & Analytics)', icon: <BarChartIcon />, roles: ['ADMIN', 'STAFF'] }
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
    <Box
      component="nav"
      sx={{
        width: isMobile ? 0 : (open ? 280 : 0),
        flexShrink: isMobile ? 0 : 0,
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard
          })
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
              width: 280,
              bgcolor: '#FFFFFF',
              boxShadow: '4px 0 24px rgba(15, 23, 42, 0.2)'
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
            width: open ? 280 : 0,
            flexShrink: 0,
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
      )}
    </Box>
  );
}
