export interface WorkEntry {
  period: string;
  company: string;
  url?: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface EducationEntry {
  period: string;
  institution: string;
  url?: string;
  credential: string;
}

export const work: WorkEntry[] = [
  {
    period: "jun '24 – now",
    company: "Upset Studio",
    url: "https://upset.ch",
    title: "Web Developer / Creative Coder",
    description:
      "Bridging the gap between Swiss graphic design heritage and modern interactive technology.",
    highlights: [
      "Interactive 3D via React Three Fiber",
      "Custom canvas-based creative tools",
      "Technical implementation of design systems",
      "Consulting on digital production & feasibility",
    ],
  },
  {
    period: "apr '21 – jun '24",
    company: "kunstbetrieb",
    url: "http://www.kunstbetrieb.ch",
    title: "Technical Lead / Digital Artist",
    description:
      "Using my background in design and my passion for tech to help artists create innovative experiences.",
    highlights: [
      "3D data acquisition, processing and modelling",
      "CAD, simulations and dynamics",
      "Generative / procedural design",
      "Consulting on matters of production",
    ],
  },
  {
    period: "sep '18 – feb '21",
    company: "hinderlingvolkart",
    url: "https://hinderlingvolkart.com",
    title: "Full Stack Developer",
    description:
      "Building backends and defining processes in one of the leading Swiss digital agencies.",
    highlights: [
      "Infrastructure & operations",
      "Collaborating within cross-functional teams",
      "High profile clients",
    ],
  },
  {
    period: "dec '15 – aug '18",
    company: "attribute",
    title: "Web Developer",
    url: "https://attribute.ch",
    description:
      "Focused on frontend architecture with specialized work in React and Canvas.",
    highlights: [
      "UX & information architecture",
      "Interactive prototype development",
      "UI concept & execution",
      "Multi-sector client portfolio",
    ],
  },
  {
    period: "dec '14 – dec '15",
    company: "ETH PDZ Zurich",
    url: "https://pdz.ethz.ch/the-group.html",
    title: "Scientific Assistant",
    description:
      "Design lead and technical consultant for the pd|z Product Development Group Zurich.",
    highlights: [
      "Rapid manufacturing & 3D printing",
      "Digital workflow optimization",
      "Web development",
      "Video production & editing",
    ],
  },
  {
    period: "jun '14 – nov '14",
    company: "FOTOKITE",
    url: "https://fotokite.com",
    title: "Head of Design",
    description:
      "Responsible for the design of early mockups, 3D printed prototypes and protective shells at Sergei Lupashin's ETH spin-off.",
    highlights: ["Design consultancy", "Marketing", "UI"],
  },
  {
    period: "feb '14 – sep '14",
    company: "THIS WEBER",
    title: "Industrial Designer",
    url: "https://www.thisweber.com/",
    description:
      "Drafting of plans and CAD drawings for Möbel Pfister's furniture collection.",
    highlights: ["3D visualisation", "Documentation & specification"],
  },
  {
    period: "sep '13 – jan '14",
    company: "ZHDK VID",
    url: "https://industrialdesign.zhdk.ch/",
    title: "Scientific Assistant",
    description:
      "Technical assistance including usage of tools such as Rhino3D and Grasshopper in a professional context.",
    highlights: ["Design automation", "Experimental workflow"],
  },
  {
    period: "sep '12 – may '13",
    company: "CHRISTOPHE MARCHAND",
    url: "https://christophemarchand.ch",
    title: "Project Partner",
    description:
      "Applying my ideas of automated design variant generation to a business case in the renowned atelier of Christophe Marchand.",
    highlights: ["Generative / procedural design"],
  },
  {
    period: "may '12 – jun '12",
    company: "ZKB",
    url: "https://zkb.ch",
    title: "Project Lead",
    description:
      "Commissioned, after winning a student competition, with the design and execution of the first prize trophy for the ZKB sustainability award for small and medium-sized enterprises.",
    highlights: [
      "3D print and mold making",
      "Molding techniques",
      "Direct client contact",
    ],
  },
  {
    period: "jun '11 – aug '11",
    company: "QUO",
    title: "Industrial Design Intern",
    description:
      "Design and model making for a gait trainer, graphic design for the corresponding CTI poster, design and technical solutions for a humanoid robot.",
    highlights: ["Project work in the field", "Constructional drawing"],
  },
  {
    period: "jun '99 – aug '03",
    company: "NORBERT LOHRER",
    title: "Apprenticeship as a Carpenter",
    url: "https://lohrer.ch",
    description:
      "(Eidg. dipl.) Working on small-scale furniture production and high quality interiors.",
    highlights: ["Attention to detail", "Batch production"],
  },
];

export const education: EducationEntry[] = [
  {
    period: "sep '09 – may '12",
    institution: "ZHDK VID",
    url: "https://industrialdesign.zhdk.ch/",
    credential:
      "Bachelor of Arts in Product and Industrial Design, Zurich University of the Arts",
  },
  {
    period: "aug '08 – jun '09",
    institution: "BBW",
    url: "https://bbw.ch/",
    credential: "Berufsmaturität – Berufsbildungsschule Winterthur",
  },
  {
    period: "aug '99 – aug '03",
    institution: "BBW",
    url: "https://bbw.ch/",
    credential:
      "Apprenticeship as Eidg. dipl. Carpenter, Berufsbildungsschule Winterthur",
  },
  {
    period: "aug '98 – aug '99",
    institution: "Oase",
    url: "https://www.zur-oase.ch/",
    credential: "Social Internship as Guardian, Wohngemeinschaft Oase, Gais AR",
  },
  {
    period: "jun '97 – jun '98",
    institution: "F+F",
    url: "https://ffzh.ch/",
    credential: "Preparatory Programme (Vorkurs), Farb und Form Schule Zürich",
  },
];

export const languages =
  "Fluent in English and German, conversational in French";

export const skills: Record<string, string[]> = {
  Code: ["HTML/CSS", "Javascript", "Twig", "PHP", "Bash", "Python"],
  Design: ["Adobe CC", "Sketch"],
};
