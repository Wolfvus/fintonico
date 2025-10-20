import { Rule } from '../domain/types';
import { MemoryStore } from '../store/memory';
import { EntryAggregate } from './entries';

type ComparatorOp = 'contains' | 'equals' | 'regex' | 'amount_between';

interface MatcherClause {
  field: string;
  op: ComparatorOp;
  value: unknown;
}

interface MatcherNode {
  all?: MatcherClause[];
  any?: MatcherClause[];
}

export interface CategorizationInput {
  userId: string;
  aggregate: EntryAggregate;
}

export interface CategorizationResult {
  applied: boolean;
  source: 'rule' | 'agent' | 'none';
  categoryId?: string;
  confidence: number;
  needsReview: boolean;
}

export interface AgentSuggestion {
  categoryId: string;
  confidence: number;
}

export class KeywordAgent {
  constructor(
    private readonly keywordMap: Record<
      string,
      { categoryId: string; confidence: number }
    >,
  ) {}

  categorize(description?: string): AgentSuggestion | null {
    if (!description) return null;
    const haystack = description.toLowerCase();
    for (const [keyword, suggestion] of Object.entries(this.keywordMap)) {
      if (haystack.includes(keyword.toLowerCase())) {
        return {
          categoryId: suggestion.categoryId,
          confidence: suggestion.confidence,
        };
      }
    }
    return null;
  }
}

const getDescription = (aggregate: EntryAggregate) =>
  aggregate.entry.description ?? '';

const totalDebitBase = (aggregate: EntryAggregate) =>
  aggregate.lines
    .filter((line) => line.direction === 'debit')
    .reduce((sum, line) => sum + line.baseAmount, 0);

const evaluateClause = (clause: MatcherClause, aggregate: EntryAggregate): boolean => {
  const description = getDescription(aggregate).toLowerCase();
  switch (clause.op) {
    case 'contains':
      return description.includes(String(clause.value).toLowerCase());
    case 'equals':
      return description === String(clause.value).toLowerCase();
    case 'regex': {
      if (typeof clause.value !== 'string') return false;
      try {
        const regex = new RegExp(clause.value, 'i');
        return regex.test(getDescription(aggregate));
      } catch {
        return false;
      }
    }
    case 'amount_between': {
      const [min, max] = Array.isArray(clause.value)
        ? clause.value
        : [undefined, undefined];
      if (typeof min !== 'number' || typeof max !== 'number') return false;
      const total = totalDebitBase(aggregate);
      return total >= min && total <= max;
    }
    default:
      return false;
  }
};

const evaluateMatcher = (matcher: MatcherNode, aggregate: EntryAggregate): boolean => {
  if (matcher.all) {
    return matcher.all.every((clause) => evaluateClause(clause, aggregate));
  }
  if (matcher.any) {
    return matcher.any.some((clause) => evaluateClause(clause, aggregate));
  }
  return false;
};

const RULE_CONFIDENCE = 1;
const AGENT_THRESHOLD = 0.85;

export class CategorizationService {
  constructor(
    private readonly store: MemoryStore,
    private readonly agent: KeywordAgent,
  ) {}

  categorize({ userId, aggregate }: CategorizationInput): CategorizationResult {
    const rules = this.store.rules.listByUser(userId).filter((rule) => rule.active);
    const ruleMatch = this.findRuleMatch(rules, aggregate);
    if (ruleMatch) {
      return {
        applied: true,
        source: 'rule',
        categoryId: ruleMatch.categoryId,
        confidence: ruleMatch.confidence,
        needsReview: false,
      };
    }

    const agentSuggestion = this.agent.categorize(getDescription(aggregate));
    if (agentSuggestion && agentSuggestion.confidence >= AGENT_THRESHOLD) {
      return {
        applied: true,
        source: 'agent',
        categoryId: agentSuggestion.categoryId,
        confidence: agentSuggestion.confidence,
        needsReview: false,
      };
    }

    if (agentSuggestion) {
      return {
        applied: false,
        source: 'agent',
        categoryId: agentSuggestion.categoryId,
        confidence: agentSuggestion.confidence,
        needsReview: true,
      };
    }

    return {
      applied: false,
      source: 'none',
      confidence: 0,
      needsReview: false,
    };
  }

  private findRuleMatch(rules: Rule[], aggregate: EntryAggregate): {
    categoryId: string;
    confidence: number;
  } | null {
    for (const rule of rules) {
      const matcher = rule.matcher as MatcherNode;
      if (matcher && evaluateMatcher(matcher, aggregate)) {
        const action = rule.action as Record<string, unknown>;
        const categoryId = action['set_category_id'];
        if (typeof categoryId === 'string' && categoryId.length > 0) {
          const confidence =
            typeof action['set_confidence'] === 'number'
              ? (action['set_confidence'] as number)
              : RULE_CONFIDENCE;
          return { categoryId, confidence };
        }
      }
    }
    return null;
  }
}
