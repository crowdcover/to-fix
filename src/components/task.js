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
var MapStore = require('../stores/map_store');
var UserStore = require('../stores/user_store');
//var BingLayer = require('../ext/bing.js');
var Carousel = require('nuka-carousel');
var OnResize = require("react-window-mixins").OnResize;
var Slide = require('./workspace/slide');

var Editbar = require('./workspace/crowdsource_editbar');

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
    Reflux.listenTo(actions.taskSkip, 'skip'),
    Reflux.listenTo(actions.mapPositionUpdate, 'geolocate'),
    Carousel.ControllerMixin,
    OnResize
  ],

  statics: {
    fetchData: function(params) {
      actions.taskData(params.task);
    }
  },

  fixed: function() {
    actions.taskDone(this.context.router.getCurrentParams().task);
    if (this.state.carousels.carousel) {
      this.state.carousels.carousel.goToSlide(0);
    }

  },

  skip: function() {
    //done in editbar
    //actions.taskData(this.context.router.getCurrentParams().task);
    if (this.state.carousels.carousel) {
      this.state.carousels.carousel.goToSlide(0);
    }
  },


  notError: function() {

    //actions.taskNotError(this.context.router.getCurrentParams().task);
  },

  geolocate: function() {

    var center = this.state.map.position.center;

    //since this sees updates from all the maps, compare to the previous value to avoid spamming the API
    if (this.center && this.center.lat == center.lat && this.center.lon == center.lon) {
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
  componentDidMount: function() {
    if (this.state.user && this.state.user.auth) {
      //record an Edit action in the activity automatically
      actions.taskEdit(this.context.router.getCurrentParams().task);
    }
  },

  render: function() {

    var style = {
      border: 0,
      background: 'rgba(0,0,0,0.4)',
      color: 'white',
      padding: '10px',
      outline: 0,
      opacity: 1,
      cursor: 'pointer'
    };

      var Decorators = [{
        component: React.createClass({
          render() {
            return (
              <button style={style}
                onClick={this.props.previousSlide}>
                Prev
              </button>
            )
          }
        }),
        position: 'TopLeft'
      },
      {
        component: React.createClass({
          render() {
            return (
              <button style={style}
                onClick={this.props.nextSlide}>
                More Years
              </button>
            )
          }
        }),
        position: 'TopRight'
      }];



    return (
      <div style={{height: '100%'}}>

        <div className="maps-section" style={{height: '90%'}}>
          <Carousel decorators={Decorators}
            ref="carousel"
            data={this.setCarouselData.bind(this, 'carousel')}>
            <Slide years={['2000','2001','2002','2003']} />
            <Slide years={['2004','2005','2006','2007']} />
            <Slide years={['2008','2009','2010','2011']} />
            <Slide years={['2012','2013','2014']} />
          </Carousel>
        </div>
        <div className="editbar-container" style={{height: '10%'}}>
        <Editbar />
        </div>
      </div>
    )
  }
});

/*
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

*/
