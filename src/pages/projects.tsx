import React, { useState } from 'react';
import PageContainer from '../components/page-container';
import { HeadProps } from 'gatsby';
import GravityModal from '../components/gravity-modal';

const projects = [
  {
    title: 'Gravity',
    description: 'Interactive gravity simulation — click and hold to spawn balls that bend flowing field lines. Built with WebGL canvas.',
    tag: 'WebGL · Canvas',
  },
  {
    title: 'Phosphor Loop',
    description: 'A music-reactive 3D visualizer. Explore worlds and fractals that move, shimmer, and change color with your music.',
    tag: 'WebGL · Audio',
  },
];

const ProjectsPage: React.FC = () => {
  const [isGravityModalOpen, setIsGravityModalOpen] = useState(false);

  return (
    <>
      <PageContainer>
        <div>
          <p className="text-sm font-medium text-brand uppercase tracking-widest mb-3">Work</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Projects</h1>
          <div className="grid gap-4">
            <button
              onClick={() => setIsGravityModalOpen(true)}
              className="w-full text-left p-5 rounded-xl border border-gray-200 hover:border-brand/50 hover:shadow-md transition-all group cursor-pointer bg-transparent"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{projects[0].tag}</p>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-brand transition-colors mb-1">
                    {projects[0].title}
                  </h2>
                  <p className="text-sm text-gray-500">{projects[0].description}</p>
                </div>
                <span className="text-brand text-sm font-medium whitespace-nowrap pt-1">Launch →</span>
              </div>
            </button>
            <a
              href="/loop/"
              className="block w-full text-left p-5 rounded-xl border border-gray-200 hover:border-brand/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{projects[1].tag}</p>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-brand transition-colors mb-1">
                    {projects[1].title}
                  </h2>
                  <p className="text-sm text-gray-500">{projects[1].description}</p>
                </div>
                <span className="text-brand text-sm font-medium whitespace-nowrap pt-1">Launch →</span>
              </div>
            </a>
          </div>
        </div>
      </PageContainer>
      <GravityModal
        isOpen={isGravityModalOpen}
        onClose={() => setIsGravityModalOpen(false)}
      />
    </>
  );
};

export default ProjectsPage;

export function Head(props: HeadProps) {
  return <title>Projects · wix.fyi</title>;
}
