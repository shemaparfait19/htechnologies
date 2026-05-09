import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Mail, Phone } from 'lucide-react';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full h-24 w-24 relative flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" fill className="object-contain p-2" />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Account Suspended</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Access to this system has been suspended due to an outstanding payment.
            Please settle your balance to restore full access.
          </p>

          <div className="bg-muted rounded-lg p-4 space-y-3 text-sm text-left">
            <p className="font-semibold text-foreground">Contact the system developer:</p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <a href="mailto:centurysoap1@gmail.com" className="underline hover:text-foreground">
                centurysoap1@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <a href="tel:+250788000000" className="underline hover:text-foreground">
                +250 788 000 000
              </a>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Once payment is confirmed, access will be restored immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
