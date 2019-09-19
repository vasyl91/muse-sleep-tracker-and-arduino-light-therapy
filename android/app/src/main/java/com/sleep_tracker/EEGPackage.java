package com.sleep_tracker;

import android.util.Log;

import com.sleep_tracker.components.classifier.ClassifierModule;
import com.sleep_tracker.components.emitter.AppNativeEventEmitter;
import com.sleep_tracker.components.managers.CSVGraphHelper;
import com.sleep_tracker.components.managers.CSVGraphManager;
import com.sleep_tracker.components.managers.FilterGraphManager;
import com.sleep_tracker.components.managers.EEGGraphManager;
import com.sleep_tracker.components.managers.PSDGraphManager;
import com.sleep_tracker.components.connector.ConnectorModule;
import com.sleep_tracker.components.battery.BatteryModule;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.List;

public class EEGPackage implements ReactPackage {

    public MainApplication appState;

    @Override
    // Register Native Modules to JS
    public List<NativeModule> createNativeModules(ReactApplicationContext reactApplicationContext) {
        appState.eventEmitter = new AppNativeEventEmitter(reactApplicationContext);
        Log.w("eventEmitter", " " + appState.eventEmitter);
        return Arrays.<NativeModule>asList(
                new ConnectorModule(reactApplicationContext),
                new ClassifierModule(reactApplicationContext),
                new BatteryModule(reactApplicationContext),
                new CSVGraphHelper(reactApplicationContext),
                appState.eventEmitter);
    }

    @Override
    // Registers Java ViewManagers to JS
    public List<ViewManager> createViewManagers(ReactApplicationContext reactApplicationContext) {
        return Arrays.<ViewManager>asList(
                new EEGGraphManager(),
                new FilterGraphManager(),
                new PSDGraphManager(),
                new CSVGraphManager()
        );
    }
}
