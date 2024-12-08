
import React, { ReactNode } from 'react';
import Navbar from './navbar';
import './page-container.css';

interface PageContainerProps {
  children: ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (<>
    <div className="page">
      <Navbar />
      <div className="container" >
        {children}
      </div>
    </div>

    <div className="footer">wix.fyi</div>

  </>
  );
};

export default PageContainer;
