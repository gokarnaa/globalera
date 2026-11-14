import React, { useState, Suspense, lazy } from 'react';
import {
  Box,
  CssBaseline,
  Container,
  useMediaQuery,
  useTheme,
  Alert,
  Button,
  Typography,
  Snackbar,
  CircularProgress
} from '@mui/material';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import PinLockDialog from './components/layout/PinLockDialog';

const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const OccupationManager = lazy(() => import('./components/occupations/OccupationManager'));
const CourseManager = lazy(() => import('./components/courses/CourseManager'));
const TrainerManager = lazy(() => import('./components/trainers/TrainerManager'));
const TrainingGroupManager = lazy(() => import('./components/groups/TrainingGroupManager'));
const SyllabusManager = lazy(() => import('./components/syllabus/SyllabusManager'));
const StudentManager = lazy(() => import('./components/students/StudentManager'));
const LeadManager = lazy(() => import('./components/leads/LeadManager'));
const AdmissionManager = lazy(() => import('./components/admission/AdmissionManager'));
const CourseFeeManager = lazy(() => import('./components/courses/CourseFeeManager'));
const AccountsManager = lazy(() => import('./components/accounts/AccountsManager'));
const WorkPlanManager = lazy(() => import('./components/workplan/WorkPlanManager'));
const LessonPlanManager = lazy(() => import('./components/lessonplan/LessonPlanManager'));
const AttendanceManager = lazy(() => import('./components/attendance/AttendanceManager'));
const LiveAttendanceMonitor = lazy(() => import('./components/attendance/LiveAttendanceMonitor'));
const LogBookManager = lazy(() => import('./components/logbook/LogBookManager'));
const EvaluationManager = lazy(() => import('./components/evaluation/EvaluationManager'));
const EmployerManager = lazy(() => import('./components/employers/EmployerManager'));
const OjtManager = lazy(() => import('./components/ojt/OjtManager'));
const PlacementManager = lazy(() => import('./components/placements/PlacementManager'));
const ReportsManager = lazy(() => import('./components/reports/ReportsManager'));
const CertificateManager = lazy(() => import('./components/certificates/CertificateManager'));
const CertificateStudioManager = lazy(() => import('./components/settings/CertificateStudioManager'));
const PublicCertificateVerify = lazy(() => import('./components/certificates/PublicCertificateVerify'));
const A4LandscapeCertificateModal = lazy(() => import('./components/certificates/A4LandscapeCertificateModal'));
const HolidayManager = lazy(() => import('./components/holidays/HolidayManager'));
const CommunicationManager = lazy(() => import('./components/communication/CommunicationManager'));
const NoticeManager = lazy(() => import('./components/notices/NoticeManager'));
const SnapshotAuditManager = lazy(() => import('./components/snapshots/SnapshotAuditManager'));
const SettingsManager = lazy(() => import('./components/settings/SettingsManager'));
const StudentPortal = lazy(() => import('./components/portal/StudentPortal'));
const EmployerPortal = lazy(() => import('./components/portal/EmployerPortal'));
const TrainerPortal = lazy(() => import('./components/portal/TrainerPortal'));
const AgentPortal = lazy(() => import('./components/portal/AgentPortal'));
const PublicWebsite = lazy(() => import('./components/portal/PublicWebsite'));
const UserManager = lazy(() => import('./components/users/UserManager'));
const UnifiedLoginScreen = lazy(() => import('./components/auth/UnifiedLoginScreen'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '45dvh', gap: 1.5 }}>
      <CircularProgress size={32} thickness={4} sx={{ color: '#0F2C59' }} />
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
        Loading module...
      </Typography>
    </Box>
  );
}
import { loadDB, syncWithCloud } from './services/storage';
import { playLeadChime } from './services/soundUtils';
import { verifyCertificateRemote } from './services/supabaseClient';
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
              System Rendering Notice
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5, whiteSpace: 'pre-wrap', textAlign: 'left', fontSize: '0.75rem', maxHeight: 200, overflowY: 'auto' }}>
              {this.state.error?.stack || this.state.error?.message || 'Unexpected issue'}
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
            Return to Dashboard
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
  const { isLocked, currentUser, isStudent, isEmployer, logout } = useAuth();

  // Multi-Portal Route detection supporting pathname (/trainer, /student, /ge-admin, /admin, /verify) and query (?portal=trainer, etc.)
  const getInitialRoute = () => {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal');
    const verify = params.get('verify');

    if (verify || path === '/verify') return 'verify';
    if (portal === 'agent' || path === '/agent') return 'agent';
    if (portal === 'trainer' || path === '/trainer') return 'trainer';
    if (portal === 'student' || path === '/student') return 'student';
    if (portal === 'employer' || path === '/employer') return 'employer';
    if (portal === 'admin' || path === '/admin' || path === '/ge-admin' || path === '/office' || path === '/mgmt') return 'admin';
    return 'home'; // default is official website!
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);

  const navigateTo = (route, updateUrl = true) => {
    setCurrentRoute(route);
    if (updateUrl) {
      const pathMap = {
        home: '/',
        agent: '/agent',
        trainer: '/trainer',
        student: '/student',
        employer: '/employer',
        admin: '/ge-admin',
        verify: '/verify'
      };
      const newPath = pathMap[route] || '/';
      window.history.pushState({}, '', newPath);
    }
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam;
    } catch (_) {}
    if (currentUser?.role === 'TRAINER') return 'trainer_portal';
    if (currentUser?.role === 'STUDENT') return 'student_portal';
    if (currentUser?.role === 'EMPLOYER') return 'employer_portal';
    return 'dashboard';
  });

  // Switch tab when user role changes
  React.useEffect(() => {
    if (currentUser?.role === 'TRAINER') {
      setCurrentTab('trainer_portal');
    } else if (currentUser?.role === 'STUDENT') {
      setCurrentTab('student_portal');
    } else if (currentUser?.role === 'EMPLOYER') {
      setCurrentTab('employer_portal');
    }
  }, [currentUser?.role, currentUser?.id]);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Keep sidebar state in sync with device screen size changes (e.g. mobile toggle mode)
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [attendanceGroupId, setAttendanceGroupId] = useState(null);
  const [pendingAdmissionLead, setPendingAdmissionLead] = useState(null);

  // Online QR Code Verification trigger from URL (?verify=...)
  const [verifyParam, setVerifyParam] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('verify') || null;
  });
  const [fullCertModalOpen, setFullCertModalOpen] = useState(false);
  const [remoteVerifyData, setRemoteVerifyData] = useState(null);

  React.useEffect(() => {
    if (!verifyParam) return;
    let isMounted = true;
    verifyCertificateRemote(verifyParam).then((res) => {
      if (isMounted && res?.found) {
        setRemoteVerifyData(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [verifyParam]);

  // Lookup verification record (Cloud-first, Local-fallback)
  const verifyData = React.useMemo(() => {
    if (!verifyParam) return null;

    if (remoteVerifyData?.certificate) {
      return {
        certId: verifyParam,
        certificate: remoteVerifyData.certificate,
        student: remoteVerifyData.student,
        course: remoteVerifyData.course,
        group: remoteVerifyData.group,
        trainer: remoteVerifyData.group?.trainer || null,
        isCloudVerified: true
      };
    }

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
  }, [verifyParam, remoteVerifyData]);

  const [globalLeadAlert, setGlobalLeadAlert] = useState(null);

  // Auto-sync with Supabase on app mount
  React.useEffect(() => {
    syncWithCloud();
  }, []);

  // Global Real-time Lead Listener across all tabs and routes
  React.useEffect(() => {
    let lastLeadCount = (loadDB().leads || []).length;

    const checkIncomingLeads = () => {
      const freshDb = loadDB();
      const currentLeads = freshDb.leads || [];

      if (currentLeads.length > lastLeadCount) {
        const latest = currentLeads[0];
        playLeadChime();
        setGlobalLeadAlert(latest);
      }
      lastLeadCount = currentLeads.length;
    };

    window.addEventListener('kite_db_updated', checkIncomingLeads);
    window.addEventListener('storage', checkIncomingLeads);
    const poller = setInterval(checkIncomingLeads, 4000);

    return () => {
      window.removeEventListener('kite_db_updated', checkIncomingLeads);
      window.removeEventListener('storage', checkIncomingLeads);
      clearInterval(poller);
    };
  }, []);

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
      case 'leads':
        return (
          <LeadManager
            onNavigateToAdmission={(lead) => {
              setPendingAdmissionLead(lead);
              setCurrentTab('admission');
            }}
          />
        );
      case 'admission':
        return (
          <AdmissionManager
            pendingLead={pendingAdmissionLead}
            onClearPendingLead={() => setPendingAdmissionLead(null)}
          />
        );
      case 'students':
        return <StudentManager />;
      case 'fees':
      case 'accounts':
        return <AccountsManager initialTab={0} />;
      case 'course_fees':
        return <CourseFeeManager />;
      case 'workplan':
        return <WorkPlanManager />;
      case 'lessonplan':
        return <LessonPlanManager />;
      case 'live_attendance':
        return <LiveAttendanceMonitor onNavigate={setCurrentTab} />;
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
      case 'certificate_studio':
        return <CertificateStudioManager />;
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
      case 'trainer_portal':
        return <TrainerPortal />;
      case 'employer_portal':
        return <EmployerPortal />;
      case 'users':
        return <UserManager />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  // 1. PUBLIC WEBSITE ROUTE (HOME & VERIFY)
  if (currentRoute === 'home' || currentRoute === 'verify') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
        <CssBaseline />
        <ErrorBoundary onReset={() => window.location.reload()}>
          <Suspense fallback={<PageLoader />}>
            <PublicWebsite
              onNavigate={navigateTo}
              onVerifyCertificate={(certId) => {
                setVerifyParam(certId);
              }}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Online Verification Modal triggered by QR scan (?verify=...) or direct verify */}
        {verifyData && (
          <Suspense fallback={null}>
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
              isCloudVerified={verifyData.isCloudVerified}
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
          </Suspense>
        )}
      </Box>
    );
  }

  const handleLoginSuccessNavigate = (loggedUser) => {
    if (!loggedUser) return;
    if (loggedUser.role === 'AGENT') navigateTo('agent');
    else if (loggedUser.role === 'TRAINER') navigateTo('trainer');
    else if (loggedUser.role === 'STUDENT') navigateTo('student');
    else if (loggedUser.role === 'ADMIN' || loggedUser.role === 'STAFF') navigateTo('admin');
  };

  // 2. DEDICATED AGENT / REFERRAL PORTAL ROUTE (/agent)
  if (currentRoute === 'agent') {
    if (!currentUser || currentUser?.role !== 'AGENT') {
      return (
        <Box sx={{ minHeight: '100dvh', bgcolor: '#431407' }}>
          <CssBaseline />
          <Suspense fallback={<PageLoader />}>
            <UnifiedLoginScreen
              initialMode="agent"
              allowedModes={['agent', 'trainer', 'student']}
              onLoginSuccess={handleLoginSuccessNavigate}
              onBackHome={() => navigateTo('home')}
            />
          </Suspense>
        </Box>
      );
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <AgentPortal
          onLogout={() => { logout(); navigateTo('home'); }}
          onGoHome={() => navigateTo('home')}
        />
      </Suspense>
    );
  }

  // 3. DEDICATED TRAINER PORTAL ROUTE (/trainer)
  if (currentRoute === 'trainer') {
    if (!currentUser || currentUser?.role !== 'TRAINER') {
      return (
        <Box sx={{ minHeight: '100dvh', bgcolor: '#064E3B' }}>
          <CssBaseline />
          <Suspense fallback={<PageLoader />}>
            <UnifiedLoginScreen
              initialMode="trainer"
              allowedModes={['trainer', 'student']}
              onLoginSuccess={handleLoginSuccessNavigate}
              onBackHome={() => navigateTo('home')}
            />
          </Suspense>
        </Box>
      );
    }
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: '#F4F7FB', p: { xs: 1, sm: 3 }, overflowX: 'clip' }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <Suspense fallback={<PageLoader />}>
            <TrainerPortal onLogout={() => { logout(); navigateTo('home'); }} />
          </Suspense>
        </Box>
      </Box>
    );
  }

  // 3. DEDICATED STUDENT PORTAL ROUTE (/student)
  if (currentRoute === 'student') {
    if (!currentUser || currentUser?.role !== 'STUDENT') {
      return (
        <Box sx={{ minHeight: '100dvh', bgcolor: '#1E3A8A' }}>
          <CssBaseline />
          <Suspense fallback={<PageLoader />}>
            <UnifiedLoginScreen
              initialMode="student"
              allowedModes={['student', 'trainer']}
              onLoginSuccess={handleLoginSuccessNavigate}
              onBackHome={() => navigateTo('home')}
            />
          </Suspense>
        </Box>
      );
    }
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: '#F4F7FB', p: { xs: 1, sm: 3 }, overflowX: 'clip' }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <Suspense fallback={<PageLoader />}>
            <StudentPortal onLogout={() => { logout(); navigateTo('home'); }} />
          </Suspense>
        </Box>
      </Box>
    );
  }

  // 3.1 DEDICATED EMPLOYER PORTAL ROUTE (/employer)
  if (currentRoute === 'employer') {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: '#F4F7FB', p: { xs: 1, sm: 3 }, overflowX: 'clip' }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <Suspense fallback={<PageLoader />}>
            <EmployerPortal
              onLogout={() => { logout(); navigateTo('home'); }}
              onGoHome={() => navigateTo('home')}
            />
          </Suspense>
        </Box>
      </Box>
    );
  }

  // 4. ADMIN & MANAGEMENT ROUTE (/ge-admin or /admin)
  if (!currentUser) {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: '#0F2E5A' }}>
        <CssBaseline />
        <Suspense fallback={<PageLoader />}>
          <UnifiedLoginScreen
            initialMode="admin"
            allowedModes={['admin']}
            onLoginSuccess={handleLoginSuccessNavigate}
            onBackHome={() => navigateTo('home')}
          />
        </Suspense>
      </Box>
    );
  }

  // Role Enforcement: If logged in user is an Employer, lock to Employer Portal
  if (currentUser?.role === 'EMPLOYER') {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: '#F4F7FB', p: { xs: 1, sm: 3 }, overflowX: 'clip' }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <Suspense fallback={<PageLoader />}>
            <EmployerPortal
              onLogout={() => { logout(); navigateTo('home'); }}
              onGoHome={() => navigateTo('home')}
            />
          </Suspense>
        </Box>
      </Box>
    );
  }

  // Role Enforcement: If logged in user is a Trainer, lock to Trainer Portal
  if (currentUser?.role === 'TRAINER') {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: '#F4F7FB', p: { xs: 1, sm: 3 }, overflowX: 'clip' }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <Suspense fallback={<PageLoader />}>
            <TrainerPortal onLogout={() => { logout(); navigateTo('home'); }} />
          </Suspense>
        </Box>
      </Box>
    );
  }

  // Role Enforcement: If logged in user is a Student, lock to Student Portal
  if (currentUser?.role === 'STUDENT') {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: '#F4F7FB', p: { xs: 1, sm: 3 }, overflowX: 'clip' }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <Suspense fallback={<PageLoader />}>
            <StudentPortal onLogout={() => { logout(); navigateTo('home'); }} />
          </Suspense>
        </Box>
      </Box>
    );
  }

  // Role Enforcement: If logged in user is an Agent, lock to Agent Portal
  if (currentUser?.role === 'AGENT') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AgentPortal
          onLogout={() => { logout(); navigateTo('home'); }}
          onGoHome={() => navigateTo('home')}
        />
      </Suspense>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: '#F4F7FB' }}>
      <CssBaseline />

      {/* Top Application Bar */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          onOpenPinModal={() => setPinModalOpen(true)}
          onGoHome={() => navigateTo('home')}
          onSelectTab={handleSelectTab}
        />

        <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative', overflowX: 'clip' }}>
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
              minWidth: 0,
              overflowX: 'clip',
              p: { xs: 1, sm: 2.5, md: 3 },
              minHeight: 'calc(100dvh - 70px)',
              position: 'relative',
              zIndex: 1,
              pb: { xs: 'calc(84px + env(safe-area-inset-bottom))', md: 5 }
            }}
          >
            <Box sx={{ width: '100%', maxWidth: '1520px', mx: 'auto', px: { xs: 0, sm: 1 } }}>
              <ErrorBoundary key={currentTab} onReset={() => setCurrentTab('dashboard')}>
                <Suspense fallback={<PageLoader />}>
                  {renderContent()}
                </Suspense>
              </ErrorBoundary>
            </Box>
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
        <Suspense fallback={null}>
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
            isCloudVerified={verifyData.isCloudVerified}
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
        </Suspense>
      )}

      {/* Global Real-Time Incoming Lead Alert */}
      {globalLeadAlert && (
        <Snackbar
          open={Boolean(globalLeadAlert)}
          autoHideDuration={8000}
          onClose={() => setGlobalLeadAlert(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setGlobalLeadAlert(null)}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setCurrentTab('leads');
                  setGlobalLeadAlert(null);
                }}
                sx={{
                  fontWeight: 900,
                  bgcolor: 'rgba(255,255,255,0.25)',
                  px: 1.5,
                  borderRadius: 1.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' }
                }}
              >
                View Lead
              </Button>
            }
            sx={{
              fontWeight: 800,
              fontSize: '0.88rem',
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              alignItems: 'center'
            }}
          >
            🔔 New Lead Received! {globalLeadAlert.name} ({globalLeadAlert.course || globalLeadAlert.subject || 'Course'})
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
