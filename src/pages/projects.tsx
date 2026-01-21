import React, { useState } from 'react';
import PageContainer from '../components/page-container';
import { HeadProps } from 'gatsby';
import GravityModal from '../components/gravity-modal';

const ProjectsPage: React.FC = () => {
    const [isGravityModalOpen, setIsGravityModalOpen] = useState(false);

    return (
        <>
            <PageContainer>
                <div>
                    <h1>Projects</h1>
                    <p>
                        Here are some of my projects:
                    </p>
                    <ul>
                        <li>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsGravityModalOpen(true);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                Gravity
                            </a> - Experiments with WebGL
                        </li>
                    </ul>
                </div>
            </PageContainer>
            <GravityModal
                isOpen={isGravityModalOpen}
                onClose={() => setIsGravityModalOpen(false)}
            />
        </>
    );
}

export default ProjectsPage;

export function Head(props: HeadProps) {
    return (
        <title>Projects</title>
    )
}
