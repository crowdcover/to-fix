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
    Reflux.listenTo(actions.mapPositionUpdate, 'updatePosition')
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
    keyboard: React.PropTypes.boolean,
    year: React.PropTypes.number
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

    var map = L.mapbox.map(this.state.id, 'mapbox.streets', this.props);

    var tileUrl = 'https://wri-tiles.s3.amazonaws.com/umd_landsat/' + this.props.year.toString() + '/{z}/{y}/{x}.png';
    L.tileLayer(tileUrl, {
      attribution: 'UMD Landsat',
      maxNativeZoom: 13
    }).addTo(map);


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
    var info = L.control();

    var year = this.props.year;
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

  componentDidUpdate: function(prevProps) {

    var center = this.props.center;
    var zoom = this.props.zoom;
    if (center && this.shouldUpdateCenter(center, prevProps.center)) {
      this.leafletElement.setView(center, zoom, {animate: false});
    }
    else if (zoom && zoom !== prevProps.zoom) {
      this.leafletElement.setZoom(zoom);
    }

    if (this.taskLayer && this.taskLayer.getLayers()) {
      var taskLayer = this.taskLayer;
      taskLayer.getLayers().forEach(function(l) {
        taskLayer.removeLayer(l);
      });
    }

    if (this.state.map.mapData.length) {
      this.state.map.mapData.forEach(function(xml) {
        var layer = new L.OSM.DataLayer(xml).addTo(this.taskLayer);
        this.leafletElement.fitBounds(layer.getBounds(), { reset: true });

      }.bind(this));
    }

  },

  componentWillUnmount: function() {
    this.leafletElement.remove();
  },

  updatePosition: function() {
    var map = this.leafletElement;
    map.setView(this.state.map.position.center, this.state.map.position.zoom, {animate: false});
  },

  select: function() {

    //prompt user for confirmation

    //save change to OSM

    //actions.taskDone(this.context.router.getCurrentParams().task);

  },


  render: function() {


    var map = this.leafletElement;



    return (
      /* jshint ignore:start */
      <div id={this.state.id} className="mode map active fill-navy-dark">
          <button onClick={this.select} className='pin-bottom z10000 button rcon next round animate pad1y pad2x strong'>Select</button>
      </div>
      /* jshint ignore:end */
    );
  }
});
