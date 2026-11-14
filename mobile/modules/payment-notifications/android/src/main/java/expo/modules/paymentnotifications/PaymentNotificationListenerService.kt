package expo.modules.paymentnotifications

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class PaymentNotificationListenerService : NotificationListenerService() {
  private val amountPattern = Regex("""(?<!\d)(?:\d{1,3}(?:,\d{3})+|\d+)\s*원""")
  private val positiveKeywords = listOf(
    "승인", "결제", "이용", "사용", "구매",
    "카카오페이", "네이버페이", "토스페이", "삼성페이", "pay"
  )
  private val rejectKeywords = listOf(
    "승인취소", "결제취소", "취소완료", "승인거절", "결제실패",
    "거절", "실패", "환불", "입금", "청구서", "혜택", "이벤트", "광고"
  )

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null || sbn.packageName == packageName) return
    val notification = sbn.notification ?: return
    val extras = notification.extras ?: return

    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
    val normalText = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim().orEmpty()
    val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim().orEmpty()
    val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()?.trim().orEmpty()
    val textLines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
      ?.map { it.toString().trim() }
      ?.filter { it.isNotBlank() }
      .orEmpty()

    val bodyParts = buildList {
      if (normalText.isNotBlank()) add(normalText)
      if (bigText.isNotBlank() && bigText != normalText) add(bigText)
      if (subText.isNotBlank() && subText != normalText && subText != bigText) add(subText)
      textLines.forEach { line ->
        if (line.isNotBlank() && !contains(line)) add(line)
      }
    }
    val body = bodyParts.joinToString("\n")
    val combined = listOf(title, body).filter { it.isNotBlank() }.joinToString("\n")
    if (!looksLikePayment(combined)) return

    val appLabel = try {
      val appInfo = packageManager.getApplicationInfo(sbn.packageName, 0)
      packageManager.getApplicationLabel(appInfo).toString()
    } catch (_: Exception) {
      sbn.packageName
    }

    val rawText = listOf(appLabel, title, body)
      .map { it.trim() }
      .filter { it.isNotBlank() }
      .distinct()
      .joinToString("\n")
      .take(5000)

    if (rawText.length < 3) return

    val stableSourceKey = sbn.key
      ?: (sbn.packageName + ":" + sbn.id + ":" + sbn.tag.orEmpty())

    PaymentNotificationStore.upsert(
      applicationContext,
      PaymentNotificationRecord(
        id = PaymentNotificationStore.stableId(stableSourceKey),
        packageName = sbn.packageName,
        appLabel = appLabel.take(100),
        title = title.take(500),
        text = body.take(3000),
        rawText = rawText,
        postedAt = sbn.postTime.takeIf { it > 0L } ?: System.currentTimeMillis(),
      )
    )
  }

  private fun looksLikePayment(text: String): Boolean {
    val normalized = text.lowercase()
    if (!amountPattern.containsMatchIn(text)) return false
    if (rejectKeywords.any { normalized.contains(it.lowercase()) }) return false
    return positiveKeywords.any { normalized.contains(it.lowercase()) }
  }
}
