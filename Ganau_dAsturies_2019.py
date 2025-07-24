# -*- coding: utf-8 -*-
"""
Created on Thu Jul 24 22:52:38 2025

@author: pablo
"""

import json
import pandas as pd
import plotly.express as px
from plotly.offline import plot

# Load GeoJSON
with open("Conceyos_Asturies.geojson", "r", encoding="utf-8") as f:
    geojson_data = json.load(f)

# Load livestock data
df = pd.read_csv("livestock_asturias_2019_full.csv",dtype={"ID": str})

# Merge surface_km2 from GeoJSON into DataFrame using ID
surface_dict = {
    feature["properties"]["ID"]: feature["properties"]["surface_km2"]
    for feature in geojson_data["features"]
}
df["surface_km2"] = df["ID"].map(surface_dict)

# Compute total livestock
df["Total"] = df["Cattle"] + df["Horses"] + df["Sheep"] + df["Goats"]

# Compute livestock density (animals per km²)
df["Density"] = df["Total"] / df["surface_km2"]

# Map NAMEUNIT from GeoJSON using ID
nameunit_dict = {
    feature["properties"]["ID"]: feature["properties"]["NAMEUNIT"]
    for feature in geojson_data["features"]
}
df["NAMEUNIT"] = df["ID"].map(nameunit_dict)


# Create hover label
df["hover_label"] = (
    "<b>" + df["NAMEUNIT"] + "<b><br>" + "<br>" +
    "🐄 Vaques: " + df["Cattle"].astype(int).map("{:,}".format) + "<br>" +
    "🐎 Caballos: " + df["Horses"].astype(int).map("{:,}".format) + "<br>" +
    "🐑 Oveyes: " + df["Sheep"].astype(int).map("{:,}".format) + "<br>" +
    "🐐 Cabres: " + df["Goats"].astype(int).map("{:,}".format) + "<br>" +
    "🐾 Total: " + df["Total"].astype(int).map("{:,}".format) + "<br>" +
    "📐 Densidá: " + df["Density"].round(2).astype(str) + " /km²"
)

# Build choropleth map
fig = px.choropleth_map(
    df,
    geojson=geojson_data,
    locations="ID",
    featureidkey="properties.ID",
    color="Density",
    color_continuous_scale="YlGn",
    map_style="carto-positron",
    zoom=8.15,
    center={"lat": 43.3, "lon": -5.825},
    opacity=0.6,
    hover_name="NAMEUNIT",
    hover_data={"hover_label": True, "Total": False, "ID": False}
)

fig.update_traces(
    hovertemplate=df["hover_label"]
)

fig.update_layout(
    title={
        "text": "Cabaña Ganadera por Conceyu (2019)<br><sup> Cabeces totales: {:,}</sup>".format(sum(df["Total"])),
    },
    margin={"r": 0, "t": 60, "l": 0, "b": 0},
    coloraxis_colorbar=dict(title="Animales / km²")
)

plot(fig, filename='Cabana_dAsturies_2019.html', auto_open=True)
