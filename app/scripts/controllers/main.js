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
      'MultiContentLoader',
      'Content',
      function($scope, $routeParams, $window, MultiContentLoader, Content) {
        $scope.contents = [];
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
          new MultiContentLoader($scope.page, $scope.type, $scope.userInfo.id).then(function(res){
            if(res.length > 0) {
              for(var i in res) {
                if(res[i].items) {
                  res[i].items = angular.fromJson(res[i].items)[0];
                  res[i].items.name = res[i].items.name != undefined ? res[i].items.name.substring(0, 55) : '';
                }
              }
              $scope.contents = $scope.contents.concat(res);
              $scope.page++;
              $scope.isLoad = false;
            }
          });
        };
        $scope.listLoad();
        
        $scope.deleteContent = function($event){
          $scope.eventStop($event);
          if(confirm('삭제 하시겠습니까?')) {
            var contentId = $($event.currentTarget).attr('data-id');
            new Content.remove({ id:contentId }, function(res){
              if(res.affectedRows > 0) {
                for(var i in $scope.contents) {
                  if($scope.contents[i].id === parseInt(contentId)) {
                    $scope.contents.pop(i);
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
      '$sce',
      '$route',
      '$routeParams',
      'md5',
      'content',
      'LikeView',
      'LikeOn',
      'LikeOff',
      'ShareFunc',
      'NativeFunc',
      function($scope, $sce, $route, $routeParams, md5, content, LikeView, LikeOn, LikeOff, ShareFunc, NativeFunc){
        if(!content.id) { $scope.move('/list/trends'); }
      
        $scope.inputName = '';
        $scope.result = '';
        $scope.like = {
          'light' : false,
          'text' : {false: '꺼짐', true: '켜짐'},
          'id' : null
        };
        
        content.items = angular.fromJson(content.items);
        content.content = content.items[0].name;
        content.thumb = "";
        for(var j in content.items) {
          if(content.items[j].movie) {
            content.thumb += content.items[j].thumb+"|";
            content.items[j].movie = $sce.trustAsResourceUrl(content.items[j].movie);
          } else {
            content.thumb += content.items[j].image+"|";
          }
        }
        content.thumb = content.thumb.substring(0, content.thumb.lastIndexOf("|"));
        $scope.content = content;

//console.log($scope.content);

        if($scope.isLogin()) {
          new LikeView($scope.content.id, $scope.userInfo.id).then(function(res){
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
            new LikeOff($scope.content.id, $scope.userInfo.id, $scope.like.id).then(function(res){
              if(res) {
                $scope.like.light = false;
                $scope.like.id = null;
                $scope.content.vote_count--;
              }
            });
          } else {
            new LikeOn($scope.content.id, $scope.userInfo.id).then(function(res){
              if(res) {
                $scope.like.light = true;
                $scope.like.id = res.insertId;
                $scope.content.vote_count++;
                
                if(window.android){
                  var data = {
                    'appName': $scope.webInfo.title,
                    'content': $(('<b>'+$scope.content.content+'</b>').replace(/<br[\s]?[\/]?\>/gi, '\n').trim()).text(),
                    'title': $scope.content.name,
                    'marketUrl': $scope.marketInfo.url,
                    'currentUrl': $scope.webInfo.currentUrl,
                    'appId': $scope.marketInfo.appId
                  };
                  data.storyPostText = ShareFunc.postText(data);
                  
                  NativeFunc.uploadStroryPost(data, $scope.content.thumb, '앱으로 가기', $scope.webInfo.currentPath, '');
                }
              }
            });
          }
        };
      }
    ])
    .controller('WriteCtrl', ['$scope', 'ContentSave', function($scope, ContentSave){
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
      
      $scope.contentSave = function(){
        new ContentSave($scope.write).then(function(res){
          if(res.insertId) {
            $scope.move('/content/'+res.insertId);
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
          'appName': $scope.webInfo.title,
          'content': $(('<b>'+$scope.content.content+'</b>').replace(/<br[\s]?[\/]?\>/gi, '\n').trim()).text(),
          'currentImage': 'http://nut.gy/content/images/icon_512x512.png',
          'currentUrl': $scope.webInfo.currentUrl,
          'title': $scope.content.name,
          'marketUrl': $scope.marketInfo.url,
          'appId': $scope.marketInfo.appId
        };
        ShareFunc[type](data);
      };
    }]);
});
