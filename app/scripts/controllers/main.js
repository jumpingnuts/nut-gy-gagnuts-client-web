define([
  'angular',
  'jquery',
  'angularMD5',
  'services/main',
  'services/native',
  'controllers/comment',
  'kakao'
],
function (angular, $) {
  'use strict';

  angular.module('mainCtrls', ['ngSanitize', 'ngMd5', 'mainServices', 'nativeServices', 'commentCtrls'])
    .controller('MainCtrl', ['$scope', function ($scope) {
      
      $scope.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma'
      ];
    }])
    .controller('ListCtrl', [
      '$scope',
      '$routeParams',
      '$window',
      'MultiSimnutLoader',
      'Simnut',
      function($scope, $routeParams, $window, MultiSimnutLoader, Simnut) {
        $scope.simnuts = [];
        $scope.isLoad = false;
        $scope.page = 1;
        $scope.type = $scope.nav.active = $routeParams.type;
  
        if($scope.type==='mine' && !$scope.isLogin()) {
          $scope.moveLogin();
          return false;
        }
        
        $scope.listLoad = function(){
          if($scope.isLoad) {return false;}
          $scope.isLoad = true;
          new MultiSimnutLoader($scope.page, $scope.type, $scope.userInfo.id).then(function(res){
            if(res.length > 0) {
              $scope.simnuts = $scope.simnuts.concat(res);
              $scope.page++;
              $scope.isLoad = false;
            }
          });
        };
        $scope.listLoad();
        
        $scope.deleteSimnut = function($event){
          $scope.eventStop($event);
          if(confirm('삭제 하시겠습니까?')) {
            var simnutId = $($event.currentTarget).attr('data-id');
            new Simnut.remove({ id:simnutId }, function(res){
              if(res.affectedRows > 0) {
                for(var i in $scope.simnuts) {
                  if($scope.simnuts[i].id === parseInt(simnutId)) {
                    $scope.simnuts.pop(i);
                    break;
                  }
                }
              }
            });
          }
        };
      }
    ])
    
    .controller('ViewCtrl', [
      '$scope',
      '$route',
      '$routeParams',
      'md5',
      'simnut',
      'LikeView',
      'LikeOn',
      'LikeOff',
      'ShareFunc',
      'NativeFunc',
      function($scope, $route, $routeParams, md5, simnut, LikeView, LikeOn, LikeOff, ShareFunc, NativeFunc){
        if(!simnut.id) { $scope.move('/list/trends'); }
      
        $scope.inputName = '';
        $scope.result = '';
        $scope.simnut = simnut;
        $scope.like = {
          'light' : false,
          'text' : {false: '꺼짐', true: '켜짐'},
          'id' : null
        };
        
        var variables = angular.fromJson($scope.simnut.variables);
        for(var i in variables) {
          variables[i] = variables[i].split(',');
        }
        $scope.simnut.variables = variables;
        
        $scope.getResult = function(){
          var md5Num = (md5.createHash($scope.inputName)).toString(10);
          var result = $scope.simnut.content.replace(new RegExp('{이름}','gi'), '<b>'+$scope.inputName+'</b>');
          
          for(var i in $scope.simnut.variables) {
            var randomString = $scope.simnut.variables[i][parseInt(md5Num.substr(i*2, 2) ,16) % variables[i].length];
            result = result.replace(new RegExp('{변수'+(parseInt(i)+1)+'}','gi'), '<b>'+randomString+'</b>');
          }
          $scope.result = result;

          if(window.android){
            var data = {
              'title': $scope.simnut.title,
              'marketUrl': $scope.marketInfo.url,
              'type': 'image',
              'content': $(('<b>'+$scope.result+'</b>' || '<b>'+$scope.simnut.description+'</b>').replace(/<br[\s]?[\/]?\>/gi, '\n').trim()).text(),
              'contnetPostfix': $scope.result ? ' 실행 결과입니다.' : ' 앱을 좋아합니다.',
              'name': $scope.userConnection.kakao ? $scope.userConnection.kakao.username : $scope.userInfo.name
            };
            
            var image = $scope.userConnection.kakao ? $scope.userConnection.kakao.thumbnail : null;
            data.storyPostText = ShareFunc.postText(data);
            NativeFunc.uploadStroryPost(data, image, '앱으로 가기', $scope.webInfo.currentPath, '');
          }
        };
  
        if($scope.isLogin()) {
          new LikeView($scope.simnut.id, $scope.userInfo.id).then(function(res){
            if(res.id) {
              $scope.like.light = true;
              $scope.like.id = res.id;
            }
          });
        } else {
          $scope.like.light = false;
        }
        
        $scope.likeToggle = function(){
          if(!$scope.isLogin()) {
            $scope.moveLogin();
            return false;
          }
  
          if($scope.like.id) {
            new LikeOff($scope.simnut.id, $scope.userInfo.id, $scope.like.id).then(function(res){
              if(res) {
                $scope.like.light = false;
                $scope.like.id = null;
              }
            });
          } else {
            new LikeOn($scope.simnut.id, $scope.userInfo.id).then(function(res){
              if(res) {
                $scope.like.light = true;
                $scope.like.id = res.insertId;
                if(window.android){
                  var data = {
                    'type': 'text',
                    'storyPostText': ($scope.userConnection.kakao ? $scope.userConnection.kakao.username : $scope.userInfo.name)+'님이 ['+$scope.simnut.title+'] 앱을 좋아 합니다.\n\n안드로이드 다운로드\n'+$scope.marketInfo.url
                  };
                  NativeFunc.uploadStroryPost(data, null, '앱으로 가기', $scope.webInfo.currentPath, '');
                }
              }
            });
          }
        };
      }
    ])
    .controller('WriteCtrl', ['$scope', 'SimnutSave', function($scope, SimnutSave){
      $scope.write = {
        'user_id': $scope.userInfo.id,
        'title': '',
        'description': '',
        'content': '',
        'variables': [{'value':''}],
        'is_anonymous':false
      };
      
      $scope.addVariables = function(){
        $scope.write.variables.push({'value':''});
      };
      
      $scope.simnutSave = function(){
        new SimnutSave($scope.write).then(function(res){
          if(res.insertId) {
            $scope.move('/simnut/'+res.insertId);
          } else {
            var tmp = [];
            for(var i in $scope.write.variables) {
              tmp.push({'value':$scope.write.variables[i]});
            }
            $scope.write.variables = tmp;
          }
        });
      };
    }])
    
    .controller('ShareCtrl', ['$scope', 'ShareFunc', function($scope, ShareFunc){
//chk: 그린라이트 이미지 임

      $scope.shareLink = function(type){
        var data = {
          'content': $(('<b>'+$scope.result+'</b>' || '<b>'+$scope.simnut.description+'</b>').replace(/<br[\s]?[\/]?\>/gi, '\n').trim()).text(),
          'currentImage': 'http://nut.gy/simnut/images/icon_512x512.png',
          'currentUrl': $scope.webInfo.currentUrl,
          'title': $scope.simnut.title,
          'marketUrl': $scope.marketInfo.url,
          'appId': $scope.marketInfo.appId
        };
        ShareFunc[type](data);
      };
    }]);
});
