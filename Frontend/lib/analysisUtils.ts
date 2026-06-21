export interface DetectedIssue {
  name: string;
  confidence?: number;
}

export interface MarkdownSection {
  title?: string;
  items: string[];
  ordered?: boolean;
}

const labelMap: Record<string, string> = {
  whitehead: 'Whiteheads',
  whiteheads: 'Whiteheads',
  wrinkle: 'Wrinkles',
  wrinkles: 'Wrinkles',
  'dark spot': 'Dark Spots',
  'dark spots': 'Dark Spots',
  dark_spot: 'Dark Spots',
  skinredness: 'Skin Redness',
  'skin redness': 'Skin Redness',
  acne: 'Acne',
  'acne scar': 'Acne Scars',
  blackhead: 'Blackheads',
  blackheads: 'Blackheads',
  freckle: 'Freckles',
  freckles: 'Freckles',
  melasma: 'Melasma',
  nodule: 'Nodules',
  nodules: 'Nodules',
  papule: 'Papules',
  papules: 'Papules',
  pustule: 'Pustules',
  pustules: 'Pustules',
  vascular: 'Vascular',
  'dark circle': 'Dark Circles',
  eyebag: 'Eyebags',
};

export function normalizeLabel(label: string): string {
  const cleaned = label.trim().toLowerCase().replace(/[_\-]+/g, ' ');
  return labelMap[cleaned] || cleaned.replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getSeverityLabel(confidence?: number): string {
  if (confidence === undefined || confidence === null) {
    return 'Low';
  }

  if (confidence >= 0.6) {
    return 'High';
  }
  if (confidence >= 0.35) {
    return 'Moderate';
  }
  if (confidence >= 0.15) {
    return 'Mild';
  }
  return 'Low';
}

export function getSeverityColorClass(severity: string): string {
  switch (severity) {
    case 'High':
      return 'bg-red-100 text-red-700';
    case 'Moderate':
      return 'bg-orange-100 text-orange-700';
    case 'Mild':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function parseDetectedIssue(value: string): DetectedIssue {
  const raw = value.trim();
  let name = raw;
  let confidence: number | undefined;

  const pipeParts = raw.split('|').map((s) => s.trim());
  if (pipeParts.length === 2) {
    name = pipeParts[0];
    const parsed = Number(pipeParts[1].replace('%', ''));
    if (!Number.isNaN(parsed)) {
      confidence = parsed > 1 ? parsed / 100 : parsed;
    }
  } else {
    const match = raw.match(/^(.*?)[\s:]*([0-9.]+)\%?$/);
    if (match) {
      name = match[1].trim();
      const parsed = Number(match[2]);
      if (!Number.isNaN(parsed)) {
        confidence = parsed > 1 ? parsed / 100 : parsed;
      }
    }
  }

  return {
    name: normalizeLabel(name),
    confidence,
  };
}

export function deduplicateIssues(issues: DetectedIssue[]): DetectedIssue[] {
  const map = new Map<string, DetectedIssue>();
  for (const issue of issues) {
    const existing = map.get(issue.name);
    if (!existing || (issue.confidence ?? 0) > (existing.confidence ?? 0)) {
      map.set(issue.name, issue);
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
}

export function parseMarkdownSections(text: string): MarkdownSection[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;

  const flush = () => {
    if (current) {
      sections.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const boldMatch = line.match(/^\*\*(.+?)\*\*$/);
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (boldMatch) {
      flush();
      current = { title: boldMatch[1].trim(), items: [] };
      continue;
    }
    if (headingMatch) {
      flush();
      current = { title: headingMatch[1].trim(), items: [] };
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (!current) current = { items: [], ordered: true };
      current.ordered = true;
      current.items.push(orderedMatch[1].trim());
      continue;
    }

    const bulletMatch = line.match(/^[\-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!current) current = { items: [], ordered: false };
      current.items.push(bulletMatch[1].trim());
      continue;
    }

    if (!current) {
      current = { items: [line], ordered: false };
      continue;
    }
    current.items.push(line);
  }

  flush();
  return sections.length > 0 ? sections : [{ items: [text.trim()] }];
}

export function recommendationToMarkdown(sections: MarkdownSection[]): string {
  if (!sections || sections.length === 0) return '';
  return sections
    .map((s) => {
      const title = s.title ? `**${s.title}**\n\n` : '';
      const items = s.items.map((it) => `- ${it}`).join('\n');
      return `${title}${items}`;
    })
    .join('\n\n');
}
