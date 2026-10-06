import React, { ReactNode } from 'react';
import Navbar from './navbar';

interface PageContainerProps {
  children: ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col py-6 px-4">
      <div className="max-w-5xl w-full mx-auto flex flex-col flex-1 bg-white/92 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
        <Navbar />
        <main className="px-8 py-8 flex-1">
          {children}
        </main>
      </div>
      <footer className="max-w-5xl w-full mx-auto text-center text-white/50 text-xs py-3">
        wix.fyi
      </footer>
    </div>
  );
};

export default PageContainer;
