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
          <div className={styles.intro}>
            <h1>Modula</h1>
            <p>
              O Modula é uma ferramenta de gráficos editoriais. Ideal para designers e jornalistas criarem visualizações de dados bonitas e precisas com agilidade.
            </p>
            <div className={styles.ctas}>
              <LoginButton />
            </div>
          </div>

          <footer className={styles.footer}>
            <p>
              Criado por <a href="https://leoruas.com" target="_blank" rel="noopener noreferrer">Leo Ruas</a>
            </p>
          </footer>
        </main>
      </div>
    );
  }

  return <Dashboard />;
}
