package expo.modules.paymentnotifications;

import java.text.Normalizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Filters notification text before it is placed in the local inbox. */
final class PaymentAlertMatcher {
  private static final Pattern PURCHASE =
      Pattern.compile("승인|결제|이용|사용|구매");
  private static final Pattern EXCLUDED = Pattern.compile(
      "(?:승인|결제|이용)\\s*(?:취소|거절|실패|예정)|취소\\s*(?:완료|금액)|환불|"
      + "거절|실패|입금|청구서|이벤트|광고|결제\\s*(?:시|하면|하시면)|"
      + "(?:쿠폰|혜택)\\s*(?:받기|안내)|(?:할인|적립)\\s*(?:혜택|예정)");
  private static final Pattern SECONDARY_AMOUNT =
      Pattern.compile("누적|잔액|한도|청구|할인|적립|포인트|거스름");
  private static final String NUMBER = "(?<![0-9,.])([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?![0-9,.])";
  private static final Pattern WON = Pattern.compile(NUMBER + "\\h*원");
  private static final Pattern LABELED_AMOUNT =
      Pattern.compile("(?:승인|결제|이용)\\h*금액\\h*:?\\h*" + NUMBER);

  static String normalize(String text) {
    return Normalizer.normalize(text.substring(0, Math.min(text.length(), 5000)),
        Normalizer.Form.NFKC);
  }

  static boolean matches(String text) {
    String normalized = normalize(text);
    if (!PURCHASE.matcher(normalized).find() || EXCLUDED.matcher(normalized).find()) {
      return false;
    }
    for (String line : normalized.split("\\R")) {
      if (!SECONDARY_AMOUNT.matcher(line).find()
          && (containsValidAmount(WON.matcher(line)) || containsValidAmount(LABELED_AMOUNT.matcher(line)))) {
        return true;
      }
    }
    return false;
  }

  private static boolean containsValidAmount(Matcher matcher) {
    while (matcher.find()) {
      String digits = matcher.group(1).replace(",", "");
      if (digits.length() > 10) continue;
      long amount = Long.parseLong(digits);
      if (amount > 0 && amount <= 1_000_000_000L) return true;
    }
    return false;
  }

  private PaymentAlertMatcher() {}
}
