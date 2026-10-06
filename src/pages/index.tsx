import * as React from 'react';
import type { HeadFC, PageProps } from 'gatsby';
import { Link } from 'gatsby-link';
import PageContainer from '../components/page-container';

const IndexPage: React.FC<PageProps> = () => (
  <PageContainer>
    <div className="flex flex-col sm:flex-row items-start gap-10">

      {/* Identity + bio */}
      <div className="flex-1">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-2">
          Dave Wixon
        </h1>
        <p className="text-lg text-gray-600 font-medium mb-6">
          Senior Software Engineer · Twitch · Minneapolis, MN
        </p>
        <p className="text-gray-600 leading-relaxed mb-8">
          I build analytics and video infrastructure at Twitch, tinker with electronics and home automation,
          and collect vinyl. This is my corner of the internet.
        </p>
        <div className="flex gap-4">
          <Link
            to="/about"
            className="px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            About me
          </Link>
          <Link
            to="/projects"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-brand hover:text-brand transition-colors"
          >
            Projects
          </Link>
        </div>
      </div>

      {/* Photo */}
      <img
        src="/self.jpg"
        alt="Dave Wixon"
        className="w-full sm:w-72 sm:h-[345px] rounded-2xl object-cover border border-gray-200 shadow-md flex-shrink-0"
      />

    </div>
  </PageContainer>
);

export default IndexPage;

export const Head: HeadFC = () => (
  <>
    <title>Dave Wixon</title>
    <meta name="description" content="Senior Software Engineer at Twitch. Tech blog, portfolio, and playground for experiments." />
  </>
);
