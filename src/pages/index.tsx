import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"
import PageContainer from "../components/page-container"

const IndexPage: React.FC<PageProps> = () => (
  <PageContainer>
    <h1>Hello!</h1>
    You've reached wix.fyi. This site serves as a tech blog, online portfolio, and experiment to play with shiny new web frameworks and technologies.
  </PageContainer>
)

export default IndexPage

export const Head: HeadFC = () => <title>Home Page</title>
