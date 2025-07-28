import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  setDoc 
} from "firebase/firestore";
import { db } from "./firebase";

export const firestoreClient = {
  // PC Builds
  async getPcBuilds() {
    const buildsRef = collection(db, "pcBuilds");
    const snapshot = await getDocs(buildsRef);
    
    return snapshot.docs.map(doc => ({
      id: parseInt(doc.id) || Date.now(),
      ...doc.data()
    }));
  },

  async getPcBuildById(id: string) {
    const buildRef = doc(db, "pcBuilds", id);
    const snapshot = await getDoc(buildRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: parseInt(id) || Date.now(),
      ...snapshot.data()
    };
  },

  async createPcBuild(buildData: any) {
    const buildsRef = collection(db, "pcBuilds");
    const docRef = await addDoc(buildsRef, {
      ...buildData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      id: docRef.id,
      ...buildData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  // Inquiries
  async getInquiries() {
    const inquiriesRef = collection(db, "inquiries");
    const q = query(inquiriesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: parseInt(doc.id) || Date.now(),
      ...doc.data()
    }));
  },

  async createInquiry(inquiryData: any) {
    const inquiriesRef = collection(db, "inquiries");
    const docRef = await addDoc(inquiriesRef, {
      ...inquiryData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      id: docRef.id,
      ...inquiryData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  // Seed data function for client-side use
  async seedData() {
    try {
      console.log("Seeding Firestore with PC build data...");

      const builds = [
        {
          name: "Budget Gaming Starter",
          category: "budget",
          price: "$699",
          description: "Perfect entry-level gaming PC for students. Handles popular games at 1080p medium settings with excellent value for money.",
          imageUrl: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=500",
          cpu: "AMD Ryzen 5 4500",
          gpu: "NVIDIA GTX 1660 Super",
          ram: "16GB DDR4-3200",
          storage: "500GB NVMe SSD",
          motherboard: "MSI B450M PRO-B",
          powerSupply: "EVGA 500W 80+ Bronze",
          case: "Cooler Master MasterBox Q300L",
          benchmarks: JSON.stringify({
            "Fortnite": "85 FPS @ 1080p High",
            "Valorant": "140 FPS @ 1080p High",
            "Minecraft": "120 FPS @ 1080p",
            "CS2": "110 FPS @ 1080p High"
          }),
          stockQuantity: 15,
          lowStockThreshold: 3,
          isActive: true
        },
        {
          name: "Mid-Range Gaming Beast",
          category: "mid-range",
          price: "$1,299",
          description: "Excellent 1440p gaming performance with ray tracing capabilities. Perfect balance of price and performance for serious gamers.",
          imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500",
          cpu: "AMD Ryzen 5 7600X",
          gpu: "NVIDIA RTX 4060 Ti",
          ram: "32GB DDR5-5600",
          storage: "1TB NVMe Gen4 SSD",
          motherboard: "MSI B650 GAMING PLUS WIFI",
          powerSupply: "Corsair RM750x 750W 80+ Gold",
          case: "Fractal Design Core 1000",
          benchmarks: JSON.stringify({
            "Cyberpunk 2077": "75 FPS @ 1440p High + RT",
            "Call of Duty": "120 FPS @ 1440p High",
            "Apex Legends": "144 FPS @ 1440p High",
            "Elden Ring": "60 FPS @ 1440p Max"
          }),
          stockQuantity: 8,
          lowStockThreshold: 2,
          isActive: true
        },
        {
          name: "High-End Performance Pro",
          category: "high-end",
          price: "$2,499",
          description: "Ultimate 4K gaming and content creation powerhouse. Handles any game at maximum settings with professional-grade performance.",
          imageUrl: "https://images.unsplash.com/photo-1580589301341-71e5d4f03e24?w=500",
          cpu: "AMD Ryzen 7 7800X3D",
          gpu: "NVIDIA RTX 4080 Super",
          ram: "32GB DDR5-6000 CL30",
          storage: "2TB NVMe Gen4 SSD + 2TB HDD",
          motherboard: "ASUS ROG STRIX X670E-E",
          powerSupply: "Corsair HX1000 1000W 80+ Platinum",
          case: "Lian Li PC-O11 Dynamic",
          benchmarks: JSON.stringify({
            "Cyberpunk 2077": "95 FPS @ 4K Ultra + RT",
            "Red Dead Redemption 2": "80 FPS @ 4K Ultra",
            "Microsoft Flight Simulator": "65 FPS @ 4K High",
            "Blender Render": "2.5x faster than RTX 3080"
          }),
          stockQuantity: 5,
          lowStockThreshold: 1,
          isActive: true
        },
        {
          name: "Premium Workstation Elite",
          category: "premium",
          price: "$4,999",
          description: "Professional-grade workstation for advanced content creation, 3D rendering, and demanding computational tasks. No compromises.",
          imageUrl: "https://images.unsplash.com/photo-1541746972996-4e0b0f93e586?w=500",
          cpu: "AMD Ryzen 9 7950X3D",
          gpu: "NVIDIA RTX 4090",
          ram: "64GB DDR5-6000 ECC",
          storage: "4TB NVMe Gen4 SSD + 8TB HDD RAID",
          motherboard: "ASUS ProArt X670E-CREATOR",
          powerSupply: "Seasonic PRIME TX-1300 1300W 80+ Titanium",
          case: "Fractal Design Define 7 XL",
          benchmarks: JSON.stringify({
            "Blender BMW": "45 seconds",
            "4K Video Export": "Real-time encoding",
            "AutoCAD Performance": "Professional grade",
            "Gaming 4K": "120+ FPS all titles"
          }),
          stockQuantity: 2,
          lowStockThreshold: 1,
          isActive: true
        },
        {
          name: "Student Budget Build",
          category: "budget",
          price: "$549",
          description: "Ultra-budget friendly build perfect for students. Great for esports, productivity, and light gaming without breaking the bank.",
          imageUrl: "https://images.unsplash.com/photo-1591238372338-68b075de34ea?w=500",
          cpu: "AMD Ryzen 5 5600G",
          gpu: "Integrated Radeon Graphics",
          ram: "16GB DDR4-3200",
          storage: "500GB NVMe SSD",
          motherboard: "ASRock B450M PRO4",
          powerSupply: "EVGA BR 450W 80+ Bronze",
          case: "Cooler Master MasterBox MB311L",
          benchmarks: JSON.stringify({
            "League of Legends": "100 FPS @ 1080p High",
            "Valorant": "80 FPS @ 1080p Medium",
            "Rocket League": "75 FPS @ 1080p",
            "Office Work": "Excellent performance"
          }),
          stockQuantity: 20,
          lowStockThreshold: 5,
          isActive: true
        },
        {
          name: "Creator's Dream Machine",
          category: "high-end",
          price: "$3,299",
          description: "Optimized for content creators with powerful CPU for rendering and streaming, plus excellent gaming performance.",
          imageUrl: "https://images.unsplash.com/photo-1601972602288-26853e2c2049?w=500",
          cpu: "Intel Core i7-13700K",
          gpu: "NVIDIA RTX 4070 Ti Super",
          ram: "32GB DDR5-5600",
          storage: "2TB NVMe Gen4 SSD",
          motherboard: "ASUS ROG STRIX Z790-E",
          powerSupply: "Corsair RM850x 850W 80+ Gold",
          case: "NZXT H7 Flow",
          benchmarks: JSON.stringify({
            "OBS Streaming": "4K60 + Gaming simultaneously",
            "Adobe Premiere": "4K timeline smooth playback",
            "Gaming Performance": "144 FPS @ 1440p High",
            "Blender": "Professional render times"
          }),
          stockQuantity: 6,
          lowStockThreshold: 2,
          isActive: true
        }
      ];

      // Add builds to Firestore
      for (let i = 0; i < builds.length; i++) {
        const buildRef = doc(db, "pcBuilds", (i + 1).toString());
        await setDoc(buildRef, {
          ...builds[i],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Added PC build: ${builds[i].name}`);
      }

      console.log("Firestore seeding completed successfully!");
      return true;
    } catch (error) {
      console.error('Firestore seeding failed:', error);
      return false;
    }
  }
};