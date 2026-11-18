import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { sampleFaqs } from "../src/fixtures";

const projectId = "solo-living-ai";

async function main() {
  if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080") {
    throw new Error(
      "로컬 Firestore 에뮬레이터 설정이 올바르지 않습니다."
    );
  }

  const app = getApps()[0] ?? initializeApp({ projectId });
  const db = getFirestore(app);
  const collection = db.collection("emergency_faq");

  const existing = await collection.limit(1).get();

  if (!existing.empty) {
    throw new Error(
      "기존 FAQ 데이터가 있습니다. 안전을 위해 등록을 중단합니다."
    );
  }

  if (!Array.isArray(sampleFaqs) || sampleFaqs.length === 0) {
    throw new Error("등록할 FAQ 데이터가 없습니다.");
  }

  const batch = db.batch();

  for (const faq of sampleFaqs) {
    if (
      typeof faq.faq_id !== "string" ||
      !faq.faq_id ||
      faq.status !== "verified"
    ) {
      throw new Error("FAQ 데이터 형식 또는 검증 상태를 확인해 주세요.");
    }

    batch.create(collection.doc(faq.faq_id), faq);
  }

  await batch.commit();

  console.log("로컬 FAQ 등록 완료:", sampleFaqs.length, "개");
}

main().catch((error) => {
  console.error("FAQ 등록 실패:", error.message);
  process.exitCode = 1;
});
