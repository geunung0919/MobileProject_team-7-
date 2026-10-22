package expo.modules.paymentnotifications

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PaymentNotificationsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PaymentNotifications")

    Function("isAccessEnabled") {
      val context = appContext.reactContext ?: return@Function false
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners"
      ).orEmpty()

      enabled.split(":")
        .mapNotNull { ComponentName.unflattenFromString(it) }
        .any { it.packageName == context.packageName }
    }

    Function("openAccessSettings") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("Android context를 사용할 수 없어요.")
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }

    Function("getPendingNotifications") {
      val context = appContext.reactContext
        ?: return@Function emptyList<Map<String, Any>>()
      PaymentNotificationStore.read(context).map { it.toMap() }
    }

    Function("markProcessed") { ids: List<String> ->
      val context = appContext.reactContext ?: return@Function 0
      PaymentNotificationStore.remove(context, ids.toSet())
    }

    Function("clearPending") {
      val context = appContext.reactContext ?: return@Function 0
      PaymentNotificationStore.clear(context)
    }
  }
}
