import React from 'react';
import PageContainer from '../components/page-container';
import { Link } from 'gatsby-link';

const WritingPage: React.FC = () =>
    <PageContainer>
        <div>
            <h1>Writing</h1>
            <p>This page is a work in progress. I recently contributed to the <Link className='link' to='https://blog.twitch.tv/en/2023/09/28/twitch-state-of-engineering-2023/'>Twitch State of Engineering blog post;</Link> you can read that while you wait! </p>
        </div>
    </PageContainer>

export default WritingPage;
