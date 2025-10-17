"use client";

import Image from "next/image";
import { Instagram, Facebook, Mail } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Temporary placeholder image for avatars; replace per member as needed
import IlhamImg from "@/components/Asset/Ilham-Ahsan.jpg";
import UbayImg from "@/components/Asset/Ubaydilah.jpg";
import FirziImg from "@/components/Asset/Firzi-Sulaeman.jpg";
import RezaImg from "@/components/Asset/Reza.jpg";

type Socials = {
  instagram?: string;
  facebook?: string;
  email?: string;
};

type Member = {
  name: string;
  role: string;
  initials: string;
  avatarSrc?: any; // StaticImageData | string
  socials: Socials;
};

const TEAM: Member[] = [
  {
    name: "Ahsan",
    role: "231011402934",
    initials: "AP",
    avatarSrc: IlhamImg,
    socials: {
      instagram: "https://www.instagram.com/ilhmahsn_/",
      facebook: "https://facebook.com/alyap",
      email: "ilhamahsan@cyanora.id",
    },
  },
  {
    name: "Ubay",
    role: "231011402818",
    initials: "BW",
    avatarSrc: UbayImg,
    socials: {
      instagram: "https://www.instagram.com/yabu_halid",
      facebook: "https://facebook.com/bimaw",
      email: "ubaydilah@cyanora.id",
    },
  },
  {
    name: "Sule",
    role: "231011402107",
    initials: "CL",
    avatarSrc: FirziImg,
    socials: {
      instagram: "https://www.instagram.com/muhammad_firzi_03/",
      facebook: "https://facebook.com/citral",
      email: "firzi@cyanora.id",
    },
  },
  {
    name: "Reza",
    role: "211011400500",
    initials: "DS",
    avatarSrc: RezaImg,
    socials: {
      instagram: "https://instagram.com/dions",
      facebook: "https://facebook.com/dions",
      email: "reza@cyanora.id",
    },
  },
];

function SocialIcon({ type, href, className }: { type: keyof Socials; href?: string; className?: string }) {
  if (!href) return null;
  const common = cn(
    "inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20",
    className
  );
  const iconProps = { className: "size-4" };
  return (
    <a href={href} target="_blank" rel="noreferrer" className={common} aria-label={type}>
      {type === "instagram" && <Instagram {...iconProps} />}
      {type === "facebook" && <Facebook {...iconProps} />}
      {type === "email" && <Mail {...iconProps} />}
    </a>
  );
}

export default function OurTeam() {
  return (
    <section className="relative isolate text-white">
      {/* Background: Cynora blue gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#093A58] via-[#093A58] to-[#093A58]" />

      {/* Subtle brand watermark */}
      {/* <div className="pointer-events-none absolute inset-0 -z-10 opacity-10">
        <Image src={WhiteLogo} alt="Cynora" fill priority className="object-cover" />
      </div> */}

      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold sm:text-4xl">Tim Cynora</h2>
          <p className="mt-3 text-pretty text-white/80">
            Kenali tim di balik proyek ini — kreatif, kolaboratif, dan berdedikasi.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur transition hover:bg-white/10"
            >
              <div className="flex items-center gap-4">
                <Avatar className="size-16 ring-2 ring-white/20">
                  {
                    // Use Radix AvatarImage directly; feed string path from StaticImageData
                  }
                  <AvatarImage
                    // @ts-ignore tolerate StaticImageData | string
                    src={m.avatarSrc?.src ?? m.avatarSrc ?? ""}
                    alt={m.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-white/20 text-white">{m.initials}</AvatarFallback>
                </Avatar>

                <div>
                  <div className="text-lg font-semibold leading-tight">{m.name}</div>
                  <div className="text-sm text-white/70">{m.role}</div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <SocialIcon type="instagram" href={m.socials.instagram} />
                <SocialIcon type="facebook" href={m.socials.facebook} />
                <SocialIcon type="email" href={m.socials.email} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
