'use client';

import { useUserStore } from "@/store/userStore";
import { LoginButton } from "@/components/auth/LoginButton";
import { Dashboard } from "@/features/dashboard/Dashboard";
import styles from "./page.module.css";
import { useUIStore } from "@/store/uiStore";

export default function Home() {
  const { user, isAuthReady } = useUserStore();
  const { isLoading } = useUIStore();

  if (!isAuthReady || isLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Modula</h1>
          <p style={{ marginBottom: 20 }}>Editorial Chart System</p>
          <LoginButton />
        </main>
      </div>
    );
  }

  return <Dashboard />;
}
