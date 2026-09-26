import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      icon="file"
      title="Page not found"
      action={
        <>
          <Link href="/" className={buttonClasses("primary")}>
            Go to the home page
          </Link>
          <Link href="/analyze" className={buttonClasses("secondary")}>
            Analyse a document
          </Link>
        </>
      }
    >
      The page you are looking for does not exist or has moved.
    </EmptyState>
  );
}
