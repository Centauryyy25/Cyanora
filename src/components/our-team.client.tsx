"use client";

import dynamic from "next/dynamic";

// Render OurTeam only on the client to avoid hydration drift
const OurTeam = dynamic(() => import("./our-team"), { ssr: false });

export default function OurTeamClient() {
  return <OurTeam />;
}

