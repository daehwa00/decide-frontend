import { Candidate } from '@/types';
import { Card, Badge } from '@/components/ui';
import { motion } from 'framer-motion';
import { Check, TrendingUp } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

export function CandidateCard({ candidate, isSelected, onSelect, index }: CandidateCardProps) {
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
              <Badge variant="outline" className="text-[10px] h-5">{candidate.role}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{candidate.org_path}</p>
          
            <div className="flex items-center space-x-2 mt-2">
               <div className="flex items-center text-[10px] text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  점수: {candidate.score.toFixed(2)}
               </div>
               {candidate.domain_strength.privacy > 0.5 && (
                 <Badge variant="secondary" className="text-[9px] h-4">프라이버시 전문가</Badge>
               )}
            </div>
          </div>
          {isSelected && (
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>
        
        {/* Score Breakdown Mini Viz */}
        <div className="mt-3 grid grid-cols-4 gap-1 text-[9px] text-muted-foreground">
           <div className="flex flex-col">
             <span>참여</span>
             <div className="h-1 bg-slate-800 rounded overflow-hidden">
               <div className="h-full bg-blue-500" style={{width: `${candidate.score_breakdown.participation * 100}%`}}></div>
             </div>
           </div>
           <div className="flex flex-col">
             <span>도메인</span>
             <div className="h-1 bg-slate-800 rounded overflow-hidden">
               <div className="h-full bg-green-500" style={{width: `${candidate.score_breakdown.domain * 100}%`}}></div>
             </div>
           </div>
           <div className="flex flex-col">
             <span>책임</span>
             <div className="h-1 bg-slate-800 rounded overflow-hidden">
               <div className="h-full bg-purple-500" style={{width: `${candidate.score_breakdown.tree * 100}%`}}></div>
             </div>
           </div>
           <div className="flex flex-col">
             <span>부하</span>
             <div className="h-1 bg-slate-800 rounded overflow-hidden">
               <div className="h-full bg-orange-500" style={{width: `${candidate.score_breakdown.load * 100}%`}}></div>
             </div>
           </div>
        </div>
      </Card>
    </motion.div>
  );
}
