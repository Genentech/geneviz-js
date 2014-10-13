'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('geneviz.services', [])
    .value('version', '0.2')
    .service('MessageService', function () {
        /**
         * handles the errors
         * @return {MessageService}
         * @constructor
         */
        var MessageService = function () {
            var _this = this;
            return _this;
        };

        MessageService.prototype.addError = function (title, message, details) {
            var _this=this;
            console.log('MessageService addError', details)
            window.alert(title+':'+ message+'\n'+ details);
        }

            return new MessageService();
    }).service('GraphService', function ($http, GraphParams, MessageService) {
        /**
         * The service will take care of handling the connection with neo4j
         * @constructor
         */
        var GraphService = function () {
            var _this = this;
            _this.params = new GraphParams();
            _this.neo4jUrl = 'http://localhost:7474';
            _this.isLoading=0;
            _this.loadDataset();

            return _this;
        };

        GraphService.prototype.urlTransaction = function () {
            return this.neo4jUrl + '/db/data/transaction/commit';
        };

        GraphService.prototype.loadDataset = function () {
            var _this = this;
            var query = 'MATCH (d:dataset) RETURN d';
            _this.neo4jQuery(query, {}, function (results) {
                _this.params.setPossibleDataset(results.data.map(function (r) {
                    return r.row[0];
                }));
            });

            return _this;
        };

        /**
         * returns the handler to the post query...
         * @param query
         * @param params
         * @param callback
         */
        GraphService.prototype.neo4jPostQuery = function (query, params) {
            var _this = this;
            return $http.post(_this.urlTransaction(), {
                statements: [
                    {
                        statement: query,
                        parameters: params,
                        resultDataContents: ['row' ]
                    }

                ]
            })
        };
        /**
         * post a single query to neo4j in row mode
         * @param query
         * @param params
         * @param callback
         */
        GraphService.prototype.neo4jQuery = function (query, params, callback) {
            var _this = this;

            _this.isLoading++;
            _this.neo4jPostQuery(query, params)
                .then(function (res) {
                    if (res.data.errors.length > 0) {
                        MessageService.addError('neo4j query', res.data.errors[0].code, res.data.errors[0].message);
                        res.data.errors.forEach(function (e) {
                            console.error(e.code, e.message);
                        });
                        isLoading --;
                        return;
                    }
                    callback(res.data.results[0]);
                    _this.isLoading --;
                });
        };


        /**
         * add a seed.
         * must play two rounds, as described in http://stackoverflow.com/questions/25781160/neo4j-rest-api-call-to-get-the-whole-connected-subgraph
         * @param geneSymbol {String}
         * @param options {Object}
         * @param options.success {Function} call back function in case of success. The function argument is the current graph (which has been merged at that time)
         * @param options.wlinks {Boolean} call the with links structure, whatever it means (default=false).
         */
        GraphService.prototype.addSeed = function (graph, geneSymbol, options) {
            var _this = this;
            options = _.extend({}, options);

            var queryNodes = "MATCH (g:gene {symbol:{seedSymbol}})-[:HAS_META]->(metagene:metagene {dataset:{dataset}})                                  \
            RETURN g, ID(g) AS nodeId,metagene                                                                                                           \
            UNION MATCH (gA:gene {symbol:{seedSymbol}})-[l:CORRELATED {dataset:{dataset}}]-(g:gene)-[:HAS_META]->(metagene:metagene {dataset:{dataset}}) \
            WHERE abs(l.correlation)>={score}                                                                                                            \
            RETURN g, ID(g) AS nodeId,metagene ORDER BY l.correlation DESC LIMIT 20";


            var params = {
                seedSymbol: geneSymbol,
                dataset: _this.params.dataset.name,
                score: _this.params.scoreThreshold
            };
            _this.neo4jQuery(queryNodes, params, function (results) {
                var nodes = _.map(results.data, function (o) {
                    return _.extend({
                            nodeId: o.row[1],
                            metagene: o.row[2]
                        },
                        o.row[0]
                    );
                });

                var nodeIds = _.chain(nodes.concat(graph.getNodes()))
                    .pluck('nodeId')
                    .uniq()
                    .value();

                var queryLinks = 'START gA=node(' + nodeIds + '), gB=node(' + nodeIds + ')\
                    MATCH (gA)-[l:CORRELATED {dataset:{dataset}}]->(gB)                   \
                    WHERE abs(l.correlation)>={score}                                     \
                    RETURN gA.id, l, gB.id';

                _this.neo4jQuery(queryLinks, params, function (results) {

                    var links = _.map(results.data, function (o) {
                        return _.extend(
                            {
                                source: o.row[0],
                                target: o.row[2]
                            }, o.row[1]
                        );
                    });

                    graph.addAll(nodes, links, {seed: geneSymbol});
                    if (options.success === undefined) {
                        return;
                    }
                    options.success(graph);
                });
            });
        };

        /**
         * set a new dataset and clear the graph
         * @param graph
         * @param dataset
         * @param options
         * @return {GraphService}
         */
        GraphService.prototype.setDataset = function (graph, dataset, options) {
            var _this = this;
            graph.reset();
            _this.dataset = dataset;
            _this.setInitSeed(graph, this.params.initSeed)
            return _this;
        };

        /**
         * set the initial seed gene
         * @param graph
         * @param geneSymbol
         * @param options
         * @return {GraphService}
         */
        GraphService.prototype.setInitSeed = function (graph, geneSymbol, options) {
            var _this = this;
            graph.reset();
            _this.addSeed(graph, geneSymbol, options);
            return _this;
        };

        /**
         * return the 10 first gene symbol names with the given prefix, sorted by alphabetical order
         * @param prefix
         */
        GraphService.prototype.autocompleteGeneSymbol = function (prefix) {
            var _this = this;
            var query = "MATCH (g:gene) WHERE g.symbol =~ '" + prefix + ".*' RETURN g.symbol ORDER BY g.symbol LIMIT 10";
            var params = {};

            return _this.neo4jPostQuery(query, params);
//            , function (results) {
//                return results.data.map(function (r) {
//                    return r.row[0];
//                });
//            });
        };

        return new GraphService();
    })
;
//    }).factory('AjaxErrorsInterceptor', function($q, MessageService) {
//    return {
//
//        // optional method
//        'responseError': function(rejection) {
//            error = rejection.data;
//            messagesService.addError(error.title, error.message, error.details);
//        }
//    };

