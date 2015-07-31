if(!iD) var iD = {};

var _= require('lodash');

iD.Entity = function(attrs) {
  // For prototypal inheritance.
  if (this instanceof iD.Entity) return;

  // Create the appropriate subtype.
  if (attrs && attrs.type) {
    return iD.Entity[attrs.type].apply(this, arguments);
  } else if (attrs && attrs.id) {
    return iD.Entity[iD.Entity.id.type(attrs.id)].apply(this, arguments);
  }

  // Initialize a generic Entity (used only in tests).
  return (new iD.Entity()).initialize(arguments);
};

iD.Entity.id = function(type) {
  return iD.Entity.id.fromOSM(type, iD.Entity.id.next[type]--);
};

iD.Entity.id.next = {node: -1, way: -1, relation: -1};

iD.Entity.id.fromOSM = function(type, id) {
  return type[0] + id;
};

iD.Entity.id.toOSM = function(id) {
  return id.slice(1);
};

iD.Entity.id.type = function(id) {
  return {'n': 'node', 'w': 'way', 'r': 'relation'}[id[0]];
};

// A function suitable for use as the second argument to d3.selection#data().
iD.Entity.key = function(entity) {
  return entity.id + 'v' + (entity.v || 0);
};

iD.Entity.prototype = {
  tags: {},

  initialize: function(sources) {
    for (var i = 0; i < sources.length; ++i) {
      var source = sources[i];
      for (var prop in source) {
        if (Object.prototype.hasOwnProperty.call(source, prop)) {
          if (source[prop] === undefined) {
            delete this[prop];
          } else {
            this[prop] = source[prop];
          }
        }
      }
    }

    if (!this.id && this.type) {
      this.id = iD.Entity.id(this.type);
    }
    if (!this.hasOwnProperty('visible')) {
      this.visible = true;
    }

    if (iD.debug) {
      Object.freeze(this);
      Object.freeze(this.tags);

      if (this.loc) Object.freeze(this.loc);
      if (this.nodes) Object.freeze(this.nodes);
      if (this.members) Object.freeze(this.members);
    }

    return this;
  },

  copy: function() {
    // Returns an array so that we can support deep copying ways and relations.
    // The first array element will contain this.copy, followed by any descendants.
    return [iD.Entity(this, {id: undefined, user: undefined, version: undefined})];
  },

  osmId: function() {
    return iD.Entity.id.toOSM(this.id);
  },

  isNew: function() {
    return this.osmId() < 0;
  },

  update: function(attrs) {
    return iD.Entity(this, attrs, {v: 1 + (this.v || 0)});
  },

  mergeTags: function(tags) {
    var merged = _.clone(this.tags), changed = false;
    for (var k in tags) {
      var t1 = merged[k],
        t2 = tags[k];
      if (!t1) {
        changed = true;
        merged[k] = t2;
      } else if (t1 !== t2) {
        changed = true;
        merged[k] = _.union(t1.split(/;\s*/), t2.split(/;\s*/)).join(';');
      }
    }
    return changed ? this.update({tags: merged}) : this;
  },

  intersects: function(extent, resolver) {
    return this.extent(resolver).intersects(extent);
  },

  isUsed: function(resolver) {
    return _.without(Object.keys(this.tags), 'area').length > 0 ||
      resolver.parentRelations(this).length > 0;
  },

  hasInterestingTags: function() {
    return _.keys(this.tags).some(function(key) {
      return key !== 'attribution' &&
        key !== 'created_by' &&
        key !== 'source' &&
        key !== 'odbl' &&
        key.indexOf('tiger:') !== 0;
    });
  },

  isHighwayIntersection: function() {
    return false;
  },

  deprecatedTags: function() {
    var tags = _.pairs(this.tags);
    var deprecated = {};

    iD.data.deprecated.forEach(function(d) {
      var match = _.pairs(d.old)[0];
      tags.forEach(function(t) {
        if (t[0] === match[0] &&
          (t[1] === match[1] || match[1] === '*')) {
          deprecated[t[0]] = t[1];
        }
      });
    });

    return deprecated;
  }
};



iD.Way = iD.Entity.way = function iD_Way() {
  if (!(this instanceof iD_Way)) {
    return (new iD_Way()).initialize(arguments);
  } else if (arguments.length) {
    this.initialize(arguments);
  }
};

iD.Way.prototype = Object.create(iD.Entity.prototype);

_.extend(iD.Way.prototype, {
  type: 'way',
  nodes: [],

  copy: function(deep, resolver) {
    var copy = iD.Entity.prototype.copy.call(this);

    if (!deep || !resolver) {
      return copy;
    }

    var nodes = [],
      replacements = {},
      i, oldid, newid, child;

    for (i = 0; i < this.nodes.length; i++) {
      oldid = this.nodes[i];
      newid = replacements[oldid];
      if (!newid) {
        child = resolver.entity(oldid).copy();
        newid = replacements[oldid] = child[0].id;
        copy = copy.concat(child);
      }
      nodes.push(newid);
    }

    copy[0] = copy[0].update({nodes: nodes});
    return copy;
  },

  extent: function(resolver) {
    return resolver.transient(this, 'extent', function() {
      var extent = iD.geo.Extent();
      for (var i = 0; i < this.nodes.length; i++) {
        var node = resolver.hasEntity(this.nodes[i]);
        if (node) {
          extent._extend(node.extent());
        }
      }
      return extent;
    });
  },

  first: function() {
    return this.nodes[0];
  },

  last: function() {
    return this.nodes[this.nodes.length - 1];
  },

  contains: function(node) {
    return this.nodes.indexOf(node) >= 0;
  },

  affix: function(node) {
    if (this.nodes[0] === node) return 'prefix';
    if (this.nodes[this.nodes.length - 1] === node) return 'suffix';
  },

  layer: function() {
    // explicit layer tag, clamp between -10, 10..
    if (this.tags.layer !== undefined) {
      return Math.max(-10, Math.min(+(this.tags.layer), 10));
    }

    // implied layer tag..
    if (this.tags.location === 'overground') return 1;
    if (this.tags.location === 'underground') return -1;
    if (this.tags.location === 'underwater') return -10;

    if (this.tags.power === 'line') return 10;
    if (this.tags.power === 'minor_line') return 10;
    if (this.tags.aerialway) return 10;
    if (this.tags.bridge) return 1;
    if (this.tags.cutting) return -1;
    if (this.tags.tunnel) return -1;
    if (this.tags.waterway) return -1;
    if (this.tags.man_made === 'pipeline') return -10;
    if (this.tags.boundary) return -10;
    return 0;
  },

  isOneWay: function() {
    // explicit oneway tag..
    if (['yes', '1', '-1'].indexOf(this.tags.oneway) !== -1) { return true; }
    if (['no', '0'].indexOf(this.tags.oneway) !== -1) { return false; }

    // implied oneway tag..
    for (var key in this.tags) {
      if (key in iD.oneWayTags && (this.tags[key] in iD.oneWayTags[key]))
        return true;
    }
    return false;
  },

  isClosed: function() {
    return this.nodes.length > 0 && this.first() === this.last();
  },

  isConvex: function(resolver) {
    if (!this.isClosed() || this.isDegenerate()) return null;

    var nodes = _.uniq(resolver.childNodes(this)),
      coords = _.pluck(nodes, 'loc'),
      curr = 0, prev = 0;

    for (var i = 0; i < coords.length; i++) {
      var o = coords[(i+1) % coords.length],
        a = coords[i],
        b = coords[(i+2) % coords.length],
        res = iD.geo.cross(o, a, b);

      curr = (res > 0) ? 1 : (res < 0) ? -1 : 0;
      if (curr === 0) {
        continue;
      } else if (prev && curr !== prev) {
        return false;
      }
      prev = curr;
    }
    return true;
  },

  isArea: function() {
    if (this.tags.area === 'yes')
      return true;
    if (!this.isClosed() || this.tags.area === 'no')
      return false;
    for (var key in this.tags)
      if (key in iD.areaKeys && !(this.tags[key] in iD.areaKeys[key]))
        return true;
    return false;
  },

  isDegenerate: function() {
    return _.uniq(this.nodes).length < (this.isArea() ? 3 : 2);
  },

  areAdjacent: function(n1, n2) {
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i] === n1) {
        if (this.nodes[i - 1] === n2) return true;
        if (this.nodes[i + 1] === n2) return true;
      }
    }
    return false;
  },

  geometry: function(graph) {
    return graph.transient(this, 'geometry', function() {
      return this.isArea() ? 'area' : 'line';
    });
  },

  addNode: function(id, index) {
    var nodes = this.nodes.slice();
    nodes.splice(index === undefined ? nodes.length : index, 0, id);
    return this.update({nodes: nodes});
  },

  updateNode: function(id, index) {
    var nodes = this.nodes.slice();
    nodes.splice(index, 1, id);
    return this.update({nodes: nodes});
  },

  replaceNode: function(needle, replacement) {
    if (this.nodes.indexOf(needle) < 0)
      return this;

    var nodes = this.nodes.slice();
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] === needle) {
        nodes[i] = replacement;
      }
    }
    return this.update({nodes: nodes});
  },

  removeNode: function(id) {
    var nodes = [];

    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      if (node !== id && nodes[nodes.length - 1] !== node) {
        nodes.push(node);
      }
    }

    // Preserve circularity
    if (this.nodes.length > 1 && this.first() === id && this.last() === id && nodes[nodes.length - 1] !== nodes[0]) {
      nodes.push(nodes[0]);
    }

    return this.update({nodes: nodes});
  },

  asJXON: function(changeset_id) {
    var r = {
      way: {
        '@id': this.osmId(),
        '@version': this.version || 0,
        nd: _.map(this.nodes, function(id) {
          return { keyAttributes: { ref: iD.Entity.id.toOSM(id) } };
        }),
        tag: _.map(this.tags, function(v, k) {
          return { keyAttributes: { k: k, v: v } };
        })
      }
    };
    if (changeset_id) r.way['@changeset'] = changeset_id;
    return r;
  },

  asGeoJSON: function(resolver) {
    return resolver.transient(this, 'GeoJSON', function() {
      var coordinates = _.pluck(resolver.childNodes(this), 'loc');
      if (this.isArea() && this.isClosed()) {
        return {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      } else {
        return {
          type: 'LineString',
          coordinates: coordinates
        };
      }
    });
  },

  area: function(resolver) {
    return resolver.transient(this, 'area', function() {
      var nodes = resolver.childNodes(this);

      var json = {
        type: 'Polygon',
        coordinates: [_.pluck(nodes, 'loc')]
      };

      if (!this.isClosed() && nodes.length) {
        json.coordinates[0].push(nodes[0].loc);
      }

      var area = d3.geo.area(json);

      // Heuristic for detecting counterclockwise winding order. Assumes
      // that OpenStreetMap polygons are not hemisphere-spanning.
      if (area > 2 * Math.PI) {
        json.coordinates[0] = json.coordinates[0].reverse();
        area = d3.geo.area(json);
      }

      return isNaN(area) ? 0 : area;
    });
  }
});

module.exports = iD;