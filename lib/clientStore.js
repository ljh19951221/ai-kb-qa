const DB_NAME = "badminton-kb"
const STORE = "docs"
const MAX_TEXT = 20000
const MAX_IMAGE = 450 * 1024

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function listImported() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function saveDoc(doc) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put(doc)
    tx.oncomplete = () => resolve(doc)
    tx.onerror = () => reject(tx.error)
  })
}

export async function removeDoc(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function importFiles(fileList) {
  const files = Array.from(fileList || [])
  const saved = []
  for (const file of files) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const name = file.name.replace(/\.[^.]+$/, "")
    if (/\.(md|txt)$/i.test(file.name)) {
      const text = (await readFileAsText(file)).slice(0, MAX_TEXT)
      saved.push(
        await saveDoc({
          id,
          title: name,
          type: "text",
          text,
          cover: "",
          coverAlt: "",
          createdAt: Date.now()
        })
      )
      continue
    }
    if (/\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
      if (file.size > MAX_IMAGE) {
        throw new Error(`${file.name} 超过 450KB，请压缩后再导入`)
      }
      const cover = await readFileAsDataUrl(file)
      saved.push(
        await saveDoc({
          id,
          title: name,
          type: "article",
          text: `这是一张导入的配图资料，文件名：${file.name}。结合用户问题说明羽毛球相关内容。`,
          cover,
          coverAlt: name,
          createdAt: Date.now()
        })
      )
      continue
    }
    throw new Error(`不支持 ${file.name}，请导入 md / txt / 图片`)
  }
  return saved
}

export function toExtraDocs(docs) {
  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    coverAlt: doc.coverAlt || "",
    text: String(doc.text || "").slice(0, 8000)
  }))
}
