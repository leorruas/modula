'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { projectService } from '@/services/projectService';
import { Project } from '@/types';
import { auth } from '@/config/firebase';
import { toast } from 'sonner';
import { CreateProjectModal } from './components/CreateProjectModal';

export function Dashboard() {
    const { user } = useUserStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            loadProjects();
        }
    }, [user]);

    const loadProjects = async () => {
        if (!user) return;
        try {
            const list = await projectService.getUserProjects(user.uid);
            setProjects(list);
        } catch (error) {
            console.error("Failed to load projects:", error);
            toast.error("Erro ao carregar projetos");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir projeto?')) return;
        await projectService.deleteProject(id);
        loadProjects();
        toast.success("Projeto excluído");
    };

    return (
        <div style={{ maxWidth: 900, margin: '80px auto', padding: '0 20px' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 60,
                borderBottom: '1px solid var(--border)',
                paddingBottom: 20
            }}>
                <h1 style={{ fontSize: 32, fontFamily: 'Georgia, serif' }}>Projetos</h1>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>{user?.email}</span>
                    <button
                        onClick={() => auth.signOut()}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 14,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            color: 'var(--foreground)'
                        }}
                    >
                        Sair
                    </button>
                </div>
            </header>

            <div style={{ marginBottom: 60, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--foreground)',
                        color: 'var(--background)',
                        border: 'none',
                        fontSize: 14,
                        cursor: 'pointer',
                        borderRadius: 4
                    }}
                >
                    + Novo Projeto
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 30 }}>
                {projects.map((project) => (
                    <div key={project.id} style={{
                        border: '1px solid var(--border)',
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: 200,
                        transition: 'background 0.2s',
                    }}>
                        <div>
                            <Link href={`/editor/${project.id}`} style={{ textDecoration: 'none' }}>
                                <h3 style={{
                                    cursor: 'pointer',
                                    color: 'var(--foreground)',
                                    fontFamily: 'Georgia, serif',
                                    fontSize: 20,
                                    marginBottom: 8
                                }}>
                                    {project.name}
                                </h3>
                            </Link>
                            <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>
                                {project.gridConfig.pageFormat} • {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div style={{ alignSelf: 'flex-end' }}>
                            <button
                                onClick={() => handleDelete(project.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fa5252',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    opacity: 0.6
                                }}
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        padding: 60,
                        textAlign: 'center',
                        border: '1px dashed var(--border)',
                        color: 'var(--muted)'
                    }}>
                        <p>Nenhum projeto ainda. Comece criando um.</p>
                    </div>
                )}
            </div>

            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={loadProjects}
            />
        </div>
    );
}
