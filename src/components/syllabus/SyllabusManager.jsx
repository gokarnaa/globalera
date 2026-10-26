import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Grid,
  Alert,
  LinearProgress,
  Paper,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Avatar,
  InputAdornment,
  Collapse
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SchoolIcon from '@mui/icons-material/School';
import ShieldIcon from '@mui/icons-material/Shield';
import BoltIcon from '@mui/icons-material/Bolt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import confetti from 'canvas-confetti';
import { loadDB, saveDB, logAudit } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';

// Standard CTEVT 390-Hours Curriculum Presets
const CTEVT_PRESETS = [
  {
    key: 'caregiver',
    title: 'Caregiver (हेरचाह कार्यकर्ता) – ३९० घण्टा',
    description: 'CTEVT मान्यता प्राप्त ३ महिने केयरगिभर पाठ्यक्रम (८०% प्रयोगात्मक, १० एकाइहरू)',
    targetHours: 390,
    units: [
      { unitNo: 1, title: 'Orientation, Professional Ethics & Safety Measures', theoryHours: 10, practicalHours: 20, learningOutcome: 'Understand institutional norms, personal safety, legal ethics and bio-hazard protocols.', toolsAndMaterials: 'Projector, Whiteboard, PPE Kit, Safety Guidelines' },
      { unitNo: 2, title: 'Fundamental Patient Care, Hygiene & Infection Control', theoryHours: 10, practicalHours: 40, learningOutcome: 'Master sponge bathing, bed making, oral hygiene, and sterile hand washing.', toolsAndMaterials: 'Hospital Bed, Linens, Basin, Sterile Gloves, Antiseptic' },
      { unitNo: 3, title: 'Vital Signs Monitoring & Health Assessment', theoryHours: 8, practicalHours: 32, learningOutcome: 'Accurately measure Blood Pressure, Radial Pulse, Temperature and SpO2 levels.', toolsAndMaterials: 'Sphygmomanometer, Stethoscope, Digital Thermometer, Pulse Oximeter' },
      { unitNo: 4, title: 'Nutrition, Therapeutic Diets & Meal Assistance', theoryHours: 10, practicalHours: 30, learningOutcome: 'Prepare diabetic/renal soft meals and assist dysphagia patients safely.', toolsAndMaterials: 'Feeding Tray, Pureed Meal Sets, Measuring Cup, Apron' },
      { unitNo: 5, title: 'Patient Mobility, Transfers & Assistive Devices', theoryHours: 6, practicalHours: 34, learningOutcome: 'Safely transfer patients bed-to-wheelchair, use walkers and crutches.', toolsAndMaterials: 'Wheelchair, Walking Frame, Transfer Belt, Crutches' },
      { unitNo: 6, title: 'Emergency First Aid, Wound Care & Adult CPR', theoryHours: 8, practicalHours: 32, learningOutcome: 'Perform high-quality CPR, manage choking (Heimlich), burns and bleeding.', toolsAndMaterials: 'CPR Resusci Anne Mannequin, First Aid Box, Crepe Bandages' },
      { unitNo: 7, title: 'Geriatric Care & Dementia Support', theoryHours: 10, practicalHours: 40, learningOutcome: 'Support Alzheimer/Dementia patients with patience, memory cues and sensory care.', toolsAndMaterials: 'Sensory Therapy Kit, Orientation Clock, Flashcards' },
      { unitNo: 8, title: 'Medication Administration & Daily Log Book', theoryHours: 8, practicalHours: 22, learningOutcome: 'Administer oral medications following 5-Rights and maintain clinical records.', toolsAndMaterials: 'Pill Organizer, Medication Chart, Prescription Samples' },
      { unitNo: 9, title: 'Palliative, End-of-Life & Bedridden Care', theoryHours: 6, practicalHours: 34, learningOutcome: 'Prevent bedsore (pressure ulcers), reposition every 2 hours, and dignity care.', toolsAndMaterials: 'Air Mattress, Position Wedges, Barrier Creams' },
      { unitNo: 10, title: 'Clinical Demonstration & OJT Internship Preparation', theoryHours: 4, practicalHours: 26, learningOutcome: 'Hospital & Care Home etiquette, client communication, and final skill exam.', toolsAndMaterials: 'Log Book, Uniform, Skill Rubric Sheet' }
    ]
  },
  {
    key: 'beautician',
    title: 'Beautician & Skin Care (सौन्दर्यकर्मी) – ३९० घण्टा',
    description: 'CTEVT लेभल-१ ब्यूटीशियन पाठ्यक्रम (८०% प्रयोगात्मक, ८ एकाइहरू)',
    targetHours: 390,
    units: [
      { unitNo: 1, title: 'Introduction to Beauty Culture, Sanitation & Hygiene', theoryHours: 12, practicalHours: 18, learningOutcome: 'Sterilization of salon tools, client consultation and safety standards.', toolsAndMaterials: 'Sterilizer, Sanitizer, Apron, Towels' },
      { unitNo: 2, title: 'Skin Anatomy, Facial Treatments & Clean-up', theoryHours: 10, practicalHours: 50, learningOutcome: 'Perform galvanic facial, ultrasonic scrubbing, fruit clean-up and skin analysis.', toolsAndMaterials: 'Facial Bed, Steamer, Scrub, Facial Creams, Pack' },
      { unitNo: 3, title: 'Hair Cutting, Styling & Thermal Setting', theoryHours: 12, practicalHours: 58, learningOutcome: 'Execute basic layers, feather cut, blow-dry styling and tong curls.', toolsAndMaterials: 'Hair Shears, Blow Dryer, Curling Iron, Section Clips' },
      { unitNo: 4, title: 'Hair Chemical Treatments (Rebonding & Smoothening)', theoryHours: 10, practicalHours: 50, learningOutcome: 'Apply rebonding cream, neutralizer, straightening iron safely.', toolsAndMaterials: 'Ceramic Straightener, Chemical Bowls, Tint Brushes, Gloves' },
      { unitNo: 5, title: 'Professional Makeup (Day, Evening & Bridal HD)', theoryHours: 10, practicalHours: 50, learningOutcome: 'Base correction, contouring, eye makeup, false lashes and bridal draping.', toolsAndMaterials: 'Professional Makeup Palette, Brush Set, HD Foundations' },
      { unitNo: 6, title: 'Manicure, Pedicure & Nail Art Techniques', theoryHours: 6, practicalHours: 34, learningOutcome: 'Nail shaping, cuticle treatment, hand/foot massage and gel polish application.', toolsAndMaterials: 'Pedicure Tub, Cuticle Nipper, UV Nail Lamp, Gel Polish' },
      { unitNo: 7, title: 'Hair Removal (Waxing & Threading)', theoryHours: 6, practicalHours: 34, learningOutcome: 'Eyebrow shaping, upper lip threading, and warm/cold wax application.', toolsAndMaterials: 'Cotton Thread, Wax Heater, Wax Strips, Soothing Lotion' },
      { unitNo: 8, title: 'Salon Management, Client Care & Entrepreneurship', theoryHours: 12, practicalHours: 18, learningOutcome: 'Billing, appointment scheduling, inventory management and business setup.', toolsAndMaterials: 'Cash Book, Menu Cards, Client Records' }
    ]
  },
  {
    key: 'electrician',
    title: 'Building Electrician (भवन विद्युतीकरण) – ३९० घण्टा',
    description: 'CTEVT राष्ट्रिय सीप मानक भवन वायरिङ पाठ्यक्रम (८०% प्रयोगात्मक, ८ एकाइहरू)',
    targetHours: 390,
    units: [
      { unitNo: 1, title: 'Electrical Safety, Tools & Basic Concepts', theoryHours: 12, practicalHours: 20, learningOutcome: 'Understand Ohm’s Law, earthing, electrical hazards and PPE usage.', toolsAndMaterials: 'Insulated Pliers, Multimeter, Screwdriver Set, Safety Helmet' },
      { unitNo: 2, title: 'Conduit Piping & Domestic Surface Wiring', theoryHours: 10, practicalHours: 50, learningOutcome: 'Install PVC conduit pipes, junction boxes and 2-way switch control.', toolsAndMaterials: 'PVC Pipes, Bending Spring, Chisel, Hammer, Switches' },
      { unitNo: 3, title: 'Distribution Board (DB), MCB & RCCB Installation', theoryHours: 10, practicalHours: 50, learningOutcome: 'Wire Main Switch, MCB, RCCB/ELCB, and load balancing.', toolsAndMaterials: 'DB Box, Single/Double Pole MCB, RCCB, Bus Bar' },
      { unitNo: 4, title: 'Earthing Systems (Pipe & Plate Earthing)', theoryHours: 8, practicalHours: 42, learningOutcome: 'Excavate pit, install GI/Copper pipe, salt-charcoal earthing layer.', toolsAndMaterials: 'GI Pipe, Copper Strip, Earth Tester, Charcoal, Salt' },
      { unitNo: 5, title: 'Lighting Fixtures, Inverter & UPS Integration', theoryHours: 10, practicalHours: 45, learningOutcome: 'Install LED panels, fans, chandeliers, and inverter backup wiring.', toolsAndMaterials: 'Inverter, Battery, Ceiling Fan, LED Downlights' },
      { unitNo: 6, title: 'Motor & Water Pump Control Wiring', theoryHours: 8, practicalHours: 40, learningOutcome: 'Connect single-phase induction motor with automatic water level controller.', toolsAndMaterials: 'Water Pump Motor, Float Switch, Starter, Contactors' },
      { unitNo: 7, title: 'Troubleshooting, Short Circuit & Insulation Testing', theoryHours: 10, practicalHours: 40, learningOutcome: 'Use Megger for insulation test, detect earth leakage and phase neutral reverse.', toolsAndMaterials: 'Megger (Insulation Tester), Test Lamp, Continuity Tester' },
      { unitNo: 8, title: 'Cost Estimation, Single Line Diagram (SLD) & Rules', theoryHours: 10, practicalHours: 25, learningOutcome: 'Read architectural electrical plans, estimate cables and billing.', toolsAndMaterials: 'Blueprints, Estimation Sheet, NEA Wiring Regulations' }
    ]
  }
];

export default function SyllabusManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer, isAdmin } = useAuth();

  const [selectedCourseId, setSelectedCourseId] = useState(db.courses?.[0]?.id || '');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'timeline' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'HIGH_PRACTICAL' | 'THEORY' | 'HAS_TOOLS'

  // Dialog States
  const [openSingleDialog, setOpenSingleDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [openPresetDialog, setOpenPresetDialog] = useState(false);

  // Single Unit Form
  const [formData, setFormData] = useState({
    courseId: selectedCourseId,
    unitNo: 1,
    title: '',
    theoryHours: 10,
    practicalHours: 30,
    learningOutcome: '',
    toolsAndMaterials: '',
    keyTasks: ''
  });

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState('append'); // 'append' | 'replace'
  const [bulkError, setBulkError] = useState('');

  const selectedCourse = db.courses?.find((c) => c.id === selectedCourseId);
  const courseSyllabi = useMemo(() => {
    return (db.syllabi || [])
      .filter((s) => s.courseId === selectedCourseId)
      .sort((a, b) => Number(a.unitNo) - Number(b.unitNo));
  }, [db.syllabi, selectedCourseId]);

  // Filtered List based on Search and Filter Pills
  const filteredSyllabi = useMemo(() => {
    return courseSyllabi.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.title.toLowerCase().includes(q) ||
        (u.learningOutcome || '').toLowerCase().includes(q) ||
        (u.toolsAndMaterials || '').toLowerCase().includes(q) ||
        `unit ${u.unitNo}`.includes(q);

      let matchesFilter = true;
      if (filterType === 'HIGH_PRACTICAL') matchesFilter = (Number(u.practicalHours) || 0) >= 30;
      else if (filterType === 'THEORY') matchesFilter = (Number(u.theoryHours) || 0) >= 10;
      else if (filterType === 'HAS_TOOLS') matchesFilter = Boolean(u.toolsAndMaterials?.trim());

      return matchesSearch && matchesFilter;
    });
  }, [courseSyllabi, searchQuery, filterType]);

  // Statistics & Hours Allocation
  const totalTheoryHours = courseSyllabi.reduce((sum, s) => sum + (Number(s.theoryHours) || 0), 0);
  const totalPracticalHours = courseSyllabi.reduce((sum, s) => sum + (Number(s.practicalHours) || 0), 0);
  const totalSyllabusHours = totalTheoryHours + totalPracticalHours;
  const courseTargetHours = selectedCourse?.totalHours || 390;
  const hoursPercentage = Math.min(100, Math.round((totalSyllabusHours / courseTargetHours) * 100));
  const remainingHours = Math.max(0, courseTargetHours - totalSyllabusHours);

  const practicalRatio = totalSyllabusHours > 0 ? Math.round((totalPracticalHours / totalSyllabusHours) * 100) : 80;
  const theoryRatio = 100 - practicalRatio;
  const isCtevtBalanced = practicalRatio >= 75 && practicalRatio <= 85;

  // Single Add / Edit Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      courseId: selectedCourseId,
      unitNo: courseSyllabi.length + 1,
      title: '',
      theoryHours: '',
      practicalHours: '',
      learningOutcome: '',
      toolsAndMaterials: '',
      keyTasks: ''
    });
    setOpenSingleDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ...item,
      theoryHours: item.theoryHours || 0,
      practicalHours: item.practicalHours || 0,
      toolsAndMaterials: item.toolsAndMaterials || '',
      keyTasks: item.keyTasks || ''
    });
    setOpenSingleDialog(true);
  };

  const handleSaveSingle = () => {
    if (!formData.title.trim()) {
      alert('पाठ्यक्रम एकाइको शीर्षक आवश्यक छ (Syllabus unit title is required).');
      return;
    }

    const calcTotal = (Number(formData.theoryHours) || 0) + (Number(formData.practicalHours) || 0);
    const payload = {
      ...formData,
      totalHours: calcTotal
    };

    let updatedList = [...(db.syllabi || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...payload } : x
      );
    } else {
      const newId = `SYL-${Date.now().toString().slice(-4)}`;
      updatedList.push({ id: newId, ...payload });
    }

    let nextDb = { ...db, syllabi: updatedList };
    nextDb = logAudit(
      nextDb,
      editingItem ? 'UPDATE' : 'CREATE',
      'Syllabus',
      editingItem?.id || 'NEW',
      `Syllabus Unit ${formData.unitNo} (${formData.title}) updated for ${selectedCourse?.title}`,
      currentUser?.name || 'Admin'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenSingleDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('के तपाईं निश्चित हुनुहुन्छ? यो पाठ्यक्रम एकाइ मेटिनेछ।')) {
      const deletedItem = (db.syllabi || []).find((x) => x.id === id);
      let updatedList = (db.syllabi || []).filter((x) => x.id !== id);
      let nextDb = { ...db, syllabi: updatedList };
      nextDb = logAudit(
        nextDb,
        'DELETE',
        'Syllabus',
        id,
        `Syllabus unit (${deletedItem?.title || id}) deleted from ${selectedCourse?.title}`,
        currentUser?.name || 'Admin'
      );
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // Reorder Units (Move Up / Down)
  const handleMoveUnit = (unitId, direction) => {
    const list = [...courseSyllabi];
    const index = list.findIndex((u) => u.id === unitId);
    if (index < 0) return;

    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    } else {
      return;
    }

    // Re-index unit numbers cleanly
    const reindexedList = list.map((item, idx) => ({
      ...item,
      unitNo: idx + 1
    }));

    const otherSyllabi = (db.syllabi || []).filter((s) => s.courseId !== selectedCourseId);
    const updatedSyllabi = [...otherSyllabi, ...reindexedList];

    const nextDb = { ...db, syllabi: updatedSyllabi };
    saveDB(nextDb);
    setDb(nextDb);
  };

  // 1-Click Load CTEVT Preset Handler
  const handleApplyPreset = (preset) => {
    if (!window.confirm(`के तपाईं "${preset.title}" का ${preset.units.length} वटा आधिकारिक एकाइहरू लोड गर्न चाहनुहुन्छ?`)) {
      return;
    }

    // Replace current course syllabi with preset
    const otherSyllabi = (db.syllabi || []).filter((s) => s.courseId !== selectedCourseId);
    const newUnits = preset.units.map((u, i) => ({
      id: `SYL-${Date.now()}-${i}`,
      courseId: selectedCourseId,
      unitNo: u.unitNo,
      title: u.title,
      theoryHours: u.theoryHours,
      practicalHours: u.practicalHours,
      totalHours: u.theoryHours + u.practicalHours,
      learningOutcome: u.learningOutcome,
      toolsAndMaterials: u.toolsAndMaterials
    }));

    const nextDb = {
      ...db,
      syllabi: [...otherSyllabi, ...newUnits]
    };

    saveDB(nextDb);
    setDb(nextDb);
    setOpenPresetDialog(false);

    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // Bulk CSV Import logic
  const parsedBulkUnits = useMemo(() => {
    if (!bulkText.trim()) return [];
    const lines = bulkText.trim().split('\n');
    const results = [];

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) return;
      if (
        index === 0 &&
        (line.toLowerCase().includes('unit no') ||
          line.toLowerCase().includes('unit title') ||
          line.toLowerCase().includes('title'))
      ) {
        return;
      }
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        const unitNo = Number(parts[0]) || results.length + 1;
        const title = parts[1] || '';
        const theoryHours = Number(parts[2]) || 0;
        const practicalHours = Number(parts[3]) || 0;
        const learningOutcome = parts[4] || '';
        const toolsAndMaterials = parts[5] || '';
        if (title) {
          results.push({
            unitNo,
            title,
            theoryHours,
            practicalHours,
            totalHours: theoryHours + practicalHours,
            learningOutcome,
            toolsAndMaterials
          });
        }
      }
    });
    return results;
  }, [bulkText]);

  const handleDownloadSampleCSV = () => {
    const sampleData = `Unit No,Unit Title,Theory Hours,Practical Hours,Learning Outcomes,Tools & Materials
1,Orientation & TVET Concepts,4,6,Understand institutional norms and safety protocols,Projector, Whiteboard, Notebook
2,Fundamental Patient Care & Hygiene,10,30,Master bed making and infection control,Hospital Bed, Linens, Basin, Gloves, Towels
3,Vital Signs Monitoring,8,22,Measure and record Blood Pressure and Pulse,Sphygmomanometer, Stethoscope, Digital Thermometer
4,Nutrition & Meal Assistance,6,24,Prepare special diets and assist feeding,Feeding Tray, Pureed Diet, Measuring Cup
5,Emergency First Aid & CPR,8,22,Perform Adult CPR and manage choking,CPR Mannequin, First Aid Kit, Bandages`;

    const blob = new Blob(['\uFEFF' + sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sample_CTEVT_Syllabus_Template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') setBulkText(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = () => {
    if (parsedBulkUnits.length === 0) {
      setBulkError('कुनै मान्य एकाइ भेटिएन (No valid units found). Format जाँच गर्नुहोस्।');
      return;
    }

    let currentList = [...(db.syllabi || [])];
    if (bulkMode === 'replace') {
      currentList = currentList.filter((x) => x.courseId !== selectedCourseId);
    }

    const startIdx = bulkMode === 'append' ? currentList.filter((x) => x.courseId === selectedCourseId).length : 0;
    const newEntries = parsedBulkUnits.map((u, i) => ({
      id: `SYL-${Date.now()}-${i}`,
      courseId: selectedCourseId,
      unitNo: u.unitNo || startIdx + i + 1,
      title: u.title,
      theoryHours: u.theoryHours,
      practicalHours: u.practicalHours,
      totalHours: u.totalHours,
      learningOutcome: u.learningOutcome,
      toolsAndMaterials: u.toolsAndMaterials
    }));

    const nextDb = { ...db, syllabi: [...currentList, ...newEntries] };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenBulkDialog(false);
    setBulkText('');
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // WhatsApp Share Text
  const generateWhatsAppShareText = () => {
    if (!selectedCourse) return '';
    let msg = `*ग्लोबल एरा प्राविधिक स्कुल (Global Era Technical School)*\n`;
    msg += `📚 *पाठ्यक्रम रूपरेखा (Curriculum Outline)*: ${selectedCourse.title}\n`;
    msg += `⏱ *कुल तालिम अवधि*: ${courseTargetHours} घण्टा (Practical: ${totalPracticalHours} hrs [${practicalRatio}%], Theory: ${totalTheoryHours} hrs [${theoryRatio}%])\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*मुख्य पाठ्यक्रम एकाइहरू (Curriculum Units)*:\n`;
    courseSyllabi.forEach((u) => {
      msg += `🔹 *Unit ${u.unitNo}:* ${u.title} (${u.totalHours} hrs - Practical: ${u.practicalHours}h, Theory: ${u.theoryHours}h)\n`;
    });
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 *ठेगाना*: मित्रपार्क, काठमाडौँ | 📞 *सम्पर्क*: ९८५१००००००\n`;
    msg += `🌐 *CTEVT मान्यता प्राप्त प्राविधिक तालिम*`;
    return msg;
  };

  const handleShareWhatsApp = () => {
    const url = getWhatsAppUrl('', generateWhatsAppShareText());
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* =======================================================
          1. ULTRA-MODERN HERO CURRICULUM STUDIO HEADER
          ======================================================= */}
      <Card
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #071933 0%, #0F2C59 60%, #1A56B0 100%)',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 16px 40px -10px rgba(7, 25, 51, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left Hero Overview */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#FDE047 !important' }} />}
                label="CTEVT Level 1 & NVQF Standards"
                size="small"
                sx={{
                  bgcolor: 'rgba(254, 240, 138, 0.15)',
                  color: '#FEF08A',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(254, 240, 138, 0.3)'
                }}
              />
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#4ADE80 !important' }} />}
                label="८०% प्रयोगात्मक अनिवार्य"
                size="small"
                sx={{
                  bgcolor: 'rgba(74, 222, 128, 0.15)',
                  color: '#86EFAC',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(74, 222, 128, 0.25)'
                }}
              />
              <Chip
                label={`${courseSyllabi.length} Units Active`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#FFFFFF',
                fontSize: { xs: '1.45rem', sm: '1.9rem', md: '2.1rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                mb: 1
              }}
            >
              Curriculum &amp; Syllabus Studio
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', maxWidth: 640, mb: 2.5, lineHeight: 1.6 }}>
              {selectedCourse?.title} का लागि एकाइगत सीप, सैद्धान्तिक र प्रयोगात्मक घण्टाको प्रत्यक्ष व्यवस्थापन गर्नुहोस्।
              CTEVT मापदण्ड अनुसार ८०% सीप तालिम सुनिश्चित गरिन्छ।
            </Typography>

            {/* Top Quick Actions */}
            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
                sx={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  py: 1,
                  px: 2,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%) !important'
                  }
                }}
              >
                + Add Unit (एकाइ थप्नुहोस्)
              </Button>

              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon sx={{ color: '#FDE047' }} />}
                onClick={() => setOpenPresetDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  py: 1,
                  px: 2,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                1-Click CTEVT Presets
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
                onClick={() => setOpenBulkDialog(true)}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.4) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  py: 1,
                  px: 1.8,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' }
                }}
              >
                CSV Import
              </Button>

              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => setOpenDocDialog(true)}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.4) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  py: 1,
                  px: 1.8,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' }
                }}
              >
                Print PDF
              </Button>

              <IconButton
                onClick={handleShareWhatsApp}
                title="Share Curriculum on WhatsApp"
                sx={{
                  bgcolor: '#25D366',
                  color: '#FFFFFF',
                  p: 1.1,
                  borderRadius: 2.5,
                  '&:hover': { bgcolor: '#1EBE5D' }
                }}
              >
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>

          {/* Right Live Hours Target Balancer Widget */}
          <Grid item xs={12} lg={5}>
            <Box
              sx={{
                bgcolor: 'rgba(15, 30, 60, 0.75)',
                backdropFilter: 'blur(16px)',
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3.5,
                border: '1.5px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="overline" sx={{ color: '#93C5FD', fontWeight: 900, letterSpacing: '0.08em' }}>
                  ⚡ LIVE HOURS BALANCER
                </Typography>
                <Chip
                  size="small"
                  label={isCtevtBalanced ? '✓ CTEVT 80:20 Compliant' : '⚠️ Adjust Ratio'}
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    bgcolor: isCtevtBalanced ? '#10B981' : '#F59E0B',
                    color: '#FFFFFF'
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {totalSyllabusHours}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                  / {courseTargetHours} Hours ({hoursPercentage}%)
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={hoursPercentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  mb: 1.5,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: hoursPercentage === 100 ? '#10B981' : '#3B82F6',
                    borderRadius: 5
                  }
                }}
              />

              {/* Status Note */}
              {remainingHours > 0 ? (
                <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 700, display: 'block', mb: 2 }}>
                  ⏳ पाठ्यक्रम पूरा हुन अझै <b>{remainingHours} घण्टा</b> थप्न बाँकी छ।
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 700, display: 'block', mb: 2 }}>
                  🎉 कुल तालिम अवधि ३९० घण्टा पूर्ण रूपमा विनियोजन भइसकेको छ।
                </Typography>
              )}

              {/* Micro Ratio Metrics */}
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', p: 1.2, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 800, display: 'block' }}>
                      PRACTICAL (सीप)
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {totalPracticalHours} hrs ({practicalRatio}%)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', p: 1.2, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 800, display: 'block' }}>
                      THEORY (सैद्धान्तिक)
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {totalTheoryHours} hrs ({theoryRatio}%)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* =======================================================
          2. COURSE SELECTOR, SEARCH BAR & 3-WAY VIEW SWITCHER
          ======================================================= */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          bgcolor: '#FFFFFF'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Select Course */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              size="small"
              label="पाठ्यक्रम चयन (Select Course)"
              fullWidth
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              {(db.courses || []).map((crs) => (
                <MenuItem key={crs.id} value={crs.id}>
                  <b>{crs.title}</b> ({crs.totalHours || 390} Hours)
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Instant Search Bar */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="एकाइ, सीप वा औजार खोज्नुहोस्..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2.5 }
              }}
            />
          </Grid>

          {/* 3-Way View Switcher */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
              दृश्य (View):
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              size="small"
            >
              <ToggleButton value="cards" sx={{ fontWeight: 800, px: 1.5 }}>
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
              </ToggleButton>
              <ToggleButton value="timeline" sx={{ fontWeight: 800, px: 1.5 }}>
                <TimelineIcon fontSize="small" sx={{ mr: 0.5 }} /> Roadmap
              </ToggleButton>
              <ToggleButton value="table" sx={{ fontWeight: 800, px: 1.5 }}>
                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        {/* Filter Pills */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
          <Chip
            clickable
            label={`सबै एकाइहरू (${courseSyllabi.length})`}
            color={filterType === 'ALL' ? 'primary' : 'default'}
            onClick={() => setFilterType('ALL')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
          <Chip
            clickable
            label="अधिक प्रयोगात्मक (≥३०h)"
            color={filterType === 'HIGH_PRACTICAL' ? 'success' : 'default'}
            onClick={() => setFilterType('HIGH_PRACTICAL')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
          <Chip
            clickable
            label="सैद्धान्तिक फोकस (≥१०h)"
            color={filterType === 'THEORY' ? 'info' : 'default'}
            onClick={() => setFilterType('THEORY')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
          <Chip
            clickable
            label="औजार/सामग्री उल्लेख भएका"
            color={filterType === 'HAS_TOOLS' ? 'secondary' : 'default'}
            onClick={() => setFilterType('HAS_TOOLS')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
        </Box>
      </Card>

      {/* =======================================================
          VIEW 1: MODERN UNIT CARDS
          ======================================================= */}
      {viewMode === 'cards' && (
        <Grid container spacing={2.5}>
          {filteredSyllabi.map((syl, idx) => {
            const practicalH = Number(syl.practicalHours) || 0;
            const theoryH = Number(syl.theoryHours) || 0;
            const totalH = syl.totalHours || practicalH + theoryH;
            const pRatio = totalH > 0 ? Math.round((practicalH / totalH) * 100) : 80;

            return (
              <Grid item xs={12} sm={6} md={4} key={syl.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 28px rgba(15, 44, 89, 0.1)',
                      borderColor: '#93C5FD'
                    }
                  }}
                >
                  {/* Top Color Accent Line */}
                  <Box
                    sx={{
                      height: 4,
                      background: pRatio >= 75
                        ? 'linear-gradient(90deg, #10B981, #059669)'
                        : 'linear-gradient(90deg, #3B82F6, #1D4ED8)'
                    }}
                  />

                  {/* Header */}
                  <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`UNIT ०${syl.unitNo}`}
                        size="small"
                        sx={{
                          bgcolor: '#0F2C59',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '0.72rem',
                          height: 22
                        }}
                      />
                      <Chip
                        label={`${totalH} घण्टा`}
                        size="small"
                        sx={{
                          bgcolor: '#F1F5F9',
                          color: '#0F172A',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          height: 22
                        }}
                      />
                    </Box>

                    {/* Up / Down Reordering & Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveUnit(syl.id, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        sx={{ p: 0.4 }}
                      >
                        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveUnit(syl.id, 'down')}
                        disabled={idx === filteredSyllabi.length - 1}
                        title="Move Down"
                        sx={{ p: 0.4 }}
                      >
                        <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(syl)}
                        sx={{ color: '#1D4ED8', p: 0.4 }}
                        title="Edit Unit"
                      >
                        <EditIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(syl.id)}
                        sx={{ color: '#EF4444', p: 0.4 }}
                        title="Delete Unit"
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Title */}
                  <Box sx={{ px: 2, pb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.3 }}>
                      {syl.title}
                    </Typography>
                  </Box>

                  {/* Hours Distribution Bar */}
                  <Box sx={{ px: 2, pb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                        Practical: <b>{practicalH}h ({pRatio}%)</b>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800 }}>
                        Theory: <b>{theoryH}h</b>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: '#E2E8F0' }}>
                      <Box sx={{ width: `${pRatio}%`, bgcolor: '#10B981' }} />
                      <Box sx={{ width: `${100 - pRatio}%`, bgcolor: '#3B82F6' }} />
                    </Box>
                  </Box>

                  {/* Learning Outcomes Box */}
                  <Box sx={{ px: 2, py: 1.5, bgcolor: '#F8FAFC', mx: 2, borderRadius: 2.5, border: '1px solid #EDF2F7', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#475569', display: 'block', mb: 0.4 }}>
                      🎯 सिकाइ उपलब्धि (Learning Outcomes / NOS):
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1E293B', fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {syl.learningOutcome || 'CTEVT कार्यथलो सीप तथा मापदण्ड अनुरुपका सीपहरु।'}
                    </Typography>
                  </Box>

                  {/* Tools and Materials */}
                  {syl.toolsAndMaterials && (
                    <Box sx={{ px: 2, pb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <BuildIcon sx={{ fontSize: 16, color: '#94A3B8', mt: 0.2 }} />
                      <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.4 }}>
                        <b>औजार/सामग्री:</b> {syl.toolsAndMaterials}
                      </Typography>
                    </Box>
                  )}

                  {/* Footer Card Actions */}
                  <Box sx={{ mt: 'auto', p: 1.5, px: 2, borderTop: '1px solid #F1F5F9', bgcolor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                      ID: {syl.id}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AssignmentTurnedInIcon sx={{ fontSize: 16 }} />}
                      onClick={() => alert(`"${syl.title}" को पाठयोजना तयार गर्न Lesson Plan खण्डमा जानुहोस्।`)}
                      sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'none' }}
                    >
                      पाठयोजना बनाउनुहोस्
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}

          {filteredSyllabi.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px dashed #CBD5E1', bgcolor: '#FFFFFF' }}>
                <MenuBookIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B', mb: 0.5 }}>
                  कुनै पाठ्यक्रम एकाइ फेला परेन
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
                  तपाईंले नयाँ एकाइ थप्न वा एकै क्लिकमा CTEVT मानक टेम्प्लेट लोड गर्न सक्नुहुन्छ।
                </Typography>
                <Stack direction="row" spacing={1.5} justifyContent="center">
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                    + Add Unit
                  </Button>
                  <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setOpenPresetDialog(true)}>
                    Load CTEVT Presets
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* =======================================================
          VIEW 2: VISUAL LEARNING ROADMAP / TIMELINE
          ======================================================= */}
      {viewMode === 'timeline' && (
        <Box sx={{ position: 'relative', py: 2 }}>
          {filteredSyllabi.map((syl, index) => {
            const practicalH = Number(syl.practicalHours) || 0;
            const theoryH = Number(syl.theoryHours) || 0;
            const totalH = syl.totalHours || practicalH + theoryH;

            return (
              <Box
                key={syl.id}
                sx={{
                  display: 'flex',
                  gap: { xs: 2, sm: 3 },
                  position: 'relative',
                  mb: 3
                }}
              >
                {/* Connecting Vertical Line */}
                {index < filteredSyllabi.length - 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: { xs: 20, sm: 24 },
                      top: 48,
                      bottom: -28,
                      width: 3,
                      bgcolor: '#CBD5E1',
                      zIndex: 0
                    }}
                  />
                )}

                {/* Milestone Node Avatar */}
                <Avatar
                  sx={{
                    width: { xs: 42, sm: 50 },
                    height: { xs: 42, sm: 50 },
                    bgcolor: index === 0 ? '#10B981' : index === filteredSyllabi.length - 1 ? '#F59E0B' : '#0F2C59',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: { xs: '0.85rem', sm: '1rem' },
                    boxShadow: '0 4px 14px rgba(15, 44, 89, 0.2)',
                    zIndex: 1,
                    border: '3px solid #FFFFFF'
                  }}
                >
                  {syl.unitNo}
                </Avatar>

                {/* Milestone Content Card */}
                <Card
                  sx={{
                    flexGrow: 1,
                    p: 2.5,
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                    bgcolor: '#FFFFFF'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '1.05rem' }}>
                        {syl.title}
                      </Typography>
                      <Chip
                        label={`${totalH} Hours`}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 900, height: 22 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`Practical: ${practicalH}h`}
                        size="small"
                        sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 800, height: 22 }}
                      />
                      <Chip
                        label={`Theory: ${theoryH}h`}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 800, height: 22 }}
                      />
                      <IconButton size="small" onClick={() => handleOpenEdit(syl)} sx={{ color: '#1D4ED8' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.5 }}>
                    <b>सिकाइ उपलब्धि:</b> {syl.learningOutcome || 'प्रयोगात्मक सीप तथा कार्यथलो सुरक्षा प्रोटोकलहरू।'}
                  </Typography>

                  {syl.toolsAndMaterials && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <BuildIcon sx={{ fontSize: 15, color: '#94A3B8' }} />
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        <b>आवश्यक सामग्री:</b> {syl.toolsAndMaterials}
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Box>
            );
          })}
        </Box>
      )}

      {/* =======================================================
          VIEW 3: CTEVT STANDARD MATRIX TABLE
          ======================================================= */}
      {viewMode === 'table' && (
        <Card sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#0F2C59' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff', fontWeight: 900, width: 70, textAlign: 'center' }}>एकाइ #</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 900 }}>पाठ्यक्रम एकाइ शीर्षक (Unit Title)</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 900, textAlign: 'center' }}>Theory</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 900, textAlign: 'center' }}>Practical</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 900, textAlign: 'center' }}>Total</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 900 }}>सिकाइ उपलब्धि (Learning Outcomes / NOS)</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 900 }}>औजार र सामग्री (Tools)</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 900, textAlign: 'right' }}>कार्य (Actions)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSyllabi.map((syl) => (
                  <TableRow key={syl.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 900, color: '#1D4ED8', textAlign: 'center' }}>
                      #{syl.unitNo}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                      {syl.title}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#2563EB' }}>
                      {syl.theoryHours}h
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#059669' }}>
                      {syl.practicalHours}h
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#0F172A' }}>
                      {syl.totalHours || (Number(syl.theoryHours) || 0) + (Number(syl.practicalHours) || 0)}h
                    </TableCell>
                    <TableCell sx={{ color: '#334155', fontSize: '0.82rem', maxWidth: 280 }}>
                      {syl.learningOutcome || 'Competency standard tasks.'}
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontSize: '0.8rem', maxWidth: 220 }}>
                      {syl.toolsAndMaterials || 'Standard tools.'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(syl)} sx={{ color: '#1D4ED8' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(syl.id)} sx={{ color: '#EF4444' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredSyllabi.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94A3B8' }}>
                      कुनै एकाइ फेला परेन।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* =======================================================
          MODAL 1: ADD / EDIT SINGLE SYLLABUS UNIT
          ======================================================= */}
      <Dialog
        open={openSingleDialog}
        onClose={() => setOpenSingleDialog(false)}
        maxWidth="md"
        fullWidth
        BackdropProps={{
          sx: { backdropFilter: 'blur(5px)', bgcolor: 'rgba(15, 23, 42, 0.45)' }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5 }}>
              <MenuBookIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'पाठ्यक्रम एकाइ सम्पादन गर्नुहोस् (Edit Unit)' : 'नयाँ पाठ्यक्रम एकाइ दर्ता (Add Syllabus Unit)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {selectedCourse?.title} • एकाइ # {formData.unitNo} को सैद्धान्तिक र प्रयोगात्मक घण्टा विवरण
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setOpenSingleDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 3,
            bgcolor: '#FFFFFF',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                label="एकाइ नम्बर (Unit No)"
                type="number"
                fullWidth
                size="small"
                value={formData.unitNo}
                onChange={(e) => setFormData({ ...formData, unitNo: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={9}>
              <TextField
                label="एकाइ शीर्षक (Unit Title) *"
                fullWidth
                size="small"
                placeholder="उदा: Vital Signs Monitoring & Assessment"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="प्रयोगात्मक घण्टा (Practical Hours) *"
                type="number"
                fullWidth
                size="small"
                placeholder="उदा: 32"
                value={formData.practicalHours}
                onChange={(e) => setFormData({ ...formData, practicalHours: e.target.value === '' ? '' : Number(e.target.value) })}
                helperText="८०% सीप मापदण्ड अनुरुप हुनुपर्ने"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="सैद्धान्तिक घण्टा (Theory Hours) *"
                type="number"
                fullWidth
                size="small"
                placeholder="उदा: 8"
                value={formData.theoryHours}
                onChange={(e) => setFormData({ ...formData, theoryHours: e.target.value === '' ? '' : Number(e.target.value) })}
                helperText="२०% सिद्धान्त मापदण्ड"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="सिकाइ उपलब्धि तथा मुख्य कार्यहरू (Learning Outcomes / NOS) *"
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="यस एकाइ पश्चात विद्यार्थीले के सीप प्रदर्शन गर्न सक्नेछन्..."
                value={formData.learningOutcome}
                onChange={(e) => setFormData({ ...formData, learningOutcome: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="आवश्यक औजार तथा तालिम सामग्री (Tools, Equipment & Materials)"
                fullWidth
                size="small"
                placeholder="उदा: Sphygmomanometer, Stethoscope, PPE Kit, First Aid Box"
                value={formData.toolsAndMaterials}
                onChange={(e) => setFormData({ ...formData, toolsAndMaterials: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5
          }}
        >
          <Button
            onClick={() => setOpenSingleDialog(false)}
            sx={{
              fontWeight: 700,
              color: '#64748B',
              border: '1px solid #E2E8F0',
              borderRadius: 2,
              px: 2.5,
              textTransform: 'none',
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' }
            }}
          >
            रद्द गर्नुहोस् (Cancel)
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={handleSaveSingle}
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
              color: '#FFFFFF',
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 12px rgba(15, 44, 89, 0.25)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0F2444 0%, #172554 100%)',
                boxShadow: '0 6px 16px rgba(15, 44, 89, 0.35)'
              }
            }}
          >
            सुरक्षित गर्नुहोस् (Save Unit)
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 2: 1-CLICK CTEVT OFFICIAL PRESETS
          ======================================================= */}
      <Dialog
        open={openPresetDialog}
        onClose={() => setOpenPresetDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#0F2C59' }}>
          ⚡ 1-Click CTEVT Official Curriculum Presets
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
            नयाँ पाठ्यक्रम तुरुन्तै सेटअप गर्न आधिकारिक CTEVT ३९०-घण्टे मापदण्डका एकाइहरू छान्नुहोस्।
            यसले ८०% प्रयोगात्मक र २०% सैद्धान्तिक अनुपातको साथ आवश्यक सम्पूर्ण एकाइहरू स्वतः लोड गरिदिन्छ।
          </Typography>

          <Grid container spacing={2}>
            {CTEVT_PRESETS.map((preset) => (
              <Grid item xs={12} key={preset.key}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: '#F8FAFC', borderColor: '#2563EB' }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                        {preset.title}
                      </Typography>
                      <Chip
                        label={`${preset.units.length} Units`}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, height: 20 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      {preset.description}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => handleApplyPreset(preset)}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 2.5,
                      bgcolor: '#0F2C59',
                      whiteSpace: 'nowrap',
                      ml: 2
                    }}
                  >
                    Load Template
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPresetDialog(false)} sx={{ fontWeight: 700 }}>
            बन्द गर्नुहोस्
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 3: BULK CSV / EXCEL IMPORT
          ======================================================= */}
      <Dialog
        open={openBulkDialog}
        onClose={() => setOpenBulkDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#0F2C59' }}>
          बल्क इम्पोर्ट (Bulk CSV / Excel Import)
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Excel वा CSV बाट सीधै पेस्ट गर्नुहोस् वा फाइल अपलोड गर्नुहोस्।
            </Typography>
            <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownloadSampleCSV}>
              नमूना CSV डाउनलोड (Sample)
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept=".csv,.txt"
              style={{ display: 'none' }}
              id="bulk-syllabus-file"
              onChange={handleFileUpload}
            />
            <label htmlFor="bulk-syllabus-file">
              <Button variant="outlined" component="span" startIcon={<FileUploadIcon />}>
                फाइल छान्नुहोस् (.csv / .txt)
              </Button>
            </label>
          </Box>

          <TextField
            multiline
            rows={7}
            fullWidth
            placeholder="Unit No, Unit Title, Theory Hours, Practical Hours, Learning Outcomes, Tools"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            sx={{ fontFamily: 'monospace', mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              इम्पोर्ट विधि:
            </Typography>
            <Button
              variant={bulkMode === 'append' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setBulkMode('append')}
            >
              हालकोमा थप्ने (Append)
            </Button>
            <Button
              variant={bulkMode === 'replace' ? 'contained' : 'outlined'}
              size="small"
              color="error"
              onClick={() => setBulkMode('replace')}
            >
              प्रतिस्थापन गर्ने (Replace All)
            </Button>
          </Box>

          {parsedBulkUnits.length > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <b>{parsedBulkUnits.length}</b> वटा पाठ्यक्रम एकाइ फेला पर्यो।
            </Alert>
          )}

          {bulkError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {bulkError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBulkDialog(false)} sx={{ fontWeight: 700 }}>
            रद्द गर्नुहोस्
          </Button>
          <Button variant="contained" onClick={handleConfirmBulkImport} sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}>
            इम्पोर्ट पुष्टि गर्नुहोस्
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 4: OFFICIAL DOCUMENT PRINT / PDF DIALOG
          ======================================================= */}
      <Dialog
        open={openDocDialog}
        onClose={() => setOpenDocDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2C59' }}>
            आधिकारिक पाठ्यक्रम दस्तावेज (Official CTEVT Format)
          </Typography>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ fontWeight: 800 }}>
            प्रिन्ट गर्नुहोस् (Print)
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {/* Institutional Header */}
          <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px solid #0F2C59', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2C59' }}>
              ग्लोबल एरा प्राविधिक स्कुल (Global Era Technical School)
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700 }}>
              KITE CAREGIVER TRAINING CENTER • MitraPark, Kathmandu
            </Typography>
            <Typography variant="overline" sx={{ fontWeight: 900, color: '#166534', bgcolor: '#DCFCE7', px: 1.5, py: 0.3, borderRadius: 2 }}>
              CTEVT RECOGNIZED VOCATIONAL TRAINING CURRICULUM
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                पाठ्यक्रम (Course):
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {selectedCourse?.title}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                कुल तालिम अवधि:
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {courseTargetHours} Hours (3 Months)
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                सैद्धान्तिक (Theory):
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#2563EB' }}>
                {totalTheoryHours} Hours ({theoryRatio}%)
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                प्रयोगात्मक (Practical):
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                {totalPracticalHours} Hours ({practicalRatio}%)
              </Typography>
            </Grid>
          </Grid>

          <TableContainer sx={{ border: '1px solid #CBD5E1', borderRadius: 2, mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#0F2C59' }}>
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 60, textAlign: 'center' }}>Unit</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>सीप / एकाइ शीर्षक (Competency / Task Title)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center' }}>Theory</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center' }}>Practical</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center' }}>Total</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>सिकाइ उपलब्धि (Learning Outcomes / NOS)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courseSyllabi.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center' }}>{u.unitNo}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{u.title}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{u.theoryHours}h</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{u.practicalHours}h</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 900 }}>{u.totalHours}h</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#334155' }}>{u.learningOutcome}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 900, textAlign: 'right' }}>
                    कुल जम्मा (Total Allocated Hours):
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#2563EB' }}>
                    {totalTheoryHours}h
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#059669' }}>
                    {totalPracticalHours}h
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#0F2C59', fontSize: '0.95rem' }}>
                    {totalSyllabusHours}h
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#64748B' }}>
                    लक्ष्य: {courseTargetHours} Hours ({hoursPercentage}% Met)
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={4} sx={{ pt: 4 }}>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ borderTop: '1px dashed #64748B', pt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                  पाठ्यक्रम संयोजक (Curriculum In-charge)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Signature &amp; Date
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ borderTop: '1px dashed #64748B', pt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                  प्रशिक्षक (Lead Instructor)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Signature &amp; Date
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ borderTop: '1px dashed #64748B', pt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                  प्रिन्सिपल / क्याम्पस प्रमुख (Principal)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Official Stamp &amp; Signature
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDocDialog(false)} sx={{ fontWeight: 700 }}>
            बन्द गर्नुहोस्
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
