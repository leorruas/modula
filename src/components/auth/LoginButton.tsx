'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useUIStore } from '@/store/uiStore';

export function LoginButton() {
    const { setIsLoading } = useUIStore();

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Check console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogin}
            style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
            }}
        >
            Sign in with Google
        </button>
    );
}
