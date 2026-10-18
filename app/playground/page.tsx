import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Shell from "./Shell";

export const metadata: Metadata = { title: "Playground — tractor.games" };

// Design playground: live token editing over a gallery of every visual piece,
// rendered from fixtures. Dev only; 404 in production builds.
export default function Playground() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Shell />;
}
