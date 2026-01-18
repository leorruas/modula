'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { Project } from '@/types';
import { EditorLayout } from '@/features/editor/components/EditorLayout';
import { Canvas } from '@/features/editor/components/Canvas';
import { useUserStore } from '@/store/userStore';
import { useEditorStore } from '@/store/editorStore';

export default function EditorPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useUserStore();
    const { refreshTrigger } = useEditorStore();

    useEffect(() => {
        async function load() {
            if (!projectId) return;
            try {
                // setLoading(true); // Optional: if we want to show loading spinner on refresh
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
