import React from 'react';
import Plot from 'react-plotly.js';
import _ from 'lodash';
import { useParams } from 'react-router-dom';

export default function AboutTrailPage(props) {
  const urlParams = useParams();
  let trail =  _.find(props.trails, {trailName: urlParams.trailname});

  /*function makePlot(trailId) {
    var data = [
      {
        x: DATA.trafficHistory[trailId]['dates'],
        y: DATA.trafficHistory[trailId]['bike'],
        type: 'bar'
      }
    ];
  
    let config = {
      title: 'Historical traffic',
      responsive: true
    }
      
    let plot = document.getElementById('traffic-plot');
    Plotly.newPlot(plot, data, config);
  }*/
  let plotlyConfig = {
    width: 320,
    height: 240,
    title: 'Historical traffic',
    responsive: true
  }

  return (
    <div>
      <h2>{trail.trailName}</h2>
      <p>{trail.description}</p>
      <Plot
        data={[
          {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]},
        ]}
        layout={plotlyConfig}
      />
    </div>
  );
}