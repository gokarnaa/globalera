import { loadDB, saveDB } from './storage';

const UNIT_MAP_NP = {
  hours: 'घण्टा',
  hour: 'घण्टा',
  hrs: 'घण्टा',
  days: 'दिन',
  day: 'दिन',
  weeks: 'हप्ता',
  week: 'हप्ता',
  months: 'महिना',
  month: 'महिना',
  years: 'वर्ष',
  year: 'वर्ष'
};

export function formatCertificateDuration(course, mode = 'hours') {
  const totalHours = Number(course?.totalHours || 0);
  const durVal = Number(course?.durationValue || 0);
  const rawUnit = String(course?.durationUnit || '').trim();
  const unitKey = rawUnit.toLowerCase();

  const enUnit = rawUnit
    ? durVal === 1
      ? rawUnit.replace(/s$/i, '')
      : rawUnit
    : 'Months';
  const npUnit = UNIT_MAP_NP[unitKey] || 'महिना';

  const hoursEn = totalHours > 0 ? `${totalHours} Hours` : '';
  const hoursNp = totalHours > 0 ? `${totalHours} घण्टा` : '';
  const unitEn = durVal > 0 ? `${durVal} ${enUnit}` : '';
  const unitNp = durVal > 0 ? `${durVal} ${npUnit}` : '';

  if (mode === 'unit') {
    if (unitEn) return { en: unitEn, np: unitNp };
    if (hoursEn) return { en: hoursEn, np: hoursNp };
    return { en: '3 Months', np: '3 महिना' };
  }

  if (mode === 'both') {
    if (unitEn && hoursEn && unitKey !== 'hours' && unitKey !== 'hour') {
      return {
        en: `${unitEn} (${hoursEn})`,
        np: `${unitNp} (${hoursNp})`
      };
    }
    if (hoursEn) return { en: hoursEn, np: hoursNp };
    if (unitEn) return { en: unitEn, np: unitNp };
    return { en: '390 Hours', np: '390 घण्टा' };
  }

  // Default: 'hours' (smart fallback to course unit if totalHours is empty)
  if (hoursEn) return { en: hoursEn, np: hoursNp };
  if (unitEn) return { en: unitEn, np: unitNp };
  return { en: '390 Hours', np: '390 घण्टा' };
}

export function getPerformanceLabel(grade, customPerformance) {
  const custom = String(customPerformance || '').trim();
  if (custom) {
    const low = custom.toLowerCase();
    if (low.includes('excellent') || low.includes('distinction')) return { en: custom, np: 'उत्कृष्ट' };
    if (low.includes('very good') || low.includes('very-good')) return { en: custom, np: 'अति उत्तम' };
    if (low.includes('good')) return { en: custom, np: 'उत्तम' };
    return { en: custom, np: 'सन्तोषजनक' };
  }

  const g = String(grade || '').trim().toUpperCase();
  if (g === 'A+' || g === 'DISTINCTION' || g === 'EXCELLENT') {
    return { en: 'Excellent', np: 'उत्कृष्ट' };
  }
  if (g === 'A' || g === 'VERY GOOD' || g === 'VERY-GOOD' || !g) {
    return { en: 'Very Good', np: 'अति उत्तम' };
  }
  if (g === 'B+' || g === 'B' || g === 'GOOD' || g === 'FIRST') {
    return { en: 'Good', np: 'उत्तम' };
  }
  return { en: 'Satisfactory', np: 'सन्तोषजनक' };
}

export function buildCertificateBodyData({
  student = {},
  course = {},
  group = {},
  certificate = {},
  durationDisplayMode = 'hours'
}) {
  const isFemale = (student.gender || '').toLowerCase() === 'female';
  const duration = formatCertificateDuration(course, durationDisplayMode);
  const perf = getPerformanceLabel(certificate.grade, certificate.performance);

  const dob = String(student.dob || student.dateOfBirth || '').trim();
  const guardianName = String(student.guardianName || student.fatherName || 'Guardian').trim();
  const address = String(student.permanentAddress || student.address || 'Kathmandu, Nepal').trim();
  const courseTitle = String(course?.title || 'Vocational Training').trim();
  const startDate = String(group?.startDate || group?.admissionDate || certificate.issueDate || '').trim();
  const endDate = String(group?.endDate || group?.expectedEndDate || certificate.issueDate || '').trim();

  return {
    isFemale,
    studentName: String(student.name || 'Trainee').trim(),
    salutationEn: isFemale ? 'Ms.' : 'Mr.',
    relationEn: isFemale ? 'Daughter' : 'Son',
    pronounEn: isFemale ? 'her' : 'his',
    salutationNp: isFemale ? 'सुश्री' : 'श्री',
    relationNp: isFemale ? 'सुपुत्री' : 'सुपुत्र',
    dob,
    guardianName,
    address,
    courseTitle,
    startDate,
    endDate,
    durationEn: duration.en,
    durationNp: duration.np,
    performanceEn: perf.en,
    performanceNp: perf.np
  };
}

export function buildDefaultNepaliBody(data) {
  const dobPart = data.dob ? ` (जन्म मिति: ${data.dob})` : '';
  const datePart =
    data.startDate && data.endDate
      ? `मिति ${data.startDate} देखि ${data.endDate} सम्म`
      : data.endDate
      ? `मिति ${data.endDate} मा`
      : '';
  return `${data.address} निवासी श्री/श्रीमती ${data.guardianName} का ${data.relationNp}${dobPart} ${data.salutationNp} ${data.studentName} ले यस संस्थाद्वारा ${datePart} सञ्चालित ${data.durationNp}को "${data.courseTitle}" सीपमूलक तालीम सफलतापूर्वक सम्पन्न गर्नुभएकोमा यो प्रमाण-पत्र प्रदान गरिएको छ। तालीम अवधिमा उहाँको कार्यसम्पादन ${data.performanceNp} रहेको थियो।`;
}

export function getSavedNepaliBody(certificate) {
  const key = certificate?.certificateNo || certificate?.id;
  if (!key) return '';
  const db = loadDB();
  return db.settings?.certificateNepaliTexts?.[key] || '';
}

export function saveNepaliBody(certificate, nepaliText) {
  const key = certificate?.certificateNo || certificate?.id;
  if (!key) return;
  const db = loadDB();
  const nextMap = {
    ...(db.settings?.certificateNepaliTexts || {}),
    [key]: String(nepaliText || '').trim()
  };
  saveDB(
    {
      ...db,
      settings: {
        ...(db.settings || {}),
        certificateNepaliTexts: nextMap
      }
    },
    { onlyTables: ['settings'] }
  );
}

export async function generateNepaliCertificateBodyWithGemini({
  student,
  course,
  group,
  certificate,
  durationDisplayMode = 'hours'
}) {
  const data = buildCertificateBodyData({ student, course, group, certificate, durationDisplayMode });
  const fallback = buildDefaultNepaliBody(data);

  const db = loadDB();
  const bot = db.settings?.whatsappBot || {};
  const apiKey = String(bot.geminiApiKey || '').trim();

  if (!apiKey) {
    return {
      ok: false,
      text: fallback,
      message: 'Gemini API key is not configured in Settings. Loaded default Nepali template (editable).'
    };
  }

  const prompt = `You are an official Nepali certificate writer for a CTEVT-accredited technical school in Nepal.
Rewrite the following trainee details into ONE single, dignified, grammatically pure Nepali (Devanagari) certificate paragraph.

RULES:
- Output ONLY the final Nepali paragraph in Devanagari script. No quotes, no markdown, no explanation, no bullet points.
- Transliterate the trainee's name, guardian's name, address, and course name naturally into accurate Nepali Devanagari (e.g., "Rojan Tamang" -> "रोजन तामाङ", "Lisankhu Pakhar-07, Sindhupalchowk" -> "लिसंखु पाखर-०७, सिन्धुपाल्चोक").
- Convert numbers/dates into Nepali Devanagari digits (०१२३४५६७८९) naturally.
- Use "${data.relationNp}" (${data.salutationNp}) matching the trainee's gender.
- Do NOT start with "प्रमाणित गरिन्छ कि". Start gracefully with the residence: "[ठेगाना] निवासी श्री/श्रीमती [अभिभावक] का ${data.relationNp}..."
- Include DOB only if provided below.
- End with: "तालीम अवधिमा उहाँको कार्यसम्पादन ${data.performanceNp} रहेको थियो।"

TRAINEE DETAILS:
- Name: ${data.studentName}
- Gender: ${data.isFemale ? 'Female' : 'Male'}
- Date of Birth: ${data.dob || 'Not provided (omit DOB)'}
- Guardian Name: ${data.guardianName}
- Address: ${data.address}
- Course Title: ${data.courseTitle}
- Duration: ${data.durationEn} (${data.durationNp})
- Training Dates: ${data.startDate || 'N/A'} to ${data.endDate || 'N/A'}
- Performance: ${data.performanceEn} (${data.performanceNp})`;

  const models = ['gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

  for (const model of models) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 320
            }
          })
        }
      );
      if (!resp.ok) continue;
      const json = await resp.json();
      const out = json?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim();
      if (out && out.length > 20) {
        return { ok: true, text: out, model };
      }
    } catch {
      // try next model
    }
  }

  return {
    ok: false,
    text: fallback,
    message: 'Gemini API could not be reached. Loaded editable Nepali template.'
  };
}
