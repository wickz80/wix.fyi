import { Link } from "gatsby-link"
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa"
import * as React from "react"
import "./navbar.css"

const Navbar: React.FC = () => (
  <div className="nav-header">


    <div className="nav-main">
      <div className="thumbnail radius">
        <div className="thumbnail" />
      </div>
      <div className="nav-bar">

        <div className="nav-title">
          <p>Dave Wixon</p>
        </div>
        <div className="nav-links">
          <Link className="nav-link" to="/">
            Home
          </Link>
          <Link className="nav-link" to="/about">
            About
          </Link>
          <Link className="nav-link" to="/writing">
            Writing
          </Link>
          <Link className="nav-link" to="/projects">
            Projects
          </Link>
        </div>
      </div>
    </div>

    <div className="nav-external-links">
      <a href="https://github.com/wickz80">
        <FaGithub className="social-icon" />
      </a>
      <a href="https://www.linkedin.com/in/david-wixon/">
        <FaLinkedin className="social-icon" />
      </a>
      <a href="https://twitter.com/twg_jack">
        <FaTwitter className="social-icon" />
      </a>
    </div>
  </div>
)

export default Navbar