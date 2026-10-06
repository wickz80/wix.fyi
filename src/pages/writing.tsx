import React from 'react';
import PageContainer from '../components/page-container';
import { HeadProps } from 'gatsby';

const WritingPage: React.FC = () => (
  <PageContainer>
    <div>
      <p className="text-sm font-medium text-brand uppercase tracking-widest mb-3">Writing</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Posts</h1>

      <a
        href="https://blog.twitch.tv/en/2023/09/28/twitch-state-of-engineering-2023/"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 rounded-xl border border-gray-200 hover:border-brand/50 hover:shadow-md transition-all group mb-8"
      >
        <p className="text-xs font-medium text-brand uppercase tracking-wide mb-1">Twitch Engineering Blog · 2023</p>
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-brand transition-colors mb-1">
          Twitch State of Engineering 2023
        </h2>
        <p className="text-sm text-gray-500">
          A look at Twitch's engineering organization, infrastructure, and what we built in 2023.
        </p>
      </a>

      <p className="text-gray-400 text-sm italic">More posts coming soon.</p>
    </div>
  </PageContainer>
);

export default WritingPage;

export function Head(props: HeadProps) {
  return <title>Writing · wix.fyi</title>;
}
