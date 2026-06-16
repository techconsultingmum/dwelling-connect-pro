import { Helmet } from "react-helmet-async";

const SITE_URL = "https://dwelling-connect-pro.lovable.app";
const DEFAULT_OG_IMAGE = "https://lovable.dev/opengraph-image-p98pqg.png";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}

/**
 * Per-route head metadata. Renders self-referencing canonical and og:url,
 * unique title/description, and optional noindex for authenticated routes.
 */
export function Seo({ title, description, path, image = DEFAULT_OG_IMAGE, noindex }: SeoProps) {
  const url = `${SITE_URL}${path}`;
  const safeDescription = description.length > 160 ? `${description.slice(0, 157)}...` : description;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={safeDescription} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={image} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}
    </Helmet>
  );
}