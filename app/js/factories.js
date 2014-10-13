angular.module('geneviz.factories', [])
    .factory('GraphParams', function () {
        var GraphParams = function (options) {
            var _this = this;

            options = _.extend({
                initSeed: 'ERBB3',
                datasetName: 'LumA',
                scoreThreshold: 0.5,
                possibleDataset: [
                    {name: 'All'},
                    {name: 'LumA'},
                    {name: 'LumB'}
                ]
            }, options);

            _this.dataset = _.find(options.possibleDataset, function (d) {
                return d.name == options.datasetName;
            });
            if (_this.dataset === undefined) {
                _this.dataset = _this.possibleDataset[1];
            }
            _this.possibleDataset = options.possibleDataset;
            _this.scoreThreshold = options.scoreThreshold;
            _this.initSeed = options.initSeed;
        };

        /**
         * set the list dataset this.possibleDataset
         * and set the current dataset to the second one (to avoid 'All'...)
         * @param list
         * @return {*}
         */
        GraphParams.prototype.setPossibleDataset = function (list) {
            var _this = this;
            _this.possibleDataset = list;

            var datasetName = _this.dataset && _this.dataset.name;
            _this.dataset = _.find(_this.possibleDataset, function (d) {
                return d.name == datasetName;
            }) || list[0];
            return _this;
        };

        /**
         * set dataset either via object or via name
         * @param ds
         */
        GraphParams.prototype.setDataset = function (ds) {
            var _this = this;
            if (!_.isObject(ds)) {
                ds = {name: ds};
            }

            var selds= _.find(_this.possibleDataset, function(d){
                return d.name == ds.name;
            });
            _this.dataset=selds || ds;

            return _this;
        };
        return GraphParams;
    })
    .factory('Graph', function () {
        /**
         * build a nodes + links graph
         * @constructor
         * @param {Object} options
         * @param {String} options.dataset (default='All')
         */
        var Graph = function (options) {
            var _this = this;

            options = _.extend({
            }, options);

            _this._nodes = {};
            _this._links = {};

            return _this;
        };

        /**
         * register a onChange function callback (first argument will be the graph itself)
         * @param callback
         * @return {Graph}
         */
        Graph.prototype.onChange = function (callback) {
            var _this = this;
            _this._onChange = callback;
            return _this;
        };

        /**
         * triggers the onChange event (and execute the callback if it has been defined
         * @return {Graph}
         */
        Graph.prototype.triggerChange = function () {
            var _this = this;
            if (_this._onChange) {
                _this._onChange(_this);
            }
            return _this;
        };
        /**
         * number of nodes
         * @return {Integer}
         */
        Graph.prototype.countNodes = function () {
            return _.size(this._nodes);
        };

        /**
         * return a list of all nodes as an array
         * @return {Array} array of nodes
         */
        Graph.prototype.getNodes = function () {
            var _this = this;
            return _.values(_this._nodes);
        };

        /**
         * return one node based on its id
         * @param id
         * @return {Array}
         */
        Graph.prototype.getNode = function (id) {
            var _this = this;
            return _this._nodes[id];
        };

        /**
         *
         * @param geneSymbol
         */
        Graph.prototype.setSeedByGeneSymbol = function (geneSymbol) {
            _.each(this.getNodes(), function (n) {
                if (n.symbol == geneSymbol) {
                    n.isSeed = true;
                }
            });
        };

        /**
         * number of links
         * @return {Integer}
         */
        Graph.prototype.countLinks = function () {
            return _.size(this._links);
        };


        /**
         * Return a pointer to an array of links. This means that if we add/remove nodes to the graph, the array pointer will not be links
         * @return {Array} array of links
         */
        Graph.prototype.getLinks = function () {
            return this._links;
        };


        /**
         * add all nodes and links.
         * links source & target attribute refers to id, whereas in the created graph, they will point to the actual node object
         * @param {Array} nodes
         * @param {Array} links
         */
        Graph.prototype.addAll = function (nodes, links, options) {
            var _this = this;
            _.each(nodes, function (n) {
                if (_this._nodes[n.id] !== undefined) {
                    return;
                }
                _this._nodes[n.id] = n;
            });
            _.each(links, function (l) {
                if ((_this._nodes[l.source] === undefined) || (_this._nodes[l.target] === undefined)) {
                    return;
                }
                var newLink = _.extend({}, l); //clone to limit side effect
                newLink.source = _this._nodes[l.source];
                newLink.target = _this._nodes[l.target];
                _this._links[_link_hash(newLink)] = newLink;
            });


            if (options && options.seed) {
                _this.setSeedByGeneSymbol(options.seed);
            }
            _this.triggerChange(_this);
            return _this;
        };

        /**
         * removes all nodes & edges
         * Do not modify other attributes (url, dataset...)
         */
        Graph.prototype.reset = function () {
            var _this = this;
            this._nodes = {};
            this._links = {};
        };

        /**
         * get a link hash code based on the gene name. must be symmetric
         * @param link
         * @return {string}
         * @private
         */
        var _link_hash = function (link) {
            return [link.source.id, link.target.id].sort().join('%%');
        }

        return Graph;
    }
)
;
