import React from 'react';
import PageContainer from '../components/page-container';

const AboutPage: React.FC = () =>
    <PageContainer>
        <div>
            <h1>Hi, I'm Dave.</h1>
            <p>
                My passion for technology started early. As a child, I upgraded my family’s desktop and experimented with Linux, eventually building my own PC in the 6th grade. By high school, I was exploring web development and hacking Xbox 360s, but I didn't pursue software professionally.
                <br />
                <br />
                At the University of Minnesota, while studying biochemistry and business, I re-discovered programming and applied it in an internship by developing a tax-optimization calculator for real estate transactions. After graduating in 2016, I entered IT, where I automated database corrections and designed bespoke solutions for handling large-scale video systems, including a metadata tagging service that supported the Detroit court system.
                <br />
                <br />
                In 2019, I joined Twitch as a full-stack engineer, focusing on analytics services for streamers. Nearly six years later, I’ve built scalable features, such as a time-series database providing viewership trends, and an analytics engine that detects, classifies and monetizes songs played in DJ livestreams. My work routinely involves FOSS tools like Apache Airflow, Druid, and Flink, processing billions of events daily across Twitch's infrastructure, which supports 40 terabits per second of data throughput.
                <br />
                <br />
                Beyond work, I enjoy side projects like building custom electronics with Arduino and RPi, developing analytics tools, and most recently, custom home automations. Outside of tech, I’m passionate about sports, vinyl records, and spending time with my cat, Brock.

            </p>
        </div>
    </PageContainer>

export default AboutPage;
