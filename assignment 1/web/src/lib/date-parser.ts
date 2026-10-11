import {
  addDays,
  addWeeks,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  isTomorrow,
  nextDay,
  parse,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  subDays,
} from 'date-fns';

const DAY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

/**
 * Parses natural language dates ("by Friday", "tomorrow", "next Monday", "in 3 days", "Oct 15")
 * against a reference base date (e.g. meeting start date or today).
 */
export function resolveNaturalDate(dateString: string | null | undefined, baseDate: Date = new Date()): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;

  const raw = dateString.trim().toLowerCase();
  if (!raw || raw === 'none' || raw === 'tbd' || raw === 'no deadline' || raw === 'asap') {
    return null;
  }

  // Check if it's already an ISO or standard date string
  const parsedDirect = new Date(dateString);
  if (!isNaN(parsedDirect.getTime()) && dateString.length >= 8 && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return endOfDay(parsedDirect);
  }

  // Relative keywords
  if (raw.includes('today') || raw.includes('eod') || raw.includes('end of day') || raw.includes('tonight')) {
    return endOfDay(baseDate);
  }

  if (raw.includes('tomorrow')) {
    if (raw.includes('day after')) {
      return endOfDay(addDays(baseDate, 2));
    }
    return endOfDay(addDays(baseDate, 1));
  }

  // "in X days"
  const inDaysMatch = raw.match(/in\s+(\d+)\s+day/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    return endOfDay(addDays(baseDate, days));
  }

  // "in X weeks" or "next week"
  const inWeeksMatch = raw.match(/in\s+(\d+)\s+week/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1], 10);
    return endOfDay(addWeeks(baseDate, weeks));
  }
  if (raw.includes('next week')) {
    return endOfDay(addWeeks(baseDate, 1));
  }

  // Day of the week matching (e.g. "by friday", "next monday", "this thursday")
  for (const [dayName, dayIndex] of Object.entries(DAY_MAP)) {
    if (raw.includes(dayName)) {
      if (raw.includes('next ' + dayName)) {
        // next week's specific day
        const thisNext = nextDay(baseDate, dayIndex);
        return endOfDay(addDays(thisNext, 7));
      }
      return endOfDay(nextDay(baseDate, dayIndex));
    }
  }

  // Try parsing common month-day formats e.g. "15 Oct", "Oct 15", "October 20th"
  const cleanedMonthStr = raw.replace(/(th|st|nd|rd)/g, '').replace(/by|before|on/g, '').trim();
  const formatsToTry = [
    'd MMM yyyy',
    'd MMMM yyyy',
    'MMM d yyyy',
    'MMMM d yyyy',
    'd MMM',
    'd MMMM',
    'MMM d',
    'MMMM d',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
  ];

  const currentYear = baseDate.getFullYear();
  for (const fmt of formatsToTry) {
    try {
      const parsed = parse(cleanedMonthStr, fmt, baseDate);
      if (!isNaN(parsed.getTime())) {
        // If year was not part of format, check if we need to adjust year
        if (!fmt.includes('yyyy') && parsed.getMonth() < baseDate.getMonth()) {
          parsed.setFullYear(currentYear + 1);
        } else if (!fmt.includes('yyyy')) {
          parsed.setFullYear(currentYear);
        }
        return endOfDay(parsed);
      }
    } catch {
      // continue
    }
  }

  return null;
}

export function getDueStatus(
  dueDate: Date | string | null | undefined,
  now: Date = new Date()
): { isOverdue: boolean; isDueSoon: boolean; text: string } {
  if (!dueDate) {
    return { isOverdue: false, isDueSoon: false, text: 'No deadline' };
  }

  const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);

  if (isBefore(d, startToday)) {
    const daysOverdue = Math.max(
      1,
      Math.floor((startToday.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      isOverdue: true,
      isDueSoon: false,
      text: `${daysOverdue}d overdue`,
    };
  }

  if (isToday(d) || (isAfter(d, startToday) && isBefore(d, endToday))) {
    return { isOverdue: false, isDueSoon: true, text: 'Due today' };
  }

  if (isTomorrow(d)) {
    return { isOverdue: false, isDueSoon: true, text: 'Due tomorrow' };
  }

  const in48Hours = addDays(now, 2);
  if (isBefore(d, in48Hours)) {
    return { isOverdue: false, isDueSoon: true, text: 'Due soon' };
  }

  return { isOverdue: false, isDueSoon: false, text: format(d, 'MMM d') };
}

export type ActionDueStatus = 'overdue' | 'due_today' | 'due_soon' | 'upcoming' | 'no_date' | 'completed';

export function getActionDueStatus(
  dueDate: Date | string | null | undefined,
  completed: boolean = false,
  now: Date = new Date()
): { status: ActionDueStatus; label: string; chipClass: string } {
  if (completed) {
    return {
      status: 'completed',
      label: 'Completed',
      chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (!dueDate) {
    return {
      status: 'no_date',
      label: 'No Deadline',
      chipClass: 'bg-stone-100 text-stone-600 border-stone-200',
    };
  }

  const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);

  if (isBefore(d, startToday)) {
    const daysOverdue = Math.max(1, Math.floor((startToday.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      status: 'overdue',
      label: `${daysOverdue}d overdue`,
      chipClass: 'bg-red-50 text-red-700 border-red-200 font-semibold',
    };
  }

  if (isToday(d) || (isAfter(d, startToday) && isBefore(d, endToday))) {
    return {
      status: 'due_today',
      label: 'Due today',
      chipClass: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
    };
  }

  if (isTomorrow(d)) {
    return {
      status: 'due_soon',
      label: 'Due tomorrow',
      chipClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  const in48Hours = addDays(now, 2);
  if (isBefore(d, in48Hours)) {
    return {
      status: 'due_soon',
      label: 'Due soon',
      chipClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  return {
    status: 'upcoming',
    label: `Due ${format(d, 'MMM d')}`,
    chipClass: 'bg-stone-50 text-stone-700 border-stone-200',
  };
}
