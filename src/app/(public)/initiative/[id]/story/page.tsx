import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicApiNoCache } from "@/lib/api/public";
import { photoUrl } from "@/lib/media-url";
import { StoryView } from "./StoryView";
import type { InitiativeStory } from "@/types";

// Server component — runs the public /story API call inside Next's
// fetch + generates per-page OG meta so WhatsApp / Twitter / LinkedIn
// link unfurls show the title, description, and after-photo.

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadStory(id: string): Promise<InitiativeStory | null> {
  try {
    return await publicApiNoCache.story(id);
  } catch (e) {
    // 404s + transient API errors both surface as Next 404 — we never
    // want a half-rendered story page in the wild.
    return null;
  }
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { id } = await params;
  const story = await loadStory(id);
  if (!story) {
    return {
      title: "Story not found — Area 2 Nation",
    };
  }
  const ogImage = story.afterPhotos[0]
    ? photoUrl(story.afterPhotos[0], "full")
    : story.beforePhotos[0]
      ? photoUrl(story.beforePhotos[0], "full")
      : undefined;
  const description =
    story.description.slice(0, 200) +
    (story.description.length > 200 ? "…" : "");

  return {
    title: `${story.title} — Area 2 Nation`,
    description,
    openGraph: {
      title: story.title,
      description,
      type: "article",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params;
  const story = await loadStory(id);
  if (!story) notFound();

  return <StoryView story={story} />;
}
