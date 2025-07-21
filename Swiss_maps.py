# -*- coding: utf-8 -*-
"""
Created on Mon Jul 21 14:27:34 2025

@author: pablo
"""

import plotly.io as pio
from dash import Dash, dcc, html
from dash.dependencies import Input, Output

# Load maps
fig_pop = pio.read_html("Swiss_Population_2023.html")[0]['fig']
fig_gdp = pio.read_html("Swiss_GDP_per_capita_2023.html")[0]['fig']
fig_gdpr = pio.read_html("Swiss_GDPR_2022.html")[0]['fig']

# Initialize app
app = Dash(__name__)
app.title = "Swiss Canton Maps"

# App layout
app.layout = html.Div([
    html.H1("Swiss Canton Statistics (2022–2023)", style={"textAlign": "center"}),

    dcc.Dropdown(
        id='map-selector',
        options=[
            {'label': 'Population (2023)', 'value': 'pop'},
            {'label': 'GDP per capita (2023)', 'value': 'gdp'},
            {'label': 'GDPR (2022)', 'value': 'gdpr'}
        ],
        value='pop',
        clearable=False,
        style={"width": "60%", "margin": "auto"}
    ),

    dcc.Graph(id='choropleth-map')
])

# Callback to update map
@app.callback(
    Output('choropleth-map', 'figure'),
    Input('map-selector', 'value')
)
def update_map(selected):
    if selected == 'pop':
        return fig_pop
    elif selected == 'gdp':
        return fig_gdp
    elif selected == 'gdpr':
        return fig_gdpr

# Run server
if __name__ == '__main__':
    app.run_server(debug=True)
