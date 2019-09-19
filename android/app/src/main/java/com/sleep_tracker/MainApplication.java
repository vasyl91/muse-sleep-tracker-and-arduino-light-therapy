package com.sleep_tracker;

import android.app.Application;
import com.choosemuse.libmuse.Muse;
import com.sleep_tracker.components.emitter.AppNativeEventEmitter;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;

import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.wheelpicker.WheelPickerPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.AlexanderZaytsev.RNI18n.RNI18nPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.dawnchorus.alarms.AlarmPackage; 
import com.rusel.RCTBluetoothSerial.*;
// Prevents react-native-svg issue #135
import com.horcrux.svg.SvgPackage;

import java.util.Arrays;
import java.util.List;


public class MainApplication extends Application implements ReactApplication {

  // Global singleton Muse
  public static Muse connectedMuse;

  // Global singleton event emitter
  public static AppNativeEventEmitter eventEmitter;

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return com.sleep_tracker.BuildConfig.DEBUG;
    }

    // All packages for native libraries must be added to the array returned by this method
    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new SplashScreenReactPackage(),
        new AlarmPackage(),
        new WheelPickerPackage(),
        new LottiePackage(),
        new RNI18nPackage(),
        new BackgroundTimerPackage(),
        new RCTBluetoothSerialPackage(),
        new SvgPackage(),
        new EEGPackage()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
      return mReactNativeHost;
  }
}


