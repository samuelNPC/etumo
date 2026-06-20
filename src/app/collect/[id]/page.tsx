import { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CollectClient from "./CollectClient";

// 🚨 THIS RUNS ON THE SERVER TO GENERATE WHATSAPP / FACEBOOK PREVIEWS
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const docRef = doc(db, "instruments", params.id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Extract the introductory text from the questionnaire to use as the description
      const rawText = data.previewText || "";
      const cleanDesc = rawText.replace(/#/g, '').replace(/\n/g, ' ').substring(0, 150).trim() + "...";

      return {
        title: "Academic Research Questionnaire | Etumo",
        description: cleanDesc,
        openGraph: {
          title: "Academic Research Data Collection",
          description: cleanDesc,
          url: `https://etumo.com/collect/${params.id}`,
          siteName: "Etumo",
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: "Academic Research Data Collection",
          description: cleanDesc,
        }
      };
    }
  } catch (e) {
    console.error("Error generating metadata:", e);
  }

  // Fallback if instrument doesn't exist
  return {
    title: "Research Questionnaire Not Found | Etumo",
    description: "This research instrument may have been removed."
  };
}

// 🚨 THIS PRE-FETCHES THE DATA SO THE USER DOESN'T SEE A LOADING SPINNER
export default async function PublicCollectionPageServer({ params }: { params: { id: string } }) {
  try {
    const docRef = doc(db, "instruments", params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
          <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center max-w-md w-full">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Instrument Not Found</h1>
            <p className="text-sm text-gray-500">This research instrument does not exist or has been removed.</p>
          </div>
        </div>
      );
    }

    const instrumentData = docSnap.data() as any;

    return <CollectClient instrumentId={params.id} instrument={instrumentData} />;
    
  } catch (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
        <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center max-w-md w-full">
          <span className="text-4xl mb-4 block text-red-500">❌</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-sm text-gray-500">Failed to load the database. Please check your connection and try again.</p>
        </div>
      </div>
    );
  }
}
