import React from 'react';
import PageContainer from '../components/page-container';
import { Link } from 'gatsby';
import { HeadProps } from 'gatsby';

const ProjectsPage: React.FC = () =>
    <PageContainer>
        <div>
            <h1>Projects</h1>
            <p>
                Here are some of my projects:
            </p>
            <ul>
                <li>
                    <Link to="/gravity">Gravity</Link> - Experiments with WebGL
                </li>
            </ul>
        </div>
    </PageContainer>

export default ProjectsPage;

export function Head(props: HeadProps) {
    return (
        <title>Projects</title>
    )
}
