import { User } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui';

export function Header() {
  const user = {
    name: 'Grace Han',
    role: 'VP, Product',
    org: 'Product Strategy',
    status: '가능',
    owner: true
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center justify-between pl-8">
        <div className="flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">DECIDE</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/issues/new" className="transition-colors hover:text-foreground/80 text-foreground/60">새 이슈</Link>
            <Link to="/analysis" className="transition-colors hover:text-foreground/80 text-foreground/60">분석</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 pr-4">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.role} • {user.org}</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border px-2 py-1 bg-muted/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <Badge variant={user.owner ? 'default' : 'secondary'} className="text-[10px] uppercase">
                {user.owner ? '결정 책임자' : '검토자'}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{user.status}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function StepIndicator() {
  const location = useLocation();
  const steps = ['이슈', '라우팅', '미팅', '리스크 검토', '승인/할당'];

  let currentStep = 0;
  if (location.pathname.startsWith('/analysis')) {
    currentStep = 1;
    if (location.state?.mode === 'meeting') {
      currentStep = 2;
    }
    if (location.state?.mode === 'compiling') {
      currentStep = 3;
    }
    if (location.state?.mode === 'decision' || location.state?.startMode === 'decision') {
      currentStep = 4;
    }
  }

  return (
    <div className="border-b bg-background/80 backdrop-blur">
      <div className="container pl-8 py-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {steps.map((step, index) => {
            const isActive = index <= currentStep;
            const isComplete = index < currentStep;
            return (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-semibold ${
                      isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'
                    }`}
                  >
                    {isComplete ? '✓' : index + 1}
                  </div>
                  <span className="font-medium">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-px w-10 ${isActive ? 'bg-primary/60' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Header />
      <StepIndicator />
      <main className="container py-6 pl-8">
         <Outlet />
      </main>
    </div>
  );
}
