import { useState, useEffect, useRef } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Candidate } from '@/types';
import { Send, Bot, ShieldAlert, Gavel } from 'lucide-react';

interface MeetingPanelProps {
  participants: Candidate[];
  onComplete: () => void;
}

type Message = {
  id: string;
  sender: string;
  role?: string;
  text: string;
  type: 'ai' | 'user' | 'system';
  timestamp: Date;
};

export function MeetingPanel({ participants, onComplete }: MeetingPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const script = [
    { delay: 1000, sender: '시스템', type: 'system', text: `🔎 안건: 리텐션 개선을 위한 행동 데이터 수집 확대 (ISS-2841)` },
    { delay: 2000, sender: '시스템', type: 'system', text: `참여자 ${participants.length}명이 입장했습니다.` },
    
    // Security Officer's concern
    { delay: 4000, sender: 'Ethan Park', role: 'Security', type: 'ai', text: '제안서를 검토했습니다. 행동 데이터 수집 범위에 위치 정보(GPS)가 포함될 가능성이 있어 보입니다. 이 경우 PII(개인식별정보)로 분류되어 보안 등급이 상향되어야 합니다.' },
    
    // Legal's compliance check
    { delay: 8000, sender: 'Soojin Lee', role: 'Legal', type: 'ai', text: '동의합니다. 특히 EU 사용자 데이터가 포함된다면 GDPR 제5조(데이터 최소화 원칙)에 위배될 위험이 큽니다. 데이터 보관 기간을 명시했나요?' },
    
    // Product's defense & compromise
    { delay: 12000, sender: 'Minji Kim', role: 'Product Owner', type: 'ai', text: '현재 기획상으로는 세션 종료 후 90일 보관을 목표로 하고 있습니다. 리텐션 분석을 위해서는 최소 2분기 데이터가 필요해서요.' },

    // Legal's counter-proposal
    { delay: 15000, sender: 'Soojin Lee', role: 'Legal', type: 'ai', text: '90일은 리스크가 높습니다. 원본 데이터는 30일로 제한하고, 이후에는 식별 불가능한 형태로 익명화(Anonymization)하여 저장하는 방안을 제안합니다.' },

    // Security's agreement
    { delay: 19000, sender: 'Ethan Park', role: 'Security', type: 'ai', text: '익명화된다면 보안 리스크는 관리 가능한 수준입니다. 다만, 익명화 로직에 대한 기술적 검토를 제가 담당하겠습니다.' },

    // System summary
    { delay: 22000, sender: '시스템', type: 'system', text: '💡 [합의 감지] 보관 기간: 30일(원본) + 이후 익명화. \n👉 할당: Ethan Park(익명화 기술 검토), Soojin Lee(약관 개정)' }
  ];

  useEffect(() => {
    // Run the script
    let timeouts: NodeJS.Timeout[] = [];
    
    script.forEach((step) => {
      const timeout = setTimeout(() => {
        // Show typing indicator before message if it's an AI
        if (step.type === 'ai') {
          setIsTyping(`${step.sender}님이 입력 중...`);
          setTimeout(() => {
            setIsTyping(null);
            addMessage(step.sender, step.text, step.type as any, step.role);
          }, 1500); // Typing duration
        } else {
          addMessage(step.sender, step.text, step.type as any, step.role);
        }
      }, step.delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const addMessage = (sender: string, text: string, type: 'ai'|'user'|'system', role?: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      sender,
      role,
      text,
      type,
      timestamp: new Date()
    }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage('Grace Han', input, 'user', 'VP, Product');
    setInput('');
    
    // Simple echo/ack from random participant if script is done
    setTimeout(() => {
       const randomPart = participants[0]; // Just picking first for simplicity in demo
       if (randomPart) {
         setIsTyping(`${randomPart.name}님이 입력 중...`);
         setTimeout(() => {
           setIsTyping(null);
           addMessage(randomPart.name, `네, 알겠습니다. 말씀하신 내용을 반영하겠습니다.`, 'ai', randomPart.role);
         }, 1000);
       }
    }, 1000);
  };

  return (
    <Card className="h-[600px] flex flex-col border shadow-lg bg-card/50 backdrop-blur">
      <div className="p-4 border-b bg-muted/40 flex justify-between items-center">
        <div>
          <h3 className="font-bold flex items-center text-lg">
            <Bot className="w-5 h-5 mr-2 text-primary" /> 마이크로 미팅 채널
          </h3>
          <p className="text-xs text-muted-foreground ml-7">AI Moderator가 리스크 토론을 조율 중입니다.</p>
        </div>
        <div className="flex -space-x-2">
           {participants.slice(0, 3).map((p, i) => (
             <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold" title={p.name}>
               {p.name.charAt(0)}
             </div>
           ))}
           {participants.length > 3 && (
             <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">
               +{participants.length - 3}
             </div>
           )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {msg.type !== 'system' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-foreground/80">{msg.sender}</span>
                    {msg.role && <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">{msg.role}</span>}
                    <span className="text-[10px] text-muted-foreground/50">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                )}
                
                <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                   msg.type === 'user' 
                     ? 'bg-primary text-primary-foreground rounded-tr-none' 
                     : msg.type === 'system'
                       ? 'bg-amber-100 text-amber-900 w-full text-center border border-amber-200 my-2'
                       : 'bg-white border border-border rounded-tl-none'
                }`}>
                   {msg.type === 'ai' && msg.role?.includes('Security') && <ShieldAlert className="w-3 h-3 inline mr-1 mb-0.5 text-red-500" />}
                   {msg.type === 'ai' && msg.role?.includes('Legal') && <Gavel className="w-3 h-3 inline mr-1 mb-0.5 text-blue-500" />}
                   {msg.text}
                </div>
             </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-2 rounded-full animate-pulse">
               {isTyping}
             </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-background/50 backdrop-blur">
         <form 
           className="flex space-x-2" 
           onSubmit={(e) => { e.preventDefault(); handleSend(); }}
         >
           <Input 
             value={input} 
             onChange={e => setInput(e.target.value)} 
             placeholder="의견을 입력하거나 추가 질문을 하세요..." 
             className="flex-1"
           />
           <Button type="submit" size="icon">
             <Send className="w-4 h-4" />
           </Button>
         </form>
      </div>

      <div className="p-3 bg-muted/20 border-t flex justify-between items-center">
        <span className="text-xs text-muted-foreground ml-2">토론이 충분히 진행되었다면 카드를 생성하세요.</span>
        <Button onClick={onComplete} className="shadow-lg hover:shadow-xl transition-all">
           의사결정 카드 컴파일
        </Button>
      </div>
    </Card>
  );
}
