import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Chip
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import { QRCodeSVG } from 'qrcode.react';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { loadDB } from '../../services/storage';

// Corner Ornament SVG Helper
function CornerSvg({ style, size = 32, color = '#C59B27', position = 'top-left' }) {
  if (!style || style === 'none') return null;

  let transformStyle = '';
  let positionStyle = {};

  if (position === 'top-left') {
    positionStyle = { top: 0, left: 0 };
    transformStyle = 'none';
  } else if (position === 'top-right') {
    positionStyle = { top: 0, right: 0 };
    transformStyle = 'scaleX(-1)';
  } else if (position === 'bottom-left') {
    positionStyle = { bottom: 0, left: 0 };
    transformStyle = 'scaleY(-1)';
  } else if (position === 'bottom-right') {
    positionStyle = { bottom: 0, right: 0 };
    transformStyle = 'scale(-1, -1)';
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        ...positionStyle,
        transform: transformStyle,
        transformOrigin: 'center center',
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 2
      }}
    >
      {style === 'victorian-flourish' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M4 4 C 30 4, 60 15, 80 40 C 95 60, 96 85, 96 96 C 85 96, 60 95, 40 80 C 15 60, 4 30, 4 4 Z" stroke={color} strokeWidth="3" fill="none" />
          <path d="M12 12 C 35 12, 55 24, 70 45 C 80 60, 84 75, 84 84 C 75 84, 60 80, 45 70 C 24 55, 12 35, 12 12 Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="5" fill={color} />
          <path d="M4 25 C 10 25, 25 10, 25 4" stroke={color} strokeWidth="2.5" />
          <circle cx="4" cy="4" r="3" fill={color} />
        </svg>
      )}

      {style === 'acanthus-leaf' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M6 6 Q 40 6 70 25 Q 94 45 94 94 Q 45 94 25 70 Q 6 40 6 6 Z" stroke={color} strokeWidth="3" fill="none" />
          <path d="M6 6 C 25 30 40 45 60 60 C 45 40 30 25 6 6 Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" />
          <circle cx="6" cy="6" r="4" fill={color} />
          <path d="M18 6 Q 30 18 18 30 Q 6 18 18 6 Z" fill={color} />
        </svg>
      )}

      {style === 'art-deco-bracket' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M4 4 L 96 4 L 96 16 L 16 16 L 16 96 L 4 96 Z" fill={color} fillOpacity="0.9" />
          <path d="M24 24 L 80 24 L 80 32 L 32 32 L 32 80 L 24 80 Z" fill={color} fillOpacity="0.6" />
          <path d="M40 40 L 64 40 L 64 46 L 46 46 L 46 64 L 40 64 Z" fill={color} fillOpacity="0.4" />
          <polygon points="10,10 18,4 26,10 18,16" fill={color} />
        </svg>
      )}

      {style === 'celtic-knot' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <rect x="6" y="6" width="88" height="88" rx="8" stroke={color} strokeWidth="2.5" fill="none" />
          <path d="M6 35 C 35 35 35 6 35 6" stroke={color} strokeWidth="3" />
          <path d="M6 65 C 65 65 65 6 65 6" stroke={color} strokeWidth="2.5" />
          <circle cx="20" cy="20" r="7" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
          <circle cx="6" cy="6" r="4" fill={color} />
        </svg>
      )}

      {style === 'clean-l-bracket' && (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M4 4 L 96 4" stroke={color} strokeWidth="5" strokeLinecap="square" />
          <path d="M4 4 L 4 96" stroke={color} strokeWidth="5" strokeLinecap="square" />
          <path d="M12 12 L 75 12" stroke={color} strokeWidth="2" />
          <path d="M12 12 L 12 75" stroke={color} strokeWidth="2" />
          <polygon points="4,4 12,4 12,12 4,12" fill={color} />
          <polygon points="20,20 28,14 36,20 28,26" fill={color} />
        </svg>
      )}
    </Box>
  );
}

export default function A4LandscapeCertificateModal({
  open,
  onClose,
  certificate,
  student,
  course,
  group,
  trainer
}) {
  if (!open || !certificate || !student) return null;

  const db = loadDB();
  const design = db.settings?.certificateDesign || {};
  const elStyles = design.elementStyles || {};

  const isPortrait = design.orientation === 'portrait';
  const primaryColor = design.primaryColor || '#0B2545';
  const accentColor = design.accentColor || '#C59B27';
  const cornerColor = design.cornerColor || accentColor;
  const borderStyle = design.borderStyle || 'royal-double';
  const borderWidth = design.borderWidth || 6;
  const borderMargin = design.borderMargin || 12;
  const cornerStyle = design.cornerStyle || 'victorian-flourish';
  const cornerSize = design.cornerSize || 32;
  const backgroundType = design.backgroundType || 'clean-white';
  const customBackgroundUrl = design.customBackgroundUrl || '';
  const watermarkOpacity = design.watermarkOpacity !== undefined ? design.watermarkOpacity : 4;
  const showStudentPhoto = design.showStudentPhoto !== undefined ? design.showStudentPhoto : true;
  const showCompetencyBadge = design.showCompetencyBadge !== undefined ? design.showCompetencyBadge : true;
  const showHeader = design.showHeader !== undefined ? design.showHeader : true;
  const showLeftLogo = design.showLeftLogo !== undefined ? design.showLeftLogo : true;
  const showRightLogo = design.showRightLogo !== undefined ? design.showRightLogo : true;

  const companyProfile = db.settings?.companyProfile || {};
  const instituteName = companyProfile.companyNameEn || design.instituteName || design.instituteNameEnglish || 'GLOBAL ERA TECHNICAL SCHOOL / GLOBAL ERA MULTI SERVICE';
  const accreditationText = design.accreditationText || 'Accredited Technical Training Provider under Council for Technical Education and Vocational Training (CTEVT)';
  const affiliationCodeText = (companyProfile.regNo || companyProfile.ctevtCode)
    ? `Government Regd. No: ${companyProfile.regNo || '184920/078/079'} • CTEVT Affiliation Code: ${companyProfile.ctevtCode || '4208'} • ${companyProfile.address || 'MitraPark, Kathmandu, Nepal'}`
    : (design.affiliationCodeText || 'Government Regd. No: 184920/078/079 • CTEVT Affiliation Code: 4208 • MitraPark, Kathmandu, Nepal');
  const certificateTitleEn = design.certificateTitleEn || 'CERTIFICATE OF VOCATIONAL TRAINING COMPLETION';
  const certificateTitleNp = design.certificateTitleNp || '(व्यावसायिक तालिम समापन प्रमाणपत्र)';

  // Default values from Batch trainer and Company Profile
  const defaultTrainerName = trainer?.name && trainer.name !== 'Assigned Instructor' 
    ? trainer.name 
    : (companyProfile.leadInstructorName || 'सुमन थापा (Suman Thapa)');
  const defaultTrainerTitle = trainer?.specialization 
    ? `प्रशिक्षक (${trainer.specialization})` 
    : (companyProfile.leadInstructorTitle || 'प्रशिक्षक (Lead Instructor)');

  const defaultDirectorName = companyProfile.directorName || 'गोकर्ण थापा (Gokarna Thapa)';
  const defaultDirectorTitle = companyProfile.directorTitle || 'क्याम्पस प्रमुख / निर्देशक (Managing Director)';

  // Dynamic Signatories fallback with automatic batch trainer & company director binding
  const signatories = (design.signatories && design.signatories.length > 0)
    ? design.signatories.map((sig, idx) => {
        if (sig.id === 'sig-1' || idx === 0) {
          return {
            ...sig,
            name: (sig.name && sig.name !== 'Lead Instructor' && sig.name !== 'सुमन थापा (Suman Thapa)') ? sig.name : defaultTrainerName,
            title: sig.title || defaultTrainerTitle
          };
        }
        if (sig.id === 'sig-2' || idx === 1) {
          return {
            ...sig,
            name: (sig.name && sig.name !== 'Director' && sig.name !== 'Gokarna Thapa') ? sig.name : defaultDirectorName,
            title: sig.title || defaultDirectorTitle
          };
        }
        return sig;
      })
    : [
        {
          id: 'sig-1',
          name: defaultTrainerName,
          title: defaultTrainerTitle,
          lineStyle: 'dashed'
        },
        {
          id: 'sig-2',
          name: defaultDirectorName,
          title: defaultDirectorTitle,
          lineStyle: 'solid'
        }
      ];

  const getBackgroundStyle = () => {
    if (design.preprintedTextOnly) {
      return { backgroundColor: 'transparent' };
    }
    if (backgroundType === 'custom') {
      return {
        backgroundColor: '#FFFFFF'
      };
    }
    if (backgroundType === 'ivory-parchment') {
      return {
        background: 'linear-gradient(135deg, #fdfbf7 0%, #faf4e8 50%, #f6ede0 100%)'
      };
    }
    if (backgroundType === 'guilloche-security') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `radial-gradient(${primaryColor}14 1.5px, transparent 1.5px), radial-gradient(${accentColor}14 1.5px, #FFFFFF 1.5px)`,
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 12px 12px'
      };
    }
    if (backgroundType === 'royal-navy-gold') {
      return {
        background: `radial-gradient(ellipse at center, #ffffff 40%, #fbf9f4 75%, ${primaryColor}12 100%)`
      };
    }
    if (backgroundType === 'modern-geometric') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `linear-gradient(30deg, ${primaryColor}06 12%, transparent 12.5%, transparent 87%, ${primaryColor}06 87.5%, ${primaryColor}06), linear-gradient(150deg, ${primaryColor}06 12%, transparent 12.5%, transparent 87%, ${primaryColor}06 87.5%, ${primaryColor}06), linear-gradient(60deg, ${accentColor}0a 25%, transparent 25.5%, transparent 75%, ${accentColor}0a 75%, ${accentColor}0a)`,
        backgroundSize: '40px 70px',
        backgroundPosition: '0 0, 0 0, 20px 35px'
      };
    }
    if (backgroundType === 'damask-floral' || backgroundType === 'damask-classic') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `repeating-linear-gradient(45deg, ${accentColor}0a, ${accentColor}0a 12px, transparent 12px, transparent 24px), repeating-linear-gradient(-45deg, ${accentColor}08, ${accentColor}08 12px, transparent 12px, transparent 24px)`
      };
    }
    if (backgroundType === 'emerald-aristocrat') {
      return {
        background: `radial-gradient(circle at center, #ffffff 45%, #f6fcf8 75%, #064e3b12 100%)`
      };
    }
    if (backgroundType === 'maroon-sovereign') {
      return {
        background: `radial-gradient(circle at center, #ffffff 45%, #fdf6f7 75%, #88133714 100%)`
      };
    }
    if (backgroundType === 'technical-grid') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `linear-gradient(to right, ${primaryColor}0a 1px, transparent 1px), linear-gradient(to bottom, ${primaryColor}0a 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      };
    }
    if (backgroundType === 'marble-veins') {
      return {
        background: 'linear-gradient(125deg, #ffffff 0%, #f9fafb 25%, #f3f4f6 50%, #fafafa 75%, #ffffff 100%)'
      };
    }
    return {
      backgroundColor: '#FFFFFF'
    };
  };

  const getBorderStyle = () => {
    if (design.preprintedTextOnly || borderStyle === 'none') {
      return { border: 'none', outline: 'none', boxShadow: 'none' };
    }
    if (borderStyle === 'royal-double') {
      return {
        border: `${borderWidth}px double ${primaryColor}`,
        outline: `${Math.max(1, Math.round(borderWidth / 2.5))}px solid ${accentColor}`,
        outlineOffset: '-10px',
        borderRadius: '2px'
      };
    }
    if (borderStyle === 'vintage-filigree') {
      return {
        border: `${borderWidth}px solid ${primaryColor}`,
        outline: `${Math.max(1, Math.round(borderWidth / 3))}px dashed ${accentColor}`,
        outlineOffset: '-8px',
        borderRadius: '3px'
      };
    }
    if (borderStyle === 'modern-executive' || borderStyle === 'modern-gold') {
      return {
        border: `${borderWidth}px solid ${primaryColor}`,
        outline: `2px solid ${accentColor}`,
        outlineOffset: '4px',
        borderRadius: '6px'
      };
    }
    if (borderStyle === 'greek-key') {
      return {
        border: `${borderWidth}px solid ${primaryColor}`,
        outline: `3px double ${accentColor}`,
        outlineOffset: '-12px',
        borderRadius: '1px'
      };
    }
    if (borderStyle === 'security-guilloche') {
      return {
        border: `${borderWidth}px ridge ${accentColor}`,
        outline: `2px solid ${primaryColor}`,
        outlineOffset: '-6px',
        borderRadius: '4px'
      };
    }
    if (borderStyle === 'art-deco') {
      return {
        border: `${borderWidth}px solid ${primaryColor}`,
        outline: `1.5px solid ${accentColor}`,
        outlineOffset: '-8px',
        boxShadow: `inset 0 0 0 10px #ffffff, inset 0 0 0 12px ${accentColor}`
      };
    }
    return { border: 'none' };
  };

  const handlePrint = () => {
    window.print();
  };

  const verificationUrl = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(
    certificate.certificateNo
  )}`;

  const shareText =
    `*${instituteName}*\n` +
    `🎓 *VOCATIONAL TRAINING COMPLETION CERTIFICATE (तालिम समापन प्रमाणपत्र)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *प्रशिक्षार्थी (Trainee):* ${student.name} (${student.tgid})\n` +
    `• *पाठ्यक्रम (Course):* ${course?.title || 'Vocational Training'} (${course?.totalHours || 390} Hours)\n` +
    `• *प्रमाणपत्र नं (Cert No):* ${certificate.certificateNo}\n` +
    `• *जारी मिति (Issue Date):* ${certificate.issueDate}\n` +
    `• *स्थिति:* ✅ Successfully Completed (CTEVT Standards)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔗 *अनलाइन प्रमाणीकरण लिंक (Online Verification):*\n${verificationUrl}\n\n` +
    `_CTEVT सम्बन्धन प्राप्त संस्थाबाट जारी आधिकारिक सीप प्रमाणपत्र।_`;

  const isFemale = (student.gender || '').toLowerCase() === 'female';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxWidth: isPortrait ? '840px' : '1160px',
          bgcolor: '#f8fafc'
        }
      }}
    >
      {/* Top Action Toolbar (Hidden in Print) */}
      <Box
        className="no-print"
        sx={{
          p: 2,
          bgcolor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={isPortrait ? 'A4 Portrait Official Format' : 'A4 Landscape Official CTEVT Format'}
            sx={{ bgcolor: '#c59b27', color: '#0f172a', fontWeight: 900, fontSize: '0.78rem' }}
          />
          <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
            Cert No: <b>{certificate.certificateNo}</b>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{
              bgcolor: '#1a56b0',
              fontWeight: 800,
              px: 2.5,
              '&:hover': { bgcolor: '#123e80' }
            }}
          >
            प्रिन्ट गर्नुहोस् (A4 {isPortrait ? 'Portrait' : 'Landscape'})
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={getWhatsAppUrl(student.phone || '', shareText)}
            target="_blank"
            sx={{
              borderColor: '#25D366',
              color: '#25D366',
              fontWeight: 800,
              bgcolor: 'rgba(37, 211, 102, 0.1)',
              '&:hover': { borderColor: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.2)' }
            }}
          >
            WhatsApp
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{ color: '#ffffff', borderColor: '#475569', minWidth: 40, px: 1 }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
      </Box>

      {/* Printable Certificate Canvas */}
      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
        <Box
          id="printableLandscapeCertificate"
          sx={{
            width: isPortrait ? '760px' : '1040px',
            minHeight: isPortrait ? '1060px' : '740px',
            p: `${borderMargin}mm`,
            boxSizing: 'border-box',
            fontFamily: "'Noto Sans Devanagari', 'Cinzel', 'Times New Roman', serif",
            color: '#111827',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            ...getBorderStyle(),
            ...getBackgroundStyle()
          }}
        >
          {/* Custom Uploaded Background Layer with Opacity & Fit */}
          {!design.preprintedTextOnly && backgroundType === 'custom' && customBackgroundUrl && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${customBackgroundUrl})`,
                backgroundSize: design.customBgFit || 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: (design.customBgOpacity !== undefined ? Number(design.customBgOpacity) : 100) / 100,
                pointerEvents: 'none',
                zIndex: 0
              }}
            />
          )}

          {/* 4 Corner Ornaments */}
          {!design.preprintedTextOnly && cornerStyle !== 'none' && (
            <>
              <CornerSvg style={cornerStyle} size={cornerSize} color={cornerColor} position="top-left" />
              <CornerSvg style={cornerStyle} size={cornerSize} color={cornerColor} position="top-right" />
              <CornerSvg style={cornerStyle} size={cornerSize} color={cornerColor} position="bottom-left" />
              <CornerSvg style={cornerStyle} size={cornerSize} color={cornerColor} position="bottom-right" />
            </>
          )}

          {/* Subtle Background Watermark */}
          {!design.preprintedTextOnly && watermarkOpacity > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: watermarkOpacity / 100,
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              <SchoolIcon sx={{ fontSize: isPortrait ? 380 : 340, color: primaryColor }} />
            </Box>
          )}

          {/* 1. Institutional Letterhead Header: Individual Movable Layers */}
          {showHeader && (
            <Box sx={{ position: 'relative', zIndex: 3, pb: 1, borderBottom: `1.5px solid ${accentColor}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', px: 2 }}>
                {/* Left Logo / Emblem (Independently Movable) */}
                <Box
                  sx={{
                    width: `${design.leftLogoWidth || 46}px`,
                    position: 'relative',
                    zIndex: 2,
                    transform: `translate(${elStyles.leftLogo?.x || 0}px, ${elStyles.leftLogo?.y || 0}px)`
                  }}
                >
                  {showLeftLogo && (
                    (design.leftLogoUrl || companyProfile.logoImage) ? (
                      <img src={design.leftLogoUrl || companyProfile.logoImage} alt="Logo" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    ) : (
                      <SchoolIcon sx={{ fontSize: design.leftLogoWidth || 46, color: primaryColor }} />
                    )
                  )}
                </Box>

                {/* Center Institutional Name Lines (Independently Movable) */}
                <Box sx={{ textAlign: 'center', flexGrow: 1, px: 2 }}>
                  {/* Line 1: Main Title */}
                  <Box sx={{ transform: `translate(${elStyles.headerTitle?.x || 0}px, ${elStyles.headerTitle?.y || 0}px)` }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: elStyles.headerTitle?.fontFamily || "'Times New Roman', serif",
                        fontWeight: elStyles.headerTitle?.fontWeight || 900,
                        fontStyle: elStyles.headerTitle?.fontStyle || 'normal',
                        letterSpacing: '0.04em',
                        color: elStyles.headerTitle?.color || primaryColor,
                        fontSize: elStyles.headerTitle?.fontSize ? `${elStyles.headerTitle.fontSize}px` : (isPortrait ? '1.25rem' : '1.4rem'),
                        textTransform: 'uppercase'
                      }}
                    >
                      {instituteName}
                    </Typography>
                  </Box>

                  {/* Line 2: Accreditation */}
                  {design.showAccreditation !== false && (
                    <Box sx={{ transform: `translate(${elStyles.headerSub?.x || 0}px, ${elStyles.headerSub?.y || 0}px)`, mt: 0.3 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: elStyles.headerSub?.fontSize ? `${elStyles.headerSub.fontSize}px` : '0.72rem',
                          fontWeight: elStyles.headerSub?.fontWeight || 600,
                          color: elStyles.headerSub?.color || '#475569'
                        }}
                      >
                        {accreditationText}
                      </Typography>
                    </Box>
                  )}

                  {/* Line 3: Registration & Location */}
                  {design.showAffiliation !== false && (
                    <Box sx={{ transform: `translate(${elStyles.headerAddress?.x || 0}px, ${elStyles.headerAddress?.y || 0}px)`, mt: 0.2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: elStyles.headerAddress?.fontSize ? `${elStyles.headerAddress.fontSize}px` : '0.68rem',
                          color: elStyles.headerAddress?.color || '#64748b'
                        }}
                      >
                        {affiliationCodeText}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Right Logo / CTEVT Badge (Independently Movable) */}
                <Box
                  sx={{
                    width: `${design.rightLogoWidth || 46}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    zIndex: 2,
                    transform: `translate(${elStyles.rightLogo?.x || 0}px, ${elStyles.rightLogo?.y || 0}px)`
                  }}
                >
                  {showRightLogo && (
                    design.rightLogoUrl ? (
                      <img src={design.rightLogoUrl} alt="Right Badge" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    ) : (
                      <VerifiedIcon sx={{ fontSize: design.rightLogoWidth || 46, color: accentColor }} />
                    )
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* 2. Certificate Title Banner (Movable) */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              textAlign: elStyles.title?.align || 'center',
              my: isPortrait ? 1.5 : 0.8,
              transform: `translate(${elStyles.title?.x || 0}px, ${elStyles.title?.y || 0}px)`
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: elStyles.title?.fontFamily || "'Times New Roman', serif",
                fontWeight: elStyles.title?.fontWeight || 900,
                fontStyle: elStyles.title?.fontStyle || 'normal',
                color: elStyles.title?.color || primaryColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: elStyles.title?.fontSize ? `${elStyles.title.fontSize}px` : (isPortrait ? '1.2rem' : '1.35rem'),
                mb: 0.2
              }}
            >
              {certificateTitleEn}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: accentColor,
                fontSize: '1rem',
                letterSpacing: '0.04em'
              }}
            >
              {certificateTitleNp}
            </Typography>
          </Box>

          {/* 3. Reference Tracking Bar */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              px: 3,
              py: 0.5,
              bgcolor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#334155'
            }}
          >
            <Box>
              Certificate No: <b style={{ color: primaryColor }}>{certificate.certificateNo}</b>
            </Box>
            <Box>
              Registration / TGID: <b style={{ color: primaryColor }}>{student.tgid}</b>
            </Box>
            <Box>
              Issue Date: <b>{certificate.issueDate}</b>
            </Box>
          </Box>

          {/* 4. Trainee Centerpiece & Photo Frame (Movable) */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: elStyles.photo?.preset === 'center' ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              my: isPortrait ? 1.5 : 1
            }}
          >
            {/* Photo if placed on LEFT */}
            {elStyles.photo?.preset === 'left' && (
              <Box
                sx={{
                  width: `${elStyles.photo?.width || 92}px`,
                  height: `${Math.round((elStyles.photo?.width || 92) * 1.25)}px`,
                  position: 'relative',
                  transform: `translate(${elStyles.photo?.x || 0}px, ${elStyles.photo?.y || 0}px)`
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    border: `2px solid ${elStyles.photo?.borderColor || accentColor}`,
                    borderRadius: `${elStyles.photo?.borderRadius || 4}px`,
                    p: '2px',
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <PersonIcon sx={{ fontSize: 36, color: '#94a3b8' }} />
                  )}
                </Box>
              </Box>
            )}

            {/* Left Competency Badge (if photo not on left) */}
            {elStyles.photo?.preset !== 'left' && (
              <Box sx={{ width: '96px' }}>
                {showCompetencyBadge && (
                  <Box
                    sx={{
                      border: `1.5px dashed ${accentColor}`,
                      borderRadius: 1,
                      p: '4px 8px',
                      textAlign: 'center',
                      bgcolor: '#fffbf0'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.64rem', fontWeight: 900, color: primaryColor, display: 'block' }}>
                      CTEVT LEVEL 1
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.58rem', color: '#64748b', display: 'block' }}>
                      {course?.totalHours || 390} HRS
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Center Trainee Name Highlight (Movable) */}
            <Box
              sx={{
                textAlign: elStyles.student?.align || 'center',
                flexGrow: 1,
                px: 2,
                transform: `translate(${elStyles.student?.x || 0}px, ${elStyles.student?.y || 0}px)`
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', letterSpacing: '0.04em', display: 'block' }}>
                यो प्रमाणपत्र प्रदान गरिएको छ / This is proudly awarded to:
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: elStyles.student?.fontFamily || "'Times New Roman', serif",
                  fontWeight: elStyles.student?.fontWeight || 900,
                  fontStyle: elStyles.student?.fontStyle || 'normal',
                  color: elStyles.student?.color || primaryColor,
                  letterSpacing: '0.04em',
                  fontSize: elStyles.student?.fontSize ? `${elStyles.student.fontSize}px` : (isPortrait ? '1.9rem' : '1.85rem'),
                  mt: 0.3
                }}
              >
                {student.name}
              </Typography>
              {student.nameNepali && (
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    color: accentColor,
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                    mt: 0.2
                  }}
                >
                  ({student.nameNepali})
                </Typography>
              )}
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: '#059669',
                  fontSize: '0.94rem',
                  letterSpacing: '0.05em',
                  mt: 0.3
                }}
              >
                COURSE: {(course?.title || 'Vocational Training').toUpperCase()} ({course?.totalHours || 390} HOURS)
              </Typography>
            </Box>

            {/* Photo if placed on RIGHT (Default) */}
            {elStyles.photo?.preset !== 'left' && (
              <Box
                sx={{
                  width: `${elStyles.photo?.width || 92}px`,
                  height: `${Math.round((elStyles.photo?.width || 92) * 1.25)}px`,
                  position: 'relative',
                  transform: `translate(${elStyles.photo?.x || 0}px, ${elStyles.photo?.y || 0}px)`
                }}
              >
                {showStudentPhoto && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      border: `2px solid ${elStyles.photo?.borderColor || accentColor}`,
                      borderRadius: `${elStyles.photo?.borderRadius || 4}px`,
                      p: '2px',
                      bgcolor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <>
                        <PersonIcon sx={{ fontSize: 36, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#64748b', textAlign: 'center', lineHeight: 1 }}>
                          PHOTO<br />(35×45mm)
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* 5. English & Nepali Wording Paragraphs (Movable) */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              px: 3,
              textAlign: elStyles.body?.align || 'justify',
              my: isPortrait ? 1.5 : 0.5,
              transform: `translate(${elStyles.body?.x || 0}px, ${elStyles.body?.y || 0}px)`
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: elStyles.body?.fontFamily || "'Times New Roman', serif",
                fontSize: elStyles.body?.fontSize ? `${elStyles.body.fontSize}px` : (isPortrait ? '0.88rem' : '0.86rem'),
                lineHeight: elStyles.body?.lineHeight || 1.45,
                color: elStyles.body?.color || '#1e293b',
                fontWeight: elStyles.body?.fontWeight || 'normal',
                fontStyle: elStyles.body?.fontStyle || 'normal',
                mb: 0.8
              }}
            >
              This is to certify that {isFemale ? 'Ms.' : 'Mr.'} <b>{student.name}</b>, {isFemale ? 'Daughter' : 'Son'} of Mr./Mrs. <b>{student.guardianName || student.fatherName || 'Guardian'}</b>, permanent resident of <b>{student.address || 'Kathmandu, Nepal'}</b>, has successfully completed the <b>{course?.totalHours || 390} Hours</b> vocational skills training course in <b>"{course?.title || 'Vocational Training'}"</b> conducted from <b>{group?.startDate || certificate.issueDate}</b> to <b>{group?.endDate || certificate.issueDate}</b> in accordance with the curriculum standards prescribed by the Council for Technical Education and Vocational Training (CTEVT), Nepal.
            </Typography>

            <Box sx={{ my: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Box sx={{ flexGrow: 1, height: '1px', bgcolor: '#e2e8f0' }} />
              <Box sx={{ color: accentColor, fontSize: '0.75rem' }}>❖</Box>
              <Box sx={{ flexGrow: 1, height: '1px', bgcolor: '#e2e8f0' }} />
            </Box>

            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Noto Sans Devanagari', sans-serif",
                fontSize: elStyles.body?.fontSize ? `${elStyles.body.fontSize}px` : (isPortrait ? '0.88rem' : '0.86rem'),
                lineHeight: elStyles.body?.lineHeight || 1.5,
                color: elStyles.body?.color || '#1e293b',
                fontWeight: elStyles.body?.fontWeight || 'normal',
                fontStyle: elStyles.body?.fontStyle || 'normal'
              }}
            >
              प्रमाणित गरिन्छ कि {student.address || 'काठमाडौँ'} निवासी श्री {student.guardianName || student.fatherName || 'अभिभावक'}को {isFemale ? 'सुपुत्री' : 'सुपुत्र'} {isFemale ? 'सुश्री' : 'श्री'} <b>{student.nameNepali || student.name}</b>ले यस संस्थाद्वारा मिति <b>{group?.startDate || certificate.issueDate}</b> देखि <b>{group?.endDate || certificate.issueDate}</b> सम्म सञ्चालित <b>{course?.totalHours || 390} घन्टे</b> <b>"{course?.titleNepali || course?.title || 'व्यावसायिक तालिम'}"</b> सफलतापूर्वक सम्पन्न गर्नुभएकोले यो <b>व्यावसायिक तालिम समापन प्रमाणपत्र</b> प्रदान गरिएको छ।
            </Typography>
          </Box>

          {/* 6. Footer: Dynamic QR + Official Seal (4 Modes) + Dynamic Signatories (Movable) */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              mt: isPortrait ? 2.5 : 1.2,
              pt: 1.2,
              borderTop: '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              px: 2
            }}
          >
            {/* Left: Dynamic QR Code */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                width: '26%',
                transform: `translate(${elStyles.qrCode?.x || 0}px, ${elStyles.qrCode?.y || 0}px)`
              }}
            >
              <Box sx={{ p: 0.5, bgcolor: '#ffffff', border: `1.5px solid ${primaryColor}`, borderRadius: 1 }}>
                <QRCodeSVG value={verificationUrl} size={elStyles.qrCode?.qrSize || 54} level="M" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryColor, display: 'block', fontSize: '0.7rem' }}>
                  SCAN TO VERIFY
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.62rem' }}>
                  CTEVT Accredited
                </Typography>
                <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 700, fontSize: '0.64rem' }}>
                  {certificate.certificateNo}
                </Typography>
              </Box>
            </Box>

            {/* Center: Official Seal Zone (4 Modes) */}
            {design.sealMode !== 'none' && (
              <Box
                sx={{
                  textAlign: 'center',
                  width: '32%',
                  transform: `translate(${elStyles.seal?.x || 0}px, ${elStyles.seal?.y || 0}px)`
                }}
              >
                {/* MODE 1: Scanned Real Stamp Upload */}
                {design.sealMode === 'scanned' && (design.customSealUrl || companyProfile.stampImage) && (
                  <Box
                    component="img"
                    src={design.customSealUrl || companyProfile.stampImage}
                    alt="Official Stamp"
                    sx={{
                      width: `${design.sealWidth || 84}px`,
                      height: 'auto',
                      transform: `rotate(${design.sealTilt || 0}deg)`,
                      display: 'inline-block'
                    }}
                  />
                )}

                {/* MODE 2: Reserved Blank Space for Hand Rubber Stamp (Wet Stamp) */}
                {design.sealMode === 'blank' && (
                  <Box
                    sx={{
                      width: '100px',
                      height: '60px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed rgba(203, 213, 225, 0.4)',
                      borderRadius: '50%',
                      bgcolor: 'transparent'
                    }}
                  />
                )}

                {/* MODE 3: Built-in Graphic Seal */}
                {design.sealMode === 'digital' && (
                  <Box
                    sx={{
                      display: 'inline-block',
                      p: '6px 14px',
                      border: `1.5px solid ${accentColor}`,
                      borderRadius: 2,
                      bgcolor: '#fdfbf7',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 900, color: primaryColor, display: 'block', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
                      ★ OFFICIAL SEAL ★
                    </Typography>
                    <Typography variant="caption" sx={{ color: accentColor, fontWeight: 800, fontSize: '0.66rem', display: 'block' }}>
                      {companyProfile.companyNameEn || 'GLOBAL ERA TECHNICAL SCHOOL'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.62rem', display: 'block' }}>
                      CTEVT ACCREDITED • KATHMANDU
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Right: Dynamic Signatories List (Independently Movable) */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2.5,
                width: design.sealMode === 'none' ? '68%' : '42%',
                transform: `translate(${elStyles.signatories?.x || 0}px, ${elStyles.signatories?.y || 0}px)`
              }}
            >
              {signatories.map((sig) => (
                <Box key={sig.id} sx={{ textAlign: 'center', minWidth: '110px' }}>
                  <Box
                    sx={{
                      height: 32,
                      borderBottom: sig.lineStyle === 'dashed' ? '1px dashed #64748b' : sig.lineStyle === 'none' ? 'none' : `1.5px solid ${primaryColor}`,
                      mb: 0.5
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryColor, fontSize: '0.78rem' }}>
                    {sig.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
                    {sig.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      {/* Printable CSS Helper injected for exact A4 Orientation Output */}
      <style>{`
        @page {
          size: A4 ${isPortrait ? 'portrait' : 'landscape'};
          margin: 6mm 6mm;
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
          #printableLandscapeCertificate, #printableLandscapeCertificate * {
            visibility: visible !important;
          }
          #printableLandscapeCertificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 98vh !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
