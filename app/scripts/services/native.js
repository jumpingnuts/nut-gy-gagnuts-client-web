define(['angular'], function (angular) {
  'use strict';
  
  angular.module('nativeServices', [ 'ngResource' ])
    .factory('Noti', [ '$rootScope', '$resource', function($rootScope, $resource) {
      return $resource($rootScope.apiInfo.baseUrl+'/api/notification/regist');
    }])
    
    .factory('NativeFunc', ['Noti', function(Noti){
      return {
        'notiRegist': function(username, marketUrl){
          var self = this;
          var param = JSON.parse(window.android.getRegId());
          param.type = 'simnut';
          new Noti.save(param, function(res) {
            if(res.insertId > 0) {
              var data = {
                'type': 'text',
                'storyPostText': username+'님이 \'심심풀이너츠\'앱을 시작하셨습니다.\n\n안드로이드 다운로드\n'+marketUrl
              };
              self.uploadStroryPost(data, null, '앱으로 가기', '/list/trends', '');
            }
          });
        },
        'uploadStroryPost': function(data, img, title, href, callback){
          var vars = [];
          if(data.type === 'image') {
            var arr = data.content.split(' ');
            var temp = '';
            var tempLength = 0;
            for(var i in arr) {
              temp += arr[i] + ' ';
              tempLength += parseInt(arr[i].length)+1;
              if(tempLength > 15 || arr[i].charAt(arr[i].length - 1) === '.' || arr[i].charAt(arr[i].length - 1) === ',') {
                temp += '\n';
                tempLength = 0;
              }
            }
            
            vars = [
              {
                'type': 'image',
                'value': 'http://d3vxhqbnuvoxg0.cloudfront.net/img/kakaoapp/background.png',
                'x': 0,
                'y': 0
              },
              {
                'type': 'image',
                'value': img,
                'x': 10,
                'y': 10,
                'imageWidth': 110,
                'imageHeight': 110
              },
              {
                'type': 'text',
                'value': data.name+'님의',
                'align': 'left',
                'size': 35,
                'color': 'FFFFFF',
                'x': 130,
                'y': 84
              },
              {
                'type': 'text',
                'value': '['+data.title+']',
                'align': 'left',
                'size': 20,
                'color': 'FFFFFF',
                'x': 130,
                'y': 106
              },
              {
                'type': 'text',
                'value': data.contnetPostfix,
                'align': 'left',
                'size': 20,
                'color': 'FFFFFF',
                'x': 130,
                'y': 130
              },
              {
                'type': 'text',
                'value': temp,
                'align': 'center',
                'size': 25,
                'color': 'FFFFFF',
                'x': 256,
                'y': 285
              },
            ];
          }
          
          window.android.kakaoStoryUpload(
            data.storyPostText,
            data.type === 'image' ? JSON.stringify(vars) : img, //img url
            title,
            '#'+href,
            callback //callback $scope 테스트 필요
          );
        }
      };
    }]);
});