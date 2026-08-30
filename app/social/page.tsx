import { redirect } from "next/navigation";

/** Social is a section, not a page — land on its first child. */
export default function SocialIndexPage() {
  redirect("/social/new-post");
}
