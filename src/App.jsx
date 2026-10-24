import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Container,
  useMediaQuery,
  useTheme,
  Alert,
  Button,
  Typography
} from '@mui/material';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import PinLockDialog from './components/layout/PinLockDialog';

import Dashboard from './components/dashboard/Dashboard';
import OccupationManager from './components/occupations/OccupationManager';
import CourseManager from './components/courses/CourseManager';
import TrainerManager from './components/trainers/TrainerManager';
import TrainingGroupManager from './components/groups/TrainingGroupManager';
import SyllabusManager from './components/syllabus/SyllabusManager';
import StudentManager from './components/students/StudentManager';
import WorkPlanManager from './components/workplan/WorkPlanManager';
import LessonPlanManager from './components/lessonplan/LessonPlanManager';
import AttendanceManager from './components/attendance/AttendanceManager';
import LogBookManager from './components/logbook/LogBookManager';
import EvaluationManager from './components/evaluation/EvaluationManager';
import EmployerManager from './components/employers/EmployerManager';
import OjtManager from './components/ojt/OjtManager';
import PlacementManager from './components/placements/PlacementManager';
import ReportsManager from './components/reports/ReportsManager';
import CertificateManager from './components/certificates/CertificateManager';
import PublicCertificateVerify from './components/certificates/PublicCertificateVerify';
import A4LandscapeCertificateModal from './components/certificates/A4LandscapeCertificateModal';
import HolidayManager from './components/holidays/HolidayManager';
import CommunicationManager from './components/communication/CommunicationManager';
import NoticeManager from './components/notices/NoticeManager';
import SnapshotAuditManager from './components/snapshots/SnapshotAuditManager';
import SettingsManager from './components/settings/SettingsManager';
import StudentPortal from './components/portal/StudentPortal';
import EmployerPortal from './components/portal/EmployerPortal';
import { loadDB } from './services/storage';
import { useAuth } from './context/AuthContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2.5, justifyContent: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              प्रणालीमा त्रुटि देखियो (Rendering Notice)
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
              {this.state.error?.message || 'Unexpected issue'}
            </Typography>
          </Alert>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            sx={{ fontWeight: 800 }}
          >
            ड्यासबोर्डमा फर्कनुहोस् (Return to Dashboard)
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isLocked, currentUser, isStudent, isEmployer } = useAuth();

  const [currentTab, setCurrentTab] = useState(() => {
    if (currentUser?.role === 'STUDENT') return 'student_portal';
    if (currentUser?.role === 'EMPLOYER') return 'employer_portal';
    return 'dashboard';
  });

  // Switch tab when user role changes
  React.useEffect(() => {
    if (currentUser?.role === 'STUDENT') {
      setCurrentTab('student_portal');
    } else if (currentUser?.role === 'EMPLOYER') {
      setCurrentTab('employer_portal');
    }
  }, [currentUser?.role, currentUser?.id]);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [attendanceGroupId, setAttendanceGroupId] = useState(null);

  // Online QR Code Verification trigger from URL (?verify=...)
  const [verifyParam, setVerifyParam] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('verify') || null;
  });
  const [fullCertModalOpen, setFullCertModalOpen] = useState(false);

  // Lookup verification record
  const verifyData = React.useMemo(() => {
    if (!verifyParam) return null;
    const db = loadDB();
    const cert = (db.certificates || []).find(
      (c) => c.certificateNo.toLowerCase() === verifyParam.trim().toLowerCase()
    );
    if (!cert) return { certId: verifyParam, certificate: null, student: null, course: null, group: null, trainer: null };

    const student = (db.students || []).find((s) => s.id === cert.studentId);
    const group = (db.trainingGroups || []).find((g) => g.id === cert.groupId);
    const course = (db.courses || []).find((c) => c.id === (cert.courseId || group?.courseId));
    const trainer = (db.trainers || []).find((t) => t.id === group?.trainerId);

    return { certId: verifyParam, certificate: cert, student, course, group, trainer };
  }, [verifyParam]);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'occupations':
        return <OccupationManager />;
      case 'courses':
        return <CourseManager />;
      case 'trainers':
        return <TrainerManager />;
      case 'groups':
        return (
          <TrainingGroupManager
            onNavigateToAttendance={(grpId) => {
              setAttendanceGroupId(grpId);
              setCurrentTab('attendance');
            }}
          />
        );
      case 'syllabus':
        return <SyllabusManager />;
      case 'students':
        return <StudentManager />;
      case 'workplan':
        return <WorkPlanManager />;
      case 'lessonplan':
        return <LessonPlanManager />;
      case 'attendance':
        return <AttendanceManager initialGroupId={attendanceGroupId} />;
      case 'logbook':
        return <LogBookManager />;
      case 'evaluations':
        return <EvaluationManager />;
      case 'holidays':
        return <HolidayManager />;
      case 'employers':
        return <EmployerManager />;
      case 'ojt':
        return <OjtManager />;
      case 'placements':
        return <PlacementManager />;
      case 'certificates':
        return <CertificateManager />;
      case 'communication':
        return <CommunicationManager />;
      case 'notices':
        return <NoticeManager />;
      case 'snapshots':
        return <SnapshotAuditManager />;
      case 'reports':
        return <ReportsManager />;
      case 'settings':
        return <SettingsManager />;
      case 'student_portal':
        return <StudentPortal />;
      case 'employer_portal':
        return <EmployerPortal />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f7fb' }}>
      <CssBaseline />

      {/* Top Application Bar */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          onOpenPinModal={() => setPinModalOpen(true)}
        />

        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {/* Sidebar Navigation */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3, md: 4 },
              width: '100%',
              ml: { md: sidebarOpen ? '280px' : 0 },
              transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen
              }),
              pb: { xs: 12, md: 5 } // Padding for mobile bottom nav
            }}
          >
            <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}>
              <ErrorBoundary key={currentTab} onReset={() => setCurrentTab('dashboard')}>
                {renderContent()}
              </ErrorBoundary>
            </Container>
          </Box>
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenMenu={() => setSidebarOpen(true)}
      />

      {/* 4-Digit Quick PIN Modal */}
      <PinLockDialog
        open={pinModalOpen || isLocked}
        onClose={isLocked ? null : () => setPinModalOpen(false)}
      />

      {/* Online Verification Modal triggered by QR scan (?verify=...) */}
      {verifyData && (
        <>
          <PublicCertificateVerify
            open={Boolean(verifyParam)}
            onClose={() => {
              setVerifyParam(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
            certId={verifyData.certId}
            certificate={verifyData.certificate}
            student={verifyData.student}
            course={verifyData.course}
            group={verifyData.group}
            onOpenFullCertificate={() => setFullCertModalOpen(true)}
          />

          {verifyData.certificate && verifyData.student && (
            <A4LandscapeCertificateModal
              open={fullCertModalOpen}
              onClose={() => setFullCertModalOpen(false)}
              certificate={verifyData.certificate}
              student={verifyData.student}
              course={verifyData.course}
              group={verifyData.group}
              trainer={verifyData.trainer}
            />
          )}
        </>
      )}
    </Box>
  );
}
