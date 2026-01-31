import { Person, Issue, Candidate, RoutingResult } from '../types';
import { MOCK_PEOPLE } from './mockData';

// PRD FR-6: Tree Distance (simplified based on path overlap)
// distance = number of steps to common ancestor
function calculateTreeDistance(pathA: string, pathB: string): number {
  const partsA = pathA.split('/').filter(Boolean);
  const partsB = pathB.split('/').filter(Boolean);
  let common = 0;
  for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
    if (partsA[i] === partsB[i]) common++;
    else break;
  }
  // distance = remaining steps in A + remaining steps in B
  return (partsA.length - common) + (partsB.length - common);
}

// PRD FR-5: Score Model
function calculateScore(person: Person, issue: Issue, ownerOrgPath: string): number {
  // 1. Participation (Mocked based on past_decisions)
  // Normalized 0-1
  const participationScore = Math.min(person.past_decisions_count / 50, 1);

  // 2. Domain Fit (Match issue tags with person domain_strength)
  let domainScore = 0;
  issue.tags.forEach(tag => {
    if (person.domain_strength[tag]) domainScore += person.domain_strength[tag];
    else domainScore += 0.1; // Baseline
  });
  domainScore = Math.min(domainScore / issue.tags.length, 1);

  // 3. Tree Responsibility (Closer is better)
  const distance = calculateTreeDistance(person.org_path, ownerOrgPath);
  const treeScore = Math.exp(-0.5 * distance); // Decay factor

  // 4. Load (Lower is better)
  const loadScore = 1 - person.current_load;

  // Weighted Sum
  // 0.45 * participation + 0.30 * domain + 0.15 * tree + 0.10 * load
  return (
    0.45 * participationScore +
    0.30 * domainScore +
    0.15 * treeScore +
    0.10 * loadScore
  );
}

export const RoutingService = {
  analyze: async (issue: Issue): Promise<RoutingResult> => {
    // Simulate AI Latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Determine Owner Org based on tags (Mock logic)
    const ownerOrgPath = issue.tags.includes('finance') ? '/Finance' : '/Product';

    const candidates: Candidate[] = MOCK_PEOPLE.map(p => {
      const score = calculateScore(p, issue, ownerOrgPath);
      return {
        ...p,
        score,
        score_breakdown: {
          participation: Math.min(p.past_decisions_count / 50, 1),
          domain: 0.5, // Simplified
          tree: Math.exp(-0.5 * calculateTreeDistance(p.org_path, ownerOrgPath)),
          load: 1 - p.current_load
        },
        reason: `High domain match for ${issue.tags[0]}`
      };
    });

    // Sort by Score Desc
    candidates.sort((a, b) => b.score - a.score);

    // Top 12
    const top12 = candidates.slice(0, 12);

    // Decision Set (3-7 people) -> Take Top 5 for demo
    const decisionSet = top12.slice(0, 5);

    return {
      issue_id: issue.id,
      candidates: top12,
      decision_set: decisionSet
    };
  }
};
