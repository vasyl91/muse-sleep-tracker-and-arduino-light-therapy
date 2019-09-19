package com.sleep_tracker.components.battery;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.PowerManager;
import android.util.Log;

import com.choosemuse.libmuse.Battery;
import com.choosemuse.libmuse.Muse;
import com.choosemuse.libmuse.MuseArtifactPacket;
import com.choosemuse.libmuse.MuseDataListener;
import com.choosemuse.libmuse.MuseDataPacket;
import com.choosemuse.libmuse.MuseDataPacketType;
import com.sleep_tracker.MainApplication;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

//Created by Vasyl 19/11/2018

public class BatteryModule extends ReactContextBaseJavaModule {

    public DataListener batteryListener;
    public static String packageName;
    MainApplication appState;

    public BatteryModule(ReactApplicationContext reactContext) {
        super(reactContext);
        appState = ((MainApplication)reactContext.getApplicationContext());
    }     

    @Override
    public String getName() {
        return "Battery";
    }

    private void sendBattery(String eventName, int battery) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, battery);
    }

    @ReactMethod
    public void startReading() {
        batteryListener = new DataListener();
        appState.connectedMuse.registerDataListener(batteryListener, MuseDataPacketType.BATTERY);
    }

    @ReactMethod
    public void stopReading() {
        appState.connectedMuse.unregisterDataListener(batteryListener, MuseDataPacketType.BATTERY);
    }

    @ReactMethod
    public void batteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager powerManager = (PowerManager) appState.getSystemService(appState.POWER_SERVICE);
            String packageName = appState.getPackageName();
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                try { // some devices lack activity to handle this intent
                    Intent intent = new Intent(); 
                    intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    appState.startActivity(intent);
                } catch (Exception e) {
                }
            }
        }
    }

    public class DataListener extends MuseDataListener {

        double value;
        
        @Override
        public void receiveMuseDataPacket(final MuseDataPacket p, final Muse muse) {
            getBatteryValue(value, p);
        }

        private void getBatteryValue(double value, MuseDataPacket p) {
            value = p.getBatteryValue(Battery.CHARGE_PERCENTAGE_REMAINING);
            int battery = (int) value;
            sendBattery("BATTERY", battery);
        }

        @Override
        public void receiveMuseArtifactPacket(final MuseArtifactPacket p, final Muse muse) {

        }
    }
}
