/* eslint-disable require-jsdoc, max-len */
const today = () => new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Seoul"}).format(new Date());
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const validTime = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const days = ["월", "화", "수", "목", "금", "토", "일"];

async function handleRoutines(db, uid, req, res) {
  const root = db.doc(`users/${uid}`);
  const date = today();
  const weekday = days[(new Date(date).getUTCDay() + 6) % 7];
  const routines = root.collection("routines");
  const logs = root.collection("routine_logs");
  if (req.method === "GET") {
    const [rows, completed] = await Promise.all([routines.limit(201).get(), logs.where("target_date", "==", date).get()]);
    const status = new Map(completed.docs.map((doc) => [doc.get("routine_id"), doc.get("completed")]));
    return res.json({date, items: rows.docs.filter((doc) => doc.get("archived") !== true).slice(0, 200).map((doc) => ({
      ...doc.data(), id: doc.id, doneToday: status.get(doc.id) === true,
      scheduledToday: !doc.get("repeat_days")?.length || doc.get("repeat_days").includes(weekday),
    })), possiblyTruncated: rows.size > 200});
  }
  if (req.method !== "POST") return res.status(405).json({error: "지원하지 않는 메서드입니다."});
  const {action, id, title, time, repeatDays, completed, date: selectedDate} = req.body ?? {};
  if (!validId(id)) return res.status(422).json({error: "루틴 ID를 확인해 주세요."});
  const ref = routines.doc(id);
  if (action === "save") {
    if (typeof title !== "string" || !title.trim() || title.length > 30 || !validTime(time) ||
        !Array.isArray(repeatDays) || repeatDays.some((day) => !days.includes(day)) || new Set(repeatDays).size !== repeatDays.length) {
      return res.status(422).json({error: "루틴 이름, 시간, 요일을 확인해 주세요."});
    }
    const status = await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.get("archived") === true) return 409;
      if (!current.exists && (await tx.get(routines.limit(200))).size >= 200) return 422;
      tx.set(ref, {title: title.trim(), time, repeat_type: repeatDays.length ? "요일 지정" : "매일", repeat_days: repeatDays}, {merge: true});
      return 200;
    });
    return status === 200 ? res.json({id}) : res.status(status).json({error: "루틴을 저장할 수 없어요. 목록을 확인해 주세요."});
  }
  if (action === "complete" || action === "archive") {
    if (action === "complete" && (typeof completed !== "boolean" || selectedDate !== date)) {
      return res.status(409).json({error: "날짜가 바뀌었어요. 목록을 새로고침해 주세요."});
    }
    const changed = await db.runTransaction(async (tx) => {
      const row = await tx.get(ref);
      if (!row.exists || row.get("archived") === true) return action === "archive";
      if (action === "archive") tx.update(ref, {archived: true});
      else {
        const schedule = row.get("repeat_days");
        if (completed && schedule?.length && !schedule.includes(weekday)) return false;
        tx.set(logs.doc(`${date}_${id}`), {routine_id: id, target_date: date, completed});
      }
      return true;
    });
    return changed ? res.json({id}) : res.status(409).json({error: "오늘 완료할 수 있는 루틴인지 확인해 주세요."});
  }
  return res.status(422).json({error: "루틴 작업을 확인해 주세요."});
}

module.exports = {handleRoutines};
