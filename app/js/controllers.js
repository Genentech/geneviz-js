'use strict';

/* Controllers */

angular.module('geneviz.controllers', [])
    .controller('GeneCorrelationGraphCtrl', function ($scope, $routeParams, $location, Graph, GraphService) {
        $scope.graph = new Graph();
        $scope.graphParams = GraphService.params;
        $scope.GraphService = GraphService;

        $scope.graphParams.setDataset($routeParams.dataset || 'LumB');
        $scope.graphParams.initSeed = $routeParams.seedSymbol || 'ERBB2';

        var locationRoot = $location.path().split('/')[1];
        var updateLocation = function () {
            $location.path('/' + locationRoot + '/' + GraphService.params.dataset.name + '/' + GraphService.params.initSeed, false);
        };

        $scope.changeDataset = function () {
            GraphService.setDataset($scope.graph, GraphService.params.dataset);
            updateLocation();
        };
        $scope.changeInitSeed = function () {
            GraphService.setInitSeed($scope.graph, GraphService.params.initSeed);
            updateLocation();
        };

        $scope.autocompleteGeneSymbol = function (prefix) {
            return GraphService.autocompleteGeneSymbol(prefix).then(function (res) {
                return res.data.results[0].data.map(function (r) {
                    return r.row[0];
                });
            });
        }
        GraphService.addSeed($scope.graph, $scope.graphParams.initSeed);
    });
//.
//controller('MessageCtrl', function ($scope, MessageService) {
//    $scope.error = MessageService.error;
//});
;
