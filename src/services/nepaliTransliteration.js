/**
 * Nepali Phonetic Transliteration & Certificate Text Utilities
 * Organization: Global Era Multi Service Pvt. Ltd. / Global Era Technical School
 */

// ============================================================================
// 1. COMPREHENSIVE NEPALI NAME DICTIONARY (Common First & Last Names)
// ============================================================================
const DICTIONARY = {
  // Common First Names (Male)
  basanta: ['बसन्त', 'वसन्त'],
  vasanta: ['वसन्त', 'बसन्त'],
  ram: ['राम'],
  shyam: ['श्याम'],
  hari: ['हरि'],
  krishna: ['कृष्ण'],
  bishnu: ['विष्णु', 'बिष्णु'],
  vishnu: ['विष्णु', 'बिष्णु'],
  shiva: ['शिव'],
  bhim: ['भीम', 'भिम'],
  bahadur: ['बहादुर'],
  prasad: ['प्रसाद'],
  kumar: ['कुमार'],
  chandra: ['चन्द्र'],
  raj: ['राज'],
  lal: ['लाल'],
  man: ['मान'],
  singh: ['सिंह'],
  jung: ['जंग'],
  deepak: ['दीपक', 'दिपक'],
  dipak: ['दिपक', 'दीपक'],
  prakash: ['प्रकाश'],
  suresh: ['सुरेश'],
  mahesh: ['महेश'],
  rajesh: ['राजेश'],
  santosh: ['सन्तोष', 'सन्तोष'],
  manoj: ['मनोज'],
  bikash: ['विकास', 'बिकास'],
  vikash: ['विकास', 'बिकास'],
  binod: ['विनोद', 'बिनोद'],
  vinod: ['विनोद', 'बिनोद'],
  anil: ['अनिल'],
  sunil: ['सुनिल'],
  amit: ['अमित'],
  suman: ['सुमन'],
  kiran: ['किरण'],
  bimal: ['विमल', 'बिमल'],
  vimal: ['विमल', 'बिमल'],
  rabin: ['रबिन'],
  nabin: ['नवीन', 'नबिन'],
  dipendra: ['दीपेन्द्र', 'दिपेन्द्र'],
  birendra: ['वीरेन्द्र', 'बिरेन्द्र'],
  surendra: ['सुरेन्द्र'],
  narendra: ['नरेन्द्र'],
  rajendra: ['राजेन्द्र'],
  indra: ['इन्द्र'],
  arjun: ['अर्जुन'],
  bharat: ['भरत'],
  khem: ['खेम'],
  madan: ['मदन'],
  keshav: ['केशव'],
  madhav: ['माधव'],
  gopal: ['गोपाल'],
  govinda: ['गोविन्द'],
  ganesh: ['गणेश'],
  dinesh: ['दिनेश'],
  naresh: ['नरेश'],
  sanjay: ['सञ्जय', 'सन्जय'],
  ajay: ['अजय'],
  bijay: ['विजय', 'बिजय'],
  vijay: ['विजय', 'बिजय'],
  pawan: ['पवन'],
  mohan: ['मोहन'],
  sohan: ['सोहन'],
  roshan: ['रोशन'],
  karan: ['करण'],
  ashok: ['अशोक'],
  sandip: ['सन्दीप', 'सन्दिल'],
  sandeep: ['सन्दीप'],
  pradeep: ['प्रदीप'],
  kul: ['कुल'],
  dambar: ['डम्बर'],
  tek: ['टेक'],
  top: ['तोप'],
  netra: ['नेत्र'],
  padam: ['पदम'],
  khadga: ['खड्ग'],

  // Common First Names (Female)
  sunita: ['सुनिता', 'सुनीता'],
  sita: ['सीता', 'सिता'],
  gita: ['गीता', 'गिता'],
  rita: ['रीता', 'रिता'],
  anita: ['अनिता'],
  puja: ['पूजा', 'पुजा'],
  pooja: ['पूजा', 'पुजा'],
  manju: ['मञ्जु', 'मन्जु'],
  sarmila: ['शर्मिला'],
  sharmila: ['शर्मिला'],
  kalpana: ['कल्पना'],
  sabita: ['सविता', 'सबिता'],
  savita: ['सविता'],
  sangita: ['संगीता', 'संगिता'],
  sangeeta: ['संगीता'],
  sushma: ['सुष्मा', 'सुस्मा'],
  susma: ['सुस्मा', 'सुष्मा'],
  kabita: ['कविता'],
  kavita: ['कविता'],
  roshani: ['रोशनी'],
  roshni: ['रोशनी'],
  pratima: ['प्रतिमा'],
  pramila: ['प्रमिला'],
  bina: ['बीना', 'बिना'],
  mina: ['मीना', 'मिना'],
  shanti: ['शान्ति'],
  laxmi: ['लक्ष्मी'],
  lakshmi: ['लक्ष्मी'],
  sarita: ['सरिता'],
  maya: ['माया'],
  asha: ['आशा'],
  uma: ['उमा'],
  aarati: ['आरती'],
  aarti: ['आरती'],
  anjali: ['अञ्जली', 'अन्जली'],
  asmita: ['अस्मिता'],
  karuna: ['करुणा'],
  namrata: ['नम्रता'],
  renuka: ['रेनुका'],
  radhika: ['राधिका'],
  mamata: ['ममता'],
  kusum: ['कुसुम'],
  alisha: ['अलिसा', 'अलिषा'],
  dikshya: ['दीक्षा', 'दिक्षा'],
  deekshya: ['दीक्षा'],
  sristi: ['सृष्टि'],
  srishti: ['सृष्टि'],
  sneha: ['स्नेहा'],
  kumari: ['कुमारी'],
  devi: ['देवी'],
  rupa: ['रूपा', 'रुपा'],
  bina: ['बीना'],
  dipa: ['दीपा', 'दिपा'],
  deepa: ['दीपा'],
  manu: ['मनु'],
  menuka: ['मेनुका'],
  prabha: ['प्रभा'],
  rina: ['रिना', 'रीना'],
  bipana: ['बिपना', 'विपना'],
  vipana: ['विपना'],

  // Common Surnames (थर)
  sharma: ['शर्मा'],
  thapa: ['थापा'],
  tamang: ['तामाङ'],
  magar: ['मगर'],
  shrestha: ['श्रेष्ठ'],
  rai: ['राई'],
  gurung: ['गुरुङ'],
  bhandari: ['भण्डारी'],
  adhikari: ['अधिकारी'],
  lama: ['लामा'],
  chaudhary: ['चौधरी'],
  poudel: ['पौडेल'],
  paudel: ['पौडेल'],
  subedi: ['सुवेदी', 'सुबेदी'],
  pokharel: ['पोखरेल', 'पोख्रेल'],
  pokhrel: ['पोख्रेल', 'पोखरेल'],
  khadka: ['खड्का'],
  karki: ['कार्की'],
  bista: ['विष्ट', 'बिष्ट'],
  pradhan: ['प्रधान'],
  giri: ['गिरी', 'गिरि'],
  ghimire: ['घिमिरे'],
  dahal: ['दाहाल'],
  joshi: ['जोशी'],
  mandal: ['मण्डल'],
  yadav: ['यादव'],
  shah: ['शाह'],
  shahi: ['शाही'],
  rana: ['राणा'],
  rokaya: ['रोकाया'],
  pun: ['पुन'],
  rijal: ['रिजाल'],
  tiwari: ['तिवारी'],
  regmi: ['रेग्मी'],
  bhattarai: ['भट्टराई'],
  chhetri: ['क्षेत्री'],
  kshetri: ['क्षेत्री'],
  acharya: ['आचार्य'],
  neupane: ['न्यौपाने'],
  sapkota: ['सापकोटा'],
  pandey: ['पाण्डे', 'पाण्डेय'],
  ghale: ['घले'],
  dangi: ['डाँगी'],
  oli: ['ओली'],
  basyal: ['बस्याल'],
  kafle: ['काफ्ले'],
  kandel: ['कँडेल'],
  baral: ['बराल'],
  parajuli: ['पराजुली'],
  kunwar: ['कुँवर'],
  kharel: ['खरेल'],
  dhami: ['धामी'],
  bogati: ['बोगटी'],
  thakuri: ['ठकुरी'],
  gautam: ['गौतम'],
  khanal: ['खनाल'],
  basnet: ['बस्नेत'],
  pandit: ['पण्डित'],
  kc: ['के.सी.', 'केसी'],
  'k.c.': ['के.सी.'],
  khadgi: ['खड्गी'],
  maharjan: ['महर्जन'],
  dangol: ['डंगोल'],
  shakya: ['शाक्य'],
  bajracharya: ['बज्राचार्य'],
  dhaubhadel: ['धौभदेल'],
  khatri: ['खत्री'],
  raut: ['राउत'],
  baniya: ['बानियाँ', 'बानिया'],
  bhatt: ['भट्ट'],
  devkota: ['देवकोटा'],
  kaphle: ['काफ्ले'],
  bhatta: ['भट्ट']
};

// ============================================================================
// 2. PHONETIC RULE-BASED TRANSLITERATOR (Fallback Engine)
// ============================================================================
const CONSONANTS = [
  { en: 'ksha', np: 'क्ष' },
  { en: 'chha', np: 'छ' },
  { en: 'chh', np: 'छ' },
  { en: 'kh', np: 'ख' },
  { en: 'gh', np: 'घ' },
  { en: 'ng', np: 'ङ' },
  { en: 'ch', np: 'च' },
  { en: 'jh', np: 'झ' },
  { en: 'th', np: 'थ' },
  { en: 'dh', np: 'ध' },
  { en: 'ph', np: 'फ' },
  { en: 'bh', np: 'भ' },
  { en: 'sh', np: 'श' },
  { en: 'gy', np: 'ज्ञ' },
  { en: 'tr', np: 'त्र' },
  { en: 'pr', np: 'प्र' },
  { en: 'kr', np: 'क्र' },
  { en: 'gr', np: 'ग्र' },
  { en: 'dr', np: 'द्र' },
  { en: 'br', np: 'ब्र' },
  { en: 'shr', np: 'श्र' },
  { en: 'k', np: 'क' },
  { en: 'g', np: 'ग' },
  { en: 'j', np: 'ज' },
  { en: 't', np: 'त' },
  { en: 'd', np: 'द' },
  { en: 'n', np: 'न' },
  { en: 'p', np: 'प' },
  { en: 'f', np: 'फ' },
  { en: 'b', np: 'ब' },
  { en: 'm', np: 'म' },
  { en: 'y', np: 'य' },
  { en: 'r', np: 'र' },
  { en: 'l', np: 'ल' },
  { en: 'w', np: 'व' },
  { en: 'v', np: 'व' },
  { en: 's', np: 'स' },
  { en: 'h', np: 'ह' }
];

const VOWEL_MATRAS = [
  { en: 'aa', matra: 'ा', initial: 'आ' },
  { en: 'ee', matra: 'ी', initial: 'ई' },
  { en: 'oo', matra: 'ू', initial: 'ऊ' },
  { en: 'ai', matra: 'ै', initial: 'ऐ' },
  { en: 'au', matra: 'ौ', initial: 'औ' },
  { en: 'a', matra: '', initial: 'अ' },
  { en: 'i', matra: 'ि', initial: 'इ' },
  { en: 'u', matra: 'ु', initial: 'उ' },
  { en: 'e', matra: 'े', initial: 'ए' },
  { en: 'o', matra: 'ो', initial: 'ओ' }
];

function phoneticTransliterateWord(word) {
  let clean = word.toLowerCase().trim();
  if (!clean) return '';

  let out = '';
  let i = 0;
  let isStart = true;

  while (i < clean.length) {
    let matchedConsonant = null;
    for (const c of CONSONANTS) {
      if (clean.startsWith(c.en, i)) {
        matchedConsonant = c;
        break;
      }
    }

    if (matchedConsonant) {
      i += matchedConsonant.en.length;
      isStart = false;

      // Look for following vowel
      let matchedVowel = null;
      for (const v of VOWEL_MATRAS) {
        if (clean.startsWith(v.en, i)) {
          matchedVowel = v;
          break;
        }
      }

      if (matchedVowel) {
        out += matchedConsonant.np + matchedVowel.matra;
        i += matchedVowel.en.length;
      } else {
        // If consonant followed by consonant or end
        if (i < clean.length) {
          out += matchedConsonant.np + '्';
        } else {
          out += matchedConsonant.np;
        }
      }
    } else {
      // Standalone vowel
      let matchedVowel = null;
      for (const v of VOWEL_MATRAS) {
        if (clean.startsWith(v.en, i)) {
          matchedVowel = v;
          break;
        }
      }

      if (matchedVowel) {
        out += isStart ? matchedVowel.initial : matchedVowel.matra;
        i += matchedVowel.en.length;
        isStart = false;
      } else {
        out += clean[i];
        i++;
      }
    }
  }

  return out;
}

// ============================================================================
// 3. PUBLIC API: GET SUGGESTIONS FOR FULL NAME
// ============================================================================
/**
 * Takes English name (e.g., "Basanta Kumar Thapa") and returns list of top Nepali suggestions.
 * e.g., ["बसन्त कुमार थापा", "वसन्त कुमार थापा"]
 */
export function getTransliterationSuggestions(fullName) {
  if (!fullName || typeof fullName !== 'string') return [];
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // Get options for each word
  const wordOptions = words.map((w) => {
    const key = w.toLowerCase().replace(/[^a-z.]/g, '');
    if (DICTIONARY[key]) {
      return DICTIONARY[key];
    }
    const phonetic = phoneticTransliterateWord(key);
    return [phonetic || w];
  });

  // Cartesian product of options (limited to top 4 combinations)
  let results = [''];
  for (const opts of wordOptions) {
    const next = [];
    for (const r of results) {
      for (const o of opts) {
        next.push(r ? `${r} ${o}` : o);
      }
    }
    results = next.slice(0, 4);
  }

  return results;
}

// ============================================================================
// 4. GENDER-BASED GUARDIAN & TRAINEE RELATION TEXT (NO GUESSWORK)
// ============================================================================
export function getGuardianRelationMeta(gender) {
  const g = (gender || '').toLowerCase();
  if (g === 'female' || g === 'f') {
    return {
      relationNp: 'सुपुत्री',
      relationEn: 'Daughter of',
      titleNp: 'सुश्री',
      titleEn: 'Ms.',
      pronounEn: 'her',
      pronounSubjectEn: 'She'
    };
  }
  if (g === 'male' || g === 'm') {
    return {
      relationNp: 'सुपुत्र',
      relationEn: 'Son of',
      titleNp: 'श्री',
      titleEn: 'Mr.',
      pronounEn: 'his',
      pronounSubjectEn: 'He'
    };
  }
  return {
    relationNp: 'प्रशिक्षार्थी',
    relationEn: 'Trainee',
    titleNp: '',
    titleEn: '',
    pronounEn: 'their',
    pronounSubjectEn: 'They'
  };
}

// ============================================================================
// 5. APPROVED STATIC BILINGUAL CERTIFICATE PARAGRAPH
// ============================================================================
export function generateBilingualCertificateWording({
  studentNameEn = 'Sunita Sharma',
  studentNameNp = 'सुनिता शर्मा',
  guardianNameEn = 'Hari Sharma',
  guardianNameNp = 'हरि शर्मा',
  gender = 'female',
  addressEn = 'Gokarneshwor-05, Kathmandu',
  addressNp = 'गोकर्णेश्वर-०५, काठमाडौँ',
  courseTitleEn = 'Basic Beautician Training',
  courseTitleNp = 'आधारभूत ब्युटिसियन तालिम',
  trainingHours = 390,
  durationMonths = 3,
  startDate = '2026-06-01',
  endDate = '2026-09-01',
  grade = 'Distinction (A+)'
}) {
  const meta = getGuardianRelationMeta(gender);

  // Official English Paragraph
  const paragraphEn =
    `This is to certify that ${meta.titleEn} ${studentNameEn}, ${meta.relationEn} ${guardianNameEn}, ` +
    `resident of ${addressEn}, has successfully completed the ${trainingHours}-Hour (${durationMonths} Months) ` +
    `Vocational Skills Training Course in "${courseTitleEn}" conducted from ${startDate} to ${endDate} ` +
    `and secured Grade: ${grade} in accordance with CTEVT and National TVET standards.`;

  // Official Nepali Paragraph
  const paragraphNp =
    `प्रमाणित गरिन्छ कि ${addressNp} निवासी श्री ${guardianNameNp}को ${meta.relationNp} ` +
    `${meta.titleNp} ${studentNameNp}ले यस संस्थाद्वारा मिति ${startDate} देखि ${endDate} सम्म सञ्चालित ` +
    `${durationMonths} महिने (${trainingHours} घण्टा) को "${courseTitleNp}" सफलतापूर्वक सम्पन्न गरी ` +
    `उत्कृष्ट श्रेणी (${grade}) हासिल गर्नुभएको छ।`;

  return {
    meta,
    paragraphEn,
    paragraphNp
  };
}
