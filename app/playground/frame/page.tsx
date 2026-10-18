import { notFound } from "next/navigation";
import Gallery from "../Gallery";

// The gallery on its own, loaded by the playground shell in phone- and
// desktop-width iframes. Dev only.
export default async function PlaygroundFrame({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { only } = await searchParams;
  return <Gallery only={only} />;
}
