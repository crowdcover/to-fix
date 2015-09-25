'use strict';



var omnivore = require('leaflet-omnivore');
var wellknown = require('wellknown');

var React = require('react');
var Reflux = require('reflux');

var store = require('store');
var actions = require('../actions/actions');
var config = require('../config');
var qs = require('querystring');
var xhr = require('xhr');
var EditBar = require('./workspace/editbar');
var Map = require('./workspace/map');
var MapStore = require('../stores/map_store');
var UserStore = require('../stores/user_store');
var BingLayer = require('../ext/bing.js');

require('mapbox.js');
require('leaflet-osm');

L.mapbox.accessToken = config.accessToken;
var geocoder = L.mapbox.geocoder('mapbox.places');

module.exports = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  mixins: [
    Reflux.connect(MapStore, 'map'),
    Reflux.connect(UserStore, 'user'),
    Reflux.listenTo(actions.taskSavedInOSM, 'fixed'),
    Reflux.listenTo(actions.mapPositionUpdate, 'geolocate')
  ],

  statics: {
    fetchData: function(params) {
      actions.taskData(params.task);
    }
  },

  fixed: function() {
    actions.taskDone(this.context.router.getCurrentParams().task);
  },

  skip: function() {
    // Set editor state as complete and trigger the done action
    this.setState({ iDEdit: false });
    actions.taskData(this.context.router.getCurrentParams().task);
  },


  notError: function() {

    //actions.taskNotError(this.context.router.getCurrentParams().task);
  },

  geolocate: function() {

    var center = this.state.map.position.center;

    //since this sees updates from all the maps, compare to the previous value to avoid spamming the API
    if(this.center && this.center.lat == center.lat && this.center.lon == center.lon){
        return;
    }

    this.center = center;
    geocoder.reverseQuery([center.lng, center.lat], function(err, res) {
      if (res && res.features && res.features[0] && res.features[0].context) {
        var place = res.features[0].context.reduce(function(memo, context) {
          var id = context.id.split('.')[0];
          if (id === 'place' || id === 'region' || id === 'country') memo.push(context.text);
          return memo;
        }, []);
        actions.geolocated(place.join(', '));
      }
    });
  },
  componentDidMount: function(){
    if (this.state.user && this.state.user.auth) {
      //record an Edit action in the activity automatically
      actions.taskEdit(this.context.router.getCurrentParams().task);
    }
  },

  render: function() {

    return (
      /* jshint ignore:start */
      <div>
        <div className="section group">
          <div className="col span_1_of_4">
            <Map year="2000" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2001" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2002" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2003" />
          </div>
        </div>
        <div className="section group">
          <div className="col span_1_of_4">
            <Map year="2004" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2005" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2006" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2007" />
          </div>
        </div>
        <div className="section group">
          <div className="col span_1_of_4">
            <Map year="2008" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2009" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2010" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2011" />
          </div>
        </div>
        <div className="section group">
          <div className="col span_1_of_4">
            <Map year="2012" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2013" />
          </div>
          <div className="col span_1_of_4">
            <Map year="2014" />
          </div>
        </div>
        <div className="row-200">

        </div>

      </div>
      /* jshint ignore:end */
    )
  }
});
