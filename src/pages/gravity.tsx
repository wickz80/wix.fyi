import React from 'react';
import PageContainer from '../components/page-container';
import { HeadProps } from 'gatsby';

const GravityPage: React.FC = () =>
    <PageContainer>
        <div>
            <h1>Gravity</h1>
            <p>
                Welcome to the Gravity project page.
            </p>
        </div>
    </PageContainer>

export default GravityPage;

export function Head(props: HeadProps) {
    return (
        <title>Gravity</title>
    )
}
