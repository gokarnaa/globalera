import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AdmissionAgreementPrintModal({ open, onClose, admission }) {
  if (!admission) return null;

  const handlePrint = () => {
    window.print();
  };

  // Render a single copy (either Office Copy or Student Copy)
  const renderAgreementDocument = (copyType) => {
    const isOffice = copyType === 'OFFICE';
    return (
      <Box
        className={`agreement-sheet ${isOffice ? 'page-break' : ''}`}
        sx={{
          bgcolor: '#ffffff',
          color: '#1e293b',
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          p: { xs: 2.5, sm: 4 },
          mb: { xs: 3, print: 0 },
          border: '1px solid #cbd5e1',
          borderRadius: { xs: 1.5, print: 0 },
          boxShadow: { xs: '0 4px 14px rgba(0,0,0,0.06)', print: 'none' },
          maxWidth: '210mm',
          mx: 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Header with Copy Badge */}
        <Box sx={{ borderBottom: '2.5px solid #0f2e5a', pb: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: '#0f2e5a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontSize: { xs: '1.05rem', sm: '1.22rem' },
                  lineHeight: 1.2
                }}
              >
                ग्लोबल एरा मल्टि सर्भिस प्रा.लि.
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#b45309', fontSize: { xs: '0.9rem', sm: '1rem' }, mt: 0.2 }}
              >
                प्राविधिक स्कुल जोरपाटी (Prabidhik School Jorpati)
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3, fontSize: '0.78rem' }}>
                गोकर्णेश्वर नगरपालिका-०५, जोरपाटी, काठमाडौँ | फोन: ०१-४९१५५५५, ९८५१०००००० | पान नं: ६०९८७६५४३
              </Typography>
            </Box>

            {/* Badge for Copy Type */}
            <Box sx={{ textAlign: 'right' }}>
              <Box
                sx={{
                  display: 'inline-block',
                  border: isOffice ? '2px solid #b91c1c' : '2px solid #0284c7',
                  bgcolor: isOffice ? '#fef2f2' : '#f0f9ff',
                  color: isOffice ? '#991b1b' : '#0369a1',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  textTransform: 'uppercase'
                }}
              >
                {isOffice ? 'संस्थाको प्रति (OFFICE COPY)' : 'विद्यार्थीको प्रति (STUDENT COPY)'}
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b', fontSize: '0.72rem' }}>
                सम्झौता नं: <strong>{admission.agreementNo || 'GE-AGR-001'}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Title */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: '#0f2e5a',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              fontSize: { xs: '1rem', sm: '1.1rem' }
            }}
          >
            विद्यार्थी भर्ना तथा व्यावसायिक तालिम सम्झौता पत्र
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: '0.03em' }}>
            STUDENT ADMISSION & VOCATIONAL TRAINING AGREEMENT
          </Typography>
        </Box>

        {/* Basic Metadata Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 1,
            px: 1.5,
            py: 0.8,
            mb: 2,
            fontSize: '0.82rem'
          }}
        >
          <Box>
            दर्ता/रोल नं: <strong>{admission.studentId || 'STD-01'} ({admission.tgid || 'TGID-101'})</strong>
          </Box>
          <Box>
            भर्ना मिति: <strong>{admission.admissionDateBS || admission.admissionDate}</strong> ({admission.admissionDate})
          </Box>
          <Box>
            स्थिति: <strong style={{ color: '#059669' }}>भर्ना सम्पन्न (ENROLLED)</strong>
          </Box>
        </Box>

        {/* Section 1: Parties */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            १. सम्झौताका पक्षहरू (Parties to the Agreement):
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#334155' }}>
            <strong>प्रथम पक्ष (संस्था):</strong> ग्लोबल एरा मल्टि सर्भिस प्रा.लि. (प्राविधिक स्कुल जोरपाटी), गोकर्णेश्वर-०५, काठमाडौँ।
            <br />
            <strong>दोस्रो पक्ष (विद्यार्थी):</strong> श्री / सुश्री <strong>{admission.studentName}</strong>, लिङ्ग: <strong>{admission.gender || 'Female'}</strong>, फोन नं: <strong>{admission.phone}</strong> {admission.secondaryPhone ? `(${admission.secondaryPhone})` : ''}, हालको ठेगाना: <strong>{admission.currentAddress || 'काठमाडौँ'}</strong>, स्थायी ठेगाना: <strong>{admission.permanentAddress || 'काठमाडौँ'}</strong>, नागरिकता/परिचयपत्र नं: <strong>{admission.citizenshipNumber || 'उपलब्ध छैन'}</strong>।
          </Typography>
        </Box>

        {/* Section 2: Training Details */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            २. तालिम सम्बन्धी विवरण तथा सिकाइ प्रारूप (Course & Training Scope):
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, bgcolor: '#f8fafc', p: 1.2, borderRadius: 1, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
            <Box>तालिम / कोर्सको नाम: <strong>{admission.courseTitle}</strong></Box>
            <Box>ब्याच / समूह: <strong>{admission.groupName || 'GRP-01'}</strong></Box>
            <Box>दैनिक सिफ्ट र समय: <strong>{admission.shift} ({admission.timing})</strong></Box>
            <Box>कुल तालिम अवधि: <strong>{admission.duration}</strong></Box>
          </Box>
          <Box sx={{ mt: 0.8, fontSize: '0.8rem', color: '#475569' }}>
            <strong>तालिममा सिकाइने मुख्य सीपहरू:</strong> {admission.keySkills || 'कोर्सको पाठ्यक्रम अनुसार प्रयोगात्मक तथा सैद्धान्तिक सीपहरू, मेसिन तथा उपकरण सञ्चालन, कार्यस्थल सुरक्षा र व्यावसायिक फिनिसिङ।'}
          </Box>
        </Box>

        {/* Section 3: OJT & Placement */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            ३. OJT (On-the-Job Training) तथा रोजगारी सहजीकरण:
          </Typography>
          <Box sx={{ bgcolor: '#f1f5f9', p: 1.2, borderRadius: 1, fontSize: '0.82rem', lineHeight: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 0.5 }}>
              <span>OJT सुविधा रोजाइ: <strong>{admission.ojtPreference === 'REQUIRED' ? '✓ आवश्यक छ (संस्थाले समन्वय गर्ने)' : '✗ आवश्यक छैन (स्वयं व्यवस्था गर्ने)'}</strong></span>
              <span>OJT शुल्क: <strong style={{ color: '#059669' }}>निःशुल्क (कोर्स शुल्कमै समावेश)</strong></span>
            </Box>
            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#475569' }}>
              • तालिम सफलतापूर्वक सम्पन्न गरेपछि विद्यार्थीको सीप, नियमित उपस्थिति तथा अनुशासनको आधारमा संस्थाले सम्बन्धित कम्पनी/उद्योगहरूमा OJT इन्टर्नशिप तथा रोजगार अन्तर्वार्ताका लागि सिफारिस तथा समन्वय गरिदिनेछ।
            </Typography>
          </Box>
        </Box>

        {/* Section 4: Fee Structure & 50% Rule */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            ४. शुल्क संरचना तथा किस्ता भुक्तानी सर्तहरू (Fee Structure & Strict Payment Terms):
          </Typography>
          <Box sx={{ border: '1px solid #cbd5e1', borderRadius: 1, overflow: 'hidden', mb: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f2e5a', color: '#ffffff' }}>
                  <th style={{ padding: '6px 10px', borderRight: '1px solid #334155' }}>विवरण (Particulars)</th>
                  <th style={{ padding: '6px 10px', borderRight: '1px solid #334155', textAlign: 'right' }}>रकम (रु.)</th>
                  <th style={{ padding: '6px 10px' }}>भुक्तानी स्थिति / अन्तिम मिति</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 10px' }}>कुल तोकिएको कोर्स शुल्क</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>रु. {(Number(admission.totalCourseFee) || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: '#64748b' }}>नियमित शुल्क</td>
                </tr>
                {admission.discountAmount > 0 && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fefce8' }}>
                    <td style={{ padding: '6px 10px', color: '#b45309' }}>स्वीकृत विशेष छुट / छात्रवृत्ति</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#b45309', fontWeight: 600 }}>- रु. {(Number(admission.discountAmount) || 0).toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', color: '#b45309' }}>संस्थाद्वारा छुट स्वीकृत</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 700 }}>
                  <td style={{ padding: '6px 10px' }}>खुद तिर्नुपर्ने शुल्क (Net Payable Fee)</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: '#0f2e5a' }}>रु. {(Number(admission.netPayableFee) || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: '#0f2e5a' }}>सम्झौता रकम</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ecfdf5' }}>
                  <td style={{ padding: '6px 10px', color: '#065f46', fontWeight: 700 }}>पहिलो किस्ता (भर्नाको समयमा ५०% अग्रिम भुक्तान)</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: '#065f46', fontWeight: 800 }}>रु. {(Number(admission.advancePaid50) || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: '#065f46' }}>
                    <strong>चुक्ता (रसिद नं: {admission.receiptNo})</strong> | {admission.paymentMethod}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fff1f2' }}>
                  <td style={{ padding: '6px 10px', color: '#991b1b', fontWeight: 700 }}>दोस्रो किस्ता (बाँकी ५०% रकम)</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: '#991b1b', fontWeight: 800 }}>रु. {(Number(admission.dueAmount50) || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: '#991b1b', fontWeight: 700 }}>
                    अन्तिम मिति: {admission.dueDate} (३० दिन भित्र)
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>
          <Box sx={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 600, pl: 0.5 }}>
            * नियम: भर्ना भएको ३० दिन (१ महिना) भित्र बाँकी ५०% शुल्क अनिवार्य भुक्तानी गरिसक्नुपर्नेछ। तोकिएको अवधिमा शुल्क नबुझाएमा कक्षा प्रवेश रोकिनेछ। भर्ना भइसकेपछि बुझाएको शुल्क कुनै पनि अवस्थामा फिर्ता हुनेछैन (Non-refundable)।
          </Box>
        </Box>

        {/* Section 5: Rules & Regulations */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', borderBottom: '1px solid #e2e8f0', pb: 0.3, mb: 0.8, fontSize: '0.85rem' }}>
            ५. संस्थाको आचारसंहिता, ब्याच सार्ने नीति तथा सर्तहरू (Rules & Policies):
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
            <li><strong>उपस्थिति:</strong> तालिममा कम्तीमा <strong>८०% उपस्थिति</strong> अनिवार्य छ। बिना जानकारी लगातार ३ दिनभन्दा बढी अनुपस्थित भएमा स्पष्टीकरण सोधिनेछ।</li>
            <li><strong>सुरक्षा र उपकरण:</strong> तालिममा प्रयोग हुने औजार, मेसिन र कच्चा पदार्थको जतन गर्नुपर्नेछ। लापरवाही वा तोडफोडबाट क्षति भएमा क्षतिपूर्ति विद्यार्थीले व्यहोर्नुपर्नेछ।</li>
            <li><strong>ब्याच सार्ने सुविधा (Batch Transfer):</strong> विशेष व्यावहारिक वा स्वास्थ्य कारणले नियमित उपस्थित हुन नसकेमा लिखित निवेदन दिई संस्थाको पूर्वस्वीकृति लिएर <strong>१ पटक अर्को ब्याचमा सर्न (Transfer हुन)</strong> पाइनेछ।</li>
            <li><strong>प्रमाणपत्र प्राप्ति:</strong> सम्पूर्ण शुल्क चुक्ता (Full Clearance) भएको र तोकिएको आन्तरिक प्रयोगात्मक मूल्याङ्कन उत्तीर्ण भएपछि मात्र संस्थाको आधिकारिक प्रमाणपत्र र OJT सिफारिस पत्र प्रदान गरिनेछ।</li>
          </Box>
        </Box>

        {/* Section 6: Declaration & Signatures */}
        <Box sx={{ mt: 2.5, pt: 1.5, borderTop: '1.5px solid #cbd5e1' }}>
          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#475569', mb: 3 }}>
            "मैले माथि उल्लिखित तालिम विवरण, ५०% अग्रिम र बाँकी ५०% एक महिनाभित्र बुझाउने शुल्कका सर्तहरू, संस्थाका नियम तथा आचारसंहिता राम्ररी पढेर/बुझेर पूर्ण सहमतिका साथ यो सम्झौता पत्रमा हस्ताक्षर गरेको छु।"
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', px: 2 }}>
            {/* Student Signature */}
            <Box sx={{ textAlign: 'center', width: '220px' }}>
              <Box sx={{ borderBottom: '1.5px dashed #475569', height: '40px', mb: 0.5 }}></Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '0.84rem' }}>
                विद्यार्थीको हस्ताक्षर
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.74rem' }}>
                नाम: <strong>{admission.studentName}</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
                फोन: {admission.phone}
              </Typography>
            </Box>

            {/* Official Seal / Stamp */}
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: '1.5px dashed #94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  mx: 'auto'
                }}
              >
                संस्थाको छाप
              </Box>
            </Box>

            {/* Authorized Signatory */}
            <Box sx={{ textAlign: 'center', width: '220px' }}>
              <Box sx={{ borderBottom: '1.5px dashed #475569', height: '40px', mb: 0.5 }}></Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '0.84rem' }}>
                संस्था प्रमुख / अधिकृत हस्ताक्षर
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.74rem' }}>
                ग्लोबल एरा मल्टि सर्भिस प्रा.लि.
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
                मिति: {admission.admissionDateBS || admission.admissionDate}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      {/* Top Action Toolbar (Hidden in Print) */}
      <DialogTitle
        className="no-print"
        sx={{
          bgcolor: '#0f2e5a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5,
          px: 3
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SchoolIcon sx={{ color: '#f59e0b' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              विद्यार्थी भर्ना सम्झौता पत्र (Admission & Training Agreement)
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              A4 आकारमा २ प्रति (संस्थाको प्रति र विद्यार्थीको प्रति) प्रिन्ट गर्नुहोस्
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 800, px: 2.5 }}
          >
            A4 दुई प्रति प्रिन्ट (Print Agreement)
          </Button>
          <IconButton onClick={onClose} sx={{ color: '#cbd5e1' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#f1f5f9' }}>
        <Box id="printableAdmissionAgreement">
          {/* Page 1: Office Copy */}
          {renderAgreementDocument('OFFICE')}

          {/* Page 2: Student Copy */}
          {renderAgreementDocument('STUDENT')}
        </Box>
      </DialogContent>

      <DialogActions className="no-print" sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          * प्रिन्टरमा A4 साइज छनोट गर्नुहोस्। ब्राउजरले स्वतः २ पेजमा दुवै प्रति प्रिन्ट गर्नेछ।
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button onClick={onClose} color="inherit">
            बन्द गर्नुहोस् (Close)
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 800 }}
          >
            प्रिन्ट गर्नुहोस् (Print)
          </Button>
        </Stack>
      </DialogActions>

      {/* Embedded CSS for Exact A4 Portrait 2-Page Print */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printableAdmissionAgreement, #printableAdmissionAgreement * {
            visibility: visible !important;
          }
          #printableAdmissionAgreement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .agreement-sheet {
            border: 1.5px solid #0f2e5a !important;
            padding: 16mm 14mm !important;
            box-sizing: border-box !important;
            height: 275mm !important;
            max-height: 275mm !important;
            display: flex !important;
            flex-direction: column !important;
            justifyContent: space-between !important;
            page-break-inside: avoid !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
