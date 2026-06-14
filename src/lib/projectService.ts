import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CreateProjectInput {
  userId: string;
  topic: string;
  course: string;
  faculty: string;
}

export const createNewResearchProject = async (input: CreateProjectInput) => {
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      ownerId: input.userId,
      topic: input.topic,
      course: input.course,
      faculty: input.faculty,
      progress: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      content: {
        preliminaryPages: "",
        chapter1: "",
        chapter2: "",
        chapter3: "",
        chapter4: "",
        chapter5: "",
      },
      paymentStatus: {
        chapter1: false,
        chapter2: false,
        chapter3: false,
        chapter4: false,
        chapter5: false,
        instruments: false,
      }
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating project document: ", error);
    throw error;
  }
};
