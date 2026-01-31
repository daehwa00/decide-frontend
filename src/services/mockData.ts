import { Person, Edge } from '../types';

export const DEPARTMENTS = [
  'Engineering', 'Product', 'Security', 'Legal', 'Finance', 'Sales', 'Operations', 'HR', 'Data'
];

export const ROLES = [
  'Software Engineer', 'Product Manager', 'Security Engineer', 'Legal Counsel', 
  'Finance Analyst', 'Sales Rep', 'Ops Manager', 'HR BP', 'Data Scientist'
];

const NAMES = [
  'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Jo', 'Yoon', 'Jang', 'Lim',
  'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Jeon', 'Hong'
];

// Seeded random for reproducibility (simple implementation)
let seed = 12345;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function randomInt(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

export function generatePeople(count: number = 1200): Person[] {
  return Array.from({ length: count }).map((_, i) => {
    const dept = randomItem(DEPARTMENTS);
    const role = randomItem(ROLES);
    const level = random() > 0.9 ? 'D1' : random() > 0.7 ? 'M1' : 'IC3';
    
    return {
      id: `p-${i}`,
      name: `${randomItem(NAMES)} ${randomItem(NAMES)}`,
      role: `${level} ${role}`,
      org_path: `/${dept}/${randomItem(['KR', 'US', 'EU'])}/${role}`,
      location: randomItem(['Seoul', 'New York', 'London', 'Singapore']),
      seniority_level: level as any,
      years_experience: randomInt(1, 20),
      domain_strength: {
        privacy: random(),
        security: random(),
        finance: random(),
        tech: random()
      },
      risk_tolerance: randomItem(['low', 'med', 'high']),
      decision_style: randomItem(['fast', 'balanced', 'conservative']),
      past_decisions_count: randomInt(0, 50),
      latency_profile_ms: randomInt(100, 5000),
      current_load: random()
    };
  });
}

export function generateEdges(people: Person[]): Edge[] {
  const edges: Edge[] = [];
  // Project Edges (Dense clusters)
  for (let i = 0; i < 50; i++) { // 50 Projects
    const teamSize = randomInt(5, 12);
    const team = [];
    for (let j = 0; j < teamSize; j++) {
      team.push(randomItem(people).id);
    }
    // Fully connect team (clique)
    for (let s of team) {
      for (let t of team) {
        if (s !== t && random() > 0.5) {
          edges.push({ source: s, target: t, type: 'project', weight: random() });
        }
      }
    }
  }
  return edges;
}

export const MOCK_PEOPLE = generatePeople(1200);
export const MOCK_EDGES = generateEdges(MOCK_PEOPLE);
