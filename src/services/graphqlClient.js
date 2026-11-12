// Local-First & Supabase Hybrid GraphQL Client for Global Era TVET ERP
import { getSupabaseConfig } from './supabaseClient.js';
import { loadDB } from './storage.js';

export const GRAPHQL_QUERIES = {
  GET_STUDENT_DOSSIER: `
    query GetStudentDossier($studentId: String!) {
      student(id: $studentId) {
        id
        tgid
        name
        phone
        email
        gender
        photo
        admissionDate
        status
        group {
          id
          name
          shift
          status
        }
        course {
          id
          title
          totalHours
          theoryHours
          practicalHours
        }
        syllabi {
          id
          unitNo
          title
          theoryHours
          practicalHours
          totalHours
          learningOutcome
          toolsAndMaterials
          imageUrl
          mastered
        }
        attendance {
          presentDays
          absentDays
          totalDays
          percentage
        }
        ojt {
          id
          employerName
          status
          startDate
          endDate
        }
        certificate {
          id
          certificateNumber
          qrCode
          issuedDate
          status
        }
      }
    }
  `,

  GET_EMPLOYER_TALENT_POOL: `
    query GetEmployerTalentPool($occupationId: String, $minAttendance: Int) {
      talentPool(occupationId: $occupationId, minAttendance: $minAttendance) {
        id
        tgid
        name
        gender
        phone
        status
        courseTitle
        occupationName
        attendancePercentage
        masteredUnitsCount
        totalUnitsCount
        isGraduated
        skillsSummary
      }
    }
  `,

  GET_COURSE_SYLLABUS: `
    query GetCourseSyllabus($courseId: String!) {
      course(id: $courseId) {
        id
        title
        code
        totalHours
        theoryHours
        practicalHours
        effectiveFee
        syllabi {
          id
          unitNo
          title
          theoryHours
          practicalHours
          totalHours
          learningOutcome
          toolsAndMaterials
          imageUrl
        }
      }
    }
  `
};

/**
 * Execute GraphQL Query against Supabase pg_graphql or Local-First Fallback Engine
 * @param {string} query - GraphQL query string
 * @param {object} variables - Query variables
 * @returns {Promise<{ data: any, errors?: any[], source: 'supabase_pg_graphql' | 'local_first_engine' }>}
 */
export async function executeGraphQL(query, variables = {}) {
  const config = getSupabaseConfig();
  const endpoint = `${(config.url || '').replace(/\/$/, '')}/graphql/v1`;

  // 1. Attempt Supabase pg_graphql if credentials and online connection exist
  if (config.url && config.key && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiKey': config.key,
          'Authorization': `Bearer ${config.key}`
        },
        body: JSON.stringify({ query, variables })
      });

      if (response.ok) {
        const json = await response.json();
        // If pg_graphql is active and responded without schema errors
        if (json.data && (!json.errors || json.errors.length === 0)) {
          return { data: json.data, source: 'supabase_pg_graphql' };
        }
      }
    } catch (netErr) {
      // Fallback silently to local-first offline resolver
    }
  }

  // 2. High-Speed Local-First In-Memory GraphQL Resolver
  const localData = resolveLocalGraphQL(query, variables);
  return {
    data: localData,
    source: 'local_first_engine'
  };
}

/**
 * In-Memory Local-First GraphQL Resolver
 */
function resolveLocalGraphQL(query, variables = {}) {
  const db = loadDB();
  const trimmed = query.replace(/\s+/g, ' ');

  // Resolving GET_STUDENT_DOSSIER
  if (trimmed.includes('GetStudentDossier') || trimmed.includes('student(')) {
    const studentId = variables.studentId || '';
    const student = (db.students || []).find((s) => s.id === studentId || s.tgid === studentId);
    if (!student) return { student: null };

    const group = (db.trainingGroups || []).find((g) => g.id === student.groupId) || null;
    const course = (db.courses || []).find((c) => c.id === group?.courseId) || null;

    // Student Syllabi & Evaluations
    const rawSyllabi = (db.syllabi || []).filter((s) => s.courseId === course?.id);
    const evals = (db.evaluations || []).filter((e) => e.studentId === student.id);
    const syllabi = rawSyllabi.map((u) => {
      const match = evals.find((e) => e.syllabusId === u.id);
      return {
        ...u,
        mastered: match ? Boolean(match.mastered) : false
      };
    });

    // Student Attendance
    const records = (db.attendances || []).filter((a) => a.studentId === student.id);
    const totalDays = records.length;
    const presentDays = records.filter((a) => a.status === 'Present').length;
    const absentDays = records.filter((a) => a.status === 'Absent').length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // OJT Placement
    const ojt = (db.ojtPlacements || []).find((o) => o.studentId === student.id) || null;

    // Certificate
    const certificate = (db.certificates || []).find((c) => c.studentId === student.id) || null;

    return {
      student: {
        id: student.id,
        tgid: student.tgid,
        name: student.name,
        phone: student.phone,
        email: student.email || '',
        gender: student.gender || 'Not Specified',
        photo: student.photo || '',
        admissionDate: student.admissionDate || '',
        status: student.status || 'Active',
        group,
        course,
        syllabi,
        attendance: {
          presentDays,
          absentDays,
          totalDays,
          percentage
        },
        ojt,
        certificate
      }
    };
  }

  // Resolving GET_EMPLOYER_TALENT_POOL
  if (trimmed.includes('GetEmployerTalentPool') || trimmed.includes('talentPool(')) {
    const minAtt = Number(variables.minAttendance) || 0;
    const occId = variables.occupationId || '';

    const talentPool = (db.students || []).map((s) => {
      const group = (db.trainingGroups || []).find((g) => g.id === s.groupId);
      const course = (db.courses || []).find((c) => c.id === group?.courseId);
      const occupation = (db.occupations || []).find((o) => o.id === course?.occupationId);

      const records = (db.attendances || []).filter((a) => a.studentId === s.id);
      const totalDays = records.length;
      const presentDays = records.filter((a) => a.status === 'Present').length;
      const attPercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      const rawSyllabi = (db.syllabi || []).filter((syl) => syl.courseId === course?.id);
      const evals = (db.evaluations || []).filter((e) => e.studentId === s.id);
      const masteredCount = evals.filter((e) => Boolean(e.mastered)).length;

      return {
        id: s.id,
        tgid: s.tgid,
        name: s.name,
        gender: s.gender || 'Not Specified',
        phone: s.phone,
        status: s.status,
        courseTitle: course?.title || 'Vocational Training',
        occupationId: occupation?.id || '',
        occupationName: occupation?.title || 'Vocational Trade',
        attendancePercentage: attPercent,
        masteredUnitsCount: masteredCount,
        totalUnitsCount: rawSyllabi.length,
        isGraduated: s.status === 'Graduated' || attPercent >= 80,
        skillsSummary: rawSyllabi.slice(0, 3).map((u) => u.title).join(', ')
      };
    }).filter((candidate) => {
      if (occId && candidate.occupationId !== occId) return false;
      if (candidate.attendancePercentage < minAtt) return false;
      return true;
    });

    return { talentPool };
  }

  // Resolving GET_COURSE_SYLLABUS
  if (trimmed.includes('GetCourseSyllabus') || trimmed.includes('course(')) {
    const courseId = variables.courseId || '';
    const course = (db.courses || []).find((c) => c.id === courseId);
    if (!course) return { course: null };

    const syllabi = (db.syllabi || []).filter((s) => s.courseId === courseId);
    return {
      course: {
        ...course,
        syllabi
      }
    };
  }

  return {};
}

/**
 * 1-Click Helper: Fetch Complete Student Dossier via GraphQL
 */
export async function getStudentDossierGraphQL(studentId) {
  const result = await executeGraphQL(GRAPHQL_QUERIES.GET_STUDENT_DOSSIER, { studentId });
  return result?.data?.student || null;
}

/**
 * 1-Click Helper: Fetch Employer Talent Pool Candidates via GraphQL
 */
export async function getEmployerTalentPoolGraphQL(filters = {}) {
  const result = await executeGraphQL(GRAPHQL_QUERIES.GET_EMPLOYER_TALENT_POOL, filters);
  return result?.data?.talentPool || [];
}
