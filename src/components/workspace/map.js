'use strict';

var React = require('react');
var Reflux = require('reflux');
var actions = require('../../actions/actions');
var MapStore = require('../../stores/map_store');
var taskObj = require('../../mixins/taskobj');
var uniqueId = require('lodash/utility/uniqueId');

require('mapbox.js');
require('leaflet-osm');

module.exports = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  mixins: [
    Reflux.connect(MapStore, 'map'),
    Reflux.listenTo(actions.mapPositionUpdate, 'updatePosition'),
    Reflux.listenTo(actions.mapRoadToggle, 'mapRoadToggle')
  ],


  propTypes:  {
    center: React.PropTypes.object,
    className: React.PropTypes.string,
    id: React.PropTypes.string,
    maxBounds: React.PropTypes.object,
    maxZoom: React.PropTypes.number,
    minZoom: React.PropTypes.number,
    style: React.PropTypes.object,
    zoom: React.PropTypes.number,
    keyboard: React.PropTypes.bool,
    year: React.PropTypes.string
  },

  getInitialState() {
    return {
      id: uniqueId('map')
    }
  },

  getDefaultProps() {
    return {
      maxZoom: 18,
      minZoom: 5,
      keyboard: false
    }
  },

  componentDidMount: function() {

    var map = L.map(this.state.id, this.props);
    map.attributionControl.setPrefix("");

    map.scrollWheelZoom.disable();

    var tileUrl = '';
    var maxNativeZoom = 13;
    if (this.props.year == 2014) {
      tileUrl = 'https://storage.googleapis.com/earthenginepartners-hansen/tiles/gfc2015/last_457/{z}/{x}/{y}.jpg';
      maxNativeZoom = 12;
    }else {
      tileUrl = 'https://wri-tiles.s3.amazonaws.com/umd_landsat/' + this.props.year.toString() + '/{z}/{y}/{x}.png';
    }


    var layer = L.tileLayer(tileUrl, {
      attribution: 'UMD Landsat - '+this.props.year,
      maxNativeZoom: maxNativeZoom
    }).addTo(map);

    //road lines
    var roadLinesLayer = L.mapbox.tileLayer('crowdcover.57a65f88').addTo(map);
    this.roadLinesLayer = roadLinesLayer;

    // Map controls
    map.zoomControl.setPosition('topleft');


    var state = this.state;
     // Record state in map
     map.on('move', function(e) {
       state.map.position.center = map.getCenter();
      actions.mapPositionUpdate()

     });

    map.on('zoomend', function(e) {
      state.map.position.zoom = map.getZoom();
      actions.mapPositionUpdate()
    });


    //add year title
    var info = L.control({ position: 'topright' });

    var year = this.props.year;
    if (year == '2000') year = '2000 or Earlier';
    info.onAdd = function () {
      this._div = L.DomUtil.create('div', 'info');
      this._div.innerHTML = '<div class="map-title"><h2>' + year.toString() + '</h2></div>';
      return this._div;
    };

    info.addTo(map);

    this.taskLayer = L.featureGroup().addTo(map);


    this.leafletElement = map;
    //this.setState({map: this.leafletElement, taskLayer: tasklayer});
  },

  shouldUpdateCenter: function(next, prev) {
    if (!prev) return true;
    next = normalizeCenter(next);
    prev = normalizeCenter(prev);
    return next[0] !== prev[0] || next[1] !== prev[1];
  },

  componentDidUpdate: function(prevProps, prevState) {

    if (prevProps.year != this.props.year) {
      console.log("MAP IS CHANGING YEARS!!!");
    }
    var center = this.props.center;
    var zoom = this.props.zoom;
    if (center && this.shouldUpdateCenter(center, prevProps.center)) {
      this.leafletElement.setView(center, zoom, {animate: false});
    }
    else if (zoom && zoom !== prevProps.zoom) {
      this.leafletElement.setZoom(zoom);
    }


    this.updateRoads();






  },

  updateRoads: function() {
    this.removeRoads();
    this.drawRoads(true);
  },

  removeRoads: function() {
    this.leafletElement.removeLayer(this.roadLinesLayer);

     if (this.taskLayer && this.taskLayer.getLayers()) {
      var taskLayer = this.taskLayer;
      taskLayer.getLayers().forEach(function(l) {
        taskLayer.removeLayer(l);
      });
    }
  },

  drawRoads: function(zoomToRoads) {
    //draw the layers
      this.roadLinesLayer.addTo(this.leafletElement);
       if (this.state.map.mapData.length) {
      this.state.map.mapData.forEach(function(xml) {
        var layer = new L.OSM.DataLayer(xml).addTo(this.taskLayer);
        if (zoomToRoads) {
          this.leafletElement.fitBounds(layer.getBounds(), { reset: false, animate: false });
        }

      }.bind(this));
      if (zoomToRoads) {
        this.leafletElement.setZoom(this.leafletElement.getZoom()-1, {animate: false});
      }
    }
  },

  componentWillUnmount: function() {
    this.leafletElement.remove();
  },

  updatePosition: function() {
    var map = this.leafletElement;
    map.setView(this.state.map.position.center, this.state.map.position.zoom, {animate: false});
  },

   mapRoadToggle: function(show) {
     if (show) {
       this.drawRoads(false);
     } else {
       this.removeRoads();

     }
  },

  select: function() {

    //TODO: if task is verification, check if the new selection matches the old
    var year = this.props.year;
    if (year == '2000') year = 'before 2000';
    this.state.map.iDEntity[0].tags.start_date = year;

    //prompt user for confirmation
    //TODO: push these props into the task definition?
    actions.openSaveToOSM({modify: false, message: 'adding tag: start_date='+year, imageryUsed: ['UMD Landsat'], comment: '#logging-roads added logging road start date'});

  },

  render: function() {


    var map = this.leafletElement;

    var buttonText = 'Select';
    /*
    if(this.props.year == 2000){
      buttonText += '2000 or before'
    } else {
        buttonText += this.props.year
    }
    */

    return (
      /* jshint ignore:start */
      <div id={this.state.id} className="mode map active fill-navy-dark">
          <button onClick={this.select} className='select-year z1000 button round animate strong'>{buttonText}</button>
      </div>
      /* jshint ignore:end */
    );
  }
});
