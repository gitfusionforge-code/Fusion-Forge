import { FirebaseAdminLogin } from "@/components/admin/firebase-admin-login";
import EnhancedSEOHead from "@/components/enhanced-seo-head";

export default function AdminLogin() {
  return (
    <>
      <EnhancedSEOHead 
        title="Admin Login - FusionForge PCs"
        description="Admin login for FusionForge PCs management dashboard"
        noIndex={true}
      />
      <FirebaseAdminLogin />
    </>
  );
}