// 메모리 안에서 동작하는 아주 작은 가짜 Firestore (로컬 모드 테스트 전용).
// 이 프로젝트가 쓰는 기능만 흉내 낸다: doc().get/set, collection().where/orderBy/limit/get, runTransaction
type Data = Record<string, unknown>;
type Op = ">=" | ">" | "<=" | "<" | "==";

export class FakeFirestore {
  store = new Map<string, Data>();

  doc(path: string) {
    return new FakeDocRef(this, path);
  }
  collection(path: string) {
    return new FakeQuery(this, path, [], null, null);
  }
  async runTransaction<T>(fn: (tx: { get: (r: FakeDocRef) => Promise<FakeDocSnap>; set: (r: FakeDocRef, d: Data, o?: { merge?: boolean }) => void }) => Promise<T>) {
    return fn({ get: (r) => r.get(), set: (r, d, o) => void r.set(d, o) });
  }
  // 테스트 편의: 문서 직접 쓰기/읽기
  put(path: string, data: Data) {
    this.store.set(path, structuredClone(data));
  }
  read(path: string) {
    return this.store.get(path);
  }
}

class FakeDocSnap {
  constructor(public id: string, private value: Data | undefined) {}
  get exists() {
    return this.value !== undefined;
  }
  data() {
    return this.value ? structuredClone(this.value) : undefined;
  }
  get(field: string) {
    return this.value?.[field];
  }
}

class FakeDocRef {
  constructor(private db: FakeFirestore, public path: string) {}
  get id() {
    return this.path.split("/").pop()!;
  }
  async get() {
    return new FakeDocSnap(this.id, this.db.store.get(this.path));
  }
  async set(data: Data, opts?: { merge?: boolean }) {
    const prev = opts?.merge ? this.db.store.get(this.path) ?? {} : {};
    this.db.store.set(this.path, { ...prev, ...structuredClone(data) });
  }
}

class FakeQuery {
  constructor(
    private db: FakeFirestore,
    private path: string,
    private filters: [string, Op, unknown][],
    private order: [string, "asc" | "desc"] | null,
    private max: number | null
  ) {}
  where(field: string, op: Op, value: unknown) {
    return new FakeQuery(this.db, this.path, [...this.filters, [field, op, value]], this.order, this.max);
  }
  orderBy(field: string, dir: "asc" | "desc" = "asc") {
    return new FakeQuery(this.db, this.path, this.filters, [field, dir], this.max);
  }
  limit(n: number) {
    return new FakeQuery(this.db, this.path, this.filters, this.order, n);
  }
  async get() {
    const prefix = `${this.path}/`;
    let docs = [...this.db.store.entries()]
      .filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/"))
      .map(([p, d]) => new FakeDocSnap(p.slice(prefix.length), d));
    for (const [f, op, v] of this.filters) {
      docs = docs.filter((d) => {
        const x = d.get(f) as string | number | undefined;
        if (x === undefined) return false; // Firestore처럼 필드가 없으면 제외
        const val = v as string | number;
        return op === ">=" ? x >= val : op === ">" ? x > val : op === "<=" ? x <= val : op === "<" ? x < val : x === val;
      });
    }
    if (this.order) {
      const [f, dir] = this.order;
      docs = docs.filter((d) => d.get(f) !== undefined);
      docs.sort((a, b) => ((a.get(f) as string) < (b.get(f) as string) ? -1 : 1) * (dir === "desc" ? -1 : 1));
    }
    if (this.max !== null) docs = docs.slice(0, this.max);
    return { docs, empty: docs.length === 0, size: docs.length };
  }
}
