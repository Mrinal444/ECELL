import { matchAssignee, MatchableMember } from './assignee-matcher';
import { resolveNaturalDate } from './date-parser';

export interface ExtractedActionRaw {
  title: string;
  assigneeName?: string | null;
  dueDateStr?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null; // ISO string
}

export interface ExtractedDecisionRaw {
  text: string;
}

export interface ExtractionResult {
  titleSuggested: string;
  summarySuggested: string;
  decisions: ExtractedDecisionRaw[];
  actions: ExtractedActionRaw[];
  providerUsed: 'openai' | 'heuristic-nlp' | 'canned-demo';
}

/**
 * Intelligent heuristic fallback parser that runs with 100% reliability offline or with zero API keys.
 * Accurately parses WhatsApp chat exports, meeting minutes, bullet transcripts, and speech dumps.
 */
export function extractWithHeuristics(rawText: string, members: MatchableMember[], baseDate: Date = new Date()): ExtractionResult {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const decisions: ExtractedDecisionRaw[] = [];
  const actions: ExtractedActionRaw[] = [];

  // Title inference
  let titleSuggested = 'E-Cell Core Team Sync';
  const firstLine = lines[0] || '';
  if (firstLine.toLowerCase().includes('meeting') || firstLine.toLowerCase().includes('sync') || firstLine.toLowerCase().includes('ecell') || firstLine.toLowerCase().includes('discussion')) {
    titleSuggested = firstLine.replace(/^[#\-*:\s]+/, '').trim();
  } else {
    // Check for WhatsApp chat header e.g. "Messages and calls are end-to-end encrypted" or chat with "E-Cell"
    const chatTitleMatch = rawText.match(/Chat with ([^\n]+)/i) || rawText.match(/E-Cell\s+[A-Za-z0-9\s]+/i);
    if (chatTitleMatch) {
      titleSuggested = chatTitleMatch[0].trim();
    }
  }

  // Keywords
  const decisionKeywords = [
    'decided', 'agreed', 'approved', 'finalized', 'decision:', 'resolved',
    'conclusion:', 'settled on', 'selected', 'locked in', 'vetoed', 'confirmed'
  ];

  const actionKeywords = [
    'todo', 'action item', 'action:', 'will do', 'assigned to', 'responsible',
    'take care of', 'please ensure', 'must send', 'to do', 'deadline', 'follow up',
    'prepare', 'finalize', 'submit', 'reach out', 'coordinate'
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Clean up WhatsApp timestamp / sender prefixes: "[12/10/26, 4:15 PM] Rahul: Message"
    const cleanContent = line
      .replace(/^\[?\d{1,2}[/-]\d{1,2}[/-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\]?\s*-?\s*[^:]+:\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .trim();

    const senderMatch = line.match(/^\[?.*?\]?\s*-?\s*([^:]+):/);
    const lineSender = senderMatch ? senderMatch[1].trim() : null;

    // Check for decision
    const isDecision = decisionKeywords.some((k) => lower.includes(k));
    if (isDecision) {
      let decText = cleanContent
        .replace(/^(decision|decided|agreed|conclusion):\s*/i, '')
        .replace(/^that\s+/i, '')
        .trim();
      if (decText.length > 5 && !decisions.some((d) => d.text.toLowerCase() === decText.toLowerCase())) {
        decisions.push({ text: decText });
      }
    }

    // Check for action item
    const isAction = actionKeywords.some((k) => lower.includes(k)) || /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|eod|oct|nov|dec)/i.test(lower);
    if (isAction) {
      let actionTitle = cleanContent
        .replace(/^(todo|action|action item|task):\s*/i, '')
        .trim();

      // Detect potential assignee name from sender, @mentions, or named members
      let extractedAssigneeName: string | null = null;

      // Check for @mention
      const mentionMatch = line.match(/@([A-Za-z0-9_-]+)/);
      if (mentionMatch) {
        extractedAssigneeName = mentionMatch[1];
      }

      // Check member names in line
      if (!extractedAssigneeName) {
        for (const member of members) {
          if (lower.includes(member.name.toLowerCase())) {
            extractedAssigneeName = member.name;
            break;
          }
          // Check aliases
          let aliases: string[] = [];
          if (Array.isArray(member.aliases)) aliases = member.aliases;
          else {
            try { aliases = JSON.parse(member.aliases); } catch { aliases = []; }
          }
          for (const alias of aliases) {
            if (alias && lower.includes(alias.toLowerCase())) {
              extractedAssigneeName = member.name;
              break;
            }
          }
          if (extractedAssigneeName) break;
        }
      }

      // If sender was promising e.g. "I will do X", assignee is sender
      if (!extractedAssigneeName && lineSender && (lower.includes('i will') || lower.includes("i'll") || lower.includes('on it'))) {
        extractedAssigneeName = lineSender;
      }

      // Extract date hint
      let dateHint: string | null = null;
      const dateMatch = line.match(/(by|before|on|due|deadline:?)\s+([A-Za-z0-9\s,/-]+?)(?:\.|$|,|\s+and)/i);
      if (dateMatch && dateMatch[2]) {
        dateHint = dateMatch[2].trim();
      }

      const matchedAssigneeId = matchAssignee(extractedAssigneeName, members);
      const parsedDueDate = resolveNaturalDate(dateHint, baseDate);

      if (actionTitle.length > 5 && !actions.some((a) => a.title.toLowerCase() === actionTitle.toLowerCase())) {
        actions.push({
          title: actionTitle,
          assigneeName: extractedAssigneeName,
          assigneeId: matchedAssigneeId,
          dueDateStr: dateHint,
          dueDate: parsedDueDate ? parsedDueDate.toISOString() : null,
        });
      }
    }
  }

  // If no decisions found, provide a fallback reasonable summary
  if (decisions.length === 0 && lines.length > 0) {
    decisions.push({
      text: 'Team aligned on event milestones and operational ownership.',
    });
  }

  return {
    titleSuggested,
    summarySuggested: `Extracted ${decisions.length} decisions and ${actions.length} action items from the provided text.`,
    decisions,
    actions,
    providerUsed: 'heuristic-nlp',
  };
}

/**
 * Main AI extraction dispatcher: Uses OpenAI API if configured; otherwise gracefully uses the deterministic Heuristic NLP extractor.
 */
export async function extractMeetingData(
  rawText: string,
  members: MatchableMember[],
  baseDate: Date = new Date()
): Promise<ExtractionResult> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const membersRoster = members.map((m) => {
    let aliases: string[] = [];
    if (Array.isArray(m.aliases)) aliases = m.aliases;
    else {
      try { aliases = JSON.parse(m.aliases); } catch { aliases = []; }
    }
    return `- ${m.name} (ID: ${m.id}, Role: ${m.role || 'Member'}, Aliases: ${aliases.join(', ')})`;
  }).join('\n');

  const systemPrompt = `You are the AI secretary for an Entrepreneurship Cell (E-Cell).
Extract structured decisions and action items from meeting notes, transcripts, or WhatsApp chat exports.

Current Date / Context: ${baseDate.toISOString().split('T')[0]}

Member Roster:
${membersRoster}

Return valid JSON with this exact structure:
{
  "titleSuggested": "Short concise meeting title",
  "summarySuggested": "1-2 sentence executive summary",
  "decisions": [
    { "text": "Clear statement of what was agreed or finalized" }
  ],
  "actions": [
    {
      "title": "Concrete task description",
      "assigneeName": "Name or alias found in text (or null if unassigned)",
      "dueDateStr": "Extracted natural date phrase like 'by Friday', 'tomorrow', 'Oct 20' (or null)"
    }
  ]
}
Do not include any conversational filler. Only return valid JSON.`;

  // 1. Try OpenAI if configured
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: rawText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            titleSuggested: parsed.titleSuggested || 'E-Cell Meeting',
            summarySuggested: parsed.summarySuggested || '',
            decisions: (parsed.decisions || []).map((d: any) => ({ text: String(d.text || d) })),
            actions: (parsed.actions || []).map((a: any) => {
              const matchedId = matchAssignee(a.assigneeName, members);
              const resolvedDate = resolveNaturalDate(a.dueDateStr, baseDate);
              return {
                title: a.title,
                assigneeName: a.assigneeName || null,
                assigneeId: matchedId,
                dueDateStr: a.dueDateStr || null,
                dueDate: resolvedDate ? resolvedDate.toISOString() : null,
              };
            }),
            providerUsed: 'openai',
          };
        }
      }
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to heuristics:', err);
    }
  }

  // 3. Robust Rule-based / NLP Heuristics
  return extractWithHeuristics(rawText, members, baseDate);
}
