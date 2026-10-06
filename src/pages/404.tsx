import * as React from 'react';
import { Link, HeadFC, PageProps } from 'gatsby';
import PageContainer from '../components/page-container';

const NotFoundPage: React.FC<PageProps> = () => (
  <PageContainer>
    <div>
      <p className="text-sm font-medium text-brand uppercase tracking-widest mb-3">404</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Page not found</h1>
      <p className="text-gray-600 leading-relaxed mb-8">
        Sorry, we couldn't find what you were looking for.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
      >
        Go home
      </Link>
    </div>
  </PageContainer>
);

export default NotFoundPage;

export const Head: HeadFC = () => <title>Not found · wix.fyi</title>;
