import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeContent {
  name?: string;
  email?: string;
  location?: string;
  summary?: string;
  experience?: Array<{
    title?: string;
    company?: string;
    period?: string;
    description?: string;
  }>;
  skills?: Array<{ name?: string } | string>;
  projects?: Array<{
    name?: string;
    description?: string;
  }>;
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
    const { resumeContent, format, resumeName } = await req.json();
    
    if (!resumeContent) {
      return new Response(JSON.stringify({ error: 'Resume content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating export for format:', format);
    console.log('Resume name:', resumeName);

    if (format === 'docx') {
      // Generate simple DOCX-compatible XML
      const documentXml = generateDocxXml(resumeContent as ResumeContent);
      
      // For a proper DOCX, we'd need to create a ZIP with multiple XML files
      // For simplicity, we'll return the document.xml content as a downloadable file
      // In production, you'd use a library or create the full DOCX structure
      
      const fileName = `${resumeName || 'resume'}.xml`;
      
      return new Response(documentXml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else if (format === 'txt') {
      // Generate plain text version
      const content = resumeContent as ResumeContent;
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
      
      const fileName = `${resumeName || 'resume'}.txt`;
      
      return new Response(textContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported format. Use docx or txt.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in export-resume function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
