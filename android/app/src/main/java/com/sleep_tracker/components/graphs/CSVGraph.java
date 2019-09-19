package com.sleep_tracker.components.graphs;

import android.app.*;
import android.animation.Animator;
import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Shader;
import android.graphics.LinearGradient;
import android.os.*;
import android.support.annotation.NonNull;
import android.util.Log;
import android.widget.*;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.view.*;
import android.view.animation.AccelerateDecelerateInterpolator;

import com.androidplot.Plot;
import com.androidplot.ui.HorizontalPositioning;
import com.androidplot.ui.Size;
import com.androidplot.ui.SizeMetric;
import com.androidplot.ui.SizeMode;
import com.androidplot.ui.VerticalPositioning;
import com.androidplot.util.PixelUtils;
import com.androidplot.util.PixelUtils;
import com.androidplot.xy.BoundaryMode;
import com.androidplot.xy.FastLineAndPointRenderer;
import com.androidplot.xy.LineAndPointFormatter;
import com.androidplot.xy.XYGraphWidget;
import com.androidplot.xy.XYPlot;
import com.androidplot.xy.BoundaryMode;
import com.androidplot.xy.CatmullRomInterpolator;
import com.androidplot.xy.LineAndPointFormatter;
import com.androidplot.xy.ScalingXYSeries;
import com.androidplot.xy.SimpleXYSeries;
import com.androidplot.xy.XYGraphWidget;
import com.androidplot.xy.XYPlot;
import com.androidplot.xy.XYSeries;
import com.androidplot.xy.StepMode;
import com.androidplot.xy.*;
import com.androidplot.xy.*;

import com.facebook.react.modules.core.DeviceEventManagerModule;
//import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ThemedReactContext;
import com.univocity.parsers.csv.CsvParser;
import com.univocity.parsers.csv.CsvParserSettings;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileFilter;
import java.io.FileReader;
import java.io.IOException;
import java.io.IOException;
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.FileReader;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.text.FieldPosition;
import java.text.Format;
import java.text.ParsePosition;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.List;
import java.util.*;
import java.util.Random;

import org.apache.commons.lang3.time.DurationFormatUtils;
import org.apache.commons.io.comparator.LastModifiedFileComparator;
import org.apache.commons.io.filefilter.WildcardFileFilter;
import org.apache.commons.io.FilenameUtils;

/*
Reading and displaying 2000 records takes ~10s. Tested on Redmi Note 4
*/

public class CSVGraph extends FrameLayout {
    public XYPlot csvPlot;
    public int graphNumber;
    ThemedReactContext appContext;


    public CSVGraph(ThemedReactContext context) {
        super(context);
        appContext = context;
    }

    public void sendData(String eventName, String fileData) {
        appContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, fileData);
    }

    public void initView(int number) {
        // Check if the file is not empty and set graphNumber
        String directoryString = "/storage/emulated/0/SleepTracker/nights/";
        File directory = new File(directoryString);
        FileFilter fileFilter = new WildcardFileFilter("*.csv");
        File[] files = directory.listFiles(fileFilter);
        Arrays.sort(files, LastModifiedFileComparator.LASTMODIFIED_REVERSE);
        String stringFile = directoryString + files[number].getName();
        try {
            BufferedReader br = new BufferedReader(new FileReader(stringFile)); 
            if (br.readLine() != null) {
                graphNumber = number;
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        File file = new File(stringFile);
        String fileNameDotCsv = file.getName();
        String fileNameString = FilenameUtils.removeExtension(fileNameDotCsv);

        //** ANDROIDPLOT SETTINGS **\\
        csvPlot = new XYPlot(appContext, "CSV Plot");
        XYGraphWidget graph = csvPlot.getGraph();

        // Set size of plot
        SizeMetric height = new SizeMetric(1, SizeMode.FILL);
        SizeMetric width = new SizeMetric(1, SizeMode.FILL);
        graph.setSize(new Size(height, width));

        // Remove margins, padding and border (left, top, right, bottom)
        csvPlot.setPlotMargins(0, 0, 0, 0);
        csvPlot.setPlotPadding(0, 0, 0, 0);
        csvPlot.getBorderPaint().setColor(Color.WHITE);

        // Set zoom and enable autoselect of sampling level based on visible boundaries
        PanZoom panZoom = PanZoom.attach(csvPlot, PanZoom.Pan.HORIZONTAL, PanZoom.Zoom.STRETCH_HORIZONTAL);        
        csvPlot.getRegistry().setEstimator(new ZoomEstimator());
        panZoom.setZoomLimit(PanZoom.ZoomLimit.OUTER);
        panZoom.setZoomLimit(PanZoom.ZoomLimit.MIN_TICKS);

        // Set Formatter
        PixelUtils.init(getContext());
        LineAndPointFormatter lineFormatter = new LineAndPointFormatter(Color.rgb(154, 223, 130), null,  null, null); 
        lineFormatter.setInterpolationParams(new CatmullRomInterpolator.Params(10, CatmullRomInterpolator.Type.Centripetal));
        lineFormatter.getLinePaint().setStrokeWidth(8);

        // Set red line color that indicates "awake"
        float awake = 0.4f;
        lineFormatter.getLinePaint().setShader(new LinearGradient(
            0, 1000, 0, 0,
            new int[]{Color.RED, Color.RED, Color.rgb(154, 223, 130), Color.rgb(154, 223, 130)},
            new float[]{0, awake - 0.02f, awake + 0.01f, 1f},
            Shader.TileMode.REPEAT)); 

        // Create region  indicating deep sleep
        Number deepSleepThreshold = 50;
        XYRegionFormatter deepSleepFormatter = new XYRegionFormatter(Color.rgb(154, 223, 130));
        deepSleepFormatter.getPaint().setAlpha(80);
        RectRegion deepSleep = new RectRegion(0, Double.POSITIVE_INFINITY, deepSleepThreshold, Double.POSITIVE_INFINITY);
        lineFormatter.addRegion(deepSleep, deepSleepFormatter);

        // Remove extraneous elements
        csvPlot.getLayoutManager().remove(csvPlot.getLegend());

        // Set, format and adjust labels (Domain = X; Range = Y)
        csvPlot.setDomainStep(StepMode.SUBDIVIDE, 5);
        graph.setLineLabelEdges( XYGraphWidget.Edge.BOTTOM, XYGraphWidget.Edge.LEFT);
        graph.getLineLabelStyle(XYGraphWidget.Edge.LEFT).getPaint().setColor(Color.BLACK);
        graph.getLineLabelStyle(XYGraphWidget.Edge.BOTTOM).getPaint().setColor(Color.BLACK);
        graph.getLineLabelInsets().setLeft(PixelUtils.dpToPix(-14));
        graph.getLineLabelInsets().setBottom(PixelUtils.dpToPix(-24));
        graph.setLinesPerRangeLabel(11);
        graph.setLinesPerDomainLabel(5);
        graph.setPadding(PixelUtils.dpToPix(25), PixelUtils.dpToPix(10), PixelUtils.dpToPix(15), PixelUtils.dpToPix(40));
        graph.getLineLabelStyle(XYGraphWidget.Edge.LEFT).setFormat(new DecimalFormat("00"));
        graph.getLineLabelStyle(XYGraphWidget.Edge.BOTTOM).setRotation(-45);
        graph.getLineLabelStyle(XYGraphWidget.Edge.BOTTOM).setFormat(new Format() {
            @Override
            public StringBuffer format(Object obj, @NonNull StringBuffer toAppendTo, @NonNull FieldPosition pos) {
                // File title contains timestamp (in seconds) that represents time of the first record. Logback saves single line every 30s
                // Column 1 contains No. of ratio values. Timastamps in column 1 converted to X axis caused problems with zooming
                SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm");
                long timestamp = ((Long.parseLong(fileNameString) - 30) + 30 * ((Number) obj).longValue()) * 1000;
                Date date = new Date(timestamp);
                return dateFormat.format(date, toAppendTo, pos);
            }

            @Override
            public Object parseObject(String source, @NonNull ParsePosition pos) {
                return null;
            }
        });
        graph.getRangeGridLinePaint().setColor(Color.TRANSPARENT);
        graph.getDomainGridLinePaint().setColor(Color.TRANSPARENT);
        graph.getBackgroundPaint().setColor(Color.WHITE);
        graph.getGridBackgroundPaint().setColor(Color.TRANSPARENT);

        // Read csv file 
        new AsyncTask() {
            ProgressDialog progress;
            
            @Override
            protected void onPreExecute() {
                progress = ProgressDialog.show(appContext, "Loading", "Please wait...", true);
            }

            @Override
            protected Object doInBackground(Object[] objects) {
                progress.dismiss();
                // Generate points and min/max X value
                XYvalues series = generatePoints(files, directoryString);
                Double[] seriesX = series.getSeriesX();
                Double[] seriesY = series.getSeriesY();
                XYSeries dataSeries = new SimpleXYSeries(Arrays.asList(seriesX), Arrays.asList(seriesY), "Series");       
                SampledXYSeries sampledSeries = new SampledXYSeries(dataSeries, OrderedXYSeries.XOrder.ASCENDING, 2, 10);
                // Set outer X axis limits 
                Long minX = Long.parseLong(series.getMinX());
                Long maxX = Long.parseLong(series.getMaxX());                
                csvPlot.getOuterLimits().setMinX(minX);
                csvPlot.getOuterLimits().setMaxX(maxX);
                // Send info event
                String info = "INFO_" + String.valueOf(graphNumber);
                String duration = DurationFormatUtils.formatDuration(((Long.parseLong(fileNameString) + 30 * maxX) - Long.parseLong(fileNameString)) * 1000, "HH'h' mm'm'");
                sendData(info, duration); 
                // Set Y axis static and step by 10
                csvPlot.setRangeBoundaries(0, 100, BoundaryMode.FIXED);
                csvPlot.setRangeStep(StepMode.INCREMENT_BY_VAL, 10);
                // Add series
                csvPlot.addSeries(sampledSeries, lineFormatter);
                return null;
            }

            @Override
            protected void onPostExecute(Object result) {               
                csvPlot.redraw();
            }
        }.execute();
        
        // Set position of plot (should be tweaked in order to center chart position)
        graph.position(0, HorizontalPositioning.ABSOLUTE_FROM_LEFT.ABSOLUTE_FROM_LEFT, 0, VerticalPositioning.ABSOLUTE_FROM_TOP);

        // Add plot to CSVGraph
        this.addView(csvPlot, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    }
    
    private XYvalues generatePoints(File[] files, String directoryString) {
        // Get chosen .csv file and read two first columns: No. and value
        // Depending on 'graphNumber' in JS file: the newest file - 0; second - 1; third - 2; ...tenth - 9
        Double[] pointsX = null;
        Double[] pointsY = null;
        Arrays.sort(files, LastModifiedFileComparator.LASTMODIFIED_REVERSE);
        String stringFile = directoryString + files[graphNumber].getName();
        File file = new File(stringFile);
        List<String[]> data = new ArrayList<>();
        String[] content = null;
        CsvParserSettings settings = new CsvParserSettings();
        CsvParser parser = new CsvParser(settings);
        String[] rows;
        parser.beginParsing(file);
        String[] firstRow = parser.parseNext();
        String lastRow = null;
        while ((rows = parser.parseNext()) != null) {
            lastRow = rows[0];
            content = rows;
            data.add(content);
            pointsX = new Double[data.size()];
            pointsY = new Double[data.size()];
            for (int i = 0; i < data.size(); i++) {
                rows = data.get(i);
                pointsX[i] = new Double(Double.parseDouble(rows[0]));   
                pointsY[i] = new Double(Double.parseDouble(rows[1]));                    
            }      
        }
        return new XYvalues(pointsX, pointsY, firstRow[0], lastRow);        
    }

    // Helper class
    final class XYvalues {
        private final Double[] seriesX;
        private final Double[] seriesY;
        private final String minX;
        private final String maxX;

        public XYvalues(Double[] seriesX, Double[] seriesY, String minX, String maxX) {
            this.seriesX = seriesX;
            this.seriesY = seriesY;
            this.minX = minX;
            this.maxX = maxX;
        }

        public Double[] getSeriesX() {
            return seriesX;
        }

        public Double[] getSeriesY() {
            return seriesY;
        }

        public String getMinX() {
            return minX;
        }

        public String getMaxX() {
            return maxX;
        }
    }
}