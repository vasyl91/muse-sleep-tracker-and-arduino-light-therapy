package com.sleep_tracker.components.managers;

import android.content.pm.PackageManager;
import android.Manifest;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.sleep_tracker.MainApplication;

import java.io.File;
import java.io.FileFilter;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import javax.annotation.Nullable;

import org.apache.commons.io.comparator.LastModifiedFileComparator;
import org.apache.commons.io.filefilter.WildcardFileFilter;
import org.apache.commons.io.FilenameUtils;

//Created by Vasyl 25/01/2019

public class CSVGraphHelper extends ReactContextBaseJavaModule {
    public Boolean fileTitle;
    public String directoryString = "/storage/emulated/0/SleepTracker/nights/";
    public File directory = new File(directoryString);
    public MainApplication appState;

    public CSVGraphHelper(ReactApplicationContext reactContext) {
        super(reactContext);
        appState = ((MainApplication)reactContext.getApplicationContext());
    }     

    @Override
    public String getName() {
        return "CSVGraphHelper";
    }

    public void sendData(String eventName, String fileData) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, fileData);
    }

    @ReactMethod
    public void setFiles() {
        try {
            if (ContextCompat.checkSelfPermission(appState, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
                // Check if directory exists. If not, create it and create 10 empty .csv files to avoid errors
                if (!directory.isDirectory()) {
                    directory.mkdirs();
                    File f;
                    for(int i=0;i<10;i++) {
                        String timestamp = String.valueOf(System.currentTimeMillis()).substring(0, 8);
                        f = new File(directoryString + timestamp + "0" + i + ".csv");
                        f.createNewFile();
                    }
                } 
                // Get .csv file title and if file is not empty - convert it to proper date format and send it to JS          
                FileFilter fileFilter = new WildcardFileFilter("*.csv");
                File[] files = directory.listFiles(fileFilter);
                Arrays.sort(files, LastModifiedFileComparator.LASTMODIFIED_REVERSE);
                for(int j=0;j<10;j++) {
                    String stringFile = directoryString + files[j].getName();
                    File file = new File(stringFile); 
                    if (file.length() > 0) { 
                        String fileNameDotCsv = file.getName();
                        String fileNameString = FilenameUtils.removeExtension(fileNameDotCsv);
                        String fileName = new SimpleDateFormat("dd.MM.yyyy - HH:mm").format(new Date((Long.parseLong(fileNameString)) * 1000));
                        String eventName = "TITLE_" + String.valueOf(j);
                        sendData(eventName, fileName);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}


