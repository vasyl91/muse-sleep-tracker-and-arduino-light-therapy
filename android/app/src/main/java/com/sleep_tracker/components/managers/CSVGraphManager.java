package com.sleep_tracker.components.managers;

import android.util.Log;
import android.view.View;

import com.sleep_tracker.components.graphs.CSVGraph;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

public class CSVGraphManager extends SimpleViewManager<CSVGraph> {
    private final static String REACT_CLASS = "CSV_GRAPH";
    CSVGraph csvGraph;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public CSVGraph createViewInstance(ThemedReactContext context) {
        csvGraph = new CSVGraph(context);
        return csvGraph;
    }

    @Override
    public void onDropViewInstance(CSVGraph csvGraph) {
        csvGraph.removeAllViews();
    }

    @ReactProp(name = "graphNumber")
    public void initView(CSVGraph csvGraph, @Nullable int number){
        csvGraph.initView(number);
    }

    @Override
    protected void onAfterUpdateTransaction(CSVGraph view) {
        super.onAfterUpdateTransaction(view);
    }
}
