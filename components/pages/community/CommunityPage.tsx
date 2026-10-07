import CommunityHero from "./CommunityHero";
import CommunityFinder from "./CommunityFinder";
import CommunityJourney from "./CommunityJourney";
import CommunityGallery from "./CommunityGallery";
// import CommunityImpact from "./CommunityImpact";
import CommunityPulse from "./CommunityPulse";
import CommunityCTA from "./CommunityCTA";

export default function CommunityPage() {
  return (
    <>
      <CommunityHero />
      <CommunityFinder />
      <CommunityJourney />
      <CommunityGallery />
      {/* Hidden for now — restore when ready */}
      {/* <CommunityImpact /> */}
      <CommunityPulse />
      <CommunityCTA />
    </>
  );
}
