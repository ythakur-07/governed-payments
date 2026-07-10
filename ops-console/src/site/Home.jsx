import Hero from "./home/Hero.jsx";
import Problem from "./home/Problem.jsx";
import Challenges from "./home/Challenges.jsx";
import ReferenceArchitecture from "./home/ReferenceArchitecture.jsx";
import ReferenceImplementation from "./home/ReferenceImplementation.jsx";
import Research from "./home/Research.jsx";
import OpenQuestions from "./home/OpenQuestions.jsx";
import About from "./home/About.jsx";

// Homepage information hierarchy per the PRD:
// Problem → Why payments break → Architecture → Reference Implementation
// → Research → Open Questions → About
export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Challenges />
      <ReferenceArchitecture />
      <ReferenceImplementation />
      <Research />
      <OpenQuestions />
      <About />
    </>
  );
}
