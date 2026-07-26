
import { Helmet } from 'react-helmet-async'

const SEO = ({ title, description, keywords, image, url, noIndex = false }) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content="summary_large_image" />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  )
}

export default SEO