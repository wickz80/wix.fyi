import React from 'react';
import PageContainer from '../components/page-container';
import { HeadProps } from 'gatsby';

const AboutPage: React.FC = () => (
  <PageContainer>
    <div>
      <p className="text-sm font-medium text-brand uppercase tracking-widest mb-3">About</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Hi, I'm Dave.</h1>
      <p className="text-gray-500 mb-8">Senior Software Engineer · Twitch · Minneapolis, MN</p>
      <div className="space-y-5 text-gray-600 leading-relaxed">
        <p>
          You've reached wix.fyi — my nascent tech blog, portfolio, and playground for experiments.
        </p>
        <p>
          My tech career started unexpectedly after graduating with a Biochemistry degree, but
          disliking the job prospects. I moved to Texas and began in tech support, traveling to
          customer sites to set up video infrastructure for a company later acquired by Motorola.
          From there, I quickly got into scripting, before full-on development work. My pride was
          building a custom video pipeline that supported the Detroit municipal court system.
        </p>
        <p>
          After joining Twitch, I spent several years building out analytics infrastructure for
          Creators on Twitch, using novel technologies like Apache Flink, Druid, and Airflow. Over
          the past couple years, I led development of music scanning technology allowing DJs to play
          licensed content. Most recently I've turned my focus to On-Demand Clips and VODs, adding
          support for 2k/4k resolution, enhanced bitrates, portrait orientation and dual-format
          streaming.
        </p>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <p className="flex-1">
            I spend my free time on side projects, both digital and physical. I've been renovating a
            home I bought in 2021, adding smart technology and remodeling with blood, sweat and tears.
            When I'm not building, I love music festivals, strength training, international travel,
            online gaming and my cat, Brock.
          </p>
          <img
            src="/brock.jpg"
            alt="Brock the cat"
            className="w-full sm:w-48 sm:h-48 rounded-xl object-cover border border-gray-200 shadow-sm flex-shrink-0"
          />
        </div>
      </div>
    </div>
  </PageContainer>
);

export default AboutPage;

export function Head(props: HeadProps) {
  return <title>About · wix.fyi</title>;
}
