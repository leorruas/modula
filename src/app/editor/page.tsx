'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { Project } from '@/types';
import { EditorLayout } from '@/features/editor/components/EditorLayout';
import { Canvas } from '@/features/editor/components/Canvas';
import { useUserStore } from '@/store/userStore';
import { useEditorStore } from '@/store/editorStore';

function EditorContent() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('id');
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useUserStore();
    const { refreshTrigger } = useEditorStore();

    useEffect(() => {
        async function load() {
            if (!projectId) {
                setLoading(false);
                return;
            }
            try {
                const data = await projectService.getProject(projectId);
                setProject(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [projectId, refreshTrigger]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    if (!project) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Project not found</div>;

    return (
        <EditorLayout project={project}>
            <Canvas project={project} />
        </EditorLayout>
    );
}

export default function EditorPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Editor...</div>}>
            <EditorContent />
        </Suspense>
    );
}
