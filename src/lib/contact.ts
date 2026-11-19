/** Public contact points, in the order the dock shows them (by importance). */
export const CONTACT = {
  email: "zgustavof@gmail.com",
  linkedin: "https://www.linkedin.com/in/gustavofiorotti",
  x: "https://x.com/gufiorotti",
  github: "https://github.com/gustavofiorotti",
  instagram: "https://www.instagram.com/gufiorotti",
} as const;

/** Social links shown by the dock (after the e-mail) and the ⌘K menu, in this order. */
export const SOCIAL_LINKS = [
  { id: "linkedin", href: CONTACT.linkedin },
  { id: "x", href: CONTACT.x },
  { id: "github", href: CONTACT.github },
  { id: "instagram", href: CONTACT.instagram },
] as const;

export type SocialId = (typeof SOCIAL_LINKS)[number]["id"];
