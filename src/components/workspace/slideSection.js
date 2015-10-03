'use strict';

var React = require('react');
var Reflux = require('reflux');
var Map = require('./map');


module.exports = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },


  render: function() {

    var col1 = (
      <div className="col6 span_2_of_4">
        <Map year={this.props.years[0]} />
      </div>
    );
    var col2 = '';
    if (this.props.years.length > 1) {
      col2 = (
        <div className="col6 span_2_of_4">
          <Map year={this.props.years[1]} />
        </div>
      );
    }

    return (
      <div className="section group col12">

        {col1}{col2}

      </div>
    );
  }
});
