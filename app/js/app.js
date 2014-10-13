'use strict';


// Declare app level module which depends on filters, and services
angular.module('geneviz', [
    'ngRoute',
    'ui.bootstrap',
    'angularSpinner',
    'geneviz.filters',
    'geneviz.services',
    'geneviz.directives',
    'geneviz.controllers',
    'geneviz.factories'
//]).config(["$httpProvider", 'AjaxErrorsInterceptor', function ($httpProvider, AjaxErrorsInterceptor) {
//    $httpProvider.interceptors.push(AjaxErrorsInterceptor);
//}
//]);
]).config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(["$injector", 'MessageService', function ($injector, MessageService) {
        return {
            'responseError': function (rejection) {
                var error = rejection.data;
                MessageService.addError(error.title, error.message, error.details);
            }
        };
    }
    ]);
}]).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/gene-cor/:dataset?/:seedSymbol?/:scoreThreshold?',
        {
            templateUrl: 'views/gene-cor.html',
            controller: 'GeneCorrelationGraphCtrl',
            reloadOnSearch: false
        }
    );
    $routeProvider.otherwise({redirectTo: '/gene-cor'});
}]).run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
    /*
     hack the $location.path function, in order no to reload if the hash has not changed
     http://joelsaupe.com/programming/angularjs-change-path-without-reloading/
     */

    var original = $location.path;
    $location.path = function (path, reload) {
        if (reload === false) {
            var lastRoute = $route.current;
            var un = $rootScope.$on('$locationChangeSuccess', function () {
                $route.current = lastRoute;
                un();
            });
        }
        return original.apply($location, [path]);
    };
}]);
