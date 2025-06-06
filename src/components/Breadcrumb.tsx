import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  // Schema.org structured data for breadcrumbs
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(item.href && { "item": `https://pictuz.com${item.href}` })
    }))
  };

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />
      
      {/* Visual breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-ghibli-earth">
          {/* Home link always first */}
          <li>
            <Link 
              href="/home" 
              className="flex items-center hover:text-ghibli-moss transition-colors"
              aria-label="Voltar à página inicial"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Início</span>
            </Link>
          </li>
          
          {/* Dynamic breadcrumb items */}
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-2 text-ghibli-sage" />
              {item.href ? (
                <Link 
                  href={item.href}
                  className="hover:text-ghibli-moss transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-ghibli-wood font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb; 