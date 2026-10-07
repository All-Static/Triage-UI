import type { ReactNode } from "react";
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
 return <span className={`badge ${tone}`}><i />{children}</span>;
}
export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
 return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div></div>;
}
