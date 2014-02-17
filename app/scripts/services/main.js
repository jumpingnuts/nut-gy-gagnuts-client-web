define(['angular', 'angularResource', 'kakao'], function (angular, kakao) {
  'use strict';
  
  angular.module('mainServices', [ 'ngResource' ])
    .factory('Simnut', [ '$rootScope', '$resource', function($rootScope, $resource) {
      return $resource($rootScope.apiInfo.baseUrl+'/api/kakaoapp/app/:id');
    }])
    .factory('MultiSimnutLoader', [ 'Simnut', '$q', function(Simnut, $q) {
      return function(page, type, userId) {
        page = page?page:1;
        type = type?type:'trends';
        var limit = 20;
        var order = null;

        switch(type) {
          case 'trends':
            order = 'updated desc';
            break;
          case 'best':
            order = 'count_likes desc, updated desc';
            break;
          case 'new':
            order = 'created desc';
            break;
          case 'mine':
            order = 'created desc';
            break;
          default:
            order = 'created desc';
        }
        
        var param = {
          'offset':(page-1)*limit,
          'limit':limit,
          'order':order
        };

        if(type==='mine' && userId) {
          param.user_id = userId;
        }
        
        var delay = $q.defer();
        Simnut.query(param, function(res) {
          delay.resolve(res);
        }, function(res) {
          delay.reject(res);
        });
        return delay.promise;
      };
    }])
    .factory('SimnutLoader', [ 'Simnut', '$route', '$q', function(Simnut, $route, $q) {
      return function() {
        var delay = $q.defer();
        Simnut.get({ id : $route.current.params.simnutId }, function(res) {
          delay.resolve(res);
        }, function(res) {
          delay.reject(res);
        });
        return delay.promise;
      };
    }])
    
    .factory('SimnutSave', [ 'Simnut', '$q', function(Simnut, $q) {
      return function(data) {
        var tmp = [];
        for(var i in data.variables) {
          tmp.push(data.variables[i].value);
        }
        data.variables = tmp;
        var delay = $q.defer();
        Simnut.save(data, function(res) {
          delay.resolve(res);
        }, function(res) {
          delay.reject(res);
        });
        return delay.promise;
      };
    }])
    
    .factory('Like', [ '$rootScope', '$resource', function($rootScope, $resource) {
      return $resource($rootScope.apiInfo.baseUrl+'/api/kakaoapp/like/:like_id');
    }])
    .factory('LikeView', [ 'Like', '$q', function(Like, $q) {
      return function(simnutId, userId) {
        var delay = $q.defer();
        Like.get({ 'app_id' : simnutId, 'user_id' : userId}, function(res) {
          delay.resolve(res);
        }, function(res) {
          delay.reject(res);
        });
        return delay.promise;
      };
    }])
    .factory('LikeOn', [ 'Like', '$q', function(Like, $q) {
      return function(simnutId, userId) {
        var delay = $q.defer();
        Like.save({ 'app_id': simnutId, 'user_id': userId}, function(res) {
          delay.resolve(res);
        }, function(res) {
          delay.reject(res);
        });
        return delay.promise;
      };
    }])
    .factory('LikeOff', [ 'Like', '$q', function(Like, $q) {
      return function(simnutId, userId, likeId) {
        var delay = $q.defer();
        Like.delete({ 'app_id': simnutId, 'user_id': userId, 'like_id': likeId}, function(res) {
          delay.resolve(res);
        }, function(res) {
          delay.reject(res);
        });
        return delay.promise;
      };
    }])
    
    .factory('ShareFunc', function(){
      return {
        kakaoTalk: function(data){
          kakao.link('talk').send({
            msg : data.title+'\n\n'+data.content+'\n\n'+data.currentUrl,
            url : data.marketUrl,
            appid : data.appId,
            appver : '1.0',
            appname : '심심풀이 너츠',
            type : 'link'
          });
        },
        
        kakaoStory: function(data){
          kakao.link('story').send({
            post : '[심심풀이 너츠] '+data.title+'\n\n'+data.content+'\n\n'+data.currentUrl+'\n\n안드로이드 : '+data.marketUrl,
            appid : data.appId,
            appver : '1.0',
            appname : '심심풀이 너츠',
            urlinfo : JSON.stringify({
              title: data.title,
              desc: data.content.substring(0,80)+'...',
              imageurl:[data.currentImage],
              type:'app'
            })
          });
        },
  
        twitter: function(data){
          window.location.href = 'https://twitter.com/intent/tweet?'+
            'original_referer='+encodeURIComponent(data.currentUrl)+
            '&text='+encodeURIComponent('[심심풀이 너츠] '+data.title+'\n'+data.content.replace(/\n/gi, ' ').substring(0,60))+'\n\n'+
            '&url='+encodeURIComponent(data.marketUrl);
        },
  
        facebook: function(data){
          window.location.href = 'http://www.facebook.com/sharer.php?m2w&s=100'+
            '&p[url]='+encodeURIComponent(data.marketUrl)+
            '&p[images][0]='+encodeURIComponent(data.currentImage)+
            '&p[title]='+data.title+
            '&p[summary]='+data.content;
        },
        
        postText : function(data){
          return '[심심풀이 너츠] '+data.title+'\n\n'+data.content+'\n\n안드로이드 : '+data.marketUrl;
        }
      };
    });
});