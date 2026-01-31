import type { RoutingCandidate } from '@/types/api';
import { Card, Badge } from '@/components/ui';
import { motion } from 'framer-motion';
import { Check, TrendingUp } from 'lucide-react';

interface CandidateCardProps {
  candidate: RoutingCandidate;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

export function CandidateCard({ candidate, isSelected, onSelect, index }: CandidateCardProps) {
  const orgLabel = candidate.org_path
    ?? [candidate.department, candidate.team].filter(Boolean).join(' · ')
    ?? '조직 정보 없음';
  const scoreValue = candidate.score ?? candidate.match_score;

  return (
     <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
     >
      <Card 
        className={`p-4 mb-3 cursor-pointer transition-all hover:bg-accent/50 ${isSelected ? 'border-primary ring-1 ring-primary bg-accent/20' : 'border-border'}`}
        onClick={onSelect}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-primary">{candidate.name}</span>
              {candidate.role && (
                <Badge variant="outline" className="text-[10px] h-5">{candidate.role}</Badge>
              )}
              {candidate.level && (
                <Badge variant="secondary" className="text-[10px] h-5">{candidate.level}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{orgLabel}</p>
          
            {typeof scoreValue === 'number' && (
              <div className="flex items-center space-x-2 mt-2">
                 <div className="flex items-center text-[10px] text-green-500">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    점수: {scoreValue.toFixed(2)}
                 </div>
              </div>
            )}
          </div>
          {isSelected && (
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>
        
        {typeof scoreValue === 'number' && (
          <div className="mt-3">
            <div className="text-[9px] text-muted-foreground mb-1">적합도</div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(scoreValue, 1) * 100}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
