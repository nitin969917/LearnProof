package com.learnproof.learn_proof_twa;

import android.content.Intent;
import android.os.Bundle;
import android.util.Base64;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import org.json.JSONObject;
import java.util.Set;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
        // Required by ModifiedMainActivityForSocialLoginPlugin contract
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();
        registerPlugin(GoogleAuth.class);
        registerPlugin(SocialLoginPlugin.class);
        handleNotificationIntent(getIntent());
    }

    private void createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            String channelId = "learnproof_notifications";
            CharSequence name = "LearnProof Notifications";
            String description = "Notifications for live rooms, chats, friend requests, and invitations";
            int importance = android.app.NotificationManager.IMPORTANCE_HIGH;
            android.app.NotificationChannel channel = new android.app.NotificationChannel(channelId, name, importance);
            channel.setDescription(description);
            channel.enableLights(true);
            channel.setLightColor(0xFFF97316);
            channel.enableVibration(true);
            android.app.NotificationManager notificationManager = getSystemService(android.app.NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNotificationIntent(intent);
    }

    private void handleNotificationIntent(Intent intent) {
        if (intent == null || intent.getExtras() == null) return;
        try {
            Bundle extras = intent.getExtras();
            JSONObject json = new JSONObject();
            Set<String> keys = extras.keySet();
            for (String key : keys) {
                Object value = extras.get(key);
                if (value != null) {
                    json.put(key, value.toString());
                }
            }
            if (json.length() > 0) {
                final String jsonString = json.toString();
                final String b64 = Base64.encodeToString(jsonString.getBytes("UTF-8"), Base64.NO_WRAP);
                runOnUiThread(() -> {
                    if (bridge != null && bridge.getWebView() != null) {
                        int[] delays = {300, 800, 2000, 4000};
                        for (int delay : delays) {
                            bridge.getWebView().postDelayed(() -> {
                                try {
                                    String script = "(function() {" +
                                            "  try {" +
                                            "    var raw = window.atob('" + b64 + "');" +
                                            "    var data = JSON.parse(decodeURIComponent(escape(raw)));" +
                                            "    var path = '/dashboard';" +
                                            "    if (data.roomName) { path = '/dashboard/live-rooms/' + data.roomName; }" +
                                            "    else if (data.type === 'CHAT_MESSAGE' && data.senderId) { path = '/dashboard/social/chats/direct/' + data.senderId; }" +
                                            "    else if (data.type === 'GROUP_MESSAGE' && data.groupId) { path = '/dashboard/social/chats/group/' + data.groupId; }" +
                                            "    else if (data.type === 'FRIEND_REQUEST_RECEIVED' || data.type === 'FRIEND_REQUEST') { path = '/dashboard/social?tab=friends&sub=pending'; }" +
                                            "    else if (data.type === 'FRIEND_REQUEST_ACCEPTED' || data.type === 'FRIEND_ACCEPTED') { path = '/dashboard/social?tab=friends'; }" +
                                            "    else if (data.clickAction && data.clickAction !== '/dashboard') { path = data.clickAction; }" +
                                            "    else if (data.click_action && data.click_action !== '/dashboard') { path = data.click_action; }" +
                                            "    else if (data.targetUrl) { path = data.targetUrl; }" +
                                            "    else if (data.url) { path = data.url; }" +
                                            "    else if (data.path) { path = data.path; }" +
                                            "    if (path.startsWith('http://') || path.startsWith('https://')) {" +
                                            "      try { var u = new URL(path); path = u.pathname + u.search + u.hash; } catch(e) {}" +
                                            "    }" +
                                            "    if (path && path !== '/dashboard') {" +
                                            "      sessionStorage.setItem('pending_notification_route', path);" +
                                            "      localStorage.setItem('pending_notification_route', path);" +
                                            "    }" +
                                            "    if (window.lpNavigate) { window.lpNavigate(path); }" +
                                            "    window.dispatchEvent(new CustomEvent('lp_notification_click', { detail: data }));" +
                                            "    window.dispatchEvent(new CustomEvent('lp_navigate', { detail: path }));" +
                                            "    if (window.handleNativeNotificationClick) { window.handleNativeNotificationClick(data); }" +
                                            "  } catch (e) { console.error('[MainActivity] Error in notification dispatch:', e); }" +
                                            "})();";
                                    bridge.getWebView().evaluateJavascript(script, null);
                                } catch (Exception ignored) {}
                            }, delay);
                        }
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
