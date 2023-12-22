import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"
import PageContainer from "../components/page-container"

const IndexPage: React.FC<PageProps> = () => (
  <PageContainer>
    Welcome to wix.fyi. This is a website about me.
    <br />
    <br />
    This is a work in progress. Check back later for updates.

  </PageContainer>
)

export default IndexPage

export const Head: HeadFC = () => <title>Home Page</title>
