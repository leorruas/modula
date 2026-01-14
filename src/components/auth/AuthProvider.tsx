'use client';

import { useAuthSubscription } from '@/hooks/useAuthSubscription';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    useAuthSubscription();
    return <>{children}</>;
}
