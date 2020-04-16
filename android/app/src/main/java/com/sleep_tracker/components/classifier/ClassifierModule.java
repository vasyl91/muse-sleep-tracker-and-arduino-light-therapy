package com.sleep_tracker.components.classifier;

import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;

import com.choosemuse.libmuse.Eeg;
import com.choosemuse.libmuse.Muse;
import com.choosemuse.libmuse.MuseArtifactPacket;
import com.choosemuse.libmuse.MuseDataListener;
import com.choosemuse.libmuse.MuseDataPacket;
import com.choosemuse.libmuse.MuseDataPacketType;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.sleep_tracker.MainApplication;
import com.sleep_tracker.components.csv.EEGFileWriter;
import com.sleep_tracker.components.signal.BandPowerExtractor;
import com.sleep_tracker.components.signal.FFT;
import com.sleep_tracker.components.signal.Filter;
import com.sleep_tracker.components.signal.NoiseDetector;
import com.sleep_tracker.components.signal.PSDBuffer2D;

import java.io.File;
import java.io.FileFilter;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedList;
import java.util.Timer;
import java.util.TimerTask;

import org.apache.commons.io.comparator.LastModifiedFileComparator;
import org.apache.commons.io.filefilter.WildcardFileFilter;
import org.apache.commons.io.FileUtils;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;

// Bridged native module for interacting with the headband for the classifier (and noise detection)

public class ClassifierModule extends ReactContextBaseJavaModule implements BufferListener {
    public static final int FFT_LENGTH = 256;
    public static final int NUM_CHANNELS = 4;
    public static final int EPOCHS_PER_SECOND = 4;
    public static int alphaResult;
    public static int betaResult;    
    public static int deltaResult;
    public static int thetaResult;
    public int samplingRate = 256;
    private int nbBins;
    private int notchFrequency = 60;
    private boolean isTracking;
    private boolean isLogging;
    private boolean alphaWave;
    private boolean betaWave;
    private boolean deltaWave;
    private boolean thetaWave;
    public static String timestamp;
    public BandPowerExtractor bandExtractor;
    public ClassifierDataListener dataListener;
    public EpochBuffer eegBuffer;
    public Timer timer; 
    private HandlerThread dataThread;
    private Handler dataHandler;
    private Promise collectionPromise;
    private PSDBuffer2D psdBuffer2D;
    private FFT fft;    
    public NoiseDetector noiseDetector = new NoiseDetector(1000, getReactApplicationContext());
    private final static Logger logger = LoggerFactory.getLogger(ClassifierModule.class);   
    MainApplication appState;
    
    // Count files in provided directory
    public int getFilesCount(File file) {
      File[] files = file.listFiles();
      int count = 0;
      for (File f : files)
        if (f.isDirectory())
          count += getFilesCount(f);
        else
          count++;

      return count;
    }

    public ClassifierModule(ReactApplicationContext reactContext) {
        super(reactContext);
        appState = ((MainApplication)reactContext.getApplicationContext());
    }     

    @Override
    public String getName() {
        return "Classifier";
    }

    // Called to emit events to event listeners in JS
    private void sendEvent(String eventName, int result) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, result);
    }

    private void sendAlpha(String eventName, int alpha) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, alpha);
                alphaResult = alpha;
    }

    private void sendBeta(String eventName, int beta) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, beta);
                betaResult = beta;
    }

    private void sendDelta(String eventName, int delta) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, delta);
                deltaResult = delta;
    }

    private void sendTheta(String eventName, int theta) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, theta);
                thetaResult = theta;
    }

    // ------------------------------------------------------------------------------
    // React methods

    @ReactMethod
    public void startSaveCSV() {
        isLogging = true;

        // Create PSDBuffer to smooth over last 4 collected epochs
        psdBuffer2D = new PSDBuffer2D(4, NUM_CHANNELS, nbBins);

        // Collect 4 epochs a second for collecting training data
        eegBuffer = new EpochBuffer(samplingRate, NUM_CHANNELS, samplingRate / EPOCHS_PER_SECOND);
        eegBuffer.addListener(this);

        appState.connectedMuse.registerDataListener(dataListener, MuseDataPacketType.EEG);
        startThreadTracker();

        // Create name for new .csv file
        timestamp = String.valueOf(System.currentTimeMillis()).substring(0, 8);
        
        // Schedule timer to append lines every second
        timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                long time = System.currentTimeMillis() / 1000; // to seconds
                int a;
                int b;
                int d;
                int t;

                // Division by zero throws an error so ints musn't return zero
                if (alphaResult == 0) { a = alphaResult + 1; } else { a = alphaResult; }
                if (betaResult == 0) { b = betaResult + 1; } else { b = betaResult; }
                if (deltaResult == 0) { d = deltaResult + 1; } else { d = deltaResult; }
                if (thetaResult == 0) { t = thetaResult + 1; } else { t = thetaResult; }
                
                // Takes ratio of delta/theta power and makes it a percentage
                int ratio = (d/t) * 100;
         
                String csvLine = time + "," + ratio + "," + a + "," + b + "," + d + ","+ t;
                logger.info(csvLine);
            }
        }, 0, 1000);
    }

    @ReactMethod
    public void stopSaveCSV() {
        isLogging = false;
        appState.connectedMuse.unregisterDataListener(dataListener, MuseDataPacketType.EEG);
        stopThreadTracker();

        // Cancel timer
        timer.cancel();
        timer.purge();

        // Create .csv file
        File directory = new File("/storage/emulated/0/SleepTracker/files/csv/");
        File dataCsv = new File("/storage/emulated/0/SleepTracker/files/log/data.csv");
        File timestampCsv = new File(directory, timestamp);
        try {
            if (!directory.exists()) {
                directory.mkdirs();   
            }
            FileUtils.copyFile(dataCsv, timestampCsv);
            PrintWriter writer = new PrintWriter(dataCsv);
            writer.print("");
            writer.close();

            // Remove the oldest file and leave only 10 most recent .csv files
            File theOldestFile = null;
            FileFilter fileFilter = new WildcardFileFilter("*.csv");
            File[] files = directory.listFiles(fileFilter);
            if (getFilesCount(directory) > 10) {
                // The newest file - 0; second - 1; third - 2; and so on
                Arrays.sort(files, LastModifiedFileComparator.LASTMODIFIED_REVERSE);
                theOldestFile = files[10];
                theOldestFile.delete();
            }            
        }
        catch(IOException e) {
            // Catch exception
        }
    }

    @ReactMethod
    public void init() {
        if(appState.connectedMuse != null) {
            if (!appState.connectedMuse.isLowEnergy()) {
                samplingRate = 220;
            }
        }
        fft = new FFT(samplingRate, FFT_LENGTH, samplingRate);
        nbBins = fft.getFreqBins().length;
        bandExtractor = new BandPowerExtractor(fft.getFreqBins());
        dataListener = new ClassifierDataListener();
    }

    @ReactMethod
    public void startTracking() {
        isTracking = true;

        // Create PSDBuffer to smooth over last 4 collected epochs
        psdBuffer2D = new PSDBuffer2D(4, NUM_CHANNELS, nbBins);

        // Collect 4 epochs a second for collecting training data
        eegBuffer = new EpochBuffer(samplingRate, NUM_CHANNELS, samplingRate / EPOCHS_PER_SECOND);
        eegBuffer.addListener(this);

        appState.connectedMuse.registerDataListener(dataListener, MuseDataPacketType.EEG);
        startThreadTracker();
    }

    @ReactMethod
    public void stopTracking() {
        isTracking = false;
        appState.connectedMuse.unregisterDataListener(dataListener, MuseDataPacketType.EEG);
        stopThreadTracker();
    }

    @ReactMethod
    public void startClassifier(int notchFrequency) {
        if(appState.connectedMuse != null) {
            if (!appState.connectedMuse.isLowEnergy()) {
                samplingRate = 220;
            }
        }
        this.notchFrequency = notchFrequency;

        fft = new FFT(samplingRate, FFT_LENGTH, samplingRate);
        nbBins = fft.getFreqBins().length;
        bandExtractor = new BandPowerExtractor(fft.getFreqBins());
        dataListener = new ClassifierDataListener();
    }

    // Just starts the necessary listening and signal processing functions in order to send noise
    // events back to React layer
    @ReactMethod
    public void startNoiseListener() {
        // Sample noise twice a second
        eegBuffer = new EpochBuffer(samplingRate, NUM_CHANNELS, samplingRate / 2);
        eegBuffer.addListener(this);
        appState.connectedMuse.registerDataListener(dataListener, MuseDataPacketType.EEG);
        startThreadTracker();
    }

    @ReactMethod
    public void stopNoiseListener() {
        appState.connectedMuse.unregisterDataListener(dataListener, MuseDataPacketType.EEG);
        stopThreadTracker();
    }

    // Thread management methods

    public void startThreadTracker() {
        Log.w("Tracker", "startthread");
        dataThread = new HandlerThread("dataThread");
        dataThread.start();
        dataHandler = new Handler(dataThread.getLooper());
    }

    public void stopThreadTracker() {
        Log.w("Tracker", "stopthread");

        if (dataHandler != null) {
            // Removes all runnables and things from the Handler
            dataHandler.removeCallbacksAndMessages(null);
            dataThread.quit();
        }
    }

    // ------------------------------------------------------------------------------
    // Helper functions

    public void getEpoch(double[][] buffer) {
        dataHandler.post(new ClassifierRunnable(buffer));
    }

    public int measureAlpha(double[] means){
        return (int) ((means[2]) * 100);
    } 

    public int measureBeta(double[] means){
        return (int) ((means[3]) * 100);
    } 

    public int measureDelta(double[] means){
        return (int) ((means[0]) * 100);
    }

    public int measureTheta(double[] means){
        return (int) ((means[1]) * 100);
    } 

    // ------------------------------------------------------------------------------
    // Helper Classes

    public class ClassifierRunnable implements Runnable {

        private double[][] rawBuffer;
        private double[][] PSD;
        private double[] bandMeans;

        public ClassifierRunnable(double[][] buffer) {
            rawBuffer = buffer;
            PSD = new double[NUM_CHANNELS][nbBins];
        }

        @Override
        public void run() {
            if (noisePresent(rawBuffer)) {
                Log.w("SleepTracker", "noise");
                return;
            }

            else if(isTracking) {
                getSmoothPSD(rawBuffer);

                bandMeans = bandExtractor.extract1D(PSD);

                int score = measureAlpha(bandMeans);

                Log.w("SleepTracker", "Sleep score" + score);

                sendEvent("SLEEP_SCORE", score);
            }

            else if(isLogging) {
                getSmoothPSD(rawBuffer);

                bandMeans = bandExtractor.extract1D(PSD);

                alphaResult = measureAlpha(bandMeans);
                betaResult = measureBeta(bandMeans);
                deltaResult = measureDelta(bandMeans);
                thetaResult = measureTheta(bandMeans);
            }
        }

        public boolean noisePresent(double[][] buffer) {
            for (boolean value : noiseDetector.detectArtefact(buffer)) {
                if (value) {
                    return true;
                }
            }
            return false;
        }

        public void getPSD(double[][] buffer) {
            // [nbch][nbsmp]
            for (int i = 0; i < NUM_CHANNELS; i++) {
                double[] channelPower = fft.computeLogPSD(buffer[i]);
                for (int j = 0; j < channelPower.length; j++) {
                    PSD[i][j] = channelPower[j];
                }
            }
        }

        public void getSmoothPSD(double[][] buffer) {
            // [nbch][nbsmp]
            for (int i = 0; i < NUM_CHANNELS; i++) {
                double[] channelPower = fft.computeLogPSD(buffer[i]);
                for (int j = 0; j < channelPower.length; j++) {
                    PSD[i][j] = channelPower[j];
                }
            }
            psdBuffer2D.update(PSD);
            PSD = psdBuffer2D.mean();
        }
    }


    public class ClassifierDataListener extends MuseDataListener {
        double[] newData;
        boolean filterOn;
        public Filter bandstopFilter;
        public double[][] bandstopFiltState;

        // if connected Muse is a 2016 BLE version, init a bandstop filter to remove 60hz noise
        ClassifierDataListener() {
            if (samplingRate == 256) {
                filterOn = true;
                bandstopFilter = new Filter(samplingRate, "bandstop", 5, notchFrequency - 5, notchFrequency + 5);
                bandstopFiltState = new double[4][bandstopFilter.getNB()];
            }
            newData = new double[4];
        }

        // Updates eegBuffer with new data from all 4 channels. Bandstop filter for 2016 Muse
        @Override
        public void receiveMuseDataPacket(final MuseDataPacket p, final Muse muse) {
            getEegChannelValues(newData, p);

            if (filterOn) {
                bandstopFiltState = bandstopFilter.transform(newData, bandstopFiltState);
                newData = bandstopFilter.extractFilteredSamples(bandstopFiltState);
            }

            eegBuffer.update(newData);
        }

        // Updates newData array based on incoming EEG channel values
        private void getEegChannelValues(double[] newData, MuseDataPacket p) {
            newData[0] = p.getEegChannelValue(Eeg.EEG2); // delta - Left forehead (originally Left ear)
            newData[1] = p.getEegChannelValue(Eeg.EEG2); // theta - Left forehead 
            newData[2] = p.getEegChannelValue(Eeg.EEG3); // alpha - Right forehead 
            newData[3] = p.getEegChannelValue(Eeg.EEG3); // beta - Right forehead (originally Right ear) 
        }

        @Override
        public void receiveMuseArtifactPacket(final MuseArtifactPacket p, final Muse muse) {
            // Does nothing for now
        }
    }
}





