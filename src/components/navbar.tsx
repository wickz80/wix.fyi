import { Link } from 'gatsby-link';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import * as React from 'react';

const NAV_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/writing', label: 'Writing' },
  { to: '/projects', label: 'Projects' },
];

const Navbar: React.FC = () => (
  <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
    <div className="flex items-center gap-4">
      <div>
        <Link to="/" className="text-xl font-bold text-brand leading-tight hover:opacity-80 transition-opacity">wix.fyi</Link>
        <nav className="flex items-center mt-1.5">
          {NAV_LINKS.map(({ to, label }, i) => (
            <Link
              key={to}
              to={to}
              className={`text-sm text-gray-500 hover:text-brand transition-colors px-2 leading-none${i < NAV_LINKS.length - 1 ? ' border-r border-gray-300' : ''}`}
              activeClassName="text-brand font-medium"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <a href="https://github.com/wickz80" aria-label="GitHub" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors">
        <FaGithub size={22} />
      </a>
      <a href="https://www.linkedin.com/in/david-wixon/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors">
        <FaLinkedin size={22} />
      </a>
      <a href="https://twitter.com/twg_jack" aria-label="Twitter" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors">
        <FaTwitter size={22} />
      </a>
    </div>
  </header>
);

export default Navbar;
