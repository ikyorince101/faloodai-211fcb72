import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_STRING_LENGTH = 2000;
const MAX_ARRAY_LENGTH = 50;
const MAX_JSON_SIZE = 100 * 1024; // 100KB
const VALID_FORMATS = ["docx", "txt"] as const;

type ValidFormat = typeof VALID_FORMATS[number];

interface ExperienceItem {
  title?: string;
  company?: string;
  period?: string;
  description?: string;
}

interface SkillItem {
  name?: string;
}

interface ProjectItem {
  name?: string;
  description?: string;
}

interface ResumeContent {
  name?: string;
  email?: string;
  location?: string;
  summary?: string;
  experience?: ExperienceItem[];
  skills?: Array<SkillItem | string>;
  projects?: ProjectItem[];
}

function sanitizeString(value: unknown, maxLength: number = MAX_STRING_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength).trim();
}

function validateFormat(format: unknown): format is ValidFormat {
  return typeof format === "string" && VALID_FORMATS.includes(format as ValidFormat);
}

function validateFileName(name: unknown): string {
  if (typeof name !== "string") return "resume";
  // Only allow alphanumeric, spaces, hyphens, underscores
  const sanitized = name.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();
  return sanitized.slice(0, 100) || "resume";
}

function validateResumeContent(content: unknown): ResumeContent {
  if (!content || typeof content !== "object") {
    return {};
  }

  const raw = content as Record<string, unknown>;
  
  const validated: ResumeContent = {
    name: sanitizeString(raw.name, 200),
    email: sanitizeString(raw.email, 200),
    location: sanitizeString(raw.location, 200),
    summary: sanitizeString(raw.summary, MAX_STRING_LENGTH),
  };

  // Validate experience array
  if (Array.isArray(raw.experience)) {
    validated.experience = raw.experience.slice(0, MAX_ARRAY_LENGTH).map((exp: unknown) => {
      if (!exp || typeof exp !== "object") return {};
      const e = exp as Record<string, unknown>;
      return {
        title: sanitizeString(e.title, 200),
        company: sanitizeString(e.company, 200),
        period: sanitizeString(e.period, 100),
        description: sanitizeString(e.description, 1000),
      };
    });
  }

  // Validate skills array
  if (Array.isArray(raw.skills)) {
    validated.skills = raw.skills.slice(0, MAX_ARRAY_LENGTH).map((skill: unknown) => {
      if (typeof skill === "string") return sanitizeString(skill, 100);
      if (skill && typeof skill === "object") {
        const s = skill as Record<string, unknown>;
        return { name: sanitizeString(s.name, 100) };
      }
      return "";
    }).filter(Boolean);
  }

  // Validate projects array
  if (Array.isArray(raw.projects)) {
    validated.projects = raw.projects.slice(0, MAX_ARRAY_LENGTH).map((proj: unknown) => {
      if (!proj || typeof proj !== "object") return { name: "", description: "" };
      const p = proj as Record<string, unknown>;
      return {
        name: sanitizeString(p.name, 200),
        description: sanitizeString(p.description, 1000),
      };
    });
  }

  return validated;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateDocxXml(content: ResumeContent): string {
  const name = escapeXml(content.name || 'Your Name');
  const email = escapeXml(content.email || '');
  const location = escapeXml(content.location || '');
  const summary = escapeXml(content.summary || '');

  let experienceXml = '';
  if (content.experience && content.experience.length > 0) {
    experienceXml = content.experience.map(exp => `
      <w:p>
        <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
        <w:r><w:t>${escapeXml(exp.title || 'Position')}</w:t></w:r>
      </w:p>
      <w:p>
        <w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(exp.company || '')} | ${escapeXml(exp.period || '')}</w:t></w:r>
      </w:p>
      ${exp.description ? `<w:p><w:r><w:t>${escapeXml(exp.description)}</w:t></w:r></w:p>` : ''}
    `).join('');
  }

  let skillsXml = '';
  if (content.skills && content.skills.length > 0) {
    const skillsList = content.skills.map(s => typeof s === 'string' ? s : s.name || '').filter(Boolean);
    skillsXml = `<w:p><w:r><w:t>${escapeXml(skillsList.join(' • '))}</w:t></w:r></w:p>`;
  }

  let projectsXml = '';
  if (content.projects && content.projects.length > 0) {
    projectsXml = content.projects.map(proj => `
      <w:p>
        <w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(proj.name || 'Project')}</w:t></w:r>
      </w:p>
      ${proj.description ? `<w:p><w:r><w:t>${escapeXml(proj.description)}</w:t></w:r></w:p>` : ''}
    `).join('');
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>${name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>${email}${location ? ` | ${location}` : ''}</w:t></w:r>
    </w:p>
    
    ${summary ? `
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>SUMMARY</w:t></w:r></w:p>
    <w:p><w:r><w:t>${summary}</w:t></w:r></w:p>
    ` : ''}
    
    ${experienceXml ? `
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>EXPERIENCE</w:t></w:r></w:p>
    ${experienceXml}
    ` : ''}
    
    ${skillsXml ? `
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>SKILLS</w:t></w:r></w:p>
    ${skillsXml}
    ` : ''}
    
    ${projectsXml ? `
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>PROJECTS</w:t></w:r></w:p>
    ${projectsXml}
    ` : ''}
    
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check content length before parsing
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_JSON_SIZE) {
      return new Response(JSON.stringify({ error: 'Request body too large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { resumeContent, format, resumeName } = body;
    
    // Validate format
    if (!validateFormat(format)) {
      return new Response(JSON.stringify({ error: 'Unsupported format. Use docx or txt.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize resume content
    const validatedContent = validateResumeContent(resumeContent);
    const safeFileName = validateFileName(resumeName);

    console.log('Generating export for format:', format);
    console.log('Resume name:', safeFileName);

    if (format === 'docx') {
      const documentXml = generateDocxXml(validatedContent);
      const fileName = `${safeFileName}.xml`;
      
      return new Response(documentXml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else if (format === 'txt') {
      const content = validatedContent;
      let textContent = '';
      
      textContent += `${content.name || 'Your Name'}\n`;
      textContent += `${content.email || ''}${content.location ? ` | ${content.location}` : ''}\n\n`;
      
      if (content.summary) {
        textContent += `SUMMARY\n${'-'.repeat(40)}\n${content.summary}\n\n`;
      }
      
      if (content.experience && content.experience.length > 0) {
        textContent += `EXPERIENCE\n${'-'.repeat(40)}\n`;
        content.experience.forEach(exp => {
          textContent += `${exp.title || 'Position'}\n`;
          textContent += `${exp.company || ''} | ${exp.period || ''}\n`;
          if (exp.description) textContent += `${exp.description}\n`;
          textContent += '\n';
        });
      }
      
      if (content.skills && content.skills.length > 0) {
        textContent += `SKILLS\n${'-'.repeat(40)}\n`;
        const skillsList = content.skills.map(s => typeof s === 'string' ? s : s.name || '').filter(Boolean);
        textContent += `${skillsList.join(' • ')}\n\n`;
      }
      
      if (content.projects && content.projects.length > 0) {
        textContent += `PROJECTS\n${'-'.repeat(40)}\n`;
        content.projects.forEach(proj => {
          textContent += `${proj.name || 'Project'}\n`;
          if (proj.description) textContent += `${proj.description}\n`;
          textContent += '\n';
        });
      }
      
      const fileName = `${safeFileName}.txt`;
      
      return new Response(textContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported format. Use docx or txt.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in export-resume function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
