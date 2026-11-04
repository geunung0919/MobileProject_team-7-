package expo.modules.paymentnotifications

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

data class PaymentNotificationRecord(
  val id: String,
  val packageName: String,
  val appLabel: String,
  val title: String,
  val text: String,
  val rawText: String,
  val postedAt: Long,
) {
  fun toMap(): Map<String, Any> = mapOf(
    "id" to id,
    "packageName" to packageName,
    "appLabel" to appLabel,
    "title" to title,
    "text" to text,
    "rawText" to rawText,
    "postedAt" to postedAt,
  )

  fun toJson(): JSONObject = JSONObject()
    .put("id", id)
    .put("packageName", packageName)
    .put("appLabel", appLabel)
    .put("title", title)
    .put("text", text)
    .put("rawText", rawText)
    .put("postedAt", postedAt)

  companion object {
    fun fromJson(value: JSONObject): PaymentNotificationRecord? {
      val id = value.optString("id")
      val packageName = value.optString("packageName")
      val rawText = value.optString("rawText")
      if (id.isBlank() || packageName.isBlank() || rawText.isBlank()) return null
      return PaymentNotificationRecord(
        id = id,
        packageName = packageName,
        appLabel = value.optString("appLabel"),
        title = value.optString("title"),
        text = value.optString("text"),
        rawText = rawText,
        postedAt = value.optLong("postedAt"),
      )
    }
  }
}

object PaymentNotificationStore {
  private const val PREFS = "jachwi.payment.notifications.v1"
  private const val QUEUE_KEY = "pending"
  private const val MAX_ITEMS = 50
  private const val RETENTION_MS = 30L * 24L * 60L * 60L * 1000L

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  @Synchronized
  fun read(context: Context): List<PaymentNotificationRecord> {
    val raw = prefs(context).getString(QUEUE_KEY, "[]") ?: "[]"
    val now = System.currentTimeMillis()
    val result = mutableListOf<PaymentNotificationRecord>()
    try {
      val array = JSONArray(raw)
      for (index in 0 until array.length()) {
        val item = PaymentNotificationRecord.fromJson(array.optJSONObject(index) ?: continue) ?: continue
        if (item.postedAt <= 0L || now - item.postedAt <= RETENTION_MS) {
          result.add(item)
        }
      }
    } catch (_: Exception) {
      prefs(context).edit().remove(QUEUE_KEY).apply()
      return emptyList()
    }

    val trimmed = result
      .sortedByDescending { it.postedAt }
      .take(MAX_ITEMS)
    if (trimmed.size != result.size) write(context, trimmed)
    return trimmed
  }

  @Synchronized
  fun upsert(context: Context, record: PaymentNotificationRecord) {
    val items = read(context)
      .filterNot { it.id == record.id }
      .toMutableList()
    items.add(0, record)
    write(context, items.take(MAX_ITEMS))
  }

  @Synchronized
  fun remove(context: Context, ids: Set<String>): Int {
    if (ids.isEmpty()) return 0
    val before = read(context)
    val after = before.filterNot { ids.contains(it.id) }
    write(context, after)
    return before.size - after.size
  }

  @Synchronized
  fun clear(context: Context): Int {
    val count = read(context).size
    prefs(context).edit().remove(QUEUE_KEY).apply()
    return count
  }

  private fun write(context: Context, records: List<PaymentNotificationRecord>) {
    val array = JSONArray()
    records.forEach { array.put(it.toJson()) }
    prefs(context).edit().putString(QUEUE_KEY, array.toString()).apply()
  }

  fun stableId(value: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8))
    return digest.take(16).joinToString("") { "%02x".format(it.toInt() and 0xff) }
  }
}
