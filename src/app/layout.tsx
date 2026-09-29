import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./motion.css";
import { Nav } from "@/components/Nav";
import { ScrollProgress } from "@/components/ScrollProgress";
import { AskChat } from "@/components/AskChat";
import { CommandPalette, type Cmd } from "@/components/CommandPalette";
import { profile } from "@/data/profile";
import { visibleProjects } from "@/data/projects";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sohenpatel.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  alternates: { canonical: "/" },
  title: { default: "Sohen Patel | AI / ML Engineer", template: "%s | Sohen Patel" },
  description:
    "AI/ML engineer building and evaluating LLM, agentic and applied ML systems. MEng at the University of Toronto. Projects, experience and live demos.",
  openGraph: {
    title: "Sohen Patel | AI / ML Engineer",
    description: profile.tagline,
    url: SITE,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

const commands: Cmd[] = [
  { label: "Projects", hint: "section", href: "/#projects" },
  { label: "Experience", hint: "section", href: "/#experience" },
  { label: "Skills", hint: "section", href: "/#skills" },
  { label: "Contact", hint: "section", href: "/#contact" },
  ...visibleProjects.map((p) => ({ label: p.title, hint: "project", href: `/projects/${p.slug}` })),
  { label: "Download resume", hint: "pdf", href: profile.resume, external: true },
  { label: "GitHub", hint: "external", href: profile.github, external: true },
  { label: "LinkedIn", hint: "external", href: profile.linkedin, external: true },
  { label: "Email me", hint: "mailto", href: `mailto:${profile.email}`, external: true },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-motion="on"
      data-timeline="on"
      className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ScrollProgress />
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line py-8 text-center text-xs text-muted">
          © {new Date().getFullYear()} Sohen Patel · Built with Next.js
        </footer>
        <CommandPalette commands={commands} />
        <AskChat />
      </body>
    </html>
  );
}
