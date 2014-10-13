'use strict';

/* Directives */


angular.module('geneviz.directives', ['angularSpinner'])
    .directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }])
    .directive('graphParams', function () {

        return {
            templateUrl: 'views/graph-params.html',
            restrict: 'E'
        };
    })
    .directive('graphInteractive', function (GraphService, usSpinnerService) {
        /**
         * GraphView is the kernel of the visualization. It take a graph and displays it.
         * then the sirective is just an instance of that class
         * @param options
         * @return {GraphView}
         * @constructor
         */
        var GraphView = function (options) {
            var _this = this;

            _this.el = options.el;
            _this.graph = options.graph;
            //_this.correlationCutOff = 0.5;

            _this.colors = d3.scale.category10();

            var jqEl = $(_this.el);
            _this.height = jqEl.height();
            _this.width = jqEl.width();

            //_this._setupSpinner();
            _this.svg = d3.select(_this.el).append('div').append("svg")
                .attr({
                    width: _this.width,
                    height: _this.height
                });


            _this._setup();
            //_this.spinnerStart();
            return _this;
        };

        GraphView.prototype._setup = function () {
            var _this = this;
            _this._setup_force();
            return _this;
        }

        GraphView.prototype._setupSpinner = function () {
            var _this = this;

            _this.divSpin = d3.select(_this.el)
                .append('div')
                .attr('class', 'spinner')
                .attr('id', 'graph-spinner');
            _this.divSpin.append('div')
                .attr('class', 'background');
            _this.spinnerTarget = document.getElementById('graph-spinner');

            //usSpinnerService.spin('spinner-graph')
            return _this;

        };

        GraphView.prototype.spinnerStart = function () {
            var _this = this;
            usSpinnerService.spin('spinner-1')
            _this.spinner = new Spinner({radius: 30, width: 8, length: 16}).spin(_this.spinnerTarget);

        };
        GraphView.prototype.spinnerStop = function () {
            var _this = this;
            _this.spinner.stop();

        };

        /**
         * setup the graph force layout
         * @return {GraphView}
         * @private
         */
        GraphView.prototype._setup_force = function () {
            var _this = this;
            _this.graphNodes = [];
            _this.graphLinks = [];

            _this.force = d3.layout.force()
                .nodes(_this.graphNodes)
                .links(_this.graphLinks)
                .charge(-20000)
                .linkStrength(function(l){
                    console.log(l.correlation)
                    return l.correlation* l.correlation;
                })
//                .linkDistance(function (d) {
//                    var cor = d.correlation;
//                    if (cor > 0) {
//                        return Math.pow((1 + cor ) * 100, 1.2)
//                    }
//                    return Math.pow((Math.abs(cor) + 1 ) * 100, 1.2)
//                })
                .size([_this.width, _this.height])
                .friction(.2)
                .on("start", forceStart)
                .on("tick", updatePosition)
                .on("end", forceEnd)
                .gravity(.3)
                .theta(.8);

            function updatePosition() {
                _this.node.attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });

                _this.link.attr({
                    x1: function (d) {
                        return d.source.x;
                    },
                    x2: function (d) {
                        return  d.target.x;
                    },
                    y1: function (d) {
                        return d.source.y;
                    },
                    y2: function (d) {
                        return d.target.y;
                    }
                });
            }

            function forceStart() {
                updatePosition();
            };
            function forceEnd(e) {
                updatePosition();

            };

            return _this;
        };

        /**
         * renders the graph (to be called when data changes
         * @return {GraphView}
         */
        GraphView.prototype.render = function () {
            var _this = this;

            _this.graphNodes.length = 0;
            _.each(_this.graph.getNodes(), function (n) {
                _this.graphNodes.push(n);
            });
            _this.graphLinks.length = 0;
            _.each(_this.graph.getLinks(), function (l) {
                _this.graphLinks.push(l);
            });

            var nodesSel = _this.svg.selectAll('g')
                .data(_this.graphNodes, function (d) {
                    return d.id;
                });

            var gnode = nodesSel.enter().append('g').attr('class', 'node');

            gnode.append('circle')
                .on('contextmenu', function (d) {
//                    var filetemp = filenames[matchFile(d.id)];
//                    curGene = filetemp;
//                    resetGraph(filetemp);
                })
                .attr("r", function (g) {
//                    if (_this.graph.dataset === "All") {
//                        correct = 1
//                    }
//                    else if (_this.graph.dataset === "Basal") {
//                        correct = 5.8
//                    }
//                    else if (_this.graph.dataset === "LumA") {
//                        correct = 1.95
//                    }
//                    else if (_this.graph.dataset === "LumB") {
//                        correct = 4.9
//                    }
//                    else if (_this.graph.dataset === "Her2") {
//                        correct = 12.9
//                    }
                    return 3+g.metagene.expression;
//                    return Math.max(Math.pow(d.expression * correct, .8) / 140, 5)
                })
                .style("fill", function (d, i) {
                    return _this.colors(d.meta);
                    //    return colors(parseInt(d.chromosome.substring(3,6)));
                });
            gnode.append('text')
                .attr({
                    class: 'gene-name',
                    x: 5,
                    y: 5
                }).text(function (d) {
                    return d.symbol;
                });

            // let's use the update pattern, as the isSeed can be changed
            _this.svg.selectAll('g.node')
                .classed('seed', function (d) {
                    return d.isSeed;
                });


            nodesSel.exit().remove();
            _this.node = nodesSel;

            gnode
                .on('click', function (d) {
                    GraphService.addSeed(_this.graph, d.symbol, {
//                        success: function (g) {
//                            _this.render();
//                        }
                    });

                })
                .on('mouseover', function (d) {
                    console.log('mouseover', d);
                    _this.highlight(d.id)
                    return;
                    var nametemp = d.id
                    var chrometemp = d.chromosome
                    var metatemp = reName(d.meta)

                    d3.select('#tooltip')
                        .html(function () {
                            return 'Gene Symbol : ' + nametemp + '<br/>' + '<br style="height: .5em;" />' + 'Chromosome : ' + chrometemp + '<br/>' + '<br style="height: .5em;" />' + 'Metagene : ' + metatemp
                        })
                        .style('color', 'white')
                        .style('font-style', 'Arial')
                        .style('font-size', '1em')
                })
                .on('mouseout', function (d) {
                    _this.highlightClear();
                    d3.select('#tooltip')
                        .style('color', 'black')

                })


            _this.link = _this.svg.selectAll('line').data(_this.graphLinks, function (d) {
                return d.source.id + "-" + d.target.id;
            });
            _this.link.exit().remove();
            _this.link.enter().insert("line", ".node")
                .attr('class', function (d) {
                    return 'link correlation correlation-' + ((d.correlation > 0) ? 'positive' : 'negative');
                });


            _this.force.start();
            _this._render_correlationCutOff();

            return _this;
        };

        /**
         *  hide the links below a given threshold (add a 'hide' class)
         * @param cutOff {Number}
         * @return {GraphView}
         */
        GraphView.prototype.setCorrelationCutOff = function (cutOff) {
            var _this = this;
            _this.correlationCutOff = cutOff;
            _this._render_correlationCutOff();
            return _this;
        };

        /**
         *
         * @return {GraphView}
         * @private
         */
        GraphView.prototype._render_correlationCutOff = function () {
            var _this = this;
            _this.svg.selectAll('.link.correlation')
                .classed('hide', false)
                .filter(function (l) {
                    return Math.abs(l.cor) < _this.correlationCutOff;
                })
                .classed('hide', true);
            return _this;
        };
        /**
         * highlight a gene and the related links & genes
         * It simply adds a 'highlight' class on
         * * the selected gene name, and the connected ones
         * * the concerned links
         * @param {String} nodeId
         * @return {GraphView}
         */
        GraphView.prototype.highlight = function (nodeId) {
            var _this = this;

            var hNodes = {};
            var hLinks = _this.link.filter(function (link) {
                if (link.source.id === nodeId || link.target.id === nodeId) {
                    hNodes[link.source.id] = true;
                    hNodes[link.target.id] = true;
                    return true;
                }
                return false;
            });
            hLinks.classed('highlight', true);
            _this.node.filter(function (n) {
                return hNodes[n.id];
            }).classed('highlight', true);
            return _this;
        };

        /**
         * clear the highlighting (removes the 'highlight' class from everyone)
         * @return {GraphView}
         */
        GraphView.prototype.highlightClear = function () {
            var _this = this;
            _this.svg.selectAll('.highlight').classed('highlight', false);

            return _this;
        };


        function link(scope, elm, attrs) {
            var view = new GraphView({
                el: elm[0],
                graph: scope.graph
            });
            scope.graph.onChange(function () {
                view.render();
            });
        };
        return {
            link: link,
//            restrict: 'E',
            scope: true
        };
    });

