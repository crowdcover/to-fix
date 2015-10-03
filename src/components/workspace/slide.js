'use strict';

var React = require('react');
var Reflux = require('reflux');
var SlideSection = require('./slideSection');


module.exports = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },


  render: function() {

    var section1 = '';

    var section2 = '';
    if (this.props.years.length == 4) {
      section1 = (
        <SlideSection years={[this.props.years[0], this.props.years[1]]} />
      );
      section2 = (
        <SlideSection years={[this.props.years[2], this.props.years[3]]} />
      );
    } else if (this.props.years.length == 3) {
      section1 = (
        <SlideSection years={[this.props.years[0], this.props.years[1]]} />
      );
      section2 = (
        <SlideSection years={[this.props.years[2]]} />
      );
    } else if (this.props.years.length == 2) {
      section1 = (
        <SlideSection years={[this.props.years[0]]} />
      );
      section2 = (
        <SlideSection years={[this.props.years[1]]} />
      );
    }
    else if (this.props.years.length == 1) {
      section1 = (
        <SlideSection years={[this.props.years[0]]} />
      );
      section2 = '';
    }

    return (
      <div className="slide" style={{height: '100%'}}>
        <div className="instruction center" style={{height: '5%', minHeight: '40px', backgroundColor: '#FFF'}}>
          <h1>What year do you see the road?</h1>
        </div>
        {section1}
        {section2}
      </div>
    );
  }
});
