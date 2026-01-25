import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout } from '../hooks/use-auth';

export default function PendingApprovalPage() {
  const { mutate: logout, isPending } = useLogout();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Oczekiwanie na akceptację</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Twoje konto zostało utworzone. Skontaktuj się z Administratorem w celu aktywacji dostępu
          i przypisania do projektu.
        </p>
        <div className="mt-6">
          <Button onClick={() => logout()} disabled={isPending} className="w-full">
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Wylogowywanie...
              </span>
            ) : (
              'Wyloguj'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
