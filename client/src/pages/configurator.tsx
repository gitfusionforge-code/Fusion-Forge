import EnhancedBuildConfigurator from "@/components/enhanced-build-configurator";
import EnhancedSEOHead from "@/components/enhanced-seo-head";
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/seo-structured-data-enhanced";

export default function Configurator() {
  return (
    <div className="bg-light-grey dark:bg-gray-900">
      <EnhancedSEOHead 
        title="PC Build Configurator - Custom Computer Builder"
        description="Create your perfect custom PC build with our interactive configurator. Select components, compare prices, and get performance estimates."
        keywords="PC configurator, custom PC builder, computer components, build calculator"
      />
      <OrganizationStructuredData />
      <WebsiteStructuredData />
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-deep-blue dark:text-white mb-4">
              PC Build Configurator
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Design your perfect PC build with our interactive configurator
            </p>
          </div>
          <EnhancedBuildConfigurator />
        </div>
      </div>
    </div>
  );
}