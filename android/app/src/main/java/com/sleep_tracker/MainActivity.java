package com.sleep_tracker;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

import javax.annotation.Nullable;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.devio.rn.splashscreen.SplashScreen;

public class MainActivity extends ReactActivity {

    @Override
    protected String getMainComponentName() {
        return "SleepTracker";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
		SplashScreen.show(this, R.style.SplashScreenTheme); 
        super.onCreate(savedInstanceState);
        final Window win = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) { // for API >= 27
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Activity.KEYGUARD_SERVICE);
            keyguardManager.requestDismissKeyguard(this, null);
        } else {
            win.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON);
        }
    }

    @Override
    public void onBackPressed() {
        Intent startMain = new Intent(Intent.ACTION_MAIN);
        startMain.addCategory(Intent.CATEGORY_HOME);
        startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(startMain);
    }  


    public class AlarmActivityDelegate extends ReactActivityDelegate {
        private final String ALARM_ID = "alarmID";
        private final String MISSED_ALARMS = "missedAlarms";
        private Bundle mInitialProps = null;
        private final @Nullable Activity mActivity; 

        public AlarmActivityDelegate(Activity activity, String mainComponentName) {
            super(activity, mainComponentName);
            this.mActivity = activity;
        }

        @Override
        protected void onCreate(Bundle savedInstanceState) {
            mInitialProps = new Bundle();
            final Bundle bundle = mActivity.getIntent().getExtras();
            if (bundle != null && bundle.containsKey(ALARM_ID)) {
                mInitialProps.putString(ALARM_ID, bundle.getString(ALARM_ID));
            }
            if (bundle != null && bundle.containsKey(MISSED_ALARMS)) {
                mInitialProps.putString(MISSED_ALARMS, bundle.getString(MISSED_ALARMS));
            }   
            if (bundle != null && bundle.containsKey("launchAlarm")) {
                if (bundle.getString("launchAlarm").equals("ringtoneOn")) {
                    mInitialProps.putBoolean("alarmOn", true);
                }
            }       
            super.onCreate(savedInstanceState);
        }

        @Override
        protected Bundle getLaunchOptions() {
            return mInitialProps;
        }
    };

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new AlarmActivityDelegate(this, getMainComponentName());
    }
}
